import {
  corsHeaders,
  json,
  requireDashboardUser,
} from "../_shared/auth.ts";

function clean(v: unknown, max: number) {
  return String(v ?? "").trim().slice(0, max);
}

async function getAccessToken() {
  const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
  const refreshToken = Deno.env.get("GOOGLE_OAUTH_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Google Drive OAuth is not configured. Check GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET and GOOGLE_OAUTH_REFRESH_TOKEN."
    );
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    console.error("Google OAuth token error:", data);
    throw new Error("Unable to authenticate with Google Drive.");
  }

  return data.access_token as string;
}

async function upload(file: any) {
  if (!file?.base64) {
    throw new Error("Image file is required.");
  }

  if (Number(file.size) > 5 * 1024 * 1024) {
    throw new Error("Image must be 5 MB or smaller.");
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only JPG, PNG and WEBP images are allowed.");
  }

  const accessToken = await getAccessToken();
  const folderId = Deno.env.get("GOOGLE_DRIVE_FOLDER_ID");

  if (!folderId) {
    throw new Error("GOOGLE_DRIVE_FOLDER_ID is not configured.");
  }

  const boundary = `omc_${crypto.randomUUID()}`;

  const metadata = {
    name: `omc-${Date.now()}-${clean(file.name, 80)}`,
    parents: [folderId],
  };

  const multipartBody = [
    `--${boundary}\r\n`,
    `Content-Type: application/json; charset=UTF-8\r\n\r\n`,
    `${JSON.stringify(metadata)}\r\n`,

    `--${boundary}\r\n`,
    `Content-Type: ${file.type}\r\n`,
    `Content-Transfer-Encoding: base64\r\n\r\n`,
    `${file.base64}\r\n`,

    `--${boundary}--`,
  ].join("");

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Google Drive upload error:", data);

    throw new Error(
      data?.error?.message || "Google Drive upload failed."
    );
  }

  if (!data.id) {
    throw new Error("Google Drive did not return a file ID.");
  }

  return `https://lh3.googleusercontent.com/d/${data.id}=w1200`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders(),
    });
  }

  try {
    await requireDashboardUser(req, ["admin", "client"]);

    const body = await req.json();

    const url = await upload(body.file);

    return json({
      ok: true,
      url,
    });
  } catch (e) {
    console.error("upload-image error:", e);

    return json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Upload failed.",
      },
      400
    );
  }
});