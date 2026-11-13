import React from 'react';

export default function App() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#F1F0FA] text-[#0A0A14]">
      <div className="max-w-xl w-full bg-white rounded-[28px] p-8 shadow-[0_20px_60px_-20px_rgba(58,77,255,0.25)] border border-[#DCDAF0] text-center space-y-4">
        <span className="hud px-3 py-1 rounded-full bg-[#E9ECF2] text-[#3A4DFF] font-semibold">
          SYSTEM ACTIVE · BELAGAVI 15.8497, 74.4977
        </span>
        <h1 className="text-4xl font-semibold tracking-[-0.03em] text-[#0A0A14]">
          MySawari / RideMorph
        </h1>
        <p className="text-[#5B5B73] text-base">
          One tap. Any ride. Monorepo initialized successfully in your custom workspace.
        </p>
        <div className="pt-4 flex items-center justify-center gap-3">
          <a
            href="#explore"
            className="px-6 py-3 bg-[#0A0A14] hover:bg-[#3A4DFF] transition-colors text-white font-medium rounded-full text-sm inline-flex items-center gap-2"
          >
            Explore Blueprint <span>&rarr;</span>
          </a>
        </div>
      </div>
    </main>
  );
}
