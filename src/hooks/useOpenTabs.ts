import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { TabType, TabConfig } from '../types';

export const TAB_CONFIGS: TabConfig[] = [
  {
    id: 'mission-control',
    label: 'Mission Control',
    shortLabel: 'Mission',
    icon: 'Rocket',
    isCore: true,
    isComingSoon: false,
    order: 0,
    description: 'Track your progress, achievements, and Launch Points. View personal and team stats, stage progress, and next milestones.',
    color: 'cyan'
  },
  {
    id: 'private',
    label: 'Astra Chat',
    shortLabel: 'Chat',
    icon: 'MessageSquare',
    isCore: true,
    isComingSoon: false,
    order: 1,
    description: 'Have confidential conversations with AI that understands your business context and provides personalized insights.',
    color: 'blue'
  },
  {
    id: 'reports',
    label: 'AI Reports',
    shortLabel: 'Reports',
    icon: 'FileBarChart',
    isCore: true,
    isComingSoon: false,
    order: 2,
    description: 'Schedule automated reports delivered to your inbox. Stay informed with daily, weekly, or monthly insights.',
    color: 'amber'
  },
  {
    id: 'team',
    label: 'Team Chat',
    shortLabel: 'Group',
    icon: 'Users',
    isCore: false,
    isComingSoon: false,
    order: 3,
    description: 'Work together with your team and AI in shared conversations. @mention team members and AI for instant insights.',
    color: 'emerald'
  },
  {
    id: 'visualizations',
    label: 'Visualizations',
    shortLabel: 'Visual',
    icon: 'BarChart3',
    isCore: false,
    isComingSoon: false,
    order: 4,
    description: 'Turn conversations into actionable insights with AI-generated charts, graphs, and visual reports.',
    color: 'purple'
  },
  {
    id: 'ai-specialists',
    label: 'AI Specialists',
    shortLabel: 'Specialists',
    icon: 'Brain',
    isCore: false,
    isComingSoon: true,
    order: 5,
    description: 'Create specialized AI team members like Business Coach, Finance Director, Marketing Manager and more to handle tasks 24/7.',
    color: 'teal'
  },
  {
    id: 'team-agents',
    label: 'Team Agents',
    shortLabel: 'Agents',
    icon: 'Bot',
    isCore: false,
    isComingSoon: true,
    order: 6,
    description: 'Design and deploy custom AI Agents to complete tasks autonomously. Build workflows that work for you 24/7.',
    color: 'pink'
  },
  {
    id: 'team-guidance',
    label: 'Team Guidance',
    shortLabel: 'Guidance',
    icon: 'Compass',
    isCore: false,
    isComingSoon: true,
    order: 7,
    description: 'Create guidance documents and playbooks that help your team stay aligned and make better decisions.',
    color: 'orange'
  },
  {
    id: 'team-dashboard',
    label: 'Team Dashboard',
    shortLabel: 'Dashboard',
    icon: 'LayoutDashboard',
    isCore: false,
    isComingSoon: true,
    order: 8,
    description: 'Daily AI-powered insights on your team\'s metrics, goals, tasks, and accomplishments. Astra reviews your data and delivers fresh updates each day.',
    color: 'sky'
  }
];

export const CORE_TABS: TabType[] = ['mission-control', 'private', 'reports'];

export function getTabConfig(tabId: TabType): TabConfig | undefined {
  return TAB_CONFIGS.find(t => t.id === tabId);
}

interface UseOpenTabsReturn {
  openTabs: TabConfig[];
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  openTab: (tab: TabType) => Promise<void>;
  closeTab: (tab: TabType) => Promise<void>;
  loading: boolean;
  isTabOpen: (tab: TabType) => boolean;
}

export function useOpenTabs(): UseOpenTabsReturn {
  const [openFeatureTabs, setOpenFeatureTabs] = useState<TabType[]>([]);
  const [activeTab, setActiveTabState] = useState<TabType>('mission-control');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const loadTabs = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_open_tabs')
          .select('tab_id, display_order')
          .eq('user_id', userId)
          .order('display_order', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const tabIds = data.map(t => t.tab_id as TabType);
          setOpenFeatureTabs(tabIds);
        }
      } catch (err) {
        console.error('Error loading open tabs:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTabs();
  }, [userId]);

  const openTabs: TabConfig[] = [
    ...TAB_CONFIGS.filter(t => t.isCore),
    ...TAB_CONFIGS.filter(t => !t.isCore && openFeatureTabs.includes(t.id))
  ].sort((a, b) => {
    if (a.isCore && b.isCore) return a.order - b.order;
    if (a.isCore) return -1;
    if (b.isCore) return 1;
    return openFeatureTabs.indexOf(a.id) - openFeatureTabs.indexOf(b.id);
  });

  const setActiveTab = useCallback((tab: TabType) => {
    setActiveTabState(tab);
  }, []);

  const openTab = useCallback(async (tab: TabType) => {
    const config = getTabConfig(tab);
    if (!config) return;

    if (config.isCore) {
      setActiveTab(tab);
      return;
    }

    if (openFeatureTabs.includes(tab)) {
      setActiveTab(tab);
      return;
    }

    const newOrder = openFeatureTabs.length;
    setOpenFeatureTabs(prev => [...prev, tab]);
    setActiveTab(tab);

    if (userId) {
      try {
        await supabase.from('user_open_tabs').insert({
          user_id: userId,
          tab_id: tab,
          display_order: newOrder
        });
      } catch (err) {
        console.error('Error saving tab:', err);
      }
    }
  }, [openFeatureTabs, userId, setActiveTab]);

  const closeTab = useCallback(async (tab: TabType) => {
    const config = getTabConfig(tab);
    if (!config || config.isCore) return;

    setOpenFeatureTabs(prev => prev.filter(t => t !== tab));

    if (activeTab === tab) {
      setActiveTab('mission-control');
    }

    if (userId) {
      try {
        await supabase
          .from('user_open_tabs')
          .delete()
          .eq('user_id', userId)
          .eq('tab_id', tab);
      } catch (err) {
        console.error('Error removing tab:', err);
      }
    }
  }, [activeTab, userId, setActiveTab]);

  const isTabOpen = useCallback((tab: TabType) => {
    const config = getTabConfig(tab);
    if (!config) return false;
    if (config.isCore) return true;
    return openFeatureTabs.includes(tab);
  }, [openFeatureTabs]);

  return {
    openTabs,
    activeTab,
    setActiveTab,
    openTab,
    closeTab,
    loading,
    isTabOpen
  };
}
