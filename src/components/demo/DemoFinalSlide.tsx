import React from 'react';
import { Rocket, CheckCircle2, ArrowRight, X } from 'lucide-react';

interface DemoFinalSlideProps {
  onClose: () => void;
}

export const DemoFinalSlide: React.FC<DemoFinalSlideProps> = ({ onClose }) => {
  const benefits = [
    'Connect your Google Drive in minutes',
    'AI that understands your business context',
    'Team collaboration with built-in AI',
    'Automated reports delivered to your inbox',
    'No credit card required to start',
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="relative mb-6">
        <div className="text-7xl">🚀</div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-6 bg-gradient-to-r from-orange-500/20 via-pink-500/20 to-blue-500/20 rounded-full blur-lg" />
      </div>

      <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
        Ready to Launch?
      </h2>

      <p className="text-lg text-gray-400 max-w-lg mb-8">
        Join teams using AI Rocket to transform how they work with AI and data.
      </p>

      <div className="grid gap-3 mb-8 text-left max-w-md">
        {benefits.map((benefit) => (
          <div key={benefit} className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="text-gray-300">{benefit}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-105"
        >
          <Rocket className="w-5 h-5" />
          Create Free Account
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={onClose}
          className="flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
          Close
        </button>
      </div>

      <p className="mt-8 text-sm text-gray-500">
        Setup takes less than 15 minutes
      </p>
    </div>
  );
};
