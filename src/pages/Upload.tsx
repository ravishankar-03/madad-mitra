import React, { useState, useRef } from 'react';
import { Upload as UploadIcon, FileText, CheckCircle2, Loader2, X, Plus, Copy, Edit3, ZoomIn, Maximize2, Activity as ActivityIcon, Sparkles, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';
import { extractNeedsFromText, extractNeedsFromImage } from '../lib/gemini';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import SmartIntakeModal from '../components/SmartIntakeModal';

interface ExtractedNeed {
  type: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  location: string;
  source_text: string;
  estimated_impact: string;
  resource_match: string;
  confidence: number;
}

export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [files, setFiles] = useState<{ id: string, name: string, size: string, status: string, progress: number }[]>([]);
  const [extractedData, setExtractedData] = useState<ExtractedNeed[] | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const newFile = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      status: 'AI Analyzing text...',
      progress: 30
    };

    setFiles(prev => [newFile, ...prev]);
    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        setPreviewImage(base64);
        const base64Content = base64.split(',')[1];
        
        // Update progress
        setFiles(prev => prev.map(f => f.id === newFile.id ? { ...f, progress: 60, status: 'Gemini AI Analyzing...' } : f));

        const needs = await extractNeedsFromImage(base64Content, file.type);
        
        if (needs && needs.length > 0) {
          setExtractedData(needs);
          setFiles(prev => prev.map(f => f.id === newFile.id ? { ...f, status: 'Extraction complete', progress: 100 } : f));
        } else {
          setFiles(prev => prev.map(f => f.id === newFile.id ? { ...f, status: 'No data found or extraction error', progress: 100 } : f));
        }
        
        setIsUploading(false);
      };
      reader.onerror = () => {
        setFiles(prev => prev.map(f => f.id === newFile.id ? { ...f, status: 'File read error', progress: 0 } : f));
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload error:", error);
      setFiles(prev => prev.map(f => f.id === newFile.id ? { ...f, status: 'System error', progress: 0 } : f));
      setIsUploading(false);
    }
  };

  const approveAndFinalize = async () => {
    if (!extractedData) return;

    try {
      for (const need of extractedData) {
        await addDoc(collection(db, 'needs'), {
          ...need,
          timestamp: new Date().toISOString(),
          status: 'Pending',
          ai_confidence: need.confidence || 0.95
        });

        await addDoc(collection(db, 'activities'), {
          type: 'survey_processed',
          description: `Survey data processed: ${need.type}`,
          details: `Located in ${need.location}`,
          timestamp: new Date().toISOString(),
          status: 'success'
        });
      }
      
      alert("Data approved and saved to database!");
      setExtractedData(null);
      setPreviewImage(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'needs');
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-4 duration-500 bg-slate-50 dark:bg-slate-950 transition-colors min-h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 sm:gap-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Upload & OCR</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Ingest community surveys and handwritten requests for AI-powered processing.</p>
        </div>
        <button 
          onClick={() => setIsIntakeOpen(true)}
          className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-blue-600 dark:bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-blue-700 dark:hover:bg-indigo-500 transition-all shadow-xl shadow-blue-100 dark:shadow-indigo-900/20 active:scale-95"
        >
          <Sparkles size={18} />
          <span className="text-xs sm:text-sm uppercase tracking-wider">Launch Smart Intake</span>
        </button>
      </div>

      <SmartIntakeModal 
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        initialNeeds={extractedData}
        onSuccess={(count) => {
          console.log(`Structured ${count} report entries`);
          setExtractedData(null);
          setPreviewImage(null);
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="group relative bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 sm:p-16 flex flex-col items-center justify-center gap-6 hover:border-blue-400 dark:hover:border-indigo-500 hover:bg-blue-50/30 dark:hover:bg-indigo-900/10 transition-all cursor-pointer"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept="image/*,application/pdf"
            />
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center group-hover:rotate-6 group-hover:scale-110 transition-all duration-500 shadow-sm border border-slate-100 dark:border-slate-700">
              <UploadIcon className="text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-indigo-400 transition-colors" size={28} />
            </div>
            <div className="text-center px-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Drag & Drop Files</h3>
              <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-medium mt-1">Supports PDF, PNG, and JPEG.</p>
            </div>
            <button className="px-8 sm:px-10 py-2.5 sm:py-3 bg-slate-950 dark:bg-indigo-600 text-white text-xs sm:text-sm font-bold rounded-2xl hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all shadow-xl shadow-slate-200 dark:shadow-indigo-900/40">
              Browse Files
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm transition-colors">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/50">
              <div className="flex flex-col">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white italic">Current Queue</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest leading-none mt-1">Ingestion Pipeline</p>
              </div>
              <span className="px-3 py-1 bg-slate-950 dark:bg-indigo-600 text-white text-[10px] font-black tracking-widest rounded-full">{files.length} ACTIVE</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {files.length === 0 ? (
                <div className="p-20 text-center">
                   <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-700">
                     <FileText size={20} className="text-slate-300 dark:text-slate-600" />
                   </div>
                   <p className="text-sm font-bold text-slate-400 dark:text-slate-500">No active files in queue</p>
                </div>
              ) : (
                files.map(file => (
                  <div key={file.id} className="p-6 group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all cursor-default">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                          file.progress === 100 ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 shadow-sm" : "bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 border border-blue-100 dark:border-blue-800 shadow-sm"
                        )}>
                          <FileText size={20} />
                        </div>
                        <div>
                          <h5 className="text-sm font-bold text-slate-900 dark:text-white">{file.name}</h5>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{file.size}</span>
                            <span className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-widest",
                              file.progress === 100 ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"
                            )}>
                              {file.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.progress === 100 ? (
                          <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center scale-in">
                            <CheckCircle2 size={16} />
                          </div>
                        ) : (
                          <button 
                            onClick={() => setFiles(prev => prev.filter(f => f.id !== file.id))}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-500 dark:hover:text-rose-400 transition-all"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        <span>Progress</span>
                        <span>{file.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-1000",
                            file.progress === 100 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-blue-600 dark:bg-indigo-500 shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                          )} 
                          style={{ width: `${file.progress}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {files.length > 0 && (
              <button className="w-full py-5 text-center text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all border-t border-slate-100 dark:border-slate-800">
                View Full Queue
              </button>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm transition-colors flex flex-col lg:min-h-[700px]">
          <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/50">
            <div className="flex flex-col">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white italic">Latest Extraction</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest leading-none mt-1">AI Intelligence Layer</p>
            </div>
            {extractedData && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest whitespace-nowrap">98.2% Confidence</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 flex flex-col divide-y divide-slate-100 dark:divide-slate-800 lg:min-h-0 bg-slate-50/30 dark:bg-slate-800/20">
            <div className="h-[300px] lg:h-2/5 p-4 sm:p-8 relative flex flex-col gap-4 overflow-auto">
              <div className="flex justify-between items-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-3 rounded-2xl border border-white dark:border-slate-800 sticky top-0 z-10 shadow-sm transition-colors">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">Original Source</span>
                <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500">
                  <ZoomIn size={16} className="cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors" />
                  <Maximize2 size={16} className="cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors" />
                </div>
              </div>
              {previewImage ? (
                <div className="relative rounded-3xl border-4 border-white dark:border-slate-800 shadow-2xl overflow-hidden bg-white dark:bg-slate-950 group transition-all">
                  <img src={previewImage} alt="Preview" className="w-full h-auto transform group-hover:scale-[1.02] transition-transform duration-700" />
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/0 via-blue-500 to-blue-500/0 animate-scan z-10" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 dark:to-black/40" />
                </div>
              ) : (
                <div className="flex-1 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 italic text-sm gap-4 bg-white/50 dark:bg-slate-900/50 transition-colors">
                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
                    <Loader2 size={24} className="animate-spin text-slate-200 dark:text-slate-700" />
                  </div>
                  <span className="font-bold text-slate-300 dark:text-slate-600">Waiting for document ingestion...</span>
                </div>
              )}
            </div>

            <div className="flex-1 bg-white dark:bg-slate-900 overflow-hidden flex flex-col transition-colors">
              <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-indigo-900/30 border border-blue-100 dark:border-indigo-800 flex items-center justify-center">
                     <Sparkles size={14} className="text-blue-600 dark:text-indigo-400" />
                   </div>
                   <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Extracted Intelligence</span>
                </div>
                <button 
                  onClick={() => extractedData && navigator.clipboard.writeText(JSON.stringify(extractedData, null, 2))}
                  className="flex items-center gap-2 text-[10px] font-black text-blue-600 dark:text-indigo-400 uppercase tracking-widest hover:bg-blue-50 dark:hover:bg-indigo-900/50 px-3 py-1.5 rounded-lg transition-all"
                >
                  <Copy size={12} />
                  Copy JSON
                </button>
              </div>
              <div className="flex-1 p-6 overflow-auto custom-scrollbar">
                {isUploading ? (
                  <div className="h-full flex flex-col items-center justify-center gap-6">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-blue-100 dark:border-slate-800 border-t-blue-600 dark:border-t-indigo-500 rounded-full animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles size={18} className="text-blue-400 dark:text-indigo-400 animate-pulse" />
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-bold text-slate-900 dark:text-white block">LLM Processing</span>
                      <span className="text-[10px] font-black uppercase text-blue-600 dark:text-indigo-400 tracking-[0.2em] mt-1 block animate-pulse">Running Gemini Inference</span>
                    </div>
                  </div>
                ) : extractedData ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {extractedData.map((need, idx) => (
                      <div key={idx} className="group p-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] hover:bg-white dark:hover:bg-slate-700/50 hover:border-blue-200 dark:hover:border-indigo-500 hover:shadow-xl hover:shadow-blue-50/50 dark:hover:shadow-indigo-900/20 transition-all duration-300">
                        <div className="flex justify-between items-start mb-3">
                          <div className="space-y-1">
                            <h5 className="font-bold text-slate-900 dark:text-white leading-tight">
                              {need.type}
                            </h5>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                              <MapPin size={10} className="text-slate-300 dark:text-slate-600" />
                              {need.location}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                             <span className={cn(
                              "px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-full shadow-sm",
                              need.urgency === 'Critical' ? "bg-rose-500 text-white shadow-rose-100 dark:shadow-rose-900/20" :
                              need.urgency === 'High' ? "bg-orange-500 text-white shadow-orange-100 dark:shadow-orange-900/20" :
                              need.urgency === 'Medium' ? "bg-amber-500 text-white shadow-amber-100 dark:shadow-amber-900/20" : "bg-emerald-500 text-white shadow-emerald-100 dark:shadow-emerald-900/20"
                            )}>
                              {need.urgency}
                            </span>
                            {need.confidence && (
                              <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 italic">
                                {Math.round(need.confidence * 100)}% Match
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic font-medium leading-relaxed border-l-2 border-slate-200 dark:border-slate-600 pl-3 mb-4 transition-colors">
                          "{need.source_text}"
                        </p>
                        <div className="flex gap-2">
                           <div className="flex-1 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors">
                             <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 leading-none">Impact Context</p>
                             <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-tight">{need.estimated_impact}</p>
                           </div>
                           <div className="flex-1 p-2.5 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50 transition-colors">
                             <p className="text-[8px] font-black text-indigo-400 dark:text-indigo-300 uppercase tracking-widest mb-1 leading-none">Resource Fit</p>
                             <p className="text-[10px] font-bold text-indigo-900 dark:text-indigo-200 leading-tight">{need.resource_match}</p>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 gap-4 opacity-50">
                    <div className="w-20 h-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center">
                      <Edit3 size={32} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.2em]">Neural Output Pending</span>
                  </div>
                )}
              </div>
              
              {extractedData && (
                <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex flex-wrap sm:flex-nowrap gap-3 sm:gap-4 shrink-0 transition-colors">
                  <button 
                    onClick={approveAndFinalize}
                    className="flex-[2] py-4 bg-slate-950 dark:bg-indigo-600 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all shadow-xl shadow-slate-200 dark:shadow-indigo-950 flex items-center justify-center gap-2 sm:gap-3 group active:scale-95"
                  >
                    <CheckCircle2 size={16} className="text-emerald-400 dark:text-emerald-300 group-hover:scale-125 transition-transform" />
                    Approve
                  </button>
                  <button 
                    onClick={() => {
                      setExtractedData(null);
                      setPreviewImage(null);
                    }}
                    className="flex-1 py-4 bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/50 text-rose-500 dark:text-rose-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all flex items-center justify-center gap-2 sm:gap-3 active:scale-95"
                  >
                    <X size={16} />
                    Discard
                  </button>
                  <button 
                    onClick={() => setIsIntakeOpen(true)}
                    className="flex-1 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 sm:gap-3 active:scale-95"
                  >
                    <Edit3 size={16} />
                    Refine
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 dark:bg-indigo-900/30 text-blue-600 dark:text-indigo-400 rounded flex items-center justify-center">
              <ActivityIcon size={12} />
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Gemini 1.5 Model Active</span>
          </div>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Storage Usage:</span>
            <div className="w-32 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-slate-400 dark:bg-indigo-500 w-[12%]" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">12.4 GB / 100 GB</span>
          </div>
        </div>
        <button className="text-xs font-bold text-blue-600 dark:text-indigo-400 uppercase tracking-widest hover:text-blue-700 dark:hover:text-indigo-300 transition-all">
          View API Documentation
        </button>
      </div>

      <button className="fixed bottom-10 right-10 w-14 h-14 bg-blue-600 dark:bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-30 ring-4 ring-white dark:ring-slate-900">
        <Plus size={24} />
      </button>
    </div>
  );
}
