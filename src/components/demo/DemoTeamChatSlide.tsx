import React from 'react';
import { Users, MessageCircle, Sparkles, AtSign } from 'lucide-react';
import { DEMO_TEAM_CHAT, DEMO_COMPANY } from '../../data/demoData';

interface DemoTeamChatSlideProps {
  onClose: () => void;
}

export const DemoTeamChatSlide: React.FC<DemoTeamChatSlideProps> = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="text-center mb-6">
        <span className="inline-block px-2 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded-full mb-2">
          Demo Conversation
        </span>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Team Collaboration
        </h2>
        <p className="text-gray-400">
          Work together with your team and @mention Astra for instant AI insights
        </p>
      </div>

      <div className="max-w-2xl mx-auto bg-gray-800/50 border border-gray-700 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700 bg-gray-800/80">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">{DEMO_COMPANY.name} Team</div>
            <div className="text-xs text-gray-400">4 members online</div>
          </div>
          <div className="flex -space-x-2">
            {['SC', 'MR', 'EW', 'DK'].map((initials) => (
              <div
                key={initials}
                className="w-6 h-6 rounded-full bg-gray-700 border-2 border-gray-800 flex items-center justify-center text-xs text-gray-300"
              >
                {initials}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
          {DEMO_TEAM_CHAT.map((message, index) => (
            <div key={index} className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.isAI
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                    : 'bg-gray-700'
                }`}
              >
                {message.isAI ? (
                  <Sparkles className="w-4 h-4 text-white" />
                ) : (
                  <span className="text-xs text-gray-300">{message.avatar}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className={`text-sm font-medium ${message.isAI ? 'text-blue-400' : 'text-white'}`}>
                    {message.user}
                  </span>
                  <span className="text-xs text-gray-500">{message.time}</span>
                </div>
                <p className="text-sm text-gray-300 mt-1">
                  {message.message.split('@Astra').map((part, i, arr) => (
                    <React.Fragment key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <span className="text-blue-400 font-medium">@Astra</span>
                      )}
                    </React.Fragment>
                  ))}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-2 bg-gray-900 rounded-xl px-4 py-3">
            <AtSign className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Message team or @mention Astra..."
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
              disabled
            />
            <MessageCircle className="w-4 h-4 text-gray-500" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <AtSign className="w-4 h-4 text-blue-400" />
          <span>@mention anyone</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>AI-powered responses</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          <span>Real-time collaboration</span>
        </div>
      </div>
    </div>
  );
};
