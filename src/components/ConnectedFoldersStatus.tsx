import React, { useState, useEffect } from 'react';
import { Folder, CheckCircle, Loader2, FolderPlus, RefreshCw, Trash2, Edit2, X, Search, FolderOpen, User, Plus, FilePlus, Unlink, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { syncAllFolders } from '../lib/manual-folder-sync';
import { PlaceFilesStep } from './setup-steps/PlaceFilesStep';
import { GoogleDriveTroubleshootGuide } from './GoogleDriveTroubleshootGuide';

interface ConnectedFoldersStatusProps {
  onConnectMore: () => void;
  onClose: () => void;
  onDisconnected?: () => void;
}

interface UnifiedFolder {
  index: number;
  folderId: string | null;
  folderName: string | null;
  isRoot: boolean;
  connectedBy: string | null;
  connectedByEmail: string | null;
}

const FOLDER_COLORS = [
  { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
  { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
  { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50' },
  { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/50' },
  { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/50' },
  { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/50' },
  { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/50' },
];

export const ConnectedFoldersStatus: React.FC<ConnectedFoldersStatusProps> = ({ onConnectMore, onClose, onDisconnected }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<UnifiedFolder[]>([]);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [syncCompleted, setSyncCompleted] = useState(false);
  const [removingFolder, setRemovingFolder] = useState<number | null>(null);
  const [changingMainFolder, setChangingMainFolder] = useState(false);
  const [availableFolders, setAvailableFolders] = useState<{ id: string; name: string }[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [folderSearchTerm, setFolderSearchTerm] = useState('');
  const [savingMainFolder, setSavingMainFolder] = useState(false);
  const [showFolderChooser, setShowFolderChooser] = useState(false);
  const [chooserMode, setChooserMode] = useState<'initial' | 'select-existing' | 'place-files'>('initial');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [createdFolderData, setCreatedFolderData] = useState<{ id: string; name: string } | null>(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showAddFilesModal, setShowAddFilesModal] = useState(false);
  const [addFilesFolder, setAddFilesFolder] = useState<UnifiedFolder | null>(null);

  useEffect(() => {
    loadFolderStatus();
  }, []);

  const loadFolderStatus = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      let teamId = user.user_metadata?.team_id;

      if (!teamId) {
        const { data: userData } = await supabase
          .from('users')
          .select('team_id')
          .eq('id', user.id)
          .maybeSingle();
        teamId = userData?.team_id;
      }

      if (!teamId) {
        setError('No team found');
        setLoading(false);
        return;
      }

      const { data: driveConnection, error: driveError } = await supabase
        .from('user_drive_connections')
        .select('*')
        .eq('team_id', teamId)
        .maybeSingle();

      if (driveError) throw driveError;

      const connectedByIds: string[] = [];
      if (driveConnection?.root_folder_connected_by) connectedByIds.push(driveConnection.root_folder_connected_by);
      for (let i = 1; i <= 6; i++) {
        const connectedBy = driveConnection?.[`folder_${i}_connected_by`];
        if (connectedBy) connectedByIds.push(connectedBy);
      }

      let userEmails: Record<string, string> = {};
      if (connectedByIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, email')
          .in('id', connectedByIds);
        if (usersData) {
          usersData.forEach(u => {
            userEmails[u.id] = u.email;
          });
        }
      }

      const unifiedFolders: UnifiedFolder[] = [];

      if (driveConnection?.root_folder_id && driveConnection?.root_folder_name) {
        const connectedById = driveConnection.root_folder_connected_by;
        unifiedFolders.push({
          index: 0,
          folderId: driveConnection.root_folder_id,
          folderName: driveConnection.root_folder_name,
          isRoot: true,
          connectedBy: connectedById || null,
          connectedByEmail: connectedById ? userEmails[connectedById] || null : null
        });
      }

      for (let i = 1; i <= 6; i++) {
        const folderId = driveConnection?.[`folder_${i}_id`];
        const folderName = driveConnection?.[`folder_${i}_name`];
        const connectedById = driveConnection?.[`folder_${i}_connected_by`];

        if (folderId && folderName) {
          unifiedFolders.push({
            index: i,
            folderId,
            folderName,
            isRoot: false,
            connectedBy: connectedById || null,
            connectedByEmail: connectedById ? userEmails[connectedById] || null : null
          });
        }
      }

      setFolders(unifiedFolders);
    } catch (err) {
      console.error('Error loading folder status:', err);
      setError('Failed to load folder information');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncDocuments = async () => {
    if (!user || syncing) return;

    setSyncing(true);
    setSyncMessage(null);
    setSyncCompleted(false);

    try {
      let teamId = user.user_metadata?.team_id;
      if (!teamId) {
        const { data: userData } = await supabase
          .from('users')
          .select('team_id')
          .eq('id', user.id)
          .maybeSingle();
        teamId = userData?.team_id;
      }

      if (!teamId) {
        setSyncing(false);
        setSyncMessage({ type: 'error', text: 'No team found.' });
        setTimeout(() => setSyncMessage(null), 5000);
        return;
      }

      setSyncMessage({ type: 'success', text: 'Syncing documents...' });

      const result = await syncAllFolders({
        teamId,
        userId: user.id,
      });

      if (result.success) {
        setSyncing(false);
        setSyncCompleted(true);
        setSyncMessage({ type: 'success', text: 'Sync started successfully!' });
      } else {
        setSyncing(false);
        setSyncMessage({ type: 'error', text: 'Failed to start sync.' });
        setTimeout(() => setSyncMessage(null), 5000);
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      setSyncing(false);
      if (error.message === 'GOOGLE_TOKEN_EXPIRED') {
        setSyncMessage({ type: 'error', text: 'Google Drive connection expired. Please reconnect.' });
      } else {
        setSyncMessage({ type: 'error', text: 'Failed to sync. Please try again.' });
      }
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const handleRemoveFolder = async (folderIndex: number) => {
    if (!user || folderIndex === 0) return;

    setRemovingFolder(folderIndex);

    try {
      let teamId = user.user_metadata?.team_id;
      if (!teamId) {
        const { data: userData } = await supabase
          .from('users')
          .select('team_id')
          .eq('id', user.id)
          .maybeSingle();
        teamId = userData?.team_id;
      }

      if (!teamId) return;

      const updates: Record<string, null | boolean> = {
        [`folder_${folderIndex}_id`]: null,
        [`folder_${folderIndex}_name`]: null,
        [`folder_${folderIndex}_enabled`]: false,
        [`folder_${folderIndex}_connected_by`]: null
      };

      const { error } = await supabase
        .from('user_drive_connections')
        .update(updates)
        .eq('team_id', teamId);

      if (error) throw error;

      await loadFolderStatus();
    } catch (err) {
      console.error('Error removing folder:', err);
      setError('Failed to remove folder');
    } finally {
      setRemovingFolder(null);
    }
  };

  const handleChangeMainFolder = async () => {
    setChangingMainFolder(true);
    setLoadingFolders(true);
    setFolderSearchTerm('');
    setAvailableFolders([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('No active session');
        setChangingMainFolder(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-google-drive-folders`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch folders');
      }

      const data = await response.json();
      setAvailableFolders(data.folders || []);
    } catch (err) {
      console.error('Error loading folders:', err);
      setError('Failed to load folders from Google Drive');
      setChangingMainFolder(false);
    } finally {
      setLoadingFolders(false);
    }
  };

  const handleSelectMainFolder = async (newFolder: { id: string; name: string }) => {
    if (!user) return;

    setSavingMainFolder(true);

    try {
      let teamId = user.user_metadata?.team_id;
      if (!teamId) {
        const { data: userData } = await supabase
          .from('users')
          .select('team_id')
          .eq('id', user.id)
          .maybeSingle();
        teamId = userData?.team_id;
      }

      if (!teamId) return;

      const { error } = await supabase
        .from('user_drive_connections')
        .update({
          root_folder_id: newFolder.id,
          root_folder_name: newFolder.name,
          root_folder_connected_by: user.id
        })
        .eq('team_id', teamId);

      if (error) throw error;

      setChangingMainFolder(false);
      setShowFolderChooser(false);
      setChooserMode('initial');
      await loadFolderStatus();
    } catch (err) {
      console.error('Error updating main folder:', err);
      setError('Failed to update main folder');
    } finally {
      setSavingMainFolder(false);
    }
  };

  const handleCreateNewFolder = async () => {
    if (creatingFolder || !user) return;

    setCreatingFolder(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Not authenticated');
        setCreatingFolder(false);
        return;
      }

      let teamId = user.user_metadata?.team_id;
      if (!teamId) {
        const { data: userData } = await supabase
          .from('users')
          .select('team_id')
          .eq('id', user.id)
          .maybeSingle();
        teamId = userData?.team_id;
      }

      if (!teamId) {
        setError('No team found');
        setCreatingFolder(false);
        return;
      }

      const createResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-google-drive-folder`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ folderName: 'Astra Team Folder' }),
        }
      );

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create folder');
      }

      const { folder } = await createResponse.json();

      const { error: updateError } = await supabase
        .from('user_drive_connections')
        .update({
          root_folder_id: folder.id,
          root_folder_name: folder.name,
          root_folder_connected_by: user.id
        })
        .eq('team_id', teamId);

      if (updateError) throw updateError;

      setCreatedFolderData({ id: folder.id, name: folder.name });
      setChooserMode('place-files');
      await loadFolderStatus();
    } catch (err: any) {
      console.error('Error creating folder:', err);
      setError(err.message || 'Failed to create folder');
    } finally {
      setCreatingFolder(false);
    }
  };

  const handlePlaceFilesComplete = () => {
    setShowFolderChooser(false);
    setChooserMode('initial');
    setCreatedFolderData(null);
  };

  const handleDisconnectGoogleDrive = async () => {
    if (!user || disconnecting) return;

    setDisconnecting(true);

    try {
      let teamId = user.user_metadata?.team_id;
      if (!teamId) {
        const { data: userData } = await supabase
          .from('users')
          .select('team_id')
          .eq('id', user.id)
          .maybeSingle();
        teamId = userData?.team_id;
      }

      if (!teamId) {
        setError('No team found');
        setDisconnecting(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('user_drive_connections')
        .update({
          is_active: false,
          connection_status: 'disconnected'
        })
        .eq('team_id', teamId);

      if (updateError) throw updateError;

      setShowDisconnectConfirm(false);
      if (onDisconnected) {
        onDisconnected();
      }
      onClose();
    } catch (err) {
      console.error('Error disconnecting Google Drive:', err);
      setError('Failed to disconnect Google Drive');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleOpenAddFiles = (folder: UnifiedFolder) => {
    setAddFilesFolder(folder);
    setShowAddFilesModal(true);
  };

  const handleAddFilesComplete = () => {
    setShowAddFilesModal(false);
    setAddFilesFolder(null);
  };

  const handleOpenFolderChooser = () => {
    setShowFolderChooser(true);
    setChooserMode('initial');
  };

  const handleSelectExistingFolder = async () => {
    setChooserMode('select-existing');
    setLoadingFolders(true);
    setFolderSearchTerm('');
    setAvailableFolders([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('No active session');
        setChooserMode('initial');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-google-drive-folders`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch folders');
      }

      const data = await response.json();
      setAvailableFolders(data.folders || []);
    } catch (err) {
      console.error('Error loading folders:', err);
      setError('Failed to load folders from Google Drive');
      setChooserMode('initial');
    } finally {
      setLoadingFolders(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-orange-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading your connected folders...</p>
        </div>
      </div>
    );
  }

  if (error && !changingMainFolder) {
    return (
      <div className="space-y-6">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <p className="text-sm text-red-300">{error}</p>
        </div>
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const canAddMoreFolders = folders.length < 7;

  return (
    <div className="space-y-6">
      {syncCompleted && syncMessage?.type === 'success' && (
        <div className="bg-green-900/30 border border-green-600 rounded-lg p-4">
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-300 font-medium">{syncMessage.text}</p>
          </div>
        </div>
      )}

      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-600/20 mb-4">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Your Connected Folders</h2>
        <p className="text-gray-300">
          {folders.length} folder{folders.length !== 1 ? 's' : ''} connected
        </p>
      </div>

      <GoogleDriveTroubleshootGuide compact />

      {folders.length > 0 ? (
        <div className="space-y-3">
          {folders.map((folder, idx) => {
            const colors = FOLDER_COLORS[idx % FOLDER_COLORS.length];

            return (
              <div
                key={folder.index}
                className={`${colors.bg} border ${colors.border} rounded-lg p-4`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                      <Folder className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{folder.folderName}</p>
                      <p className="text-xs text-gray-400">
                        {folder.isRoot ? 'Main Team Folder' : 'Additional Folder'}
                      </p>
                      {folder.connectedByEmail && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <User className="w-3 h-3" />
                          Connected by {folder.connectedByEmail === user?.email ? 'you' : folder.connectedByEmail}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenAddFiles(folder)}
                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-600/20 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Add files to folder"
                    >
                      <FilePlus className="w-4 h-4" />
                    </button>
                    {folder.isRoot ? (
                      <button
                        onClick={handleChangeMainFolder}
                        className="p-2 text-gray-400 hover:text-orange-400 hover:bg-orange-600/20 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Change main folder"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRemoveFolder(folder.index)}
                        disabled={removingFolder === folder.index}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-600/20 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50"
                        title="Remove folder"
                      >
                        {removingFolder === folder.index ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-400">
          <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="mb-4">No folders connected yet</p>
          <button
            onClick={handleOpenFolderChooser}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
          >
            <FolderOpen className="w-4 h-4" />
            Select Main Team Folder
          </button>
        </div>
      )}

      {syncMessage && !syncCompleted && (
        <div className={`p-3 rounded-lg ${
          syncMessage.type === 'success' ? 'bg-green-900/20 border border-green-700' : 'bg-red-900/20 border border-red-700'
        }`}>
          <p className={`text-sm text-center ${
            syncMessage.type === 'success' ? 'text-green-300' : 'text-red-300'
          }`}>
            {syncMessage.text}
          </p>
        </div>
      )}

      <div className="flex flex-col space-y-3 pt-4">
        {canAddMoreFolders && (
          <button
            onClick={onConnectMore}
            className="w-full px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <FolderPlus className="w-5 h-5" />
            <span>Add More Folders</span>
          </button>
        )}

        {folders.length > 0 && (
          <button
            onClick={handleSyncDocuments}
            disabled={syncing}
            className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Folder'}</span>
          </button>
        )}

        <button
          onClick={onClose}
          className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors"
        >
          Done
        </button>

        {folders.length > 0 && (
          <button
            onClick={() => setShowDisconnectConfirm(true)}
            className="w-full px-6 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 text-sm"
          >
            <Unlink className="w-4 h-4" />
            <span>Disconnect Google Drive</span>
          </button>
        )}
      </div>

      {changingMainFolder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-white">
                {folders.find(f => f.isRoot) ? 'Change Main Team Folder' : 'Select Main Team Folder'}
              </h3>
              <button
                onClick={() => setChangingMainFolder(false)}
                disabled={savingMainFolder}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {savingMainFolder ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 text-orange-400 animate-spin mx-auto mb-4" />
                  <p className="text-gray-300">Updating folder...</p>
                </div>
              ) : loadingFolders ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 text-orange-400 animate-spin mx-auto mb-4" />
                  <p className="text-gray-300">Loading folders from Google Drive...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-300">
                    {folders.find(f => f.isRoot)
                      ? 'Select a new folder to use as your Main Team Folder.'
                      : 'Choose a folder from your Google Drive to use as your Main Team Folder. This folder will be synced with Astra.'}
                  </p>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search folders..."
                      value={folderSearchTerm}
                      onChange={(e) => setFolderSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all"
                    />
                    {folderSearchTerm && (
                      <button
                        onClick={() => setFolderSearchTerm('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="max-h-[400px] overflow-y-auto bg-gray-700/30 border border-gray-600 rounded-lg">
                    {availableFolders.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-8">
                        No folders available
                      </p>
                    ) : (
                      availableFolders
                        .filter(f => f.name.toLowerCase().includes(folderSearchTerm.toLowerCase()))
                        .map((folder) => {
                          const currentRootFolder = folders.find(f => f.isRoot);
                          const isCurrentlyConnected = currentRootFolder?.folderId === folder.id;

                          return (
                            <button
                              key={folder.id}
                              onClick={() => handleSelectMainFolder(folder)}
                              disabled={isCurrentlyConnected}
                              className={`w-full text-left px-4 py-3 text-sm transition-colors border-b border-gray-600/50 last:border-b-0 flex items-center justify-between ${
                                isCurrentlyConnected
                                  ? 'bg-green-600/20 text-green-300 cursor-not-allowed'
                                  : 'text-white hover:bg-gray-700/50'
                              }`}
                            >
                              <span className="flex items-center">
                                <FolderOpen className="w-4 h-4 inline mr-2 flex-shrink-0" />
                                <span className="truncate">{folder.name}</span>
                              </span>
                              {isCurrentlyConnected && (
                                <span className="flex items-center text-xs text-green-400 ml-2 flex-shrink-0">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Current
                                </span>
                              )}
                            </button>
                          );
                        })
                    )}
                    {availableFolders.length > 0 &&
                      availableFolders.filter(f => f.name.toLowerCase().includes(folderSearchTerm.toLowerCase())).length === 0 && (
                      <p className="text-gray-400 text-sm text-center py-8">
                        No folders match "{folderSearchTerm}"
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showFolderChooser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-white">
                {chooserMode === 'place-files' ? 'Place Your Files' : 'Choose Your Folder'}
              </h3>
              {chooserMode !== 'place-files' && (
                <button
                  onClick={() => {
                    setShowFolderChooser(false);
                    setChooserMode('initial');
                  }}
                  disabled={creatingFolder || savingMainFolder}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="p-6">
              {chooserMode === 'initial' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-600/20 mb-4">
                      <FolderPlus className="w-8 h-8 text-orange-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Choose Your Team Folder</h2>
                    <p className="text-gray-300">
                      Select an existing folder or let Astra create one for you
                    </p>
                  </div>

                  {error && (
                    <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                      <p className="text-sm text-red-300">{error}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={handleSelectExistingFolder}
                      className="bg-gray-700/50 hover:bg-gray-700 border-2 border-gray-600 hover:border-orange-500 rounded-lg p-6 transition-all text-left group min-h-[180px] flex flex-col items-center justify-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-orange-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FolderOpen className="w-8 h-8 text-orange-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2 text-center">
                        Select Existing Folder
                      </h3>
                      <p className="text-sm text-gray-400 text-center">
                        Browse and choose a folder from your Google Drive
                      </p>
                    </button>

                    <button
                      onClick={handleCreateNewFolder}
                      disabled={creatingFolder}
                      className="bg-gray-700/50 hover:bg-gray-700 border-2 border-gray-600 hover:border-blue-500 rounded-lg p-6 transition-all text-left group min-h-[180px] flex flex-col items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="w-16 h-16 rounded-full bg-blue-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        {creatingFolder ? (
                          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                        ) : (
                          <Plus className="w-8 h-8 text-blue-400" />
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2 text-center">
                        {creatingFolder ? 'Creating Folder...' : 'Create "Astra Team Folder"'}
                      </h3>
                      <p className="text-sm text-gray-400 text-center">
                        {creatingFolder ? 'Please wait...' : 'Let Astra create a new folder for your team documents'}
                      </p>
                    </button>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                    <p className="text-sm text-blue-300">
                      <span className="font-medium">About Team Folders:</span> This folder will contain documents about your team's mission, goals, strategic plans, and business data. Astra will read these to better understand your team.
                    </p>
                  </div>
                </div>
              )}

              {chooserMode === 'select-existing' && (
                <div className="space-y-4">
                  {loadingFolders ? (
                    <div className="text-center py-12">
                      <Loader2 className="w-8 h-8 text-orange-400 animate-spin mx-auto mb-4" />
                      <p className="text-gray-300">Loading folders from Google Drive...</p>
                    </div>
                  ) : savingMainFolder ? (
                    <div className="text-center py-12">
                      <Loader2 className="w-8 h-8 text-orange-400 animate-spin mx-auto mb-4" />
                      <p className="text-gray-300">Saving folder selection...</p>
                    </div>
                  ) : (
                    <>
                      <div className="text-center mb-4">
                        <h2 className="text-xl font-bold text-white mb-2">Select a Folder</h2>
                        <p className="text-gray-400 text-sm">
                          Choose a folder from your Google Drive for your team documents
                        </p>
                      </div>

                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search folders..."
                          value={folderSearchTerm}
                          onChange={(e) => setFolderSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all"
                        />
                        {folderSearchTerm && (
                          <button
                            onClick={() => setFolderSearchTerm('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="max-h-[350px] overflow-y-auto bg-gray-700/30 border border-gray-600 rounded-lg">
                        {availableFolders.length === 0 ? (
                          <p className="text-gray-400 text-sm text-center py-8">
                            No folders available
                          </p>
                        ) : (
                          availableFolders
                            .filter(f => f.name.toLowerCase().includes(folderSearchTerm.toLowerCase()))
                            .map((folder) => (
                              <button
                                key={folder.id}
                                onClick={() => handleSelectMainFolder(folder)}
                                className="w-full text-left px-4 py-3 text-sm transition-colors border-b border-gray-600/50 last:border-b-0 flex items-center text-white hover:bg-gray-700/50"
                              >
                                <FolderOpen className="w-4 h-4 inline mr-2 flex-shrink-0 text-orange-400" />
                                <span className="truncate">{folder.name}</span>
                              </button>
                            ))
                        )}
                        {availableFolders.length > 0 &&
                          availableFolders.filter(f => f.name.toLowerCase().includes(folderSearchTerm.toLowerCase())).length === 0 && (
                          <p className="text-gray-400 text-sm text-center py-8">
                            No folders match "{folderSearchTerm}"
                          </p>
                        )}
                      </div>

                      <div className="flex justify-center pt-2">
                        <button
                          onClick={() => setChooserMode('initial')}
                          className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                        >
                          Back
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {chooserMode === 'place-files' && createdFolderData && (
                <PlaceFilesStep
                  onComplete={handlePlaceFilesComplete}
                  progress={null}
                  folderData={{ selectedFolder: createdFolderData }}
                  folderType="strategy"
                  forceChooseOption={true}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {showDisconnectConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[80] p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full border border-gray-700">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Disconnect Google Drive?</h3>
                  <p className="text-sm text-gray-400">This action can be undone by reconnecting</p>
                </div>
              </div>

              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                <p className="text-sm text-red-300">
                  Disconnecting will pause document syncing. Your existing synced documents will remain, but new changes won't be detected until you reconnect.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowDisconnectConfirm(false)}
                  disabled={disconnecting}
                  className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDisconnectGoogleDrive}
                  disabled={disconnecting}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {disconnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Disconnecting...</span>
                    </>
                  ) : (
                    <>
                      <Unlink className="w-4 h-4" />
                      <span>Disconnect</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddFilesModal && addFilesFolder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-white">
                Add Files to {addFilesFolder.folderName}
              </h3>
              <button
                onClick={handleAddFilesComplete}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <PlaceFilesStep
                onComplete={handleAddFilesComplete}
                progress={null}
                folderData={{ selectedFolder: { id: addFilesFolder.folderId, name: addFilesFolder.folderName } }}
                folderType={addFilesFolder.isRoot ? 'strategy' : 'projects'}
                forceChooseOption={true}
                isAddFilesMode={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
