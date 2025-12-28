import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const N8N_WEBHOOK_URL = 'https://healthrocket.app.n8n.cloud/webhook/astra-data-sync-scanner';

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = await req.json();

    if (!payload.team_id || !payload.user_id || !payload.folder_id || !payload.access_token) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: team_id, user_id, folder_id, access_token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (payload.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'User ID mismatch' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[manual-folder-sync-proxy] Creating sync session for team ${payload.team_id}`);

    const folderName = payload.folder_name || 'Root';

    const { data: session, error: sessionError } = await supabase
      .from('data_sync_sessions')
      .insert({
        team_id: payload.team_id,
        user_id: payload.user_id,
        sync_type: 'manual',
        folder_type: folderName,
        folder_id: payload.folder_id,
        status: 'discovery',
        files_discovered: 0,
        files_processed: 0,
        files_classified: 0,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessionError) {
      console.error('[manual-folder-sync-proxy] Failed to create sync session:', sessionError);
    } else {
      console.log(`[manual-folder-sync-proxy] Created sync session: ${session.id}`);
    }

    console.log(`[manual-folder-sync-proxy] Forwarding sync request for team ${payload.team_id}, folder: ${folderName}`);

    const n8nPayload = {
      team_id: payload.team_id,
      user_id: payload.user_id,
      folder_id: payload.folder_id,
      access_token: payload.access_token,
      folder_name: folderName,
      folder_path: payload.folder_path || '/',
      max_depth: payload.max_depth || 10,
      exclude_folders: payload.exclude_folders || ['Archive', 'Old', 'Trash', '.hidden'],
      sync_session_id: session?.id,
    };

    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nPayload),
    });

    let responseData;
    const responseText = await n8nResponse.text();

    if (responseText) {
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { success: n8nResponse.ok, message: responseText || 'Sync triggered' };
      }
    } else {
      responseData = { success: n8nResponse.ok, message: 'Sync triggered successfully' };
    }

    if (session) {
      responseData.session_id = session.id;
    }

    console.log(`[manual-folder-sync-proxy] n8n response status: ${n8nResponse.status}`);

    return new Response(
      JSON.stringify(responseData),
      {
        status: n8nResponse.ok ? 200 : n8nResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[manual-folder-sync-proxy] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});