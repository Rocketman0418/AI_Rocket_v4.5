import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface UploadPayload {
  storagePath: string;
  filename: string;
  mimeType: string;
  category?: string;
  teamId: string;
  userId: string;
  uploadId: string;
  fileSize: number;
}

Deno.serve(async (req: Request) => {
  // Handle OPTIONS first, before any processing
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = await req.json() as UploadPayload;

    if (!payload.filename || !payload.storagePath || !payload.teamId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Size check BEFORE downloading
    const maxSize = 50 * 1024 * 1024;
    if (payload.fileSize > maxSize) {
      return new Response(
        JSON.stringify({ error: "File size exceeds 50 MB limit" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("local-uploads")
      .download(payload.storagePath);

    if (downloadError || !fileData) {
      console.error("Storage download error:", downloadError);
      return new Response(
        JSON.stringify({ error: "Failed to download file from storage" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert blob to array buffer
    const fileBuffer = new Uint8Array(await fileData.arrayBuffer());

    // Check file type with special handling for markdown
    const fileName = payload.filename.toLowerCase();
    const isMarkdown = fileName.endsWith(".md") || fileName.endsWith(".markdown");

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-powerpoint",
      "text/plain",
      "text/markdown",
      "text/x-markdown",
      "text/csv"
    ];

    // Accept markdown files regardless of mime type if extension is .md
    const isValidType = allowedTypes.includes(payload.mimeType) ||
                       (isMarkdown && (payload.mimeType === "" || payload.mimeType.startsWith("text/") || payload.mimeType === "application/octet-stream"));

    if (!isValidType) {
      return new Response(
        JSON.stringify({ error: `File type ${payload.mimeType} not supported` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify team membership
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("team_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData || userData.team_id !== payload.teamId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - team mismatch" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use the storage path from the client upload
    const storagePath = payload.storagePath;
    const sanitizedFilename = payload.filename.replace(/[^a-zA-Z0-9._-]/g, "_");

    // Extract text content - limit size to prevent memory issues
    let textContent = "";
    const maxTextSize = 5 * 1024 * 1024; // 5MB limit for text extraction
    const isTextFile = payload.mimeType.startsWith("text/") || isMarkdown;

    if (isTextFile && fileBuffer.byteLength <= maxTextSize) {
      try {
        const decoder = new TextDecoder("utf-8", { fatal: false });
        textContent = decoder.decode(fileBuffer);
      } catch (decodeError) {
        console.error("Text decode error:", decodeError);
        textContent = "[Text extraction failed]";
      }
    } else if (isTextFile && fileBuffer.byteLength > maxTextSize) {
      textContent = "[File too large for immediate text extraction]";
    } else {
      textContent = "[Content will be extracted by processing pipeline]";
    }

    // Use the mime type from payload
    const finalMimeType = isMarkdown ? "text/markdown" : (payload.mimeType || "application/octet-stream");

    // Trigger n8n webhook for processing
    const n8nWebhookUrl = Deno.env.get("N8N_UNIFIED_SYNC_WEBHOOK");
    if (n8nWebhookUrl) {
      try {
        const webhookPayload = {
          team_id: payload.teamId,
          user_id: user.id,
          files: [{
            file_id: `local_upload_${payload.uploadId}`,
            file_name: sanitizedFilename,
            mime_type: finalMimeType,
            content: textContent.substring(0, 100000), // Limit content size in webhook
            upload_source: "local_upload",
            storage_path: storagePath,
            uploaded_by: user.id,
            original_filename: payload.filename,
            category: payload.category || "other",
            file_size: payload.fileSize,
          }],
        };

        await fetch(n8nWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookPayload),
        });
      } catch (webhookError) {
        console.error("n8n webhook error:", webhookError);
        // Don't fail the upload if webhook fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        uploadId: payload.uploadId,
        storagePath,
        filename: payload.filename,
        size: payload.fileSize,
        mimeType: finalMimeType,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
