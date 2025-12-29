import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CampaignRequest {
  marketingEmailId: string;
  recipientFilter?: {
    type?: 'all' | 'specific' | 'preview_requests';
    types?: ('all_users' | 'specific' | 'preview_requests' | 'marketing_contacts')[];
    emails?: string[];
  };
}

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

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { marketingEmailId, recipientFilter }: CampaignRequest = await req.json();

    const { data: emailData, error: emailError } = await supabaseAdmin
      .from('marketing_emails')
      .select('*')
      .eq('id', marketingEmailId)
      .single();

    if (emailError || !emailData) {
      return new Response(
        JSON.stringify({ error: "Marketing email not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let recipients: { id: string | null; email: string; firstName: string }[] = [];
    const seenEmails = new Set<string>();

    const addRecipient = (r: { id: string | null; email: string; firstName: string }) => {
      const emailLower = r.email.toLowerCase();
      if (!seenEmails.has(emailLower)) {
        seenEmails.add(emailLower);
        recipients.push(r);
      }
    };

    let types: string[] = [];
    if (recipientFilter?.types && recipientFilter.types.length > 0) {
      types = recipientFilter.types;
    } else if (recipientFilter?.type) {
      types = [recipientFilter.type === 'all' ? 'all_users' : recipientFilter.type];
    } else {
      types = ['all_users'];
    }

    if (types.includes('all_users')) {
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('id, email, name');

      if (error) {
        console.error("Error fetching all users:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch users" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      users.forEach(u => addRecipient({
        id: u.id,
        email: u.email,
        firstName: u.name?.split(' ')[0] || 'there'
      }));
    }

    if (types.includes('preview_requests')) {
      const { data: previewRequests, error } = await supabaseAdmin
        .rpc('get_preview_requests_with_onboarding');

      if (error) {
        console.error("Error fetching preview requests:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch preview requests" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const notYetSignedUp = previewRequests.filter((req: any) => !req.user_onboarded);
      notYetSignedUp.forEach((req: any) => addRecipient({
        id: null,
        email: req.email,
        firstName: 'there'
      }));
    }

    if (types.includes('marketing_contacts')) {
      const { data: contacts, error } = await supabaseAdmin
        .rpc('get_marketing_contacts_for_campaign');

      if (error) {
        console.error("Error fetching marketing contacts:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch marketing contacts" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      contacts.forEach((c: any) => addRecipient({
        id: null,
        email: c.email,
        firstName: c.first_name || 'there'
      }));
    }

    if (types.includes('specific') && recipientFilter?.emails && recipientFilter.emails.length > 0) {
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('id, email, name')
        .in('email', recipientFilter.emails);

      if (error) {
        console.error("Error fetching specific users:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch users" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      users.forEach(u => addRecipient({
        id: u.id,
        email: u.email,
        firstName: u.name?.split(' ')[0] || 'there'
      }));
    }

    await supabaseAdmin
      .from('marketing_emails')
      .update({
        total_recipients: recipients.length,
        status: 'sending'
      })
      .eq('id', marketingEmailId);

    const recipientRecords = recipients.map(r => ({
      marketing_email_id: marketingEmailId,
      user_id: r.id,
      email: r.email,
      status: 'pending'
    }));

    if (recipientRecords.length > 0) {
      await supabaseAdmin
        .from('marketing_email_recipients')
        .insert(recipientRecords);
    }

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];

      if (i > 0 && i % 2 === 0) {
        await delay(1000);
      }

      let emailHtml = emailData.html_content;
      emailHtml = emailHtml.replace(/\{\{firstName\}\}/g, recipient.firstName);

      try {
        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "AI Rocket <astra@airocket.app>",
            to: recipient.email,
            subject: emailData.subject,
            html: emailHtml,
          }),
        });

        if (!resendResponse.ok) {
          const errorText = await resendResponse.text();
          console.error(`Failed to send to ${recipient.email}:`, resendResponse.status, errorText);

          await supabaseAdmin
            .from('marketing_email_recipients')
            .update({
              status: 'failed',
              error_message: errorText
            })
            .eq('marketing_email_id', marketingEmailId)
            .eq('email', recipient.email);

          failCount++;
        } else {
          const resendData = await resendResponse.json();

          await supabaseAdmin
            .from('marketing_email_recipients')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              email_id: resendData.id
            })
            .eq('marketing_email_id', marketingEmailId)
            .eq('email', recipient.email);

          successCount++;
          console.log(`Email sent successfully to ${recipient.email}`);
        }
      } catch (error) {
        console.error(`Error sending to ${recipient.email}:`, error);

        await supabaseAdmin
          .from('marketing_email_recipients')
          .update({
            status: 'failed',
            error_message: error.message
          })
          .eq('marketing_email_id', marketingEmailId)
          .eq('email', recipient.email);

        failCount++;
      }
    }

    await supabaseAdmin
      .from('marketing_emails')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        successful_sends: successCount,
        failed_sends: failCount
      })
      .eq('id', marketingEmailId);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Campaign completed`,
        total_recipients: recipients.length,
        successful_sends: successCount,
        failed_sends: failCount
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-marketing-email-campaign function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});