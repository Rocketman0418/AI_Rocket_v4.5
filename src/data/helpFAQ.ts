export interface FAQItem {
  question: string;
  answer: string;
  category: 'getting-started' | 'chat-modes' | 'visualizations' | 'team' | 'integrations' | 'reports' | 'admin' | 'launch-prep' | 'data-sync';
}

export const helpFAQ: FAQItem[] = [
  {
    category: 'getting-started',
    question: 'What is Astra Intelligence?',
    answer: 'Astra Intelligence is your AI assistant connected to all your team\'s data. Ask questions, get insights, create visualizations, and collaborate with your team - all powered by AI that understands your company\'s information.'
  },
  {
    category: 'getting-started',
    question: 'How do I ask Astra a question?',
    answer: 'Simply type your question in the chat input at the bottom of the screen and press Enter or click Send. Astra will analyze your data and provide insights based on your question.'
  },
  {
    category: 'getting-started',
    question: 'What kind of questions can I ask?',
    answer: 'You can ask about your company data, search through documents, analyze trends, or get summaries. Try questions like "What are our top priorities?" or "Show me email trends from last month". You can also create visualizations using the "Create Visualizations" button.'
  },
  {
    category: 'chat-modes',
    question: 'What\'s the difference between Private and Team chat?',
    answer: 'Private mode is just for you - your questions and Astra\'s responses are only visible to you. Team mode is collaborative - everyone on your team can see the conversation and contribute.'
  },
  {
    category: 'chat-modes',
    question: 'When should I use Team mode?',
    answer: 'Use Team mode when you want to collaborate with your team on insights, share discoveries, or have group discussions with AI assistance. It\'s great for team meetings, brainstorming, or sharing important findings.'
  },
  {
    category: 'chat-modes',
    question: 'Can I switch between Private and Team mode?',
    answer: 'Yes! Click the "Private" or "Team" button at the top of the chat to switch modes. Each mode has its own conversation history that stays separate.'
  },
  {
    category: 'visualizations',
    question: 'How do I create a visualization?',
    answer: 'After asking Astra a question, click the "Create Visualizations" button that appears in the conversation. Astra will generate interactive charts and visualizations based on your data. If you want a different version, simply click "Retry".'
  },
  {
    category: 'visualizations',
    question: 'Who can see my visualizations?',
    answer: 'Only you can see visualizations you create. Even in Team mode, visualizations are private to the person who requested them. You can export them as PDFs to share with others.'
  },
  {
    category: 'visualizations',
    question: 'Can I save visualizations?',
    answer: 'Yes! When viewing a visualization, click the bookmark icon to save it. Your saved visualizations appear in your sidebar for easy access later.'
  },
  {
    category: 'visualizations',
    question: 'How do I export a visualization?',
    answer: 'Open any visualization and click the "Export as PDF" button. This creates a downloadable PDF that you can share or keep for your records.'
  },
  {
    category: 'team',
    question: 'How do I mention someone in Team chat?',
    answer: 'Type @ followed by their name in Team mode. You\'ll see a list of team members to choose from. Mentioned users will receive a notification.'
  },
  {
    category: 'team',
    question: 'How do notifications work?',
    answer: 'You\'ll receive notifications when someone mentions you in Team chat or when there\'s important team activity. Click the bell icon in the header to view your notifications.'
  },
  {
    category: 'team',
    question: 'Can I see who\'s on my team?',
    answer: 'Yes! Click your profile picture or the team icon in the header to see all team members. You can view their roles and contact information there.'
  },
  {
    category: 'reports',
    question: 'What are Reports?',
    answer: 'Reports are a dedicated space where you can create, view, and manage your own custom reports, as well as view scheduled reports. They provide summaries and analyses of your team\'s data.'
  },
  {
    category: 'reports',
    question: 'How do I access Reports?',
    answer: 'Click the "Reports" button in the left sidebar to view all available reports. You can filter by date and view detailed insights for each report.'
  },
  {
    category: 'reports',
    question: 'Can I create my own reports?',
    answer: 'Yes! All team members can create, manage, edit, and delete their own reports from the Reports page. You can create custom reports that run manually or on a schedule (daily, weekly, or monthly).'
  },
  {
    category: 'reports',
    question: 'What are Team Reports?',
    answer: 'Team Reports are reports created by admins that are automatically delivered to all team members. When you receive a Team Report, you\'ll see it with an orange "Team Report" badge showing who created it. Each team member gets their own copy in their Reports view.'
  },
  {
    category: 'integrations',
    question: 'What is Google Drive integration?',
    answer: 'Google Drive integration allows Astra to access and analyze your team\'s Google Drive documents. Once connected, you can ask questions about your docs, sheets, and slides.'
  },
  {
    category: 'integrations',
    question: 'Is my Google Drive data secure?',
    answer: 'Yes! We only access files you grant permission to, and all data is encrypted. Your documents are processed securely and stored safely in your team\'s private database.'
  },
  {
    category: 'integrations',
    question: 'Can I disconnect Google Drive?',
    answer: 'Yes, admins can disconnect Google Drive at any time from Team Settings. This will stop syncing new documents, but previously synced data will remain available to your team.'
  },
  {
    category: 'integrations',
    question: 'Why can\'t I connect additional folders?',
    answer: 'If you\'re unable to connect additional folders, you may need to reconnect your Google Drive with expanded permissions. When you first connected, you only granted access to specific folders. To add more folders: 1) Click "Disconnect Google Drive" at the bottom of the folder management screen, 2) Sign out of your Google account in your browser, 3) Reconnect Google Drive and select "See all your Google Drive files" when prompted, 4) Choose your new folders. This gives Astra permission to access additional folders beyond the original selection.'
  },
  {
    category: 'integrations',
    question: 'What does "See all your Google Drive files" mean?',
    answer: 'When connecting Google Drive, you\'ll see two permission options: "See and download specific files" (restricted to only folders you initially selected) or "See all your Google Drive files" (allows you to select any folder now or later). For flexibility in adding folders, choose "See all your Google Drive files". Astra will ONLY access folders you explicitly select - this permission just allows you to choose from your entire Drive.'
  },
  {
    category: 'integrations',
    question: 'How do I fix "Error loading folders" messages?',
    answer: 'The "Error loading folders" message typically means your Google Drive connection needs to be refreshed or you need expanded permissions. To fix: 1) Disconnect Google Drive from the folder management screen, 2) Sign out of your Google account completely in your browser, 3) Reconnect Google Drive, 4) When prompted, select "See all your Google Drive files" to ensure full access, 5) Choose your folders again. This reestablishes a fresh connection with the proper permissions.'
  },
  {
    category: 'integrations',
    question: 'Why do I need to sign out of Google to reconnect?',
    answer: 'Signing out of your Google account before reconnecting ensures a clean authentication flow. Google sometimes caches old permissions, and signing out clears this cache so you can grant fresh, expanded permissions. This prevents permission conflicts and ensures Astra gets the access it needs to manage your folders properly.'
  },
  {
    category: 'integrations',
    question: 'Will disconnecting Google Drive delete my synced data?',
    answer: 'No! Disconnecting Google Drive only stops new syncing - all your previously synced documents and data remain safe in Astra\'s database. When you reconnect, Astra will recognize your existing data and only sync new or updated files. Your team\'s chat history, visualizations, and reports are completely unaffected.'
  },
  {
    category: 'data-sync',
    question: 'What is AI Data Sync?',
    answer: 'AI Data Sync is the process of connecting your data sources to Astra Intelligence. You can sync Google Drive folders or upload files directly from your computer. Once synced, Astra can search, analyze, and provide insights from your documents. Your data is securely processed and stored, allowing Astra to answer questions about your business information.'
  },
  {
    category: 'data-sync',
    question: 'How do I upload local files?',
    answer: 'In the Fuel Stage of Mission Control, click the "Upload Files" button or drag and drop files directly onto the upload area. You can upload PDFs, Word documents (.docx), Excel spreadsheets (.xlsx), PowerPoint presentations (.pptx), text files (.txt, .md), and CSV files. Files are limited to 50 MB each, with up to 10 files per batch.'
  },
  {
    category: 'data-sync',
    question: 'What file types can I upload locally?',
    answer: 'Astra supports local uploads of: PDF files, Microsoft Word documents (.docx, .doc), Excel spreadsheets (.xlsx, .xls), PowerPoint presentations (.pptx, .ppt), plain text files (.txt), Markdown files (.md), and CSV files. Each file can be up to 50 MB, and you can upload up to 10 files at a time.'
  },
  {
    category: 'data-sync',
    question: 'What happens after I upload a file?',
    answer: 'After uploading, Astra processes your file through several stages: uploading (transferring the file), verifying (checking the file is valid), and classifying (AI analyzes the content to determine the category like Strategy, Finance, Marketing, etc.). Once complete, the file appears in your Documents list and Astra can answer questions about it.'
  },
  {
    category: 'data-sync',
    question: 'Are my uploaded files secure?',
    answer: 'Yes! All uploaded files are securely stored in your team\'s private storage bucket. Only your team members can access them. Files are encrypted in transit and at rest, and each team\'s data is completely isolated from other teams.'
  },
  {
    category: 'data-sync',
    question: 'Can I delete uploaded files?',
    answer: 'Yes, admins can delete uploaded files from the Documents list in the Fuel Stage. Click on the Documents card to see all synced and uploaded documents, then use the delete option to remove any file. Deleted files are permanently removed from Astra\'s database.'
  },
  {
    category: 'data-sync',
    question: 'Do I need Google Drive to use Astra?',
    answer: 'No! While Google Drive integration provides powerful automatic syncing, you can also upload files directly from your computer using the Local File Upload feature. This is great for documents that aren\'t in Google Drive, such as email attachments, downloaded reports, or files from other systems.'
  },
  {
    category: 'data-sync',
    question: 'What are Connected Folders?',
    answer: 'Connected Folders are specific Google Drive folders you designate for Astra to sync. There are four folder types: Strategy (business plans, goals), Meetings (notes, agendas), Financial (budgets, reports), and Projects (project docs, timelines). Each folder helps Astra understand different aspects of your business.'
  },
  {
    category: 'data-sync',
    question: 'What file types does Astra support?',
    answer: 'Astra supports Google Docs, Google Sheets, Google Slides, PDFs, Word documents (.docx), Excel spreadsheets (.xlsx), PowerPoint presentations (.pptx), and plain text files (.txt). Images and audio files are not currently supported for content analysis.'
  },
  {
    category: 'data-sync',
    question: 'How do I add more folders?',
    answer: 'From the Fuel Stage in Mission Control, click "Manage Folders" to open the folder management panel. You can connect additional folders for Strategy, Meetings, Financial, or Projects categories. Each category can have its own dedicated folder.'
  },
  {
    category: 'data-sync',
    question: 'How long does syncing take?',
    answer: 'Initial sync time depends on the number and size of your documents. Small folders (under 50 files) typically sync within 1-2 minutes. Larger collections may take 5-10 minutes. You can continue using Astra while syncing happens in the background.'
  },
  {
    category: 'data-sync',
    question: 'How do I check my sync status?',
    answer: 'The Fuel Stage shows your current sync status including total documents synced, categories detected, and any documents still processing. Click on the Documents or Categories cards to see detailed information about your synced data.'
  },
  {
    category: 'data-sync',
    question: 'What are document categories?',
    answer: 'Categories are automatically detected by Astra based on your document content. Examples include Strategy, Finance, Marketing, Sales, HR, Legal, and more. Having documents across multiple categories improves Astra\'s ability to provide comprehensive insights.'
  },
  {
    category: 'data-sync',
    question: 'Can I manually trigger a sync?',
    answer: 'Yes! In the Fuel Stage, click the "Sync" button to trigger an incremental sync that checks for new or updated files in your connected folders. This is useful when you\'ve just added new documents to Google Drive.'
  },
  {
    category: 'data-sync',
    question: 'What happens to deleted files?',
    answer: 'When you delete a file from Google Drive, it will be removed from Astra\'s database during the next sync. You can also manually delete documents from the Documents list in the Fuel Stage if needed.'
  },
  {
    category: 'data-sync',
    question: 'Why are some files not syncing?',
    answer: 'Files may not sync if: they are in an unsupported format (images, videos), they are too large, permissions are restricted, or there was a temporary connection issue. Check that files are in supported formats and that Astra has permission to access them.'
  },
  {
    category: 'admin',
    question: 'How do I invite team members?',
    answer: 'As an admin, click on the Team Members section and then click "Invite Member". Enter their email address and they\'ll receive an invitation to join your team.'
  },
  {
    category: 'admin',
    question: 'What\'s the difference between Admin and Member roles?',
    answer: 'Admins can invite team members, manage team settings, connect integrations, delete documents, and create Team Reports that are delivered to all members. Members can chat with Astra, create visualizations, create and manage their own personal reports, and view team data.'
  },
  {
    category: 'admin',
    question: 'How do I create Team Reports?',
    answer: 'As an admin, go to the Reports page and click "New Report". Configure your report (manual or scheduled), then check the "Team Report" checkbox before saving. Team Reports will be delivered to all team members, and each member will see it marked with a "Team Report" badge in their Reports view.'
  },
  {
    category: 'admin',
    question: 'What\'s the difference between personal and Team Reports?',
    answer: 'Personal reports are only visible to the person who creates them. Team Reports, created by admins, are automatically delivered to every team member - each person gets their own copy with a special "Team Report" badge showing which admin created it.'
  },
  {
    category: 'admin',
    question: 'How do I connect Google Drive?',
    answer: 'Go to Team Settings, find the Google Drive section, and click "Connect Google Drive". You\'ll be taken to Google to authorize access, then you can select which folders to sync.'
  },
  {
    category: 'admin',
    question: 'Can I remove team members?',
    answer: 'Yes, admins can remove team members from the Team Members panel. Click the menu next to a member\'s name and select "Remove from Team". Their access will be revoked immediately.'
  },
  {
    category: 'launch-prep',
    question: 'What is the Launch Preparation Guide?',
    answer: 'The Launch Preparation Guide helps you get your team fully set up with Astra through three stages: Fuel (add your data), Boosters (use AI features), and Guidance (configure your team). Complete tasks to earn Launch Points and unlock the full potential of Astra Intelligence.'
  },
  {
    category: 'launch-prep',
    question: 'What are Launch Points?',
    answer: 'Launch Points are an important part of the $5M AI Moonshot Challenge scoring criteria. They measure how your team is using AI to Run, Build, and Grow your business. Points are earned through three categories: Launch Prep (completing stages), Activity (daily engagement and streaks), and Milestones (usage goals for messages, visualizations, and reports).'
  },
  {
    category: 'launch-prep',
    question: 'How do I earn Launch Points?',
    answer: 'You earn Launch Points in three ways: (1) Launch Prep - complete stages with graduated points (10/20/30/40/50 per level, up to 450 total), (2) Activity - Daily Active (+5/day) for sending messages or reports, plus 5-Day Streak bonus (+50, repeatable), and (3) Milestones - bonus points for reaching goals like 100/500/1000 messages, 5/25/100 visualizations, and 3/10 scheduled reports.'
  },
  {
    category: 'launch-prep',
    question: 'What is the Fuel Stage?',
    answer: 'The Fuel Stage is about adding data to power your AI. Connect your Google Drive and add documents to your Strategy, Meetings, Financial, and Projects folders. Progress through 5 levels by adding more documents - Level 1 needs just 1 document, while Level 5 requires a comprehensive data collection.'
  },
  {
    category: 'launch-prep',
    question: 'What is the Boosters Stage?',
    answer: 'The Boosters Stage helps you learn Astra\'s AI features. Progress through 5 levels: use Guided Chat or send prompts (Level 1, +50 pts), create visualizations (Level 2, +50 pts), generate manual reports (Level 3, +50 pts), schedule recurring reports (Level 4, +50 pts), and build AI agents (Level 5, +50 pts - coming soon).'
  },
  {
    category: 'launch-prep',
    question: 'What is the Guidance Stage?',
    answer: 'The Guidance Stage is about team configuration and growth. Complete 5 levels: configure team settings (Level 1, +50 pts), enable news preferences (Level 2, +50 pts), invite team members (Level 3, +50 pts), create AI jobs (Level 4, +50 pts - coming soon), and document processes (Level 5, +50 pts - coming soon).'
  },
  {
    category: 'launch-prep',
    question: 'What is Guided Chat?',
    answer: 'Guided Chat is a feature in the Boosters Stage that analyzes your available data and suggests 3 personalized prompts. It helps you get started with Astra by showing you what kinds of questions work best with your specific data. Click any suggestion to send it to Astra and see instant results.'
  },
  {
    category: 'launch-prep',
    question: 'When can I launch?',
    answer: 'You can launch when you reach minimum requirements: Fuel Stage Level 1 (at least 1 document), Boosters Stage Level 4 (scheduled reports set up), and Guidance Stage Level 2 (news preferences enabled). This ensures you have data, know how to use key features, and have your team configured.'
  },
  {
    category: 'launch-prep',
    question: 'What happens when I launch?',
    answer: 'Launching marks your team as fully prepared to use Astra Intelligence. You\'ll keep all your Launch Points, maintain access to all features, and can continue earning points through daily activity. The Launch Prep Guide remains accessible for reference and adding team members.'
  },
  {
    category: 'launch-prep',
    question: 'Can I go back to previous stages?',
    answer: 'Yes! You can navigate between Fuel, Boosters, and Guidance stages at any time by clicking on them in Mission Control. Your progress is saved, and you can complete tasks in any order that works best for your team.'
  },
  {
    category: 'launch-prep',
    question: 'Do Launch Points expire?',
    answer: 'No, Launch Points never expire. Once earned, they stay on your account permanently. You can continue earning additional points through daily activity and team achievements even after launching.'
  },
  {
    category: 'launch-prep',
    question: 'How do I access the Launch Preparation Guide?',
    answer: 'Click on "Mission Control" in the left sidebar to open the Launch Preparation Guide. From there, you can see your total Launch Points, current progress in each stage, and tap any stage to enter and complete tasks.'
  }
];

export const faqCategories = {
  'getting-started': {
    title: '🚀 Getting Started',
    description: 'Learn the basics of using Astra'
  },
  'launch-prep': {
    title: '🎯 Launch Preparation',
    description: 'Mission Control and Launch Points guide'
  },
  'data-sync': {
    title: '📂 Data Sync & Folders',
    description: 'Connecting folders and syncing documents'
  },
  'chat-modes': {
    title: '💬 Chat Modes',
    description: 'Understanding Private and Team chat'
  },
  'visualizations': {
    title: '📊 Visualizations',
    description: 'Creating and managing data visualizations'
  },
  'team': {
    title: '👥 Team Collaboration',
    description: 'Working with your team in Astra'
  },
  'reports': {
    title: '📈 Reports',
    description: 'Viewing and understanding reports'
  },
  'integrations': {
    title: '🔗 Integrations',
    description: 'Connecting Google Drive and other services'
  },
  'admin': {
    title: '⚙️ Admin Features',
    description: 'Managing your team and settings'
  }
} as const;
