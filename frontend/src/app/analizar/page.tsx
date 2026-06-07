"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Disclaimer } from "@/components/Disclaimer";
import { CredibilityMeter } from "@/components/CredibilityMeter";
import { ClaimCard } from "@/components/ClaimCard";
import { ChatPanel } from "@/components/ChatPanel";
import { DEMO_TRANSCRIPT, DEMO_ANALYSIS } from "@/lib/demo";
import type { CredibilityAnalysis, TranscriptResult } from "@/lib/types";

type Step = "idle" | "transcribing" | "analyzing" | "done" | "error";

function AnalizarContent() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState("");
  const [transcript, setTranscript] = useState<TranscriptResult | null>(null);
  const [analysis, setAnalysis] = useState<CredibilityAnalysis | null>(null);

  useEffect(() => {
    if (searchParams.get("demo") === "1") {
      loadDemo();
    }
  }, [searchParams]);

  function loadDemo() {
    setUrl(DEMO_TRANSCRIPT.url);
    setTranscript(DEMO_TRANSCRIPT);
    setAnalysis(DEMO_ANALYSIS);
    setStep("done");
    setError("");
  }

  async function handleAnalyze() {
    if (!url.trim()) return;
    setError("");
    setTranscript(null);
    setAnalysis(null);
    setStep("transcribing");

    try {
      const tRes = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const tData = await tRes.json();
      if (!tRes.ok) {
        throw new Error(
          tData.error ||
            `Error transcribiendo (HTTP ${tRes.status}). Revisa que el backend esté corriendo: cd backend && ./run.sh`
        );
      }

      const result: TranscriptResult = {
        url: url.trim(),
        title: tData.title,
        author: tData.author,
        description: tData.description,
        duration: tData.duration,
        transcript: tData.transcript,
      };
      setTranscript(result);
      setStep("analyzing");

      const aRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: result.transcript,
          metadata: { url: result.url, author: result.author, title: result.title },
        }),
      });
      const aData = await aRes.json();
      if (!aRes.ok) throw new Error(aData.error || "Error analizando");

      setAnalysis(aData);
      setStep("done");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      console.error("[analizar] error:", msg);
      setError(msg);
      setStep("error");
    }
  }

  const chatContext = transcript
    ? {
        type: "transcript" as const,
        content: transcript.transcript,
        analysis: analysis ? JSON.stringify(analysis, null, 2) : undefined,
        metadata: {
          url: transcript.url,
          author: transcript.author || "",
          title: transcript.title || "",
        },
      }
    : { type: "transcript" as const, content: "" };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blue-900">Analizador de URLs</h1>
        <p className="mt-1 text-gray-600">
          Pega un enlace de video y obtén transcripción + análisis de credibilidad
        </p>
      </div>

      <Disclaimer />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.instagram.com/reel/..."
          className="flex-1 rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
        />
        <button
          onClick={handleAnalyze}
          disabled={step === "transcribing" || step === "analyzing"}
          className="rounded-lg bg-blue-700 px-6 py-3 font-medium text-white hover:bg-blue-800 disabled:opacity-50 transition-colors"
        >
          {step === "transcribing"
            ? "Transcribiendo..."
            : step === "analyzing"
              ? "Analizando..."
              : "Analizar"}
        </button>
        <button
          onClick={loadDemo}
          className="rounded-lg border border-blue-200 px-4 py-3 text-sm font-medium text-blue-800 hover:bg-blue-50 transition-colors"
        >
          Cargar demo
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {transcript && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-blue-900">Transcripción</h2>
              {transcript.author && (
                <p className="mt-1 text-sm text-gray-500">
                  {transcript.author}
                  {transcript.title && ` — ${transcript.title}`}
                </p>
              )}
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {transcript.transcript}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {analysis && (
              <>
                <CredibilityMeter
                  score={analysis.credibilityScore}
                  explanation={analysis.scoreExplanation}
                />

                <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
                  <h3 className="font-semibold text-blue-900">Resumen</h3>
                  <p className="mt-2 text-sm text-gray-700">{analysis.summary}</p>
                </div>

                <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
                  <h3 className="mb-3 font-semibold text-blue-900">Afirmaciones detectadas</h3>
                  <div className="space-y-3">
                    {analysis.claims.map((claim, i) => (
                      <ClaimCard key={i} claim={claim} />
                    ))}
                  </div>
                </div>

                {analysis.redFlags.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                    <h3 className="font-semibold text-amber-900">Señales de alerta</h3>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-800">
                      {analysis.redFlags.map((flag, i) => (
                        <li key={i}>{flag}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.verificationQuestions.length > 0 && (
                  <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
                    <h3 className="font-semibold text-blue-900">Preguntas para verificar</h3>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700">
                      {analysis.verificationQuestions.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {transcript && (
        <div className="mt-8">
          <ChatPanel
            context={chatContext}
            suggestions={[
              "¿Es cierto lo del 1.6% de crecimiento?",
              "¿Qué contexto falta en este discurso?",
              "¿Cómo puedo verificar estas afirmaciones?",
              "¿Cuáles son las señales de alerta más importantes?",
            ]}
          />
        </div>
      )}
    </div>
  );
}

export default function AnalizarPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Cargando...</div>}>
      <AnalizarContent />
    </Suspense>
  );
}
