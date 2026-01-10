-- Migración para añadir soporte de checklist a los items
ALTER TABLE items ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::jsonb;

-- Comentario para el manual de base de datos
COMMENT ON COLUMN items.checklist IS 'Almacena un array de objetos {id, text, completed} para la lista de tareas del item.';
