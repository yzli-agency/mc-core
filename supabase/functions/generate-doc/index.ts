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
    const {
      doc_type,
      client_slug,
      project_slug,
      cell_from,
      model = 'claude-sonnet-4-5',
      context = '',
    } = await req.json()

    if (!doc_type || !client_slug) {
      return new Response(JSON.stringify({ error: 'doc_type and client_slug are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Create a placeholder document
    const { data: doc, error } = await supabase
      .from('documents')
      .insert({
        title: `${doc_type.toUpperCase()} — ${client_slug}${project_slug ? '/' + project_slug : ''}`,
        type: doc_type,
        status: 'draft',
        client_slug,
        project_slug,
        cell_from,
        created_by: `agent:${model}`,
        content_preview: context.substring(0, 500),
      })
      .select()
      .single()

    if (error) throw error

    // Spawn agent to generate content via OpenClaw
    const ocUrl = Deno.env.get('OPENCLAW_URL') || 'http://localhost:18789'
    const ocToken = Deno.env.get('OPENCLAW_TOKEN') || ''

    const task = `Generate a ${doc_type} document for client ${client_slug}${project_slug ? `, project ${project_slug}` : ''}. Context: ${context || 'No additional context provided.'} Save the result to Supabase document id=${doc.id}.`

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

    return new Response(JSON.stringify({ doc, spawn: spawnResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
