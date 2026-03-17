/**
 * apply-migrations.mjs
 * Applies the SQL migrations to Supabase via the database.query endpoint.
 * 
 * Usage: SUPABASE_PAT=sbp_xxx node apply-migrations.mjs
 * 
 * The PAT can be created at: https://app.supabase.com/account/tokens
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const PROJECT_ID = 'cigytskhlcxwcbddokdg'
const PAT = process.env.SUPABASE_PAT

if (!PAT) {
  console.error('❌ SUPABASE_PAT env var required')
  console.error('   Get yours at: https://app.supabase.com/account/tokens')
  console.error('   Then run: SUPABASE_PAT=sbp_xxx node supabase/apply-migrations.mjs')
  process.exit(1)
}

const migrations = [
  '20240101000001_core_tables.sql',
  '20240101000002_kanban.sql',
  '20240101000003_agents.sql',
  '20240101000004_pipeline.sql',
  '20240101000005_comms.sql',
  '20240101000006_veille.sql',
  '20240101000007_registry.sql',
]

async function applyMigration(filename) {
  const sql = readFileSync(join(__dirname, 'migrations', filename), 'utf8')
  
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_ID}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PAT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })

  const body = await res.json()

  if (!res.ok) {
    throw new Error(`Migration ${filename} failed: ${JSON.stringify(body)}`)
  }

  return body
}

console.log(`🚀 Applying ${migrations.length} migrations to project ${PROJECT_ID}...\n`)

for (const migration of migrations) {
  process.stdout.write(`  ⏳ ${migration}... `)
  try {
    await applyMigration(migration)
    console.log('✅')
  } catch (err) {
    console.log('❌')
    console.error(`     ${err.message}`)
    // Continue with other migrations (tables may already exist)
  }
}

console.log('\n✨ Done! Check your Supabase dashboard: https://app.supabase.com/project/cigytskhlcxwcbddokdg/editor')
