import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@^0.24.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY")!;

    if (!resendApiKey || !geminiApiKey) {
      console.error("Required API keys not configured");
      return new Response(
        JSON.stringify({ error: "Service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: recurringEmails, error: fetchError } = await supabaseAdmin
      .from('marketing_emails')
      .select('*')
      .eq('is_recurring', true)
      .eq('status', 'recurring')
      .lte('next_run_at', new Date().toISOString());

    if (fetchError) {
      console.error("Error fetching recurring emails:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch recurring emails" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!recurringEmails || recurringEmails.length === 0) {
      console.log("No recurring emails due to process");
      return new Response(
        JSON.stringify({ message: "No recurring emails to process", processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${recurringEmails.length} recurring emails`);

    const results = [];

    for (const template of recurringEmails) {
      try {
        console.log(`Processing recurring email: ${template.id} - ${template.subject}`);

        const generatedHtml = await generateEmailContent(
          geminiApiKey,
          template.subject,
          template.content_description,
          template.special_notes,
          template.context_type
        );

        const { data: childEmail, error: childError } = await supabaseAdmin
          .from('marketing_emails')
          .insert({
            subject: template.subject,
            content_description: template.content_description,
            special_notes: template.special_notes,
            html_content: generatedHtml,
            recipient_filter: template.recipient_filter,
            context_type: template.context_type,
            status: 'sending',
            parent_recurring_id: template.id,
            created_by: template.created_by
          })
          .select()
          .single();

        if (childError || !childEmail) {
          console.error(`Failed to create child email for ${template.id}:`, childError);
          results.push({ id: template.id, success: false, error: 'Failed to create child email' });
          continue;
        }

        const sendResult = await sendCampaign(
          supabaseAdmin,
          resendApiKey,
          childEmail.id,
          childEmail.html_content,
          childEmail.subject,
          template.recipient_filter
        );

        const nextRunAt = calculateNextRunAt(template.frequency);
        
        await supabaseAdmin
          .from('marketing_emails')
          .update({
            last_run_at: new Date().toISOString(),
            next_run_at: nextRunAt,
            run_count: (template.run_count || 0) + 1
          })
          .eq('id', template.id);

        results.push({
          id: template.id,
          success: true,
          childEmailId: childEmail.id,
          recipientCount: sendResult.total,
          successfulSends: sendResult.successful,
          failedSends: sendResult.failed
        });

        console.log(`Successfully processed recurring email ${template.id}`);

      } catch (error) {
        console.error(`Error processing recurring email ${template.id}:`, error);
        results.push({ id: template.id, success: false, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in process-recurring-marketing-emails:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function calculateNextRunAt(frequency: string): string {
  const now = new Date();
  switch (frequency) {
    case 'daily':
      now.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      now.setDate(now.getDate() + 7);
      break;
    case 'biweekly':
      now.setDate(now.getDate() + 14);
      break;
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      break;
    default:
      now.setDate(now.getDate() + 7);
  }
  now.setHours(9, 0, 0, 0);
  return now.toISOString();
}

async function generateEmailContent(
  geminiApiKey: string,
  subject: string,
  contentDescription: string,
  specialNotes: string,
  contextType: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const templateReference = `
<!DOCTYPE html>
<html>
  <head>
    <meta name="color-scheme" content="light dark">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        line-height: 1.6;
        color: #e5e7eb !important;
        margin: 0 !important;
        padding: 0 !important;
        background-color: #0f172a !important;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background-color: #1e293b !important;
        border-radius: 12px;
        overflow: hidden;
      }
      .header {
        background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
        color: white;
        padding: 40px 30px;
        text-align: center;
      }
      .content { padding: 40px 30px; }
      .cta-button {
        display: inline-block;
        background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
        color: white !important;
        padding: 18px 48px;
        border-radius: 12px;
        text-decoration: none;
        font-weight: 700;
      }
      .benefit-card {
        background: #1e3a5f;
        border: 1px solid #3b82f6;
        border-radius: 10px;
        padding: 20px 16px;
        text-align: center;
      }
      .footer {
        background: #0f172a;
        padding: 30px;
        text-align: center;
        border-top: 1px solid #334155;
        font-size: 13px;
        color: #94a3b8;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>AI Rocket + Astra Intelligence</h1>
        <p>AI that Works for Work</p>
      </div>
      <div class="content"><!-- Content here --></div>
      <div class="footer"><!-- Footer --></div>
    </div>
  </body>
</html>`;

  const prompt = `You are an email marketing designer for AI Rocket / Astra Intelligence.

BRAND GUIDELINES:
- Use dark theme (#0f172a background, #1e293b containers)
- Blue-purple gradient for CTAs (#3b82f6 to #8b5cf6)
- Professional, friendly tone
- CTA links to https://airocket.app

KEY MESSAGING:
- Astra is powered by Gemini, Claude, and OpenAI working together
- Multi-AI approach as a unique strength

TEMPLATE STRUCTURE:
${templateReference}

USER REQUEST:
Subject: ${subject}
Content Description: ${contentDescription}
${specialNotes ? `Special Instructions: ${specialNotes}` : ''}

IMPORTANT: This is a RECURRING email. The user may have specified to select random features or vary content. Make sure to create FRESH, UNIQUE content that differs from previous sends. If instructed to pick random items from a list, actually randomize your selection.

Generate a complete HTML email with:
1. Header with "AI Rocket + Astra Intelligence"
2. Personalized greeting with {{firstName}} variable
3. Engaging content based on the description
4. 4-6 benefit cards using HTML TABLE layout
5. CTA buttons linking to https://airocket.app
6. Professional footer

Return ONLY the complete HTML code.`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  let htmlContent = response.text();
  htmlContent = htmlContent.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
  
  return htmlContent;
}

async function sendCampaign(
  supabase: any,
  resendApiKey: string,
  emailId: string,
  htmlContent: string,
  subject: string,
  recipientFilter: any
): Promise<{ total: number; successful: number; failed: number }> {
  let recipients: { id: string | null; email: string; firstName: string }[] = [];

  if (recipientFilter?.type === 'preview_requests') {
    const { data: previewRequests } = await supabase
      .rpc('get_preview_requests_with_onboarding');
    
    const notYetSignedUp = previewRequests?.filter((req: any) => !req.user_onboarded) || [];
    recipients = notYetSignedUp.map((req: any) => ({
      id: null,
      email: req.email,
      firstName: 'there'
    }));
  } else if (recipientFilter?.type === 'specific' && recipientFilter.emails?.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, email, name')
      .in('email', recipientFilter.emails);
    
    recipients = (users || []).map((u: any) => ({
      id: u.id,
      email: u.email,
      firstName: u.name?.split(' ')[0] || 'there'
    }));
  } else {
    const { data: users } = await supabase
      .from('users')
      .select('id, email, name');
    
    recipients = (users || []).map((u: any) => ({
      id: u.id,
      email: u.email,
      firstName: u.name?.split(' ')[0] || 'there'
    }));
  }

  await supabase
    .from('marketing_emails')
    .update({ total_recipients: recipients.length })
    .eq('id', emailId);

  const recipientRecords = recipients.map(r => ({
    marketing_email_id: emailId,
    user_id: r.id,
    email: r.email,
    status: 'pending'
  }));

  if (recipientRecords.length > 0) {
    await supabase
      .from('marketing_email_recipients')
      .insert(recipientRecords);
  }

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    
    if (i > 0 && i % 2 === 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    let emailHtml = htmlContent.replace(/\{\{firstName\}\}/g, recipient.firstName);

    try {
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Astra Intelligence <astra@rockethub.ai>",
          to: recipient.email,
          subject: subject,
          html: emailHtml,
        }),
      });

      if (!resendResponse.ok) {
        const errorText = await resendResponse.text();
        await supabase
          .from('marketing_email_recipients')
          .update({ status: 'failed', error_message: errorText })
          .eq('marketing_email_id', emailId)
          .eq('email', recipient.email);
        failCount++;
      } else {
        const resendData = await resendResponse.json();
        await supabase
          .from('marketing_email_recipients')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            email_id: resendData.id
          })
          .eq('marketing_email_id', emailId)
          .eq('email', recipient.email);
        successCount++;
      }
    } catch (error) {
      await supabase
        .from('marketing_email_recipients')
        .update({ status: 'failed', error_message: error.message })
        .eq('marketing_email_id', emailId)
        .eq('email', recipient.email);
      failCount++;
    }
  }

  await supabase
    .from('marketing_emails')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      successful_sends: successCount,
      failed_sends: failCount
    })
    .eq('id', emailId);

  return { total: recipients.length, successful: successCount, failed: failCount };
}