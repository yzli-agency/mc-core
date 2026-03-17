import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { card_id, to_column, moved_by = 'user' } = await req.json()

    if (!card_id || !to_column) {
      return new Response(JSON.stringify({ error: 'card_id and to_column are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get current column
    const { data: card } = await supabase
      .from('kanban_cards')
      .select('column_name')
      .eq('id', card_id)
      .single()

    const from_column = card?.column_name

    // Move the card
    const { error: updateError } = await supabase
      .from('kanban_cards')
      .update({ column_name: to_column, updated_at: new Date().toISOString() })
      .eq('id', card_id)

    if (updateError) throw updateError

    // Record history
    await supabase.from('kanban_history').insert({
      card_id,
      from_column,
      to_column,
      moved_by,
    })

    return new Response(JSON.stringify({ success: true, from_column, to_column }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
