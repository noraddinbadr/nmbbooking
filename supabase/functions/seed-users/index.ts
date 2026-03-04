import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const users = [
    { email: "sh25ca25@gmail.com", name: "مالك المنصة", roles: ["admin"] },
    { email: "doctor@sehtak.test", name: "د. أحمد العليمي", roles: ["doctor"] },
    { email: "patient@sehtak.test", name: "محمد المريض", roles: ["patient"] },
    { email: "staff@sehtak.test", name: "سارة الموظفة", roles: ["staff"] },
    { email: "clinic_admin@sehtak.test", name: "خالد مدير العيادة", roles: ["clinic_admin"] },
    { email: "donor@sehtak.test", name: "علي المتبرع", roles: ["donor"] },
    { email: "provider@sehtak.test", name: "مختبر الأمل", roles: ["provider"] },
  ];

  const results = [];
  const password = "Admin123";

  for (const u of users) {
    // Check if user exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((eu: any) => eu.email === u.email);

    let userId: string;

    if (existing) {
      userId = existing.id;
      results.push({ email: u.email, status: "exists", id: userId });
    } else {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: u.email,
        password,
        email_confirm: true,
        user_metadata: { full_name: u.name },
      });
      if (error) {
        results.push({ email: u.email, status: "error", error: error.message });
        continue;
      }
      userId = data.user.id;
      results.push({ email: u.email, status: "created", id: userId });
    }

    // Update profile name
    await supabaseAdmin.from("profiles").upsert({
      id: userId,
      full_name: u.name,
      full_name_ar: u.name,
    }, { onConflict: "id" });

    // Ensure roles exist (trigger adds 'patient' by default, so we manage extras)
    for (const role of u.roles) {
      // Skip if role is 'patient' and already added by trigger
      const { error: roleErr } = await supabaseAdmin.from("user_roles").upsert(
        { user_id: userId, role },
        { onConflict: "user_id,role" }
      );
      if (roleErr) {
        results.push({ email: u.email, role, roleError: roleErr.message });
      }
    }

    // For non-patient accounts, remove the default 'patient' role if not needed
    if (!u.roles.includes("patient")) {
      await supabaseAdmin.from("user_roles").delete()
        .eq("user_id", userId)
        .eq("role", "patient");
    }
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
