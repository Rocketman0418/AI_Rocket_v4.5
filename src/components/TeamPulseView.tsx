import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTeamPulse } from '../hooks/useTeamPulse';
import { TeamPulseHeader } from './team-pulse/TeamPulseHeader';
import { TeamPulseInfographic } from './team-pulse/TeamPulseInfographic';
import { TeamPulseEmptyState } from './team-pulse/TeamPulseEmptyState';
import { TeamPulseHealthScore } from './team-pulse/TeamPulseHealthScore';
import { TeamPulseInsightsPanel } from './team-pulse/TeamPulseInsightsPanel';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';

interface TeamPulseViewProps {
  onClose?: () => void;
}

export default function TeamPulseView({ onClose }: TeamPulseViewProps) {
  const { user } = useAuth();
  const {
    currentSnapshot,
    settings,
    loading,
    generating,
    error,
    generatePulse
  } = useTeamPulse();

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      const role = user.user_metadata?.role || 'member';
      setIsAdmin(role === 'admin');
    }
  }, [user]);

  const handleGenerate = async () => {
    console.log('[TeamPulse] Generate button clicked, calling generatePulse...');
    const result = await generatePulse();
    console.log('[TeamPulse] generatePulse result:', result);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="text-slate-400">Loading Team Pulse...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-6">
        <TeamPulseHeader
          lastGeneratedAt={currentSnapshot?.generated_at || settings?.last_generated_at || null}
          settings={settings}
          generating={generating}
          isAdmin={isAdmin}
          onGenerate={handleGenerate}
        />

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-red-400 font-medium">Generation Error</p>
              <p className="text-sm text-red-400/80">{error}</p>
            </div>
          </div>
        )}

        {generating && (
          <div className="bg-slate-800/50 border border-cyan-500/30 rounded-xl p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 animate-ping" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-white mb-1">Generating Team Pulse</h3>
                <p className="text-sm text-slate-400">
                  Analyzing team data and creating your AI-powered infographic...
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  This may take 30-60 seconds
                </p>
              </div>
            </div>
          </div>
        )}

        {!generating && !currentSnapshot && (
          <TeamPulseEmptyState
            generating={generating}
            isAdmin={isAdmin}
            onGenerate={handleGenerate}
          />
        )}

        {!generating && currentSnapshot && (
          <>
            {(currentSnapshot.infographic_url || currentSnapshot.infographic_base64) && (
              <TeamPulseInfographic
                imageUrl={currentSnapshot.infographic_url}
                imageBase64={currentSnapshot.infographic_base64}
                generatedAt={currentSnapshot.generated_at}
              />
            )}

            {currentSnapshot.health_explanation && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-medium text-white">Team Snapshot</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">{currentSnapshot.health_explanation}</p>
              </div>
            )}

            <TeamPulseHealthScore
              score={currentSnapshot.health_score}
              factors={currentSnapshot.health_factors}
              insights={currentSnapshot.insights_and_trends}
              explanation={null}
              factorExplanations={currentSnapshot.sections?.factor_explanations}
            />

            <TeamPulseInsightsPanel
              insights={currentSnapshot.insights_and_trends}
            />
          </>
        )}
      </div>
    </div>
  );
}
