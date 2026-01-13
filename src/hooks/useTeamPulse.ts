import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TeamPulseSnapshot, TeamPulseSettings } from '../types';

interface UseTeamPulseReturn {
  currentSnapshot: TeamPulseSnapshot | null;
  settings: TeamPulseSettings | null;
  history: TeamPulseSnapshot[];
  loading: boolean;
  generating: boolean;
  error: string | null;
  generatePulse: () => Promise<boolean>;
  refreshSnapshot: () => Promise<void>;
  loadHistory: () => Promise<void>;
}

export function useTeamPulse(): UseTeamPulseReturn {
  const { user } = useAuth();
  const [currentSnapshot, setCurrentSnapshot] = useState<TeamPulseSnapshot | null>(null);
  const [settings, setSettings] = useState<TeamPulseSettings | null>(null);
  const [history, setHistory] = useState<TeamPulseSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const teamId = user?.user_metadata?.team_id;

  const fetchCurrentSnapshot = useCallback(async () => {
    if (!teamId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('team_pulse_snapshots')
        .select('*')
        .eq('team_id', teamId)
        .eq('is_current', true)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching current snapshot:', fetchError);
        return;
      }

      setCurrentSnapshot(data);
    } catch (err) {
      console.error('Error in fetchCurrentSnapshot:', err);
    }
  }, [teamId]);

  const fetchSettings = useCallback(async () => {
    if (!teamId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('team_pulse_settings')
        .select('*')
        .eq('team_id', teamId)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching settings:', fetchError);
        return;
      }

      setSettings(data);
    } catch (err) {
      console.error('Error in fetchSettings:', err);
    }
  }, [teamId]);

  const loadHistory = useCallback(async () => {
    if (!teamId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('team_pulse_snapshots')
        .select('*')
        .eq('team_id', teamId)
        .order('generated_at', { ascending: false })
        .limit(10);

      if (fetchError) {
        console.error('Error fetching history:', fetchError);
        return;
      }

      setHistory(data || []);
    } catch (err) {
      console.error('Error in loadHistory:', err);
    }
  }, [teamId]);

  const refreshSnapshot = useCallback(async () => {
    setLoading(true);
    setError(null);

    await Promise.all([
      fetchCurrentSnapshot(),
      fetchSettings()
    ]);

    setLoading(false);
  }, [fetchCurrentSnapshot, fetchSettings]);

  const generatePulse = useCallback(async (): Promise<boolean> => {
    console.log('[useTeamPulse] generatePulse called', { teamId, userId: user?.id });

    if (!teamId || !user) {
      console.log('[useTeamPulse] Missing teamId or user', { teamId, user: !!user });
      setError('User not authenticated');
      return false;
    }

    setGenerating(true);
    setError(null);

    try {
      console.log('[useTeamPulse] Getting session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[useTeamPulse] Session obtained:', { hasSession: !!session, hasToken: !!session?.access_token });

      if (!session?.access_token) {
        console.log('[useTeamPulse] No active session token');
        setError('No active session');
        setGenerating(false);
        return false;
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-team-pulse`;
      console.log('[useTeamPulse] Calling edge function:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          team_id: teamId,
          generation_type: 'manual'
        })
      });

      console.log('[useTeamPulse] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[useTeamPulse] Error response:', errorData);
        throw new Error(errorData.error || `Generation failed with status ${response.status}`);
      }

      const result = await response.json();
      console.log('[useTeamPulse] Success response:', result);

      if (result.snapshot?.infographic_error) {
        console.warn('[useTeamPulse] Infographic generation failed:', result.snapshot.infographic_error);
      }

      if (result.snapshot?.has_infographic) {
        console.log('[useTeamPulse] Infographic generated successfully!');
      }

      if (result.success) {
        await refreshSnapshot();
        return true;
      } else {
        throw new Error(result.error || 'Generation failed');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate Team Pulse';
      console.error('[useTeamPulse] Error generating pulse:', err);
      setError(errorMsg);
      return false;
    } finally {
      setGenerating(false);
    }
  }, [teamId, user, refreshSnapshot]);

  useEffect(() => {
    if (teamId) {
      refreshSnapshot();
    } else {
      setLoading(false);
    }
  }, [teamId, refreshSnapshot]);

  useEffect(() => {
    if (!teamId) return;

    const channel = supabase
      .channel('team_pulse_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_pulse_snapshots',
          filter: `team_id=eq.${teamId}`
        },
        () => {
          fetchCurrentSnapshot();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, fetchCurrentSnapshot]);

  return {
    currentSnapshot,
    settings,
    history,
    loading,
    generating,
    error,
    generatePulse,
    refreshSnapshot,
    loadHistory
  };
}
