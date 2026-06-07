import { NextRequest, NextResponse } from "next/server";
import { analyzeCredibility, analyzeProposals } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY no configurada. Copia frontend/.env.local.example a .env.local" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { type = "credibility", transcript, metadata, candidateName, rawContent } = body;

    if (type === "proposals") {
      if (!candidateName || !rawContent) {
        return NextResponse.json({ error: "candidateName y rawContent requeridos" }, { status: 400 });
      }
      const analysis = await analyzeProposals(candidateName, rawContent);
      return NextResponse.json(analysis);
    }

    if (!transcript) {
      return NextResponse.json({ error: "transcript requerido" }, { status: 400 });
    }

    const analysis = await analyzeCredibility(transcript, metadata);
    return NextResponse.json(analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
