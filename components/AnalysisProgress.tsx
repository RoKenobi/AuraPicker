
import React, { useEffect, useState } from 'react';
import { PhotoData } from '../types';
import { CheckCircle, Circle, Loader2, Sparkles, UserRoundSearch, AlertCircle } from 'lucide-react';

interface AnalysisProgressProps {
  photos: PhotoData[];
  currentIndex: number;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ photos, currentIndex }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Calculate percentage based on completed items
    const completed = photos.filter(p => p.status === 'done').length;
    const target = (completed / photos.length) * 100;
    setProgress(target);
  }, [photos, currentIndex]);

  return (
    <div className="w-full max-w-lg mx-auto p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-50 mb-4">
          <Sparkles className="w-8 h-8 text-brand-600 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Reading the Vibe...</h2>
        <p className="text-slate-500 mt-2">Identifying aesthetics (Nonchalant, Confident, Playful) and finding the best crops.</p>
      </div>

      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div className="text-right w-full">
            <span className="text-xs font-semibold inline-block text-brand-600">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-brand-100">
          <div 
            style={{ width: `${progress}%` }} 
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-brand-500 transition-all duration-500 ease-out"
          ></div>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {photos.map((photo, idx) => (
          <div 
            key={photo.id}
            className={`flex items-center p-3 rounded-lg border transition-all duration-300 ${
              photo.status === 'analyzing' 
                ? 'border-brand-200 bg-brand-50/50 scale-105 shadow-sm' 
                : photo.status === 'done'
                  ? 'border-slate-100 bg-white opacity-60'
                  : photo.status === 'error'
                    ? 'border-red-200 bg-red-50'
                    : 'border-transparent opacity-40'
            }`}
          >
            <div className="w-10 h-10 rounded-md overflow-hidden bg-slate-200 flex-shrink-0 mr-4">
              <img src={photo.previewUrl} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">Photo {idx + 1}</p>
              <div className="text-xs flex items-center gap-1">
                {photo.status === 'analyzing' && (
                  <span className="text-slate-500 flex items-center gap-1">
                    <UserRoundSearch className="w-3 h-3 animate-bounce" /> Categorizing personality...
                  </span>
                )}
                {photo.status === 'pending' && <span className="text-slate-400">Waiting...</span>}
                {photo.status === 'done' && <span className="text-green-600 font-medium">Analyzed</span>}
                {photo.status === 'error' && (
                  <span className="text-red-600 font-bold flex items-center gap-1">
                    Error: {photo.error || "Unknown failure"}
                  </span>
                )}
              </div>
            </div>
            <div>
              {photo.status === 'done' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : photo.status === 'analyzing' ? (
                <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
              ) : photo.status === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
