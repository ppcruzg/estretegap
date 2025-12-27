-- Verificar la estructura de la tabla change_history
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'change_history'
ORDER BY ordinal_position;
