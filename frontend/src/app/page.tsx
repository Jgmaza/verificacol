import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";

const features = [
  {
    title: "Analiza un video o reel",
    description:
      "Pega una URL de Instagram, YouTube o TikTok. Obtenemos la transcripción y analizamos la credibilidad de cada afirmación.",
    href: "/analizar",
    icon: "🔍",
  },
  {
    title: "Revisa propuestas electorales",
    description:
      "Explora y simplifica las propuestas de candidatos como Iván Cepeda y Abelardo de la Espriella. Sin tecnicismos.",
    href: "/propuestas",
    icon: "📋",
  },
  {
    title: "Pregunta lo que no entiendas",
    description:
      "Conversa con el asistente sobre cualquier contenido. Pide contexto, fuentes oficiales o puntos a verificar.",
    href: "/analizar",
    icon: "💬",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <section className="mb-12 text-center">
        <div className="mb-4 inline-block rounded-full bg-blue-100 px-4 py-1 text-sm font-medium text-blue-800">
          Elecciones Colombia 2026
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-blue-900 md:text-5xl">
          Verifica antes de compartir
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600">
          VerificaCol te ayuda a entender qué tan confiable es la información que recibes en redes,
          y a simplificar las propuestas de los candidatos. Porque en época electoral, la desinformación también vota.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/analizar"
            className="rounded-lg bg-blue-700 px-6 py-3 font-medium text-white hover:bg-blue-800 transition-colors"
          >
            Analizar una URL
          </Link>
          <Link
            href="/propuestas"
            className="rounded-lg border border-blue-200 bg-white px-6 py-3 font-medium text-blue-800 hover:bg-blue-50 transition-colors"
          >
            Ver propuestas
          </Link>
        </div>
      </section>

      <div className="mb-12">
        <Disclaimer />
      </div>

      <section className="grid gap-6 md:grid-cols-3">
        {features.map((f) => (
          <Link
            key={f.title}
            href={f.href}
            className="group rounded-xl border border-blue-100 bg-white p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
          >
            <span className="text-3xl">{f.icon}</span>
            <h2 className="mt-3 text-lg font-semibold text-blue-900 group-hover:text-blue-700">
              {f.title}
            </h2>
            <p className="mt-2 text-sm text-gray-600">{f.description}</p>
          </Link>
        ))}
      </section>

      <section className="mt-16 rounded-xl bg-blue-900 p-8 text-center text-white">
        <h2 className="text-2xl font-bold">Demo para Daniela</h2>
        <p className="mt-2 text-blue-200">
          Prueba el análisis precargado del reel de Juan Daniel Oviedo sobre la economía colombiana.
        </p>
        <Link
          href="/analizar?demo=1"
          className="mt-4 inline-block rounded-lg bg-white px-6 py-2 font-medium text-blue-900 hover:bg-blue-50 transition-colors"
        >
          Cargar demo
        </Link>
      </section>
    </div>
  );
}
