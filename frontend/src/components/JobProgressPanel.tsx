"use client";

interface JobProgressPanelProps {
  messages: string[];
  status: string;
}

const STATUS_LABELS: Record<string, string> = {
  queued: "En cola",
  downloading: "Descargando audio",
  transcribing: "Transcribiendo",
  analyzing: "Analizando credibilidad",
  done: "Listo",
  error: "Error",
};

export function JobProgressPanel({ messages, status }: JobProgressPanelProps) {
  const label = STATUS_LABELS[status] || status;

  return (
    <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        {status !== "done" && status !== "error" && (
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-600" />
        )}
        <h3 className="font-semibold text-blue-900">{label}</h3>
      </div>
      <div className="space-y-2">
        {messages.map((msg, i) => (
          <p
            key={i}
            className={`text-sm leading-relaxed ${
              i === messages.length - 1 && status !== "done" && status !== "error"
                ? "text-blue-900 font-medium"
                : "text-gray-600"
            }`}
          >
            {msg}
          </p>
        ))}
      </div>
    </div>
  );
}
