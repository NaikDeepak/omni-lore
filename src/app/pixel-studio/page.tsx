'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Wand2, Image as ImageIcon, Sliders, Download, RefreshCw, Layers } from 'lucide-react';
import { PALETTES, PaletteName } from '../../pixel/palette';

interface AssetEntry {
  series: string;
  type: string;
  id: string;
  url: string;
}

const PRESET_SAMPLES = [
  {
    name: 'Monkey D. Luffy',
    series: 'one-piece',
    url: 'https://static.wikia.nocookie.net/onepiece/images/6/6d/Monkey_D._Luffy_Anime_Post_Timeskip_Infobox.png/revision/latest/scale-to-width-down/200',
  },
  {
    name: 'Roronoa Zoro',
    series: 'one-piece',
    url: 'https://static.wikia.nocookie.net/onepiece/images/5/56/Roronoa_Zoro_Anime_Post_Timeskip_Infobox.png/revision/latest/scale-to-width-down/200',
  },
  {
    name: 'Zhuo Fan (Demon Emperor)',
    series: 'demonic-emperor',
    url: 'https://static.wikia.nocookie.net/magic-emperor/images/f/fa/036-31-0.jpg/revision/latest/scale-to-width-down/200',
  },
  {
    name: 'Linley Baruch (Coiling Dragon)',
    series: 'coiling-dragon',
    url: 'https://static.wikia.nocookie.net/coiling-dragon/images/e/e0/Linley_young.png/revision/latest/scale-to-width-down/200',
  },
];

export default function PixelStudioPage() {
  const [activeTab, setActiveTab] = useState<'interactive' | 'batch' | 'gallery'>('interactive');

  // Interactive converter state
  const [sourceUrl, setSourceUrl] = useState(PRESET_SAMPLES[0].url);
  const [resolution, setResolution] = useState(32);
  const [palette, setPalette] = useState<PaletteName>('fantasy16');
  const [contrast, setContrast] = useState(1.15);
  const [saturation, setSaturation] = useState(1.3);
  const [outline, setOutline] = useState(true);
  const [dither, setDither] = useState<'none' | 'floyd-steinberg'>('none');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Result state
  const [convertedSvg, setConvertedSvg] = useState<string | null>(null);
  const [convertedDataUrl, setConvertedDataUrl] = useState<string | null>(null);
  const [paletteUsed, setPaletteUsed] = useState<string[]>([]);

  // Batch runner state
  const [batchSeries, setBatchSeries] = useState('one-piece');
  const [batchType, setBatchType] = useState('character');
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchReports, setBatchReports] = useState<any[]>([]);

  // Gallery state
  const [galleryAssets, setGalleryAssets] = useState<AssetEntry[]>([]);
  const [galleryFilter, setGalleryFilter] = useState('all');

  const fetchGallery = async () => {
    try {
      const res = await fetch('/api/pixelate');
      const data = await res.json();
      if (data.success) {
        setGalleryAssets(data.assets);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleConvert = async () => {
    if (!sourceUrl.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/pixelate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: sourceUrl,
          resolution,
          palette,
          contrast,
          saturation,
          outline,
          dither,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Conversion failed');
      }

      setConvertedSvg(data.result.svg);
      setConvertedDataUrl(data.result.svgDataUrl);
      setPaletteUsed(data.result.paletteUsed);
      fetchGallery();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunBatch = async () => {
    setBatchLoading(true);
    setBatchReports([]);

    try {
      const res = await fetch('/api/pixelate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seriesSlug: batchSeries,
          type: batchType,
          resolution,
          palette,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Batch failed');
      }

      setBatchReports(data.reports);
      fetchGallery();
    } catch (err: any) {
      alert(`Batch failed: ${err.message}`);
    } finally {
      setBatchLoading(false);
    }
  };

  const filteredAssets = galleryAssets.filter(
    (a) => galleryFilter === 'all' || a.series === galleryFilter
  );

  return (
    <main className="min-h-screen bg-[#060a14] text-slate-100 font-mono p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded bg-slate-900 border border-slate-800 hover:border-amber-400 text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-amber-400" />
                <h1 className="font-pixel text-base sm:text-lg text-amber-400 tracking-wide">
                  PIXEL ART STUDIO & ASSET GENERATOR
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                Turn source character, location, and item images from Wikipedia & Fandom into authentic 8/16-bit Modern Pixel Fantasy vector assets.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('interactive')}
              className={`px-3 py-1 text-xs rounded font-pixel transition ${
                activeTab === 'interactive'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Live Converter
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              className={`px-3 py-1 text-xs rounded font-pixel transition ${
                activeTab === 'batch'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Batch Pipeline
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-3 py-1 text-xs rounded font-pixel transition ${
                activeTab === 'gallery'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Gallery ({galleryAssets.length})
            </button>
          </div>
        </div>

        {/* TAB 1: INTERACTIVE CONVERTER */}
        {activeTab === 'interactive' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Controls Column */}
            <div className="lg:col-span-5 space-y-4 bg-slate-900/90 border border-slate-800 p-5 rounded-xl shadow-xl">
              <div className="space-y-1.5">
                <label className="text-xs font-pixel text-amber-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" /> SOURCE IMAGE URL
                </label>
                <input
                  type="text"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://.../character_art.png"
                  className="w-full text-xs bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              {/* Sample Presets */}
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 font-pixel">Quick Samples:</span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_SAMPLES.map((s) => (
                    <button
                      key={s.name}
                      onClick={() => setSourceUrl(s.url)}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded text-amber-200 border border-slate-700"
                    >
                      {s.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-pixel text-slate-300">RESOLUTION (GRID SIZE)</label>
                  <span className="text-xs font-mono text-cyan-400">{resolution}x{resolution} px</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[16, 24, 32, 48].map((res) => (
                    <button
                      key={res}
                      onClick={() => setResolution(res)}
                      className={`text-xs py-1.5 rounded font-pixel border transition ${
                        resolution === res
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {res}x{res}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-pixel text-slate-300">COLOR PALETTE</label>
                  <select
                    value={palette}
                    onChange={(e) => setPalette(e.target.value as PaletteName)}
                    className="w-full text-xs bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    {Object.entries(PALETTES).map(([k, p]) => (
                      <option key={k} value={k}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Saturation Boost</span>
                    <span className="text-amber-300">{Math.round(saturation * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="2.0"
                    step="0.05"
                    value={saturation}
                    onChange={(e) => setSaturation(parseFloat(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Contrast Boost</span>
                    <span className="text-amber-300">{Math.round(contrast * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="1.5"
                    step="0.05"
                    value={contrast}
                    onChange={(e) => setContrast(parseFloat(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={outline}
                      onChange={(e) => setOutline(e.target.checked)}
                      className="accent-amber-500"
                    />
                    <span>1px Dark Silhouette Outline</span>
                  </label>

                  <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dither === 'floyd-steinberg'}
                      onChange={(e) => setDither(e.target.checked ? 'floyd-steinberg' : 'none')}
                      className="accent-amber-500"
                    />
                    <span>Floyd-Steinberg Dither</span>
                  </label>
                </div>
              </div>

              <button
                onClick={handleConvert}
                disabled={loading}
                className="w-full mt-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-pixel font-bold text-xs rounded shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>PIXELATING IMAGE...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>GENERATE PIXEL ART</span>
                  </>
                )}
              </button>

              {error && (
                <div className="p-3 bg-red-950/60 border border-red-500/40 text-red-200 text-xs rounded">
                  {error}
                </div>
              )}
            </div>

            {/* Right Preview Column */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Source Image Frame */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center min-h-[300px]">
                  <span className="text-xs font-pixel text-slate-400 mb-3">ORIGINAL SOURCE</span>
                  <div className="relative w-48 h-48 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center">
                    {sourceUrl ? (
                      <img
                        src={sourceUrl}
                        alt="Source"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-slate-600">No image specified</span>
                    )}
                  </div>
                </div>

                {/* Pixelated Output Frame */}
                <div className="bg-slate-900/80 border-2 border-amber-500/50 rounded-xl p-4 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden shadow-2xl">
                  {/* Scanline CRT Pattern */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:12px_12px]" />

                  <span className="text-xs font-pixel text-amber-400 mb-3 flex items-center gap-1.5">
                    <span>✨</span> MODERN PIXEL FANTASY SPRITE
                  </span>

                  <div className="relative w-48 h-48 rounded-lg border-2 border-amber-500/70 bg-[#060a14] flex items-center justify-center overflow-hidden shadow-inner">
                    {convertedDataUrl ? (
                      <img
                        src={convertedDataUrl}
                        alt="Pixel Art"
                        className="w-full h-full object-contain"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    ) : (
                      <span className="text-xs text-slate-500 font-pixel text-center px-4">
                        Click 'Generate Pixel Art' to preview converted sprite
                      </span>
                    )}
                  </div>

                  {convertedSvg && (
                    <div className="mt-3 flex gap-2">
                      <a
                        href={convertedDataUrl!}
                        download={`pixel_${resolution}x${resolution}.svg`}
                        className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 px-3 py-1 rounded font-pixel flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> Download SVG
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Palette Color Swatches */}
              {paletteUsed.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-pixel text-slate-400">EXTRACTED SPRITE PALETTE</span>
                    <span className="text-cyan-400">{paletteUsed.length} Colors</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {paletteUsed.map((c) => (
                      <div
                        key={c}
                        className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800 text-[10px]"
                      >
                        <div
                          className="w-3.5 h-3.5 rounded border border-white/20"
                          style={{ backgroundColor: c }}
                        />
                        <span className="font-mono text-slate-300">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: BATCH PIPELINE */}
        {activeTab === 'batch' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
              <h2 className="font-pixel text-sm text-amber-400">BATCH SERIE PIXELATION PIPELINE</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automatically queries Wikipedia and Fandom for all entities (characters, landmarks, factions) in the chosen universe, downloads their official portrait/icon, converts it to clean vector pixel art, and updates the canonical knowledge graph.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-pixel text-slate-300">TARGET UNIVERSE</label>
                  <select
                    value={batchSeries}
                    onChange={(e) => setBatchSeries(e.target.value)}
                    className="w-full text-xs bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white"
                  >
                    <option value="one-piece">One Piece (Shonen Anime)</option>
                    <option value="demonic-emperor">Demonic Emperor (Xianxia)</option>
                    <option value="coiling-dragon">Coiling Dragon (Cultivation)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-pixel text-slate-300">ENTITY SCOPE</label>
                  <select
                    value={batchType}
                    onChange={(e) => setBatchType(e.target.value)}
                    className="w-full text-xs bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white"
                  >
                    <option value="character">Characters (Character Avatars)</option>
                    <option value="location">Locations (World Map Landmarks)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-pixel text-slate-300">PIXEL RESOLUTION</label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(parseInt(e.target.value, 10))}
                    className="w-full text-xs bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white"
                  >
                    <option value="16">16x16 (Classic 8-Bit)</option>
                    <option value="24">24x24 (GBA Mini Sprite)</option>
                    <option value="32">32x32 (Modern Pixel Fantasy)</option>
                    <option value="48">48x48 (High-Res 16-Bit Arcade)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleRunBatch}
                  disabled={batchLoading}
                  className="py-2.5 px-6 bg-amber-500 hover:bg-amber-400 text-slate-950 font-pixel font-bold text-xs rounded shadow transition flex items-center gap-2 disabled:opacity-50"
                >
                  {batchLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>CONVERTING ENTITIES FROM WIKIPEDIA...</span>
                    </>
                  ) : (
                    <>
                      <Layers className="w-4 h-4" />
                      <span>START BATCH INGESTION</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Batch Execution Results */}
            {batchReports.length > 0 && (
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <h3 className="font-pixel text-xs text-amber-400">EXECUTION REPORT</h3>
                <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto">
                  {batchReports.map((r, i) => (
                    <div key={i} className="py-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={r.success ? 'text-emerald-400' : 'text-amber-500'}>
                          {r.success ? '✓' : '⚠'}
                        </span>
                        <span className="text-white font-medium">{r.entityName}</span>
                        <span className="text-[10px] text-slate-500 font-pixel uppercase">({r.entityType})</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {r.success ? r.pixelSvgPath.split('/').slice(-3).join('/') : r.error}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GALLERY */}
        {activeTab === 'gallery' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-pixel text-slate-400">
                TOTAL GENERATED ASSETS: {galleryAssets.length}
              </span>
              <div className="flex gap-1.5">
                {['all', 'one-piece', 'demonic-emperor', 'coiling-dragon'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setGalleryFilter(f)}
                    className={`text-xs px-2.5 py-1 rounded font-pixel transition ${
                      galleryFilter === f
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {f.replace('-', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.url}
                  className="bg-slate-900 border border-slate-800 hover:border-amber-400/60 rounded-xl p-3 flex flex-col items-center gap-2 transition group"
                >
                  <div className="w-20 h-20 bg-slate-950 rounded border border-slate-800 p-1 flex items-center justify-center overflow-hidden">
                    <img
                      src={asset.url}
                      alt={asset.id}
                      className="w-full h-full object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                  <div className="text-center w-full">
                    <div className="text-[11px] font-pixel text-amber-200 truncate capitalize">
                      {asset.id.replace('loc-', '').replace(/-/g, ' ')}
                    </div>
                    <div className="text-[9px] text-slate-500 uppercase font-mono">
                      {asset.series} • {asset.type}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
