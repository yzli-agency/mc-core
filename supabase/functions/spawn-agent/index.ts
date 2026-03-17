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
    const { task, model = 'claude-sonnet-4-5', client_slug, project_slug } = await req.json()

    if (!task) {
      return new Response(JSON.stringify({ error: 'task is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Log the spawn request in Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    await supabase.from('agent_logs').insert({
      agent: 'spawn-agent-fn',
      level: 'info',
      message: `Spawning agent for task: ${task.substring(0, 100)}`,
      context: JSON.stringify({ client_slug, project_slug, model }),
    })

    // Call OpenClaw Gateway
    const ocUrl = Deno.env.get('OPENCLAW_URL') || 'http://localhost:18789'
    const ocToken = Deno.env.get('OPENCLAW_TOKEN') || ''

    const result = await fetch(`${ocUrl}/tools/invoke`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ocToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'sessions_spawn',
        args: { task, mode: 'run', runtime: 'subagent', model },
      }),
    }).then((r) => r.json())

    // Record the kanban card if client/project provided
    if (client_slug && project_slug) {
      await supabase.from('kanban_cards').insert({
        title: task.substring(0, 200),
        column_name: 'In Progress',
        priority: 'normal',
        client_slug,
        project_slug,
        assignee: model,
      })
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
