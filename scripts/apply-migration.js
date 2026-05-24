#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://tepfloisnlddowhmlfld.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlcGZsb2lzbmxkZG93aG1sZmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjYyNTEsImV4cCI6MjA4OTM0MjI1MX0.Dy3cT3kUbei4nwtrpIMWkIQumt4c9ZgaBWHjK52FvuE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function applyMigration() {
  const migrationPath = path.join(__dirname, '../supabase/migrations/20240328100000_create_tables.sql')
  
  console.log('Leyendo migración...')
  const sql = fs.readFileSync(migrationPath, 'utf-8')
  
  console.log('Ejecutando migración en Supabase...')
  
  const { data, error } = await supabase.rpc('exec_sql', { sql })
  
  if (error) {
    console.error('Error:', error.message)
    console.log('\n--- INSTRUCCIONES ---')
    console.log('1. Ve a: https://supabase.com/dashboard/project/tepfloisnlddowhmlfld/sql')
    console.log('2. Copia el contenido del archivo: supabase/migrations/20240328100000_create_tables.sql')
    console.log('3. Pega en el SQL Editor y ejecuta\n')
    process.exit(1)
  }
  
  console.log('¡Migración aplicada exitosamente!')
}

applyMigration()
