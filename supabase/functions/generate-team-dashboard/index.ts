import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TeamDashboardData {
  team_info: {
    team_id: string;
    team_name: string;
    created_at: string;
  };
  strategy_content: Array<{ file_name: string; content: string; date: string }>;
  meeting_content: Array<{ file_name: string; content: string; date: string }>;
  financial_content: Array<{ file_name: string; content: string; date: string }>;
  project_content: Array<{ file_name: string; content: string; date: string }>;
  operational_content: Array<{ file_name: string; content: string; date: string }>;
  general_content: Array<{ file_name: string; content: string; category: string; date: string }>;
  team_discussions: Array<{ user_name: string; message: string; date: string }>;
  recent_reports: Array<{ prompt: string; response: string; date: string }>;
  category_summary: Array<{ category: string; document_count: number; recent_count: number }>;
  member_info: {
    total_members: number;
    members: Array<{ name: string; role: string }>;
  };
  previous_snapshot: {
    generated_at?: string;
    goals_progress?: any;
    alignment_metrics?: any;
    health_overview?: any;
  };
  generated_at: string;
}

interface GoalItem {
  name: string;
  type: 'goal' | 'okr' | 'target' | 'milestone' | 'project' | 'kpi';
  status: 'on_track' | 'at_risk' | 'blocked' | 'not_started' | 'completed';
  progress_percentage: number | null;
  notes: string;
  source_reference: string;
  deadline?: string;
  owner?: string;
}

interface GoalsProgress {
  has_data: boolean;
  items: GoalItem[];
  suggestions: string[];
}

interface AlignmentMetrics {
  has_data: boolean;
  mission_statement: string | null;
  core_values: string[];
  alignment_score: number | null;
  alignment_examples: Array<{ type: 'aligned' | 'misaligned'; description: string }>;
  recommendations: string[];
  suggestions: string[];
}

interface HealthFactor {
  name: string;
  score: number;
  explanation: string;
  trend: 'up' | 'down' | 'stable';
}

interface HealthOverview {
  overall_score: number | null;
  factors: HealthFactor[];
  trend_vs_previous: 'improving' | 'declining' | 'stable' | 'first_snapshot';
  explanation: string;
  recommendations: string[];
}

interface DashboardAnalysis {
  goals_progress: GoalsProgress;
  alignment_metrics: AlignmentMetrics;
  health_overview: HealthOverview;
  data_sufficiency: {
    goals: boolean;
    alignment: boolean;
    health: boolean;
  };
}

async function analyzeTeamData(data: TeamDashboardData, apiKey: string, customInstructions?: string): Promise<DashboardAnalysis> {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const totalDocuments = data.category_summary.reduce((sum, c) => sum + c.document_count, 0);
  const recentDocuments = data.category_summary.reduce((sum, c) => sum + (c.recent_count || 0), 0);
  const hasStrategyData = data.strategy_content.length > 0;
  const hasMeetingData = data.meeting_content.length > 0;
  const hasFinancialData = data.financial_content.length > 0;
  const hasProjectData = data.project_content.length > 0;

  const prompt = `You are a business analyst creating a daily "Team Dashboard" for ${data.team_info.team_name}. Today is ${dateStr}.

Your job is to extract and analyze THREE key areas from the team's data:
1. GOALS, TARGETS, AND PROJECTS PROGRESS
2. MISSION AND CORE VALUES ALIGNMENT
3. TEAM HEALTH OVERVIEW

TEAM: ${data.team_info.team_name}
TEAM SIZE: ${data.member_info.total_members} members
TOTAL DOCUMENTS: ${totalDocuments} (${recentDocuments} updated in last 30 days)

=== STRATEGY DOCUMENTS (Primary source for Mission, Vision, Goals, OKRs) ===
${data.strategy_content.map(s => `[${s.file_name}] Date: ${s.date || 'Unknown'}\n${s.content}`).join('\n\n') || 'No strategy documents'}

=== MEETING NOTES (Key source for goal discussions, progress updates, blockers) ===
${data.meeting_content.map(m => `[${m.file_name}] Date: ${m.date || 'Unknown'}\n${m.content}`).join('\n\n') || 'No meeting data'}

=== FINANCIAL DOCUMENTS (Budget targets, revenue goals) ===
${data.financial_content.map(f => `[${f.file_name}] Date: ${f.date || 'Unknown'}\n${f.content}`).join('\n\n') || 'No financial data'}

=== PROJECT DOCUMENTS (Milestones, deliverables) ===
${data.project_content.map(p => `[${p.file_name}] Date: ${p.date || 'Unknown'}\n${p.content}`).join('\n\n') || 'No project data'}

=== OPERATIONAL DOCUMENTS ===
${data.operational_content.map(o => `[${o.file_name}] Date: ${o.date || 'Unknown'}\n${o.content}`).join('\n\n') || 'No operational data'}

=== TEAM DISCUSSIONS (from AI chat) ===
${data.team_discussions.map(t => `${t.user_name}: ${t.message}`).join('\n') || 'No discussions'}

=== RECENT AI REPORTS ===
${data.recent_reports.map(r => `Q: ${r.prompt}\nA: ${r.response}`).join('\n\n') || 'No reports'}

=== PREVIOUS DASHBOARD (for trend comparison) ===
${data.previous_snapshot.generated_at ? `Previous dashboard: ${data.previous_snapshot.generated_at}` : 'First dashboard snapshot'}

${customInstructions ? `=== CUSTOM INSTRUCTIONS FROM ADMIN ===
The team admin has provided these specific instructions for generating this dashboard. Follow these directions while maintaining the required JSON structure:
${customInstructions}
` : ''}
Provide JSON response with this EXACT structure:
{
  "goals_progress": {
    "has_data": <true if you found ANY goals, targets, OKRs, milestones, projects, or KPIs in the data>,
    "items": [
      {
        "name": "<specific goal/target/project name>",
        "type": "<goal|okr|target|milestone|project|kpi>",
        "status": "<on_track|at_risk|blocked|not_started|completed>",
        "progress_percentage": <0-100 or null if unknown>,
        "notes": "<current status details, blockers, recent progress>",
        "source_reference": "<file name where this was found>",
        "deadline": "<deadline if mentioned or null>",
        "owner": "<responsible person if mentioned or null>"
      }
    ],
    "suggestions": ["<suggestion if has_data is false>"]
  },
  "alignment_metrics": {
    "has_data": <true if you found a mission statement OR core values>,
    "mission_statement": "<extracted mission statement or null>",
    "core_values": ["<value 1>", "<value 2>"],
    "alignment_score": <0-100 score based on how team activities align with mission, or null if no mission found>,
    "alignment_examples": [
      {"type": "aligned", "description": "<specific example of mission-aligned activity>"},
      {"type": "misaligned", "description": "<specific example of misalignment if any>"}
    ],
    "recommendations": ["<recommendation for better alignment>"],
    "suggestions": ["<suggestion if has_data is false>"]
  },
  "health_overview": {
    "overall_score": <0-100 overall health score>,
    "factors": [
      {"name": "Data Richness", "score": <0-100>, "explanation": "<brief explanation - keep under 15 words>", "trend": "<up|down|stable>"},
      {"name": "Goal Progress", "score": <0-100>, "explanation": "<brief explanation - keep under 15 words>", "trend": "<up|down|stable>"},
      {"name": "Team Engagement", "score": <0-100 based on discussions/activity>, "explanation": "<brief explanation - keep under 15 words>", "trend": "<up|down|stable>"},
      {"name": "Meeting Cadence", "score": <0-100 based on meeting frequency/quality>, "explanation": "<brief explanation - keep under 15 words>", "trend": "<up|down|stable>"},
      {"name": "Financial Health", "score": <0-100 or null if no data>, "explanation": "<brief explanation - keep under 15 words>", "trend": "<up|down|stable>"},
      {"name": "Risk Indicators", "score": <0-100 higher is better/fewer risks>, "explanation": "<brief explanation - keep under 15 words>", "trend": "<up|down|stable>"}
    ],
    "trend_vs_previous": "<improving|declining|stable|first_snapshot>",
    "explanation": "<2-3 sentence summary of overall team health status and key observations>",
    "recommendations": [
      "<actionable recommendation 1 based on lowest-scoring factors or identified risks>",
      "<actionable recommendation 2 for improving team health>",
      "<actionable recommendation 3 - specific and practical>"
    ]
  },
  "data_sufficiency": {
    "goals": <true if enough data to analyze goals>,
    "alignment": <true if mission/values found>,
    "health": <true - always have some health data if team exists>
  }
}

CRITICAL RULES:
1. EXTRACT SPECIFIC GOALS: Look for any mention of goals, OKRs, targets, milestones, KPIs, quotas, deadlines, or project objectives. Extract them even if progress is unclear.
2. FIND MISSION/VALUES: Search all documents for mission statements, vision, core values, guiding principles, or company culture definitions.
3. BE SPECIFIC: Use actual names, numbers, and details from the documents. Don't generalize.
4. ASSESS PROGRESS FROM MEETINGS: Meeting notes often contain progress updates - use these to determine goal status.
5. SCORE HEALTH HONESTLY: Base scores on actual data quality and activity, not assumptions.
6. If data is insufficient for a section, set has_data to false and provide helpful suggestions.

Respond ONLY with valid JSON.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8192
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const analysis = JSON.parse(jsonMatch[0]) as DashboardAnalysis;
    
    if (!analysis.goals_progress) {
      analysis.goals_progress = {
        has_data: false,
        items: [],
        suggestions: [
          'Add strategy documents that outline your quarterly goals or OKRs',
          'Include meeting notes where you discuss project milestones',
          'Upload documents mentioning specific targets or deadlines'
        ]
      };
    }

    if (!analysis.alignment_metrics) {
      analysis.alignment_metrics = {
        has_data: false,
        mission_statement: null,
        core_values: [],
        alignment_score: null,
        alignment_examples: [],
        recommendations: [],
        suggestions: [
          'Add a document that contains your company or team mission statement',
          'Include your Core Values in strategy documents',
          'Discuss mission alignment in team meetings for Astra to track'
        ]
      };
    }

    if (!analysis.health_overview) {
      analysis.health_overview = {
        overall_score: 50,
        factors: [
          { name: 'Data Richness', score: totalDocuments > 0 ? 60 : 20, explanation: `${totalDocuments} documents connected`, trend: 'stable' },
          { name: 'Goal Progress', score: 50, explanation: 'Insufficient goal data', trend: 'stable' },
          { name: 'Team Engagement', score: data.team_discussions.length > 0 ? 70 : 30, explanation: `${data.team_discussions.length} team discussions`, trend: 'stable' },
          { name: 'Meeting Cadence', score: hasMeetingData ? 70 : 30, explanation: hasMeetingData ? 'Regular meetings detected' : 'No meeting data', trend: 'stable' },
          { name: 'Financial Health', score: hasFinancialData ? 60 : 0, explanation: hasFinancialData ? 'Financial data available' : 'No financial data', trend: 'stable' },
          { name: 'Risk Indicators', score: 70, explanation: 'No significant risks detected', trend: 'stable' }
        ],
        trend_vs_previous: data.previous_snapshot.generated_at ? 'stable' : 'first_snapshot',
        explanation: 'Team health metrics are being established as more data is connected.',
        recommendations: [
          'Connect more data sources to improve analysis accuracy',
          'Add strategy documents with goals and OKRs',
          'Ensure meeting notes are synced regularly'
        ]
      };
    }

    if (!analysis.data_sufficiency) {
      analysis.data_sufficiency = {
        goals: analysis.goals_progress.has_data,
        alignment: analysis.alignment_metrics.has_data,
        health: true
      };
    }

    return analysis;
  } catch (error) {
    console.error('Error in team data analysis:', error);
    
    return {
      goals_progress: {
        has_data: false,
        items: [],
        suggestions: [
          'Add strategy documents that outline your quarterly goals or OKRs',
          'Include meeting notes where you discuss project milestones',
          'Upload documents mentioning specific targets or deadlines'
        ]
      },
      alignment_metrics: {
        has_data: false,
        mission_statement: null,
        core_values: [],
        alignment_score: null,
        alignment_examples: [],
        recommendations: [],
        suggestions: [
          'Add a document that contains your company or team mission statement',
          'Include your Core Values in strategy documents'
        ]
      },
      health_overview: {
        overall_score: 50,
        factors: [
          { name: 'Data Richness', score: totalDocuments > 0 ? 60 : 20, explanation: `${totalDocuments} documents connected`, trend: 'stable' as const },
          { name: 'Goal Progress', score: 50, explanation: 'Analysis unavailable', trend: 'stable' as const },
          { name: 'Team Engagement', score: data.team_discussions.length > 0 ? 70 : 30, explanation: `${data.team_discussions.length} discussions`, trend: 'stable' as const },
          { name: 'Meeting Cadence', score: hasMeetingData ? 70 : 30, explanation: hasMeetingData ? 'Meetings detected' : 'No meeting data', trend: 'stable' as const },
          { name: 'Financial Health', score: hasFinancialData ? 60 : 0, explanation: hasFinancialData ? 'Data available' : 'No data', trend: 'stable' as const },
          { name: 'Risk Indicators', score: 70, explanation: 'No risks detected', trend: 'stable' as const }
        ],
        trend_vs_previous: 'first_snapshot',
        explanation: 'Dashboard metrics will improve as more data is connected and analyzed.',
        recommendations: [
          'Connect more data sources to improve analysis accuracy',
          'Add strategy documents with goals and OKRs',
          'Ensure meeting notes are synced regularly'
        ]
      },
      data_sufficiency: {
        goals: false,
        alignment: false,
        health: true
      }
    };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { team_id, generation_type = 'manual', custom_instructions } = await req.json();

    if (!team_id) {
      return new Response(
        JSON.stringify({ error: 'team_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating Team Dashboard for team ${team_id}`);

    let effectiveInstructions = custom_instructions;
    if (!effectiveInstructions) {
      const { data: settingsData } = await supabase
        .from('team_dashboard_settings')
        .select('custom_instructions')
        .eq('team_id', team_id)
        .maybeSingle();

      if (settingsData?.custom_instructions) {
        effectiveInstructions = settingsData.custom_instructions;
      }
    }

    const { data: dashboardData, error: dataError } = await supabase.rpc('get_team_dashboard_data', {
      p_team_id: team_id
    });

    if (dataError) {
      console.error('Error getting dashboard data:', dataError);
      return new Response(
        JSON.stringify({ error: 'Failed to get team data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const teamData = dashboardData as TeamDashboardData;
    console.log(`Got team data for ${teamData.team_info.team_name}`);

    console.log('Analyzing team data with gemini-3-flash-preview...');
    if (effectiveInstructions) {
      console.log('Using custom instructions:', effectiveInstructions.substring(0, 100) + '...');
    }
    const analysis = await analyzeTeamData(teamData, geminiApiKey, effectiveInstructions);
    console.log('Analysis complete.');

    await supabase
      .from('team_dashboard_snapshots')
      .update({ is_current: false })
      .eq('team_id', team_id)
      .eq('is_current', true);

    const { data: snapshot, error: snapshotError } = await supabase
      .from('team_dashboard_snapshots')
      .insert({
        team_id,
        goals_progress: analysis.goals_progress,
        alignment_metrics: analysis.alignment_metrics,
        health_overview: analysis.health_overview,
        data_sufficiency: analysis.data_sufficiency,
        source_data_summary: {
          category_summary: teamData.category_summary,
          member_info: teamData.member_info,
          documents_analyzed: teamData.category_summary.reduce((sum, c) => sum + c.document_count, 0)
        },
        generated_by_user_id: generation_type === 'manual' ? user.id : null,
        generation_type,
        is_current: true
      })
      .select()
      .single();

    if (snapshotError) {
      console.error('Error creating snapshot:', snapshotError);
      return new Response(
        JSON.stringify({ error: 'Failed to save snapshot' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(now.getUTCDate() + 1);
    tomorrow.setUTCHours(5, 0, 0, 0);

    await supabase
      .from('team_dashboard_settings')
      .upsert({
        team_id,
        is_enabled: true,
        last_generated_at: new Date().toISOString(),
        next_generation_at: tomorrow.toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'team_id' });

    console.log('Team Dashboard generation complete');

    return new Response(
      JSON.stringify({
        success: true,
        snapshot: {
          id: snapshot.id,
          generated_at: snapshot.generated_at,
          goals_progress: analysis.goals_progress,
          alignment_metrics: analysis.alignment_metrics,
          health_overview: analysis.health_overview,
          data_sufficiency: analysis.data_sufficiency
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-team-dashboard:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});