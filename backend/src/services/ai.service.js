import { z } from 'zod';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

const assistantResultSchema = z.object({
  reply: z.string().min(1).max(1200),
  intent: z.enum(['book_ride', 'fare_question', 'ride_status', 'general', 'unknown']).default('unknown'),
  pickupText: z.string().max(200).nullable().default(null),
  dropText: z.string().max(200).nullable().default(null),
  vehicleType: z.enum(['bike', 'scooter', 'car']).nullable().default(null),
  passengerCount: z.number().int().min(1).max(4).default(1),
  requiresConfirmation: z.boolean().default(true)
});

function parseModelJson(content) {
  const cleaned = String(content || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('Model did not return a JSON object.');
  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function bookingAssistant({ message, context = {} }) {
  if (!env.NVIDIA_API_KEY || !env.NVIDIA_MODEL) {
    return {
      reply: 'The MySawari AI assistant is not configured yet. You can still book manually using the pickup, destination and vehicle fields.',
      intent: 'unknown', pickupText: null, dropText: null, vehicleType: null,
      passengerCount: 1, requiresConfirmation: true, providerConfigured: false
    };
  }

  const response = await fetch(`${env.NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.NVIDIA_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: env.NVIDIA_MODEL,
      temperature: 0.1,
      max_tokens: 600,
      messages: [
        {
          role: 'system',
          content: 'You are MySawari booking-intent parser. Return ONLY one JSON object with keys reply, intent, pickupText, dropText, vehicleType, passengerCount, requiresConfirmation. intent must be book_ride, fare_question, ride_status, general, or unknown. vehicleType must be bike, scooter, car, or null. pickupText and dropText must be literal places stated by the user or null. Never invent a place, coordinate, fare, driver, booking, or ride status. Always set requiresConfirmation=true. Never claim a ride is booked. Do not ask for payment credentials.'
        },
        { role: 'user', content: JSON.stringify({ message, context }) }
      ]
    }),
    signal: AbortSignal.timeout(20000)
  });

  if (!response.ok) throw new AppError(502, 'AI_PROVIDER_ERROR', `NVIDIA provider returned HTTP ${response.status}.`);
  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  let parsed;
  try { parsed = assistantResultSchema.parse(parseModelJson(content)); }
  catch { throw new AppError(502, 'AI_INVALID_RESPONSE', 'The AI provider returned an invalid booking-assistant response.'); }
  return { ...parsed, model: env.NVIDIA_MODEL, providerConfigured: true, requiresConfirmation: true };
}
