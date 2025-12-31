import React from 'react';
import { MessageSquareText, Sparkles, ArrowRight } from 'lucide-react';
import { DEMO_GUIDED_PROMPTS } from '../../data/demoData';

interface DemoGuidedPromptsSlideProps {
  onClose: () => void;
}

export const DemoGuidedPromptsSlide: React.FC<DemoGuidedPromptsSlideProps> = () => {
  return (
    <div className="p-4 lg:p-5">
      <div className="text-center mb-3">
        <span className="inline-block px-2 py-0.5 text-xs bg-orange-500/20 text-orange-400 rounded-full mb-1">
          AI Assistance
        </span>
        <h2 className="text-xl lg:text-2xl font-bold text-white mb-1">
          Astra Guided Prompts
        </h2>
        <p className="text-sm text-gray-400 max-w-xl mx-auto">
          Pre-built prompts to get valuable insights from your data
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <MessageSquareText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Smart Prompt Library</h3>
              <p className="text-xs text-gray-400">One-click prompts for your business</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-3">
            {DEMO_GUIDED_PROMPTS.map((category) => (
              <div key={category.category}>
                <h4 className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-orange-400" />
                  {category.category}
                </h4>
                <div className="space-y-1.5">
                  {category.prompts.map((prompt, index) => (
                    <button
                      key={index}
                      className="w-full flex items-center justify-between gap-2 p-2 bg-gray-900/50 hover:bg-gray-900 border border-gray-700 hover:border-orange-500/30 rounded-lg text-left transition-all group"
                    >
                      <span className="text-xs text-gray-300 group-hover:text-white line-clamp-2">
                        {prompt}
                      </span>
                      <ArrowRight className="w-3 h-3 text-gray-600 group-hover:text-orange-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-300">
              <span className="text-orange-400 font-medium">Pro tip:</span> Guided prompts learn from your data
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
