-- ============================================================
-- MIGRACIÓN: Tabla de configuraciones del sistema
-- Descripción: Almacena configuraciones como API keys de forma segura
-- ============================================================

-- Crear tabla de configuraciones
CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT,
  encrypted BOOLEAN DEFAULT false,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key);

-- Habilitar RLS
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Solo superadmins pueden ver y modificar configuraciones
CREATE POLICY system_config_superadmin_all ON system_config
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.user_id = auth.uid() AND p.is_admin = true
    )
  );

-- Insertar configuración por defecto para OpenAI
INSERT INTO system_config (config_key, config_value, description, encrypted)
VALUES 
  ('openai_api_key', '', 'API Key de OpenAI para análisis de roadmap', true),
  ('openai_model', 'gpt-4o', 'Modelo de OpenAI a utilizar', false),
  ('roadmap_cache_ttl', '3600', 'Tiempo de vida del caché en segundos', false)
ON CONFLICT (config_key) DO NOTHING;

-- Comentarios
COMMENT ON TABLE system_config IS 'Configuraciones del sistema incluyendo API keys';
COMMENT ON COLUMN system_config.encrypted IS 'Indica si el valor está encriptado (para API keys)';
