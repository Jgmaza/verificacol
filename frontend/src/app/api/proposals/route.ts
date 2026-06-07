import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
    const response = await fetch(`${backendUrl}/candidates`, { cache: "no-store" });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Backend no disponible. Inicia: cd backend && uvicorn main:app --reload" },
        { status: 503 }
      );
    }

    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json(
      {
        candidates: [
          { id: "ivan-cepeda", name: "Iván Cepeda", party: "Pacto Histórico", programTitle: "El Poder de la Verdad" },
          { id: "abelardo-de-la-espriella", name: "Abelardo de la Espriella", party: "Defensores de la Patria", programTitle: "Patria Milagro" },
        ],
      },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { candidate_id, force = false } = await req.json();
    if (!candidate_id) {
      return NextResponse.json({ error: "candidate_id requerido" }, { status: 400 });
    }

    const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
    const response = await fetch(`${backendUrl}/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidate_id, force }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: "Error scrapeando" }));
      return NextResponse.json({ error: err.detail }, { status: response.status });
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
