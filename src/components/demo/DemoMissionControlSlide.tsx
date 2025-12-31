import React from 'react';
import { Rocket, Users, FileText, Fuel, Target, TrendingUp } from 'lucide-react';
import { DEMO_COMPANY, DEMO_MISSION_CONTROL } from '../../data/demoData';

interface DemoMissionControlSlideProps {
  onClose: () => void;
}

export const DemoMissionControlSlide: React.FC<DemoMissionControlSlideProps> = () => {
  return (
    <div className="p-4 lg:p-5">
      <div className="text-center mb-3">
        <span className="inline-block px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full mb-1">
          Demo Data
        </span>
        <h2 className="text-xl lg:text-2xl font-bold text-white mb-1">
          Mission Control
        </h2>
        <p className="text-sm text-gray-400">
          Your command center for AI-powered business intelligence
        </p>
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4 max-w-4xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
          <div className="lg:w-1/3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{DEMO_COMPANY.name}</h3>
                <p className="text-xs text-gray-400">{DEMO_COMPANY.tagline}</p>
              </div>
            </div>

            <div className="text-center py-2 bg-gray-900/50 rounded-xl mb-3">
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-400">
                {DEMO_MISSION_CONTROL.launchPoints.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">Launch Points</div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-900/50 rounded-lg p-2 text-center">
                <Users className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <div className="text-base font-semibold text-white">{DEMO_MISSION_CONTROL.teamMembers}</div>
                <div className="text-[10px] text-gray-500">Members</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-2 text-center">
                <FileText className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <div className="text-base font-semibold text-white">{DEMO_MISSION_CONTROL.documentsConnected}</div>
                <div className="text-[10px] text-gray-500">Docs</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-2 text-center">
                <Fuel className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                <div className="text-base font-semibold text-white">{DEMO_MISSION_CONTROL.fuelLevel}%</div>
                <div className="text-[10px] text-gray-500">Fuel</div>
              </div>
            </div>
          </div>

          <div className="lg:flex-1 lg:border-l lg:border-gray-700 lg:pl-4">
            <h4 className="text-sm font-medium text-gray-400 flex items-center gap-2 mb-3">
              <Target className="w-4 h-4" />
              Launch Stages Progress
            </h4>

            <div className="space-y-3">
              {Object.entries(DEMO_MISSION_CONTROL.stageProgress).map(([key, stage]) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">{stage.label}</span>
                    <span className="text-gray-500">{stage.current}%</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        key === 'fuel' ? 'bg-orange-500' :
                        key === 'guidance' ? 'bg-blue-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${stage.current}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2 text-sm text-emerald-400">
              <TrendingUp className="w-4 h-4" />
              <span>Team progress is ahead of schedule</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
