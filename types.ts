
export interface AnalysisResult {
  aestheticScore: number; 
  vibes: string[]; 
  vibeCategory?: {
    aesthetic: string;
    genz: string;
    moment: string;
  };
  bestFor: string; 
  vibeDescription: string;
  critique: string;
  cropSuggestion: string;
  bestFitFormat: '1:1' | '4:5' | '9:16';
  bestCrop: 'Original' | '1:1 Center' | '1:1 Zoomed' | '4:5 Center' | '4:5 Upper' | '9:16 Story';
  cropAlignment: 'center' | 'top' | 'bottom';
  cropReason: string;
  hashtags: string[];
}

export interface PhotoData {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'analyzing' | 'done' | 'error';
  analysis?: AnalysisResult;
  error?: string;
}

export type AppState = 'upload' | 'analysis' | 'results';

export interface CropConfig {
  aspectRatio: number; 
  label: string;
}
