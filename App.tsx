import React, { useState, useEffect } from "react";
import { TaskType, MarksStatus, ModuleRule, AppMode, LogEntry } from "./types";
import { AlertCircle, CheckCircle2, HelpCircle, BookOpen, GraduationCap, FileText, RotateCcw, Sparkles, Copy, Check, ShieldAlert, ListChecks, Lock, PenTool, BrainCircuit, Ghost, Zap, Scale, ArrowRight, Brain, Lightbulb, Microscope, Quote, GitBranch, Target, Layers, ArrowLeft, ChevronRight, Share2, ScrollText, MessageSquare, Plus, Trash2, Download, ClipboardList } from "lucide-react";

// --- LOGO CONFIGURATION ---
const UKZN_LOGO_SRC = "https://upload.wikimedia.org/wikipedia/en/5/56/University_of_KwaZulu-Natal_logo.svg";
// --------------------------

// UKZN Brand Colors
const UKZN_COLORS = ["#ED1C24", "#F99D1C", "#FFDD00", "#00A651", "#00AEEF"];
// Reversed for Right and Bottom strips to create the seamless loop
const UKZN_COLORS_REVERSED = [...UKZN_COLORS].reverse();

// Hook to detect mobile view
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    // Increased breakpoint to 1024px to treat Tablets (iPad Portrait) as mobile devices
    // This gives tablets the nicer 'Wizard' view instead of the crowded Desktop view.
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return isMobile;
};

export default function App() {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<AppMode | null>(null);
  const [taskType, setTaskType] = useState<TaskType | null>(null);
  const [forMarks, setForMarks] = useState<MarksStatus | null>(null);
  const [moduleRule, setModuleRule] = useState<ModuleRule | null>(null);
  
  // Mobile Wizard State
  // 0 = Mode Select, 1 = Task, 2 = Marks, 3 = Rule (if needed), 4 = Result
  const [mobileStep, setMobileStep] = useState(0);

  // Critical Thinking Detail State (Mobile)
  const [activePromptIndex, setActivePromptIndex] = useState<number | null>(null);

  // Log Mode State
  const [logContext, setLogContext] = useState<TaskType | 'generic'>('generic');
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState({ prompt: '', output: '', refinement: '' });
  const [showDeclaration, setShowDeclaration] = useState(false);

  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Helper to check task types
  const isResearch = taskType === 'research';
  const isAssignment = taskType === 'assignment';
  const isStudy = taskType === 'study';

  // Sync Mobile Step with selections
  useEffect(() => {
    if (mode === null) {
      setMobileStep(0);
      setActivePromptIndex(null);
    }
    else if (mode === 'advice' || mode === 'critical-thinking' || mode === 'log') setMobileStep(1); 
    else if (mode === 'compliance') {
        if (!taskType) setMobileStep(1);
        else if (!forMarks) setMobileStep(2);
        else if (forMarks === 'yes' && !moduleRule) setMobileStep(3);
        else setMobileStep(4); // Result
    }
  }, [mode, taskType, forMarks, moduleRule]);


  // Reset downstream choices if upstream changes
  useEffect(() => {
    if (forMarks !== 'yes') {
      setModuleRule(null);
    }
  }, [forMarks]);

  // Reset prompt UI when any selection changes
  useEffect(() => {
    setShowPrompt(false);
    setCopied(false);
  }, [taskType, forMarks, moduleRule]);

  const resetForm = () => {
    setMode(null);
    setTaskType(null);
    setForMarks(null);
    setModuleRule(null);
    setShowPrompt(false);
    setCopiedIndex(null);
    setMobileStep(0);
    setActivePromptIndex(null);
    // Don't reset logEntries here so they persist if user checks rules and comes back, 
    // but maybe we want to keep them? Let's keep them for session.
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'UKZN Student AI Guide',
          text: 'Check if you can use AI for your assignment and how to use it critically.',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleBack = () => {
    // 1. Critical Thinking Detail -> List
    if (mode === 'critical-thinking' && activePromptIndex !== null) {
        setActivePromptIndex(null);
        return;
    }

    // 2. Critical Thinking List -> Advice (The screen before it)
    if (mode === 'critical-thinking' && activePromptIndex === null) {
        setMode('advice');
        return;
    }

    // 3. Advice -> Home
    if (mode === 'advice') {
        setMode(null);
        return;
    }
    
    // 4. Log -> Home
    if (mode === 'log') {
        setMode(null);
        return;
    }

    // 5. Compliance Wizard Back
    if (mode === 'compliance') {
        if (mobileStep === 4) {
            // From Result
            if (forMarks === 'yes') setModuleRule(null); // Clear rule to go back to rule step or marks step
            else setForMarks(null); // Clear marks to go back to marks step
            return;
        }
        if (mobileStep === 3) {
            setForMarks(null);
            return;
        }
        if (mobileStep === 2) {
            setTaskType(null);
            return;
        }
        if (mobileStep === 1) {
            setMode(null);
            return;
        }
    }
    
    // Default: Go back to Home
    setMode(null);
  };

  const isTerminalState = () => {
    if (!taskType) return false;
    if (forMarks === 'no') return true;
    if (forMarks === 'unsure') return true;
    if (forMarks === 'yes' && moduleRule) return true;
    return false;
  };

  const getSafePrompt = () => {
    if (!taskType || !forMarks) return "";

    // --- FORMATIVE (Learning/Practice) ---
    if (forMarks === 'no') {
      if (taskType === 'study') {
        // Study Logic: Tutor Mode (Socratic)
        return "I am studying this topic. Act as a strict tutor. Ask me 3 challenging questions to test my understanding. Wait for my answer, then correct me if I am wrong. Do not just give me the summary.";
      }
      if (taskType === 'assignment') {
        // Assignment Logic: Planner Mode
        return "I am planning an assignment on this topic. Help me brainstorm 3 different angles or structural outlines. Do not write the content, just help me organize my thoughts.";
      }
      return "I am reading complex research. Explain the key concepts in simple language to help me understand. Do not replace the reading.";
    }

    // --- UNSURE ---
    if (forMarks === 'unsure') {
      return "I need to ask my lecturer if AI is allowed. Write a polite, specific email asking if I can use AI for [insert specific task] in this assignment. Mention that I want to use it responsibly.";
    }

    // --- SUMMATIVE (For Marks) ---
    if (forMarks === 'yes') {
      
      // NO USE
      if (moduleRule === 'none') {
        return "I cannot use AI for this task. Please give me a study schedule to break this task down into small steps so I can do it myself without being overwhelmed.";
      }

      // LIMITED USE
      if (moduleRule === 'limited') {
        if (taskType === 'assignment') {
          // Assignment: Editor Mode (Clean up only)
          return "I have written this draft myself. Please highlight sentences that are unclear or grammatically incorrect. Do NOT rewrite the content or add new ideas. I must do the main thinking.";
        }
        if (taskType === 'study') {
          // Study: Quiz Generator (Test prep)
          return "Generate 5 practice questions on this topic similar to what might be in an exam. Do not give the answers immediately. Let me try first.";
        }
        return "I am analysing qualitative data. I will paste my own thematic notes. Suggest a coding structure. Do not generate new themes.";
      }

      // FULL USE
      if (moduleRule === 'full') {
        if (taskType === 'assignment') {
          // Assignment: Critical Friend (Critique)
          return "I have outlined my argument below. Act as a critical lecturer: point out gaps in my logic, weak evidence, or counter-arguments I missed. Do not write the essay for me.";
        }
        if (taskType === 'study') {
          // Study: Deep Dive (Analogy/Explanation)
          return "Explain this concept using a real-world analogy to help me remember it. Then ask me to explain it back to you to check if I really understand it.";
        }
        return "I am conducting research. Suggest 5 specific search terms for academic databases and identify key authors. Do not provide a bibliography.";
      }

      if (moduleRule === 'unknown') {
        return "I need to clarify the AI rules for my module. Draft a message to my lecturer asking specifically if [insert task] is permitted under the module outline.";
      }
    }
    return "";
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getSafePrompt());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const copySpecificPrompt = async (text: string, index: number) => {
    try {
      // Clean up the text for copying (remove the visual 'insert' markers if we were parsing them, 
      // but here we just copy the raw text with brackets)
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const renderButton = <T extends string>(
    value: T,
    currentValue: T | null,
    setValue: (val: T) => void,
    label: string,
    description?: string,
    icon?: React.ReactNode
  ) => {
    const isSelected = currentValue === value;
    
    const handleClick = () => {
        setValue(value);
        // On mobile, the useEffect will catch the state change and advance the step automatically
    };

    return (
      <button
        onClick={handleClick}
        className={`flex flex-col items-start gap-2 px-5 py-4 rounded-xl border transition-all duration-200 w-full text-left relative overflow-hidden group
          ${
            isSelected
              ? "bg-[#00AEEF] border-[#00AEEF] text-white shadow-md ring-2 ring-[#00AEEF]/30 ring-offset-1"
              : "bg-white border-gray-200 text-slate-700 hover:bg-slate-50 hover:border-[#00AEEF]/50"
          }
        `}
      >
        <div className="flex items-center gap-3 w-full">
          {icon && <span className={`${isSelected ? "text-white" : "text-[#00AEEF]"}`}>{icon}</span>}
          <span className="font-semibold text-lg">{label}</span>
          {isSelected && <Check className="ml-auto w-5 h-5 text-white" />}
        </div>
        {description && (
          <span className={`text-sm ${isSelected ? "text-blue-50" : "text-gray-500 group-hover:text-slate-600"}`}>
            {description}
          </span>
        )}
      </button>
    );
  };

  // Helper to render prompts with UKZN Orange 'insert' highlights
  const FormatPromptText = ({ text }: { text: string }) => {
    const parts = text.split(/(\[.*?\])/);
    return (
      <span>
        {parts.map((part, i) => {
          if (part.startsWith('[') && part.endsWith(']')) {
            const content = part.slice(1, -1);
            return (
              <span key={i} className="font-bold text-[#F99D1C] bg-orange-50 px-1 rounded mx-0.5">
                insert {content}
              </span>
            );
          }
          return part;
        })}
      </span>
    );
  };

  // --- LOG MODE FUNCTIONS ---
  const addLogEntry = () => {
    if (!currentEntry.prompt.trim()) return; // Must at least have a prompt
    const newEntry: LogEntry = {
        id: Date.now().toString(),
        prompt: currentEntry.prompt,
        output: currentEntry.output,
        refinement: currentEntry.refinement
    };
    setLogEntries([...logEntries, newEntry]);
    setCurrentEntry({ prompt: '', output: '', refinement: '' });
  };

  const deleteLogEntry = (id: string) => {
    setLogEntries(logEntries.filter(e => e.id !== id));
  };

  const generateDeclarationText = () => {
    const date = new Date().toLocaleDateString();
    const entriesText = logEntries.map((e, i) => 
`ENTRY ${i + 1}:
------------------------------------------
STEP 1: THE PROMPT (What I asked)
"${e.prompt}"

STEP 2: AI OUTPUT (Summary of result)
${e.output || "(No summary provided)"}

STEP 3: REFINEMENT (How I verified/changed it)
${e.refinement || "(No refinement recorded)"}
------------------------------------------`
    ).join('\n\n');

    return `AI USAGE DECLARATION - AUDIT LOG
Date: ${date}

I declare that I have used Artificial Intelligence tools in the preparation of this work as detailed below. 
I have verified all information and the final submission reflects my own understanding and voice.

${entriesText}

[End of Declaration]`;
  };

  const copyDeclaration = async () => {
    const text = generateDeclarationText();
    try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    } catch (err) {
        console.error("Failed to copy", err);
    }
  };

  const getLogTitle = () => {
      switch(logContext) {
          case 'assignment': return "Assignment Audit Log";
          case 'research': return "Research Audit Log";
          case 'study': return "Study Session Log";
          default: return "AI Audit Log";
      }
  };

  const getLogDescription = () => {
      switch(logContext) {
          case 'assignment': return "Track how you used AI to support your writing. Focus on how you refined the output.";
          case 'research': return "Track your search terms and methodology. Ensure no private data was shared.";
          case 'study': return "Track your revision questions. Ensure you double-checked the facts.";
          default: return "Track your process. Prove your integrity.";
      }
  };

  const criticalThinkingPrompts = [
    { 
      title: "Question Assumptions", 
      icon: <HelpCircle className="w-5 h-5"/>, 
      when: "Use this when you feel certain but lack proof. It reveals weak foundations in your thinking.", 
      prompt: "I'm convinced that [your belief]. What hidden assumptions support this belief? What other explanations could account for this?" 
    },
    { 
      title: "Understand Opposing Views", 
      icon: <Scale className="w-5 h-5"/>, 
      when: "Use this to prevent weak arguments. It forces you to deal with the strongest version of the other side.", 
      prompt: "Act as [person who disagrees with you] and explain their perspective in a way that makes their stance understandable." 
    },
    { 
      title: "Spotting Biases", 
      icon: <Microscope className="w-5 h-5"/>, 
      when: "Use this when you feel emotional about a topic. It acts as a reality check for your brain's shortcuts.", 
      prompt: "I'm strongly convinced that [your position]. Which mental shortcuts or blind spots could be changing my view?" 
    },
    { 
      title: "Testing Logic", 
      icon: <BrainCircuit className="w-5 h-5"/>, 
      when: "Use this to check your thinking. It finds the weak links in your chain of reasoning.", 
      prompt: "My reasoning is: [your reasoning]. Where does this argument break down or lack evidence?" 
    },
    { 
      title: "Analyze Future Effects", 
      icon: <Layers className="w-5 h-5"/>, 
      when: "Use this for complex decisions. It helps you see the long-term results, not just the immediate ones.", 
      prompt: "I'm considering [potential decision]. What unexpected second and third-order consequences might happen later?" 
    },
    { 
      title: "Play Devil's Advocate", 
      icon: <Zap className="w-5 h-5"/>, 
      when: "Use this before submitting work. It helps you prepare for criticism by finding your weaknesses first.", 
      prompt: "I'm planning to [your idea]. If you were arguing against this, what would be your most powerful objections?" 
    },
    { 
      title: "Verifying Sources", 
      icon: <ShieldAlert className="w-5 h-5"/>, 
      when: "Use this when you see a shocking headline. It stops you from being misled by bad data.", 
      prompt: "I found this claim: [claim]. How would I fact-check this? What questions would help me assess whether this information is true?" 
    },
    { 
      title: "Revealing Blind Spots", 
      icon: <Ghost className="w-5 h-5"/>, 
      when: "Use this when you are stuck in a loop. It shines a light on solutions you might be missing.", 
      prompt: "I've tried [your solution attempts], but [problem] keeps coming back. What underlying factors am I failing to notice?" 
    },
    { 
      title: "Get Other Perspectives", 
      icon: <Quote className="w-5 h-5"/>, 
      when: "Use this to break out of your bubble. It borrows the brains of experts in other fields.", 
      prompt: "I'm working through [your situation]. How might someone in [profession or discipline] tackle this? And someone from [different discipline]?" 
    },
    { 
      title: "Define Precisely", 
      icon: <Target className="w-5 h-5"/>, 
      when: "Use this when arguments go in circles. It ensures everyone is actually talking about the same thing.", 
      prompt: "Help me understand exactly what [term] means when we're talking about [situation]?" 
    },
    { 
      title: "Challenge 'The Usual Way'", 
      icon: <GitBranch className="w-5 h-5"/>, 
      when: "Use this when 'the way we always do it' isn't working. It helps spark new ideas.", 
      prompt: "We've always used [current approach], but it's failing. Why might that be, and what unconventional alternatives could we explore?" 
    },
    { 
      title: "Facts Versus Opinions", 
      icon: <ListChecks className="w-5 h-5"/>, 
      when: "Use this in heated debates. It separates what can be proven from what is just felt.", 
      prompt: "When discussing [topic], what factual points would both sides accept, compared to the value-driven perspectives where disagreement actually exists?" 
    },
  ];

  // Mobile Header Logic
  const getMobileProgress = () => {
    if (mode !== 'compliance') return 100;
    if (mobileStep === 1) return 25;
    if (mobileStep === 2) return 50;
    if (mobileStep === 3) return 75;
    if (mobileStep === 4) return 100;
    return 0;
  };

  return (
    <div className="min-h-screen bg-white pb-20 relative">
      
      {/* UKZN Brand Strip - TOP (Red to Blue) */}
      <div className="fixed top-0 left-0 right-0 h-2 flex z-50">
        {UKZN_COLORS.map((c, i) => (
          <div key={`t-${i}`} className="h-full w-1/5" style={{ backgroundColor: c }}></div>
        ))}
      </div>

      {/* UKZN Brand Strip - LEFT (Red to Blue) */}
      <div className="fixed top-0 left-0 bottom-0 w-2 flex flex-col z-50">
        {UKZN_COLORS.map((c, i) => (
          <div key={`l-${i}`} className="w-full h-1/5" style={{ backgroundColor: c }}></div>
        ))}
      </div>

      {/* UKZN Brand Strip - RIGHT (Blue to Red) */}
      <div className="fixed top-0 right-0 bottom-0 w-2 flex flex-col z-50">
        {UKZN_COLORS_REVERSED.map((c, i) => (
          <div key={`r-${i}`} className="w-full h-1/5" style={{ backgroundColor: c }}></div>
        ))}
      </div>

      {/* UKZN Brand Strip - BOTTOM (Blue to Red) */}
      <div className="fixed bottom-0 left-0 right-0 h-2 flex z-50">
        {UKZN_COLORS_REVERSED.map((c, i) => (
          <div key={`b-${i}`} className="h-full w-1/5" style={{ backgroundColor: c }}></div>
        ))}
      </div>

      <div className="py-10 px-6 sm:px-8 lg:px-10">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-4">
            
            {/* Mobile Header with Back Button */}
            {isMobile && mode && (
                <div className="flex items-center justify-between mb-4 sticky top-2 z-40 bg-white/95 backdrop-blur py-2 px-1 rounded-xl shadow-sm border border-slate-100">
                    <button onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    {mode === 'compliance' && (
                        <div className="flex-1 mx-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#00AEEF] transition-all duration-500 ease-out" style={{ width: `${getMobileProgress()}%` }}></div>
                        </div>
                    )}
                    {mode === 'log' && <div className="flex-1 text-center font-bold text-slate-700">Audit Log</div>}
                    {mode !== 'compliance' && mode !== 'log' && <div className="flex-1 text-center font-bold text-slate-700">Guide</div>}
                    <div className="w-10"></div> {/* Spacer for alignment */}
                </div>
            )}

            {!isMobile && (
                 <img 
                 src={UKZN_LOGO_SRC} 
                 alt="University of KwaZulu-Natal Logo" 
                 className="h-28 mx-auto mb-6 object-contain"
                />
            )}
            
            {isMobile && !mode && (
                <img 
                 src={UKZN_LOGO_SRC} 
                 alt="University of KwaZulu-Natal Logo" 
                 className="h-24 mx-auto mb-4 object-contain"
                />
            )}

            {mode === null && (
               <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 relative">
                  <h1 className="text-4xl font-extrabold text-black tracking-tight">AI at UKZN</h1>
                  <p className="text-lg text-slate-600 max-w-xl mx-auto mt-2">
                    How should you use AI? Choose a path below.
                  </p>
                  
                  {/* SHARE BUTTON */}
                  <button 
                    onClick={handleShare}
                    className="absolute top-0 right-0 p-2 text-slate-400 hover:text-[#00AEEF] hover:bg-blue-50 rounded-full transition-all"
                    title="Share this App"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
               </div>
            )}
            {/* Mobile: Dynamic Header Titles */}
            {mode === 'compliance' && (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                    {mobileStep === 1 && <h1 className="text-2xl font-extrabold text-black tracking-tight">Step 1: The Context</h1>}
                    {mobileStep === 2 && <h1 className="text-2xl font-extrabold text-black tracking-tight">Step 2: Assessment</h1>}
                    {mobileStep === 3 && <h1 className="text-2xl font-extrabold text-black tracking-tight">Step 3: The Rules</h1>}
                    {mobileStep === 4 && <h1 className="text-2xl font-extrabold text-black tracking-tight">Your Result</h1>}
                    {!isMobile && <p className="text-slate-600">Am I allowed to use AI for this task?</p>}
                </div>
            )}
            {mode === 'advice' && (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                    <h1 className="text-3xl font-extrabold text-black tracking-tight">The Impact of AI</h1>
                    {!isMobile && <p className="text-slate-600">Using it effectively vs. losing your voice.</p>}
                </div>
            )}
            {mode === 'critical-thinking' && (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                    {isMobile ? (
                        <h1 className="text-2xl font-extrabold text-black tracking-tight">
                            {activePromptIndex !== null ? "Prompt Detail" : "Critical Thinking"}
                        </h1>
                    ) : (
                        <h1 className="text-3xl font-extrabold text-black tracking-tight">Critical Thinking</h1>
                    )}
                    {!isMobile && <p className="text-slate-600">12 Ways to use AI to sharpen your mind, not replace it.</p>}
                </div>
            )}
             {mode === 'log' && (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                    <h1 className="text-3xl font-extrabold text-black tracking-tight">{getLogTitle()}</h1>
                    {!isMobile && <p className="text-slate-600">{getLogDescription()}</p>}
                </div>
            )}
          </div>

          {/* LANDING PAGE SELECTION */}
          {mode === null && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
                {/* 1. Check Rules */}
                <button 
                  onClick={() => setMode('compliance')}
                  className="group relative overflow-hidden bg-white border border-slate-200 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:border-[#00AEEF] transition-all duration-300 text-left flex flex-col h-full"
                >
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#00AEEF] group-hover:w-2 transition-all"></div>
                    <div className="mb-4 bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center text-[#00AEEF] group-hover:scale-110 transition-transform">
                        <Scale className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Check Rules</h2>
                    <p className="text-slate-500 mb-4 flex-grow">
                        See if AI is permitted for your specific assignment or research.
                    </p>
                    <div className="flex items-center text-[#00AEEF] font-semibold text-sm">
                        Start Check <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                </button>

                {/* 2. Create Log (New) */}
                <button 
                  onClick={() => { setMode('log'); setLogContext('generic'); }}
                  className="group relative overflow-hidden bg-white border border-slate-200 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:border-[#F99D1C] transition-all duration-300 text-left flex flex-col h-full"
                >
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#F99D1C] group-hover:w-2 transition-all"></div>
                    <div className="mb-4 bg-orange-50 w-12 h-12 rounded-full flex items-center justify-center text-[#F99D1C] group-hover:scale-110 transition-transform">
                        <ScrollText className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Create AI Log</h2>
                    <p className="text-slate-500 mb-4 flex-grow">
                        Generate a visual audit trail to prove your work is your own.
                    </p>
                    <div className="flex items-center text-[#F99D1C] font-semibold text-sm">
                        Open Logbook <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                </button>

                {/* 3. Understand Impact */}
                <button 
                  onClick={() => setMode('advice')}
                  className="group relative overflow-hidden bg-white border border-slate-200 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:border-[#00A651] transition-all duration-300 text-left flex flex-col h-full"
                >
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#00A651] group-hover:w-2 transition-all"></div>
                    <div className="mb-4 bg-green-50 w-12 h-12 rounded-full flex items-center justify-center text-[#00A651] group-hover:scale-110 transition-transform">
                        <Brain className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Understand Impact</h2>
                    <p className="text-slate-500 mb-4 flex-grow">
                        How using AI well helps you learn, while bad use hurts you.
                    </p>
                    <div className="flex items-center text-[#00A651] font-semibold text-sm">
                        View Scenarios <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                </button>
             </div>
          )}

          {/* LOG MODE */}
          {mode === 'log' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto space-y-8">
                 
                 {/* INTRO BOX */}
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
                    <p className="text-slate-600 mb-0">
                        Academic integrity isn't just about saying "I didn't cheat". 
                        It is about showing <strong>how</strong> you used the tool. 
                        Record your prompts, the output, and—most importantly—how you refined it.
                    </p>
                    {/* Context Specific Tip */}
                    {logContext !== 'generic' && (
                        <div className="mt-4 inline-block bg-[#00AEEF]/10 text-[#00AEEF] px-4 py-2 rounded-lg text-sm font-bold border border-[#00AEEF]/20">
                            {logContext === 'assignment' && "💡 Tip: Focus on how you critiqued the AI's draft."}
                            {logContext === 'research' && "💡 Tip: Confirm you verified every citation."}
                            {logContext === 'study' && "💡 Tip: Log the questions you asked to test yourself."}
                        </div>
                    )}
                 </div>

                 {/* TIMELINE RENDERER */}
                 {logEntries.length > 0 && (
                    <div className="space-y-8 relative pl-4 md:pl-8">
                        {/* Vertical Timeline Line */}
                        <div className="absolute left-4 md:left-8 top-4 bottom-4 w-0.5 bg-slate-200"></div>

                        {logEntries.map((entry, index) => (
                            <div key={entry.id} className="relative animate-in slide-in-from-left-4 duration-500">
                                {/* Entry Number Bubble */}
                                <div className="absolute -left-3 md:-left-3 top-0 w-6 h-6 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center z-10 ring-4 ring-white">
                                    {index + 1}
                                </div>

                                <div className="ml-6 md:ml-8 space-y-4">
                                    
                                    {/* 1. THE ASK (Prompt) */}
                                    <div className="bg-white border border-slate-200 p-4 rounded-xl rounded-tl-none shadow-sm relative group">
                                        <div className="absolute -left-2 top-0 w-2 h-2 bg-slate-200 [clip-path:polygon(100%_0,0_0,100%_100%)]"></div>
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1 p-1.5 bg-slate-100 rounded text-slate-600">
                                                <MessageSquare className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">The Prompt</p>
                                                <p className="text-slate-800 text-sm whitespace-pre-wrap">{entry.prompt}</p>
                                            </div>
                                            <button 
                                                onClick={() => deleteLogEntry(entry.id)} 
                                                className="text-slate-300 hover:text-red-500 transition-colors"
                                                title="Delete Entry"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* 2. THE OUTPUT */}
                                    <div className="ml-4 md:ml-8 bg-orange-50 border border-orange-100 p-4 rounded-xl shadow-sm">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1 p-1.5 bg-orange-100 rounded text-[#F99D1C]">
                                                <Sparkles className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">AI Output</p>
                                                <p className="text-slate-700 text-sm whitespace-pre-wrap">{entry.output || <span className="text-orange-300 italic">No summary recorded</span>}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. REFINEMENT */}
                                    <div className="ml-8 md:ml-16 bg-green-50 border border-green-100 p-4 rounded-xl shadow-sm border-l-4 border-l-[#00A651]">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1 p-1.5 bg-green-100 rounded text-[#00A651]">
                                                <PenTool className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">My Refinement</p>
                                                <p className="text-slate-800 text-sm whitespace-pre-wrap font-medium">{entry.refinement || <span className="text-green-300 italic">No refinement recorded</span>}</p>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                 )}

                 {/* ADD ENTRY FORM */}
                 <div className={`bg-white rounded-2xl border-2 border-dashed border-slate-200 p-6 ${logEntries.length === 0 ? 'mt-0' : 'mt-8'}`}>
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-[#00AEEF]" />
                        {logEntries.length === 0 ? "Start your Log" : "Add Next Step"}
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">1. What did you ask? (Paste Prompt)</label>
                            <textarea 
                                value={currentEntry.prompt}
                                onChange={(e) => setCurrentEntry({...currentEntry, prompt: e.target.value})}
                                placeholder="e.g. 'Explain the difference between qualitative and quantitative research methods...'"
                                className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20 outline-none text-sm min-h-[80px]"
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[#F99D1C] uppercase tracking-wider mb-1">2. What did it give you?</label>
                                <textarea 
                                    value={currentEntry.output}
                                    onChange={(e) => setCurrentEntry({...currentEntry, output: e.target.value})}
                                    placeholder="e.g. 'It provided a table with 5 key differences...'"
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#F99D1C] focus:ring-2 focus:ring-[#F99D1C]/20 outline-none text-sm min-h-[100px]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#00A651] uppercase tracking-wider mb-1">3. How did you change/verify it?</label>
                                <textarea 
                                    value={currentEntry.refinement}
                                    onChange={(e) => setCurrentEntry({...currentEntry, refinement: e.target.value})}
                                    placeholder="e.g. 'I verified the examples using the textbook and rewrote the definitions in my own words.'"
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#00A651] focus:ring-2 focus:ring-[#00A651]/20 outline-none text-sm min-h-[100px]"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button 
                                onClick={addLogEntry}
                                disabled={!currentEntry.prompt.trim()}
                                className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Add Entry
                            </button>
                        </div>
                    </div>
                 </div>

                 {/* GENERATE DECLARATION */}
                 {logEntries.length > 0 && (
                     <div className="pt-4 border-t border-slate-100 flex justify-center">
                         {!showDeclaration ? (
                             <button 
                                onClick={() => setShowDeclaration(true)}
                                className="flex items-center gap-2 px-8 py-4 bg-[#00AEEF] text-white rounded-xl font-bold hover:bg-[#009bd5] shadow-lg shadow-blue-200 transition-all hover:-translate-y-1"
                             >
                                <ClipboardList className="w-5 h-5" />
                                Generate Declaration
                             </button>
                         ) : (
                             <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
                                 <div className="bg-slate-900 text-slate-300 p-6 rounded-xl font-mono text-xs md:text-sm leading-relaxed overflow-x-auto relative group">
                                     <pre className="whitespace-pre-wrap">{generateDeclarationText()}</pre>
                                     <button 
                                        onClick={copyDeclaration}
                                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                                     >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                     </button>
                                 </div>
                                 <p className="text-center text-slate-400 text-xs mt-3">
                                     Copy this text and paste it at the top of your assignment or in your appendix.
                                 </p>
                             </div>
                         )}
                     </div>
                 )}
             </div>
          )}

          {/* ADVICE MODE */}
          {mode === 'advice' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 max-w-3xl mx-auto">
                  
                  {/* Scenario 1: Effective Use */}
                  <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl border border-[#00A651]/20 shadow-lg overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                          <BrainCircuit className="w-32 h-32 text-[#00A651]" />
                      </div>
                      <div className="p-8 relative z-10">
                          <div className="flex items-center gap-3 mb-4">
                              <div className="p-3 bg-[#00A651] rounded-lg text-white shadow-lg shadow-green-200">
                                  <Zap className="w-6 h-6" />
                              </div>
                              <h2 className="text-2xl font-bold text-[#00A651]">The Pilot (Effective Use)</h2>
                          </div>
                          <p className="text-xl font-medium text-slate-800 mb-4">
                              "AI acts as a tool to help you climb. You build higher."
                          </p>
                          <div className="space-y-4 text-slate-600 leading-relaxed">
                              <p>
                                  When you use AI effectively, you remain the pilot. You use the machine to handle the routine tasks, 
                                  summarize large amounts of info, or check your logic. But <strong>you</strong> make the decisions.
                              </p>
                              <ul className="space-y-2 mt-4">
                                  <li className="flex gap-2">
                                      <CheckCircle2 className="w-5 h-5 text-[#00A651] shrink-0" />
                                      <span><strong>Expansion:</strong> You understand more concepts in less time.</span>
                                  </li>
                                  <li className="flex gap-2">
                                      <CheckCircle2 className="w-5 h-5 text-[#00A651] shrink-0" />
                                      <span><strong>Connection:</strong> You connect ideas that were previously unconnected.</span>
                                  </li>
                                  <li className="flex gap-2">
                                      <CheckCircle2 className="w-5 h-5 text-[#00A651] shrink-0" />
                                      <span><strong>Voice:</strong> Your argument becomes sharper because you debated it with the AI.</span>
                                  </li>
                              </ul>
                          </div>
                      </div>
                  </div>

                  {/* Scenario 2: Bad Use */}
                  <div className="bg-gradient-to-br from-white to-red-50 rounded-2xl border border-[#ED1C24]/20 shadow-lg overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                          <Ghost className="w-32 h-32 text-[#ED1C24]" />
                      </div>
                      <div className="p-8 relative z-10">
                          <div className="flex items-center gap-3 mb-4">
                              <div className="p-3 bg-[#ED1C24] rounded-lg text-white shadow-lg shadow-red-200">
                                  <Ghost className="w-6 h-6" />
                              </div>
                              <h2 className="text-2xl font-bold text-[#ED1C24]">The Ghost (Bad Use)</h2>
                          </div>
                          <p className="text-xl font-medium text-slate-800 mb-4">
                              "It destroys your connections. You become a ghost."
                          </p>
                          <div className="space-y-4 text-slate-600 leading-relaxed">
                              <p>
                                  When you replace your thinking with AI, you are not just breaking rules—you are weakening your own mind.
                                  Learning happens in the struggle to write a thought. If you skip the struggle, you skip the growth.
                              </p>
                              <ul className="space-y-2 mt-4">
                                  <li className="flex gap-2">
                                      <ShieldAlert className="w-5 h-5 text-[#ED1C24] shrink-0" />
                                      <span><strong>Weakness:</strong> Your ability to think critically fades away.</span>
                                  </li>
                                  <li className="flex gap-2">
                                      <ShieldAlert className="w-5 h-5 text-[#ED1C24] shrink-0" />
                                      <span><strong>Loss of Self:</strong> You cannot defend 'your' work because you didn't think it. You are absent.</span>
                                  </li>
                                  <li className="flex gap-2">
                                      <ShieldAlert className="w-5 h-5 text-[#ED1C24] shrink-0" />
                                      <span><strong>Dependence:</strong> Without the tool, you are helpless. You are a passenger, not a pilot.</span>
                                  </li>
                              </ul>
                          </div>
                      </div>
                  </div>

                  {/* The Choice is Yours - Dual Options */}
                  <div className="p-8 bg-slate-900 rounded-2xl text-center border border-slate-800 shadow-xl">
                      <h3 className="text-2xl font-bold text-white mb-2">The Choice is Yours</h3>
                      <p className="text-slate-400 mb-8 max-w-lg mx-auto">Academic integrity isn't just about avoiding punishment. It's about protecting your brain's ability to think.</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button 
                            onClick={() => setMode('compliance')}
                            className="flex flex-col items-center justify-center p-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all group"
                        >
                            <Scale className="w-8 h-8 text-[#00AEEF] mb-3 group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-white mb-1">Am I allowed?</span>
                            <span className="text-xs text-slate-400">Check Compliance Rules</span>
                        </button>
                        
                        <button 
                            onClick={() => setMode('critical-thinking')}
                            className="flex flex-col items-center justify-center p-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all group"
                        >
                            <Lightbulb className="w-8 h-8 text-[#FFDD00] mb-3 group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-white mb-1">How do I use it effectively?</span>
                            <span className="text-xs text-slate-400">View 12 Critical Thinking Prompts</span>
                        </button>
                      </div>
                  </div>
              </div>
          )}

          {/* CRITICAL THINKING MODE */}
          {mode === 'critical-thinking' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Desktop View: Grid (Unchanged) */}
                {!isMobile && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {criticalThinkingPrompts.map((item, index) => (
                                <div key={index} className="bg-white rounded-xl border border-slate-200 hover:border-[#00AEEF] hover:shadow-lg transition-all p-5 flex flex-col group h-full">
                                    <div className="flex items-center gap-3 mb-3 text-[#00AEEF]">
                                        <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-[#00AEEF] group-hover:text-white transition-colors">
                                            {item.icon}
                                        </div>
                                        <h3 className="font-bold text-slate-900 leading-tight">{item.title}</h3>
                                    </div>
                                    <div className="mb-4">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Why it's useful:</span>
                                        <p className="text-sm text-slate-600 mt-1 min-h-[40px] leading-snug">{item.when}</p>
                                    </div>
                                    <div className="mt-auto relative">
                                        <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-xs font-mono text-slate-700 mb-2">
                                            <FormatPromptText text={item.prompt} />
                                        </div>
                                        <button
                                            onClick={() => copySpecificPrompt(item.prompt, index)}
                                            className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-[#00AEEF] hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-[#00AEEF]/20"
                                        >
                                            {copiedIndex === index ? (
                                                <>
                                                    <Check className="w-3 h-3 text-[#00A651]" /> Copied
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-3 h-3" /> Copy Prompt
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 p-6 bg-blue-50 border border-blue-100 rounded-xl text-center">
                            <h3 className="font-bold text-blue-900 mb-2">Want to check if this is allowed for marks?</h3>
                            <button 
                                onClick={() => setMode('compliance')}
                                className="text-[#00AEEF] font-bold hover:underline"
                            >
                                Go to Compliance Check &rarr;
                            </button>
                        </div>
                    </>
                )}

                {/* Mobile View: List -> Detail Flow */}
                {isMobile && (
                    <div>
                        {activePromptIndex === null ? (
                            // List View
                            <div className="space-y-4">
                                {criticalThinkingPrompts.map((item, index) => (
                                    <button 
                                        key={index}
                                        onClick={() => setActivePromptIndex(index)}
                                        className="w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:bg-slate-50 transition-colors group text-left"
                                    >
                                        <div className="text-[#00AEEF] bg-blue-50 p-3 rounded-lg group-hover:bg-[#00AEEF] group-hover:text-white transition-colors">
                                            {item.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-slate-900">{item.title}</h3>
                                        </div>
                                        <ChevronRight className="text-slate-300 w-5 h-5" />
                                    </button>
                                ))}
                            </div>
                        ) : (
                            // Detail View
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-5 animate-in slide-in-from-right-4 duration-300 relative">
                                {(() => {
                                    const item = criticalThinkingPrompts[activePromptIndex];
                                    return (
                                        <div className="flex flex-col">
                                            
                                            <button 
                                                onClick={() => setActivePromptIndex(null)}
                                                className="mb-2 self-start text-slate-500 hover:text-[#00AEEF] flex items-center gap-2 text-sm font-medium transition-colors"
                                            >
                                                <ArrowLeft className="w-4 h-4" /> Back to List
                                            </button>

                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-2.5 bg-[#00AEEF] text-white rounded-xl shadow-md">
                                                    {React.cloneElement(item.icon as React.ReactElement<any>, { className: "w-6 h-6" })}
                                                </div>
                                                <h2 className="text-xl font-bold text-slate-900 leading-tight">{item.title}</h2>
                                            </div>
                                            
                                            <div className="mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <span className="text-xs font-bold uppercase tracking-wider text-[#00AEEF] mb-1 block">The Concept</span>
                                                <p className="text-slate-700 leading-relaxed text-base">{item.when}</p>
                                            </div>

                                            <div className="">
                                                <p className="font-bold text-slate-900 mb-2 flex items-center gap-2 text-sm">
                                                    <Sparkles className="w-4 h-4 text-[#F99D1C]" />
                                                    The Prompt
                                                </p>
                                                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-sm leading-relaxed shadow-inner border border-slate-800 mb-3">
                                                    <FormatPromptText text={item.prompt} />
                                                </div>
                                                <button
                                                    onClick={() => copySpecificPrompt(item.prompt, activePromptIndex)}
                                                    className="w-full py-3 flex items-center justify-center gap-2 text-sm font-bold text-white bg-[#00AEEF] hover:bg-[#009bd5] rounded-xl transition-all shadow-lg hover:shadow-[#00AEEF]/30"
                                                >
                                                    {copiedIndex === activePromptIndex ? (
                                                        <>
                                                            <Check className="w-4 h-4" /> Copied to Clipboard
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="w-4 h-4" /> Copy Prompt
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                )}
             </div>
          )}

          {/* COMPLIANCE MODE: The Layout Switcher */}
          {mode === 'compliance' && (
            <div className="max-w-3xl mx-auto">
              
              {/* Question 1: Task Type */}
              {/* Renders if: Desktop OR (Mobile AND Step 1) */}
              {(!isMobile || mobileStep === 1) && (
                  <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                    <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#00AEEF]/10 text-[#00AEEF] text-sm font-bold border border-[#00AEEF]/20">1</span>
                      What are you working on?
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {renderButton<TaskType>('assignment', taskType, setTaskType, "Assignment", "Writing, production, exam equivalents", <FileText className="w-5 h-5"/>)}
                      {renderButton<TaskType>('study', taskType, setTaskType, "Study", "Revision, preparing for exams", <BookOpen className="w-5 h-5"/>)}
                      {renderButton<TaskType>('research', taskType, setTaskType, "Research", "Thesis, data, ethics", <GraduationCap className="w-5 h-5"/>)}
                    </div>
                  </div>
              )}

              {/* Question 2: For Marks? */}
              {/* Renders if: (Desktop AND Task Selected) OR (Mobile AND Step 2) */}
              {( (!isMobile && taskType) || (isMobile && mobileStep === 2) ) && (
                <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ${!isMobile ? "mt-8" : ""}`}>
                  <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#00AEEF]/10 text-[#00AEEF] text-sm font-bold border border-[#00AEEF]/20">2</span>
                    Is this for marks?
                  </h2>
                  <div className="grid grid-cols-1 gap-4">
                    {renderButton<MarksStatus>('yes', forMarks, setForMarks, "Yes (Summative)", "Assignments, tests, final thesis", <CheckCircle2 className="w-5 h-5"/>)}
                    {renderButton<MarksStatus>('no', forMarks, setForMarks, "No (Formative)", "Personal notes, practice only", <BookOpen className="w-5 h-5"/>)}
                    {renderButton<MarksStatus>('unsure', forMarks, setForMarks, "Not Sure", "Might count for marks", <HelpCircle className="w-5 h-5"/>)}
                  </div>
                </div>
              )}

              {/* Question 3: Module Rule (Only if Marks = Yes) */}
              {/* Renders if: (Desktop AND Task AND Marks=Yes) OR (Mobile AND Step 3) */}
              {( (!isMobile && taskType && forMarks === 'yes') || (isMobile && mobileStep === 3) ) && (
                <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ${!isMobile ? "mt-8" : ""}`}>
                  <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#00AEEF]/10 text-[#00AEEF] text-sm font-bold border border-[#00AEEF]/20">3</span>
                    Check your Guidelines
                  </h2>
                  <p className="text-slate-500 mb-4 text-sm">
                    {isResearch ? "Your supervisor and ethical clearance dictate the rules." : "Your module outline is the final authority."} What is allowed?
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {renderButton<ModuleRule>('full', moduleRule, setModuleRule, "Full AI Use", "Allowed with disclosure")}
                    {renderButton<ModuleRule>('limited', moduleRule, setModuleRule, "Limited Use", "Specific tasks only (e.g. grammar)")}
                    {renderButton<ModuleRule>('none', moduleRule, setModuleRule, "No AI Use", "Strictly prohibited")}
                    {renderButton<ModuleRule>('unknown', moduleRule, setModuleRule, "Unknown", "Not specified")}
                  </div>
                </div>
              )}

              {/* Results Section */}
              {/* Renders if: (Desktop AND Terminal State) OR (Mobile AND Step 4) */}
              {( (!isMobile && isTerminalState()) || (isMobile && mobileStep === 4) ) && (
                <div className={`rounded-2xl overflow-hidden shadow-xl border border-slate-200 animate-in zoom-in-95 duration-500 bg-white ${!isMobile ? "mt-8" : ""}`}>
                  
                  {/* --- RESEARCH CONTEXT --- */}
                  {isResearch ? (
                    <div className="p-6 border-b bg-[#ED1C24]/5 border-[#ED1C24]/20">
                      <h3 className="text-xl font-bold flex items-center gap-2 text-[#ED1C24]">
                        <ShieldAlert className="w-6 h-6"/>
                        Research Ethics & Integrity
                      </h3>
                      <div className="mt-3 text-slate-800 space-y-3 leading-relaxed">
                          <p><strong>Research involves high stakes data privacy and ethics.</strong></p>
                          <ul className="list-disc pl-5 space-y-1 text-slate-700">
                            <li><strong>Privacy (POPIA):</strong> Never upload participant names, transcripts, or confidential data to AI.</li>
                            <li><strong>Fake Data:</strong> AI often invents citations. You must verify every single source.</li>
                            <li><strong>Methodology:</strong> If AI helped in design or analysis, it must be disclosed in your methodology.</li>
                          </ul>
                      </div>
                    </div>
                  ) : (
                    // --- ASSIGNMENT & STUDY CONTEXT ---
                    <div className={`p-6 border-b ${
                      forMarks === 'no' || moduleRule === 'full' ? 'bg-[#00A651]/10 border-[#00A651]/20' : 
                      moduleRule === 'none' ? 'bg-[#ED1C24]/5 border-[#ED1C24]/20' : 
                      'bg-[#F99D1C]/10 border-[#F99D1C]/20'
                    }`}>
                      <h3 className={`text-xl font-bold flex items-center gap-2 ${
                        forMarks === 'no' || moduleRule === 'full' ? 'text-[#00A651]' : 
                        moduleRule === 'none' ? 'text-[#ED1C24]' : 
                        'text-[#F99D1C]'
                      }`}>
                        {moduleRule === 'none' ? <AlertCircle className="w-6 h-6"/> : <CheckCircle2 className="w-6 h-6"/>}
                        The Bottom Line
                      </h3>
                      
                      <div className="mt-3 text-slate-800 space-y-3 leading-relaxed">
                        
                        {/* Formative Logic */}
                        {forMarks === 'no' && (
                          <p>
                            <strong>Formative work is safe for practice.</strong> 
                            {isStudy && " Use AI to explain concepts or quiz you. The risk here is 'Dependency'—if you only read summaries, you won't learn."}
                            {isAssignment && " Use AI to brainstorm or structure ideas. The risk here is 'Copying'—do not let AI write drafts you might accidentally submit later."}
                          </p>
                        )}
                        
                        {/* Summative Logic - The Dangerous Part */}
                        {forMarks === 'yes' && (
                          <>
                            {isAssignment && (
                              <p>
                                <strong>This is an important graded task.</strong> The main risk is <strong>Misrepresentation (Pretending it is yours)</strong>.
                                Pretending AI-generated work is your own is a form of academic misconduct, distinct from just plagiarism.
                                {moduleRule === 'none' && " You must produce this work entirely yourself."}
                                {moduleRule === 'limited' && " You can use AI for specific tasks (e.g. grammar) but NOT to write the content."}
                                {moduleRule === 'full' && " You can use AI to support your writing, but you must verify everything and disclose usage."}
                              </p>
                            )}
                            {isStudy && (
                              <p>
                                <strong>This is likely an online test or quiz.</strong> The main risk is <strong>Cheating</strong>.
                                {moduleRule === 'none' && " Using AI during a test is strictly prohibited and easily detected."}
                                {moduleRule === 'limited' && " Check specific rules. Usually, AI is not allowed during the actual assessment."}
                              </p>
                            )}
                          </>
                        )}

                        {forMarks === 'unsure' && <p><strong>Treat it as Summative.</strong> Don't guess. Ask your lecturer.</p>}
                        {moduleRule === 'unknown' && <p><strong>Unknown Rules = High Risk.</strong> Ask your lecturer specifically before starting.</p>}

                      </div>
                    </div>
                  )}

                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Next Steps List */}
                    <div>
                      <h4 className="font-bold text-black mb-4 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-[#00AEEF]"/>
                        Safe Next Steps
                      </h4>
                      <ul className="space-y-3">
                        {/* RESEARCH Steps */}
                        {isResearch && (
                          <>
                            <StepItem text="Check your ethical clearance conditions." />
                            <StepItem text="Anonymize all data before any processing." />
                            <StepItem text="Verify every citation manually." />
                          </>
                        )}

                        {/* ASSIGNMENT Steps */}
                        {isAssignment && !isResearch && (
                          <>
                            <StepItem text="Draft your main arguments yourself first." />
                            <StepItem text="Keep version history to prove authorship." />
                            {forMarks === 'yes' && <StepItem text="Disclose AI use in your declaration." />}
                          </>
                        )}

                        {/* STUDY Steps */}
                        {isStudy && !isResearch && (
                          <>
                            <StepItem text="Don't just read AI summaries—write notes by hand." />
                            <StepItem text="Test yourself 'closed book' after using AI." />
                            <StepItem text="If AI explains it, make sure you can re-explain it." />
                          </>
                        )}
                        
                        {/* General Warning for None/Unknown */}
                        {(moduleRule === 'none' || moduleRule === 'unknown') && (
                          <StepItem text="Do not generate text to copy-paste." />
                        )}
                      </ul>
                    </div>

                    {/* Checklist */}
                    {(forMarks === 'yes' && moduleRule !== 'none') && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <h4 className="font-bold text-black mb-3 flex items-center gap-2">
                            <ListChecks className="w-5 h-5 text-[#00AEEF]"/>
                            {isResearch ? "Ethics Checklist" : "Submission Checklist"}
                          </h4>
                          <ul className="space-y-2 text-sm text-slate-700">
                            {isResearch ? (
                              <>
                                <CheckItem text="No participant data shared with AI." />
                                <CheckItem text="Verified all citations." />
                                <CheckItem text="Disclosed in Methodology." />
                              </>
                            ) : isAssignment ? (
                              <>
                                <CheckItem text="I wrote the core argument." />
                                <CheckItem text="I verified all facts/sources." />
                                <CheckItem text="I disclosed AI use." />
                              </>
                            ) : (
                              // Study checklist
                              <>
                                <CheckItem text="I can explain this without AI." />
                                <CheckItem text="I did not use AI during the test." />
                              </>
                            )}
                          </ul>
                          
                          {/* Link to Log Book - Available for all tasks where AI is allowed */}
                          <div className="mt-4 pt-4 border-t border-slate-200">
                                    <button
                                        onClick={() => { setMode('log'); setLogContext(taskType || 'generic'); }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F99D1C] text-white font-bold rounded-lg hover:bg-orange-600 transition-colors shadow-sm text-sm"
                                    >
                                        <ScrollText className="w-4 h-4" />
                                        Create Audit Log
                                    </button>
                                </div>
                      </div>
                    )}
                  </div>

                  {/* Safe Prompt Generator */}
                  <div className="bg-black text-white p-6 md:p-8">
                    <div className="max-w-2xl mx-auto">
                      {!showPrompt ? (
                        <div className="text-center">
                          <h3 className="text-xl font-bold mb-2">Need help getting started?</h3>
                          <p className="text-gray-400 mb-6">Generate a prompt that follows UKZN best practices.</p>
                          <button
                            onClick={() => setShowPrompt(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#00AEEF] hover:bg-[#009bd5] text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-[#00AEEF]/25"
                          >
                            <Sparkles className="w-5 h-5" />
                            Generate Safe Prompt
                          </button>
                        </div>
                      ) : (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                          <p className="font-semibold text-[#00AEEF] mb-3 flex items-center gap-2 uppercase tracking-wide text-sm">
                            <Sparkles className="w-4 h-4" />
                            Copy into your AI tool
                          </p>
                          <div className="relative group">
                            <div className="bg-gray-900 text-slate-100 p-5 rounded-xl font-mono text-sm leading-relaxed shadow-inner border border-gray-800">
                              {getSafePrompt()}
                            </div>
                            <button
                              onClick={copyToClipboard}
                              className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700 shadow-sm"
                              title="Copy to clipboard"
                            >
                              {copied ? <Check className="w-4 h-4 text-[#00A651]" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                          <div className="mt-4 flex gap-3 items-start text-xs text-gray-400 bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                            <ShieldAlert className="w-4 h-4 shrink-0 text-[#F99D1C]" />
                            <p>
                              <strong>Privacy Warning:</strong> Never paste sensitive data (names, IDs, unpublished research) into AI. 
                              If you cite authors, you must verify they exist yourself.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GLOBAL FOOTER/RESET */}
          {mode !== null && (
             <div className="p-4 bg-gray-50 border-t border-gray-100 text-center rounded-xl max-w-3xl mx-auto">
               <button
                 onClick={resetForm}
                 className="text-slate-600 hover:text-black font-medium text-sm flex items-center justify-center gap-2 mx-auto py-2"
               >
                 <RotateCcw className="w-4 h-4" />
                 Start Over
               </button>
             </div>
          )}

        </div>
      </div>
    </div>
  );
}

const StepItem = ({ text }: { text: string }) => (
  <li className="flex items-start gap-3 text-slate-700">
    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#00AEEF] shrink-0" />
    <span className="text-sm">{text}</span>
  </li>
);

const CheckItem = ({ text }: { text: string }) => (
  <li className="flex items-start gap-2">
    <div className="mt-0.5 w-4 h-4 border border-slate-300 rounded flex items-center justify-center bg-white shrink-0">
      <div className="w-2 h-2 bg-[#00A651] rounded-sm opacity-20"></div>
    </div>
    <span>{text}</span>
  </li>
);