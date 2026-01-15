import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DashboardData {
  mission_alignment: {
    mission_statement: string;
    core_values: string[];
    alignment_score: number;
    alignment_examples: Array<{ type: 'aligned' | 'misaligned'; description: string }>;
    key_improvement: string;
  };
  goals_targets: {
    items: Array<{
      name: string;
      type: string;
      status: string;
      progress_percentage: number | null;
      deadline?: string;
      owner?: string;
      notes?: string;
    }>;
  };
  team_health: {
    overall_score: number;
    trend: string;
    metrics: {
      data_richness: { score: number; trend: string; explanation?: string };
      goal_progress: { score: number; trend: string; explanation?: string };
      team_engagement: { score: number; trend: string; explanation?: string };
      meeting_cadence: { score: number; trend: string; explanation?: string };
      financial_health: { score: number; trend: string; explanation?: string };
      risk_indicators: { score: number; trend: string; explanation?: string };
    };
    summary_statement: string;
    recommendations: string[];
  };
}

async function callAstraWebhook(
  teamId: string,
  teamName: string,
  customInstructions: string | null,
  storedMission: string | null,
  storedValues: string[],
  n8nWebhookUrl: string,
  userId: string,
  userEmail: string,
  userName: string
): Promise<string> {
  console.log('[Stage 1] Calling Astra Intelligence Agent webhook...');

  const astraPrompt = `You are generating a Team Dashboard analysis for ${teamName}. Analyze all available team data and provide a comprehensive analysis.

${customInstructions ? `USER FOCUS AREAS:\n${customInstructions}\n\n` : ''}

CONTEXT:
${storedMission ? `- Team Mission: "${storedMission}"` : '- No mission statement on file'}
${storedValues.length > 0 ? `- Core Values: ${storedValues.join(', ')}` : ''}

Please analyze the team's documents and provide insights on:

1. MISSION & ALIGNMENT:
- What is the team's mission statement? (use stored if accurate, or extract from documents)
- What are the core values? (use stored if accurate, or extract from documents)
- How well are recent activities aligned with the mission? Give specific examples.
- What could improve alignment?

2. GOALS & PROGRESS:
- What are the team's active goals, OKRs, rocks, or key projects?
- What is the status of each? (on track, at risk, blocked, completed)
- Any deadlines or owners mentioned?

3. TEAM HEALTH:
- How comprehensive is the connected data?
- How is goal progress overall?
- How engaged is the team based on collaboration patterns?
- Are meetings regular and productive?
- Any financial indicators or trajectory?
- Any risks, blockers, or concerns?
- What are your top recommendations?

Provide a thorough analysis with specific details from the documents.`;

  const webhookPayload = {
    chatInput: astraPrompt,
    user_id: userId,
    user_email: userEmail,
    user_name: userName,
    conversation_id: null,
    team_id: teamId,
    team_name: teamName,
    role: 'admin',
    view_financial: true,
    mode: 'private',
    original_message: astraPrompt,
    mentions: []
  };

  const webhookResponse = await fetch(n8nWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(webhookPayload)
  });

  if (!webhookResponse.ok) {
    const errorText = await webhookResponse.text();
    console.error('[Stage 1] Astra webhook error:', errorText);
    throw new Error(`Astra webhook error: ${webhookResponse.status}`);
  }

  const responseText = await webhookResponse.text();
  console.log('[Stage 1] Astra response received, length:', responseText.length);

  let astraAnalysis = responseText;
  try {
    const parsed = JSON.parse(responseText);
    if (parsed.response) {
      astraAnalysis = parsed.response;
    } else if (parsed.output) {
      astraAnalysis = typeof parsed.output === 'string' ? parsed.output : JSON.stringify(parsed.output);
    } else if (parsed.text) {
      astraAnalysis = parsed.text;
    }
  } catch {
    astraAnalysis = responseText;
  }

  console.log('[Stage 1] Astra analysis extracted, length:', astraAnalysis.length);
  return astraAnalysis;
}


async function extractStructuredData(
  astraAnalysis: string,
  storedMission: string | null,
  storedValues: string[],
  historicalScores: Array<{ date: string; score: number }>,
  apiKey: string
): Promise<DashboardData> {
  console.log('[Stage 2a] Extracting structured data with Gemini...');

  const dataPrompt = `Extract structured dashboard data from this team analysis. Return ONLY valid JSON, no other text.

TEAM ANALYSIS:
${astraAnalysis}

CONTEXT:
${storedMission ? `- Mission: "${storedMission}"` : ''}
${storedValues.length > 0 ? `- Values: ${storedValues.join(', ')}` : ''}
${historicalScores.length > 0 ? `- Historical scores: ${historicalScores.map(h => `${h.date}: ${h.score}`).join(', ')}` : ''}

IMPORTANT REQUIREMENTS:
- Include UP TO 4 alignment_examples (mix of aligned and misaligned)
- Include EXACTLY 5 goals in goals_targets.items (this is required - pick the 5 most important)
- Each goal MUST have a "notes" field with 1-2 sentences of context/details
- Include UP TO 4 recommendations
- The overall_score in team_health should be calculated as the average of all 6 metric scores

Return this exact JSON structure (fill in real data from the analysis):
{
  "mission_alignment": {
    "mission_statement": "the team's mission statement",
    "core_values": ["value1", "value2", "value3"],
    "alignment_score": 75,
    "alignment_examples": [
      {"type": "aligned", "description": "specific example of alignment"},
      {"type": "aligned", "description": "another alignment example"},
      {"type": "misaligned", "description": "specific misalignment example"},
      {"type": "misaligned", "description": "another misalignment example"}
    ],
    "key_improvement": "one improvement suggestion"
  },
  "goals_targets": {
    "items": [
      {"name": "Goal Name 1", "type": "Rock", "status": "On Track", "progress_percentage": 80, "deadline": "Q1 2026", "owner": "Owner Name", "notes": "Detailed context about this goal, current progress, and next steps."},
      {"name": "Goal Name 2", "type": "Project", "status": "At Risk", "progress_percentage": 50, "deadline": "Q2 2026", "owner": "Owner Name", "notes": "Explanation of what this project involves and why it's at risk."},
      {"name": "Goal Name 3", "type": "OKR", "status": "On Track", "progress_percentage": 65, "deadline": "Q1 2026", "owner": "Owner Name", "notes": "Key result details and measurement criteria."},
      {"name": "Goal Name 4", "type": "Milestone", "status": "Not Started", "progress_percentage": 0, "deadline": "Q3 2026", "owner": "Owner Name", "notes": "Description of this milestone and its importance."},
      {"name": "Goal Name 5", "type": "KPI", "status": "On Track", "progress_percentage": 90, "deadline": "Ongoing", "owner": "Owner Name", "notes": "Current metric performance and trend information."}
    ]
  },
  "team_health": {
    "overall_score": 73,
    "trend": "Improving",
    "metrics": {
      "data_richness": {"score": 85, "trend": "up", "explanation": "Strong document coverage across meetings, strategy, and financials."},
      "goal_progress": {"score": 75, "trend": "up", "explanation": "Most goals on track with steady progress toward Q1 targets."},
      "team_engagement": {"score": 80, "trend": "stable", "explanation": "Regular team meetings and active collaboration patterns."},
      "meeting_cadence": {"score": 70, "trend": "up", "explanation": "Weekly syncs established with good attendance."},
      "financial_health": {"score": 60, "trend": "down", "explanation": "Runway concerns noted, monitoring burn rate closely."},
      "risk_indicators": {"score": 65, "trend": "down", "explanation": "Two blockers identified requiring attention."}
    },
    "summary_statement": "2-3 sentence summary",
    "recommendations": ["rec1", "rec2", "rec3", "rec4"]
  }
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: dataPrompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 8000 }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      console.error('[Stage 2a] JSON parse failed');
    }
  }

  return getDefaultDashboardData(storedMission, storedValues);
}


function getDefaultDashboardData(storedMission: string | null, storedValues: string[]): DashboardData {
  return {
    mission_alignment: {
      mission_statement: storedMission || 'Mission statement not yet defined',
      core_values: storedValues.length > 0 ? storedValues : [],
      alignment_score: 50,
      alignment_examples: [],
      key_improvement: 'Define and document team mission and values'
    },
    goals_targets: { items: [] },
    team_health: {
      overall_score: 50,
      trend: 'Stable',
      metrics: {
        data_richness: { score: 50, trend: 'stable' },
        goal_progress: { score: 50, trend: 'stable' },
        team_engagement: { score: 50, trend: 'stable' },
        meeting_cadence: { score: 50, trend: 'stable' },
        financial_health: { score: 50, trend: 'stable' },
        risk_indicators: { score: 50, trend: 'stable' }
      },
      summary_statement: 'Analysis in progress. Add more team documents for detailed insights.',
      recommendations: ['Upload more documents', 'Define team goals', 'Schedule regular check-ins']
    }
  };
}


Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const n8nWebhookUrl = Deno.env.get('VITE_N8N_WEBHOOK_URL');

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!n8nWebhookUrl) {
      return new Response(
        JSON.stringify({ error: 'N8N webhook URL not configured' }),
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

    console.log(`[generate-team-dashboard-v2] Starting for team ${team_id}`);

    await supabase
      .from('team_dashboard_settings')
      .upsert({
        team_id,
        generation_in_progress: true,
        generation_started_at: new Date().toISOString(),
        generation_error: null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'team_id' });

    try {
      const { data: team } = await supabase
      .from('teams')
      .select('name')
      .eq('id', team_id)
      .maybeSingle();

    const teamName = team?.name || 'Unknown Team';

    const { data: strategyConfig } = await supabase
      .from('team_strategy_config')
      .select('mission_statement, core_values')
      .eq('team_id', team_id)
      .maybeSingle();

    const storedMission = strategyConfig?.mission_statement || null;
    const storedValues = strategyConfig?.core_values || [];

    const { data: settings } = await supabase
      .from('team_dashboard_settings')
      .select('custom_instructions')
      .eq('team_id', team_id)
      .maybeSingle();

    const finalCustomInstructions = custom_instructions || settings?.custom_instructions || null;

    const { data: historicalSnapshots } = await supabase
      .from('team_dashboard_snapshots')
      .select('generated_at, health_overview')
      .eq('team_id', team_id)
      .order('generated_at', { ascending: false })
      .limit(10);

    const historicalScores: Array<{ date: string; score: number }> = [];
    if (historicalSnapshots) {
      for (const snap of historicalSnapshots) {
        const score = (snap.health_overview as any)?.overall_score;
        if (score !== undefined && score !== null) {
          historicalScores.push({
            date: new Date(snap.generated_at).toISOString().split('T')[0],
            score
          });
        }
      }
    }

    console.log('[generate-team-dashboard-v2] Context loaded:', {
      teamName,
      hasMission: !!storedMission,
      valuesCount: storedValues.length,
      historicalScoresCount: historicalScores.length,
      hasCustomInstructions: !!finalCustomInstructions
    });

    const userEmail = user.email || '';
    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User';

    const astraAnalysis = await callAstraWebhook(
      team_id,
      teamName,
      finalCustomInstructions,
      storedMission,
      storedValues,
      n8nWebhookUrl,
      user.id,
      userEmail,
      userName
    );

    console.log('[generate-team-dashboard-v2] Extracting structured data with Gemini...');

    const structuredData = await extractStructuredData(
      astraAnalysis,
      storedMission,
      storedValues,
      historicalScores,
      geminiApiKey
    );

    await supabase
      .from('team_dashboard_snapshots')
      .update({ is_current: false })
      .eq('team_id', team_id)
      .eq('is_current', true);

    const goalsProgress = {
      has_data: structuredData.goals_targets.items.length > 0,
      items: structuredData.goals_targets.items.map(item => ({
        name: item.name,
        type: (item.type || 'goal').toLowerCase(),
        status: (item.status || 'not_started').toLowerCase().replace(' ', '_'),
        progress_percentage: item.progress_percentage,
        notes: item.notes || '',
        source_reference: '',
        deadline: item.deadline,
        owner: item.owner
      })),
      suggestions: []
    };

    const alignmentMetrics = {
      has_data: true,
      mission_statement: structuredData.mission_alignment.mission_statement,
      core_values: structuredData.mission_alignment.core_values,
      alignment_score: structuredData.mission_alignment.alignment_score,
      alignment_examples: structuredData.mission_alignment.alignment_examples,
      recommendations: [structuredData.mission_alignment.key_improvement],
      suggestions: []
    };

    const metricScores = [
      structuredData.team_health.metrics.data_richness.score || 50,
      structuredData.team_health.metrics.goal_progress.score || 50,
      structuredData.team_health.metrics.team_engagement.score || 50,
      structuredData.team_health.metrics.meeting_cadence.score || 50,
      structuredData.team_health.metrics.financial_health.score || 50,
      structuredData.team_health.metrics.risk_indicators.score || 50
    ];
    const calculatedOverallScore = Math.round(metricScores.reduce((a, b) => a + b, 0) / metricScores.length);

    const healthOverview = {
      overall_score: calculatedOverallScore,
      factors: [
        { name: 'Data Richness', score: structuredData.team_health.metrics.data_richness.score, explanation: structuredData.team_health.metrics.data_richness.explanation || '', trend: structuredData.team_health.metrics.data_richness.trend },
        { name: 'Goal Progress', score: structuredData.team_health.metrics.goal_progress.score, explanation: structuredData.team_health.metrics.goal_progress.explanation || '', trend: structuredData.team_health.metrics.goal_progress.trend },
        { name: 'Team Engagement', score: structuredData.team_health.metrics.team_engagement.score, explanation: structuredData.team_health.metrics.team_engagement.explanation || '', trend: structuredData.team_health.metrics.team_engagement.trend },
        { name: 'Meeting Cadence', score: structuredData.team_health.metrics.meeting_cadence.score, explanation: structuredData.team_health.metrics.meeting_cadence.explanation || '', trend: structuredData.team_health.metrics.meeting_cadence.trend },
        { name: 'Financial Health', score: structuredData.team_health.metrics.financial_health.score, explanation: structuredData.team_health.metrics.financial_health.explanation || '', trend: structuredData.team_health.metrics.financial_health.trend },
        { name: 'Risk Indicators', score: structuredData.team_health.metrics.risk_indicators.score, explanation: structuredData.team_health.metrics.risk_indicators.explanation || '', trend: structuredData.team_health.metrics.risk_indicators.trend }
      ],
      trend_vs_previous: (structuredData.team_health.trend || 'stable').toLowerCase() as 'improving' | 'declining' | 'stable',
      explanation: structuredData.team_health.summary_statement,
      recommendations: structuredData.team_health.recommendations
    };

    const { data: snapshot, error: snapshotError } = await supabase
      .from('team_dashboard_snapshots')
      .insert({
        team_id,
        goals_progress: goalsProgress,
        alignment_metrics: alignmentMetrics,
        health_overview: healthOverview,
        data_sufficiency: {
          goals: goalsProgress.has_data,
          alignment: alignmentMetrics.has_data,
          health: true
        },
        source_data_summary: {
          generated_by: 'astra_gemini_v3_react',
          astra_webhook: 'astra-intelligence'
        },
        astra_raw_response: astraAnalysis,
        generation_version: 'v3',
        generated_by_user_id: generation_type === 'manual' ? user.id : null,
        generation_type,
        is_current: true
      })
      .select()
      .single();

    if (snapshotError) {
      console.error('[generate-team-dashboard-v2] Error creating snapshot:', snapshotError);
      return new Response(
        JSON.stringify({ error: 'Failed to save snapshot' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (structuredData.mission_alignment.mission_statement || structuredData.mission_alignment.core_values.length > 0) {
      await supabase
        .from('team_strategy_config')
        .upsert({
          team_id,
          mission_statement: structuredData.mission_alignment.mission_statement || storedMission,
          core_values: structuredData.mission_alignment.core_values.length > 0 ? structuredData.mission_alignment.core_values : storedValues,
          updated_at: new Date().toISOString()
        }, { onConflict: 'team_id' });
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
        generation_in_progress: false,
        generation_error: null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'team_id' });

    console.log('[generate-team-dashboard-v2] Complete');

    return new Response(
      JSON.stringify({
        success: true,
        snapshot: {
          id: snapshot.id,
          generated_at: snapshot.generated_at,
          goals_progress: goalsProgress,
          alignment_metrics: alignmentMetrics,
          health_overview: healthOverview,
          generation_version: 'v3'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    } catch (innerError) {
      console.error('[generate-team-dashboard-v2] Generation error:', innerError);

      await supabase
        .from('team_dashboard_settings')
        .upsert({
          team_id,
          generation_in_progress: false,
          generation_error: innerError instanceof Error ? innerError.message : 'Generation failed',
          updated_at: new Date().toISOString()
        }, { onConflict: 'team_id' });

      throw innerError;
    }
  } catch (error) {
    console.error('[generate-team-dashboard-v2] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
