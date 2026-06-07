import OpenAI from "openai";
import type { CredibilityAnalysis, ProposalAnalysis } from "./types";

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY no configurada");
  }
  return new OpenAI({ apiKey });
}

const ANALYSIS_SYSTEM = `Eres un analista de credibilidad informativa para ciudadanos colombianos en contexto electoral 2026.
Tu trabajo es ayudar a verificar información, NO dar veredictos absolutos de "mentira".
Responde SIEMPRE en español colombiano, claro y accesible.
Devuelve JSON válido sin markdown.`;

export async function analyzeCredibility(
  transcript: string,
  metadata?: { url?: string; author?: string; title?: string }
): Promise<CredibilityAnalysis> {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: ANALYSIS_SYSTEM },
      {
        role: "user",
        content: `Analiza este contenido y devuelve JSON con esta estructura exacta:
{
  "summary": "resumen 3-5 líneas",
  "credibilityScore": 0-100,
  "scoreExplanation": "por qué esa puntuación",
  "claims": [{"text": "afirmación", "verdict": "verificable|parcial|opinion|sin_evidencia|potencialmente_enganoso", "explanation": "...", "citation": "cita del texto"}],
  "redFlags": ["señales de alerta"],
  "verificationQuestions": ["preguntas para verificar con fuentes oficiales"]
}

Metadata: ${JSON.stringify(metadata)}
Contenido:
${transcript.slice(0, 12000)}`,
      },
    ],
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Sin respuesta de OpenAI");
  return JSON.parse(content) as CredibilityAnalysis;
}

export async function analyzeProposals(
  candidateName: string,
  rawContent: string
): Promise<ProposalAnalysis> {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: ANALYSIS_SYSTEM },
      {
        role: "user",
        content: `Simplifica las propuestas de ${candidateName} para un ciudadano promedio.
Devuelve JSON:
{
  "executiveSummary": "resumen en 2 minutos de lectura",
  "keyProposals": [{"title": "...", "description": "..."}],
  "pointsToVerify": ["puntos a contrastar o posibles exageraciones, tono neutral"],
  "simplifiedExplanation": "explicación general accesible"
}

Contenido (${rawContent.length} chars):
${rawContent.slice(0, 15000)}`,
      },
    ],
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Sin respuesta de OpenAI");
  return JSON.parse(content) as ProposalAnalysis;
}

export function buildChatSystemPrompt(context: {
  type: "transcript" | "proposal";
  content: string;
  analysis?: string;
  metadata?: Record<string, string>;
}) {
  const base = `Eres VerificaCol, asistente cívico que ayuda a entender y verificar información electoral en Colombia.
No afirmes mentiras con certeza absoluta. Sugiere fuentes oficiales (DANE, MinHacienda, Registraduría, etc.).
Responde en español colombiano, claro y breve.`;

  if (context.type === "transcript") {
    return `${base}

CONTEXTO - Contenido analizado:
${context.content.slice(0, 8000)}

${context.analysis ? `ANÁLISIS PREVIO:\n${context.analysis}` : ""}
${context.metadata ? `METADATA: ${JSON.stringify(context.metadata)}` : ""}`;
  }

  return `${base}

CONTEXTO - Propuestas del candidato:
${context.content.slice(0, 8000)}

${context.analysis ? `RESUMEN PREVIO:\n${context.analysis}` : ""}`;
}
