import React, { useState, useRef } from 'react';
import { LayoutDashboard, RefreshCw, Clock, AlertCircle, Loader2, Calendar, Sparkles, Download, Settings, X, Beaker, Info, Check, ToggleLeft, ToggleRight } from 'lucide-react';
import { useTeamDashboard } from '../hooks/useTeamDashboard';
import { GoalsProgressSection } from './team-dashboard/GoalsProgressSection';
import { AlignmentMetricSection } from './team-dashboard/AlignmentMetricSection';
import { HealthOverviewSection } from './team-dashboard/HealthOverviewSection';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface TeamDashboardViewProps {
  onClose?: () => void;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}


function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="w-8 h-8 text-sky-400 animate-spin mb-4" />
      <p className="text-gray-400">Loading dashboard...</p>
    </div>
  );
}

function GeneratingState() {
  return (
    <div className="bg-slate-800/50 border border-sky-500/30 rounded-xl p-8">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-sky-500/20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-sky-500/30 animate-ping" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-medium text-white mb-1">Generating Team Dashboard</h3>
          <p className="text-sm text-slate-400">
            Analyzing team data and generating your AI-powered insights...
          </p>
          <p className="text-xs text-slate-500 mt-2">
            This may take 30-60 seconds
          </p>
        </div>
      </div>
    </div>
  );
}

function ExperimentalBanner() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
      <Beaker className="w-4 h-4 text-amber-400 flex-shrink-0" />
      <p className="text-xs text-amber-300">
        <span className="font-medium">Experimental Feature:</span> This AI-generated dashboard may contain inaccuracies. If results seem off, try regenerating.
      </p>
    </div>
  );
}

const INSTRUCTION_EXAMPLES = [
  "Focus more on sales pipeline metrics and revenue targets",
  "Include weekly activity comparisons where possible",
  "Highlight any risks related to project deadlines",
  "Emphasize team collaboration and communication patterns",
  "Track OKRs aligned with Q1 company objectives"
];

interface CustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentInstructions: string | null;
  onSave: (instructions: string | null) => void;
}

function CustomizeModal({ isOpen, onClose, currentInstructions, onSave }: CustomizeModalProps) {
  const [instructions, setInstructions] = useState(currentInstructions || '');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(instructions.trim() || null);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-semibold text-white">Customize Dashboard</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Custom Instructions
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Tell Astra what to focus on when generating your dashboard..."
              rows={4}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:border-sky-500 focus:outline-none resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              These instructions will apply to all future automatic dashboard generations.
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-400 mb-2">Example instructions:</p>
            <div className="space-y-1.5">
              {INSTRUCTION_EXAMPLES.map((example, i) => (
                <button
                  key={i}
                  onClick={() => setInstructions(example)}
                  className="block w-full text-left text-xs text-gray-400 hover:text-sky-300 transition-colors"
                >
                  "{example}"
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saved}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                Saved!
              </>
            ) : (
              'Save Instructions'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface GenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (instructions?: string, applyToFuture?: boolean) => void;
  defaultInstructions: string | null;
}

function GenerateModal({ isOpen, onClose, onGenerate, defaultInstructions }: GenerateModalProps) {
  const [showCustomize, setShowCustomize] = useState(false);
  const [instructions, setInstructions] = useState(defaultInstructions || '');
  const [applyToFuture, setApplyToFuture] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = () => {
    if (showCustomize && instructions.trim()) {
      onGenerate(instructions.trim(), applyToFuture);
    } else {
      onGenerate();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-semibold text-white">Generate Dashboard</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-400">
            Generate a new AI-powered dashboard with the latest team data. This typically takes 30-60 seconds.
          </p>

          <button
            onClick={() => setShowCustomize(!showCustomize)}
            className="flex items-center gap-2 text-sm text-sky-400 hover:text-sky-300 transition-colors"
          >
            <Settings className="w-4 h-4" />
            {showCustomize ? 'Hide custom instructions' : 'Add custom instructions for this generation'}
          </button>

          {showCustomize && (
            <div className="space-y-3">
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Tell Astra what to focus on..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:border-sky-500 focus:outline-none resize-none"
              />

              <button
                onClick={() => setApplyToFuture(!applyToFuture)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                {applyToFuture ? (
                  <ToggleRight className="w-5 h-5 text-sky-400" />
                ) : (
                  <ToggleLeft className="w-5 h-5" />
                )}
                Apply to all future dashboards
              </button>

              <div className="bg-gray-800/50 rounded-lg p-2">
                <p className="text-xs text-gray-500">Examples:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {INSTRUCTION_EXAMPLES.slice(0, 3).map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => setInstructions(ex)}
                      className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                    >
                      {ex.slice(0, 30)}...
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Generate Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyDashboard({ onGenerate, isGenerating, canGenerate, isAdmin }: {
  onGenerate: () => void;
  isGenerating: boolean;
  canGenerate: boolean;
  isAdmin: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 flex items-center justify-center">
          <LayoutDashboard className="w-10 h-10 text-sky-400" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
      </div>
      <h2 className="text-xl font-semibold text-white mb-2 text-center">Welcome to Team Dashboard</h2>
      <p className="text-gray-400 text-center max-w-md mb-6">
        Get AI-powered daily insights on your team's goals, mission alignment, and overall health.
        Generate your first dashboard to get started.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center max-w-lg mb-6">
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
          <div className="text-2xl mb-1">Goals</div>
          <div className="text-xs text-slate-400">Progress Tracking</div>
        </div>
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
          <div className="text-2xl mb-1">Alignment</div>
          <div className="text-xs text-slate-400">Mission & Values</div>
        </div>
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
          <div className="text-2xl mb-1">Health</div>
          <div className="text-xs text-slate-400">Team Score</div>
        </div>
      </div>

      {isAdmin && canGenerate ? (
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
            ${isGenerating
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-sky-500 to-blue-500 text-white hover:from-sky-600 hover:to-blue-600 shadow-lg hover:shadow-sky-500/20'
            }
          `}
        >
          <RefreshCw className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? 'Generating...' : 'Generate Dashboard'}
        </button>
      ) : !isAdmin ? (
        <p className="text-sm text-slate-500">
          Ask your team admin to generate the first Team Dashboard
        </p>
      ) : null}

      <div className="flex items-center gap-2 mt-4 px-4 py-2 bg-slate-800/30 border border-slate-700/50 rounded-lg max-w-md">
        <Info className="w-4 h-4 text-sky-400 flex-shrink-0" />
        <p className="text-xs text-slate-400">
          Dashboards are automatically updated daily at midnight EST
        </p>
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">Unable to Load Dashboard</h3>
      <p className="text-gray-400 text-center mb-4">{error}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  );
}

export const TeamDashboardView: React.FC<TeamDashboardViewProps> = () => {
  const {
    currentSnapshot,
    settings,
    loading,
    error,
    regenerate,
    isRegenerating,
    canRegenerate,
    isAdmin,
    updateCustomInstructions,
    teamName
  } = useTeamDashboard();

  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!dashboardRef.current || isExporting) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        backgroundColor: '#111827',
        logging: false,
        useCORS: true,
        width: dashboardRef.current.scrollWidth,
        height: dashboardRef.current.scrollHeight,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('[data-dashboard-export]') as HTMLElement;
          if (clonedElement) {
            clonedElement.style.overflow = 'visible';
          }
        }
      });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const margin = 5;
      const availableWidth = pdfWidth - (margin * 2);
      const availableHeight = pdfHeight - (margin * 2);

      const imgRatio = canvas.width / canvas.height;

      let finalWidth = availableWidth;
      let finalHeight = availableWidth / imgRatio;

      if (finalHeight > availableHeight) {
        finalHeight = availableHeight;
        finalWidth = availableHeight * imgRatio;
      }

      const xOffset = (pdfWidth - finalWidth) / 2;
      const yOffset = (pdfHeight - finalHeight) / 2;

      pdf.setFillColor(17, 24, 39);
      pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);

      const safeTeamName = (teamName || 'Team').replace(/[^a-zA-Z0-9]/g, '-');
      const date = new Date().toISOString().split('T')[0];
      pdf.save(`${safeTeamName}-Dashboard-${date}.pdf`);
    } catch (err) {
      console.error('Error exporting PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-gray-900 overflow-auto">
        <LoadingState />
      </div>
    );
  }

  if (error && !currentSnapshot) {
    return (
      <div className="h-full bg-gray-900 overflow-auto">
        <ErrorState error={error} onRetry={() => regenerate()} />
      </div>
    );
  }

  if (!currentSnapshot && !isRegenerating) {
    return (
      <div className="h-full bg-gray-900 overflow-auto">
        <EmptyDashboard
          onGenerate={() => setShowGenerateModal(true)}
          isGenerating={isRegenerating}
          canGenerate={canRegenerate}
          isAdmin={isAdmin}
        />
        <GenerateModal
          isOpen={showGenerateModal}
          onClose={() => setShowGenerateModal(false)}
          onGenerate={regenerate}
          defaultInstructions={settings?.custom_instructions || null}
        />
      </div>
    );
  }

  const generatedAt = currentSnapshot ? new Date(currentSnapshot.generated_at) : null;

  return (
    <div className="h-full bg-gray-900 overflow-auto flex flex-col">
      <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-4 flex flex-col">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Team Dashboard</h1>
                <p className="text-sm text-slate-400">
                  Daily AI-Powered Goals, Alignment & Health Insights
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end text-xs text-slate-500 gap-0.5">
                {generatedAt && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Updated {formatRelativeTime(generatedAt)}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Daily at Midnight EST</span>
                </div>
              </div>

              {currentSnapshot && (
                <button
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700/50 text-white rounded-lg text-sm transition-colors"
                  title="Export as PDF"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Export PDF</span>
                </button>
              )}

              {isAdmin && (
                <>
                  <button
                    onClick={() => setShowCustomizeModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                    title="Customize dashboard preferences"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">Customize</span>
                  </button>

                  <button
                    onClick={() => setShowGenerateModal(true)}
                    disabled={isRegenerating || !canRegenerate}
                    className={`
                      flex items-center gap-2 px-4 py-1.5 rounded-lg font-medium transition-all text-sm
                      ${isRegenerating || !canRegenerate
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-sky-500 to-blue-500 text-white hover:from-sky-600 hover:to-blue-600'
                      }
                    `}
                  >
                    <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                    {isRegenerating ? 'Generating...' : 'Generate'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <ExperimentalBanner />

        {error && (
          <div className="mt-4 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-red-400 font-medium">Generation Error</p>
              <p className="text-sm text-red-400/80">{error}</p>
            </div>
          </div>
        )}

        {isRegenerating && (
          <div className="mt-4">
            <GeneratingState />
          </div>
        )}

        {!isRegenerating && currentSnapshot && (
          <div
            ref={dashboardRef}
            className="flex-1 mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 bg-gray-900 rounded-xl"
            style={{ minHeight: '600px', maxWidth: '1400px', margin: '16px auto 0' }}
          >
            <div className="lg:col-span-1 flex flex-col min-h-[580px]">
              <AlignmentMetricSection data={currentSnapshot.alignment_metrics} />
            </div>

            <div className="lg:col-span-1 flex flex-col min-h-[580px]">
              <GoalsProgressSection data={currentSnapshot.goals_progress} />
            </div>

            <div className="lg:col-span-1 flex flex-col min-h-[580px]">
              <HealthOverviewSection data={currentSnapshot.health_overview} />
            </div>
          </div>
        )}

        {currentSnapshot && currentSnapshot.source_data_summary && (
          <div className="text-center text-xs text-gray-500 py-3 mt-auto border-t border-gray-800">
            Analysis based on{' '}
            {currentSnapshot.source_data_summary.documents_analyzed ||
              currentSnapshot.source_data_summary.category_summary?.reduce((sum, c) => sum + c.document_count, 0) || 0}{' '}
            documents across{' '}
            {currentSnapshot.source_data_summary.category_summary?.length || 0} categories
          </div>
        )}
      </div>

      <CustomizeModal
        isOpen={showCustomizeModal}
        onClose={() => setShowCustomizeModal(false)}
        currentInstructions={settings?.custom_instructions || null}
        onSave={updateCustomInstructions}
      />

      <GenerateModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onGenerate={regenerate}
        defaultInstructions={settings?.custom_instructions || null}
      />
    </div>
  );
};

export default TeamDashboardView;
