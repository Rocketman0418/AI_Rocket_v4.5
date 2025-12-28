import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@^0.24.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ReportEmailRequest {
  reportId: string;
  chatMessageId: string;
  userId: string;
  userEmail: string;
  userName: string;
  reportTitle: string;
  reportContent: string;
  reportFrequency: string;
  reportPrompt: string;
  dataSources: string[];
  isTeamReport: boolean;
  isRetry?: boolean;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!geminiApiKey) {
      console.error("GEMINI_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      reportId,
      chatMessageId,
      userId,
      userEmail,
      userName,
      reportTitle,
      reportContent,
      reportFrequency,
      reportPrompt = '',
      dataSources = [],
      isTeamReport,
      isRetry = false
    }: ReportEmailRequest = await req.json();

    console.log(`Processing report email for ${userEmail}`);
    console.log(`Report: ${reportTitle} (${reportId})`);
    console.log(`Report content length: ${reportContent.length} characters`);

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('receive_report_emails, name, team_id, teams(name)')
      .eq('email', userEmail)
      .maybeSingle();

    if (userError) {
      console.error('Error fetching user:', userError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user data' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userData?.receive_report_emails) {
      console.log(`User ${userEmail} has report emails disabled, skipping`);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'User has report emails disabled' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const teamName = userData?.teams?.name || '';
    const displayReportTitle = teamName ? `${teamName} ${reportTitle}` : reportTitle;
    console.log(`Team name: ${teamName}, Display title: ${displayReportTitle}`);

    const { data: deliveryRecord, error: deliveryError } = await supabase
      .from('report_email_deliveries')
      .insert({
        report_id: reportId,
        chat_message_id: chatMessageId,
        user_id: userId,
        email: userEmail,
        status: 'pending',
        retry_count: isRetry ? 1 : 0
      })
      .select()
      .single();

    if (deliveryError) {
      console.error('Error creating delivery record:', deliveryError);
    }

    const deliveryId = deliveryRecord?.id;
    const firstName = userName?.split(' ')[0] || userData?.name?.split(' ')[0] || 'there';

    console.log('Generating email content with Gemini...');
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const emailTemplateStyles = `
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
      .toc-box {
        background: #334155;
        border-left: 4px solid #3b82f6;
        border-radius: 8px;
        padding: 20px;
        margin: 24px 0;
      }
      .toc-title {
        font-size: 14px;
        font-weight: 700;
        color: #93c5fd;
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .toc-list {
        margin: 0;
        padding-left: 20px;
        list-style-type: disc;
      }
      .toc-list li {
        font-size: 14px;
        color: #e2e8f0;
        margin-bottom: 8px;
        line-height: 1.5;
      }
      .section-divider {
        height: 1px;
        background: linear-gradient(90deg, transparent 0%, #475569 50%, transparent 100%);
        margin: 32px 0;
      }
      .section-header {
        font-size: 18px;
        font-weight: 700;
        color: #f1f5f9;
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 2px solid #3b82f6;
      }
      .insight-card {
        background: linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%);
        border: 1px solid #3b82f6;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 16px;
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
      .metadata-section {
        background: #0f172a;
        border-radius: 12px;
        padding: 24px;
        margin-top: 16px;
        border: 1px solid #334155;
      }
      .metadata-title {
        font-size: 12px;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 16px;
      }
      .metadata-row {
        margin-bottom: 12px;
      }
      .metadata-label {
        font-size: 11px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }
      .metadata-value {
        font-size: 13px;
        color: #94a3b8;
        line-height: 1.5;
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
    `;

    const prompt = `You are Astra, an AI assistant. Generate an HTML email that comprehensively summarizes THIS ENTIRE REPORT.

REPORT TITLE: ${displayReportTitle}
REPORT TYPE: ${isTeamReport ? 'Team Report' : 'Personal Report'} - ${reportFrequency}
RECIPIENT: ${firstName}

=== FULL REPORT CONTENT (Analyze ALL of this) ===
${reportContent.substring(0, 25000)}
=== END OF REPORT ===

YOUR TASK: Create a VISUALLY RICH email that covers the entire report with more graphics and less text.

REQUIRED EMAIL STRUCTURE:

1. GREETING (1-2 sentences):
   <p class="greeting">Hi ${firstName}! Your ${displayReportTitle} is ready</p>
   <p class="intro-text">Brief friendly intro (1-2 sentences max)...</p>

2. "IN THIS REPORT" - LIMIT TO 3-5 MAIN SECTIONS ONLY (not every single point):
   <div class="toc-box">
     <div class="toc-title">In This Report</div>
     <ul class="toc-list">
       <li>Main Section 1 (e.g., "AI Industry News & Analysis")</li>
       <li>Main Section 2 (e.g., "Strategic Implications")</li>
       <li>Main Section 3 (e.g., "Recommended Actions")</li>
       <li>Main Section 4 (e.g., "Tools & Technologies")</li>
     </ul>
   </div>

   IMPORTANT: Only 3-5 high-level section names. NOT a list of every key point!

3. SECTION CARDS - Group related key points under SECTION HEADERS:

   For EACH main section of the report, create a visually distinct section with:

   <!-- Section Header with Large Icon -->
   <div style="margin-top: 32px; margin-bottom: 16px;">
     <table width="100%" cellpadding="0" cellspacing="0" border="0">
       <tr>
         <td width="50" style="vertical-align: middle;">
           <div style="width: 44px; height: 44px; background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); border-radius: 12px; text-align: center; line-height: 44px; font-size: 24px;">SECTION_EMOJI</div>
         </td>
         <td style="padding-left: 12px; vertical-align: middle;">
           <div style="font-size: 18px; font-weight: 700; color: #f1f5f9;">SECTION TITLE</div>
           <div style="font-size: 13px; color: #94a3b8;">Brief section subtitle</div>
         </td>
       </tr>
     </table>
   </div>

   <!-- Key Points as Mini Cards under this section -->
   <div class="insight-card">
     <table width="100%" cellpadding="0" cellspacing="0" border="0">
       <tr>
         <td width="32" style="vertical-align: top; padding-top: 4px;">
           <span style="font-size: 20px;">POINT_EMOJI</span>
         </td>
         <td>
           <div style="font-size: 15px; font-weight: 600; color: #93c5fd; margin-bottom: 4px;">Key Point Title</div>
           <div style="font-size: 13px; color: #cbd5e1; line-height: 1.5;">Two sentence summary providing context and detail. Include relevant specifics or implications.</div>
         </td>
       </tr>
     </table>
   </div>

   <!-- Another key point card -->
   <div class="insight-card">...</div>

   IMPORTANT DESIGN RULES:
   - Each SECTION gets a big header with icon (3-5 sections total)
   - Under each section, list 2-4 KEY POINT cards with smaller icons
   - Key point descriptions should be TWO SENTENCES - the first provides the key fact, the second adds context or implications
   - Use diverse, relevant emojis for visual variety
   - The section title should capture the theme, key points are details under it

4. CTA BUTTON:
   <div class="cta-container">
     <a href="https://airocket.app" class="cta-button">View Full Report</a>
     <p class="cta-subtext">See the complete analysis in AI Rocket</p>
   </div>

CRITICAL RULES:
- Organize content into 3-5 MAIN SECTIONS with clear headers
- Each section groups related key points together
- Each key point gets exactly TWO sentences - one for the main fact, one for context/implications
- Use large section headers to break up content visually
- "In This Report" should list ONLY the section names (3-5 items)
- Use TABLE layouts for email compatibility
- Make it visually scannable with clear hierarchy

HTML TEMPLATE:
<!DOCTYPE html>
<html>
<head>
  <style>
${emailTemplateStyles}
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
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
      <div class="header">
        <h1>${displayReportTitle}</h1>
        <p class="tagline">Your ${reportFrequency} report from Astra</p>
      </div>
      <div class="content">
        <!-- Greeting -->
        <!-- In This Report (TOC) box -->
        <!-- ALL insight cards covering every topic -->
        <!-- CTA button -->
      </div>
      <div class="footer">
        <p>You're receiving this because you have report email notifications enabled.</p>
        <p style="margin-top: 12px;"><a href="https://airocket.app">AI Rocket + Astra Intelligence</a> - AI that Works for Work</p>
      </div>
    </div>
  </div>
</body>
</html>

Return ONLY the complete HTML code. No markdown formatting or code blocks.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let emailHtml = response.text();

    emailHtml = emailHtml.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

    const metadataSection = `
      <div class="metadata-section">
        <div class="metadata-title">Report Details</div>
        <div class="metadata-row">
          <div class="metadata-label">Report Name</div>
          <div class="metadata-value">${displayReportTitle}</div>
        </div>
        <div class="metadata-row">
          <div class="metadata-label">Report Type</div>
          <div class="metadata-value">${isTeamReport ? 'Team Report' : 'Personal Report'} - ${reportFrequency}</div>
        </div>
        ${reportPrompt ? `
        <div class="metadata-row">
          <div class="metadata-label">Report Prompt</div>
          <div class="metadata-value">${reportPrompt.substring(0, 300)}${reportPrompt.length > 300 ? '...' : ''}</div>
        </div>
        ` : ''}
      </div>
    `;

    const footerIndex = emailHtml.lastIndexOf('<div class="footer">');
    if (footerIndex > -1) {
      emailHtml = emailHtml.slice(0, footerIndex) + metadataSection + emailHtml.slice(footerIndex);
    }

    console.log('Email content generated');

    console.log(`Sending email to ${userEmail}...`);
    const emailSubject = `${displayReportTitle} is Ready`;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Astra Intelligence <astra@airocket.app>",
        to: userEmail,
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error(`Failed to send email:`, resendResponse.status, errorText);

      if (deliveryId) {
        await supabase
          .from('report_email_deliveries')
          .update({
            status: isRetry ? 'retry_failed' : 'failed',
            error_message: errorText,
            updated_at: new Date().toISOString()
          })
          .eq('id', deliveryId);
      }

      if (!isRetry) {
        console.log('Scheduling retry in 30 seconds...');

        const retryPromise = (async () => {
          await delay(30000);

          console.log('Executing retry...');
          const retryPayload: ReportEmailRequest = {
            reportId,
            chatMessageId,
            userId,
            userEmail,
            userName,
            reportTitle,
            reportContent,
            reportFrequency,
            reportPrompt,
            dataSources,
            isTeamReport,
            isRetry: true
          };

          try {
            await fetch(`${supabaseUrl}/functions/v1/send-report-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(retryPayload)
            });
          } catch (retryError) {
            console.error('Retry request failed:', retryError);
          }
        })();

        EdgeRuntime.waitUntil(retryPromise);
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorText,
          willRetry: !isRetry
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendData = await resendResponse.json();
    console.log(`Email sent successfully to ${userEmail}, ID: ${resendData.id}`);

    if (deliveryId) {
      await supabase
        .from('report_email_deliveries')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', deliveryId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailId: resendData.id,
        recipient: userEmail
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-report-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});