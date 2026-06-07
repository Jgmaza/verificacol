interface CredibilityMeterProps {
  score: number;
  explanation: string;
}

function getColor(score: number) {
  if (score >= 70) return { bar: "bg-emerald-500", text: "text-emerald-700", label: "Alta credibilidad" };
  if (score >= 40) return { bar: "bg-amber-500", text: "text-amber-700", label: "Credibilidad media" };
  return { bar: "bg-red-500", text: "text-red-700", label: "Baja credibilidad" };
}

export function CredibilityMeter({ score, explanation }: CredibilityMeterProps) {
  const { bar, text, label } = getColor(score);

  return (
    <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold text-blue-900">Detector de credibilidad</h3>
        <span className={`text-2xl font-bold ${text}`}>{score}/100</span>
      </div>
      <p className={`mb-3 text-sm font-medium ${text}`}>{label}</p>
      <div className="mb-3 h-3 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ${bar}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-sm text-gray-600">{explanation}</p>
    </div>
  );
}
