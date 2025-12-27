-- ============================================================
-- MIGRACIÓN: Recrear tabla change_history con estructura correcta
-- Fecha: 2025-12-21
-- Descripción: Elimina la tabla vieja y crea la nueva estructura
-- ============================================================

-- 1. Eliminar tabla vieja (si existe)
DROP TABLE IF EXISTS change_history CASCADE;

-- 2. CREAR TABLA change_history con estructura correcta
CREATE TABLE change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('column', 'item', 'page')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'moved')),
  field_name TEXT,
  old_value JSONB,
  new_value JSONB,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- 3. CREAR ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_change_history_page_id ON change_history(page_id);
CREATE INDEX idx_change_history_entity ON change_history(entity_type, entity_id);
CREATE INDEX idx_change_history_date ON change_history(changed_at DESC);
CREATE INDEX idx_change_history_user ON change_history(changed_by);

-- 4. FUNCIÓN AUXILIAR: Obtener user_id actual
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id 
    FROM profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FUNCIÓN TRIGGER: Capturar cambios en COLUMNS
CREATE OR REPLACE FUNCTION log_column_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_page_id UUID;
  v_action TEXT;
  v_user_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_page_id := OLD.page_id;
  ELSE
    v_page_id := NEW.page_id;
  END IF;

  v_user_id := get_current_user_id();

  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
    INSERT INTO change_history (
      page_id, entity_type, entity_id, action, 
      new_value, changed_by, metadata
    ) VALUES (
      v_page_id, 'column', NEW.id, v_action,
      jsonb_build_object(
        'title', NEW.title,
        'color', NEW.color,
        'position', NEW.position
      ),
      v_user_id,
      jsonb_build_object('description', NEW.description)
    );

  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.title IS DISTINCT FROM OLD.title THEN
      INSERT INTO change_history (
        page_id, entity_type, entity_id, action, field_name,
        old_value, new_value, changed_by
      ) VALUES (
        v_page_id, 'column', NEW.id, 'updated', 'title',
        to_jsonb(OLD.title), to_jsonb(NEW.title), v_user_id
      );
    END IF;

    IF NEW.color IS DISTINCT FROM OLD.color THEN
      INSERT INTO change_history (
        page_id, entity_type, entity_id, action, field_name,
        old_value, new_value, changed_by
      ) VALUES (
        v_page_id, 'column', NEW.id, 'updated', 'color',
        to_jsonb(OLD.color), to_jsonb(NEW.color), v_user_id
      );
    END IF;

    IF NEW.position IS DISTINCT FROM OLD.position THEN
      INSERT INTO change_history (
        page_id, entity_type, entity_id, action, field_name,
        old_value, new_value, changed_by
      ) VALUES (
        v_page_id, 'column', NEW.id, 'updated', 'position',
        to_jsonb(OLD.position), to_jsonb(NEW.position), v_user_id
      );
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'deleted';
    INSERT INTO change_history (
      page_id, entity_type, entity_id, action,
      old_value, changed_by
    ) VALUES (
      v_page_id, 'column', OLD.id, v_action,
      jsonb_build_object(
        'title', OLD.title,
        'color', OLD.color
      ),
      v_user_id
    );
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNCIÓN TRIGGER: Capturar cambios en ITEMS
CREATE OR REPLACE FUNCTION log_item_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_page_id UUID;
  v_action TEXT;
  v_user_id UUID;
  v_column_title TEXT;
  v_old_column_title TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT page_id, title INTO v_page_id, v_old_column_title
    FROM columns WHERE id = OLD.column_id;
  ELSE
    SELECT page_id, title INTO v_page_id, v_column_title
    FROM columns WHERE id = NEW.column_id;
  END IF;

  v_user_id := get_current_user_id();

  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
    INSERT INTO change_history (
      page_id, entity_type, entity_id, action,
      new_value, changed_by, metadata
    ) VALUES (
      v_page_id, 'item', NEW.id, v_action,
      jsonb_build_object(
        'label', NEW.label,
        'status', NEW.status,
        'column_id', NEW.column_id
      ),
      v_user_id,
      jsonb_build_object(
        'column_title', v_column_title,
        'description', NEW.description,
        'date', NEW.date
      )
    );

  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.column_id IS DISTINCT FROM OLD.column_id THEN
      SELECT title INTO v_old_column_title
      FROM columns WHERE id = OLD.column_id;
      
      INSERT INTO change_history (
        page_id, entity_type, entity_id, action, field_name,
        old_value, new_value, changed_by, metadata
      ) VALUES (
        v_page_id, 'item', NEW.id, 'moved', 'column_id',
        to_jsonb(OLD.column_id), to_jsonb(NEW.column_id), v_user_id,
        jsonb_build_object(
          'from_column', v_old_column_title,
          'to_column', v_column_title,
          'item_label', NEW.label
        )
      );
    END IF;

    IF NEW.label IS DISTINCT FROM OLD.label THEN
      INSERT INTO change_history (
        page_id, entity_type, entity_id, action, field_name,
        old_value, new_value, changed_by
      ) VALUES (
        v_page_id, 'item', NEW.id, 'updated', 'label',
        to_jsonb(OLD.label), to_jsonb(NEW.label), v_user_id
      );
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO change_history (
        page_id, entity_type, entity_id, action, field_name,
        old_value, new_value, changed_by, metadata
      ) VALUES (
        v_page_id, 'item', NEW.id, 'updated', 'status',
        to_jsonb(OLD.status), to_jsonb(NEW.status), v_user_id,
        jsonb_build_object('item_label', NEW.label)
      );
    END IF;

    IF NEW.description IS DISTINCT FROM OLD.description THEN
      INSERT INTO change_history (
        page_id, entity_type, entity_id, action, field_name,
        old_value, new_value, changed_by
      ) VALUES (
        v_page_id, 'item', NEW.id, 'updated', 'description',
        to_jsonb(OLD.description), to_jsonb(NEW.description), v_user_id
      );
    END IF;

    IF NEW.date IS DISTINCT FROM OLD.date THEN
      INSERT INTO change_history (
        page_id, entity_type, entity_id, action, field_name,
        old_value, new_value, changed_by
      ) VALUES (
        v_page_id, 'item', NEW.id, 'updated', 'date',
        to_jsonb(OLD.date), to_jsonb(NEW.date), v_user_id
      );
    END IF;

    IF NEW.position IS DISTINCT FROM OLD.position THEN
      INSERT INTO change_history (
        page_id, entity_type, entity_id, action, field_name,
        old_value, new_value, changed_by
      ) VALUES (
        v_page_id, 'item', NEW.id, 'updated', 'position',
        to_jsonb(OLD.position), to_jsonb(NEW.position), v_user_id
      );
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'deleted';
    INSERT INTO change_history (
      page_id, entity_type, entity_id, action,
      old_value, changed_by, metadata
    ) VALUES (
      v_page_id, 'item', OLD.id, v_action,
      jsonb_build_object(
        'label', OLD.label,
        'status', OLD.status
      ),
      v_user_id,
      jsonb_build_object('column_title', v_old_column_title)
    );
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. CREAR TRIGGERS
DROP TRIGGER IF EXISTS trigger_column_changes ON columns;
CREATE TRIGGER trigger_column_changes
  AFTER INSERT OR UPDATE OR DELETE ON columns
  FOR EACH ROW
  EXECUTE FUNCTION log_column_changes();

DROP TRIGGER IF EXISTS trigger_item_changes ON items;
CREATE TRIGGER trigger_item_changes
  AFTER INSERT OR UPDATE OR DELETE ON items
  FOR EACH ROW
  EXECUTE FUNCTION log_item_changes();

-- 8. POLÍTICAS RLS
ALTER TABLE change_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY change_history_select ON change_history
  FOR SELECT
  USING (
    page_id IN (
      SELECT pages.id
      FROM pages
      WHERE pages.company_id IN (
        SELECT company_users.company_id
        FROM company_users
        WHERE company_users.user_id = get_my_profile_id()
      )
    )
  );

CREATE POLICY change_history_superadmin_all ON change_history
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.user_id = auth.uid() AND p.is_admin = true
    )
  );

-- 9. COMENTARIOS
COMMENT ON TABLE change_history IS 'Registro de auditoría de todos los cambios en columns e items';
COMMENT ON COLUMN change_history.entity_type IS 'Tipo de entidad: column, item, o page';
COMMENT ON COLUMN change_history.action IS 'Acción realizada: created, updated, deleted, o moved';
COMMENT ON COLUMN change_history.field_name IS 'Campo específico que cambió (para updates)';
COMMENT ON COLUMN change_history.old_value IS 'Valor anterior del campo';
COMMENT ON COLUMN change_history.new_value IS 'Valor nuevo del campo';
COMMENT ON COLUMN change_history.metadata IS 'Información adicional contextual';
