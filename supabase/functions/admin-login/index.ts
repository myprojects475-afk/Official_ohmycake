import { adminClient, corsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });
  try {
    const { username, password } = await req.json();
    if (!username || !password) return new Response(JSON.stringify({ error: "Username and password are required." }), { status: 400, headers: corsHeaders() });
    const client = adminClient();
    const { data: profile, error: profileError } = await client.from("AdminUsers").select("UserID,Username,AuthUserID,AuthEmail,Role").ilike("Username", String(username).trim()).single();
    if (profileError || !profile) return new Response(JSON.stringify({ error: "Invalid username or password." }), { status: 401, headers: corsHeaders() });
    const { data: authData, error: authError } = await client.auth.signInWithPassword({ email: profile.AuthEmail, password });
    if (authError || !authData.session || !authData.user) return new Response(JSON.stringify({ error: "Invalid username or password." }), { status: 401, headers: corsHeaders() });
    if (profile.AuthUserID !== authData.user.id) return new Response(JSON.stringify({ error: "Dashboard profile is not linked to this Auth user." }), { status: 403, headers: corsHeaders() });
    return new Response(JSON.stringify({ session: authData.session, dashboard: { userId: profile.UserID, username: profile.Username, role: profile.Role, authUserId: authData.user.id } }), { headers: corsHeaders() });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Login failed." }), { status: 500, headers: corsHeaders() });
  }
});
