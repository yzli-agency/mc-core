import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * run-dream: Run a full pipeline dream sequence for a project.
 * Spawns a Dream Agent that orchestrates all pipeline cells for a given client/project.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      client_slug,
      project_slug,
      dream_prompt,
      model = 'claude-opus-4-5',
    } = await req.json()

    if (!client_slug || !dream_prompt) {
      return new Response(JSON.stringify({ error: 'client_slug and dream_prompt are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Log the dream initiation
    await supabase.from('agent_logs').insert({
      agent: 'dream-orchestrator',
      level: 'info',
      message: `🌙 Dream sequence initiated for ${client_slug}${project_slug ? '/' + project_slug : ''}`,
      context: JSON.stringify({ dream_prompt: dream_prompt.substring(0, 200) }),
    })

    // Create a kanban card to track the dream
    const { data: card } = await supabase
      .from('kanban_cards')
      .insert({
        title: `🌙 Dream: ${dream_prompt.substring(0, 100)}`,
        description: dream_prompt,
        column_name: 'In Progress',
        priority: 'high',
        client_slug,
        project_slug,
        assignee: model,
        workflow: 'dream',
      })
      .select()
      .single()

    // Spawn the dream agent via OpenClaw Gateway
    const ocUrl = Deno.env.get('OPENCLAW_URL') || 'http://localhost:18789'
    const ocToken = Deno.env.get('OPENCLAW_TOKEN') || ''

    const task = `
You are the Dream Orchestrator for Mission Control.
Client: ${client_slug}${project_slug ? ` | Project: ${project_slug}` : ''}
Dream prompt: ${dream_prompt}

Your mission:
1. Analyze the dream prompt and break it into pipeline stages
2. For each stage, identify the responsible cell and agent roles
3. Create documents in Supabase for each required deliverable
4. Spawn specialist sub-agents for each cell (if needed)
5. Move kanban card id=${card?.id} through the pipeline as stages complete
6. Log progress to agent_logs after each stage

Use the Supabase client and OpenClaw tools available to you.
    `.trim()

    const spawnResult = await fetch(`${ocUrl}/tools/invoke`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ocToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'sessions_spawn',
        args: { task, mode: 'run', runtime: 'subagent', model },
      }),
    }).then((r) => r.json()).catch(() => null)

    return new Response(
      JSON.stringify({ success: true, card_id: card?.id, spawn: spawnResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
