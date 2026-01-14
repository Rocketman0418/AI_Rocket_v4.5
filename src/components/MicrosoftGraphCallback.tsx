import React, { useEffect, useState } from 'react';
import { Cloud, CheckCircle, XCircle } from 'lucide-react';
import { handleMicrosoftCallback } from '../lib/microsoft-graph-oauth';

export const MicrosoftGraphCallback: React.FC = () => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Connecting your Microsoft account...');
  const [error, setError] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const errorParam = params.get('error');
        const errorDescription = params.get('error_description');

        console.log('[MicrosoftGraphCallback] Processing OAuth callback');

        if (errorParam) {
          throw new Error(errorDescription || errorParam);
        }

        if (!code || !state) {
          throw new Error('Missing authorization code or state parameter');
        }

        setMessage('Exchanging authorization code...');
        const result = await handleMicrosoftCallback(code, state);

        console.log('[MicrosoftGraphCallback] Success:', result);
        setStatus('success');
        setMessage(`Successfully connected: ${result.email}`);

        const fromGuidedSetup = sessionStorage.getItem('microsoft_from_guided_setup');
        const fromLaunchPrep = sessionStorage.getItem('microsoft_from_launch_prep');

        if (fromGuidedSetup) {
          sessionStorage.removeItem('microsoft_from_guided_setup');
        }
        if (fromLaunchPrep) {
          sessionStorage.removeItem('microsoft_from_launch_prep');
          sessionStorage.setItem('reopen_fuel_stage', 'true');
          sessionStorage.setItem('return_to_launch_prep', 'true');
        }

        sessionStorage.setItem('microsoft_oauth_complete', 'true');
        sessionStorage.setItem('show_microsoft_drive_selector', 'true');

        setTimeout(() => {
          if (fromGuidedSetup) {
            window.location.href = '/?openGuidedSetup=true&selectMicrosoftDrive=true';
          } else {
            window.location.href = '/?selectMicrosoftDrive=true';
          }
        }, 2000);

      } catch (err: any) {
        console.error('[MicrosoftGraphCallback] Error:', err);
        setStatus('error');
        setError(err.message || 'Failed to connect Microsoft account');
        setMessage('Connection failed');

        setTimeout(() => {
          window.location.href = '/';
        }, 5000);
      }
    };

    processCallback();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8 text-center">
        <div className="mb-6">
          {status === 'processing' && (
            <div className="flex flex-col items-center space-y-4">
              <Cloud className="w-16 h-16 text-cyan-400" />
              <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-400" />
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="w-16 h-16 text-red-400" />
            </div>
          )}
        </div>

        <h2 className="text-xl font-bold text-white mb-2">
          {status === 'processing' && 'Connecting Microsoft'}
          {status === 'success' && 'Successfully Connected!'}
          {status === 'error' && 'Connection Failed'}
        </h2>

        <p className="text-gray-400 mb-4">{message}</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mt-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <p className="text-sm text-gray-500 mt-6">
          {status === 'processing' && 'Please wait...'}
          {status === 'success' && 'Redirecting to select your drive...'}
          {status === 'error' && 'Redirecting you back to the app...'}
        </p>
      </div>
    </div>
  );
};
