// ============================================================
// SERVICIO DE IA PARA ANÁLISIS DE ROADMAP
// ============================================================

import type { RoadmapItem, RoadmapAnalysis } from '@/types/roadmapTypes';
import type { StatusCategory } from '@/types';
import type { ChangeHistoryEntry } from '@/types/changeHistory';
import * as Repo from '../repository/estrategiaRepository';
import { supabase } from '../lib/supabaseClient';

// ------------------------------------------------------------
// AI PROXY
// All OpenAI calls go through the `ai-proxy` Supabase Edge Function.
// The OpenAI API key lives only as a function secret (OPENAI_API_KEY)
// and is never read or exposed in the browser.
// ------------------------------------------------------------

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

interface AIProxyRequest {
    messages: ChatMessage[];
    model?: 'gpt-4o' | 'gpt-4o-mini';
    temperature?: number;
    max_tokens?: number;
    response_format?: { type: 'json_object' | 'text' };
}

interface AIProxyResponse {
    choices?: { message?: { content?: string | null } }[];
    error?: { code?: string; message?: string };
}

/**
 * Sends a chat completion request through the ai-proxy Edge Function
 * and returns the assistant message content.
 */
async function callAIProxy(body: AIProxyRequest): Promise<string> {
    const { data, error } = await supabase.functions.invoke<AIProxyResponse>('ai-proxy', { body });

    if (error) {
        let code: string | undefined;
        let message: string = error.message;
        // FunctionsHttpError exposes the raw Response in `context`
        const ctx = (error as any).context;
        if (ctx && typeof ctx.json === 'function') {
            try {
                const payload = await ctx.json();
                code = payload?.error?.code;
                message = payload?.error?.message || message;
            } catch {
                // Ignore body parse errors
            }
        }
        const err: any = new Error(message);
        err.code = code;
        throw err;
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error('No se recibió respuesta de OpenAI');
    }
    return content;
}

export const DEFAULT_AI_PROMPT = `Eres un experto en gestión de proyectos y análisis de roadmaps. Analiza el siguiente proyecto:

PROYECTO: "{{pageTitle}}"

ITEMS DEL ROADMAP ({{itemsCount}} total):
{{itemsJson}}

HISTORIAL DE CAMBIOS RECIENTES (últimos 30):
{{historyJson}}

FECHA ACTUAL: {{currentDate}}

Por favor proporciona un análisis completo en formato JSON con la siguiente estructura:

{
  "summary": "Resumen ejecutivo del estado del proyecto (2-3 párrafos)",
  "timeline": {
    "totalItems": número total de items,
    "itemsWithDates": número de items con fecha asignada,
    "dateRange": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" } o null,
    "overdueTasks": número de tareas vencidas,
    "upcomingTasks": número de tareas próximas (próximos 7 días)
  },
  "criticalPoints": [
    {
      "item": "nombre del item",
      "reason": "razón por la que es crítico",
      "severity": "high" | "medium" | "low",
      "dueDate": "YYYY-MM-DD" (si aplica),
      "recommendation": "recomendación específica"
    }
  ],
  "responsibilities": [
    {
      "person": "nombre de la persona",
      "tasks": [
        {
          "title": "título de la tarea",
          "date": "YYYY-MM-DD" o null,
          "isCritical": true | false,
          "status": "estado de la tarea"
        }
      ],
      "workload": "high" | "medium" | "low",
      "criticalTasks": número de tareas críticas
    }
  ],
  "insights": [
    {
      "type": "risk" | "opportunity" | "suggestion" | "warning",
      "message": "descripción del insight",
      "priority": "high" | "medium" | "low",
      "relatedItems": ["items relacionados"]
    }
  ],
  "milestones": [
    {
      "date": "YYYY-MM-DD",
      "title": "nombre del milestone",
      "description": "resumen breve de lo que trata este hito",
      "items": ["items incluidos"],
      "status": "completed" | "in-progress" | "pending" | "overdue"
    }
  ]
}

INSTRUCCIONES IMPORTANTES:
1. Identifica puntos críticos basándote en:
   - Fechas próximas o vencidas
   - Items en estado "bloqueado" o con problemas
   - Dependencias detectadas en el historial
   
2. Extrae responsables de:
   - Campo "responsable" (ya extraído automáticamente)
   - Menciones con # en descripciones (ej: #Juan tiene MÁXIMA PRIORIDAD)
   - Descripciones que mencionen nombres
   - Patrones como "Responsable:", "Asignado a:", "Encargado:", etc.
   - Usuarios que han modificado items (del historial)
   
3. Genera insights sobre:
   - Riesgos de retraso
   - Oportunidades de optimización
   - Sugerencias de mejora
   - Advertencias sobre carga de trabajo
   - Identificación de actividades predominantes

4. Agrupa items en milestones lógicos por fecha

5. ETIQUETAS DE REFERENCIA (#):
   Las siguientes etiquetas han sido pre-definidas para este proyecto: {{tagsList}}
   - Utiliza estas etiquetas prioritariamente para categorizar items, riesgos o recomendaciones.
   - Si un item en el roadmap ya contiene alguna de estas etiquetas en su descripción, dale importancia en el análisis.
   - Si crees que un insight o punto crítico corresponde a una de estas etiquetas, inclúyela en el mensaje correspondiente.

6. ESTRUCTURA DE TAREAS (MUY IMPORTANTE):
   - El arreglo "tasks" dentro de "responsibilities" debe ser un arreglo de OBJETOS, no de strings.
   - Cada objeto debe tener la estructura: { "title": "...", "date": "...", "isCritical": ..., "status": "..." }.
   - NO devuelvas solo una lista de nombres de tareas como strings.

Responde SOLO con el JSON, sin texto adicional.`;

/**
 * Analiza el roadmap usando IA
 */
export async function analyzeRoadmapWithAI(
    items: RoadmapItem[],
    history: ChangeHistoryEntry[],
    pageTitle: string
): Promise<RoadmapAnalysis> {

    // Obtener etiquetas del proyecto
    const projectTags = await Repo.getProjectTags();
    const tagsList = projectTags.join(', ');

    const now = new Date();

    // Obtener prompt personalizado de la configuración
    const customPromptTemplate = await Repo.getSystemConfig("ai_report_prompt");
    const template = customPromptTemplate || DEFAULT_AI_PROMPT;

    const itemsJson = JSON.stringify(items.map(item => ({
        titulo: item.title,
        fecha: item.date,
        estado: item.status,
        grupo: item.groupName,
        descripcion: item.description,
        responsable: item.responsible
    })), null, 2);

    const historyJson = JSON.stringify(history.slice(0, 30).map(h => ({
        accion: h.action,
        tipo: h.entityType,
        campo: h.fieldName,
        valorAnterior: h.oldValue,
        valorNuevo: h.newValue,
        fecha: new Date(h.changedAt).toLocaleDateString('es-ES'),
        usuario: h.changedByName
    })), null, 2);

    const prompt = template
        .replace(/{{pageTitle}}/g, pageTitle)
        .replace(/{{itemsCount}}/g, items.length.toString())
        .replace(/{{itemsJson}}/g, itemsJson)
        .replace(/{{historyJson}}/g, historyJson)
        .replace(/{{currentDate}}/g, now.toLocaleDateString('es-ES'))
        .replace(/{{tagsList}}/g, tagsList);

    try {
        const content = await callAIProxy({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'Eres un experto en gestión de proyectos. Respondes siempre en español y en formato JSON válido.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 4000
        });

        const analysis: RoadmapAnalysis = JSON.parse(content);
        analysis.generatedAt = Date.now();

        return analysis;
    } catch (error: any) {
        console.error('Error al analizar roadmap con IA:', error);

        if (error.code === 'unauthorized') {
            throw new Error('Sesión no válida. Inicie sesión nuevamente.');
        }

        if (error.code === 'not_configured' || error.code === 'invalid_api_key') {
            throw new Error('El servicio de IA no está configurado correctamente. Contacte al administrador.');
        }

        if (error.code === 'insufficient_quota') {
            throw new Error('Cuota de OpenAI agotada. Verifique su cuenta.');
        }

        throw new Error(`Error al analizar roadmap: ${error.message}`);
    }
}

/**
 * Extrae datos estructurados de una descripción usando IA
 */
export async function extractItemDataFromDescription(
    description: string,
    availableStatuses: StatusCategory[],
    itemTitle?: string
): Promise<{
    title?: string;
    date?: string;
    summary?: string;
    responsible?: string;
    status?: string;
}> {

    const statusesPrompt = availableStatuses.map(s => `- ${s.label} (ID: ${s.status_id})`).join('\n');

    const prompt = `Analiza la siguiente información de una tarea/item de proyecto y extrae información estructurada.
    
${itemTitle ? `TÍTULO ACTUAL: "${itemTitle}"` : ''}
DESCRIPCIÓN:
"${description}"

ESTADOS DISPONIBLES:
${statusesPrompt}

FECHA ACTUAL: ${new Date().toLocaleDateString('es-MX')}

Por favor extrae o genera:
1. "title": Un título extremadamente corto, directo y profesional en MAYÚSCULAS (ej: "LOGIN", "API REFACTOR", "DISEÑO UI"). Evita artículos o palabras innecesarias.
2. "date": Una fecha en formato YYYY-MM-DD si se menciona (interpreta "mañana", "lunes", etc. basado en la fecha actual).
3. "summary": Una versión resumida y limpia de la descripción (conserva etiquetas # si son importantes).
4. "responsible": El nombre de la persona encargada si se menciona (ej: "Juan", "Ing. Pérez"). Solo el nombre o cargo.
5. "status": El ID del estado que mejor encaje.

Responde ÚNICAMENTE con un objeto JSON válido. Si algún campo no se encuentra, devuélvelo como null.

Estructura:
{
  "title": string | null,
  "date": string | null,
  "summary": string | null,
  "responsible": string | null,
  "status": string | null
}`;

    try {
        const content = await callAIProxy({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'Eres un asistente experto en extracción de datos de gestión de proyectos. Respondes siempre en JSON.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            response_format: { type: 'json_object' },
            temperature: 0,
        });

        return JSON.parse(content);
    } catch (error) {
        console.error('Error al extraer datos con IA:', error);
        throw error;
    }
}
