-- Verificar que la tabla se creó correctamente
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'change_history'
ORDER BY ordinal_position;

-- Verificar que los triggers existen
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_name IN ('trigger_column_changes', 'trigger_item_changes');

-- Verificar que las políticas RLS están activas
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'change_history';
