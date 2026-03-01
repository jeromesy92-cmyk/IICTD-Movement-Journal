import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bug, X, CheckCircle, RefreshCcw, Trash2, LogOut, AlertTriangle, Zap } from 'lucide-react';
import { analyzeError, Diagnosis } from '../services/aiSupport';
import { toast } from 'react-hot-toast';

interface SupportAIProps {
  errors: any[];
  onClearErrors: () => void;
}

export default function SupportAI({ errors, onClearErrors }: SupportAIProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [lastErrorId, setLastErrorId] = useState<string | null>(null);

  useEffect(() => {
    if (errors.length > 0) {
      const latestError = errors[0];
      if (latestError.id !== lastErrorId) {
        setLastErrorId(latestError.id);
        setIsOpen(true);
        handleAnalyze(latestError);
      }
    }
  }, [errors]);

  const handleAnalyze = async (error: any) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeError(error);
      setDiagnosis(result);
      
      // Auto-fix logic if confidence is high
      if (result.confidence > 0.8) {
        toast.promise(
          new Promise((resolve) => setTimeout(resolve, 2000)),
          {
            loading: 'AI is attempting to fix the issue...',
            success: 'Fix applied successfully!',
            error: 'Could not auto-fix.',
          }
        ).then(() => {
          handleApplyFix(result.suggestedAction);
        });
      }
    } catch (err) {
      console.error("AI Analysis failed", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyFix = (action: string) => {
    switch (action) {
      case 'reload':
        window.location.reload();
        break;
      case 'clear_cache':
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
        break;
      case 'retry':
        // Simulate retry by reloading or re-fetching data (if applicable)
        window.location.reload(); 
        break;
      case 'logout':
        localStorage.removeItem('user');
        window.location.href = '/login';
        break;
      default:
        toast('No automatic fix available. Please contact support.', { icon: 'ℹ️' });
    }
    onClearErrors();
    setIsOpen(false);
  };

  if (!isOpen && errors.length === 0) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-50 w-96 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="bg-primary p-4 flex items-center justify-between text-primary-foreground">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 animate-pulse" />
              <h3 className="font-bold text-sm">AI Support Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-primary-foreground/20 p-1 rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground animate-pulse">Analyzing system error...</p>
              </div>
            ) : diagnosis ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-muted/50 p-3 rounded-xl border border-border">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-foreground mb-1">Issue Detected</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{diagnosis.explanation}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Recommended Action</p>
                  {diagnosis.suggestedAction !== 'none' ? (
                    <button
                      onClick={() => handleApplyFix(diagnosis.suggestedAction)}
                      className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                      {diagnosis.suggestedAction === 'reload' && <RefreshCcw className="w-4 h-4" />}
                      {diagnosis.suggestedAction === 'clear_cache' && <Trash2 className="w-4 h-4" />}
                      {diagnosis.suggestedAction === 'logout' && <LogOut className="w-4 h-4" />}
                      {diagnosis.suggestedAction === 'retry' && <RefreshCcw className="w-4 h-4" />}
                      <span>
                        {diagnosis.suggestedAction === 'reload' && 'Reload Application'}
                        {diagnosis.suggestedAction === 'clear_cache' && 'Clear Cache & Restart'}
                        {diagnosis.suggestedAction === 'logout' && 'Log Out & Re-authenticate'}
                        {diagnosis.suggestedAction === 'retry' && 'Retry Operation'}
                      </span>
                    </button>
                  ) : (
                    <div className="text-center py-4 text-sm text-muted-foreground bg-muted/30 rounded-xl">
                      No automatic fix available. Please contact human support.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Waiting for analysis...</p>
              </div>
            )}
          </div>
          
          <div className="bg-muted/30 p-3 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
            <span>Powered by Gemini AI</span>
            <button onClick={onClearErrors} className="hover:text-foreground transition-colors">Dismiss</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
