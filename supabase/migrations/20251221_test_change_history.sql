-- ============================================================
-- SCRIPT DE PRUEBA: Verificar Sistema de Historial de Cambios
-- ============================================================
-- Este script prueba que los triggers funcionen correctamente
-- Ejecutar DESPUÉS de aplicar la migración principal
-- ============================================================

-- 1. Verificar que la tabla existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'change_history'
) AS table_exists;

-- 2. Verificar que los triggers existen
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name IN ('trigger_column_changes', 'trigger_item_changes');

-- 3. Verificar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'change_history';

-- 4. Verificar políticas RLS
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'change_history';

-- ============================================================
-- PRUEBA FUNCIONAL (Opcional - solo si quieres probar manualmente)
-- ============================================================

-- Nota: Estas pruebas son opcionales. Los triggers se activarán
-- automáticamente cuando uses la aplicación normalmente.

-- Ejemplo: Crear una columna de prueba y verificar que se registre
-- INSERT INTO columns (page_id, title, color, position)
-- VALUES ('tu-page-id-aqui', 'Test Column', 'blue', 999);

-- Ver el historial generado
-- SELECT * FROM change_history ORDER BY changed_at DESC LIMIT 10;

-- Limpiar prueba
-- DELETE FROM columns WHERE title = 'Test Column';
