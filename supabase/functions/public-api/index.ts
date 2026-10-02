import { adminClient, corsHeaders, json } from "../_shared/auth.ts";

function haversineKm(lat1:number, lon1:number, lat2:number, lon2:number) {
  const R = 6371;
  const dLat = (lat2-lat1)*Math.PI/180;
  const dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });
  try {
    const body = await req.json();
    const action = body.action;
    const db = adminClient();

    if (action === "validate-offer") {
      const code = String(body.code || "").trim().toUpperCase();
      const cartTotal = Number(body.cartTotal || 0);
      if (!code) return json({ valid:false, message:"Enter an offer code." });
      const { data, error } = await db.from("Offers").select("*").ilike("Code", code).eq("Active", "Y").maybeSingle();
      if (error || !data) return json({ valid:false, message:"Invalid or expired offer code." });
      const now = new Date();
      if (data.ValidFrom && now < new Date(`${data.ValidFrom}T00:00:00+05:30`)) return json({ valid:false, message:"This offer is not active yet." });
      if (data.ValidTo && now > new Date(`${data.ValidTo}T23:59:59+05:30`)) return json({ valid:false, message:"This offer has expired." });
      if (cartTotal < Number(data.MinOrderValue || 0)) return json({ valid:false, message:`Minimum order value is ₹${data.MinOrderValue}.` });
      if (Number(data.UsageLimit || 0) > 0 && Number(data.TimesUsed || 0) >= Number(data.UsageLimit)) return json({ valid:false, message:"This offer has reached its usage limit." });
      let discount = String(data.DiscountType).toLowerCase() === "percent" ? Math.round(cartTotal * Number(data.DiscountValue) / 100) : Number(data.DiscountValue);
      discount = Math.min(Math.max(0, discount), cartTotal);
      return json({ valid:true, code:data.Code, discount });
    }

    if (action === "validate-booking") {
      const { data, error } = await db.rpc("validate_booking_window", { p_date: body.date, p_time: body.time });
      if (error) throw error;
      return json(data);
    }

    if (action === "validate-delivery") {
      const address = String(body.address || "").trim();
      if (!address) return json({ eligible:false, fee:0, message:"Enter a delivery address." });
      const radius = Number((await db.from("Settings").select("Value").eq("Key","DeliveryRadiusKm").maybeSingle()).data?.Value || 15);
      const fee = Number((await db.from("Settings").select("Value").eq("Key","DeliveryFeeFlat").maybeSingle()).data?.Value || 60);
      let lat = Number(body.latitude), lon = Number(body.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        const key = Deno.env.get("GOOGLE_MAPS_SERVER_KEY");
        if (!key) return json({ eligible:false, fee:0, needsLocation:true, message:"Delivery location could not be verified yet. Configure GOOGLE_MAPS_SERVER_KEY and the shop coordinates in Supabase Edge Function secrets." }, 503);
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${encodeURIComponent(key)}`;
        const response = await fetch(url);
        const result = await response.json();
        const location = result?.results?.[0]?.geometry?.location;
        if (!location) return json({ eligible:false, fee:0, message:"We could not find that address. Please enter a more complete address." });
        lat = Number(location.lat); lon = Number(location.lng);
      }
      const storeLat = Number(Deno.env.get("SHOP_LATITUDE"));
      const storeLon = Number(Deno.env.get("SHOP_LONGITUDE"));
      if (!Number.isFinite(storeLat) || !Number.isFinite(storeLon)) return json({ eligible:false, fee:0, message:"Store delivery coordinates are not configured." }, 503);
      const distanceKm = haversineKm(storeLat, storeLon, lat, lon);
      return json({ eligible: distanceKm <= radius, fee: distanceKm <= radius ? fee : 0, distanceKm: Number(distanceKm.toFixed(2)), latitude:lat, longitude:lon, message: distanceKm <= radius ? `Delivery available (${distanceKm.toFixed(1)} km).` : `This address is ${distanceKm.toFixed(1)} km away. Delivery is available only within ${radius} km.` });
    }

    return json({ error:"Unknown public API action." }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Request failed." }, 500);
  }
});
