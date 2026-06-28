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

interface IVRRequest {
  caller_phone: string;
  dialed_number?: string;
  menu_choice?: string;
  input_number?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { caller_phone, dialed_number, menu_choice, input_number } =
      (await req.json()) as IVRRequest;

    // Fetch active IVR menu
    const { data: menuItems } = await supabase
      .from("ivr_menu")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    let result = "";
    let status: "completed" | "failed" = "completed";

    if (!menu_choice) {
      // Initial call - return main menu greeting
      const mainMenu = menuItems?.find((m) => m.key === "0");
      result = mainMenu?.voice_message || "مرحباً بك في خدمة الشحن";
    } else {
      const menuItem = menuItems?.find((m) => m.key === menu_choice);
      if (!menuItem) {
        result = "اختيار غير صحيح، يرجى المحاولة مرة أخرى";
        status = "failed";
      } else {
        switch (menuItem.action) {
          case "recharge": {
            // Customer entered a phone number to recharge
            if (input_number) {
              // Look up the phone number
              const { data: phone } = await supabase
                .from("phone_numbers")
                .select("*, provider:providers(*)")
                .eq("number", input_number)
                .maybeSingle();

              if (!phone) {
                result = `الرقم ${input_number} غير موجود في قاعدة البيانات`;
                status = "failed";
              } else if (phone.status === "suspended") {
                result = `الرقم ${input_number} موقوف مؤقتاً، يرجى التواصل مع الدعم`;
                status = "failed";
              } else if (phone.status === "expired") {
                result = `الرقم ${input_number} منتهي الصلاحية`;
                status = "failed";
              } else {
                result = `الرقم ${input_number} - الرصيد الحالي: ${phone.balance} جنيه. المزود: ${phone.provider?.name || "غير محدد"}`;
              }
            } else {
              result = menuItem.voice_message;
            }
            break;
          }
          case "balance": {
            if (input_number) {
              const { data: phone } = await supabase
                .from("phone_numbers")
                .select("balance, status, provider:providers(name)")
                .eq("number", input_number)
                .maybeSingle();

              if (!phone) {
                result = `الرقم ${input_number} غير موجود`;
                status = "failed";
              } else {
                result = `رصيدك الحالي: ${phone.balance} جنيه. حالة الرقم: ${phone.status}`;
              }
            } else {
              result = menuItem.voice_message;
            }
            break;
          }
          case "support":
            result = menuItem.voice_message;
            break;
          case "repeat": {
            const target = menuItems?.find((m) => m.key === menuItem.target_key);
            result = target?.voice_message || "إعادة تشغيل القائمة";
            break;
          }
          default:
            result = menuItem.voice_message;
        }
      }
    }

    // Log the IVR call
    await supabase.from("ivr_calls").insert({
      caller_phone,
      dialed_number: dialed_number || null,
      menu_choice: menu_choice || null,
      input_number: input_number || null,
      result,
      duration: 0,
      status,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: result,
        status,
        menu: menuItems?.map((m) => ({
          key: m.key,
          label: m.label,
          action: m.action,
        })) || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message, success: false }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
