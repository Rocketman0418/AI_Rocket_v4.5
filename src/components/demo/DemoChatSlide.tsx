import React from 'react';
import { Brain, Sparkles, Send } from 'lucide-react';
import { DEMO_CHAT_CONVERSATION } from '../../data/demoData';

interface DemoChatSlideProps {
  onClose: () => void;
}

export const DemoChatSlide: React.FC<DemoChatSlideProps> = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="text-center mb-6">
        <span className="inline-block px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-full mb-2">
          Demo Conversation
        </span>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Chat with Astra
        </h2>
        <p className="text-gray-400">
          Ask questions about your data and get intelligent, contextual answers
        </p>
      </div>

      <div className="max-w-2xl mx-auto bg-gray-800/50 border border-gray-700 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700 bg-gray-800/80">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-medium text-white">Astra Intelligence</div>
            <div className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Online
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
          {DEMO_CHAT_CONVERSATION.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-700 text-gray-100 rounded-bl-sm'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2 text-xs text-blue-400">
                    <Sparkles className="w-3 h-3" />
                    <span>Astra</span>
                  </div>
                )}
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-2 bg-gray-900 rounded-xl px-4 py-3">
            <input
              type="text"
              placeholder="Ask Astra anything about your data..."
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
              disabled
            />
            <button
              disabled
              className="p-2 rounded-lg bg-blue-600 text-white opacity-50 cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            Create an account to start chatting with Astra
          </p>
        </div>
      </div>
    </div>
  );
};
