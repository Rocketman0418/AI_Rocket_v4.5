import React from 'react';
import { UserCircle, Bot, BookOpen, LayoutDashboard, Sparkles, Clock } from 'lucide-react';
import { DEMO_COMING_SOON } from '../../data/demoData';

interface DemoComingSoonSlideProps {
  onClose: () => void;
}

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  UserCircle,
  Bot,
  BookOpen,
  LayoutDashboard,
};

const colorVariants = [
  { bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: 'text-blue-400' },
  { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'text-emerald-400' },
  { bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: 'text-orange-400' },
  { bg: 'bg-pink-500/10', border: 'border-pink-500/20', icon: 'text-pink-400' },
];

export const DemoComingSoonSlide: React.FC<DemoComingSoonSlideProps> = () => {
  return (
    <div className="p-5 lg:p-6 flex flex-col h-full">
      <div className="text-center mb-4">
        <span className="inline-block px-3 py-1 text-xs bg-pink-500/20 text-pink-400 rounded-full mb-2 flex items-center gap-1 mx-auto w-fit">
          <Sparkles className="w-3 h-3" />
          Roadmap
        </span>
        <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
          Coming Soon
        </h2>
        <p className="text-sm text-gray-400">
          Exciting features on our roadmap
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-2 gap-4 flex-1">
        {DEMO_COMING_SOON.map((feature, index) => {
          const Icon = iconMap[feature.icon];
          const colors = colorVariants[index % colorVariants.length];

          return (
            <div
              key={feature.title}
              className={`${colors.bg} border ${colors.border} rounded-2xl p-5 relative overflow-hidden`}
            >
              <div className="absolute top-3 right-3">
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-900/50 rounded-full text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>Soon</span>
                </div>
              </div>

              <div className={`w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${colors.icon}`} />
              </div>

              <h3 className="text-base font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-4">
        <p className="text-sm text-gray-500">
          Have a feature request? Let us know after you sign up!
        </p>
      </div>
    </div>
  );
};
