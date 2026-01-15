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

interface GeminiDashboardResult {
  structuredData: DashboardData;
  visualizationHtml: string;
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
- Include UP TO 6 goals in goals_targets.items
- Include UP TO 4 recommendations

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
      {"name": "goal1", "type": "Rock", "status": "On Track", "progress_percentage": 80, "deadline": "Q1 2026", "owner": "Name", "details": "context"},
      {"name": "goal2", "type": "Project", "status": "At Risk", "progress_percentage": 50, "deadline": "Q2 2026", "owner": "Name", "details": "context"}
    ]
  },
  "team_health": {
    "overall_score": 70,
    "trend": "Improving",
    "metrics": {
      "data_richness": {"score": 85, "trend": "up", "explanation": "brief explanation based on actual data"},
      "goal_progress": {"score": 75, "trend": "up", "explanation": "brief explanation based on actual data"},
      "team_engagement": {"score": 80, "trend": "stable", "explanation": "brief explanation based on actual data"},
      "meeting_cadence": {"score": 70, "trend": "up", "explanation": "brief explanation based on actual data"},
      "financial_health": {"score": 60, "trend": "down", "explanation": "brief explanation based on actual data"},
      "risk_indicators": {"score": 65, "trend": "down", "explanation": "brief explanation based on actual data"}
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

async function generateVisualizationHtml(
  teamName: string,
  data: DashboardData,
  customInstructions: string | null,
  documentCount: number,
  categoryCount: number,
  apiKey: string
): Promise<string> {
  console.log('[Stage 2b] Generating HTML visualization with Gemini...');

  const alignmentColor = data.mission_alignment.alignment_score >= 70 ? '#22c55e' : data.mission_alignment.alignment_score >= 50 ? '#eab308' : '#ef4444';
  const alignmentLabel = data.mission_alignment.alignment_score >= 70 ? 'Strong' : data.mission_alignment.alignment_score >= 50 ? 'Moderate' : 'Needs Focus';
  const healthColor = data.team_health.overall_score >= 70 ? '#22c55e' : data.team_health.overall_score >= 50 ? '#eab308' : '#ef4444';
  const healthLabel = data.team_health.overall_score >= 80 ? 'Excellent' : data.team_health.overall_score >= 70 ? 'Strong' : data.team_health.overall_score >= 50 ? 'Moderate' : 'Needs Attention';

  const metricsArray = [
    data.team_health.metrics.data_richness.score,
    data.team_health.metrics.goal_progress.score,
    data.team_health.metrics.team_engagement.score,
    data.team_health.metrics.meeting_cadence.score,
    data.team_health.metrics.financial_health.score,
    data.team_health.metrics.risk_indicators.score
  ];
  const calculatedHealthScore = Math.round(metricsArray.reduce((a, b) => a + b, 0) / metricsArray.length);
  const calculatedHealthColor = calculatedHealthScore >= 70 ? '#22c55e' : calculatedHealthScore >= 50 ? '#eab308' : '#ef4444';
  const calculatedHealthLabel = calculatedHealthScore >= 80 ? 'Excellent Health' : calculatedHealthScore >= 70 ? 'Strong Health' : calculatedHealthScore >= 50 ? 'Moderate Health' : 'Needs Attention';

  const dataRichnessExplanation = data.team_health.metrics.data_richness.explanation || 'Measures how comprehensive your connected data is across all categories';
  const goalProgressExplanation = data.team_health.metrics.goal_progress.explanation || 'Overall progress toward documented goals and targets';
  const teamEngagementExplanation = data.team_health.metrics.team_engagement.explanation || 'Level of team collaboration and communication activity';
  const meetingCadenceExplanation = data.team_health.metrics.meeting_cadence.explanation || 'Consistency and productivity of team meetings';
  const financialHealthExplanation = data.team_health.metrics.financial_health.explanation || 'Financial trajectory and resource management';
  const riskIndicatorsExplanation = data.team_health.metrics.risk_indicators.explanation || 'Presence of blockers, risks, or concerns';

  const htmlPrompt = `Generate a PREMIUM HTML dashboard. Return ONLY the HTML code starting with <!DOCTYPE html>.

TEAM: ${teamName}
${customInstructions ? `FOCUS: ${customInstructions}` : ''}

DATA TO DISPLAY:
${JSON.stringify(data, null, 2)}

=== CRITICAL: FIXED DIMENSIONS & LAYOUT ===
The dashboard MUST have these EXACT specifications:
- Total container: width: 1400px; height: 850px;
- 3-column grid with equal heights: grid-template-columns: 1fr 1fr 1fr; height: 100%;
- Each column card: height: 100%; display: flex; flex-direction: column;
- All 3 columns MUST be the same height (850px minus padding)
- IMPORTANT: Do NOT use overflow:hidden on cards - tooltips must be visible

=== DESIGN CONSISTENCY (80-90% same every time) ===
- ALWAYS use the exact same 3-column grid layout
- ALWAYS use the same card styles, colors, fonts, spacing
- ALWAYS show exactly the same sections in same positions
- Only the DATA CONTENT varies (text, numbers, percentages)
- Do NOT add creative variations to layout or structure

=== OVERALL LAYOUT ===
body { margin: 0; padding: 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); font-family: 'Inter', sans-serif; }
.dashboard { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; width: 1400px; height: 850px; margin: 0 auto; }
.card { background: rgba(30, 41, 59, 0.95); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 20px; height: 100%; display: flex; flex-direction: column; position: relative; }

Google Font: Inter (include <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">)

=== COLUMN 1: MISSION ALIGNMENT ===
Header: Compass icon + "Mission Alignment" + "${alignmentLabel}" badge in ${alignmentColor}

SVG CIRCULAR GAUGE (100px to save space):
- Score ${data.mission_alignment.alignment_score} centered, "/100" below
- Arc color: ${alignmentColor}
- Label: "${alignmentLabel}"

MISSION SECTION (compact):
- "MISSION STATEMENT" label
- Mission text in blockquote with ${alignmentColor} left border

CORE VALUES:
- Pill badges for each value (compact, inline)

ALIGNMENT EXAMPLES (show up to 4, compact):
- Green checkmark for aligned, yellow warning for misaligned
- Brief description text (1-2 lines each)

KEY IMPROVEMENT:
- Amber highlighted card with improvement tip

=== COLUMN 2: GOALS & TARGETS ===
Header: Target icon + "Goals & Targets" (NO count badge)

SHOW UP TO 6 GOALS (use compact layout):
Each goal card (compact, ~80px max height each):
- Type badge (Rock=#f97316, Project=#3b82f6, OKR=#8b5cf6)
- Status indicator (small)
- Goal name + progress percentage
- Progress bar (4px height)
- Collapsible details using <details><summary>Show details</summary>

=== COLUMN 3: TEAM HEALTH ===
Header: Heart icon + "Team Health" + "${data.team_health.trend}" badge

HEALTH SCORE: ${calculatedHealthScore} (AVERAGE of 6 metrics)
SVG Gauge (100px): Score in center, arc color: ${calculatedHealthColor}, label: "${calculatedHealthLabel}"

ALL 6 METRICS WITH TOOLTIPS (compact, ~40px height each):
The tooltip text must show the ACTUAL EXPLANATION from the data analysis:

1. Data Richness: ${data.team_health.metrics.data_richness.score}
   Tooltip: "${dataRichnessExplanation}"

2. Goal Progress: ${data.team_health.metrics.goal_progress.score}
   Tooltip: "${goalProgressExplanation}"

3. Team Engagement: ${data.team_health.metrics.team_engagement.score}
   Tooltip: "${teamEngagementExplanation}"

4. Meeting Cadence: ${data.team_health.metrics.meeting_cadence.score}
   Tooltip: "${meetingCadenceExplanation}"

5. Financial Health: ${data.team_health.metrics.financial_health.score}
   Tooltip: "${financialHealthExplanation}"

6. Risk Indicators: ${data.team_health.metrics.risk_indicators.score}
   Tooltip: "${riskIndicatorsExplanation}"

METRIC ROW STRUCTURE:
<div class="metric-row">
  <div class="metric-header">
    <span class="metric-name">Metric Name</span>
    <span class="tooltip-trigger" data-tooltip="ACTUAL EXPLANATION TEXT HERE">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r="0.5" fill="#64748b"/></svg>
    </span>
    <span class="metric-score">score</span>
    <span class="trend-arrow">arrow</span>
  </div>
  <div class="progress-bar"><div class="progress-fill" style="width: score%"></div></div>
</div>

=== TOOLTIP CSS (CRITICAL - must appear above all elements) ===
.tooltip-trigger {
  position: relative;
  cursor: help;
  margin-left: 4px;
  display: inline-flex;
  align-items: center;
}
.tooltip-trigger::after {
  content: attr(data-tooltip);
  position: fixed;
  background: #0f172a;
  color: #f8fafc;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.5;
  max-width: 280px;
  white-space: normal;
  visibility: hidden;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 99999;
  border: 1px solid rgba(255,255,255,0.25);
  box-shadow: 0 12px 40px rgba(0,0,0,0.6);
  pointer-events: none;
}
.tooltip-trigger:hover::after {
  visibility: visible;
  opacity: 1;
}

ADD THIS JAVASCRIPT FOR TOOLTIP POSITIONING (in a <script> tag at end of body):
document.querySelectorAll('.tooltip-trigger').forEach(el => {
  el.addEventListener('mouseenter', function(e) {
    const rect = this.getBoundingClientRect();
    const tooltip = this;
    tooltip.style.setProperty('--tooltip-top', (rect.top - 10) + 'px');
    tooltip.style.setProperty('--tooltip-left', (rect.right + 10) + 'px');
  });
});
UPDATE CSS to use CSS variables:
.tooltip-trigger::after {
  top: var(--tooltip-top, 0);
  left: var(--tooltip-left, 0);
}

SUMMARY (compact, 2-3 lines max):
- Brief summary text

RECOMMENDATIONS (show up to 4, compact):
- Numbered list with brief items

=== NO FOOTER ===

=== COLORS ===
Success: #22c55e, Warning: #eab308, Danger: #ef4444, Info: #3b82f6
Text: #f8fafc (primary), #cbd5e1 (secondary), #64748b (muted)
Card: rgba(30, 41, 59, 0.95), Border: rgba(255,255,255,0.1)

=== SVG ICONS (use exactly) ===
Info/Question icon for tooltips:
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r="0.5" fill="#64748b"/></svg>

Arrow up: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
Arrow down: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>

Return ONLY valid HTML starting with <!DOCTYPE html>. No markdown, no code blocks.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: htmlPrompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 50000 }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const result = await response.json();
  let html = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

  html = html.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

  const doctypeMatch = html.match(/<!DOCTYPE[\s\S]*<\/html>/i);
  if (doctypeMatch) {
    html = doctypeMatch[0];
  }

  if (!html.toLowerCase().includes('<!doctype')) {
    return generateFallbackHtml(teamName, data, documentCount, categoryCount);
  }

  console.log('[Stage 2b] HTML generated, length:', html.length);
  return html;
}

async function generateDashboardWithGemini(
  teamName: string,
  astraAnalysis: string,
  storedMission: string | null,
  storedValues: string[],
  historicalScores: Array<{ date: string; score: number }>,
  customInstructions: string | null,
  documentCount: number,
  categoryCount: number,
  apiKey: string
): Promise<GeminiDashboardResult> {
  console.log('[Stage 2] Generating dashboard with Gemini (2-step process)...');

  const structuredData = await extractStructuredData(
    astraAnalysis,
    storedMission,
    storedValues,
    historicalScores,
    apiKey
  );

  const visualizationHtml = await generateVisualizationHtml(
    teamName,
    structuredData,
    customInstructions,
    documentCount,
    categoryCount,
    apiKey
  );

  return { structuredData, visualizationHtml };
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

function generateFallbackHtml(teamName: string, data: DashboardData, documentCount: number, categoryCount: number): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${teamName} Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #111827; color: white; padding: 24px; min-height: 100vh; }
    .dashboard { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1600px; margin: 0 auto; }
    .card { background: #1f2937; border-radius: 12px; padding: 24px; }
    .card h2 { font-size: 1.25rem; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .score-ring { width: 120px; height: 120px; border-radius: 50%; border: 8px solid #3b82f6; display: flex; align-items: center; justify-content: center; margin: 16px auto; }
    .score-ring span { font-size: 2.5rem; font-weight: bold; }
    .metric { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #374151; }
    .pill { background: #374151; padding: 4px 12px; border-radius: 16px; font-size: 0.75rem; display: inline-block; margin: 4px; }
    .summary { background: #374151; padding: 16px; border-radius: 8px; margin-top: 16px; font-size: 0.875rem; color: #d1d5db; }
    .footer { text-align: center; color: #64748b; font-size: 0.75rem; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="dashboard">
    <div class="card">
      <h2>Mission Alignment</h2>
      <div class="score-ring"><span>${data.mission_alignment.alignment_score}</span></div>
      <p style="text-align:center;color:#9ca3af;margin-bottom:16px">${data.mission_alignment.alignment_score >= 70 ? 'Strong' : data.mission_alignment.alignment_score >= 50 ? 'Moderate' : 'Needs Focus'}</p>
      <div class="summary">"${data.mission_alignment.mission_statement}"</div>
      ${data.mission_alignment.core_values.length > 0 ? `<div style="margin-top:16px">${data.mission_alignment.core_values.map(v => `<span class="pill">${v}</span>`).join('')}</div>` : ''}
    </div>
    <div class="card">
      <h2>Goals & Targets</h2>
      ${data.goals_targets.items.length > 0
        ? data.goals_targets.items.map(g => `<div class="metric"><span>${g.name}</span><span class="pill">${g.status}</span></div>`).join('')
        : '<p style="color:#9ca3af;text-align:center;padding:40px 0">No goals detected yet</p>'}
    </div>
    <div class="card">
      <h2>Team Health</h2>
      <div class="score-ring"><span>${data.team_health.overall_score}</span></div>
      <p style="text-align:center;color:#9ca3af;margin-bottom:16px">${data.team_health.trend}</p>
      <div class="metric"><span>Data Richness</span><span>${data.team_health.metrics.data_richness.score}</span></div>
      <div class="metric"><span>Goal Progress</span><span>${data.team_health.metrics.goal_progress.score}</span></div>
      <div class="metric"><span>Team Engagement</span><span>${data.team_health.metrics.team_engagement.score}</span></div>
      <div class="metric"><span>Meeting Cadence</span><span>${data.team_health.metrics.meeting_cadence.score}</span></div>
      <div class="metric"><span>Financial Health</span><span>${data.team_health.metrics.financial_health.score}</span></div>
      <div class="metric"><span>Risk Indicators</span><span>${data.team_health.metrics.risk_indicators.score}</span></div>
      <div class="summary">${data.team_health.summary_statement}</div>
    </div>
  </div>
  <p class="footer">Analysis based on ${documentCount} documents across ${categoryCount} categories</p>
</body>
</html>`;
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

    const { data: documentStats } = await supabase.rpc('get_document_sync_stats', { p_team_id: team_id });
    const documentCount = documentStats?.total_documents || 0;
    const categoryCount = documentStats?.categories_with_data || 0;

    console.log('[generate-team-dashboard-v2] Document stats:', { documentCount, categoryCount });

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

    const { structuredData, visualizationHtml } = await generateDashboardWithGemini(
      teamName,
      astraAnalysis,
      storedMission,
      storedValues,
      historicalScores,
      finalCustomInstructions,
      documentCount,
      categoryCount,
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

    const healthOverview = {
      overall_score: structuredData.team_health.overall_score,
      factors: [
        { name: 'Data Richness', score: structuredData.team_health.metrics.data_richness.score, explanation: '', trend: structuredData.team_health.metrics.data_richness.trend },
        { name: 'Goal Progress', score: structuredData.team_health.metrics.goal_progress.score, explanation: '', trend: structuredData.team_health.metrics.goal_progress.trend },
        { name: 'Team Engagement', score: structuredData.team_health.metrics.team_engagement.score, explanation: '', trend: structuredData.team_health.metrics.team_engagement.trend },
        { name: 'Meeting Cadence', score: structuredData.team_health.metrics.meeting_cadence.score, explanation: '', trend: structuredData.team_health.metrics.meeting_cadence.trend },
        { name: 'Financial Health', score: structuredData.team_health.metrics.financial_health.score, explanation: '', trend: structuredData.team_health.metrics.financial_health.trend },
        { name: 'Risk Indicators', score: structuredData.team_health.metrics.risk_indicators.score, explanation: '', trend: structuredData.team_health.metrics.risk_indicators.trend }
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
          generated_by: 'astra_gemini_v2_pipeline',
          astra_webhook: 'astra-intelligence'
        },
        visualization_html: visualizationHtml,
        astra_raw_response: astraAnalysis,
        generation_version: 'v2',
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
          visualization_html: visualizationHtml,
          generation_version: 'v2'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[generate-team-dashboard-v2] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
