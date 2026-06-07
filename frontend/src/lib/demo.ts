import type { CredibilityAnalysis, TranscriptResult } from "./types";

export const DEMO_TRANSCRIPT: TranscriptResult = {
  url: "https://www.instagram.com/reel/DY7KQ0gRUOh/",
  title: "Balance económico del gobierno Petro",
  author: "Juan Daniel Oviedo",
  description:
    "Colombia no puede acostumbrarse a crecer a medias. Porque mientras se destruyen sectores productivos y se frena la inversión, la gente siente que sí hay plata circulando... pero nadie pregunta de dónde viene.",
  duration: 63,
  transcript: `De lo pésimo, el gobierno Petro fue haber inflado absurdamente la contratación de prestaciones de servicios como mecanismo para mover el empleo y el crecimiento de la economía, porque yo no sé si ustedes se han dado cuenta, pero el balance económico de este gobierno es que en promedio Colombia creció al 1.6% anual en el gobierno Petro, mientras que Colombia estaba acostumbrada a crecer al 3%, es decir, crecimos a la mitad. Pero saben ¿a punta de qué? A punta de adicción al gasto y a punta de burocracia pública. Destrucción del sector construcción, destrucción del sector infraestructura, destrucción del sector tecnológico, ¡por Dios! Claro que hay plata, y eso es el gran problema y la gran encrucijada que tenemos en este momento: que la gente no se queja porque sí hay plata circulando en la economía, pero es plata que se lavó a través del contrabando y de economías ilícitas. Y como se dice en Colombia: cuando hay plata, nadie pregunta de dónde viene.`,
};

export const DEMO_ANALYSIS: CredibilityAnalysis = {
  summary:
    "Juan Daniel Oviedo critica el crecimiento económico del gobierno Petro (1.6% vs histórico ~3%), atribuyéndolo a gasto público, OPS y economías ilícitas. Mezcla datos verificables con afirmaciones que requieren contexto y fuentes.",
  credibilityScore: 52,
  scoreExplanation:
    "Contiene cifras económicas contrastables con el DANE, pero también generalizaciones fuertes sobre lavado de activos y destrucción sectorial sin evidencia citada en el video.",
  claims: [
    {
      text: "Colombia creció al 1.6% anual en promedio en el gobierno Petro",
      verdict: "verificable",
      explanation: "Dato contrastable con series del DANE/Banco de la República.",
      citation: "Colombia creció al 1.6% anual en el gobierno Petro",
    },
    {
      text: "Colombia estaba acostumbrada a crecer al 3%",
      verdict: "parcial",
      explanation: "Depende del periodo de comparación; no todos los años pre-Petro fueron 3%.",
      citation: "acostumbrada a crecer al 3%",
    },
    {
      text: "La plata circulando se lavó a través del contrabando y economías ilícitas",
      verdict: "sin_evidencia",
      explanation: "Afirmación fuerte sin datos ni fuentes en el discurso.",
      citation: "plata que se lavó a través del contrabando",
    },
    {
      text: "Destrucción del sector construcción, infraestructura y tecnológico",
      verdict: "parcial",
      explanation: "Requiere contrastar con indicadores sectoriales oficiales.",
      citation: "Destrucción del sector construcción",
    },
  ],
  redFlags: [
    "Generalización sobre lavado de activos sin evidencia presentada",
    "Lenguaje emocional ('¡por Dios!') mezclado con datos",
    "Comparación histórica simplificada (3% vs 1.6%)",
    "Atribución causal única (OPS + burocracia) sin matices",
  ],
  verificationQuestions: [
    "¿Cuál es el PIB real según el DANE para 2022-2025?",
    "¿Cómo ha evolucionado el empleo en OPS vs sector privado?",
    "¿Qué indicadores oficiales existen sobre lavado de activos?",
    "¿Cuál fue el crecimiento sectorial en construcción e infraestructura?",
  ],
};
