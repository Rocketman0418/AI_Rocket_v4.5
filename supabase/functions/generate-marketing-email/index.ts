import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@^0.24.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GenerateEmailRequest {
  subject?: string;
  contentDescription: string;
  specialNotes?: string;
  previousHtml?: string;
  regenerationComments?: string;
  featureContext?: string;
  generateDynamicSubject?: boolean;
  subjectOnly?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!geminiApiKey) {
      console.error("GEMINI_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured - GEMINI_API_KEY secret missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Starting email generation request...");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      subject,
      contentDescription,
      specialNotes,
      previousHtml,
      regenerationComments,
      featureContext,
      generateDynamicSubject,
      subjectOnly
    }: GenerateEmailRequest = await req.json();

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    if (subjectOnly && generateDynamicSubject) {
      console.log("Generating subject line only...");
      const subjectPrompt = `Generate a compelling email subject line for a marketing email with this content description:

"${contentDescription}"

${subject ? `Hints/keywords to incorporate: ${subject}` : ''}

Requirements:
- Be engaging, creative, and attention-grabbing
- Maximum 60 characters
- Can include 1-2 relevant emojis if appropriate
- Should create curiosity or convey value
- Professional but energetic tone
- Do NOT use generic subjects like "Test Email" or placeholder text

Return ONLY the subject line text, nothing else.`;

      try {
        const subjectResult = await model.generateContent(subjectPrompt);
        const generatedSubject = subjectResult.response.text().trim();
        console.log("Generated subject:", generatedSubject);
        return new Response(
          JSON.stringify({ subject: generatedSubject }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (subjectError) {
        console.error("Error generating subject:", subjectError);
        return new Response(
          JSON.stringify({ subject: "AI Insights for Your Team" }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    const templateReference = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      line-height: 1.6;
      color: #e5e7eb;
      margin: 0;
      padding: 0;
      background-color: #0f172a;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #1e293b;
      border-radius: 12px;
      overflow: hidden;
    }
    .email-wrapper {
      background-color: #0f172a;
      padding: 20px;
    }
    .logo-bar {
      background-color: #1e293b;
      padding: 20px 30px;
      border-bottom: 1px solid #334155;
    }
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .header .tagline {
      margin: 8px 0 0 0;
      font-size: 14px;
      opacity: 0.95;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 20px;
      font-weight: 600;
      color: #f3f4f6;
      margin-bottom: 16px;
    }
    .intro-text {
      font-size: 16px;
      color: #d1d5db;
      margin-bottom: 24px;
      line-height: 1.7;
    }
    .section-header {
      margin-top: 32px;
      margin-bottom: 16px;
    }
    .section-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
      border-radius: 12px;
      text-align: center;
      line-height: 44px;
      font-size: 24px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #f1f5f9;
    }
    .section-subtitle {
      font-size: 13px;
      color: #94a3b8;
    }
    .insight-card {
      background: linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%);
      border: 1px solid #3b82f6;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
    }
    .insight-icon {
      font-size: 20px;
      vertical-align: top;
      padding-top: 4px;
    }
    .insight-title {
      font-size: 15px;
      font-weight: 600;
      color: #93c5fd;
      margin-bottom: 4px;
    }
    .insight-text {
      font-size: 13px;
      color: #cbd5e1;
      line-height: 1.5;
    }
    .cta-container {
      text-align: center;
      margin: 36px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
      color: white !important;
      padding: 18px 48px;
      border-radius: 50px;
      text-decoration: none;
      font-weight: 700;
      font-size: 16px;
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
    }
    .cta-subtext {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 12px;
    }
    .footer {
      background: #0f172a;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #334155;
      font-size: 12px;
      color: #64748b;
    }
    .footer a {
      color: #60a5fa;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <!-- Logo Bar with Rocket Icon + AI Rocket + Astra Intelligence -->
      <div class="logo-bar">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%); border-radius: 50%; display: inline-block; text-align: center; line-height: 40px; font-size: 20px;">&#128640;</div>
                  </td>
                  <td style="vertical-align: middle; padding-left: 12px;">
                    <span style="font-size: 18px; font-weight: 600; color: #f1f5f9;">AI Rocket</span>
                    <span style="font-size: 18px; color: #64748b; margin: 0 8px;">+</span>
                    <span style="font-size: 18px; font-weight: 600; color: #5eead4;">Astra Intelligence</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
      <!-- Header with Dynamic Subject Line -->
      <div class="header">
        <h1>{{DYNAMIC_SUBJECT}} ✨</h1>
        <p class="tagline">AI that Works for Work</p>
      </div>
      <div class="content">
        <!-- Greeting -->
        <p class="greeting">Hi {{firstName}}!</p>
        <p class="intro-text">Brief intro text here.</p>

        <!-- Section Header with Icon -->
        <div class="section-header">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="50" style="vertical-align: middle;">
                <div class="section-icon">📊</div>
              </td>
              <td style="padding-left: 12px; vertical-align: middle;">
                <div class="section-title">Section Title</div>
                <div class="section-subtitle">Section subtitle text.</div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Insight Cards (full width, icon on left) -->
        <div class="insight-card">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="32" style="vertical-align: top; padding-top: 4px;">
                <span class="insight-icon">📈</span>
              </td>
              <td>
                <div class="insight-title">Feature Title</div>
                <div class="insight-text">Feature description text goes here.</div>
              </td>
            </tr>
          </table>
        </div>

        <!-- CTA button -->
        <div class="cta-container">
          <a href="https://airocket.app" class="cta-button">Get Started</a>
          <p class="cta-subtext">Supporting text under CTA</p>
        </div>
      </div>
      <div class="footer">
        <p>You're receiving this from AI Rocket + Astra Intelligence.</p>
        <p style="margin-top: 12px;"><a href="https://airocket.app">Visit AI Rocket</a></p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    let prompt = `You are an email marketing designer for AI Rocket / Astra Intelligence.

BRAND GUIDELINES:
- Use dark theme (#0f172a background, #1e293b containers)
- Blue-to-cyan gradient for CTAs and headers (#3b82f6 to #06b6d4) - NOT purple
- Professional, friendly, energetic tone
- Focus on value and capabilities
- Use emojis purposefully for visual interest
- CTA button should link to https://airocket.app
- CTA button text should be "Get Started"
- CTA buttons should have border-radius: 50px (pill shape)

KEY PRODUCT MESSAGING:
- Astra is powered by Gemini, Claude, and OpenAI working together in alignment with your team
- Emphasize the multi-AI approach as a unique strength

CRITICAL EMAIL STRUCTURE (must follow exactly):
1. LOGO BAR at top:
   - Dark background (#1e293b) with border-bottom
   - Centered content with rocket emoji in circular gradient background
   - "AI Rocket" in white + "+" in gray + "Astra Intelligence" in teal (#5eead4)

2. HEADER with blue-to-cyan gradient (#3b82f6 to #06b6d4):
   - Shows the DYNAMIC SUBJECT LINE as h1 (can include sparkle emoji ✨)
   - Tagline: "AI that Works for Work"

3. CONTENT section:
   - Greeting: "Hi {{firstName}}!" or "Hi there!"
   - Brief intro paragraph (2-3 sentences max)
   - SECTION HEADERS: Icon in gradient box (44x44px, border-radius 12px) + title + subtitle
   - INSIGHT CARDS: Full-width cards with icon on left, title in blue (#93c5fd), description below
   - Cards should have gradient background (#1e3a5f to #1e293b) and blue border

4. CTA BUTTON:
   - Pill-shaped (border-radius: 50px)
   - Blue-cyan gradient background
   - Text like "Get Started"
   - Subtext below button

5. FOOTER:
   - Dark background
   - "You're receiving this from AI Rocket + Astra Intelligence."
   - Link to visit AI Rocket (do NOT include unsubscribe link - it's added automatically)

TEMPLATE STRUCTURE TO FOLLOW:
${templateReference}

${featureContext ? `PRODUCT FEATURE CONTEXT:\n${featureContext}\n\nUse this context to create accurate, specific content about our actual features and benefits.\n` : ''}

USER REQUEST:
Subject/Theme: ${subject || 'To be determined'}
Content Description: ${contentDescription}
${specialNotes ? `Special Instructions: ${specialNotes}` : ''}
`;

    if (previousHtml && regenerationComments) {
      prompt += `\n\nPREVIOUS VERSION:
${previousHtml}

USER FEEDBACK:
${regenerationComments}

Please regenerate the email incorporating this feedback while maintaining the brand guidelines and template structure.`;
    } else {
      prompt += `\n\nGenerate a complete HTML email that EXACTLY matches the template structure above. Include:
1. Logo bar with rocket icon + "AI Rocket" + "Astra Intelligence" (teal)
2. Header with dynamic subject as h1 and "AI that Works for Work" tagline
3. Personalized greeting with {{firstName}} variable
4. Brief opening paragraph
5. 2-3 section headers with icons in gradient boxes
6. Multiple insight cards under each section (full-width, icon on left)
7. CTA button (pill-shaped, blue-cyan gradient)
8. Professional footer (do NOT include unsubscribe links)

CRITICAL REMINDERS:
- Use blue-to-cyan gradient (#3b82f6 to #06b6d4), NOT purple
- Logo bar must have rocket emoji in circular gradient background
- Section headers must have icons in square gradient boxes with rounded corners
- Insight cards are full-width with icon on the left side
- CTA button is pill-shaped (border-radius: 50px)
- Use the exact CSS classes and structure from the template

Return ONLY the complete HTML code, no markdown formatting or additional text.`;
    }

    console.log("Calling Gemini API...");
    const result = await model.generateContent(prompt);
    const response = result.response;
    let htmlContent = response.text();

    console.log("Generated content length:", htmlContent.length);
    htmlContent = htmlContent.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

    let generatedSubject: string | undefined;

    if (generateDynamicSubject) {
      console.log("Generating dynamic subject line...");
      const subjectPrompt = `Generate a compelling email subject line for a marketing email with this content description:

"${contentDescription}"

${subject ? `Hints/keywords to incorporate: ${subject}` : ''}

Requirements:
- Be engaging, creative, and attention-grabbing
- Maximum 60 characters
- Can include 1-2 relevant emojis if appropriate
- Should create curiosity or convey value
- Professional but energetic tone
- Do NOT use generic subjects like "Test Email" or placeholder text

Return ONLY the subject line text, nothing else.`;

      try {
        const subjectResult = await model.generateContent(subjectPrompt);
        generatedSubject = subjectResult.response.text().trim();
        console.log("Generated subject:", generatedSubject);
      } catch (subjectError) {
        console.error("Error generating subject:", subjectError);
        generatedSubject = "AI Insights for Your Team";
      }
    }

    if (generatedSubject) {
      htmlContent = htmlContent.replace(/\{\{DYNAMIC_SUBJECT\}\}/g, generatedSubject);
    } else if (subject) {
      htmlContent = htmlContent.replace(/\{\{DYNAMIC_SUBJECT\}\}/g, subject);
    } else {
      htmlContent = htmlContent.replace(/\{\{DYNAMIC_SUBJECT\}\}/g, 'AI Insights for Your Team');
    }

    console.log("Email generation successful");
    return new Response(
      JSON.stringify({
        html: htmlContent,
        ...(generatedSubject && { subject: generatedSubject })
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-marketing-email function:", error);
    console.error("Error details:", error.message, error.stack);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        details: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});