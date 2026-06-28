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
  company_id?: string;
  caller_phone: string;
  action: "start" | "intent" | "tracking" | "order_list" | "order_add" | "order_confirm" | "complaint" | "info";
  input?: string;
  items?: { name: string; qty: number }[];
  address?: string;
  complaint_subject?: string;
  complaint_description?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as IVRRequest;
    const { company_id, caller_phone, action, input, items, address, complaint_subject, complaint_description } = body;

    if (!caller_phone) {
      return new Response(
        JSON.stringify({ success: false, error: "caller_phone is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Resolve company
    let company;
    if (company_id) {
      const { data } = await supabase.from("companies").select("*").eq("id", company_id).maybeSingle();
      company = data;
    } else {
      // Fallback: first active company
      const { data } = await supabase.from("companies").select("*").eq("status", "active").order("created_at").limit(1).maybeSingle();
      company = data;
    }

    if (!company) {
      return new Response(
        JSON.stringify({ success: false, error: "No active company found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Upsert caller (security anchor: every interaction tied to phone)
    let caller;
    const { data: existingCaller } = await supabase
      .from("callers")
      .select("*")
      .eq("company_id", company.id)
      .eq("phone", caller_phone)
      .maybeSingle();

    if (existingCaller) {
      caller = existingCaller;
    } else {
      const { data: newCaller } = await supabase
        .from("callers")
        .insert({ company_id: company.id, phone: caller_phone })
        .select("*")
        .maybeSingle();
      caller = newCaller;
    }

    // Create or fetch ongoing call
    let call;
    const { data: ongoingCall } = await supabase
      .from("calls")
      .select("*")
      .eq("company_id", company.id)
      .eq("caller_phone", caller_phone)
      .eq("status", "ongoing")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (ongoingCall) {
      call = ongoingCall;
    } else {
      const { data: newCall } = await supabase
        .from("calls")
        .insert({
          company_id: company.id,
          caller_id: caller?.id || null,
          caller_phone,
          intent: "unknown",
          status: "ongoing",
        })
        .select("*")
        .maybeSingle();
      call = newCall;
    }

    let responseText = "";
    let intent = call?.intent || "unknown";
    let orderItems: { name: string; price: number; qty: number }[] = [];

    switch (action) {
      case "start": {
        responseText = company.greeting;
        break;
      }

      case "intent": {
        const userIntent = (input || "").toLowerCase();
        if (userIntent.includes("تتبع") || userIntent.includes("شحن") || userIntent.includes("tracking")) {
          intent = "tracking";
          responseText = "من فضلك أدخل رقم الشحنة لتتبعها.";
        } else if (userIntent.includes("طلب") || userIntent.includes("شاورما") || userIntent.includes("أكل") || userIntent.includes("order")) {
          intent = "order";
          responseText = "إليك المنيو. اختر ما تريد وحدد الكمية.";
          // Fetch menu
          const { data: menu } = await supabase
            .from("menu_items")
            .select("*")
            .eq("company_id", company.id)
            .eq("is_available", true)
            .order("sort_order");
          if (menu && menu.length > 0) {
            const menuList = menu.map((m) => `${m.name} - ${m.price} جنيه`).join("، ");
            responseText = `إليك المنيو: ${menuList}. ماذا تريد أن تطلب؟`;
          }
        } else if (userIntent.includes("شكوى") || userIntent.includes("مشكلة") || userIntent.includes("complaint")) {
          intent = "complaint";
          responseText = "سجل شكواك الآن. ابدأ بعنوان الشكوى ثم وصفها.";
        } else if (userIntent.includes("استفسار") || userIntent.includes("سؤال") || userIntent.includes("info")) {
          intent = "info";
          responseText = "كيف يمكنني مساعدتك؟ اطرح سؤالك.";
        } else {
          intent = "unknown";
          responseText = "لم أفهم طلبك. هل تريد: تتبع شحنة، طلب طعام، تسجيل شكوى، أم استفسار؟";
        }
        // Update call intent
        await supabase.from("calls").update({ intent }).eq("id", call.id);
        break;
      }

      case "tracking": {
        const trackingNumber = (input || "").trim().toUpperCase();
        if (!trackingNumber) {
          responseText = "من فضلك أدخل رقم الشحنة.";
          break;
        }
        // Security: shipment must match caller's phone
        const { data: shipment } = await supabase
          .from("shipments")
          .select("*")
          .eq("company_id", company.id)
          .eq("tracking_number", trackingNumber)
          .eq("caller_phone", caller_phone)
          .maybeSingle();

        if (!shipment) {
          responseText = `لم يتم العثور على شحنة برقم ${trackingNumber} مرتبطة برقم هاتفك. للأمان، يجب أن يكون رقم الهاتف مطابقاً.`;
        } else {
          const statusMap: Record<string, string> = {
            pending: "قيد الانتظار",
            in_transit: "في الطريق",
            out_for_delivery: "خارج للتوصيل",
            delivered: "تم التوصيل",
            returned: "تم الإرجاع",
          };
          responseText = `الشحنة ${shipment.tracking_number}: الحالة ${statusMap[shipment.status] || shipment.status}. من ${shipment.origin || "غير محدد"} إلى ${shipment.destination || "غير محدد"}.`;
          if (shipment.estimated_delivery) {
            responseText += ` موعد التسليم المتوقع: ${shipment.estimated_delivery}.`;
          }
        }
        break;
      }

      case "order_list": {
        const { data: menu } = await supabase
          .from("menu_items")
          .select("*")
          .eq("company_id", company.id)
          .eq("is_available", true)
          .order("sort_order");
        if (!menu || menu.length === 0) {
          responseText = "لا يوجد منيو متاح حالياً.";
        } else {
          const menuList = menu.map((m) => `${m.name} - ${m.price} جنيه`).join("، ");
          responseText = `المنيو: ${menuList}.`;
        }
        break;
      }

      case "order_add": {
        // items: [{ name, qty }] — look up prices and calculate
        if (!items || items.length === 0) {
          responseText = "لم تختر أي شيء. ماذا تريد أن تطلب؟";
          break;
        }
        const { data: menu } = await supabase
          .from("menu_items")
          .select("*")
          .eq("company_id", company.id)
          .eq("is_available", true);

        orderItems = [];
        for (const req of items) {
          const menuItem = menu?.find((m) => m.name === req.name || m.name.includes(req.name));
          if (menuItem) {
            orderItems.push({ name: menuItem.name, price: Number(menuItem.price), qty: req.qty || 1 });
          }
        }

        if (orderItems.length === 0) {
          responseText = "لم أجد هذه الأصناف في المنيو. حاول مرة أخرى.";
          break;
        }

        const total = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);
        const summary = orderItems.map((i) => `${i.qty}× ${i.name} (${i.price} جنيه)`).join("، ");
        responseText = `طلبك: ${summary}. الإجمالي: ${total} جنيه. هل تريد إضافة طلب آخر؟ (نعم/لا)`;
        break;
      }

      case "order_confirm": {
        // Re-parse items from the request (frontend sends accumulated items)
        if (!items || items.length === 0) {
          responseText = "لا يوجد طلب للتأكيد.";
          break;
        }
        const { data: menu } = await supabase
          .from("menu_items")
          .select("*")
          .eq("company_id", company.id)
          .eq("is_available", true);

        orderItems = [];
        for (const req of items) {
          const menuItem = menu?.find((m) => m.name === req.name || m.name.includes(req.name));
          if (menuItem) {
            orderItems.push({ name: menuItem.name, price: Number(menuItem.price), qty: req.qty || 1 });
          }
        }

        const total = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);

        // Save address on caller
        if (address && caller) {
          await supabase.from("callers").update({ address }).eq("id", caller.id);
        }

        // Insert order
        const { data: order } = await supabase
          .from("orders")
          .insert({
            company_id: company.id,
            caller_id: caller?.id || null,
            caller_phone,
            items: orderItems,
            total,
            address: address || caller?.address || null,
            status: "new",
            call_id: call.id,
          })
          .select("*")
          .maybeSingle();

        responseText = `تم تأكيد طلبك بنجاح! الإجمالي: ${total} جنيه. سيتم التوصيل إلى: ${address || caller?.address || "العنوان المسجل"}. شكراً لك!`;
        break;
      }

      case "complaint": {
        if (!complaint_subject) {
          responseText = "من فضلك ابدأ بعنوان الشكوى.";
          break;
        }
        const { data: complaint } = await supabase
          .from("complaints")
          .insert({
            company_id: company.id,
            caller_id: caller?.id || null,
            caller_phone,
            subject: complaint_subject,
            description: complaint_description || "",
            status: "open",
            call_id: call.id,
          })
          .select("*")
          .maybeSingle();

        responseText = "تم تسجيل شكواك بنجاح. سيقوم أحد ممثلي خدمة العملاء بالرد عليك قريباً. شكراً لتواصلك.";
        break;
      }

      case "info": {
        responseText = "للاستفسارات، يمكنك سؤالي عن أي شيء متعلق بخدماتنا. كيف أساعدك؟";
        break;
      }

      default:
        responseText = "خيار غير صحيح. حاول مرة أخرى.";
    }

    // Append to transcript
    const transcript = (call?.transcript || "") + `\n[${action}] ${responseText}`;
    await supabase.from("calls").update({ transcript }).eq("id", call.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: responseText,
        intent,
        call_id: call.id,
        caller_id: caller?.id || null,
        company: { id: company.id, name: company.name, industry: company.industry },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message, success: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
