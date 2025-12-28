import { supabase } from './supabase';

export interface ManualSyncPayload {
  team_id: string;
  user_id: string;
  folder_id: string;
  access_token: string;
  folder_name?: string;
  folder_path?: string;
  max_depth?: number;
  exclude_folders?: string[];
}

export interface ManualSyncResponse {
  success: boolean;
  message: string;
  team_id: string;
  folder_id: string;
  folder_name: string;
  files_sent?: number;
  files_failed?: number;
  completed_at?: string;
  has_files?: boolean;
  files_found?: number;
}

const getManualSyncProxyUrl = () => {
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manual-folder-sync-proxy`;
};

const getN8nProxyUrl = () => {
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/n8n-proxy`;
};

export interface IncrementalSyncPayload {
  team_id: string;
  user_id: string;
  folder_id: string;
  access_token: string;
  folder_name?: string;
  folder_path?: string;
  max_depth?: number;
  exclude_folders?: string[];
}

const N8N_INCREMENTAL_WEBHOOK = 'https://healthrocket.app.n8n.cloud/webhook/astra-data-sync-incremental';

export async function triggerIncrementalSync(payload: IncrementalSyncPayload): Promise<{ success: boolean; message: string }> {
  console.log('Triggering incremental sync (only new files)...');

  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      console.error('No auth session available for incremental sync');
      return {
        success: false,
        message: 'No authentication session',
      };
    }

    const webhookPayload = {
      team_id: payload.team_id,
      user_id: payload.user_id,
      folder_id: payload.folder_id,
      access_token: payload.access_token,
      folder_name: payload.folder_name || 'Root',
      folder_path: payload.folder_path || '/',
      max_depth: payload.max_depth || 10,
      exclude_folders: payload.exclude_folders || ['Archive', 'Old', 'Trash', '.hidden'],
    };

    const response = await fetch(getN8nProxyUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.session.access_token}`,
      },
      body: JSON.stringify({
        webhook_path: 'astra-data-sync-incremental',
        method: 'POST',
        payload: webhookPayload,
      }),
      keepalive: true,
    });

    if (response.ok) {
      const text = await response.text();
      console.log('Incremental sync triggered successfully:', text);
      return {
        success: true,
        message: 'Incremental sync started - processing new files in background',
      };
    } else {
      console.error('Failed to trigger incremental sync:', response.status);
      return {
        success: false,
        message: 'Failed to trigger sync',
      };
    }
  } catch (error) {
    console.error('Error triggering incremental sync:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function triggerManualFolderSync(payload: ManualSyncPayload): Promise<ManualSyncResponse> {
  const proxyUrl = getManualSyncProxyUrl();
  const folderName = payload.folder_name || 'Root';

  console.log('========================================');
  console.log('[triggerManualFolderSync] CALLING EDGE FUNCTION PROXY');
  console.log('[triggerManualFolderSync] URL:', proxyUrl);
  console.log('[triggerManualFolderSync] Payload:', JSON.stringify({
    team_id: payload.team_id,
    user_id: payload.user_id,
    folder_id: payload.folder_id,
    folder_name: folderName,
    access_token: '[REDACTED]'
  }, null, 2));
  console.log('========================================');

  const { data: session } = await supabase.auth.getSession();
  if (!session.session) {
    console.error('[triggerManualFolderSync] No auth session available');
    return {
      success: false,
      message: 'No authentication session',
      team_id: payload.team_id,
      folder_id: payload.folder_id,
      folder_name: folderName,
      files_sent: 0,
      files_failed: 0,
    };
  }

  fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.session.access_token}`,
    },
    body: JSON.stringify({
      ...payload,
      folder_name: folderName,
    }),
    keepalive: true,
  }).then(async (response) => {
    if (response.ok) {
      console.log('[triggerManualFolderSync] Proxy request completed for', folderName);
    } else {
      const errorText = await response.text();
      console.error('[triggerManualFolderSync] Proxy request failed for', folderName, ':', response.status, errorText);
    }
  }).catch((err) => {
    console.error('[triggerManualFolderSync] Proxy request FAILED for', folderName, ':', err);
  });

  console.log('[triggerManualFolderSync] Sync triggered successfully for', folderName, '- processing in background');

  return {
    success: true,
    message: 'Sync triggered successfully',
    team_id: payload.team_id,
    folder_id: payload.folder_id,
    folder_name: folderName,
    files_sent: 1,
    files_failed: 0,
  };
}

async function getValidAccessToken(teamId: string, userId: string): Promise<string | null> {
  console.log('getValidAccessToken: Querying by user_id:', userId);
  let { data: connection, error } = await supabase
    .from('user_drive_connections')
    .select('access_token, refresh_token, token_expires_at')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  console.log('getValidAccessToken: Query by user_id result:', { hasConnection: !!connection, error });

  if (!connection && !error) {
    console.log('getValidAccessToken: No connection found by user_id, trying team_id:', teamId);
    const result = await supabase
      .from('user_drive_connections')
      .select('access_token, refresh_token, token_expires_at')
      .eq('team_id', teamId)
      .eq('is_active', true)
      .maybeSingle();

    console.log('getValidAccessToken: Query by team_id result:', { hasConnection: !!result.data, error: result.error });
    connection = result.data;
    error = result.error;
  }

  if (error || !connection) {
    console.error('getValidAccessToken: Failed to get drive connection:', error);
    return null;
  }

  const expiresAt = new Date(connection.token_expires_at);
  const now = new Date();
  const bufferMinutes = 5;
  const needsRefresh = expiresAt.getTime() - now.getTime() < bufferMinutes * 60 * 1000;

  if (needsRefresh) {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      console.error('No auth session available');
      return null;
    }

    try {
      const refreshResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-drive-refresh-token`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ team_id: teamId }),
        }
      );

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        return refreshData.access_token;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  }

  return connection.access_token;
}

interface FolderToSync {
  id: string;
  name: string;
  slot: string;
}

export interface SyncAllFoldersOptions {
  teamId: string;
  userId: string;
}

export interface SyncAllFoldersResult {
  success: boolean;
  results: {
    folderName: string;
    slot: string;
    success: boolean;
    filesSent: number;
    filesFailed: number;
    error?: string;
  }[];
  totalFilesSent: number;
  totalFilesFailed: number;
}

export async function incrementalSyncAllFolders(options: SyncAllFoldersOptions): Promise<SyncAllFoldersResult> {
  const { teamId, userId } = options;

  console.log('========================================');
  console.log('[incrementalSyncAllFolders] STARTING INCREMENTAL SYNC');
  console.log('[incrementalSyncAllFolders] Input:', { teamId, userId });
  console.log('========================================');

  console.log('Checking for expired connections...');
  let { data: expiredConnection, error: expiredError } = await supabase
    .from('user_drive_connections')
    .select('connection_status, is_active')
    .eq('user_id', userId)
    .eq('is_active', false)
    .maybeSingle();

  if (!expiredConnection && !expiredError) {
    const result = await supabase
      .from('user_drive_connections')
      .select('connection_status, is_active')
      .eq('team_id', teamId)
      .eq('is_active', false)
      .maybeSingle();

    expiredConnection = result.data;
    expiredError = result.error;
  }

  if (expiredConnection?.connection_status === 'token_expired') {
    console.error('Token is expired - user needs to reconnect');
    throw new Error('GOOGLE_TOKEN_EXPIRED');
  }

  console.log('Querying by user_id:', userId);
  let { data: connection, error: connectionError } = await supabase
    .from('user_drive_connections')
    .select(`
      root_folder_id, root_folder_name,
      folder_1_id, folder_1_name, folder_1_enabled,
      folder_2_id, folder_2_name, folder_2_enabled,
      folder_3_id, folder_3_name, folder_3_enabled,
      folder_4_id, folder_4_name, folder_4_enabled,
      folder_5_id, folder_5_name, folder_5_enabled,
      folder_6_id, folder_6_name, folder_6_enabled
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  console.log('Query by user_id result:', { connection, error: connectionError });

  if (!connection && !connectionError) {
    console.log('No connection found by user_id, trying team_id:', teamId);
    const result = await supabase
      .from('user_drive_connections')
      .select(`
        root_folder_id, root_folder_name,
        folder_1_id, folder_1_name, folder_1_enabled,
        folder_2_id, folder_2_name, folder_2_enabled,
        folder_3_id, folder_3_name, folder_3_enabled,
        folder_4_id, folder_4_name, folder_4_enabled,
        folder_5_id, folder_5_name, folder_5_enabled,
        folder_6_id, folder_6_name, folder_6_enabled
      `)
      .eq('team_id', teamId)
      .eq('is_active', true)
      .maybeSingle();

    console.log('Query by team_id result:', { data: result.data, error: result.error });
    connection = result.data;
    connectionError = result.error;
  }

  if (connectionError || !connection) {
    console.error('[incrementalSyncAllFolders] Final connection error:', connectionError);
    console.error('[incrementalSyncAllFolders] Final connection data:', connection);
    throw new Error('No active Google Drive connection found');
  }

  const foldersToSync: FolderToSync[] = [];

  if (connection.root_folder_id && connection.root_folder_name) {
    foldersToSync.push({
      id: connection.root_folder_id,
      name: connection.root_folder_name,
      slot: 'root'
    });
  }

  for (let i = 1; i <= 6; i++) {
    const folderId = connection[`folder_${i}_id` as keyof typeof connection] as string | null;
    const folderName = connection[`folder_${i}_name` as keyof typeof connection] as string | null;
    const folderEnabled = connection[`folder_${i}_enabled` as keyof typeof connection] as boolean | null;

    if (folderId && folderName && folderEnabled !== false) {
      foldersToSync.push({
        id: folderId,
        name: folderName,
        slot: `folder_${i}`
      });
    }
  }

  console.log('[incrementalSyncAllFolders] Folders to sync:', foldersToSync);

  if (foldersToSync.length === 0) {
    console.log('[incrementalSyncAllFolders] No folders configured to sync');
    return {
      success: false,
      results: [],
      totalFilesSent: 0,
      totalFilesFailed: 0,
    };
  }

  const accessToken = await getValidAccessToken(teamId, userId);
  if (!accessToken) {
    throw new Error('Failed to get valid access token');
  }

  const results: SyncAllFoldersResult['results'] = [];
  let totalFilesSent = 0;
  let totalFilesFailed = 0;

  console.log('[incrementalSyncAllFolders] Starting incremental sync for', foldersToSync.length, 'folder(s)');

  for (const folder of foldersToSync) {
    console.log(`[incrementalSyncAllFolders] Processing ${folder.name} (${folder.slot}): folderId=${folder.id}`);

    try {
      const response = await triggerIncrementalSync({
        team_id: teamId,
        user_id: userId,
        folder_id: folder.id,
        folder_name: folder.name,
        access_token: accessToken,
      });

      results.push({
        folderName: folder.name,
        slot: folder.slot,
        success: response.success,
        filesSent: 0,
        filesFailed: 0,
      });

      if (response.success) {
        totalFilesSent += 1;
      }
    } catch (error) {
      console.error(`Failed to trigger incremental sync for folder ${folder.name}:`, error);
      results.push({
        folderName: folder.name,
        slot: folder.slot,
        success: false,
        filesSent: 0,
        filesFailed: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    success: results.some(r => r.success),
    results,
    totalFilesSent,
    totalFilesFailed,
  };
}

export async function syncAllFolders(options: SyncAllFoldersOptions): Promise<SyncAllFoldersResult> {
  const { teamId, userId } = options;

  console.log('========================================');
  console.log('[syncAllFolders] STARTING SYNC');
  console.log('[syncAllFolders] Input:', { teamId, userId });
  console.log('========================================');

  console.log('Checking for expired connections...');
  let { data: expiredConnection, error: expiredError } = await supabase
    .from('user_drive_connections')
    .select('connection_status, is_active')
    .eq('user_id', userId)
    .eq('is_active', false)
    .maybeSingle();

  if (!expiredConnection && !expiredError) {
    const result = await supabase
      .from('user_drive_connections')
      .select('connection_status, is_active')
      .eq('team_id', teamId)
      .eq('is_active', false)
      .maybeSingle();

    expiredConnection = result.data;
    expiredError = result.error;
  }

  if (expiredConnection?.connection_status === 'token_expired') {
    console.error('Token is expired - user needs to reconnect');
    throw new Error('GOOGLE_TOKEN_EXPIRED');
  }

  console.log('Querying by user_id:', userId);
  let { data: connection, error: connectionError } = await supabase
    .from('user_drive_connections')
    .select(`
      root_folder_id, root_folder_name,
      folder_1_id, folder_1_name, folder_1_enabled,
      folder_2_id, folder_2_name, folder_2_enabled,
      folder_3_id, folder_3_name, folder_3_enabled,
      folder_4_id, folder_4_name, folder_4_enabled,
      folder_5_id, folder_5_name, folder_5_enabled,
      folder_6_id, folder_6_name, folder_6_enabled
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  console.log('Query by user_id result:', { connection, error: connectionError });

  if (!connection && !connectionError) {
    console.log('No connection found by user_id, trying team_id:', teamId);
    const result = await supabase
      .from('user_drive_connections')
      .select(`
        root_folder_id, root_folder_name,
        folder_1_id, folder_1_name, folder_1_enabled,
        folder_2_id, folder_2_name, folder_2_enabled,
        folder_3_id, folder_3_name, folder_3_enabled,
        folder_4_id, folder_4_name, folder_4_enabled,
        folder_5_id, folder_5_name, folder_5_enabled,
        folder_6_id, folder_6_name, folder_6_enabled
      `)
      .eq('team_id', teamId)
      .eq('is_active', true)
      .maybeSingle();

    console.log('Query by team_id result:', { data: result.data, error: result.error });
    connection = result.data;
    connectionError = result.error;
  }

  if (connectionError || !connection) {
    console.error('[syncAllFolders] Final connection error:', connectionError);
    console.error('[syncAllFolders] Final connection data:', connection);
    throw new Error('No active Google Drive connection found');
  }

  const foldersToSync: FolderToSync[] = [];

  if (connection.root_folder_id && connection.root_folder_name) {
    foldersToSync.push({
      id: connection.root_folder_id,
      name: connection.root_folder_name,
      slot: 'root'
    });
  }

  for (let i = 1; i <= 6; i++) {
    const folderId = connection[`folder_${i}_id` as keyof typeof connection] as string | null;
    const folderName = connection[`folder_${i}_name` as keyof typeof connection] as string | null;
    const folderEnabled = connection[`folder_${i}_enabled` as keyof typeof connection] as boolean | null;

    if (folderId && folderName && folderEnabled !== false) {
      foldersToSync.push({
        id: folderId,
        name: folderName,
        slot: `folder_${i}`
      });
    }
  }

  console.log('[syncAllFolders] Folders to sync:', foldersToSync);

  if (foldersToSync.length === 0) {
    console.log('[syncAllFolders] No folders configured to sync');
    return {
      success: false,
      results: [],
      totalFilesSent: 0,
      totalFilesFailed: 0,
    };
  }

  const accessToken = await getValidAccessToken(teamId, userId);
  if (!accessToken) {
    throw new Error('Failed to get valid access token');
  }

  const results: SyncAllFoldersResult['results'] = [];
  let totalFilesSent = 0;
  let totalFilesFailed = 0;

  console.log('[syncAllFolders] Starting to sync', foldersToSync.length, 'folder(s)');

  for (const folder of foldersToSync) {
    console.log(`[syncAllFolders] Processing ${folder.name} (${folder.slot}): folderId=${folder.id}`);

    try {
      const response = await triggerManualFolderSync({
        team_id: teamId,
        user_id: userId,
        folder_id: folder.id,
        folder_name: folder.name,
        access_token: accessToken,
      });

      results.push({
        folderName: folder.name,
        slot: folder.slot,
        success: response.success,
        filesSent: response.files_sent || 0,
        filesFailed: response.files_failed || 0,
      });

      totalFilesSent += response.files_sent || 0;
      totalFilesFailed += response.files_failed || 0;
    } catch (error) {
      console.error(`Failed to sync folder ${folder.name}:`, error);
      results.push({
        folderName: folder.name,
        slot: folder.slot,
        success: false,
        filesSent: 0,
        filesFailed: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    success: results.some(r => r.success),
    results,
    totalFilesSent,
    totalFilesFailed,
  };
}
