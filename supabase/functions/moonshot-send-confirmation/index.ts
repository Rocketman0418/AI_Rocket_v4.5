import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ConfirmationRequest {
  registrationId: string;
  email: string;
  name: string;
  inviteCode: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { registrationId, email, name, inviteCode }: ConfirmationRequest = await req.json();

    if (!email || !name || !inviteCode) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firstName = name.split(' ')[0];
    const appUrl = 'https://airocket.app';

    const emailSubject = `Your Moonshot Challenge Launch Code: ${inviteCode}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="color-scheme" content="light dark">
          <meta name="supported-color-schemes" content="light dark">
          <style>
            :root {
              color-scheme: light dark;
              supported-color-schemes: light dark;
            }
            body {
              font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              line-height: 1.6;
              color: #e5e7eb !important;
              margin: 0 !important;
              padding: 0 !important;
              background-color: #0A0F1C !important;
            }
            .container {
              max-width: 640px;
              margin: 40px auto;
              background-color: #0A0F1C !important;
              border-radius: 20px;
              overflow: hidden;
            }
            .email-wrapper {
              background-color: #0A0F1C !important;
              padding: 20px;
            }
            .header {
              background: linear-gradient(180deg, #0A0F1C 0%, #131B2E 100%);
              color: white;
              padding: 48px 30px 40px;
              text-align: center;
              position: relative;
            }
            .header::before {
              content: '';
              position: absolute;
              top: 20%;
              left: 20%;
              width: 200px;
              height: 200px;
              background: radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, transparent 70%);
              border-radius: 50%;
            }
            .header::after {
              content: '';
              position: absolute;
              bottom: 20%;
              right: 20%;
              width: 200px;
              height: 200px;
              background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%);
              border-radius: 50%;
            }
            .brand-section {
              position: relative;
              z-index: 1;
            }
            .rocket-icon {
              display: inline-block;
              width: 64px;
              height: 64px;
              background: linear-gradient(145deg, #5BA4E6, #3B82C4);
              border-radius: 16px;
              font-size: 36px;
              line-height: 64px;
              text-align: center;
              margin-bottom: 12px;
              box-shadow: 0 8px 32px rgba(59, 130, 196, 0.4);
            }
            .brand-name {
              font-size: 42px;
              font-weight: 800;
              color: white;
              margin: 8px 0 4px;
              letter-spacing: -0.5px;
            }
            .brand-tagline {
              font-size: 14px;
              color: #6b7280;
              letter-spacing: 1px;
              margin-bottom: 24px;
            }
            .challenge-title {
              font-size: 32px;
              font-weight: 800;
              color: #fbbf24;
              margin: 0;
            }
            .registered-badge {
              display: inline-block;
              background: linear-gradient(135deg, #f97316 0%, #10b981 100%);
              color: white;
              font-size: 13px;
              font-weight: 600;
              padding: 8px 20px;
              border-radius: 20px;
              margin-top: 16px;
              letter-spacing: 0.5px;
            }
            .content {
              padding: 40px 30px;
              background: #131B2E;
            }
            .greeting {
              font-size: 22px;
              font-weight: 600;
              color: #f3f4f6;
              margin-bottom: 16px;
            }
            .message {
              font-size: 16px;
              color: #9ca3af;
              margin-bottom: 24px;
              line-height: 1.7;
            }
            .invite-box {
              background: linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(16, 185, 129, 0.1));
              border: 2px solid #f97316;
              border-radius: 20px;
              padding: 24px 16px;
              margin: 32px 0;
              text-align: center;
            }
            @media only screen and (min-width: 480px) {
              .invite-box {
                padding: 36px;
              }
            }
            .launch-label {
              font-size: 11px;
              text-transform: uppercase;
              color: #94a3b8;
              font-weight: 700;
              letter-spacing: 2px;
              margin-bottom: 16px;
            }
            .launch-code {
              font-size: 32px;
              font-weight: 700;
              color: #f97316;
              font-family: 'Courier New', monospace;
              letter-spacing: 4px;
              margin-bottom: 16px;
              word-break: break-all;
            }
            @media only screen and (min-width: 480px) {
              .launch-code {
                font-size: 40px;
                letter-spacing: 6px;
              }
            }
            .valid-date {
              display: inline-block;
              background: rgba(251, 191, 36, 0.15);
              color: #fbbf24;
              font-size: 13px;
              font-weight: 600;
              padding: 10px 20px;
              border-radius: 25px;
              margin-top: 8px;
            }
            .countdown-section {
              margin-top: 24px;
              padding-top: 24px;
              border-top: 1px solid rgba(249, 115, 22, 0.3);
            }
            .countdown-label {
              font-size: 11px;
              text-transform: uppercase;
              color: #94a3b8;
              font-weight: 700;
              letter-spacing: 2px;
              margin-bottom: 16px;
            }
            .countdown-note {
              font-size: 11px;
              color: #64748b;
              margin-top: 12px;
              font-style: italic;
            }
            .countdown-table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 6px;
            }
            .countdown-cell {
              background: rgba(249, 115, 22, 0.15);
              border: 1px solid rgba(249, 115, 22, 0.3);
              border-radius: 10px;
              padding: 12px 4px;
              text-align: center;
              width: 25%;
            }
            .countdown-value {
              font-size: 24px;
              font-weight: 800;
              color: #f97316;
              font-family: 'Courier New', monospace;
              line-height: 1;
            }
            .countdown-unit {
              font-size: 8px;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-top: 6px;
            }
            @media only screen and (min-width: 480px) {
              .countdown-cell {
                padding: 16px 8px;
                border-radius: 12px;
              }
              .countdown-value {
                font-size: 32px;
              }
              .countdown-unit {
                font-size: 9px;
                letter-spacing: 1px;
                margin-top: 8px;
              }
            }
            .stats-section {
              margin: 36px 0;
            }
            .stats-table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 6px;
            }
            .stat-cell {
              background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
              border: 2px solid #475569;
              border-radius: 12px;
              padding: 16px 8px;
              text-align: center;
              width: 25%;
              vertical-align: top;
            }
            .stat-value {
              font-size: 22px;
              font-weight: 800;
              color: white;
              margin-bottom: 4px;
              height: 28px;
              line-height: 28px;
              display: block;
            }
            .stat-label {
              font-size: 8px;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              font-weight: 600;
              display: block;
            }
            @media only screen and (min-width: 480px) {
              .stats-table {
                border-spacing: 10px;
              }
              .stat-cell {
                border-radius: 16px;
                padding: 24px 16px;
              }
              .stat-value {
                font-size: 32px;
                height: 40px;
                line-height: 40px;
                margin-bottom: 8px;
              }
              .stat-label {
                font-size: 11px;
                letter-spacing: 1px;
              }
            }
            .timeline-section {
              background: linear-gradient(180deg, #1e293b 0%, #1a2234 100%);
              border-radius: 20px;
              padding: 32px;
              margin: 36px 0;
            }
            .timeline-title {
              font-size: 22px;
              font-weight: 700;
              color: #f3f4f6;
              margin-bottom: 28px;
            }
            .timeline-item {
              padding: 20px 0;
              border-bottom: 1px solid rgba(71, 85, 105, 0.5);
            }
            .timeline-item:last-child {
              border-bottom: none;
              padding-bottom: 0;
            }
            .timeline-date {
              font-size: 16px;
              font-weight: 700;
              color: #f97316;
              margin-bottom: 8px;
            }
            .timeline-desc {
              font-size: 15px;
              color: #9ca3af;
              line-height: 1.6;
            }
            .cta-container {
              text-align: center;
              margin: 36px 0;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #f97316 0%, #10b981 100%);
              color: white;
              padding: 18px 52px;
              border-radius: 50px;
              text-decoration: none;
              font-weight: 700;
              font-size: 17px;
              box-shadow: 0 8px 32px rgba(249, 115, 22, 0.35);
            }
            .important-box {
              background: rgba(249, 115, 22, 0.08);
              border-left: 4px solid #f97316;
              border-radius: 0 12px 12px 0;
              padding: 20px 24px;
              margin: 32px 0;
            }
            .important-box strong {
              color: #f97316;
            }
            .important-box .code-highlight {
              color: #fbbf24;
              font-weight: 700;
              font-family: 'Courier New', monospace;
            }
            .footer {
              background: #0A0F1C;
              padding: 32px 30px;
              text-align: center;
              border-top: 1px solid #1e293b;
            }
            .footer p {
              font-size: 14px;
              color: #64748b;
              margin: 0 0 16px;
            }
            .footer a {
              color: #f97316;
              text-decoration: none;
              font-weight: 500;
            }
            .footer .brand-footer {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              margin-top: 20px;
            }
            .footer .mini-rocket {
              font-size: 18px;
            }
            .share-section {
              background: linear-gradient(135deg, rgba(59, 130, 196, 0.1), rgba(16, 185, 129, 0.1));
              border: 1px solid rgba(59, 130, 196, 0.3);
              border-radius: 16px;
              padding: 24px;
              margin: 32px 0;
              text-align: center;
            }
            .share-title {
              font-size: 18px;
              font-weight: 700;
              color: #f3f4f6;
              margin-bottom: 8px;
            }
            .share-subtitle {
              font-size: 14px;
              color: #9ca3af;
              margin-bottom: 16px;
            }
            .share-link {
              display: inline-block;
              color: #5BA4E6;
              font-weight: 600;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="container">
              <div class="header">
                <div class="brand-section">
                  <div class="rocket-icon">&#128640;</div>
                  <div class="brand-name">AI Rocket</div>
                  <div class="brand-tagline">AI Built for Entrepreneurs and Their Teams</div>
                  <h1 class="challenge-title">$5M AI Moonshot Challenge</h1>
                  <div class="registered-badge">You're Registered!</div>
                </div>
              </div>
              <div class="content">
                <div class="greeting">
                  Welcome aboard, ${firstName}!
                </div>
                <div class="message">
                  Your registration for the AI Rocket $5M Moonshot Challenge is confirmed. Save your unique launch code below - you'll need it to create your account on January 15, 2026.
                </div>

                <div class="invite-box">
                  <div class="launch-label">Your Unique Launch Code</div>
                  <div class="launch-code">${inviteCode}</div>
                  <div class="valid-date">Valid Starting January 15, 2026</div>

                  <div class="countdown-section">
                    <div class="countdown-label">Time Until Launch</div>
                    <table class="countdown-table">
                      <tr>
                        <td class="countdown-cell">
                          <div class="countdown-value">${(() => {
                            const targetDate = new Date('2026-01-15T00:00:00Z').getTime();
                            const now = Date.now();
                            const diff = targetDate - now;
                            return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
                          })()}</div>
                          <div class="countdown-unit">Days</div>
                        </td>
                        <td class="countdown-cell">
                          <div class="countdown-value">${(() => {
                            const targetDate = new Date('2026-01-15T00:00:00Z').getTime();
                            const now = Date.now();
                            const diff = targetDate - now;
                            return Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
                          })()}</div>
                          <div class="countdown-unit">Hours</div>
                        </td>
                        <td class="countdown-cell">
                          <div class="countdown-value">${(() => {
                            const targetDate = new Date('2026-01-15T00:00:00Z').getTime();
                            const now = Date.now();
                            const diff = targetDate - now;
                            return Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
                          })()}</div>
                          <div class="countdown-unit">Minutes</div>
                        </td>
                        <td class="countdown-cell">
                          <div class="countdown-value">${(() => {
                            const targetDate = new Date('2026-01-15T00:00:00Z').getTime();
                            const now = Date.now();
                            const diff = targetDate - now;
                            return Math.max(0, Math.floor((diff % (1000 * 60)) / 1000));
                          })()}</div>
                          <div class="countdown-unit">Seconds</div>
                        </td>
                      </tr>
                    </table>
                    <div class="countdown-note">Countdown as of when this email was sent</div>
                  </div>
                </div>

                <div class="stats-section">
                  <table class="stats-table">
                    <tr>
                      <td class="stat-cell">
                        <div class="stat-value">$5M</div>
                        <div class="stat-label">Prize Pool</div>
                      </td>
                      <td class="stat-cell">
                        <div class="stat-value">300</div>
                        <div class="stat-label">Team Slots</div>
                      </td>
                      <td class="stat-cell">
                        <div class="stat-value">90</div>
                        <div class="stat-label">Days Free</div>
                      </td>
                      <td class="stat-cell">
                        <div class="stat-value">10</div>
                        <div class="stat-label">Winners</div>
                      </td>
                    </tr>
                  </table>
                </div>

                <div class="timeline-section">
                  <div class="timeline-title">What Happens Next?</div>
                  <div class="timeline-item">
                    <div class="timeline-date">Now - January 14</div>
                    <div class="timeline-desc">We'll send you helpful tips and feature previews to get you ready</div>
                  </div>
                  <div class="timeline-item">
                    <div class="timeline-date">January 15, 2026</div>
                    <div class="timeline-desc">Use your launch code to create your account and launch your AI Rocket</div>
                  </div>
                  <div class="timeline-item">
                    <div class="timeline-date">January 15 - April 15</div>
                    <div class="timeline-desc">First 300 teams get 90 days FREE unlimited access to transform their business</div>
                  </div>
                  <div class="timeline-item">
                    <div class="timeline-date">April 16, 2026</div>
                    <div class="timeline-desc">Winners announced! Top 10 teams win equity prizes and Lifetime Ultra Plan subscriptions</div>
                  </div>
                </div>

                <div class="important-box">
                  <div class="message" style="margin-bottom: 0;">
                    <strong>Important:</strong> Keep this email safe - your launch code <span class="code-highlight">${inviteCode}</span> is your ticket to enter the Challenge. On January 15, be ready to create your account and be one of the first 300 teams to launch!
                  </div>
                </div>

                <div class="cta-container">
                  <a href="${appUrl}/moonshot" class="cta-button">
                    View Challenge Details
                  </a>
                </div>

                <div class="share-section">
                  <div class="share-title">Know an Entrepreneur Who Needs AI for their Team?</div>
                  <div class="share-subtitle">Share the love and send them this challenge info, they will thank you!</div>
                  <a href="${appUrl}/moonshot" class="share-link">airocket.app/moonshot</a>
                </div>
              </div>
              <div class="footer">
                <p>
                  Questions? Visit <a href="${appUrl}/moonshot">the Challenge page</a> for FAQs and details.
                </p>
                <div class="brand-footer">
                  <span class="mini-rocket">&#128640;</span>
                  <a href="${appUrl}">AI Rocket</a>
                  <span style="color: #475569;">by RocketHub.AI</span>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "AI Rocket Moonshot Challenge <moonshot@airocket.app>",
        to: email,
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("Resend API error:", resendResponse.status, errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to send email",
          details: errorText,
          status: resendResponse.status
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendData = await resendResponse.json();
    console.log("Moonshot confirmation email sent successfully:", resendData);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Confirmation email sent successfully to ${email}`,
        emailId: resendData.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in moonshot-send-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});