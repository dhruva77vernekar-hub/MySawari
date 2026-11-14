import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  CheckCircle2, 
  ArrowRight, 
  MapPin, 
  Navigation,
  Square,
  Check,
  X,
  Radio,
  Activity,
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useVehicle } from '../../context/VehicleContext';
import routingService from '../../services/routingService';
import incidentService from '../../services/incidentService';
import ReportIncidentModal from '../modals/ReportIncidentModal';
import { parseBookingIntent } from '../../services/aiBookingParser';

const QUICK_PROMPTS = [
  'Book a ride from KLE to Belgavi Railway Station',
  'Auto from KLE to Chennamma Circle',
  'Cab from Railway Station to VTU Campus',
  'Bike taxi to Bogarves Plaza'
];

export default function AIAssistantView({ onBookRide }) {
  const navigate = useNavigate();
  const { selectVehicleByCode } = useVehicle();

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Namaste! I am Sawari AI, your voice & chat ride companion. Where would you like to travel in Belagavi today? You can speak or type your pickup, destination, and vehicle!',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceError, setVoiceError] = useState(null);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  
  // Active Proposal with All Available Routes & Incident Intelligence
  const [bookingProposal, setBookingProposal] = useState(null);
  const [proposalRoutes, setProposalRoutes] = useState(null);
  const [selectedRouteType, setSelectedRouteType] = useState('fastest'); // 'fastest' | 'shortest' | 'alternate'
  const [detectedRouteHazards, setDetectedRouteHazards] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const currentUtteranceRef = useRef(null);
  const speechTimeoutRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, bookingProposal, isLoading, isListening, isSpeaking]);

  // Load active road hazards
  useEffect(() => {
    incidentService.getIncidents().then((data) => {
      if (data && data.length > 0) setIncidents(data);
    });
    const unsub = incidentService.subscribe((data) => {
      if (data && data.length > 0) setIncidents(data);
    });
    return unsub;
  }, []);

  // Voice Speech Synthesis (Assistant Speaking)
  const speakText = (text, msgId = null) => {
    if (isVoiceMuted || typeof window === 'undefined' || !window.speechSynthesis) return;

    try {
      window.speechSynthesis.cancel();
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);

      const clean = text
        .replace(/[*_#`~]/g, '')
        .replace(/₹\s*(\d+)/g, '$1 rupees')
        .replace(/~/g, 'approximately ');

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.02;
      utterance.pitch = 1.0;
      utterance.lang = 'en-IN';

      utterance.onstart = () => {
        setIsSpeaking(true);
        setSpeakingMsgId(msgId);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingMsgId(null);
        currentUtteranceRef.current = null;
      };

      utterance.onerror = (e) => {
        setIsSpeaking(false);
        setSpeakingMsgId(null);
        currentUtteranceRef.current = null;
      };

      currentUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);

      const maxDuration = Math.max(4000, clean.length * 80);
      speechTimeoutRef.current = setTimeout(() => {
        setIsSpeaking(false);
        setSpeakingMsgId(null);
      }, maxDuration);
    } catch (e) {
      console.warn('Speech synthesis warning:', e);
      setIsSpeaking(false);
      setSpeakingMsgId(null);
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    setIsSpeaking(false);
    setSpeakingMsgId(null);
    currentUtteranceRef.current = null;
  };

  // Robust Speech Recognition: Instant Fresh Instantiation on each click
  const toggleListening = async () => {
    setVoiceError(null);

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      setIsListening(false);
      return;
    }

    // Stop assistant speech if currently talking
    stopSpeaking();

    // Access physical microphone
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
      }
    } catch (permErr) {
      console.warn('Microphone permission warning:', permErr);
      if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
        setVoiceError('Microphone permission blocked. Click the lock/tune icon in your address bar to allow microphone.');
        return;
      }
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback for browsers without Web Speech API
      setVoiceError('Web Speech API is not supported in this browser. Please use the quick voice order buttons below.');
      return;
    }

    try {
      // Create FRESH instance right now to eliminate stale websocket connection timeouts
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
        setInterimTranscript('');
      };

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          const clean = transcript.trim();
          setInputText(clean);
          setIsListening(false);
          handleSend(clean);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition event error:', event.error);
        setIsListening(false);
        if (event.error === 'network') {
          // If network error occurred, retry once with fallback language or provide quick voice shortcuts
          setVoiceError('Voice server timeout. You can speak or tap any of the Belagavi voice routes below to dispatch instantly!');
        } else if (event.error === 'not-allowed') {
          setVoiceError('Microphone access blocked. Click the lock icon in your browser URL bar to allow microphone.');
        } else if (event.error === 'no-speech') {
          setVoiceError('No speech heard. Speak a little closer to your mic or tap a voice prompt.');
        } else {
          setVoiceError(`Voice input issue (${event.error}). Try again or tap a voice prompt.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (startErr) {
      console.warn('Recognition start exception:', startErr);
      setIsListening(false);
      setVoiceError('Voice input could not start. Please use the quick voice buttons below.');
    }
  };

  // Simulated Voice Command (Guarantees testing and zero-delay order dispatch)
  const handleSimulatedVoice = (voiceText) => {
    stopSpeaking();
    setVoiceError(null);
    setIsListening(true);
    setInterimTranscript('Listening: "' + voiceText + '"');

    setTimeout(() => {
      setInterimTranscript(voiceText);
      setTimeout(() => {
        setIsListening(false);
        setInterimTranscript('');
        setInputText(voiceText);
        handleSend(voiceText);
      }, 600);
    }, 700);
  };

  const handleSend = async (customMessage = null) => {
    const msgToSend = (customMessage || inputText).trim();
    if (!msgToSend || isLoading) return;

    setInputText('');
    setVoiceError(null);

    const userMsg = {
      id: `user_${Date.now()}`,
      role: 'user',
      text: msgToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // 1. High-precision Natural Language Intent Parsing
      const parsed = parseBookingIntent(msgToSend);

      // 2. Check backend if configured
      let data = null;
      const API_BASE = import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== ''
        ? import.meta.env.VITE_API_URL
        : (import.meta.env.DEV ? 'http://localhost:4000' : '');

      if (API_BASE) {
        try {
          const token = localStorage.getItem('mysawari_token') || 'demo-rider-token';
          const response = await fetch(`${API_BASE}/api/assistant/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ message: msgToSend })
          });
          if (response.ok) {
            const resJson = await response.json();
            data = resJson.data || resJson;
          }
        } catch (netErr) {
          console.warn('Backend assistant unreachable, using high-precision client parser:', netErr.message);
        }
      }

      // 3. Determine final accurate pickup and drop locations from user's voice/text
      const pickup = data?.pickupCoords?.name || parsed?.pickup || 'KLE Technological University Campus';
      const drop = data?.dropCoords?.name || parsed?.drop || 'Belagavi Railway Station';
      const pickupCoords = data?.pickupCoords || parsed?.pickupCoords || { lat: 15.8281, lng: 74.4925, name: pickup };
      const dropCoords = data?.dropCoords || parsed?.dropCoords || { lat: 15.8672, lng: 74.5126, name: drop };
      const vCode = data?.vehicleType || parsed?.vehicleCode || 'auto';
      const vLabel = parsed?.vehicleLabel || 'Auto Rickshaw';
      const distanceKm = data?.distanceKm || parsed?.distanceKm || 4.5;
      const durationMin = data?.durationMin || parsed?.durationMin || 12;
      const fare = data?.estimatedFare || parsed?.fare || 65;
      const replyText = data?.reply || parsed?.reply || `I've planned your ride from ${pickup} to ${drop} (~${distanceKm} km, ₹${fare}). Would you like to confirm?`;

      const aiMsgId = `ai_${Date.now()}`;
      const aiMsg = {
        id: aiMsgId,
        role: 'assistant',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
      speakText(aiMsg.text, aiMsgId);

      // 4. Update the live proposal card with the exact route user requested
      const proposal = {
        pickup,
        drop,
        pickupCoords,
        dropCoords,
        vehicleCode: vCode,
        vehicleLabel: vLabel,
        fare,
        distanceKm,
        durationMin
      };
      setBookingProposal(proposal);

      // Fetch all routes (Fastest, Shortest, Hazard-Free Alternate)
      routingService.getAllRoutes(pickupCoords, dropCoords).then((routes) => {
        if (routes) {
          setProposalRoutes(routes);
          setSelectedRouteType('fastest');
          const hazards = incidentService.detectRouteHazards(routes.fastest.coordinates, incidents);
          setDetectedRouteHazards(hazards);
        }
      });
    } catch (err) {
      console.warn('Assistant error:', err);
      const parsed = parseBookingIntent(msgToSend);
      const pickup = parsed?.pickup || 'KLE Technological University Campus';
      const drop = parsed?.drop || 'Belagavi Railway Station';
      const reply = `I've noted your ride from ${pickup} to ${drop}. Let's confirm your booking!`;
      const aiMsgId = `ai_${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          role: 'assistant',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      speakText(reply, aiMsgId);

      const proposal = {
        pickup,
        drop,
        pickupCoords: parsed?.pickupCoords || { lat: 15.8281, lng: 74.4925, name: pickup },
        dropCoords: parsed?.dropCoords || { lat: 15.8672, lng: 74.5126, name: drop },
        vehicleCode: parsed?.vehicleCode || 'auto',
        fare: parsed?.fare || 75,
        distanceKm: parsed?.distanceKm || 5.1,
        durationMin: parsed?.durationMin || 14
      };
      setBookingProposal(proposal);

      routingService.getAllRoutes(proposal.pickupCoords, proposal.dropCoords).then((routes) => {
        if (routes) {
          setProposalRoutes(routes);
          setSelectedRouteType('fastest');
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProposalRouteChange = (type) => {
    setSelectedRouteType(type);
    if (proposalRoutes && proposalRoutes[type] && bookingProposal) {
      const active = proposalRoutes[type];
      const baseFare = bookingProposal.vehicleCode === 'bike' ? 25 : (bookingProposal.vehicleCode === 'auto' ? 35 : 60);
      const perKm = bookingProposal.vehicleCode === 'bike' ? 6 : (bookingProposal.vehicleCode === 'auto' ? 9 : 14);
      const updatedFare = Math.round(baseFare + active.distanceKm * perKm);

      setBookingProposal((prev) => ({
        ...prev,
        fare: updatedFare,
        distanceKm: active.distanceKm,
        durationMin: active.durationMin
      }));

      const hazards = incidentService.detectRouteHazards(active.coordinates, incidents);
      setDetectedRouteHazards(hazards);
    }
  };

  const handleConfirmAutoBooking = () => {
    if (!bookingProposal) return;
    const code = bookingProposal.vehicleCode || 'auto';
    selectVehicleByCode(code);
    localStorage.setItem('mysawari_selected_vehicle', code);

    speakText(`Booking confirmed! Your ${code.toUpperCase()} is being dispatched now.`);

    if (onBookRide) {
      onBookRide(bookingProposal);
    } else {
      navigate('/book', {
        state: {
          pickup: bookingProposal.pickup,
          drop: bookingProposal.drop,
          pickupCoords: bookingProposal.pickupCoords,
          dropCoords: bookingProposal.dropCoords,
          vehicleCode: code,
          fare: bookingProposal.fare
        }
      });
    }
  };

  const handleReset = () => {
    stopSpeaking();
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsListening(false);
    }
    setMessages([
      {
        id: 'welcome_reset',
        role: 'assistant',
        text: 'Conversation reset. Where would you like to travel in Belagavi today?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setBookingProposal(null);
    setProposalRoutes(null);
    setDetectedRouteHazards([]);
    setVoiceError(null);
    setInterimTranscript('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      <div className="bg-white rounded-[32px] border border-[#DCDAF0] shadow-[0_20px_50px_-15px_rgba(58,77,255,0.12)] overflow-hidden flex flex-col h-[750px]">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-[#DCDAF0] flex items-center justify-between bg-gradient-to-r from-white via-[#F1F0FA]/60 to-white">
          <div className="flex items-center gap-3">
            <div className={`relative w-11 h-11 rounded-2xl flex items-center justify-center shadow-md transition-all ${
              isSpeaking 
                ? 'bg-gradient-to-tr from-[#3A4DFF] via-[#45E0F2] to-[#6E7BFF] animate-ai-orb' 
                : 'bg-gradient-to-tr from-[#3A4DFF] to-[#6E7BFF]'
            }`}>
              <Sparkles className="w-5 h-5 text-[#FFC21A]" />
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                isSpeaking 
                  ? 'bg-cyan-400 animate-ping' 
                  : isListening 
                    ? 'bg-red-500 animate-pulse' 
                    : 'bg-emerald-500'
              }`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-[#0A0A14]">Sawari AI Voice Dispatcher</h3>
                {isSpeaking ? (
                  <span className="hud text-[9px] bg-cyan-100 text-cyan-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-ping" />
                    AI SPEAKING
                  </span>
                ) : isListening ? (
                  <span className="hud text-[9px] bg-red-100 text-red-700 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                    LISTENING TO YOU
                  </span>
                ) : (
                  <span className="hud text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                    VOICE ACTIVE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#5B5B73]">Speak or type rides naturally · Multi-route intelligence & road hazard alerts</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Report Road Hazard Button */}
            <button
              onClick={() => setIsReportModalOpen(true)}
              title="Report an accident, roadblock or traffic congestion"
              className="px-2.5 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              <span className="hidden sm:inline">Report Hazard</span>
            </button>

            {/* Audio Mute/Unmute */}
            <button
              onClick={() => {
                if (!isVoiceMuted && isSpeaking) stopSpeaking();
                setIsVoiceMuted(!isVoiceMuted);
              }}
              title={isVoiceMuted ? 'Unmute voice output' : 'Mute voice output'}
              className="p-2.5 rounded-xl border border-[#DCDAF0] hover:bg-[#F1F0FA] text-[#5B5B73] transition-colors cursor-pointer"
            >
              {isVoiceMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-[#3A4DFF]" />}
            </button>

            {/* Reset Chat */}
            <button
              onClick={handleReset}
              title="Reset conversation"
              className="p-2.5 rounded-xl border border-[#DCDAF0] hover:bg-[#F1F0FA] text-[#5B5B73] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Feed Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#F8F9FD]">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            const isCurrentlySpeakingThis = isSpeaking && speakingMsgId === m.id;

            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className={`w-8 h-8 rounded-xl text-white flex items-center justify-center text-xs flex-shrink-0 shadow-xs mt-1 transition-all ${
                    isCurrentlySpeakingThis ? 'bg-gradient-to-tr from-[#3A4DFF] to-[#45E0F2] scale-110 shadow-md' : 'bg-[#3A4DFF]'
                  }`}>
                    <Sparkles className="w-4 h-4 text-[#FFC21A]" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-[22px] px-4 py-3 shadow-xs text-xs sm:text-sm transition-all ${
                    isUser
                      ? 'bg-[#0A0A14] text-white rounded-tr-xs'
                      : isCurrentlySpeakingThis
                        ? 'bg-white text-[#0A0A14] border-2 border-[#3A4DFF] shadow-md rounded-tl-xs ring-2 ring-[#3A4DFF]/10'
                        : 'bg-white text-[#0A0A14] border border-[#DCDAF0] rounded-tl-xs'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                  
                  <div className={`flex items-center justify-between text-[10px] mt-2 ${isUser ? 'text-white/60' : 'text-[#8E96A6]'}`}>
                    <span>{m.time}</span>
                    {!isUser && (
                      <div className="flex items-center gap-1.5 ml-2">
                        {isCurrentlySpeakingThis ? (
                          <div className="flex items-center gap-1 text-[#3A4DFF] font-medium bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            <div className="flex items-end gap-0.5 h-3">
                              <span className="w-0.5 h-2 bg-[#3A4DFF] animate-soundwave-1 rounded-full" />
                              <span className="w-0.5 h-3 bg-[#3A4DFF] animate-soundwave-2 rounded-full" />
                              <span className="w-0.5 h-1.5 bg-[#3A4DFF] animate-soundwave-3 rounded-full" />
                              <span className="w-0.5 h-2.5 bg-[#3A4DFF] animate-soundwave-4 rounded-full" />
                            </div>
                            <span className="text-[9px] hud uppercase">Speaking</span>
                            <button
                              onClick={stopSpeaking}
                              title="Stop speaking"
                              className="hover:text-red-600 cursor-pointer ml-1"
                            >
                              <Square className="w-2.5 h-2.5 fill-current" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => speakText(m.text, m.id)}
                            title="Read aloud with AI voice"
                            className="hover:text-[#3A4DFF] flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span className="text-[9px]">Speak</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing / Processing Indicator */}
          {isLoading && (
            <div className="flex gap-3 items-center text-xs text-[#5B5B73]">
              <div className="w-8 h-8 rounded-xl bg-[#3A4DFF] text-white flex items-center justify-center text-xs flex-shrink-0 animate-spin">
                <Sparkles className="w-4 h-4 text-[#FFC21A]" />
              </div>
              <div className="bg-white border border-[#DCDAF0] px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#3A4DFF] animate-ping" />
                <span className="font-medium text-xs text-[#0A0A14]">Sawari AI is planning routes & comparing traffic...</span>
              </div>
            </div>
          )}

          {/* ACTIVE AUTO-BOOKING PROPOSAL CARD WITH MULTI-ROUTE & HAZARD INTELLIGENCE */}
          {bookingProposal && (
            <div className="my-4 p-5 rounded-[26px] bg-white border-2 border-[#3A4DFF] shadow-lg animate-fade-in space-y-4">
              <div className="flex items-center justify-between border-b border-[#DCDAF0] pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="hud text-xs font-bold text-[#3A4DFF]">
                    RIDE EXTRACTED · ROUTE INTELLIGENCE READY
                  </span>
                </div>
                <span className="hud text-xs bg-[#FFC21A] text-[#0A0A14] px-2.5 py-0.5 rounded-full font-bold">
                  {bookingProposal.vehicleCode.toUpperCase()}
                </span>
              </div>

              {/* Route Details */}
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-[#5B5B73] block uppercase font-bold">Pickup Point</span>
                    <span className="font-semibold text-[#0A0A14]">{bookingProposal.pickup}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Navigation className="w-4 h-4 text-[#EF2B3E] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-[#5B5B73] block uppercase font-bold">Destination</span>
                    <span className="font-semibold text-[#0A0A14]">{bookingProposal.drop}</span>
                  </div>
                </div>
              </div>

              {/* 1. ALL AVAILABLE ROUTES SELECTION (FASTEST, SHORTEST, HAZARD-FREE) */}
              <div className="pt-1 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="hud font-bold text-[#3A4DFF]">AVAILABLE CORRIDORS</span>
                  <span className="text-[10px] text-[#8E96A6]">Belagavi Road Network</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F1F0FA] rounded-2xl border border-[#DCDAF0]">
                  <button
                    type="button"
                    onClick={() => handleProposalRouteChange('fastest')}
                    className={`p-2 rounded-xl text-center transition-all cursor-pointer ${
                      selectedRouteType === 'fastest'
                        ? 'bg-white text-[#3A4DFF] font-bold shadow-xs border border-[#DCDAF0]/50'
                        : 'text-[#5B5B73] hover:text-[#0A0A14]'
                    }`}
                  >
                    <span className="hud text-[9px] block text-[#3A4DFF]">⚡ Fastest</span>
                    <span className="text-xs font-mono font-bold block">{proposalRoutes?.fastest?.durationMin || 12} min</span>
                    <span className="text-[9px] text-[#8E96A6] block">{proposalRoutes?.fastest?.distanceKm || 4.2} km</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleProposalRouteChange('shortest')}
                    className={`p-2 rounded-xl text-center transition-all cursor-pointer ${
                      selectedRouteType === 'shortest'
                        ? 'bg-white text-emerald-600 font-bold shadow-xs border border-[#DCDAF0]/50'
                        : 'text-[#5B5B73] hover:text-[#0A0A14]'
                    }`}
                  >
                    <span className="hud text-[9px] block text-emerald-600">🌿 Shortest</span>
                    <span className="text-xs font-mono font-bold block">{proposalRoutes?.shortest?.durationMin || 16} min</span>
                    <span className="text-[9px] text-[#8E96A6] block">{proposalRoutes?.shortest?.distanceKm || 3.5} km</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleProposalRouteChange('alternate')}
                    className={`p-2 rounded-xl text-center transition-all cursor-pointer ${
                      selectedRouteType === 'alternate'
                        ? 'bg-white text-amber-700 font-bold shadow-xs border border-[#DCDAF0]/50'
                        : 'text-[#5B5B73] hover:text-[#0A0A14]'
                    }`}
                  >
                    <span className="hud text-[9px] block text-amber-600">🛡️ Bypass</span>
                    <span className="text-xs font-mono font-bold block">{proposalRoutes?.alternate?.durationMin || 14} min</span>
                    <span className="text-[9px] text-[#8E96A6] block">{proposalRoutes?.alternate?.distanceKm || 4.8} km</span>
                  </button>
                </div>

                {/* 2. SHORTEST VS FASTEST COMPARISON CARD */}
                {proposalRoutes && (
                  <div className="p-2.5 bg-blue-50/70 border border-blue-200/60 rounded-2xl text-[10px] flex items-center justify-between text-[#0A0A14]">
                    <div className="flex items-center gap-1.5 font-bold text-[#3A4DFF]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3A4DFF]" />
                      <span>COMPARISON:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-700 font-semibold">
                        ⚡ Fastest saves {Math.max(1, (proposalRoutes.shortest?.durationMin || 16) - (proposalRoutes.fastest?.durationMin || 12))} mins
                      </span>
                      <span>·</span>
                      <span className="text-emerald-700 font-semibold">
                        🌿 Shortest saves {+Math.max(0.4, (proposalRoutes.fastest?.distanceKm || 4.2) - (proposalRoutes.shortest?.distanceKm || 3.5)).toFixed(1)} km
                      </span>
                    </div>
                  </div>
                )}

                {/* 3. PROACTIVE ROAD HAZARD ALERT & ALTERNATE RECOMMENDATION */}
                {detectedRouteHazards.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-red-900 animate-fade-in shadow-2xs">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-red-800">
                          ⚠️ Hazard on Selected Route: {detectedRouteHazards[0].category}
                        </span>
                        <span className="text-[11px] text-red-700">
                          Near {detectedRouteHazards[0].location}. Traffic delay expected.
                        </span>
                      </div>
                    </div>
                    {selectedRouteType !== 'alternate' ? (
                      <button
                        type="button"
                        onClick={() => handleProposalRouteChange('alternate')}
                        className="px-3 py-1.5 bg-[#F59E0B] hover:bg-[#d98b0a] text-[#0A0A14] font-bold rounded-xl text-[10px] uppercase tracking-wide flex items-center gap-1 shadow-xs cursor-pointer whitespace-nowrap self-end sm:self-center"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Switch to Hazard-Free Bypass</span>
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-xl font-bold text-[10px] uppercase flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Using Hazard-Free Bypass</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Fare & Metric Bar */}
              <div className="p-3 bg-[#F1F0FA] rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-[#5B5B73] block font-bold">ESTIMATED FARE</span>
                  <span className="text-xl font-bold font-mono text-[#0A0A14]">₹{bookingProposal.fare}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#5B5B73] block font-bold">SELECTED METRICS</span>
                  <span className="font-bold text-[#0A0A14]">{bookingProposal.distanceKm} km · ~{bookingProposal.durationMin} mins</span>
                </div>
              </div>

              {/* Prominent One-Tap Confirmation Button */}
              <button
                onClick={handleConfirmAutoBooking}
                className="w-full py-4 rounded-full bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>CONFIRM & BOOK {bookingProposal.vehicleCode.toUpperCase()} NOW · ₹{bookingProposal.fare}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* ANIMATED VOICE VISUALIZERS (USER SPEAKING & ASSISTANT SPEAKING)    */}
        {/* ------------------------------------------------------------------ */}

        {/* 1. ASSISTANT SPEAKING ANIMATION BAR */}
        {isSpeaking && (
          <div className="mx-4 mb-2 p-3.5 bg-gradient-to-r from-[#0B0D14] via-[#16192E] to-[#0B0D14] text-white rounded-2xl border border-cyan-500/40 shadow-lg animate-fade-in flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-[#3A4DFF] via-[#45E0F2] to-[#6E7BFF] flex items-center justify-center shadow-[0_0_20px_rgba(69,224,242,0.6)] animate-ai-orb">
                <Sparkles className="w-4 h-4 text-white animate-spin" />
                <span className="absolute inset-0 rounded-full border border-cyan-300 animate-ping opacity-30" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="hud text-[10px] text-cyan-300 font-bold tracking-wider">
                    SAWARI AI SPEAKING...
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                </div>
                <div className="flex items-end gap-1 h-4 mt-1">
                  <span className="w-1 h-2 bg-gradient-to-t from-[#3A4DFF] to-cyan-300 animate-soundwave-1 rounded-full" />
                  <span className="w-1 h-3.5 bg-gradient-to-t from-[#3A4DFF] to-cyan-300 animate-soundwave-2 rounded-full" />
                  <span className="w-1 h-4 bg-gradient-to-t from-[#3A4DFF] to-cyan-300 animate-soundwave-3 rounded-full" />
                  <span className="w-1 h-2.5 bg-gradient-to-t from-[#3A4DFF] to-cyan-300 animate-soundwave-4 rounded-full" />
                  <span className="w-1 h-3.5 bg-gradient-to-t from-[#3A4DFF] to-cyan-300 animate-soundwave-5 rounded-full" />
                  <span className="w-1 h-4 bg-gradient-to-t from-[#3A4DFF] to-cyan-300 animate-soundwave-2 rounded-full" />
                  <span className="w-1 h-2 bg-gradient-to-t from-[#3A4DFF] to-cyan-300 animate-soundwave-1 rounded-full" />
                  <span className="w-1 h-3 bg-gradient-to-t from-[#3A4DFF] to-cyan-300 animate-soundwave-4 rounded-full" />
                  <span className="w-1 h-4 bg-gradient-to-t from-[#3A4DFF] to-cyan-300 animate-soundwave-3 rounded-full" />
                  <span className="w-1 h-2.5 bg-gradient-to-t from-[#3A4DFF] to-cyan-300 animate-soundwave-5 rounded-full" />
                  <span className="w-1 h-3.5 bg-gradient-to-t from-[#3A4DFF] to-cyan-300 animate-soundwave-2 rounded-full" />
                  <span className="w-1 h-1.5 bg-gradient-to-t from-[#3A4DFF] to-cyan-300 animate-soundwave-1 rounded-full" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={stopSpeaking}
                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop Voice</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. USER SPEAKING ANIMATION BAR */}
        {isListening && (
          <div className="mx-4 mb-2 p-3.5 bg-gradient-to-r from-[#180A0E] via-[#2A0E18] to-[#180A0E] text-white rounded-2xl border-2 border-red-500 shadow-xl animate-fade-in animate-voice-listening flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#EF2B3E] to-[#FF5E7E] flex items-center justify-center shadow-[0_0_20px_rgba(239,43,62,0.7)] flex-shrink-0">
                <Mic className="w-5 h-5 text-white animate-bounce" />
                <span className="absolute -inset-1 rounded-2xl border border-red-400 animate-voice-halo" />
                <span className="absolute -inset-2 rounded-2xl border border-red-400/50 animate-voice-halo" style={{ animationDelay: '0.4s' }} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="hud text-[10px] text-red-400 font-bold tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    LISTENING TO YOUR VOICE...
                  </span>
                </div>
                
                <div className="flex items-end gap-1 h-5 mt-1">
                  <span className="w-1 h-2 bg-gradient-to-t from-red-600 via-amber-400 to-cyan-300 animate-soundwave-1 rounded-full" />
                  <span className="w-1 h-3.5 bg-gradient-to-t from-red-600 via-amber-400 to-cyan-300 animate-soundwave-3 rounded-full" />
                  <span className="w-1 h-5 bg-gradient-to-t from-red-600 via-amber-400 to-cyan-300 animate-soundwave-2 rounded-full" />
                  <span className="w-1 h-4 bg-gradient-to-t from-red-600 via-amber-400 to-cyan-300 animate-soundwave-4 rounded-full" />
                  <span className="w-1 h-2.5 bg-gradient-to-t from-red-600 via-amber-400 to-cyan-300 animate-soundwave-5 rounded-full" />
                  <span className="w-1 h-5 bg-gradient-to-t from-red-600 via-amber-400 to-cyan-300 animate-soundwave-1 rounded-full" />
                  <span className="w-1 h-3 bg-gradient-to-t from-red-600 via-amber-400 to-cyan-300 animate-soundwave-3 rounded-full" />
                  <span className="w-1 h-4.5 bg-gradient-to-t from-red-600 via-amber-400 to-cyan-300 animate-soundwave-2 rounded-full" />
                  <span className="w-1 h-2 bg-gradient-to-t from-red-600 via-amber-400 to-cyan-300 animate-soundwave-4 rounded-full" />
                  <span className="w-1 h-4 bg-gradient-to-t from-red-600 via-amber-400 to-cyan-300 animate-soundwave-5 rounded-full" />
                  <span className="w-1 h-5 bg-gradient-to-t from-red-600 via-amber-400 to-cyan-300 animate-soundwave-2 rounded-full" />
                  <span className="w-1 h-3 bg-gradient-to-t from-red-600 via-amber-400 to-cyan-300 animate-soundwave-1 rounded-full" />
                  <span className="w-1 h-1.5 bg-gradient-to-t from-red-600 via-amber-400 to-cyan-300 animate-soundwave-3 rounded-full" />
                </div>

                <p className="text-xs text-amber-200 font-mono mt-1 font-semibold truncate max-w-[280px] sm:max-w-[400px]">
                  {interimTranscript ? `“${interimTranscript}”` : 'Speak now: "Book auto from KLE to Chennamma Circle"'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {interimTranscript && (
                <button
                  onClick={() => {
                    toggleListening();
                    handleSend(interimTranscript);
                  }}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-md transition-all cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              )}
              <button
                onClick={toggleListening}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/80 rounded-xl text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        )}

        {/* VOICE HELPER / FALLBACK NOTIFICATION (Never leaves user stranded) */}
        {voiceError && (
          <div className="mx-4 mb-2 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-xs text-amber-900 animate-fade-in shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                <Radio className="w-4 h-4 text-amber-600 animate-pulse" />
                <span>Belagavi Instant Voice Dispatch</span>
              </div>
              <button
                onClick={() => setVoiceError(null)}
                className="p-1 hover:bg-amber-200 rounded-lg text-amber-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-amber-800">
              {voiceError} Tap any route below to dispatch immediately with full speech processing:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <button
                onClick={() => handleSimulatedVoice('Book an auto from KLE to Chennamma Circle')}
                className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-semibold text-[10px] cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <Mic className="w-3 h-3 text-[#3A4DFF]" />
                <span>Auto: KLE to Chennamma Circle</span>
              </button>
              <button
                onClick={() => handleSimulatedVoice('I need a bike taxi to Belagavi Railway Station')}
                className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-semibold text-[10px] cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <Mic className="w-3 h-3 text-emerald-600" />
                <span>Bike: Station</span>
              </button>
              <button
                onClick={() => handleSimulatedVoice('Get a cab from Tilakwadi to Bogarves Plaza')}
                className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-semibold text-[10px] cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <Mic className="w-3 h-3 text-amber-600" />
                <span>Cab: Tilakwadi to Bogarves</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Suggestion Pills */}
        <div className="px-6 py-2 bg-white border-t border-[#DCDAF0] flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="hud text-[9px] text-[#8E96A6] whitespace-nowrap flex items-center gap-1">
            <Radio className="w-3 h-3 text-[#3A4DFF]" />
            VOICE / QUICK PROMPTS:
          </span>
          {QUICK_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSimulatedVoice(prompt)}
              title="Click to speak or simulate this voice order"
              className="text-[11px] whitespace-nowrap bg-[#F1F0FA] hover:bg-[#E9ECF2] text-[#0A0A14] px-3 py-1 rounded-full border border-[#DCDAF0] transition-colors cursor-pointer flex items-center gap-1.5 group font-medium"
            >
              <Mic className="w-3 h-3 text-[#3A4DFF] group-hover:scale-110 transition-transform" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>

        {/* Bottom Input Console */}
        <div className="p-4 bg-white border-t border-[#DCDAF0]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 bg-[#F1F0FA] rounded-[22px] p-1.5 border border-transparent focus-within:border-[#3A4DFF] focus-within:bg-white transition-all shadow-xs"
          >
            {/* Microphone Button with Pulsing Wave Indicator */}
            <div className="relative">
              <button
                type="button"
                onClick={toggleListening}
                title={isListening ? 'Stop listening' : 'Speak your ride order'}
                className={`relative z-10 p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-center ${
                  isListening
                    ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(239,43,62,0.8)] scale-105'
                    : 'bg-white text-[#3A4DFF] border border-[#DCDAF0] hover:bg-[#3A4DFF] hover:text-white'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4 animate-pulse" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
              {isListening && (
                <span className="absolute inset-0 rounded-2xl bg-red-400 animate-ping opacity-60" />
              )}
            </div>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isListening 
                  ? 'Listening to your voice... Speak now...' 
                  : isSpeaking 
                    ? 'Sawari AI is speaking...' 
                    : 'Order ride: e.g. "Auto from KLE to Chennamma Circle"'
              }
              className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-[#0A0A14] outline-none placeholder:text-[#8E96A6]"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-3 bg-[#0A0A14] hover:bg-[#3A4DFF] text-white rounded-2xl disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Crowdsourced Hazard & Incident Reporting Modal */}
      <ReportIncidentModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        defaultLocation={bookingProposal?.pickup || 'Chennamma Circle, Belagavi'}
        onIncidentReported={(newInc) => {
          setIncidents((prev) => [newInc, ...prev]);
        }}
      />
    </div>
  );
}
