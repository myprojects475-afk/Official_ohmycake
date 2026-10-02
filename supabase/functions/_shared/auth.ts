import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

export const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
export const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
export const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export function adminClient(): SupabaseClient {
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function userClient(accessToken: string): SupabaseClient {
  return createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${accessToken}` } }, auth: { persistSession: false, autoRefreshToken: false } });
}

export async function requireDashboardUser(req: Request, allowedRoles: string[] = ["admin", "client"]) {
  const auth = req.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) throw new Error("Authentication required.");
  const client = adminClient();
  const { data: userData, error: userError } = await client.auth.getUser(token);
  if (userError || !userData.user) throw new Error("Invalid or expired session.");
  const { data: profile, error: profileError } = await client.from("AdminUsers").select("UserID,Username,AuthUserID,AuthEmail,Role").eq("AuthUserID", userData.user.id).single();
  if (profileError || !profile) throw new Error("Dashboard profile not found.");
  if (!allowedRoles.includes(profile.Role)) throw new Error("You do not have permission for this action.");
  return { client, user: userData.user, profile };
}

export function corsHeaders() {
  return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Content-Type": "application/json" };
}

export function json(data: unknown, status = 200) { return new Response(JSON.stringify(data), { status, headers: corsHeaders() }); }
