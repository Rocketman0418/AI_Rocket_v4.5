import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TeamPulseData {
  team_info: {
    team_id: string;
    team_name: string;
    created_at: string;
  };
  meeting_content: Array<{ file_name: string; content: string; date: string }>;
  strategy_content: Array<{ file_name: string; content: string; date: string }>;
  financial_content: Array<{ file_name: string; content: string; date: string }>;
  projects_content: Array<{ file_name: string; content: string; date: string }>;
  operations_content: Array<{ file_name: string; content: string; date: string }>;
  general_content: Array<{ file_name: string; content: string; category: string; date: string }>;
  team_discussions: Array<{ user_name: string; message: string; date: string }>;
  recent_reports: Array<{ prompt: string; response: string; date: string }>;
  category_summary: Array<{ category: string; document_count: number }>;
  member_info: {
    total_members: number;
    members: Array<{ name: string; role: string }>;
  };
  previous_snapshot: {
    generated_at?: string;
    health_score?: number;
    health_factors?: Record<string, number>;
    insights_and_trends?: Record<string, any>;
  };
  generated_at: string;
}

interface AnalysisResult {
  health_score: number;
  health_explanation: string;
  health_factors: {
    strategic_alignment: number;
    project_momentum: number;
    financial_health: number;
    team_collaboration: number;
    operational_efficiency: number;
    risk_management: number;
  };
  factor_explanations: Record<string, string>;
  key_metrics: {
    active_projects: string;
    recent_decisions: string;
    upcoming_deadlines: string;
    financial_status: string;
    team_focus_areas: string;
  };
  highlights: string[];
  recommendations: string[];
  trends_vs_previous: string;
  short_highlights: string[];
  short_insights: string[];
  short_trends: string[];
}

async function analyzeWithFlash(data: TeamPulseData, apiKey: string): Promise<AnalysisResult> {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const cutoffStr = thirtyDaysAgo.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const prompt = `You are a business analyst creating a weekly "Team Pulse" snapshot. Today is ${dateStr}.

CRITICAL DATE FILTER: The cutoff date is ${cutoffStr}. COMPLETELY IGNORE any content, projects, decisions, or references that appear to be from BEFORE this date. Only analyze data from the LAST 30 DAYS.

TEAM: ${data.team_info.team_name}
TEAM SIZE: ${data.member_info.total_members} members

=== FOUNDATIONAL DATA (Mission/Vision/Goals - can reference regardless of age) ===
Look for: Company Mission, Core Values, Vision, Long-Term Targets (3-year, 5-year, 10-year, etc.), Current Year Goals
Note: Only use CURRENT goals and targets. If you see multiple versions, use the most recent.

=== MEETING NOTES (LAST 30 DAYS ONLY) ===
${data.meeting_content.map(m => `[${m.file_name}] Date: ${m.date || 'Unknown'}\n${m.content}`).join('\n\n') || 'No meeting data'}

=== STRATEGY (LAST 30 DAYS ONLY) ===
${data.strategy_content.map(s => `[${s.file_name}] Date: ${s.date || 'Unknown'}\n${s.content}`).join('\n\n') || 'No strategy data'}

=== FINANCIAL (LAST 30 DAYS ONLY) ===
${data.financial_content.map(f => `[${f.file_name}] Date: ${f.date || 'Unknown'}\n${f.content}`).join('\n\n') || 'No financial data'}

=== PROJECTS (LAST 30 DAYS ONLY) ===
${data.projects_content.map(p => `[${p.file_name}] Date: ${p.date || 'Unknown'}\n${p.content}`).join('\n\n') || 'No project data'}

=== OPERATIONS (LAST 30 DAYS ONLY) ===
${data.operations_content.map(o => `[${o.file_name}] Date: ${o.date || 'Unknown'}\n${o.content}`).join('\n\n') || 'No operations data'}

=== TEAM DISCUSSIONS (LAST 30 DAYS ONLY) ===
${data.team_discussions.map(t => `${t.user_name}: ${t.message}`).join('\n') || 'No discussions'}

=== RECENT AI REPORTS ===
${data.recent_reports.map(r => `Q: ${r.prompt}\nA: ${r.response}`).join('\n\n') || 'No reports'}

=== PREVIOUS PULSE ===
${data.previous_snapshot.health_score ? `Previous Score: ${data.previous_snapshot.health_score}` : 'First snapshot'}

Provide JSON response:
{
  "health_score": <0-100>,
  "health_explanation": "<2-3 sentences about CURRENT team health>",
  "health_factors": {
    "strategic_alignment": <0-100>,
    "project_momentum": <0-100>,
    "financial_health": <0-100>,
    "team_collaboration": <0-100>,
    "operational_efficiency": <0-100>,
    "risk_management": <0-100>
  },
  "factor_explanations": {
    "strategic_alignment": "<explain using CURRENT mission/goals only>",
    "project_momentum": "<explain using projects from LAST 30 DAYS only>",
    "financial_health": "<explain using CURRENT financial data only>",
    "team_collaboration": "<explain using RECENT meetings/discussions only>",
    "operational_efficiency": "<explain using RECENT operations data only>",
    "risk_management": "<explain using CURRENT risks only>"
  },
  "key_metrics": {
    "active_projects": "<CURRENT projects only>",
    "recent_decisions": "<decisions from LAST 30 DAYS only>",
    "upcoming_deadlines": "<deadlines in the next 30-60 days>",
    "financial_status": "<CURRENT financial status>",
    "team_focus_areas": "<what the team is focused on RIGHT NOW>"
  },
  "highlights": ["<insight 1: pattern or theme observed across ALL 30-day data>", "<insight 2: another pattern or theme>", "<insight 3: key observation about team dynamics>"],
  "recommendations": ["<trend 1: high-level business trend from 30-day data>", "<trend 2: emerging pattern or shift>", "<trend 3: notable direction or trajectory>"],
  "trends_vs_previous": "<comparison to last pulse>",
  "short_highlights": ["<3-5 word COMPLETE phrase summarizing team health, e.g. 'Strong strategic alignment'>", "<3-5 word phrase, e.g. 'High team momentum'>", "<3-5 word phrase, e.g. 'Solid financial foundation'>"],
  "short_insights": ["<3-5 word COMPLETE observation, e.g. 'Active project development'>", "<3-5 word observation, e.g. 'Growing team collaboration'>", "<3-5 word observation, e.g. 'Clear goal alignment'>"],
  "short_trends": ["<3-5 word COMPLETE trend, e.g. 'Increasing operational efficiency'>", "<3-5 word trend, e.g. 'Rising customer focus'>", "<3-5 word trend, e.g. 'Expanding market presence'>"]
}

STRICT RULES:
1. IGNORE any product/project that was completed more than 30 days ago
2. IGNORE any pricing/subscription models from old products
3. For Strategic Alignment: Reference CURRENT Mission and Long-Term Targets from foundational documents
4. For "highlights" (INSIGHTS): Analyze ALL data from the last 30 days and identify patterns, themes, and observations across the entire dataset. DO NOT pick specific individual items - synthesize high-level insights about what the data collectively shows.
5. For "recommendations" (TRENDS): Identify high-level business trends, emerging patterns, and directional shifts observed across all 30-day data. Focus on trajectories and patterns, NOT specific action items.
6. If a date in the content is before ${cutoffStr}, SKIP that information entirely
7. Factor explanations must reference ONLY recent data - if you can't find recent data for a factor, say "Based on limited recent data"
8. PRIORITIZE the most recent data (last 7-14 days) when analyzing, but consider the full 30-day context for trends
9. CRITICAL FOR SHORT PHRASES (short_highlights, short_insights, short_trends): Each phrase MUST be a COMPLETE thought in 3-5 words. Examples of GOOD phrases: "Strong strategic execution", "High team momentum", "Solid financial position", "Active project pipeline". Examples of BAD phrases (DO NOT USE): "The team is maintaining", "While financial reserves", "There is a clear". The phrase must make sense as a standalone label.

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
            maxOutputTokens: 4096
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Flash API error:', errorText);
      throw new Error(`Flash API error: ${response.status}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Flash response');
    }

    const analysis = JSON.parse(jsonMatch[0]) as AnalysisResult;
    
    if (analysis.recommendations.length === 0) {
      analysis.recommendations = [
        'Team operations show steady consistency in activity patterns',
        'Documentation practices indicate growing organizational maturity',
        'Communication channels demonstrate regular engagement across the team'
      ];
    }

    if (analysis.highlights.length === 0) {
      analysis.highlights = [
        'Active documentation and tracking practices are becoming established',
        'Team collaboration patterns show consistent engagement'
      ];
    }

    if (!analysis.short_highlights || analysis.short_highlights.length === 0) {
      analysis.short_highlights = [
        'Building strong foundation',
        'Active team engagement',
        'Growing documentation'
      ];
    }

    if (!analysis.short_insights || analysis.short_insights.length === 0) {
      analysis.short_insights = [
        'Consistent team communication',
        'Regular operational activity',
        'Clear organizational focus'
      ];
    }

    if (!analysis.short_trends || analysis.short_trends.length === 0) {
      analysis.short_trends = [
        'Increasing team alignment',
        'Growing data maturity',
        'Expanding knowledge base'
      ];
    }

    return analysis;
  } catch (error) {
    console.error('Error in Flash analysis:', error);
    return {
      health_score: 50,
      health_explanation: 'Unable to fully analyze team data. Review available documents for insights.',
      health_factors: {
        strategic_alignment: 50,
        project_momentum: 50,
        financial_health: 50,
        team_collaboration: 50,
        operational_efficiency: 50,
        risk_management: 50
      },
      factor_explanations: {
        strategic_alignment: 'Insufficient data for detailed analysis',
        project_momentum: 'Insufficient data for detailed analysis',
        financial_health: 'Insufficient data for detailed analysis',
        team_collaboration: 'Insufficient data for detailed analysis',
        operational_efficiency: 'Insufficient data for detailed analysis',
        risk_management: 'Insufficient data for detailed analysis'
      },
      key_metrics: {
        active_projects: 'Not specified in data',
        recent_decisions: 'Not specified in data',
        upcoming_deadlines: 'Not specified in data',
        financial_status: 'Not specified in data',
        team_focus_areas: 'Review documents for focus areas'
      },
      highlights: [
        'Team knowledge base is in early development stages',
        'Documentation practices are beginning to take shape'
      ],
      recommendations: [
        'Data collection patterns suggest an emerging organizational foundation',
        'Initial documentation trends point toward growing team structure',
        'Early-stage activity indicates potential for deeper analytical insights as more data becomes available'
      ],
      trends_vs_previous: 'First snapshot',
      short_highlights: [
        'Building strong foundation',
        'Active team engagement',
        'Growing documentation'
      ],
      short_insights: [
        'Early development stage',
        'Emerging team patterns',
        'Foundation taking shape'
      ],
      short_trends: [
        'Growing organizational structure',
        'Increasing data maturity',
        'Building knowledge base'
      ]
    };
  }
}

async function generateInfographic(
  teamName: string,
  analysis: AnalysisResult,
  memberCount: number,
  apiKey: string
): Promise<{ url?: string; base64?: string; error?: string }> {
  const focusAreas = analysis.key_metrics.team_focus_areas || '';
  const activeProjects = analysis.key_metrics.active_projects || '';
  const financialStatus = analysis.key_metrics.financial_status || '';

  const businessContext = `${focusAreas} ${activeProjects} ${financialStatus}`.toLowerCase();

  let themeContext = 'technology and innovation';
  let accentStyle = 'electric blue, cyan, and dark slate with gradient accents';

  if (businessContext.includes('health') || businessContext.includes('medical') || businessContext.includes('wellness')) {
    themeContext = 'healthcare and wellness';
    accentStyle = 'calming teal and green with clean white and soft gradients';
  } else if (businessContext.includes('financ') || businessContext.includes('invest') || businessContext.includes('banking')) {
    themeContext = 'finance and investment';
    accentStyle = 'deep navy and gold with professional gray and metallic accents';
  } else if (businessContext.includes('market') || businessContext.includes('brand') || businessContext.includes('creative')) {
    themeContext = 'marketing and creative';
    accentStyle = 'vibrant coral and warm orange with charcoal and dynamic gradients';
  } else if (businessContext.includes('retail') || businessContext.includes('commerce') || businessContext.includes('sales')) {
    themeContext = 'retail and commerce';
    accentStyle = 'warm amber and forest green with neutral gray and earthy tones';
  } else if (businessContext.includes('consult') || businessContext.includes('service') || businessContext.includes('client')) {
    themeContext = 'professional services';
    accentStyle = 'sophisticated slate and copper with cream and elegant highlights';
  }

  const scoreColor = analysis.health_score >= 70 ? 'vibrant green/emerald with glow effect' :
                     analysis.health_score >= 40 ? 'warm amber/orange with glow effect' : 'alert coral/red with glow effect';

  const shortHighlights = analysis.short_highlights || ['Strong team momentum', 'Solid execution focus', 'Building foundation'];
  const shortInsights = analysis.short_insights || ['Active project development', 'Growing collaboration', 'Clear goal alignment'];
  const shortTrends = analysis.short_trends || ['Increasing efficiency', 'Rising engagement', 'Expanding capabilities'];

  const visualStyles = [
    'futuristic holographic dashboard with glowing neon data visualizations and 3D floating elements',
    'premium glass-morphism design with frosted panels, glowing metrics, and depth layers',
    'cinematic data visualization with dramatic lighting, radial gauges, and particle effects',
    'high-tech command center aesthetic with hexagonal grids, pulsing indicators, and tech patterns',
    'sleek aerospace mission control with circular gauges, status lights, and grid overlays'
  ];
  const randomStyle = visualStyles[Math.floor(Math.random() * visualStyles.length)];

  const prompt = `Create a VISUALLY STUNNING, DATA-RICH infographic for "${teamName}" Team Pulse report.

VISUAL STYLE: ${randomStyle}
INDUSTRY: ${themeContext}
COLOR SCHEME: ${accentStyle}

=== TECHNICAL SPECS ===
- LANDSCAPE 1920x1080 pixels (16:9 aspect ratio)
- 60% rich graphics and data visualizations, 40% text
- Premium, modern tech aesthetic
- NO human faces, avatars, or photographs of people

=== REQUIRED VISUAL ELEMENTS (make these prominent and creative) ===

1. HERO HEALTH SCORE GAUGE (center-right, LARGE and dramatic):
   - Score: ${analysis.health_score}/100
   - Style: Circular radial gauge with ${scoreColor}
   - Add: Glowing ring effect, tick marks, digital readout
   - Size: Make this the visual focal point

2. SIX METRIC MINI-GAUGES (arranged around or below the hero gauge):
   Create VISUAL circular progress indicators for each:
   - Strategy: ${analysis.health_factors.strategic_alignment}% (icon: target/bullseye)
   - Momentum: ${analysis.health_factors.project_momentum}% (icon: rocket/arrow up)
   - Financial: ${analysis.health_factors.financial_health}% (icon: chart/coins)
   - Teamwork: ${analysis.health_factors.team_collaboration}% (icon: connected nodes/people)
   - Operations: ${analysis.health_factors.operational_efficiency}% (icon: gears/cogs)
   - Risk Mgmt: ${analysis.health_factors.risk_management}% (icon: shield/checkmark)

3. KEY HIGHLIGHTS PANEL (left side, with icons):
   Display each as a SHORT label with a distinctive icon:
   - ${shortHighlights[0]}
   - ${shortHighlights[1]}
   - ${shortHighlights[2]}
   Use: Checkmarks, stars, or upward arrows as bullet icons

4. INSIGHTS SECTION (bottom-left):
   Short phrases with visual indicators:
   - ${shortInsights[0]}
   - ${shortInsights[1]}
   - ${shortInsights[2]}
   Use: Lightbulb, magnifying glass, or graph icons

5. TRENDS SECTION (bottom-right):
   Short phrases with trend indicators:
   - ${shortTrends[0]}
   - ${shortTrends[1]}
   - ${shortTrends[2]}
   Use: Trending arrows, wave patterns, or growth charts

=== HEADER ===
Top banner: "${teamName}" - TEAM PULSE
Date: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
Include: Small rocket icon as brand element

=== FOOTER ===
"Powered by AI Rocket" with subtle branding

=== DESIGN REQUIREMENTS ===
1. RICH GRAPHICS: Include decorative tech elements - circuit patterns, grid lines, glowing nodes, data flow lines
2. DEPTH AND DIMENSION: Use layered panels, shadows, gradients to create visual depth
3. ICONS: Every text item should have an associated icon or visual indicator
4. CONTRAST: Ensure all text is highly readable with proper contrast
5. PREMIUM FEEL: This should look like a high-end analytics dashboard, not a basic template
6. ANIMATION SUGGESTION: Design as if elements could pulse or glow (static image but suggest motion)
7. DATA VISUALIZATION: The 6 metric gauges should be VISUAL (circular progress, not just numbers)
8. BALANCE: Even distribution of visual weight across the composition

=== CRITICAL: DO NOT ===
- Do NOT use plain text lists without icons
- Do NOT create a basic template look
- Do NOT include human faces or photographs
- Do NOT make text too small to read
- Do NOT use incomplete sentences or cut-off text
- Do NOT create a cluttered or overwhelming design`;

  console.log('[Image Gen] Creative direction:', { themeContext, accentStyle, randomStyle });

  try {
    console.log('[Image Gen] Starting infographic generation for team:', teamName);

    const modelUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`;
    console.log('[Image Gen] Using model: gemini-3-pro-image-preview');

    const response = await fetch(modelUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          temperature: 1.0,
          candidateCount: 1
        }
      })
    });

    console.log('[Image Gen] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Image Gen] API error response:', errorText);
      return { error: `Image API error: ${response.status} - ${errorText.substring(0, 200)}` };
    }

    const result = await response.json();
    console.log('[Image Gen] Response received, checking for image parts...');
    console.log('[Image Gen] Candidates count:', result.candidates?.length || 0);

    if (result.candidates?.[0]?.content?.parts) {
      console.log('[Image Gen] Parts in response:', result.candidates[0].content.parts.length);
      result.candidates[0].content.parts.forEach((part: any, idx: number) => {
        console.log(`[Image Gen] Part ${idx}:`, {
          hasText: !!part.text,
          hasInlineData: !!part.inlineData,
          mimeType: part.inlineData?.mimeType
        });
      });
    }

    const imagePart = result.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.inlineData?.mimeType?.startsWith('image/')
    );

    if (imagePart?.inlineData?.data) {
      console.log('[Image Gen] Image found! Size:', imagePart.inlineData.data.length, 'bytes');
      return { base64: imagePart.inlineData.data };
    }

    console.log('[Image Gen] No image found in response');
    console.log('[Image Gen] Full response structure:', JSON.stringify(result, null, 2).substring(0, 1000));
    return { error: 'No image generated in response' };
  } catch (error) {
    console.error('[Image Gen] Error generating infographic:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
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

    const { team_id, generation_type = 'manual' } = await req.json();

    if (!team_id) {
      return new Response(
        JSON.stringify({ error: 'team_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating Team Pulse for team ${team_id}`);

    const { data: pulseData, error: dataError } = await supabase.rpc('get_team_pulse_data', {
      p_team_id: team_id
    });

    if (dataError) {
      console.error('Error getting pulse data:', dataError);
      return new Response(
        JSON.stringify({ error: 'Failed to get team data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const teamData = pulseData as TeamPulseData;
    console.log(`Got team data for ${teamData.team_info.team_name}`);

    console.log('Step 1: Analyzing with Flash model (gemini-3-flash-preview)...');
    const analysis = await analyzeWithFlash(teamData, geminiApiKey);
    console.log(`Analysis complete. Health score: ${analysis.health_score}`);

    console.log('Step 2: Generating infographic with gemini-3-pro-image-preview...');
    const infographicResult = await generateInfographic(
      teamData.team_info.team_name,
      analysis,
      teamData.member_info.total_members,
      geminiApiKey
    );
    console.log('Infographic result:', {
      hasBase64: !!infographicResult.base64,
      hasUrl: !!infographicResult.url,
      error: infographicResult.error
    });

    let infographicUrl: string | null = null;
    let infographicBase64: string | null = null;
    let infographicError: string | null = infographicResult.error || null;

    if (infographicResult.base64) {
      try {
        const fileName = `${team_id}/${Date.now()}.png`;
        const imageBuffer = Uint8Array.from(atob(infographicResult.base64), c => c.charCodeAt(0));
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('team-pulse-infographics')
          .upload(fileName, imageBuffer, {
            contentType: 'image/png',
            upsert: false
          });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from('team-pulse-infographics')
            .getPublicUrl(fileName);
          infographicUrl = urlData.publicUrl;
          console.log('Infographic uploaded to storage');
        } else {
          console.error('Upload error:', uploadError);
          infographicBase64 = infographicResult.base64;
        }
      } catch (uploadErr) {
        console.error('Storage upload failed:', uploadErr);
        infographicBase64 = infographicResult.base64;
      }
    } else if (infographicResult.error) {
      console.error('Infographic generation error:', infographicResult.error);
    }

    await supabase
      .from('team_pulse_snapshots')
      .update({ is_current: false })
      .eq('team_id', team_id)
      .eq('is_current', true);

    const healthFactors = {
      data_richness: analysis.health_factors.strategic_alignment,
      goal_progress: analysis.health_factors.project_momentum,
      meeting_cadence: analysis.health_factors.team_collaboration,
      team_engagement: analysis.health_factors.operational_efficiency,
      risk_indicators: analysis.health_factors.risk_management,
      financial_health: analysis.health_factors.financial_health
    };

    const { data: snapshot, error: snapshotError } = await supabase
      .from('team_pulse_snapshots')
      .insert({
        team_id,
        health_score: analysis.health_score,
        health_explanation: analysis.health_explanation,
        health_factors: healthFactors,
        infographic_url: infographicUrl,
        infographic_base64: infographicBase64,
        source_data_summary: {
          category_summary: teamData.category_summary,
          member_info: teamData.member_info,
          key_metrics: analysis.key_metrics
        },
        sections: {
          mission: {
            team_name: teamData.team_info.team_name,
            members: teamData.member_info.total_members
          },
          key_metrics: analysis.key_metrics,
          factor_explanations: analysis.factor_explanations
        },
        insights_and_trends: {
          score_trend: teamData.previous_snapshot.health_score 
            ? (analysis.health_score > teamData.previous_snapshot.health_score + 5 ? 'up' 
               : analysis.health_score < teamData.previous_snapshot.health_score - 5 ? 'down' 
               : 'stable')
            : 'stable',
          score_change: teamData.previous_snapshot.health_score 
            ? analysis.health_score - teamData.previous_snapshot.health_score 
            : 0,
          factor_trends: {},
          highlights: analysis.highlights,
          recommendations: analysis.recommendations,
          trends_vs_previous: analysis.trends_vs_previous
        },
        generated_by_user_id: user.id,
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

    const nextGeneration = new Date();
    nextGeneration.setDate(nextGeneration.getDate() + 7);
    
    await supabase
      .from('team_pulse_settings')
      .update({
        last_generated_at: new Date().toISOString(),
        next_generation_at: nextGeneration.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('team_id', team_id);

    console.log('Team Pulse generation complete');

    return new Response(
      JSON.stringify({
        success: true,
        snapshot: {
          id: snapshot.id,
          health_score: snapshot.health_score,
          infographic_url: snapshot.infographic_url,
          has_infographic: !!(snapshot.infographic_url || snapshot.infographic_base64),
          infographic_error: infographicError,
          generated_at: snapshot.generated_at,
          highlights: analysis.highlights,
          recommendations: analysis.recommendations
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-team-pulse:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});