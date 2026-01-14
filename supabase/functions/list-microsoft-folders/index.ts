import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');

    let userId: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub;
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: connection, error: connError } = await supabase
      .from('user_drive_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'microsoft')
      .eq('is_active', true)
      .maybeSingle();

    if (connError || !connection) {
      return new Response(
        JSON.stringify({ error: 'Microsoft connection not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const url = new URL(req.url);
    const driveId = url.searchParams.get('driveId');
    const itemId = url.searchParams.get('itemId') || 'root';

    if (!driveId) {
      return new Response(
        JSON.stringify({ error: 'Missing driveId parameter' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[List Microsoft Folders] Fetching folders from drive:', driveId, 'item:', itemId);

    const graphUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}/children?$filter=folder ne null&$select=id,name,folder,webUrl,parentReference`;

    const foldersResponse = await fetch(graphUrl, {
      headers: { Authorization: `Bearer ${connection.access_token}` }
    });

    if (!foldersResponse.ok) {
      const errorText = await foldersResponse.text();
      console.error('[List Microsoft Folders] Graph API error:', foldersResponse.status, errorText);

      if (foldersResponse.status === 401) {
        await supabase
          .from('user_drive_connections')
          .update({ connection_status: 'token_expired' })
          .eq('id', connection.id);

        return new Response(
          JSON.stringify({ error: 'Token expired. Please reconnect.' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      throw new Error(`Failed to list folders: ${errorText}`);
    }

    const data = await foldersResponse.json();
    const items = data.value || [];

    const folders = items.map((item: any) => ({
      id: item.id,
      name: item.name,
      webUrl: item.webUrl,
      parentReference: item.parentReference ? {
        driveId: item.parentReference.driveId,
        id: item.parentReference.id,
        path: item.parentReference.path
      } : undefined
    }));

    console.log('[List Microsoft Folders] Found', folders.length, 'folders');

    return new Response(
      JSON.stringify({ folders }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('[List Microsoft Folders] Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});