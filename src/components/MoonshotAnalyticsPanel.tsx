import React, { useState, useEffect } from 'react';
import {
  Rocket, Users, Mail, BarChart3, Download, Search,
  ChevronDown, ChevronUp, CheckCircle, Clock, XCircle,
  TrendingUp, Calendar
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

interface Registration {
  id: string;
  name: string;
  email: string;
  team_name: string;
  industry: string;
  created_at: string;
  survey_response?: {
    current_ai_usage: string;
    ai_use_cases: string[];
    monthly_ai_spend: string;
    connected_data: string;
    biggest_pain_points: string;
  };
  invite_code?: {
    code: string;
    is_redeemed: boolean;
    redeemed_at?: string;
  };
}

interface MoonshotStats {
  totalRegistrations: number;
  uniqueEmails: number;
  redeemedCodes: number;
  registrationsByIndustry: Record<string, number>;
  registrationsByAiUsage: Record<string, number>;
  registrationsBySpend: Record<string, number>;
  registrationsByDay: Array<{ date: string; count: number }>;
}

export const MoonshotAnalyticsPanel: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [stats, setStats] = useState<MoonshotStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'created_at' | 'name' | 'email' | 'industry'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: regs, error: regsError } = await supabase
        .from('moonshot_registrations')
        .select(`
          id,
          name,
          email,
          team_name,
          industry,
          created_at,
          moonshot_survey_responses (
            current_ai_usage,
            ai_use_cases,
            monthly_ai_spend,
            connected_data,
            biggest_pain_points
          ),
          moonshot_invite_codes (
            code,
            is_redeemed,
            redeemed_at
          )
        `)
        .order('created_at', { ascending: false });

      if (regsError) throw regsError;

      const registrationsData: Registration[] = (regs || []).map(r => ({
        id: r.id,
        name: r.name,
        email: r.email,
        team_name: r.team_name,
        industry: r.industry,
        created_at: r.created_at,
        survey_response: r.moonshot_survey_responses?.[0] || undefined,
        invite_code: r.moonshot_invite_codes?.[0] || undefined
      }));

      setRegistrations(registrationsData);

      const uniqueEmails = new Set(registrationsData.map(r => r.email.toLowerCase())).size;
      const redeemedCodes = registrationsData.filter(r => r.invite_code?.is_redeemed).length;

      const industryCount: Record<string, number> = {};
      const aiUsageCount: Record<string, number> = {};
      const spendCount: Record<string, number> = {};
      const dayCount: Record<string, number> = {};

      registrationsData.forEach(r => {
        industryCount[r.industry] = (industryCount[r.industry] || 0) + 1;

        if (r.survey_response) {
          aiUsageCount[r.survey_response.current_ai_usage] =
            (aiUsageCount[r.survey_response.current_ai_usage] || 0) + 1;
          spendCount[r.survey_response.monthly_ai_spend] =
            (spendCount[r.survey_response.monthly_ai_spend] || 0) + 1;
        }

        const day = format(new Date(r.created_at), 'yyyy-MM-dd');
        dayCount[day] = (dayCount[day] || 0) + 1;
      });

      const registrationsByDay = Object.entries(dayCount)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setStats({
        totalRegistrations: registrationsData.length,
        uniqueEmails,
        redeemedCodes,
        registrationsByIndustry: industryCount,
        registrationsByAiUsage: aiUsageCount,
        registrationsBySpend: spendCount,
        registrationsByDay
      });
    } catch (err) {
      console.error('Error fetching moonshot data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: typeof sortField) => {
    if (field === sortField) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredRegistrations = registrations
    .filter(r => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.team_name.toLowerCase().includes(q) ||
        r.industry.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let aVal: string, bVal: string;
      switch (sortField) {
        case 'name': aVal = a.name; bVal = b.name; break;
        case 'email': aVal = a.email; bVal = b.email; break;
        case 'industry': aVal = a.industry; bVal = b.industry; break;
        default: aVal = a.created_at; bVal = b.created_at;
      }
      const cmp = aVal.localeCompare(bVal);
      return sortDirection === 'asc' ? cmp : -cmp;
    });

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Team', 'Industry', 'Registered', 'Invite Code', 'Redeemed', 'AI Usage', 'Monthly Spend', 'Pain Points'];
    const rows = registrations.map(r => [
      r.name,
      r.email,
      r.team_name,
      r.industry,
      format(new Date(r.created_at), 'yyyy-MM-dd HH:mm'),
      r.invite_code?.code || '',
      r.invite_code?.is_redeemed ? 'Yes' : 'No',
      r.survey_response?.current_ai_usage || '',
      r.survey_response?.monthly_ai_spend || '',
      r.survey_response?.biggest_pain_points?.replace(/"/g, '""') || ''
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moonshot-registrations-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const AI_USAGE_LABELS: Record<string, string> = {
    none: 'Not using AI yet',
    experimenting: 'Experimenting',
    regular: 'Regular user',
    integrated: 'Integrated',
    advanced: 'Advanced'
  };

  const SPEND_LABELS: Record<string, string> = {
    '0': '$0',
    '1-100': '$1-100',
    '100-500': '$100-500',
    '500-1000': '$500-1000',
    '1000+': '$1000+'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Rocket className="w-6 h-6 text-orange-400" />
          Moonshot Challenge Registrations
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
          >
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
            <Users className="w-4 h-4" />
            Total Registrations
          </div>
          <div className="text-3xl font-bold text-white">{stats?.totalRegistrations || 0}</div>
        </div>
        <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
            <Mail className="w-4 h-4" />
            Unique Emails
          </div>
          <div className="text-3xl font-bold text-white">{stats?.uniqueEmails || 0}</div>
        </div>
        <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
            <CheckCircle className="w-4 h-4" />
            Codes Redeemed
          </div>
          <div className="text-3xl font-bold text-emerald-400">{stats?.redeemedCodes || 0}</div>
        </div>
        <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
            <TrendingUp className="w-4 h-4" />
            Conversion Rate
          </div>
          <div className="text-3xl font-bold text-orange-400">
            {stats && stats.uniqueEmails > 0
              ? `${Math.round((stats.redeemedCodes / stats.uniqueEmails) * 100)}%`
              : '0%'
            }
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            By Industry
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {Object.entries(stats?.registrationsByIndustry || {})
              .sort((a, b) => b[1] - a[1])
              .map(([industry, count]) => (
                <div key={industry} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 truncate">{industry}</span>
                  <span className="text-white font-medium ml-2">{count}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            By AI Usage Level
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {Object.entries(stats?.registrationsByAiUsage || {})
              .sort((a, b) => b[1] - a[1])
              .map(([usage, count]) => (
                <div key={usage} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 truncate">{AI_USAGE_LABELS[usage] || usage}</span>
                  <span className="text-white font-medium ml-2">{count}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            By Monthly Spend
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {Object.entries(stats?.registrationsBySpend || {})
              .sort((a, b) => b[1] - a[1])
              .map(([spend, count]) => (
                <div key={spend} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 truncate">{SPEND_LABELS[spend] || spend}</span>
                  <span className="text-white font-medium ml-2">{count}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Registrations Over Time
        </h3>
        <div className="flex items-end gap-1 h-24">
          {stats?.registrationsByDay.slice(-30).map((day, idx) => {
            const maxCount = Math.max(...(stats?.registrationsByDay.map(d => d.count) || [1]));
            const height = (day.count / maxCount) * 100;
            return (
              <div
                key={day.date}
                className="flex-1 bg-orange-500 rounded-t hover:bg-orange-400 transition-colors"
                style={{ height: `${Math.max(height, 4)}%` }}
                title={`${day.date}: ${day.count} registrations`}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Last 30 days</span>
          <span>Today</span>
        </div>
      </div>

      <div className="bg-gray-700/50 rounded-xl border border-gray-600">
        <div className="p-4 border-b border-gray-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-gray-300">
            All Registrations ({filteredRegistrations.length})
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-full sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-600">
                <th
                  className="text-left py-3 px-4 text-sm font-semibold text-gray-400 cursor-pointer hover:text-white"
                  onClick={() => handleSort('name')}
                >
                  Name
                </th>
                <th
                  className="text-left py-3 px-4 text-sm font-semibold text-gray-400 cursor-pointer hover:text-white"
                  onClick={() => handleSort('email')}
                >
                  Email
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Team</th>
                <th
                  className="text-left py-3 px-4 text-sm font-semibold text-gray-400 cursor-pointer hover:text-white"
                  onClick={() => handleSort('industry')}
                >
                  Industry
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Code</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Status</th>
                <th
                  className="text-left py-3 px-4 text-sm font-semibold text-gray-400 cursor-pointer hover:text-white"
                  onClick={() => handleSort('created_at')}
                >
                  Registered
                </th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistrations.map(reg => (
                <React.Fragment key={reg.id}>
                  <tr
                    className="border-b border-gray-700 hover:bg-gray-700/30 cursor-pointer"
                    onClick={() => setExpandedRow(expandedRow === reg.id ? null : reg.id)}
                  >
                    <td className="py-3 px-4 text-sm text-white">{reg.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">{reg.email}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">{reg.team_name}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">{reg.industry}</td>
                    <td className="py-3 px-4 text-sm font-mono text-orange-400">{reg.invite_code?.code || '-'}</td>
                    <td className="py-3 px-4">
                      {reg.invite_code?.is_redeemed ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Redeemed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-400 text-sm">
                          <Clock className="w-4 h-4" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {format(new Date(reg.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="py-3 px-4">
                      {expandedRow === reg.id ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </td>
                  </tr>
                  {expandedRow === reg.id && reg.survey_response && (
                    <tr className="bg-gray-800/50">
                      <td colSpan={8} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500 mb-1">AI Usage Level</div>
                            <div className="text-white">{AI_USAGE_LABELS[reg.survey_response.current_ai_usage] || reg.survey_response.current_ai_usage}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 mb-1">Monthly Spend</div>
                            <div className="text-white">{SPEND_LABELS[reg.survey_response.monthly_ai_spend] || reg.survey_response.monthly_ai_spend}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 mb-1">Connected Data</div>
                            <div className="text-white capitalize">{reg.survey_response.connected_data}</div>
                          </div>
                          <div className="md:col-span-2 lg:col-span-3">
                            <div className="text-gray-500 mb-1">AI Use Cases</div>
                            <div className="flex flex-wrap gap-2">
                              {reg.survey_response.ai_use_cases?.map((uc, idx) => (
                                <span key={idx} className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                                  {uc}
                                </span>
                              ))}
                            </div>
                          </div>
                          {reg.survey_response.biggest_pain_points && (
                            <div className="md:col-span-2 lg:col-span-3">
                              <div className="text-gray-500 mb-1">Pain Points</div>
                              <div className="text-gray-300 bg-gray-700/50 p-3 rounded-lg">
                                {reg.survey_response.biggest_pain_points}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filteredRegistrations.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    {searchQuery ? 'No registrations match your search' : 'No registrations yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
