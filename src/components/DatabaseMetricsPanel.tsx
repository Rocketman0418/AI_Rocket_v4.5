import React, { useState, useEffect, useCallback } from 'react';
import {
  HardDrive, Activity, AlertTriangle, RefreshCw, Download,
  CheckCircle, AlertCircle, Database, Calendar, TrendingUp,
  ArrowUpDown, Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

interface DocumentChunksHealth {
  total_rows: number;
  active_rows: number;
  unique_documents: number;
  total_size: string;
  index_size: string;
  rows_per_team: Record<string, number>;
  oldest_modified: string;
  newest_modified: string;
}

interface TeamStats {
  team_id: string;
  team_name: string;
  doc_count: number;
  chunk_count: number;
}

interface TeamStorageStats {
  teamId: string;
  teamName: string;
  docCount: number;
  recordCount: number;
  percentage: string;
}

interface HealthWarning {
  level: 'warning' | 'critical' | 'info';
  message: string;
}

type SortField = 'documents' | 'records';
type SortDirection = 'asc' | 'desc';

export function DatabaseMetricsPanel() {
  const [metrics, setMetrics] = useState<DocumentChunksHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
  const [docs24h, setDocs24h] = useState<number>(0);
  const [sortField, setSortField] = useState<SortField>('records');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const fetchMetrics = useCallback(async (skipCache = false) => {
    try {
      setLoading(true);
      setError(null);

      const now = Date.now();
      const cacheKey = 'db_metrics_cache';
      const cacheTimeKey = 'db_metrics_cache_time';

      if (!skipCache) {
        const cachedData = sessionStorage.getItem(cacheKey);
        const cachedTime = sessionStorage.getItem(cacheTimeKey);

        if (cachedData && cachedTime) {
          const timeDiff = now - parseInt(cachedTime);
          if (timeDiff < 60000) {
            setMetrics(JSON.parse(cachedData));
            setLastUpdated(new Date(parseInt(cachedTime)));
            setLoading(false);
            return;
          }
        }
      }

      const { data, error: rpcError } = await supabase.rpc('get_document_chunks_health');

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      if (!data || data.length === 0) {
        throw new Error('No metrics data returned');
      }

      const metricsData = data[0] as DocumentChunksHealth;
      setMetrics(metricsData);
      setLastUpdated(new Date(now));

      sessionStorage.setItem(cacheKey, JSON.stringify(metricsData));
      sessionStorage.setItem(cacheTimeKey, now.toString());

      const [teamStatsResult, docs24hResult] = await Promise.all([
        supabase.rpc('get_admin_team_document_stats'),
        supabase.rpc('get_documents_synced_last_24h')
      ]);

      if (teamStatsResult.data) {
        setTeamStats(teamStatsResult.data);
      }

      if (docs24hResult.data !== null) {
        setDocs24h(docs24hResult.data);
      }

    } catch (err) {
      console.error('Error fetching database metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMetrics(true);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchMetrics]);

  const handleRefresh = () => {
    fetchMetrics(true);
  };

  const calculateHealth = (): { percentage: number; status: string; color: string } => {
    if (!metrics) return { percentage: 0, status: 'Unknown', color: 'gray' };

    const percentage = (metrics.active_rows / metrics.total_rows) * 100;

    if (percentage >= 95) return { percentage, status: 'Excellent', color: 'green' };
    if (percentage >= 80) return { percentage, status: 'Good', color: 'yellow' };
    return { percentage, status: 'Needs Attention', color: 'red' };
  };

  const getWarnings = (): HealthWarning[] => {
    if (!metrics) return [];

    const warnings: HealthWarning[] = [];
    const sizeMB = parseInt(metrics.total_size);

    if (metrics.total_rows > 500000) {
      warnings.push({
        level: 'critical',
        message: `Database size critical: ${metrics.total_rows.toLocaleString()} rows requires immediate attention`
      });
    } else if (metrics.total_rows > 100000) {
      warnings.push({
        level: 'warning',
        message: `Approaching 100K document limit: ${metrics.total_rows.toLocaleString()} rows`
      });
    }

    if (sizeMB > 2000) {
      warnings.push({
        level: 'warning',
        message: `Storage exceeding 2GB: ${metrics.total_size}`
      });
    }

    if (warnings.length === 0) {
      warnings.push({
        level: 'info',
        message: 'AI Data Sync is optimal'
      });
    }

    return warnings;
  };

  const getTeamStats = (): TeamStorageStats[] => {
    if (!metrics || teamStats.length === 0) return [];

    const totalRecords = teamStats.reduce((sum, stat) => sum + stat.chunk_count, 0);

    const stats = teamStats.map((stat) => {
      const percentage = totalRecords > 0
        ? ((stat.chunk_count / totalRecords) * 100).toFixed(1)
        : '0.0';

      return {
        teamId: stat.team_id,
        teamName: stat.team_name || 'Unknown Team',
        docCount: stat.doc_count,
        recordCount: stat.chunk_count,
        percentage
      };
    });

    return stats.sort((a, b) => {
      const aVal = sortField === 'documents' ? a.docCount : a.recordCount;
      const bVal = sortField === 'documents' ? b.docCount : b.recordCount;
      return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
    });
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatSizeToGB = (sizeStr: string): string => {
    const match = sizeStr.match(/(\d+(?:\.\d+)?)\s*(MB|GB|KB|bytes)/i);
    if (!match) return sizeStr;

    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();

    let gbValue: number;
    if (unit === 'GB') {
      gbValue = value;
    } else if (unit === 'MB') {
      gbValue = value / 1024;
    } else if (unit === 'KB') {
      gbValue = value / (1024 * 1024);
    } else {
      gbValue = value / (1024 * 1024 * 1024);
    }

    return `${gbValue.toFixed(1)} GB`;
  };

  const exportToCSV = () => {
    if (!metrics) return;

    const stats = getTeamStats();
    const rows = [
      ['Team Name', 'Team ID', 'Documents', 'Records', 'Percentage of Total'],
      ...stats.map(stat => [
        stat.teamName,
        stat.teamId,
        stat.docCount.toString(),
        stat.recordCount.toString(),
        `${stat.percentage}%`
      ])
    ];

    const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `database-metrics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading database metrics...</p>
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Metrics</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!metrics) return null;

  const health = calculateHealth();
  const warnings = getWarnings();
  const sortedTeamStats = getTeamStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-1">
            <Database className="w-6 h-6 text-blue-400" />
            Database Metrics
          </h2>
          {lastUpdated && (
            <p className="text-sm text-gray-400">
              Last updated: {format(lastUpdated, 'MMM dd, yyyy HH:mm:ss')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
            />
            Auto-refresh (5m)
          </label>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gray-700/50 rounded-lg p-5 border border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <HardDrive className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {(metrics.unique_documents || 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">Total Documents</div>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-5 border border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {metrics.total_rows.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">Total Records</div>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-5 border border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <Database className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {formatSizeToGB(metrics.total_size)}
          </div>
          <div className="text-sm text-gray-400">Database Size</div>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-5 border border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-orange-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {formatSizeToGB(metrics.index_size)}
          </div>
          <div className="text-sm text-gray-400">Index Size</div>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-5 border border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {docs24h.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">Last 24 Hours</div>
        </div>
      </div>

      <div className="bg-gray-700/50 rounded-lg p-5 border border-gray-600">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-400" />
          Sync Health
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">Status: {health.status}</span>
            <span className="text-white font-semibold">{health.percentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                health.color === 'green' ? 'bg-green-500' :
                health.color === 'yellow' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${health.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((warning, index) => (
            <div
              key={index}
              className={`rounded-lg p-4 flex items-start gap-3 border ${
                warning.level === 'critical'
                  ? 'bg-red-900/20 border-red-500'
                  : warning.level === 'warning'
                  ? 'bg-yellow-900/20 border-yellow-500'
                  : 'bg-blue-900/20 border-blue-500'
              }`}
            >
              {warning.level === 'critical' ? (
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              ) : warning.level === 'warning' ? (
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm ${
                warning.level === 'critical'
                  ? 'text-red-200'
                  : warning.level === 'warning'
                  ? 'text-yellow-200'
                  : 'text-blue-200'
              }`}>
                {warning.message}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gray-700/50 rounded-lg p-5 border border-gray-600">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-blue-400" />
            Storage by Team ({sortedTeamStats.length})
          </h3>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Team Name</th>
                <th
                  className="text-right py-3 px-4 text-sm font-semibold text-gray-400 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('documents')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Documents
                    <ArrowUpDown className={`w-3.5 h-3.5 ${sortField === 'documents' ? 'text-blue-400' : 'text-gray-500'}`} />
                  </div>
                </th>
                <th
                  className="text-right py-3 px-4 text-sm font-semibold text-gray-400 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('records')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Records
                    <ArrowUpDown className={`w-3.5 h-3.5 ${sortField === 'records' ? 'text-blue-400' : 'text-gray-500'}`} />
                  </div>
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">% of Total</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Distribution</th>
              </tr>
            </thead>
            <tbody>
              {sortedTeamStats.map((stat) => (
                <tr key={stat.teamId} className="border-b border-gray-700/50 hover:bg-gray-600/30">
                  <td className="py-3 px-4 text-sm text-white">{stat.teamName}</td>
                  <td className="py-3 px-4 text-sm text-white text-right font-mono">
                    {stat.docCount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-white text-right font-mono">
                    {stat.recordCount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-300 text-right font-mono">
                    {stat.percentage}%
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-full bg-gray-600 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${stat.percentage}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-700/50 rounded-lg p-5 border border-gray-600">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-400" />
          Document Coverage Period
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm">
          <div>
            <span className="text-gray-400">Oldest: </span>
            <span className="text-white font-mono">
              {format(new Date(metrics.oldest_modified), 'MMM dd, yyyy')}
            </span>
          </div>
          <div className="hidden sm:block text-gray-600">→</div>
          <div>
            <span className="text-gray-400">Newest: </span>
            <span className="text-white font-mono">
              {format(new Date(metrics.newest_modified), 'MMM dd, yyyy')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
