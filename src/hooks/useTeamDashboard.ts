import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface GoalItem {
  name: string;
  type: 'goal' | 'okr' | 'target' | 'milestone' | 'project' | 'kpi';
  status: 'on_track' | 'at_risk' | 'blocked' | 'not_started' | 'completed';
  progress_percentage: number | null;
  notes: string;
  source_reference: string;
  deadline?: string;
  owner?: string;
}

export interface GoalsProgress {
  has_data: boolean;
  items: GoalItem[];
  suggestions: string[];
}

export interface AlignmentExample {
  type: 'aligned' | 'misaligned';
  description: string;
}

export interface AlignmentMetrics {
  has_data: boolean;
  mission_statement: string | null;
  core_values: string[];
  alignment_score: number | null;
  alignment_examples: AlignmentExample[];
  recommendations: string[];
  suggestions: string[];
}

export interface HealthFactor {
  name: string;
  score: number;
  explanation: string;
  trend: 'up' | 'down' | 'stable';
}

export interface HealthOverview {
  overall_score: number | null;
  factors: HealthFactor[];
  trend_vs_previous: 'improving' | 'declining' | 'stable' | 'first_snapshot';
  explanation: string;
  recommendations?: string[];
}

export interface DataSufficiency {
  goals: boolean;
  alignment: boolean;
  health: boolean;
}

export interface DashboardSnapshot {
  id: string;
  team_id: string;
  generated_at: string;
  goals_progress: GoalsProgress;
  alignment_metrics: AlignmentMetrics;
  health_overview: HealthOverview;
  data_sufficiency: DataSufficiency;
  source_data_summary: {
    category_summary?: Array<{ category: string; document_count: number }>;
    member_info?: { total_members: number };
    documents_analyzed?: number;
  };
  generation_type: 'scheduled' | 'manual';
  is_current: boolean;
}

export interface DashboardSettings {
  team_id: string;
  is_enabled: boolean;
  last_generated_at: string | null;
  next_generation_at: string | null;
  custom_instructions: string | null;
}

interface UseTeamDashboardReturn {
  currentSnapshot: DashboardSnapshot | null;
  settings: DashboardSettings | null;
  loading: boolean;
  error: string | null;
  regenerate: (customInstructions?: string, applyToFuture?: boolean) => Promise<void>;
  isRegenerating: boolean;
  canRegenerate: boolean;
  lastRegeneratedAt: Date | null;
  isAdmin: boolean;
  updateCustomInstructions: (instructions: string | null) => Promise<void>;
  teamName: string | null;
}

export function useTeamDashboard(): UseTeamDashboardReturn {
  const { user } = useAuth();
  const [currentSnapshot, setCurrentSnapshot] = useState<DashboardSnapshot | null>(null);
  const [settings, setSettings] = useState<DashboardSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [lastRegeneratedAt, setLastRegeneratedAt] = useState<Date | null>(null);

  const teamId = user?.user_metadata?.team_id;
  const teamName = user?.user_metadata?.team_name || null;
  const isAdmin = user?.user_metadata?.role === 'admin' || user?.user_metadata?.role === 'owner';

  const canRegenerate = isAdmin && !isRegenerating;

  const fetchDashboard = useCallback(async () => {
    if (!teamId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);

      const [snapshotResult, settingsResult] = await Promise.all([
        supabase
          .from('team_dashboard_snapshots')
          .select('*')
          .eq('team_id', teamId)
          .eq('is_current', true)
          .maybeSingle(),
        supabase
          .from('team_dashboard_settings')
          .select('*')
          .eq('team_id', teamId)
          .maybeSingle()
      ]);

      if (snapshotResult.error && snapshotResult.error.code !== 'PGRST116') {
        throw snapshotResult.error;
      }
      if (settingsResult.error && settingsResult.error.code !== 'PGRST116') {
        throw settingsResult.error;
      }

      setCurrentSnapshot(snapshotResult.data as DashboardSnapshot | null);
      setSettings(settingsResult.data as DashboardSettings | null);

      if (settingsResult.data?.last_generated_at) {
        setLastRegeneratedAt(new Date(settingsResult.data.last_generated_at));
      }
    } catch (err) {
      console.error('Error fetching team dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (!teamId) return;

    const channel = supabase
      .channel(`team-dashboard-${teamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_dashboard_snapshots',
          filter: `team_id=eq.${teamId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && (payload.new as DashboardSnapshot).is_current) {
            setCurrentSnapshot(payload.new as DashboardSnapshot);
            setIsRegenerating(false);
          } else if (payload.eventType === 'UPDATE' && (payload.new as DashboardSnapshot).is_current) {
            setCurrentSnapshot(payload.new as DashboardSnapshot);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  const regenerate = useCallback(async (customInstructions?: string, applyToFuture?: boolean) => {
    if (!teamId || !canRegenerate) return;

    setIsRegenerating(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      if (applyToFuture && customInstructions !== undefined) {
        await supabase
          .from('team_dashboard_settings')
          .upsert({
            team_id: teamId,
            custom_instructions: customInstructions || null,
            updated_at: new Date().toISOString()
          }, { onConflict: 'team_id' });
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-team-dashboard`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            team_id: teamId,
            generation_type: 'manual',
            custom_instructions: customInstructions || settings?.custom_instructions || undefined
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.snapshot) {
        setLastRegeneratedAt(new Date());
        await fetchDashboard();
      }
    } catch (err) {
      console.error('Error regenerating dashboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to regenerate dashboard');
      setIsRegenerating(false);
    }
  }, [teamId, canRegenerate, fetchDashboard, settings?.custom_instructions]);

  const updateCustomInstructions = useCallback(async (instructions: string | null) => {
    if (!teamId || !isAdmin) return;

    try {
      await supabase
        .from('team_dashboard_settings')
        .upsert({
          team_id: teamId,
          custom_instructions: instructions,
          updated_at: new Date().toISOString()
        }, { onConflict: 'team_id' });

      setSettings(prev => prev ? { ...prev, custom_instructions: instructions } : null);
    } catch (err) {
      console.error('Error updating custom instructions:', err);
    }
  }, [teamId, isAdmin]);

  return {
    currentSnapshot,
    settings,
    loading,
    error,
    regenerate,
    isRegenerating,
    canRegenerate,
    lastRegeneratedAt,
    isAdmin,
    updateCustomInstructions,
    teamName
  };
}
