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
  team_snapshot: string;
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
${data.previous_snapshot.generated_at ? `Previous pulse generated: ${data.previous_snapshot.generated_at}` : 'First snapshot'}

Provide JSON response:
{
  "team_snapshot": "<DETAILED 4-5 sentence comprehensive overview of the team's current state. Include: what the team is working on, key accomplishments from the past 30 days, current priorities, notable team dynamics or collaboration patterns, and any significant milestones or progress. Be specific and reference actual projects, decisions, and activities from the data. This should paint a complete picture of where the team stands today.>",
  "key_metrics": {
    "active_projects": "<CURRENT projects only - be specific with names and status>",
    "recent_decisions": "<decisions from LAST 30 DAYS only - be specific>",
    "upcoming_deadlines": "<deadlines in the next 30-60 days>",
    "financial_status": "<CURRENT financial status or 'Not specified' if no data>",
    "team_focus_areas": "<what the team is focused on RIGHT NOW - be specific>"
  },
  "highlights": ["<insight 1: pattern or theme observed across ALL 30-day data>", "<insight 2: another pattern or theme>", "<insight 3: key observation about team dynamics>"],
  "recommendations": ["<trend 1: high-level business trend from 30-day data>", "<trend 2: emerging pattern or shift>", "<trend 3: notable direction or trajectory>"],
  "trends_vs_previous": "<comparison to last pulse or 'First snapshot' if none>",
  "short_highlights": ["<3-5 word COMPLETE phrase, e.g. 'Strong strategic alignment'>", "<3-5 word phrase, e.g. 'High team momentum'>", "<3-5 word phrase, e.g. 'Active project pipeline'>"],
  "short_insights": ["<3-5 word COMPLETE observation, e.g. 'Active project development'>", "<3-5 word observation, e.g. 'Growing team collaboration'>", "<3-5 word observation, e.g. 'Clear goal alignment'>"],
  "short_trends": ["<3-5 word COMPLETE trend, e.g. 'Increasing operational efficiency'>", "<3-5 word trend, e.g. 'Rising customer focus'>", "<3-5 word trend, e.g. 'Expanding market presence'>"]
}

STRICT RULES:
1. IGNORE any product/project that was completed more than 30 days ago
2. IGNORE any pricing/subscription models from old products
3. For "team_snapshot": Write a DETAILED 4-5 sentence summary that covers what the team is working on, recent accomplishments, current priorities, and notable team dynamics. Be specific and reference actual data.
4. For "highlights" (INSIGHTS): Analyze ALL data from the last 30 days and identify patterns, themes, and observations across the entire dataset. DO NOT pick specific individual items - synthesize high-level insights.
5. For "recommendations" (TRENDS): Identify high-level business trends, emerging patterns, and directional shifts. Focus on trajectories and patterns, NOT specific action items.
6. If a date in the content is before ${cutoffStr}, SKIP that information entirely
7. PRIORITIZE the most recent data (last 7-14 days) when analyzing
8. CRITICAL FOR SHORT PHRASES: Each phrase MUST be a COMPLETE thought in 3-5 words. Examples of GOOD phrases: "Strong strategic execution", "High team momentum". Examples of BAD phrases (DO NOT USE): "The team is maintaining", "While financial reserves".

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
      team_snapshot: 'The team is building its knowledge base and establishing documentation practices. Activity patterns are emerging as the team develops its operational foundation. Review available documents for specific insights into current projects and priorities.',
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
  const recentDecisions = analysis.key_metrics.recent_decisions || '';
  const upcomingDeadlines = analysis.key_metrics.upcoming_deadlines || '';
  const teamSnapshot = analysis.team_snapshot || '';

  const businessContext = `${focusAreas} ${activeProjects} ${financialStatus}`.toLowerCase();

  let themeContext = 'technology and innovation';
  let accentStyle = 'electric blue (#3B82F6), cyan (#06B6D4), and dark slate (#1E293B) with gradient accents';

  if (businessContext.includes('health') || businessContext.includes('medical') || businessContext.includes('wellness')) {
    themeContext = 'healthcare and wellness';
    accentStyle = 'calming teal (#14B8A6), green (#22C55E), clean white, and soft gradients';
  } else if (businessContext.includes('financ') || businessContext.includes('invest') || businessContext.includes('banking')) {
    themeContext = 'finance and investment';
    accentStyle = 'deep navy (#1E3A5F), gold (#F59E0B), professional gray, and metallic accents';
  } else if (businessContext.includes('market') || businessContext.includes('brand') || businessContext.includes('creative')) {
    themeContext = 'marketing and creative';
    accentStyle = 'vibrant coral (#F97316), warm orange, charcoal (#374151), and dynamic gradients';
  } else if (businessContext.includes('real estate') || businessContext.includes('property') || businessContext.includes('homes')) {
    themeContext = 'real estate and property';
    accentStyle = 'warm terracotta (#C2410C), sage green (#84CC16), cream, and earthy professional tones';
  } else if (businessContext.includes('consult') || businessContext.includes('service') || businessContext.includes('client')) {
    themeContext = 'professional services';
    accentStyle = 'sophisticated slate (#475569), copper (#EA580C), cream (#FEF3C7), and elegant highlights';
  }

  const shortHighlights = analysis.short_highlights || ['Strong team momentum', 'Solid execution focus', 'Building foundation'];
  const shortInsights = analysis.short_insights || ['Active project development', 'Growing collaboration', 'Clear goal alignment'];
  const shortTrends = analysis.short_trends || ['Increasing efficiency', 'Rising engagement', 'Expanding capabilities'];
  const fullHighlights = analysis.highlights || [];
  const fullRecommendations = analysis.recommendations || [];

  const prompt = `Create an infographic for "${teamName}" Team Pulse report. Focus on VISUAL STORYTELLING with MINIMAL TEXT.

INDUSTRY: ${themeContext}
COLORS: ${accentStyle}. Light background (#F8FAFC or white).

=== SPECS ===
- Landscape 1920x1080 (16:9)
- Mostly graphics/icons with minimal text
- NO photographs or human faces
- Clean, modern, professional

=== LAYOUT ===
Two main sections side by side: Team Snapshot on the left (larger), Insights & Trends on the right (smaller).
DO NOT display any percentage numbers or labels like "60%" or "40%" in the design.

=== HEADER (compact) ===
"${teamName}: Team Pulse" | ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} | Rocket icon

=== SECTION 1: TEAM SNAPSHOT (LEFT/CENTER - main focus) ===
The primary section. Show current state visually:

**Overview (use icons, minimal text):**
- ${memberCount} members
- Focus: ${focusAreas || 'Building and growing'}
- Projects: ${activeProjects || 'Multiple initiatives'}

**Key Details (icons with short labels):**
- Decisions: ${recentDecisions || 'Strategic planning'}
- Upcoming: ${upcomingDeadlines || 'Milestones tracked'}
${financialStatus && financialStatus !== 'Not specified' ? `- Financial: ${financialStatus}` : ''}

**Snapshot Summary:**
${teamSnapshot}

**Use visuals:** Timeline, milestone markers, status dots, workflow arrows, team diagram icon

=== SECTION 2: INSIGHTS & TRENDS (RIGHT - secondary) ===

**Insights (lightbulb icons):**
${fullHighlights.slice(0, 2).map((h, i) => `${i + 1}. ${h}`).join('\n') || '1. Building momentum\n2. Growing collaboration'}

**Trends (arrow icons):**
${fullRecommendations.slice(0, 2).map((r, i) => `${i + 1}. ${r}`).join('\n') || '1. Positive trajectory\n2. Operations maturing'}

**Quick Tags (pill/badge style):**
${shortHighlights.slice(0, 2).map(h => `• ${h}`).join('\n')}
${shortTrends.slice(0, 2).map(t => `• ${t}`).join('\n')}

**Use visuals:** Trend arrows, mini charts, connecting nodes, flowchart elements

=== FOOTER (small) ===
"Powered by AI Rocket"

=== DESIGN RULES ===
1. LESS TEXT - use icons and visuals to convey meaning
2. Clear hierarchy: Header > Snapshot > Insights
3. Lots of white space
4. Every icon serves a purpose
5. Premium, clean aesthetic
6. DO NOT include any percentage labels or numbers like "60%" or "40%" anywhere in the design

=== DO NOT ===
- NO human faces
- NO walls of text - keep it visual
- NO purple/indigo colors
- NO cluttered layouts
- NO percentage labels (like "60%" or "40%") in section headers`;

  console.log('[Image Gen] Creative direction:', { themeContext, accentStyle });

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
    console.log('Analysis complete. Team snapshot generated.');

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

    const { data: snapshot, error: snapshotError } = await supabase
      .from('team_pulse_snapshots')
      .insert({
        team_id,
        health_score: 0,
        health_explanation: analysis.team_snapshot,
        health_factors: {},
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
          key_metrics: analysis.key_metrics
        },
        insights_and_trends: {
          score_trend: 'stable',
          score_change: 0,
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

    const now = new Date();
    const nextMonday = new Date(now);
    const dayOfWeek = now.getUTCDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 7 : (8 - dayOfWeek);
    nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday);
    nextMonday.setUTCHours(8, 0, 0, 0);

    await supabase
      .from('team_pulse_settings')
      .update({
        last_generated_at: new Date().toISOString(),
        next_generation_at: nextMonday.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('team_id', team_id);

    console.log('Team Pulse generation complete');

    return new Response(
      JSON.stringify({
        success: true,
        snapshot: {
          id: snapshot.id,
          team_snapshot: analysis.team_snapshot,
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