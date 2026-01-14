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

    const drives: Array<{
      id: string;
      name: string;
      driveType: string;
      webUrl?: string;
      owner?: { user?: { displayName: string }; group?: { displayName: string } };
    }> = [];

    console.log('[List Microsoft Drives] Fetching user drives...');

    const myDriveResponse = await fetch(
      'https://graph.microsoft.com/v1.0/me/drive',
      {
        headers: { Authorization: `Bearer ${connection.access_token}` }
      }
    );

    if (myDriveResponse.ok) {
      const myDrive = await myDriveResponse.json();
      drives.push({
        id: myDrive.id,
        name: myDrive.name || 'OneDrive',
        driveType: myDrive.driveType || 'personal',
        webUrl: myDrive.webUrl,
        owner: myDrive.owner
      });
      console.log('[List Microsoft Drives] Found personal OneDrive:', myDrive.name);
    } else {
      console.error('[List Microsoft Drives] Failed to get personal drive:', myDriveResponse.status);
    }

    console.log('[List Microsoft Drives] Fetching SharePoint sites...');

    const sitesResponse = await fetch(
      'https://graph.microsoft.com/v1.0/me/followedSites?$top=50',
      {
        headers: { Authorization: `Bearer ${connection.access_token}` }
      }
    );

    if (sitesResponse.ok) {
      const sitesData = await sitesResponse.json();
      const sites = sitesData.value || [];

      console.log('[List Microsoft Drives] Found', sites.length, 'followed sites');

      for (const site of sites) {
        try {
          const siteDrivesResponse = await fetch(
            `https://graph.microsoft.com/v1.0/sites/${site.id}/drives`,
            {
              headers: { Authorization: `Bearer ${connection.access_token}` }
            }
          );

          if (siteDrivesResponse.ok) {
            const siteDrivesData = await siteDrivesResponse.json();
            const siteDrives = siteDrivesData.value || [];

            for (const drive of siteDrives) {
              drives.push({
                id: drive.id,
                name: `${site.displayName} - ${drive.name}`,
                driveType: 'documentLibrary',
                webUrl: drive.webUrl,
                owner: { group: { displayName: site.displayName } }
              });
            }
          }
        } catch (siteError) {
          console.error('[List Microsoft Drives] Error fetching site drives:', siteError);
        }
      }
    } else {
      console.log('[List Microsoft Drives] Could not fetch followed sites:', sitesResponse.status);
    }

    const sharedDrivesResponse = await fetch(
      'https://graph.microsoft.com/v1.0/me/drives',
      {
        headers: { Authorization: `Bearer ${connection.access_token}` }
      }
    );

    if (sharedDrivesResponse.ok) {
      const sharedDrivesData = await sharedDrivesResponse.json();
      const sharedDrives = sharedDrivesData.value || [];

      for (const drive of sharedDrives) {
        const exists = drives.some(d => d.id === drive.id);
        if (!exists) {
          drives.push({
            id: drive.id,
            name: drive.name || 'Shared Drive',
            driveType: drive.driveType || 'business',
            webUrl: drive.webUrl,
            owner: drive.owner
          });
        }
      }
    }

    console.log('[List Microsoft Drives] Total drives found:', drives.length);

    return new Response(
      JSON.stringify({ drives }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('[List Microsoft Drives] Error:', error);
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