export type ClaimVerdict =
  | "verificable"
  | "parcial"
  | "opinion"
  | "sin_evidencia"
  | "potencialmente_enganoso";

export interface Claim {
  text: string;
  verdict: ClaimVerdict;
  explanation: string;
  citation?: string;
}

export interface CredibilityAnalysis {
  summary: string;
  credibilityScore: number;
  scoreExplanation: string;
  claims: Claim[];
  redFlags: string[];
  verificationQuestions: string[];
}

export interface TranscriptResult {
  url: string;
  title?: string;
  author?: string;
  description?: string;
  duration?: number;
  transcript: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CandidateSummary {
  id: string;
  name: string;
  party: string;
  programTitle: string;
}

export interface ProposalAnalysis {
  executiveSummary: string;
  keyProposals: { title: string; description: string }[];
  pointsToVerify: string[];
  simplifiedExplanation: string;
}

export interface CandidateData extends CandidateSummary {
  sources: string[];
  rawContent: string;
  analysis?: ProposalAnalysis;
}

export const VERDICT_LABELS: Record<ClaimVerdict, string> = {
  verificable: "Verificable",
  parcial: "Parcialmente verificable",
  opinion: "Opinión",
  sin_evidencia: "Sin evidencia",
  potencialmente_enganoso: "Potencialmente engañoso",
};

export const VERDICT_COLORS: Record<ClaimVerdict, string> = {
  verificable: "bg-emerald-100 text-emerald-800 border-emerald-200",
  parcial: "bg-amber-100 text-amber-800 border-amber-200",
  opinion: "bg-blue-100 text-blue-800 border-blue-200",
  sin_evidencia: "bg-gray-100 text-gray-700 border-gray-200",
  potencialmente_enganoso: "bg-red-100 text-red-800 border-red-200",
};
