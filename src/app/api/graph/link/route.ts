// src/app/api/graph/link/route.ts
import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient, getAuthUser } from '@/lib/supabase/server';

export async function PATCH(req: Request) {
  try {
    const { linkId, sourceItemId, targetItemId, isDismissed = true } = await req.json();

    const supabase = await createServerClient();
    const user = await getAuthUser(supabase);
    const dbClient = user ? supabase : createAdminClient();

    let query = dbClient.from('item_links').update({ is_dismissed: isDismissed });

    if (linkId) {
      query = query.eq('id', linkId);
    } else if (sourceItemId && targetItemId) {
      const sId = sourceItemId < targetItemId ? sourceItemId : targetItemId;
      const tId = sourceItemId < targetItemId ? targetItemId : sourceItemId;
      query = query.eq('source_item_id', sId).eq('target_item_id', tId);
    } else {
      return NextResponse.json({ error: 'linkId or sourceItemId+targetItemId required' }, { status: 400 });
    }

    const { data, error } = await query.select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, link: data }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating item link:', error);
    return NextResponse.json({ error: error.message || 'Failed to update link' }, { status: 500 });
  }
}
