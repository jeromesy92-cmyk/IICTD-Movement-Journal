import React, { useState, useEffect } from 'react';
import { X, Bug, AlertCircle, CheckCircle, RefreshCw, Terminal, Lightbulb, ExternalLink } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import Modal from './Modal';

interface SystemError {
  id: string;
  timestamp: Date;
  message: string;
  stack?: string;
  type: 'error' | 'warning' | 'network';
  solution?: string;
  isSolving?: boolean;
}

interface DebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  errors: SystemError[];
  onClear: () => void;
}

export default function DebugModal({ isOpen, onClose, errors, onClear }: DebugModalProps) {
  const [solvingId, setSolvingId] = useState<string | null>(null);
  const [solutions, setSolutions] = useState<Record<string, string>>({});

  const getSolution = async (error: SystemError) => {
    if (solutions[error.id]) return;
    
    setSolvingId(error.id);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `I have a system error in my React/Express application. 
        Error Message: ${error.message}
        Error Type: ${error.type}
        Stack Trace: ${error.stack || 'N/A'}
        
        Please provide a concise, actionable solution or fix for this error. 
        Format the response in Markdown.`,
      });
      
      const solutionText = response.text || "No specific solution found. Try refreshing the page or checking server logs.";
      setSolutions(prev => ({ ...prev, [error.id]: solutionText }));
    } catch (err) {
      console.error("Failed to get solution:", err);
      setSolutions(prev => ({ ...prev, [error.id]: "Failed to connect to AI service. Please check your internet connection." }));
    } finally {
      setSolvingId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      size="2xl"
      className="max-h-[80vh] flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Bug className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">System Debug Console</h2>
            <p className="text-xs text-muted-foreground">Monitor and resolve system issues in real-time.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {errors.length > 0 && (
            <button 
              onClick={onClear}
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground px-3 py-1 rounded-lg hover:bg-accent transition-all"
            >
              Clear All
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {errors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-foreground">System Healthy</h3>
            <p className="text-sm text-muted-foreground max-w-xs">No errors or bugs detected in the current session. Everything is running smoothly.</p>
          </div>
        ) : (
          errors.map((error) => (
            <div key={error.id} className="group border border-border rounded-2xl overflow-hidden bg-muted/20 hover:border-primary/30 transition-all">
              <div className="p-4 flex gap-4">
                <div className={`mt-1 w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${
                  error.type === 'error' ? 'bg-destructive/10 text-destructive' : 
                  error.type === 'network' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                }`}>
                  {error.type === 'network' ? <RefreshCw className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {error.type} • {error.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground break-words">{error.message}</p>
                  
                  {error.stack && (
                    <div className="mt-2 p-3 bg-black/20 rounded-lg font-mono text-[10px] text-muted-foreground overflow-x-auto whitespace-pre">
                      {error.stack.split('\n').slice(0, 3).join('\n')}...
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-2">
                    {!solutions[error.id] ? (
                      <button
                        onClick={() => getSolution(error)}
                        disabled={solvingId === error.id}
                        className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                      >
                        {solvingId === error.id ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Lightbulb className="w-3 h-3" />
                            Get AI Solution
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="w-full mt-2 p-4 bg-primary/5 border border-primary/10 rounded-xl">
                        <div className="flex items-center gap-2 mb-2 text-primary">
                          <Lightbulb className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Suggested Fix</span>
                        </div>
                        <div className="text-xs text-foreground leading-relaxed prose prose-invert prose-sm max-w-none">
                          {solutions[error.id]}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <Terminal className="w-3 h-3" />
          Session Logs Active
        </div>
        <div className="text-[10px] text-muted-foreground">
          {errors.length} issues detected
        </div>
      </div>
    </Modal>
  );
}
