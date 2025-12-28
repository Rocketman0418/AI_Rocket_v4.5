import React, { useState, useEffect } from 'react';
import { Folder, Edit2, Loader2, Lightbulb, HelpCircle, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import LocalFileUpload from '../LocalFileUpload';

interface UnifiedFolder {
  index: number;
  folderId: string | null;
  folderName: string | null;
  isRoot: boolean;
}

interface FolderManagementSectionProps {
  onOpenFolderManager: () => void;
  hasGoogleDrive: boolean;
  tokenExpired: boolean;
  userRole?: string;
  onLocalUploadComplete?: () => void;
}

const FOLDER_COLORS = [
  { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
];

export const FolderManagementSection: React.FC<FolderManagementSectionProps> = ({
  onOpenFolderManager,
  hasGoogleDrive,
  tokenExpired,
  userRole = 'admin',
  onLocalUploadComplete
}) => {
  const isAdmin = userRole === 'admin';
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<UnifiedFolder[]>([]);
  const [showEducation, setShowEducation] = useState(false);
  const [showLocalUpload, setShowLocalUpload] = useState(false);

  useEffect(() => {
    loadFolderStatus();
  }, [user]);

  const loadFolderStatus = async () => {
    if (!user) return;

    try {
      setLoading(true);

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
        setLoading(false);
        return;
      }

      const { data: driveConnection } = await supabase
        .from('user_drive_connections')
        .select('*')
        .eq('team_id', teamId)
        .maybeSingle();

      if (!driveConnection) {
        setLoading(false);
        return;
      }

      const unifiedFolders: UnifiedFolder[] = [];

      if (driveConnection.root_folder_id && driveConnection.root_folder_name) {
        unifiedFolders.push({
          index: 0,
          folderId: driveConnection.root_folder_id,
          folderName: driveConnection.root_folder_name,
          isRoot: true
        });
      }

      for (let i = 1; i <= 6; i++) {
        const folderId = driveConnection[`folder_${i}_id`];
        const folderName = driveConnection[`folder_${i}_name`];

        if (folderId && folderName) {
          unifiedFolders.push({
            index: i,
            folderId,
            folderName,
            isRoot: false
          });
        }
      }

      setFolders(unifiedFolders);
    } catch (err) {
      console.error('Error loading folder status:', err);
    } finally {
      setLoading(false);
    }
  };

  const connectedFolders = folders.filter(f => f.folderId);

  if (!hasGoogleDrive) {
    return null;
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-orange-400" />
          <h3 className="text-xs font-semibold text-white">Synced Folders (Google Drive)</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowEducation(!showEducation)}
            className="text-gray-400 hover:text-white transition-colors p-1"
            title="Learn about data sync"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          {isAdmin && (
            <>
              <button
                onClick={onOpenFolderManager}
                disabled={tokenExpired}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-600/80 hover:bg-orange-600 text-white rounded text-xs font-medium transition-all disabled:opacity-50 min-h-[32px]"
              >
                <Edit2 className="w-3 h-3" />
                <span>{connectedFolders.length > 0 ? 'Manage' : 'Connect'}</span>
              </button>
              <button
                onClick={() => setShowLocalUpload(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600/80 hover:bg-green-600 text-white rounded text-xs font-medium transition-all min-h-[32px]"
              >
                <Upload className="w-3 h-3" />
                <span>Add Local Files</span>
              </button>
            </>
          )}
        </div>
      </div>

      {showEducation && (
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3 mb-2">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <p className="text-xs text-gray-300">
                Sync documents from Google Drive folders or upload files directly from your computer.
              </p>
              <p className="text-[10px] text-gray-400">
                Astra will automatically categorize and index your documents for intelligent search and analysis, regardless of source.
              </p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-3">
          <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
        </div>
      ) : (
        <>
          {connectedFolders.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-1.5">
              {connectedFolders.map((folder, idx) => {
                const colors = FOLDER_COLORS[idx % FOLDER_COLORS.length];

                return (
                  <div
                    key={folder.index}
                    className={`flex items-center gap-2 p-2 rounded-lg bg-gray-900/50 border ${colors.border}`}
                  >
                    <div className={`w-6 h-6 ${colors.bg} rounded flex items-center justify-center flex-shrink-0`}>
                      <Folder className={`w-3 h-3 ${colors.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-white truncate block" title={folder.folderName || ''}>
                        {folder.folderName}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {folder.isRoot ? 'Main Team Folder' : 'Additional Folder'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-3 text-gray-500 text-xs">
              No folders connected yet
            </div>
          )}

          {tokenExpired && (
            <p className="text-[10px] text-red-400 text-center mt-1.5">
              Re-authorize Google Drive to manage folders
            </p>
          )}
        </>
      )}

      {/* Local File Upload Modal */}
      {showLocalUpload && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Upload Local Files</h3>
                <button
                  onClick={() => setShowLocalUpload(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Upload documents from your computer to sync with Astra Intelligence
              </p>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <LocalFileUpload
                category="other"
                onUploadComplete={(uploadIds) => {
                  console.log('Files uploaded successfully:', uploadIds);
                  if (onLocalUploadComplete) {
                    onLocalUploadComplete();
                  }
                }}
                onUploadError={(error) => {
                  console.error('Upload error:', error);
                }}
              />
            </div>

            <div className="px-6 py-4 border-t border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowLocalUpload(false);
                  if (onLocalUploadComplete) {
                    onLocalUploadComplete();
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
