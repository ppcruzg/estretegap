-- ============================================================
-- MIGRACIÓN: Corregir disparadores de auditoría para permitir borrado de páginas
-- Fecha: 2025-12-27
-- Descripción: Evita errores de llave foránea (23503) al borrar páginas
-- ============================================================

-- 1. CORREGIR FUNCIÓN TRIGGER: Capturar cambios en COLUMNS
CREATE OR REPLACE FUNCTION log_column_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_page_id UUID;
  v_action TEXT;
  v_user_id UUID;
  v_page_exists BOOLEAN;
BEGIN
  -- Obtener page_id
  IF TG_OP = 'DELETE' THEN
    v_page_id := OLD.page_id;
  ELSE
    v_page_id := NEW.page_id;
  END IF;

  -- VERIFICAR SI LA PÁGINA EXISTE (Crucial para evitar error 23503 en Delete Cascade)
  SELECT EXISTS(SELECT 1 FROM pages WHERE id = v_page_id) INTO v_page_exists;
  
  -- Si la página no existe (está siendo borrada), salimos sin registrar nada
  IF NOT v_page_exists THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  -- Obtener usuario actual
  v_user_id := get_current_user_id();

  -- Determinar acción
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
    -- Solo registrar si hubo cambios significativos
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

-- 2. CORREGIR FUNCIÓN TRIGGER: Capturar cambios en ITEMS
CREATE OR REPLACE FUNCTION log_item_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_page_id UUID;
  v_action TEXT;
  v_user_id UUID;
  v_column_title TEXT;
  v_old_column_title TEXT;
  v_page_exists BOOLEAN;
BEGIN
  -- Obtener page_id a través de la columna
  IF TG_OP = 'DELETE' THEN
    SELECT page_id, title INTO v_page_id, v_old_column_title
    FROM columns WHERE id = OLD.column_id;
  ELSE
    SELECT page_id, title INTO v_page_id, v_column_title
    FROM columns WHERE id = NEW.column_id;
  END IF;

  -- Si no pudimos obtener v_page_id (porque la columna ya no existe), salimos
  IF v_page_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  -- VERIFICAR SI LA PÁGINA EXISTE
  SELECT EXISTS(SELECT 1 FROM pages WHERE id = v_page_id) INTO v_page_exists;
  
  IF NOT v_page_exists THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  -- Obtener usuario actual
  v_user_id := get_current_user_id();

  -- Determinar acción
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
    -- Detectar movimiento entre columnas
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

    -- Cambio de título/label
    IF NEW.label IS DISTINCT FROM OLD.label THEN
      INSERT INTO change_history (
        page_id, entity_type, entity_id, action, field_name,
        old_value, new_value, changed_by
      ) VALUES (
        v_page_id, 'item', NEW.id, 'updated', 'label',
        to_jsonb(OLD.label), to_jsonb(NEW.label), v_user_id
      );
    END IF;

    -- Cambio de estado
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

    -- Cambio de descripción
    IF NEW.description IS DISTINCT FROM OLD.description THEN
      INSERT INTO change_history (
        page_id, entity_type, entity_id, action, field_name,
        old_value, new_value, changed_by
      ) VALUES (
        v_page_id, 'item', NEW.id, 'updated', 'description',
        to_jsonb(OLD.description), to_jsonb(NEW.description), v_user_id
      );
    END IF;

    -- Cambio de fecha
    IF NEW.date IS DISTINCT FROM OLD.date THEN
      INSERT INTO change_history (
        page_id, entity_type, entity_id, action, field_name,
        old_value, new_value, changed_by
      ) VALUES (
        v_page_id, 'item', NEW.id, 'updated', 'date',
        to_jsonb(OLD.date), to_jsonb(NEW.date), v_user_id
      );
    END IF;

    -- Cambio de posición (reordenamiento)
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

-- 3. ASEGURAR QUE ON DELETE CASCADE ESTÉ PRESENTE EN TABLAS DEPENDIENTES
-- (Opcional pero recomendado para robustez)

-- change_history ya lo tiene, pero lo reforzamos si hace falta
-- ALTER TABLE change_history DROP CONSTRAINT IF EXISTS change_history_page_id_fkey;
-- ALTER TABLE change_history ADD CONSTRAINT change_history_page_id_fkey FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

-- Comentarios
COMMENT ON FUNCTION log_column_changes() IS 'Registra cambios en columnas, saltando si la página padre ya no existe';
COMMENT ON FUNCTION log_item_changes() IS 'Registra cambios en items, saltando si la página padre ya no existe';
