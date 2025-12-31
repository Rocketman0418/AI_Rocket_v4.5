import React from 'react';
import { Rocket, Brain, BarChart3, Users } from 'lucide-react';

interface DemoWelcomeSlideProps {
  onClose: () => void;
}

export const DemoWelcomeSlide: React.FC<DemoWelcomeSlideProps> = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="relative mb-8">
        <div className="text-8xl animate-bounce">🚀</div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-orange-500/20 rounded-full blur-md" />
      </div>

      <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
        Welcome to AI Rocket
      </h1>

      <p className="text-xl text-blue-400 font-medium mb-6">
        AI for Work: Solved
      </p>

      <p className="text-gray-400 max-w-xl mb-8">
        Experience how AI Rocket + Astra Intelligence helps teams like yours harness the power of AI with your own data.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl">
        {[
          { icon: Brain, label: 'AI Intelligence', color: 'blue' },
          { icon: BarChart3, label: 'Smart Reports', color: 'emerald' },
          { icon: Users, label: 'Team Collaboration', color: 'orange' },
          { icon: Rocket, label: 'Launch Ready', color: 'pink' },
        ].map(({ icon: Icon, label, color }) => (
          <div
            key={label}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl bg-${color}-500/10 border border-${color}-500/20`}
          >
            <Icon className={`w-6 h-6 text-${color}-400`} />
            <span className="text-sm text-gray-300">{label}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-2 text-sm text-gray-500">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Swipe or use arrows to explore</span>
      </div>
    </div>
  );
};
