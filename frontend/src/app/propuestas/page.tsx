"use client";

import { useState, useEffect } from "react";
import { Disclaimer } from "@/components/Disclaimer";
import { ChatPanel } from "@/components/ChatPanel";
import type { CandidateSummary, CandidateData, ProposalAnalysis } from "@/lib/types";

export default function PropuestasPage() {
  const [candidates, setCandidates] = useState<CandidateSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [data, setData] = useState<CandidateData | null>(null);
  const [analysis, setAnalysis] = useState<ProposalAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/proposals")
      .then((r) => r.json())
      .then((d) => setCandidates(d.candidates || []))
      .catch(() => setError("No se pudo cargar la lista de candidatos"));
  }, []);

  async function loadCandidate(id: string) {
    setSelected(id);
    setData(null);
    setAnalysis(null);
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: id }),
      });
      const candidateData = await res.json();
      if (!res.ok) throw new Error(candidateData.error || "Error cargando propuestas");

      setData(candidateData);
      setAnalyzing(true);

      const aRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "proposals",
          candidateName: candidateData.name,
          rawContent: candidateData.rawContent,
        }),
      });
      const aData = await aRes.json();
      if (!aRes.ok) throw new Error(aData.error || "Error analizando propuestas");

      setAnalysis(aData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  }

  const chatContext = data
    ? {
        type: "proposal" as const,
        content: data.rawContent,
        analysis: analysis ? JSON.stringify(analysis, null, 2) : undefined,
        metadata: { candidate: data.name, party: data.party },
      }
    : { type: "proposal" as const, content: "" };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blue-900">Propuestas electorales</h1>
        <p className="mt-1 text-gray-600">
          Explora y simplifica las propuestas de los candidatos. Pregunta lo que no entiendas.
        </p>
      </div>

      <Disclaimer />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {candidates.map((c) => (
          <button
            key={c.id}
            onClick={() => loadCandidate(c.id)}
            className={`rounded-xl border p-5 text-left transition-all ${
              selected === c.id
                ? "border-blue-500 bg-blue-50 shadow-md"
                : "border-blue-100 bg-white hover:border-blue-300 hover:shadow-sm"
            }`}
          >
            <h2 className="text-lg font-semibold text-blue-900">{c.name}</h2>
            <p className="text-sm text-blue-600">{c.party}</p>
            <p className="mt-1 text-xs text-gray-500">{c.programTitle}</p>
          </button>
        ))}
      </div>

      {loading && (
        <div className="mt-8 text-center text-gray-500">
          {analyzing ? "Extrayendo y analizando propuestas..." : "Cargando propuestas..."}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {data && analysis && (
        <div className="mt-8 space-y-6">
          <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-blue-900">
              {data.name} — Resumen en 2 minutos
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-700">
              {analysis.executiveSummary}
            </p>
            <p className="mt-4 text-sm text-gray-600">{analysis.simplifiedExplanation}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {analysis.keyProposals.map((p, i) => (
              <div
                key={i}
                className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm"
              >
                <h3 className="font-semibold text-blue-900">{p.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{p.description}</p>
              </div>
            ))}
          </div>

          {analysis.pointsToVerify.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="font-semibold text-amber-900">Puntos a contrastar</h3>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-800">
                {analysis.pointsToVerify.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {data.sources.length > 0 && (
            <div className="text-xs text-gray-400">
              Fuentes: {data.sources.join(" · ")}
            </div>
          )}

          <ChatPanel
            context={chatContext}
            placeholder={`Pregunta sobre las propuestas de ${data.name}...`}
            suggestions={[
              "¿Cuáles son sus propuestas de seguridad?",
              "¿Qué promete en economía?",
              "¿Hay algo exagerado o difícil de cumplir?",
              "Explícame esto como si tuviera 15 años",
            ]}
          />
        </div>
      )}
    </div>
  );
}
