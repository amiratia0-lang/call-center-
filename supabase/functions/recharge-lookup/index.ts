import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

interface LookupRequest {
  phone_number: string;
  provider_code?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { phone_number, provider_code } = (await req.json()) as LookupRequest;

    if (!phone_number) {
      return new Response(
        JSON.stringify({ error: "رقم الهاتف مطلوب", success: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Look up the phone number in our database
    let query = supabase
      .from("phone_numbers")
      .select("*, provider:providers(*)")
      .eq("number", phone_number);

    if (provider_code) {
      query = query.eq("provider:providers.code", provider_code);
    }

    const { data: phone, error } = await query.maybeSingle();

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message, success: false }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!phone) {
      // Try to look up via external provider API (simulated)
      // In production, this would call the actual provider API
      const { data: providers } = await supabase
        .from("providers")
        .select("*")
        .eq("status", "active");

      // Simulate external lookup - in production replace with real API call
      const simulatedBalance = Math.floor(Math.random() * 500);

      return new Response(
        JSON.stringify({
          success: true,
          found: false,
          phone_number,
          message: "الرقم غير موجود في قاعدة البيانات المحلية",
          external_lookup: {
            available: true,
            simulated_balance: simulatedBalance,
            providers: providers?.map((p) => p.name) || [],
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Get recent recharges for this number
    const { data: recentRecharges } = await supabase
      .from("recharges")
      .select("*")
      .eq("phone_number", phone_number)
      .order("created_at", { ascending: false })
      .limit(5);

    return new Response(
      JSON.stringify({
        success: true,
        found: true,
        phone_number,
        data: {
          number: phone.number,
          country: phone.country,
          balance: phone.balance,
          status: phone.status,
          owner_name: phone.owner_name,
          owner_phone: phone.owner_phone,
          provider: phone.provider?.name,
          provider_code: phone.provider?.code,
          notes: phone.notes,
        },
        recent_recharges: recentRecharges || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message, success: false }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  }
);
