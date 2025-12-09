
import React, { useState, useMemo } from 'react';
import { PhotoData } from '../types';
import { Download, Sparkles, Move, Maximize, ArrowRight, Quote, Check, Image as ImageIcon } from 'lucide-react';
import { Button } from './Button';
import { generateHighQualityCrop } from '../services/imageProcessor';

interface ResultsViewProps {
  photos: PhotoData[];
  onReset: () => void;
}

type VibeCategory = 'Aesthetic' | 'Gen-Z' | 'The Moment';

export const ResultsView: React.FC<ResultsViewProps> = ({ photos, onReset }) => {
  const [activeCategory, setActiveCategory] = useState<VibeCategory>('Aesthetic');
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [isProcessingDownload, setIsProcessingDownload] = useState(false);

  // 1. Extract and Group Vibes
  const categorizedVibes = useMemo(() => {
    const buckets = {
      'Aesthetic': new Set<string>(),
      'Gen-Z': new Set<string>(),
      'The Moment': new Set<string>()
    };

    photos.forEach(p => {
      if (p.analysis?.vibeCategory) {
        buckets['Aesthetic'].add(p.analysis.vibeCategory.aesthetic);
        buckets['Gen-Z'].add(p.analysis.vibeCategory.genz);
        buckets['The Moment'].add(p.analysis.vibeCategory.moment);
      }
    });

    return {
      'Aesthetic': Array.from(buckets['Aesthetic']),
      'Gen-Z': Array.from(buckets['Gen-Z']),
      'The Moment': Array.from(buckets['The Moment'])
    };
  }, [photos]);

  // 2. Filter photos based on selection
  const filteredPhotos = useMemo(() => {
    let matches = [...photos];
    
    // Sort by score initially to ensure the "Best" is always first
    matches.sort((a, b) => (b.analysis?.aestheticScore || 0) - (a.analysis?.aestheticScore || 0));

    if (selectedVibe) {
      matches = matches.filter(p => {
        const cat = p.analysis?.vibeCategory;
        if (!cat) return false;
        if (activeCategory === 'Aesthetic') return cat.aesthetic === selectedVibe;
        if (activeCategory === 'Gen-Z') return cat.genz === selectedVibe;
        if (activeCategory === 'The Moment') return cat.moment === selectedVibe;
        return false;
      });
    }

    return matches;
  }, [photos, activeCategory, selectedVibe]);

  const [selectedPhotoId, setSelectedPhotoId] = useState<string>(filteredPhotos[0]?.id || photos[0].id);

  // Sync selection to the top result when filters change
  React.useEffect(() => {
    if (filteredPhotos.length > 0) {
      setSelectedPhotoId(filteredPhotos[0].id);
    }
  }, [filteredPhotos]);

  // Reset vibe when category changes
  React.useEffect(() => {
    setSelectedVibe(null);
  }, [activeCategory]);

  const activePhoto = photos.find(p => p.id === selectedPhotoId);
  const analysis = activePhoto?.analysis;

  const handleDownloadHighRes = async () => {
    if (!activePhoto || !analysis) return;
    setIsProcessingDownload(true);
    
    try {
      // 1. Generate High Res Blob
      const blob = await generateHighQualityCrop(
        activePhoto.file, 
        analysis.bestCrop, 
        analysis.cropAlignment
      );
      
      // 2. Create link and click it
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `aurapick-${analysis.vibes[0] || 'edit'}-highres.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error("Download failed", e);
      alert("Could not process high-res image. Downloading original instead.");
    } finally {
      setIsProcessingDownload(false);
    }
  };

  if (!activePhoto || !analysis) return null;

  // CSS for preview
  const getContainerAspectClass = (crop?: string) => {
    if (!crop) return 'aspect-[4/5]';
    if (crop.includes('1:1')) return 'aspect-square';
    if (crop.includes('9:16')) return 'aspect-[9/16]';
    return 'aspect-[4/5]';
  };

  const getImageStyle = (analysis: NonNullable<PhotoData['analysis']>) => {
    const style: React.CSSProperties = {
      objectFit: analysis.bestCrop === 'Original' ? 'contain' : 'cover',
      transition: 'all 0.5s ease-in-out'
    };
    if (analysis.cropAlignment === 'top') style.objectPosition = 'top center';
    else if (analysis.cropAlignment === 'bottom') style.objectPosition = 'bottom center';
    else style.objectPosition = 'center center';
    if (analysis.bestCrop.includes('Zoomed')) style.transform = 'scale(1.25)'; 
    return style;
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 animate-fade-in">
      
      {/* 1. Category Tabs */}
      <div className="flex justify-center mb-6">
        <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm inline-flex">
          {(['Aesthetic', 'Gen-Z', 'The Moment'] as VibeCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeCategory === cat
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Vibe Pills (Sub-category) - NO 'ALL' BUTTON */}
      <div className="mb-10 text-center min-h-[40px]">
        <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
          {categorizedVibes[activeCategory].length > 0 ? (
            categorizedVibes[activeCategory].map(vibe => (
              <button
                key={vibe}
                onClick={() => setSelectedVibe(selectedVibe === vibe ? null : vibe)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${
                  selectedVibe === vibe 
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30 ring-offset-1' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300 hover:bg-brand-50'
                }`}
              >
                {vibe}
              </button>
            ))
          ) : (
             <span className="text-slate-400 text-xs italic">No specific vibes found in this category.</span>
          )}
        </div>
      </div>

      {/* 3. Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
        
        {/* LEFT: Analysis & Context */}
        <div className="w-full lg:w-1/2 order-2 lg:order-1 space-y-6">
          
          {/* Thumbnails */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {filteredPhotos.length > 0 ? 'Top Picks' : 'No matches'}
              </h4>
              <button onClick={onReset} className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                Upload New Batch
              </button>
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-4 snap-x hide-scrollbar">
              {filteredPhotos.map((photo, idx) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhotoId(photo.id)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all snap-start ${
                    selectedPhotoId === photo.id 
                      ? 'ring-2 ring-brand-500 ring-offset-2 opacity-100 scale-105' 
                      : 'opacity-50 hover:opacity-80 grayscale hover:grayscale-0'
                  }`}
                >
                  <img src={photo.previewUrl} alt="" className="w-full h-full object-cover" />
                  {/* Rank Badge for #1 */}
                  {idx === 0 && !selectedVibe && (
                    <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[8px] font-bold px-1.5 py-0.5 rounded-bl-md">
                      #1
                    </div>
                  )}
                  {selectedPhotoId === photo.id && (
                    <div className="absolute inset-0 bg-brand-500/10" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden">
            <Quote className="absolute top-6 right-6 w-12 h-12 text-brand-100 opacity-50" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wide mb-4">
                <Sparkles className="w-3 h-3" />
                {analysis.vibeCategory ? analysis.vibeCategory[activeCategory === 'The Moment' ? 'moment' : activeCategory === 'Gen-Z' ? 'genz' : 'aesthetic'] : 'Vibe Check'}
              </div>

              <h3 className="text-3xl font-black text-slate-900 mb-4 leading-tight">
                {analysis.vibeDescription}
              </h3>
              
              <p className="text-slate-600 text-lg leading-relaxed mb-8">
                {analysis.critique}
              </p>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">The Edit Recipe</h4>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                   <div className="text-slate-500">Crop Format</div>
                   <div className="font-semibold text-slate-900 text-right">{analysis.bestFitFormat}</div>

                   <div className="text-slate-500">Focus Point</div>
                   <div className="font-semibold text-slate-900 text-right">{analysis.bestCrop.replace('Original', 'Full Frame').replace(/4:5|1:1|9:16/g, '').trim()}</div>
                   
                   <div className="text-slate-500">Alignment</div>
                   <div className="font-semibold text-slate-900 text-right capitalize flex items-center justify-end gap-1">
                      {analysis.cropAlignment === 'top' && <ArrowRight className="w-3 h-3 -rotate-90 text-brand-500" />}
                      {analysis.cropAlignment === 'center' && <Move className="w-3 h-3 text-brand-500" />}
                      {analysis.cropAlignment}
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: The Photo & Actions */}
        <div className="w-full lg:w-1/2 order-1 lg:order-2 flex flex-col items-center">
          <div className="relative w-full max-w-sm mx-auto bg-white p-3 rounded-2xl shadow-2xl border border-slate-100 rotate-1 hover:rotate-0 transition-transform duration-500">
             {/* The Photo Container */}
            <div className={`relative ${getContainerAspectClass(analysis.bestCrop)} rounded-xl overflow-hidden bg-slate-100`}>
               <img 
                 src={activePhoto.previewUrl} 
                 alt="Selected" 
                 className="w-full h-full"
                 style={getImageStyle(analysis)}
               />
               <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md">
                 AI CHOICE
               </div>
            </div>
          </div>

          <div className="mt-8 w-full max-w-sm space-y-3">
             <Button 
                size="lg" 
                onClick={handleDownloadHighRes}
                disabled={isProcessingDownload}
                className="w-full flex items-center justify-center gap-2 shadow-xl shadow-brand-500/20 py-4"
              >
                {isProcessingDownload ? (
                   <>Processing High-Res...</>
                ) : (
                   <>
                     <Download className="w-5 h-5" /> Download Edited
                   </>
                )}
              </Button>
              
              <a 
                href={activePhoto.previewUrl} 
                download={`aurapick-original-${activePhoto.id}.jpg`}
                className="block"
              >
                <button className="w-full py-3 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-2">
                   <ImageIcon className="w-3 h-3" /> Download Original (Uncropped)
                </button>
              </a>
          </div>
        </div>

      </div>
    </div>
  );
};
