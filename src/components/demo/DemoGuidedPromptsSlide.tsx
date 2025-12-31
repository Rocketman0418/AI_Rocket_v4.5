import React from 'react';
import { MessageSquareText, Sparkles, ArrowRight } from 'lucide-react';
import { DEMO_GUIDED_PROMPTS } from '../../data/demoData';

interface DemoGuidedPromptsSlideProps {
  onClose: () => void;
}

export const DemoGuidedPromptsSlide: React.FC<DemoGuidedPromptsSlideProps> = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="text-center mb-6">
        <span className="inline-block px-2 py-1 text-xs bg-orange-500/20 text-orange-400 rounded-full mb-2">
          AI Assistance
        </span>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Astra Guided Prompts
        </h2>
        <p className="text-gray-400 max-w-xl mx-auto">
          Pre-built prompts designed to get the most valuable insights from your data
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <MessageSquareText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Smart Prompt Library</h3>
              <p className="text-sm text-gray-400">
                One-click prompts tailored to your business needs
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {DEMO_GUIDED_PROMPTS.map((category) => (
              <div key={category.category}>
                <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  {category.category}
                </h4>
                <div className="space-y-2">
                  {category.prompts.map((prompt, index) => (
                    <button
                      key={index}
                      className="w-full flex items-center justify-between gap-3 p-3 bg-gray-900/50 hover:bg-gray-900 border border-gray-700 hover:border-orange-500/30 rounded-xl text-left transition-all group"
                    >
                      <span className="text-sm text-gray-300 group-hover:text-white">
                        {prompt}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-orange-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-300">
            <span className="text-orange-400 font-medium">Pro tip:</span> Guided prompts learn from your data and get smarter over time
          </p>
        </div>
      </div>
    </div>
  );
};
