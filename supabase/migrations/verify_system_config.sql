-- Verificar si la tabla system_config existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'system_config'
) AS table_exists;

-- Si no existe, ejecuta el archivo:
-- supabase/migrations/20251221_create_system_config.sql
