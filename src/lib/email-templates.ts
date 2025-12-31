export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  htmlContent: string;
  icon: 'rocket' | 'document';
  color: string;
}

export const MOONSHOT_EMAIL_TEMPLATE: EmailTemplate = {
  id: 'moonshot-challenge',
  name: '$5M Moonshot Challenge',
  description: 'Announce the AI Moonshot Challenge with $5M in prizes',
  subject: '$5M AI Moonshot Challenge - Registration Now Open',
  icon: 'rocket',
  color: 'orange',
  htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    body {
      font-family: "Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
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
    .brand-section { position: relative; z-index: 1; }
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
      font-size: 28px;
      font-weight: 800;
      background: linear-gradient(to right, #fbbf24, #f97316, #f97316);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0;
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
    .hero-highlight {
      display: block;
      text-decoration: none;
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(16, 185, 129, 0.1));
      border: 2px solid #f97316;
      border-radius: 20px;
      padding: 24px;
      margin: 24px 0;
      text-align: center;
      transition: all 0.3s ease;
    }
    .hero-highlight:hover {
      border-color: #fbbf24;
      background: linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(16, 185, 129, 0.2));
    }
    .highlight-text {
      font-size: 20px;
      font-weight: 700;
      color: #f3f4f6;
      margin-bottom: 8px;
    }
    .highlight-sub {
      font-size: 14px;
      color: #9ca3af;
    }
    .stats-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 8px;
      margin: 24px 0;
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
      font-size: 28px;
      font-weight: 800;
      background: linear-gradient(to right, #f97316, #10b981);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 4px;
      display: block;
    }
    .stat-label {
      font-size: 10px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
      display: block;
    }
    .feature-grid { margin: 24px 0; }
    .feature-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .feature-icon { font-size: 28px; flex-shrink: 0; }
    .feature-content h4 {
      font-size: 16px;
      font-weight: 700;
      color: #f3f4f6;
      margin: 0 0 4px 0;
    }
    .feature-content p {
      font-size: 13px;
      color: #9ca3af;
      margin: 0;
    }
    .cta-container {
      text-align: center;
      margin: 32px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #f97316 0%, #10b981 100%);
      color: white !important;
      padding: 18px 48px;
      border-radius: 50px;
      text-decoration: none;
      font-weight: 700;
      font-size: 18px;
      box-shadow: 0 8px 32px rgba(249, 115, 22, 0.35);
    }
    .date-badge {
      display: inline-block;
      background: rgba(251, 191, 36, 0.15);
      color: #fbbf24;
      font-size: 13px;
      font-weight: 600;
      padding: 10px 20px;
      border-radius: 25px;
      margin-top: 16px;
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
        </div>
      </div>

      <div class="content">
        <div class="greeting">Hi {{firstName}}!</div>

        <div class="message">
          We are excited to announce the <strong style="color:#fbbf24">$5M AI Moonshot Challenge</strong> - an exclusive opportunity for entrepreneurs and their teams to transform their businesses with AI and compete for equity prizes totaling $5 million.
        </div>

        <a href="https://airocket.app/moonshot/register" class="hero-highlight">
          <div class="highlight-text">Registration is NOW OPEN</div>
          <div class="highlight-sub">Click here to register - Challenge launches January 15, 2026</div>
        </a>

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

        <div class="message" style="text-align:center;margin-bottom:16px">
          The first 300 teams to launch their AI Rockets get <strong style="color:#10b981">90 days of FREE unlimited access</strong> to transform their businesses with AI.
        </div>

        <div class="feature-grid">
          <div class="feature-card">
            <div class="feature-icon">&#128202;</div>
            <div class="feature-content">
              <h4>All Your Data Connected</h4>
              <p>Connect Documents, Financials, and more for comprehensive AI insights</p>
            </div>
          </div>
          <div class="feature-card">
            <div class="feature-icon">&#128200;</div>
            <div class="feature-content">
              <h4>Smart Visualizations</h4>
              <p>Turn conversations into actionable charts, graphs, and visual reports</p>
            </div>
          </div>
          <div class="feature-card">
            <div class="feature-icon">&#129309;</div>
            <div class="feature-content">
              <h4>Team Collaboration</h4>
              <p>Work together with your team and AI in shared conversations</p>
            </div>
          </div>
          <div class="feature-card">
            <div class="feature-icon">&#128203;</div>
            <div class="feature-content">
              <h4>Automated Reports</h4>
              <p>Schedule AI-powered reports delivered to your inbox</p>
            </div>
          </div>
        </div>

        <div class="cta-container">
          <a href="https://airocket.app/moonshot" class="cta-button">View Challenge Details</a>
          <div class="date-badge">Challenge Starts January 15, 2026</div>
        </div>

        <div class="message" style="font-size:14px;text-align:center;color:#64748b;margin-top:24px">
          Open to members of Gobundance, EO, YPO, Strategic Coach, Genius Network, R360, and similar entrepreneur mastermind groups.
        </div>
      </div>

      <div class="footer">
        <p>Questions? Visit <a href="https://airocket.app/moonshot">the Challenge page</a> for FAQs and details.</p>
        <p style="margin-top:16px">
          <span style="font-size:18px">&#128640;</span>
          <a href="https://airocket.app">AI Rocket</a>
          <span style="color:#475569">by RocketHub.AI</span>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`
};

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  MOONSHOT_EMAIL_TEMPLATE
];
