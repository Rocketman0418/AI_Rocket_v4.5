import React from 'react';
import { FileText, DollarSign, FolderKanban, Database, Sparkles, ArrowRight, CheckCircle2, Upload, HardDrive } from 'lucide-react';
import { DEMO_SMART_DATA } from '../../data/demoData';

interface DemoSmartDataSlideProps {
  onClose: () => void;
}

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  FileText,
  DollarSign,
  FolderKanban,
};

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
};

export const DemoSmartDataSlide: React.FC<DemoSmartDataSlideProps> = () => {
  return (
    <div className="p-4 lg:p-5">
      <div className="text-center mb-3">
        <span className="inline-block px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-full mb-1">
          Core Feature
        </span>
        <h2 className="text-xl lg:text-2xl font-bold text-white mb-1">
          AI Smart Data
        </h2>
        <p className="text-sm text-gray-400 max-w-xl mx-auto">
          Connect and utilize your team's data with AI that understands your business
        </p>
      </div>

      <div className="max-w-4xl mx-auto flex flex-col lg:flex-row gap-4">
        <div className="lg:w-1/2 bg-gray-800/50 border border-gray-700 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Database className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Connected Data Sources</h3>
              <p className="text-xs text-gray-400">
                {DEMO_SMART_DATA.totalDocuments} documents indexed
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {DEMO_SMART_DATA.categories.map((category) => {
              const Icon = iconMap[category.icon];
              const colors = colorMap[category.color];
              return (
                <div
                  key={category.name}
                  className={`${colors.bg} border ${colors.border} rounded-lg p-2 text-center`}
                >
                  <Icon className={`w-5 h-5 ${colors.text} mx-auto mb-1`} />
                  <div className="text-lg font-semibold text-white">{category.count}</div>
                  <div className="text-[10px] text-gray-400">{category.name}</div>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-gray-900/50 rounded-lg">
              <HardDrive className="w-4 h-4 text-blue-400" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-gray-300">Google Drive Folders</span>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400">Synced</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-900/50 rounded-lg">
              <Upload className="w-4 h-4 text-orange-400" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-gray-300">Local File Uploads</span>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400">Ready</span>
            </div>
          </div>
        </div>

        <div className="lg:w-1/2 bg-gradient-to-br from-blue-500/10 to-emerald-500/10 border border-gray-700 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Powerful Use Cases</h3>
          </div>

          <div className="space-y-2">
            {DEMO_SMART_DATA.useCases.map((useCase, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-300">{useCase}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
