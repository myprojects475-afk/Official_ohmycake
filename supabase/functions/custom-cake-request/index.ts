import { adminClient, corsHeaders, json } from "../_shared/auth.ts";

function clean(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function base64ToBytes(base64: string) {
  const cleaned = base64.includes(",")
    ? base64.substring(base64.indexOf(",") + 1)
    : base64;

  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

async function getGoogleAccessToken() {
  const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
  const refreshToken = Deno.env.get("GOOGLE_OAUTH_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Google Drive OAuth is not configured. Check GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET and GOOGLE_OAUTH_REFRESH_TOKEN."
    );
  }

  const response = await fetch(
    "https://oauth2.googleapis.com/token",
    {
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
    }
  );

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    console.error("Google OAuth token error:", data);

    throw new Error(
      "Unable to authenticate with Google Drive."
    );
  }

  return data.access_token as string;
}

async function uploadToDrive(file: any) {
  if (!file) {
    return "";
  }

  if (!file.base64) {
    throw new Error("Reference image file is required.");
  }

  if (Number(file.size) > 5 * 1024 * 1024) {
    throw new Error(
      "Reference image must be 5 MB or smaller."
    );
  }

  const folderId = Deno.env.get("GOOGLE_DRIVE_FOLDER_ID");

  if (!folderId) {
    throw new Error(
      "GOOGLE_DRIVE_FOLDER_ID is not configured."
    );
  }

  const accessToken = await getGoogleAccessToken();

  const imageBytes = base64ToBytes(file.base64);

  const boundary = `omc_${crypto.randomUUID()}`;

  const metadata = {
    name: `custom-${Date.now()}-${clean(
      file.name || "reference-image",
      80
    )}`,
    parents: [folderId],
  };

  const metadataPart = new TextEncoder().encode(
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${
      file.type || "application/octet-stream"
    }\r\n\r\n`
  );

  const ending = new TextEncoder().encode(
    `\r\n--${boundary}--`
  );

  const requestBody = new Uint8Array(
    metadataPart.length +
      imageBytes.length +
      ending.length
  );

  requestBody.set(metadataPart, 0);

  requestBody.set(
    imageBytes,
    metadataPart.length
  );

  requestBody.set(
    ending,
    metadataPart.length +
      imageBytes.length
  );

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${accessToken}`,

        "Content-Type":
          `multipart/related; boundary=${boundary}`,
      },

      body: requestBody,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error(
      "Google Drive upload error:",
      data
    );

    throw new Error(
      data?.error?.message ||
        "Google Drive upload failed."
    );
  }

  if (!data.id) {
    throw new Error(
      "Google Drive did not return a file ID."
    );
  }

  // Same type of direct image URL used by the
  // product image upload function.
  return `https://lh3.googleusercontent.com/d/${data.id}=w1200`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders(),
    });
  }

  try {
    const payload = await req.json();

    const name = clean(payload.name, 120);
    const phone = clean(payload.phone, 30);
    const email = clean(payload.email, 160);
    const flavor = clean(payload.flavor, 100);
    const description = clean(
      payload.description,
      2000
    );
    const address = clean(payload.address, 500);

    if (
      !name ||
      !phone ||
      !validEmail(email) ||
      !flavor ||
      !description ||
      !payload.date ||
      !payload.time
    ) {
      return json(
        {
          error:
            "Please complete all required fields.",
        },
        400
      );
    }

    const qty = Number(payload.qty);

    if (
      !Number.isInteger(qty) ||
      qty < 1 ||
      qty > 50
    ) {
      return json(
        {
          error:
            "Quantity must be a whole number between 1 and 50.",
        },
        400
      );
    }

    const fulfillment =
      payload.fulfillment === "Delivery"
        ? "Delivery"
        : "Pickup";

    if (
      fulfillment === "Delivery" &&
      !address
    ) {
      return json(
        {
          error:
            "Delivery address is required.",
        },
        400
      );
    }

    const db = adminClient();

    // Validate date/time against the shop's
    // booking rules.
    const {
      data: booking,
      error: bookingError,
    } = await db.rpc(
      "validate_booking_window",
      {
        p_date: payload.date,
        p_time: payload.time,
      }
    );

    if (bookingError) {
      throw bookingError;
    }

    if (!booking?.valid) {
      return json(
        {
          error:
            booking?.message ||
            "Invalid booking time.",
        },
        400
      );
    }

    // ---------------------------------------------
    // GOOGLE DRIVE REFERENCE IMAGE
    // ---------------------------------------------

    const referenceImageUrl =
      await uploadToDrive(
        payload.referenceImage
      );

    // ---------------------------------------------
    // CREATE CUSTOM CAKE REQUEST
    // ---------------------------------------------

    const requestId =
      `CCR-${new Date()
        .toISOString()
        .slice(0, 10)
        .replaceAll("-", "")}-${String(
        Date.now()
      ).slice(-6)}`;

    const row = {
      RequestID: requestId,

      CustomerName: name,

      Phone: phone,

      Email: email,

      Occasion: clean(
        payload.occasion,
        100
      ),

      Flavor: flavor,

      Qty: qty,

      Weight: clean(
        payload.weight,
        40
      ),

      DateNeeded: payload.date,

      TimeNeeded: payload.time,

      Description: description,

      ReferenceImageURL:
        referenceImageUrl,

      FulfillmentType:
        fulfillment,

      Address:
        fulfillment === "Delivery"
          ? address
          : "",

      Status: "New",
    };

    const { error } =
      await db
        .from("CustomCakeRequests")
        .insert(row);

    if (error) {
      throw error;
    }

    // ---------------------------------------------
    // SEND NOTIFICATIONS
    // ---------------------------------------------

    try {
      const base =
        Deno.env.get("SUPABASE_URL");

      const secret =
        Deno.env.get(
          "NOTIFICATION_INTERNAL_SECRET"
        );

      if (base && secret) {
        await fetch(
          `${base}/functions/v1/send-notifications`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              "X-Notification-Secret":
                secret,
            },

            body: JSON.stringify({
              type: "custom",
              request: row,
            }),
          }
        );
      }
    } catch (notificationError) {
      console.error(
        "Notification dispatch failed",
        notificationError
      );
    }

    return json({
      ok: true,
      requestId,
    });
  } catch (error) {
    console.error(
      "custom-cake-request error:",
      error
    );

    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to submit custom cake request.",
      },
      400
    );
  }
});