import React, { useState } from "react";

export default function Home() {
  const [hovered, setHovered] = useState(false);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-teal-50 flex flex-col items-center justify-center px-4 py-20">
      <div className="animate-fade-in-up text-center max-w-2xl">
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6 tracking-tight">
          Soulspect
        </h1>
        <p className="text-xl text-gray-700 mb-8">
          Discover the clarity within. Soulspect helps you explore your inner world
          through intuitive design and thoughtful technology.
        </p>
        <button
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={`px-8 py-3 rounded-full text-white font-semibold text-base transition-all duration-300 shadow-lg transform ${
            hovered ? "bg-teal-600 scale-105" : "bg-teal-500"
          }`}
        >
          Join the Waitlist
        </button>
      </div>

      <div className="mt-16 w-full max-w-5xl h-64 bg-white/30 backdrop-blur-lg rounded-xl border border-teal-100 shadow-inner p-6 flex items-center justify-center animate-slide-up">
        <p className="text-gray-600 text-sm text-center">
          Soulspect is an early-stage platform blending design, AI, and mental wellness.
          We're currently in closed beta.
        </p>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        .animate-slide-up {
          animation: fade-in-up 0.9s ease-out forwards;
        }
      `}</style>
    </main>
  );
}
