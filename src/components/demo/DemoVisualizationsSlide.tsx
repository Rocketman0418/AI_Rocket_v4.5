import React from 'react';
import { BarChart3, TrendingUp, PieChart } from 'lucide-react';
import { DEMO_VISUALIZATIONS } from '../../data/demoData';

interface DemoVisualizationsSlideProps {
  onClose: () => void;
}

export const DemoVisualizationsSlide: React.FC<DemoVisualizationsSlideProps> = () => {
  const lineData = DEMO_VISUALIZATIONS[0];
  const pieData = DEMO_VISUALIZATIONS[1];
  const barData = DEMO_VISUALIZATIONS[2];

  const maxLineValue = Math.max(...(lineData.data as number[]));

  return (
    <div className="p-4 lg:p-5">
      <div className="text-center mb-3">
        <span className="inline-block px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full mb-1">
          Demo Data
        </span>
        <h2 className="text-xl lg:text-2xl font-bold text-white mb-1">
          AI Visualizations
        </h2>
        <p className="text-sm text-gray-400">
          Transform conversations into beautiful, actionable charts
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-3">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-medium text-white">{lineData.title}</h3>
          </div>
          <div className="flex flex-col">
            <div className="h-24 flex items-end justify-between gap-1.5 mb-1.5">
              {(lineData.data as number[]).map((value, index) => {
                const heightPercent = Math.max((value / maxLineValue) * 100, 5);
                return (
                  <div
                    key={index}
                    className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all"
                    style={{ height: `${heightPercent}%` }}
                  />
                );
              })}
            </div>
            <div className="flex justify-between gap-1">
              {(lineData.labels as string[]).map((label, index) => (
                <span key={index} className="flex-1 text-[10px] text-gray-500 text-center">{label}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <PieChart className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-medium text-white">{pieData.title}</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {(() => {
                  let accumulatedPercent = 0;
                  return (pieData.data as { label: string; value: number; color: string }[]).map((segment) => {
                    const dashArray = `${segment.value} ${100 - segment.value}`;
                    const dashOffset = -accumulatedPercent;
                    accumulatedPercent += segment.value;
                    return (
                      <circle
                        key={segment.label}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={segment.color}
                        strokeWidth="20"
                        strokeDasharray={dashArray}
                        strokeDashoffset={dashOffset}
                        className="transition-all"
                      />
                    );
                  });
                })()}
              </svg>
            </div>
            <div className="flex-1 space-y-1">
              {(pieData.data as { label: string; value: number; color: string }[]).map((segment) => (
                <div key={segment.label} className="flex items-center gap-1.5 text-[10px]">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="text-gray-400 flex-1">{segment.label}</span>
                  <span className="text-white font-medium">{segment.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-gray-800/50 border border-gray-700 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-orange-400" />
            <h3 className="text-xs font-medium text-white">{barData.title}</h3>
          </div>
          <div className="space-y-2">
            {(barData.data as { label: string; current: number; target: number }[]).map((item) => {
              const percentage = Math.round((item.current / item.target) * 100);
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="text-white">
                      {item.label === 'Revenue' ? `$${item.current.toLocaleString()}` : item.current} / {item.label === 'Revenue' ? `$${item.target.toLocaleString()}` : item.target}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
