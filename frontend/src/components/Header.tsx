import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-blue-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-sm font-bold text-white">
            VC
          </div>
          <div>
            <p className="text-lg font-bold text-blue-900">VerificaCol</p>
            <p className="text-xs text-blue-600">Validador de información electoral</p>
          </div>
        </Link>
        <nav className="flex gap-6 text-sm font-medium">
          <Link href="/analizar" className="text-blue-800 hover:text-blue-600 transition-colors">
            Analizar URL
          </Link>
          <Link href="/propuestas" className="text-blue-800 hover:text-blue-600 transition-colors">
            Propuestas
          </Link>
        </nav>
      </div>
    </header>
  );
}
