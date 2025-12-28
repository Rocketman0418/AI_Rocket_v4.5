import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useOAuthReconnectPrompt = () => {
  const [showModal, setShowModal] = useState(false);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkReconnectNeeded();
  }, []);

  const checkReconnectNeeded = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: connection } = await supabase
        .from('user_drive_connections')
        .select('connection_status, is_active')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!connection || !connection.is_active) {
        setLoading(false);
        return;
      }

      const requiresReconnect = connection.connection_status === 'token_expired';

      console.log('🔍 [OAuth Reconnect Check]', {
        userId: user.id,
        connectionStatus: connection.connection_status,
        requiresReconnect
      });

      setNeedsReconnect(requiresReconnect);
      setLoading(false);
    } catch (error) {
      console.error('Failed to check OAuth reconnect status:', error);
      setLoading(false);
    }
  };

  const triggerModal = () => {
    if (needsReconnect) {
      setShowModal(true);
    }
  };

  const dismissModal = () => {
    setShowModal(false);
  };

  const handleReconnect = () => {
    setShowModal(false);
  };

  return {
    showModal,
    needsReconnect,
    loading,
    triggerModal,
    dismissModal,
    handleReconnect
  };
};
