import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { Button } from './Button';

interface UploadAreaProps {
  onFilesSelected: (files: File[]) => void;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ onFilesSelected }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = (Array.from(e.dataTransfer.files) as File[]).filter(file => 
        file.type.startsWith('image/')
      );
      setPreviewFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = (Array.from(e.target.files) as File[]).filter(file => 
        file.type.startsWith('image/')
      );
      setPreviewFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setPreviewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleStartUpload = () => {
    if (previewFiles.length > 0) {
      onFilesSelected(previewFiles);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div 
        className={`relative border-2 border-dashed rounded-2xl p-10 transition-all text-center ${
          isDragging 
            ? 'border-brand-500 bg-brand-50' 
            : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileInput}
          className="hidden" 
          multiple 
          accept="image/*"
        />
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-white rounded-full shadow-sm ring-1 ring-slate-100">
            <Upload className="w-8 h-8 text-brand-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Upload your photos</h3>
            <p className="text-slate-500 text-sm mt-1">Drag and drop 3-10 similar photos here</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
          >
            Select Files
          </Button>
        </div>
      </div>

      {previewFiles.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-slate-700">Selected Photos ({previewFiles.length})</h4>
            <button 
              onClick={() => setPreviewFiles([])}
              className="text-xs text-red-500 hover:text-red-600"
            >
              Clear all
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {previewFiles.map((file, idx) => (
              <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100">
                <img 
                  src={URL.createObjectURL(file)} 
                  alt="preview" 
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" 
                />
                <button 
                  onClick={() => removeFile(idx)}
                  className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Button 
              size="lg" 
              onClick={handleStartUpload}
              className="w-full md:w-auto"
            >
              Start Analysis
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};