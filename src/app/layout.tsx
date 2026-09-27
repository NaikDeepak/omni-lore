import './globals.css';
import Link from 'next/link';
import { Compass, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';

export const metadata = {
  title: 'OmniLore | Visual Lore & Worldbuilding Explorer',
  description: 'Explore anime, light novel, and cultivation worlds without getting spoiled.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-cosmic-900 text-slate-100">
        <header className="border-b border-cosmic-700 bg-cosmic-800/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Compass className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-amber-400 via-orange-300 to-indigo-300 bg-clip-text text-transparent">
                  OmniLore
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-cosmic-700 text-slate-400 border border-cosmic-600">
                  Visual Lore Explorer
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link 
                href="/" 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-cosmic-700 transition"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Universes</span>
              </Link>
              <Link 
                href="/ops" 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-cosmic-700 transition"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Data Ops</span>
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
          {children}
        </main>

        <footer className="border-t border-cosmic-800 py-6 text-center text-xs text-slate-500">
          OmniLore — Temporal Knowledge Graph & Spoiler-Free World Explorer
        </footer>
      </body>
    </html>
  );
}
