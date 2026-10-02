import { adminClient, corsHeaders, json } from "../_shared/auth.ts";

function clean(value: unknown, max: number) { return String(value ?? "").trim().slice(0, max); }
function validEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function haversineKm(lat1:number,lon1:number,lat2:number,lon2:number){const R=6371;const dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180;const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(a));}


async function dbSettings(){
  const { createClient } = await import("npm:@supabase/supabase-js@2");
  const client=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false,autoRefreshToken:false}});
  return client.from("Settings").select("Key,Value");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });
  try {
    const payload = await req.json();
    const name = clean(payload.name,120), phone = clean(payload.phone,30), email = clean(payload.email,160);
    const fulfillment = payload.fulfillment === "Delivery" ? "Delivery" : "Pickup";
    const paymentMode = payload.paymentMode === "Online" ? "Online" : "Pay at Store";
    if (!name || !phone || !validEmail(email)) return json({ error:"Please provide a valid name, phone number and email." },400);
    if (!Array.isArray(payload.items) || payload.items.length === 0) return json({ error:"Your cart is empty." },400);
    if (fulfillment === "Delivery" && paymentMode !== "Online") return json({ error:"Delivery orders require online payment." },400);
    if (fulfillment === "Pickup" && paymentMode === "Online") return json({ error:"Online pickup payment is not connected yet. Choose Pay at Store." },400);
    if (fulfillment === "Delivery") {
      let lat=Number(payload.latitude),lon=Number(payload.longitude);
      if(!Number.isFinite(lat)||!Number.isFinite(lon)){
        const key=Deno.env.get("GOOGLE_MAPS_SERVER_KEY");
        if(!key)return json({error:"Delivery location verification is not configured."},503);
        const response=await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(clean(payload.address,500))}&key=${encodeURIComponent(key)}`);
        const geo=await response.json(); const loc=geo?.results?.[0]?.geometry?.location;
        if(!loc)return json({error:"We could not verify the delivery address."},400); lat=Number(loc.lat);lon=Number(loc.lng);
      }
      const storeLat=Number(Deno.env.get("SHOP_LATITUDE")),storeLon=Number(Deno.env.get("SHOP_LONGITUDE"));
      if(!Number.isFinite(storeLat)||!Number.isFinite(storeLon))return json({error:"Store delivery coordinates are not configured."},503);
      const {data:radiusRows}=await dbSettings();
      const radius=Number(radiusRows?.find((x:any)=>x.Key==="DeliveryRadiusKm")?.Value||15);
      const distance=haversineKm(storeLat,storeLon,lat,lon);
      if(distance>radius)return json({error:`Delivery is available only within ${radius} km. This address is ${distance.toFixed(1)} km away.`},400);
      payload.deliveryEligible=true; payload.latitude=lat; payload.longitude=lon; payload.deliveryDistanceKm=distance;
    }

    for (const item of payload.items) {
      const qty = Number(item.Qty);
      if (!Number.isInteger(qty) || qty < 1 || qty > 50) return json({ error:"Invalid quantity in your cart." },400);
      if (item.CakeMessage && String(item.CakeMessage).length > 120) return json({ error:"Cake message is too long." },400);
    }

    const db = adminClient();
    const { data, error } = await db.rpc("create_catalog_order", {
      p_payload: {
        ...payload,
        name, phone, email,
        fulfillment, paymentMode,
        address: fulfillment === "Delivery" ? clean(payload.address,500) : "",
        occasion: clean(payload.occasion,100),
        offerCode: clean(payload.offer?.code || payload.offerCode || "",50),
        candleBoxCount: Math.max(0, Math.min(50, Number(payload.items.reduce((n:any,x:any)=>n+Number(x.CandleBoxes||0),0)))),
      }
    });
    if (error) throw error;
    try {
      const base=Deno.env.get("SUPABASE_URL"); const secret=Deno.env.get("INTERNAL_FUNCTION_SECRET");
      if(base&&secret&&data?.orderId){
        const order=(await adminClient().from("Orders").select("*").eq("OrderID",data.orderId).single()).data;
        const items=(await adminClient().from("OrderItems").select("*").eq("OrderID",data.orderId)).data||[];
        await fetch(`${base}/functions/v1/send-notifications`,{method:"POST",headers:{"Content-Type":"application/json","X-Notification-Secret":secret},body:JSON.stringify({type:"order",order,items})});
      }
    } catch (notificationError) { console.error("Notification dispatch failed", notificationError); }
    return json(data);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to create the order." }, 400);
  }
});
