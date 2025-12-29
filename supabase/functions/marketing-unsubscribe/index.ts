import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(
        generateHtmlPage("Invalid Request", "No unsubscribe token provided.", false),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    const { data: contact, error: fetchError } = await supabaseAdmin
      .from("marketing_contacts")
      .select("id, email, first_name, unsubscribed")
      .eq("unsubscribe_token", token)
      .maybeSingle();

    if (fetchError || !contact) {
      return new Response(
        generateHtmlPage("Not Found", "This unsubscribe link is invalid or has expired.", false),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    if (contact.unsubscribed) {
      return new Response(
        generateHtmlPage(
          "Already Unsubscribed",
          `${contact.email} has already been unsubscribed from our marketing emails.`,
          true
        ),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("marketing_contacts")
      .update({
        unsubscribed: true,
        unsubscribed_at: new Date().toISOString(),
      })
      .eq("id", contact.id);

    if (updateError) {
      console.error("Error updating unsubscribe status:", updateError);
      return new Response(
        generateHtmlPage("Error", "An error occurred while processing your request. Please try again.", false),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    return new Response(
      generateHtmlPage(
        "Successfully Unsubscribed",
        `${contact.email} has been unsubscribed from AI Rocket marketing emails. You will no longer receive promotional emails from us.`,
        true
      ),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html" } }
    );
  } catch (error) {
    console.error("Error in marketing-unsubscribe:", error);
    return new Response(
      generateHtmlPage("Error", "An unexpected error occurred. Please try again later.", false),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "text/html" } }
    );
  }
});

function generateHtmlPage(title: string, message: string, success: boolean): string {
  const iconColor = success ? "#10b981" : "#ef4444";
  const icon = success
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - AI Rocket</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: #1e293b;
      border-radius: 16px;
      padding: 48px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      border: 1px solid #334155;
    }
    .icon {
      margin-bottom: 24px;
    }
    h1 {
      color: #f1f5f9;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 16px;
    }
    p {
      color: #94a3b8;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 32px;
    }
    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding-top: 24px;
      border-top: 1px solid #334155;
    }
    .logo-icon {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }
    .logo-text {
      color: #f1f5f9;
      font-size: 16px;
      font-weight: 600;
    }
    .home-link {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 24px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .home-link:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="https://airocket.app" class="home-link">Visit AI Rocket</a>
    <div class="logo">
      <div class="logo-icon">&#128640;</div>
      <span class="logo-text">AI Rocket + Astra Intelligence</span>
    </div>
  </div>
</body>
</html>`;
}