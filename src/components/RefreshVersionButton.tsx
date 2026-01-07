import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useVersionCheck } from '../hooks/useVersionCheck';

export const RefreshVersionButton: React.FC = () => {
  const { newVersionAvailable, isRefreshing, refresh } = useVersionCheck();

  return (
    <button
      onClick={refresh}
      disabled={!newVersionAvailable || isRefreshing}
      className={`relative p-2 rounded-lg transition-all min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation ${
        newVersionAvailable
          ? 'hover:bg-slate-700 cursor-pointer'
          : 'cursor-not-allowed opacity-40'
      }`}
      title={newVersionAvailable ? 'New version available - Click to update' : 'App is up to date'}
    >
      <RefreshCw
        className={`w-5 h-5 ${
          newVersionAvailable
            ? 'text-green-400'
            : 'text-gray-500'
        } ${isRefreshing ? 'animate-spin' : ''}`}
      />

      {newVersionAvailable && !isRefreshing && (
        <>
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-green-400 rounded-full animate-ping" />
        </>
      )}
    </button>
  );
};
