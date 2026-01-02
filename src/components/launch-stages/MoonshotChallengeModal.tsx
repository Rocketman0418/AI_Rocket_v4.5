import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Rocket, Trophy, Users, Zap, Calendar, Target, Gift, ArrowRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MoonshotChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CarouselSlide {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  iconBg: string;
  content: React.ReactNode;
}

export const MoonshotChallengeModal: React.FC<MoonshotChallengeModalProps> = ({ isOpen, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const slides: CarouselSlide[] = [
    {
      id: 'welcome',
      title: '$5M AI Moonshot Challenge',
      subtitle: 'You\'re Automatically Entered!',
      icon: Rocket,
      iconBg: 'from-orange-500 to-amber-500',
      content: (
        <div className="space-y-4">
          <p className="text-gray-300 text-center">
            As an AI Rocket user, you're automatically part of the <span className="text-orange-400 font-semibold">$5M Moonshot Challenge</span>!
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: '$5M', label: 'Prize Pool' },
              { value: '300', label: 'Teams' },
              { value: '90', label: 'Days' },
              { value: '10', label: 'Winners' },
            ].map(stat => (
              <div key={stat.label} className="bg-gray-800/50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">{stat.value}</div>
                <div className="text-xs text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
            <p className="text-sm text-orange-300 text-center">
              Simply use AI Rocket during the challenge period. Your activity is automatically tracked!
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'how_it_works',
      title: 'How It Works',
      icon: Target,
      iconBg: 'from-blue-500 to-cyan-500',
      content: (
        <div className="space-y-3">
          <div className="flex items-start gap-3 bg-gray-800/50 rounded-lg p-3">
            <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-orange-400 font-bold text-sm">1</span>
            </div>
            <div>
              <h4 className="text-white font-medium text-sm">Use AI Rocket</h4>
              <p className="text-gray-400 text-xs">Your team's AI usage is automatically tracked by Astra Intelligence</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-gray-800/50 rounded-lg p-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-400 font-bold text-sm">2</span>
            </div>
            <div>
              <h4 className="text-white font-medium text-sm">Build Your Score</h4>
              <p className="text-gray-400 text-xs">Transform your business using AI across Run, Build, and Grow dimensions</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-gray-800/50 rounded-lg p-3">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-emerald-400 font-bold text-sm">3</span>
            </div>
            <div>
              <h4 className="text-white font-medium text-sm">Submit for Prizes</h4>
              <p className="text-gray-400 text-xs">During April 6-10, submit your Prize Application to compete for equity prizes</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'prizes',
      title: 'Prize Structure',
      icon: Trophy,
      iconBg: 'from-yellow-500 to-orange-500',
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-2 text-center">
              <div className="text-lg">🥇</div>
              <div className="text-sm font-bold text-yellow-400">$2M</div>
              <div className="text-xs text-gray-400">1st Place</div>
            </div>
            <div className="bg-gradient-to-br from-gray-400/20 to-gray-500/20 border border-gray-500/30 rounded-lg p-2 text-center">
              <div className="text-lg">🥈</div>
              <div className="text-sm font-bold text-gray-300">$1M</div>
              <div className="text-xs text-gray-400">2nd Place</div>
            </div>
            <div className="bg-gradient-to-br from-amber-600/20 to-amber-700/20 border border-amber-600/30 rounded-lg p-2 text-center">
              <div className="text-lg">🥉</div>
              <div className="text-sm font-bold text-amber-500">$600K</div>
              <div className="text-xs text-gray-400">3rd Place</div>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-sm text-gray-300 text-center mb-2">Top 10 teams win equity prizes + Lifetime Ultra Plan</p>
            <p className="text-xs text-gray-400 text-center">Places 4-10: $400K, $300K, $225K, $175K, $125K, $100K, $75K</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
            <p className="text-sm text-emerald-300 text-center">
              All valid applicants receive 1-year unlimited subscription!
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'scoring',
      title: 'Scoring Breakdown',
      icon: Zap,
      iconBg: 'from-purple-500 to-pink-500',
      content: (
        <div className="space-y-3">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium text-sm">Astra Intelligence Score</span>
              <span className="text-orange-400 font-bold">50%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full" style={{ width: '50%' }} />
            </div>
            <p className="text-xs text-gray-400 mt-1">Automated tracking of your AI Rocket usage</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium text-sm">Impact Statement</span>
              <span className="text-blue-400 font-bold">25%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full" style={{ width: '25%' }} />
            </div>
            <p className="text-xs text-gray-400 mt-1">Your positive impact with AI-Powered business</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium text-sm">RBG Matrix Summaries</span>
              <span className="text-emerald-400 font-bold">25%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full" style={{ width: '25%' }} />
            </div>
            <p className="text-xs text-gray-400 mt-1">Run, Build, Grow transformation summaries</p>
          </div>
        </div>
      ),
    },
    {
      id: 'timeline',
      title: 'Challenge Timeline',
      icon: Calendar,
      iconBg: 'from-emerald-500 to-teal-500',
      content: (
        <div className="space-y-2">
          {[
            { date: 'Jan 15', title: 'Challenge Begins', desc: '90 days of free unlimited access', active: true },
            { date: 'Jan-Apr', title: 'Use AI Rocket', desc: 'Build your Astra score automatically' },
            { date: 'Apr 6-10', title: 'Prize Applications', desc: 'Submit Impact Statement & RBG summaries' },
            { date: 'Apr 13-16', title: 'Winners Announced', desc: 'Top 10 teams win equity prizes' },
          ].map((item, idx) => (
            <div key={idx} className={`flex items-start gap-3 p-2 rounded-lg ${item.active ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-gray-800/30'}`}>
              <div className={`w-14 text-xs font-bold ${item.active ? 'text-emerald-400' : 'text-gray-400'}`}>{item.date}</div>
              <div className="flex-1">
                <h4 className={`text-sm font-medium ${item.active ? 'text-emerald-300' : 'text-white'}`}>{item.title}</h4>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'team',
      title: 'Your Team is Entered',
      icon: Users,
      iconBg: 'from-cyan-500 to-blue-500',
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/30 rounded-xl p-4 text-center">
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Rocket className="w-8 h-8 text-orange-400" />
            </div>
            <h4 className="text-white font-bold text-lg mb-1">You're In!</h4>
            <p className="text-gray-300 text-sm">Your team is automatically entered in the Moonshot Challenge</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Gift className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Free unlimited AI access for 90 days</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Zap className="w-4 h-4 text-orange-400 flex-shrink-0" />
              <span>Activity automatically tracked by Astra</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Trophy className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <span>Submit Prize Application April 6-10</span>
            </div>
          </div>
          <Link
            to="/moonshot"
            target="_blank"
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            View Full Challenge Details
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    setCurrentSlide(prev => (prev < slides.length - 1 ? prev + 1 : prev));
  };

  const handlePrev = () => {
    setCurrentSlide(prev => (prev > 0 ? prev - 1 : prev));
  };

  const currentSlideData = slides[currentSlide];
  const SlideIcon = currentSlideData.icon;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className={`bg-gradient-to-r ${currentSlideData.iconBg} p-6`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <SlideIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{currentSlideData.title}</h2>
                {currentSlideData.subtitle && (
                  <p className="text-sm text-white/80">{currentSlideData.subtitle}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {currentSlideData.content}
        </div>

        <div className="px-6 pb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentSlide === 0}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-gray-300" />
            </button>

            <div className="flex items-center gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentSlide
                      ? 'bg-orange-500 w-4'
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={currentSlide === slides.length - 1 ? onClose : handleNext}
              className={`p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
                currentSlide === slides.length - 1
                  ? 'bg-orange-500 hover:bg-orange-600'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              {currentSlide === slides.length - 1 ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-300" />
              )}
            </button>
          </div>

          <p className="text-center text-xs text-gray-500 mt-3">
            {currentSlide + 1} of {slides.length}
          </p>
        </div>
      </div>
    </div>
  );
};
