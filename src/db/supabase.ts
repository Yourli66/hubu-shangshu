import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://madbptbrjfkctsjelljr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hZGJwdGJyamZrY3RzamVsbGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MjU3MjAsImV4cCI6MjA5ODUwMTcyMH0.QUn6yfLxHZBTLfpu1f-7lwLH9JbPq6WccQ_mwzK8dFI'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
