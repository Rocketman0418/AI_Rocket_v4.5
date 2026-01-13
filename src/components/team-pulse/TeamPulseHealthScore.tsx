import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Compass, Rocket, Users, Settings, Shield, DollarSign, Info, X } from 'lucide-react';
import { TeamPulseHealthFactors, TeamPulseInsights, TeamPulseFactorExplanations } from '../../types';

interface TeamPulseHealthScoreProps {
  score: number;
  factors: TeamPulseHealthFactors;
  insights: TeamPulseInsights;
  explanation: string | null;
  factorExplanations?: TeamPulseFactorExplanations;
}

const factorConfig = {
  data_richness: { label: 'Strategic Alignment', icon: Compass, color: 'cyan', explanationKey: 'strategic_alignment' as const },
  goal_progress: { label: 'Project Momentum', icon: Rocket, color: 'emerald', explanationKey: 'project_momentum' as const },
  meeting_cadence: { label: 'Team Collaboration', icon: Users, color: 'blue', explanationKey: 'team_collaboration' as const },
  team_engagement: { label: 'Operations', icon: Settings, color: 'teal', explanationKey: 'operational_efficiency' as const },
  risk_indicators: { label: 'Risk Management', icon: Shield, color: 'amber', explanationKey: 'risk_management' as const },
  financial_health: { label: 'Financial Health', icon: DollarSign, color: 'green', explanationKey: 'financial_health' as const }
};

const colorMap: Record<string, { bg: string; fill: string; text: string }> = {
  cyan: { bg: 'bg-cyan-500/20', fill: 'bg-cyan-500', text: 'text-cyan-400' },
  emerald: { bg: 'bg-emerald-500/20', fill: 'bg-emerald-500', text: 'text-emerald-400' },
  blue: { bg: 'bg-blue-500/20', fill: 'bg-blue-500', text: 'text-blue-400' },
  teal: { bg: 'bg-teal-500/20', fill: 'bg-teal-500', text: 'text-teal-400' },
  amber: { bg: 'bg-amber-500/20', fill: 'bg-amber-500', text: 'text-amber-400' },
  green: { bg: 'bg-green-500/20', fill: 'bg-green-500', text: 'text-green-400' }
};

export function TeamPulseHealthScore({
  score,
  factors,
  insights,
  explanation,
  factorExplanations
}: TeamPulseHealthScoreProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const getScoreColor = (value: number) => {
    if (value >= 70) return 'text-emerald-400';
    if (value >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreGradient = (value: number) => {
    if (value >= 70) return 'from-emerald-500 to-green-500';
    if (value >= 40) return 'from-amber-500 to-yellow-500';
    return 'from-red-500 to-orange-500';
  };

  const TrendIcon = insights.score_trend === 'up' ? TrendingUp
    : insights.score_trend === 'down' ? TrendingDown
    : Minus;

  const trendColor = insights.score_trend === 'up' ? 'text-emerald-400'
    : insights.score_trend === 'down' ? 'text-red-400'
    : 'text-slate-400';

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <h3 className="text-lg font-medium text-white mb-4">Team Health Overview</h3>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex flex-col items-center justify-center lg:border-r lg:border-slate-700 lg:pr-6">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#1e293b"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#scoreGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${score * 2.83} 283`}
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" className={`stop-color-${getScoreGradient(score).split(' ')[0].replace('from-', '')}`} />
                  <stop offset="100%" className={`stop-color-${getScoreGradient(score).split(' ')[1].replace('to-', '')}`} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <TrendIcon className={`w-4 h-4 ${trendColor}`} />
            <span className={`text-sm ${trendColor}`}>
              {insights.score_change > 0 ? '+' : ''}{insights.score_change} from last week
            </span>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(Object.keys(factorConfig) as Array<keyof typeof factorConfig>).map(key => {
            const config = factorConfig[key];
            const value = factors[key];
            const colors = colorMap[config.color];
            const Icon = config.icon;
            const trend = insights.factor_trends[key];
            const explanationText = factorExplanations?.[config.explanationKey];
            const isTooltipActive = activeTooltip === key;

            return (
              <div key={key} className="relative p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded ${colors.bg} flex items-center justify-center`}>
                      <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
                    </div>
                    <span className="text-xs text-slate-400 truncate">{config.label}</span>
                  </div>
                  {explanationText && (
                    <button
                      onClick={() => setActiveTooltip(isTooltipActive ? null : key)}
                      className="p-1 rounded-full hover:bg-slate-700/50 transition-colors"
                      title="View explanation"
                    >
                      <Info className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-lg font-semibold text-white">{value}%</span>
                  {trend && (
                    <span className={`text-xs ${
                      trend.trend === 'up' ? 'text-emerald-400' :
                      trend.trend === 'down' ? 'text-red-400' :
                      'text-slate-500'
                    }`}>
                      {trend.change > 0 ? '+' : ''}{trend.change}
                    </span>
                  )}
                </div>
                <div className={`h-1.5 ${colors.bg} rounded-full overflow-hidden`}>
                  <div
                    className={`h-full ${colors.fill} rounded-full transition-all duration-500`}
                    style={{ width: `${value}%` }}
                  />
                </div>

                {isTooltipActive && explanationText && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-2 p-3 bg-slate-800 border border-slate-600 rounded-lg shadow-xl">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-slate-300 leading-relaxed">{explanationText}</p>
                      <button
                        onClick={() => setActiveTooltip(null)}
                        className="p-0.5 rounded hover:bg-slate-700 transition-colors flex-shrink-0"
                      >
                        <X className="w-3 h-3 text-slate-400" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {explanation && (
        <p className="mt-4 text-sm text-slate-400 leading-relaxed">{explanation}</p>
      )}
    </div>
  );
}
