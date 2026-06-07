import type { Claim } from "@/lib/types";
import { VERDICT_COLORS, VERDICT_LABELS } from "@/lib/types";

export function ClaimCard({ claim }: { claim: Claim }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
      <p className="mb-2 font-medium text-gray-900">&ldquo;{claim.text}&rdquo;</p>
      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${VERDICT_COLORS[claim.verdict]}`}>
        {VERDICT_LABELS[claim.verdict]}
      </span>
      <p className="mt-2 text-sm text-gray-600">{claim.explanation}</p>
      {claim.citation && (
        <p className="mt-1 text-xs italic text-gray-400">Cita: {claim.citation}</p>
      )}
    </div>
  );
}
