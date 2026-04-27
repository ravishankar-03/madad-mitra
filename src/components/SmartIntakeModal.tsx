import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Clipboard, FileType, MapPin, AlertCircle, LayoutGrid, Loader2, CheckCircle2 } from 'lucide-react';
import { extractNeedsFromText } from '../lib/gemini';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';

interface SmartIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
  initialNeeds?: any[] | null;
}

export default function SmartIntakeModal({ isOpen, onClose, onSuccess, initialNeeds }: SmartIntakeModalProps) {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedNeeds, setExtractedNeeds] = useState<any[] | null>(null);

  // Sync with initialNeeds when modal opens
  React.useEffect(() => {
    if (isOpen && initialNeeds) {
      setExtractedNeeds(initialNeeds);
    } else if (isOpen && !initialNeeds) {
      setExtractedNeeds(null);
      setInputText('');
    }
  }, [isOpen, initialNeeds]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
    } catch (err) {
      console.error('Failed to read clipboard', err);
    }
  };

  const handleProcess = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    setExtractedNeeds(null);
    try {
      const needs = await extractNeedsFromText(inputText);
      setExtractedNeeds(needs);
    } catch (error) {
      console.error("Processing error:", error);
      setExtractedNeeds([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const finalizeIntake = async () => {
    if (!extractedNeeds) return;
    
    try {
      for (const need of extractedNeeds) {
        await addDoc(collection(db, 'needs'), {
          ...need,
          timestamp: new Date().toISOString(),
          status: 'Pending',
          ai_confidence: need.confidence || 0.92
        });

        await addDoc(collection(db, 'activities'), {
          type: 'need_flagged',
          description: `AI Extracted: ${need.type}`,
          details: `In ${need.location || 'Unknown'}. Source: Manual Intake.`,
          timestamp: new Date().toISOString(),
          status: 'success'
        });
      }
      onSuccess(extractedNeeds.length);
      onClose();
      setInputText('');
      setExtractedNeeds(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'needs');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-colors"
          >
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-950 dark:bg-indigo-600 rounded-2xl text-white">
                  <LayoutGrid size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Smart Intake Processor</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Paste field reports or interview snippets. AI will automatically structure identified needs.</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {!extractedNeeds ? (
                <>
                  <div className="relative group">
                    <textarea 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Example: We visited the West End today. Several families near the old mill are reporting a critical lack of clean water. Also, the community center roof is leaking badly, affecting about 3 families..."
                      className="w-full h-80 p-8 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-3xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-950 dark:focus:ring-indigo-500 focus:border-transparent transition-all resize-none leading-relaxed text-slate-700 dark:text-slate-200"
                    />
                    <div className="absolute top-4 right-4 flex gap-2">
                       <button className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
                        <FileType size={12} />
                        Manual Input Mode
                      </button>
                    </div>
                    <div className="absolute bottom-4 right-4 flex gap-3">
                      <button 
                        onClick={handlePaste}
                        className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                      >
                        <Clipboard size={14} />
                        Paste Clipboard
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-center gap-4 transition-colors">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Geo-Extraction</h4>
                        <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Automatic Address Detection</p>
                      </div>
                    </div>
                    <div className="p-4 bg-orange-50/50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/30 flex items-center gap-4 transition-colors">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
                        <AlertCircle size={18} />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Urgency Scoring</h4>
                        <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Sentiment & Needs Mapping</p>
                      </div>
                    </div>
                    <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-4 transition-colors">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                        <LayoutGrid size={18} />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Taxonomy</h4>
                        <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Resource Categorization</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg">
                         <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-indigo-400 rounded-full animate-pulse" />
                         <span className="text-[8px] font-black uppercase text-blue-800 dark:text-indigo-300 tracking-widest">Inference Engine: Gemini Focus</span>
                       </div>
                       <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">V4.2.0-STABLE</span>
                    </div>
                    
                    <div className="flex gap-4">
                      <button 
                        onClick={onClose}
                        className="px-8 py-4 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                      >
                        Discard
                      </button>
                      <button 
                        onClick={handleProcess}
                        disabled={isProcessing || !inputText.trim()}
                        className="px-12 py-4 bg-slate-950 dark:bg-indigo-600 text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-slate-800 dark:hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-slate-200 dark:shadow-indigo-900/40 overflow-hidden relative group"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="animate-spin" size={20} />
                            PROCESSING...
                          </>
                        ) : (
                          <>
                            <Sparkles size={20} />
                            STRUCTURE FIELD INTELLIGENCE
                          </>
                        )}
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      </button>
                    </div>
                  </div>
                </>
              ) : extractedNeeds.length > 0 ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-4 rounded-2xl transition-colors">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={24} className="text-emerald-500 dark:text-emerald-400" />
                      <div>
                        <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">Extracted {extractedNeeds.length} Resource Needs</h4>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">AI normalized results. Please review before finalizing.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setExtractedNeeds(null)}
                      className="text-xs font-bold text-emerald-700 dark:text-emerald-400 underline"
                    >
                      Clear & Redo
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {extractedNeeds.map((need, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl space-y-4 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-bold text-slate-900 dark:text-white leading-none mb-1">{need.type}</h5>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-tight">
                              <MapPin size={10} />
                              {need.location}
                            </div>
                            {need.confidence && (
                              <div className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 uppercase tracking-widest">
                                {Math.round(need.confidence * 100)}% Confidence
                              </div>
                            )}
                          </div>
                          <span className={cn(
                            "px-2 py-0.5 text-[8px] font-black uppercase rounded-sm shadow-sm",
                            need.urgency === 'Critical' ? "bg-rose-600 text-white" :
                            need.urgency === 'High' ? "bg-orange-600 text-white" :
                            need.urgency === 'Medium' ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
                          )}>
                            {need.urgency}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">"{need.source_text}"</p>
                        <div className="grid grid-cols-2 gap-2">
                           <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-700 transition-colors">
                             <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Impact</p>
                             <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{need.estimated_impact}</p>
                           </div>
                           <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-700 transition-colors">
                             <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Match</p>
                             <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{need.resource_match}</p>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button 
                        onClick={() => setExtractedNeeds(null)}
                        className="px-8 py-4 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                      >
                        Back to Input
                      </button>
                      <button 
                        onClick={finalizeIntake}
                        className="px-12 py-4 bg-emerald-600 dark:bg-emerald-500 text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-emerald-700 dark:hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-100 dark:shadow-emerald-900/20"
                      >
                        <CheckCircle2 size={20} />
                        APPROVE & SAVE TO DATABASE
                      </button>
                    </div>
                  </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 transition-colors">
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500">
                      <AlertCircle size={32} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Needs Extracted</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">The report was either too vague, or no specific community needs were identified. You can try providing more detail.</p>
                    </div>
                    <button 
                      onClick={() => setExtractedNeeds(null)}
                      className="mt-4 px-8 py-3 bg-slate-950 dark:bg-indigo-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all"
                    >
                      Return and Revise Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
