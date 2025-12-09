
import React, { useState, useEffect } from 'react';
import { UploadArea } from './components/UploadArea';
import { AnalysisProgress } from './components/AnalysisProgress';
import { ResultsView } from './components/ResultsView';
import { AppState, PhotoData } from './types';
import { savePhoto, clearPhotos } from './services/db';
import { analyzePhotoWithGemini } from './services/geminiService';
import { Camera, Github } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<AppState>('upload');
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [analyzingIndex, setAnalyzingIndex] = useState(0);

  // Initial cleanup
  useEffect(() => {
    clearPhotos().catch(console.error);
  }, []);

  const handleFilesSelected = async (files: File[]) => {
    // 1. Create PhotoData objects
    const newPhotos: PhotoData[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'pending'
    }));

    setPhotos(newPhotos);
    
    // 2. Persist to IDB
    try {
      await Promise.all(newPhotos.map(p => savePhoto({ id: p.id, file: p.file })));
    } catch (e) {
      console.error("Failed to save to DB", e);
    }

    // 3. Move to analysis view
    setView('analysis');
    
    // 4. Trigger Analysis Loop
    startAnalysis(newPhotos);
  };

  const startAnalysis = async (photoList: PhotoData[]) => {
    let updatedPhotos = [...photoList];
    
    for (let i = 0; i < updatedPhotos.length; i++) {
      setAnalyzingIndex(i);
      
      // Update status to analyzing
      updatedPhotos[i] = { ...updatedPhotos[i], status: 'analyzing' };
      setPhotos([...updatedPhotos]);

      try {
        // Rate limit protection for Free Tier 
        // Increased to 4 seconds to reliably avoid 429 Too Many Requests on the free tier
       // if (i > 0) await new Promise(r => setTimeout(r, 4000));

        const result = await analyzePhotoWithGemini(updatedPhotos[i].file);
        
        updatedPhotos[i] = { 
          ...updatedPhotos[i], 
          status: 'done', 
          analysis: result 
        };
      } catch (error) {
        console.error(`Error analyzing photo ${i}:`, error);
        updatedPhotos[i] = { 
          ...updatedPhotos[i], 
          status: 'error',
          error: error instanceof Error ? error.message : "Unknown error" 
        };
      }
      
      setPhotos([...updatedPhotos]);
    }

    // Finished - Check if we have at least one success
    const hasSuccess = updatedPhotos.some(p => p.status === 'done');
    if (hasSuccess) {
      setTimeout(() => {
          setView('results');
      }, 1000);
    }
  };

  const handleReset = async () => {
    await clearPhotos();
    setPhotos([]);
    setView('upload');
    setAnalyzingIndex(0);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => view !== 'upload' && window.confirm("Reset?") && handleReset()}>
            <div className="w-8 h-8 bg-gradient-to-tr from-brand-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
              <Camera size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">Aurapick</span>
          </div>
          <div className="text-sm text-slate-500 hidden md:block">
            AI-Powered Curator
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 md:py-12">
        {view === 'upload' && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-12 space-y-4">
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                Pick the <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-purple-600">Perfect Shot</span>
              </h1>
              <p className="text-lg text-slate-600 max-w-xl mx-auto">
                Stop guessing. Upload your batch, and let our AI analyze expression, composition, and vibes to find the winner.
              </p>
            </div>
            <UploadArea onFilesSelected={handleFilesSelected} />
          </div>
        )}

        {view === 'analysis' && (
          <div className="animate-fade-in">
            <AnalysisProgress photos={photos} currentIndex={analyzingIndex} />
          </div>
        )}

        {view === 'results' && (
          <div className="animate-fade-in">
            <ResultsView photos={photos} onReset={handleReset} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} Aurapick. Powered by Google Gemini 2.5 Flash.</p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
             <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
             <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
             <Github className="w-4 h-4 hover:text-slate-900 transition-colors cursor-pointer" />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
