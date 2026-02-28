import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Cpu, Box, Play, Loader2, Image as ImageIcon, Info, ChevronRight } from 'lucide-react';
import BabylonView from './components/BabylonView';
import { analyzeMechanicalImage, MechScene } from './services/geminiService';

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sceneData, setSceneData] = useState<MechScene | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImage(base64);
      setIsAnalyzing(true);
      setError(null);
      
      try {
        const result = await analyzeMechanicalImage(base64);
        setSceneData(result);
      } catch (err) {
        console.error(err);
        setError("Failed to analyze image. Please try another one.");
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <Cpu className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight uppercase">MechReconstruct <span className="text-emerald-500">AI</span></h1>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 uppercase tracking-widest">
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              System Active
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Controls & Input */}
        <div className="lg:col-span-4 space-y-6">
          {/* Upload Card */}
          <section className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4 text-zinc-400">
              <ImageIcon className="w-4 h-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider">Input Source</h2>
            </div>
            
            <label className="relative group cursor-pointer block">
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload}
                disabled={isAnalyzing}
              />
              <div className={`
                aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all duration-300
                ${image ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 hover:border-white/20 bg-white/5'}
                ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}
              `}>
                {image ? (
                  <img src={image} alt="Preview" className="w-full h-full object-cover rounded-[10px]" referrerPolicy="no-referrer" />
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-zinc-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Drop mechanical image</p>
                      <p className="text-xs text-zinc-500 mt-1">PNG, JPG up to 10MB</p>
                    </div>
                  </>
                )}
              </div>
            </label>

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                {error}
              </div>
            )}
          </section>

          {/* Analysis Card */}
          <AnimatePresence mode="wait">
            {(isAnalyzing || sceneData) && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 mb-4 text-zinc-400">
                  <Info className="w-4 h-4" />
                  <h2 className="text-xs font-bold uppercase tracking-wider">AI Analysis</h2>
                </div>

                {isAnalyzing ? (
                  <div className="py-8 flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    <p className="text-sm text-zinc-400 font-mono animate-pulse">Deconstructing geometry...</p>
                  </div>
                ) : sceneData && (
                  <div className="space-y-4">
                    <p className="text-sm text-zinc-300 leading-relaxed italic">
                      "{sceneData.description}"
                    </p>
                    <div className="pt-4 border-t border-white/5 space-y-2">
                      <div className="flex justify-between text-[10px] font-mono text-zinc-500 uppercase">
                        <span>Detected Parts</span>
                        <span>{sceneData.parts.length} Units</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {sceneData.parts.slice(0, 4).map((part, i) => (
                          <div key={i} className="bg-white/5 p-2 rounded-lg flex items-center gap-2">
                            <Box className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] font-mono truncate">{part.name}</span>
                          </div>
                        ))}
                        {sceneData.parts.length > 4 && (
                          <div className="bg-white/5 p-2 rounded-lg flex items-center justify-center text-[10px] font-mono text-zinc-500">
                            +{sceneData.parts.length - 4} more
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* Right Panel: 3D Viewport */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex-1 min-h-[500px] lg:min-h-0 relative">
            <BabylonView data={sceneData} />
            
            {/* Viewport Overlay */}
            <div className="absolute top-4 left-4 flex gap-2">
              <div className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-mono uppercase tracking-wider">Live Render</span>
              </div>
            </div>

            <div className="absolute bottom-4 right-4">
              <button 
                onClick={() => setSceneData(null)}
                className="bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-colors"
              >
                Reset Scene
              </button>
            </div>
          </div>

          {/* Bottom Info Bar */}
          <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Engine</span>
                <span className="text-xs font-mono">Babylon.js 7.0</span>
              </div>
              <div className="w-px h-8 bg-white/5" />
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Reconstruction</span>
                <span className="text-xs font-mono">Gemini 3 Flash</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-emerald-500/50">
              <Play className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase">Simulation Running</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
