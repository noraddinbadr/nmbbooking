import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody { request_id: string }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { request_id } = (await req.json()) as RequestBody;
    if (!request_id) return new Response(JSON.stringify({ error: 'request_id required' }), { status: 400, headers: corsHeaders });

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: rfq, error: e1 } = await admin
      .from('procurement_requests')
      .select('*, items:procurement_request_items(*)')
      .eq('id', request_id)
      .single();
    if (e1 || !rfq) throw e1 || new Error('not found');

    interface Item { name_ar: string; category_id: string | null; brand_preferred: string | null }
    const items = (rfq.items || []) as Item[];
    const categoryIds = [...new Set(items.map(i => i.category_id).filter(Boolean))] as string[];
    const keywords = items.map(i => i.name_ar?.toLowerCase()).filter(Boolean) as string[];

    // Match providers via catalog: same category OR name/tag overlap
    interface Catalog { provider_id: string; created_by: string; name_ar: string; tags: string[] | null; category_id: string | null }
    const matches = new Map<string, { count: number; details: { name: string; cat: string | null }[] }>();

    if (categoryIds.length) {
      const { data: byCat } = await admin
        .from('provider_catalog_items')
        .select('provider_id, created_by, name_ar, tags, category_id')
        .in('category_id', categoryIds)
        .eq('is_active', true);
      (byCat as Catalog[] | null)?.forEach(c => {
        const key = c.created_by;
        const cur = matches.get(key) || { count: 0, details: [] };
        cur.count += 1;
        cur.details.push({ name: c.name_ar, cat: c.category_id });
        matches.set(key, cur);
      });
    }

    // Keyword fallback (text contains)
    for (const kw of keywords) {
      if (!kw || kw.length < 3) continue;
      const { data: byName } = await admin
        .from('provider_catalog_items')
        .select('created_by, name_ar, category_id')
        .ilike('name_ar', `%${kw}%`)
        .eq('is_active', true)
        .limit(50);
      (byName as Catalog[] | null)?.forEach(c => {
        const cur = matches.get(c.created_by) || { count: 0, details: [] };
        if (!cur.details.some(d => d.name === c.name_ar)) {
          cur.count += 1;
          cur.details.push({ name: c.name_ar, cat: c.category_id });
          matches.set(c.created_by, cur);
        }
      });
    }

    let notified = 0;
    for (const [user_id, info] of matches.entries()) {
      // Insert dedup notification log
      const { error: logErr } = await admin
        .from('procurement_notifications')
        .insert({ request_id, recipient_user_id: user_id, matched_items_count: info.count, match_details: { items: info.details }, channel: 'in_app' });
      if (logErr && !logErr.message.includes('duplicate')) continue;
      // Insert in-app notification
      await admin.from('notifications').insert({
        user_id,
        type: 'procurement_match',
        title_ar: 'طلب شراء جديد يطابق كتالوجك',
        body_ar: `طلب "${rfq.title_ar}" يطابق ${info.count} صنف من خدماتك. قدّم عرضك قبل ${new Date(rfq.closes_at).toLocaleString('ar')}.`,
        entity_type: 'procurement_request',
        entity_id: request_id,
      });
      notified += 1;
    }

    return new Response(JSON.stringify({ success: true, notified }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const e = err as Error;
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});