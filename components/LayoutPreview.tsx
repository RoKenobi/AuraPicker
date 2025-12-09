import React, { useState } from 'react';
import { PhotoData } from '../types';
import { Maximize2, Smartphone } from 'lucide-react';

interface LayoutPreviewProps {
  photo: PhotoData;
}

export const LayoutPreview: React.FC<LayoutPreviewProps> = ({ photo }) => {
  const [format, setFormat] = useState<'square' | 'portrait' | 'story'>('portrait');
  
  // Suggested crop from AI (mock logic usage or display text)
  const suggestion = photo.analysis?.cropSuggestion || "Center subject";

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
           <Smartphone className="w-4 h-4" /> Preview
        </div>
        <div className="flex space-x-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
          <button 
            onClick={() => setFormat('square')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${format === 'square' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}
          >
            1:1
          </button>
          <button 
            onClick={() => setFormat('portrait')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${format === 'portrait' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}
          >
            4:5
          </button>
          <button 
            onClick={() => setFormat('story')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${format === 'story' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}
          >
            9:16
          </button>
        </div>
      </div>

      <div className="flex-1 bg-slate-100 relative overflow-hidden flex items-center justify-center p-8">
         {/* Mock Instagram Interface Container */}
         <div className="w-[300px] bg-white shadow-xl rounded-xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="h-12 border-b flex items-center px-4 space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[2px]">
                <div className="w-full h-full rounded-full bg-white border-2 border-transparent"></div>
              </div>
              <div className="flex-1">
                <div className="h-2 w-20 bg-slate-200 rounded"></div>
              </div>
            </div>
            
            {/* Image Area */}
            <div className={`w-full bg-black relative transition-all duration-300 ease-in-out ${
              format === 'square' ? 'aspect-square' : format === 'portrait' ? 'aspect-[4/5]' : 'aspect-[9/16]'
            }`}>
              <img 
                src={photo.previewUrl} 
                alt="preview" 
                className="w-full h-full object-cover"
              />
              
              {/* Crop guides overlay */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-30">
                 <div className="border-r border-white/50"></div>
                 <div className="border-r border-white/50"></div>
                 <div className=""></div>
                 <div className="border-r border-white/50 border-t"></div>
                 <div className="border-r border-white/50 border-t"></div>
                 <div className="border-t border-white/50"></div>
                 <div className="border-r border-white/50 border-t"></div>
                 <div className="border-r border-white/50 border-t"></div>
                 <div className="border-t border-white/50"></div>
              </div>
            </div>

            {/* Footer Mockup */}
            {format !== 'story' && (
              <div className="p-4 space-y-3">
                <div className="flex space-x-4">
                  <div className="w-5 h-5 rounded bg-slate-200"></div>
                  <div className="w-5 h-5 rounded bg-slate-200"></div>
                  <div className="w-5 h-5 rounded bg-slate-200"></div>
                </div>
                <div className="space-y-1">
                  <div className="w-full h-2 rounded bg-slate-100"></div>
                  <div className="w-2/3 h-2 rounded bg-slate-100"></div>
                </div>
              </div>
            )}
         </div>
      </div>
      
      <div className="bg-white p-4 text-xs text-slate-500 border-t border-slate-100 flex items-start gap-2">
        <Maximize2 className="w-4 h-4 text-brand-500 mt-0.5" />
        <p><span className="font-semibold text-slate-700">AI Suggestion:</span> {suggestion}</p>
      </div>
    </div>
  );
};