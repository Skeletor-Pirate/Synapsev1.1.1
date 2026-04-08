import React, { useState } from 'react';
import { Code2, Play, Box, DatabaseZap, CheckCircle2, ShieldCheck, Search, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { verifyFinancialStatement } from '@/lib/orchestrator-client';

export default function InferenceView() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [cacheHit, setCacheHit] = useState(false);

  // CoVe state
  const [coveStatus, setCoveStatus] = useState<'idle' | 'drafting' | 'verifying' | 'correcting' | 'complete'>('idle');
  const [coveSteps, setCoveSteps] = useState<any[]>([]);
  const [coveInput, setCoveInput] = useState('Burn rate is up 10% due to AWS.');

  const runCove = async () => {
    setCoveStatus('drafting');
    setCoveSteps([]);
    
    try {
      const response = await verifyFinancialStatement(coveInput);
      if (response.steps) {
        // Simulate the steps appearing one by one for UI effect
        for (let i = 0; i < response.steps.length; i++) {
          const step = response.steps[i];
          if (step.status === 'error') setCoveStatus('correcting');
          else if (step.status === 'done' && i === 1) setCoveStatus('verifying');
          
          setCoveSteps(prev => [...prev, step]);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        setCoveStatus('complete');
      }
    } catch (error) {
      console.error("CoVe failed:", error);
      setCoveStatus('idle');
    }
  };

  const codeSnippet = `def calculate_variance(budget, actual):
    """
    Calculates variance deterministically.
    """
    variance = budget - actual
    percent_variance = (variance / budget) * 100
    return {
        "variance_amount": variance,
        "variance_percent": round(percent_variance, 2)
    }

# Data injected by Data Agent
budget_q3 = 2500000
actual_q3 = 2400000

result = calculate_variance(budget_q3, actual_q3)
print(f"Variance: $\\{result['variance_amount']:,.2f} (\\{result['variance_percent']}%)")`;

  const handleExecute = () => {
    setIsExecuting(true);
    setResult(null);
    setCacheHit(false);

    // Simulate execution delay
    setTimeout(() => {
      setResult("Variance: $100,000.00 (4.0%)");
      setIsExecuting(false);
      setCacheHit(true); // Next time it would be a cache hit
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 flex items-center">
          <Code2 className="w-6 h-6 mr-3 text-emerald-500" />
          The Inference Layer
        </h1>
        <p className="text-zinc-400 mt-1">Deterministic Computation and Chain-of-Verification (CoVe).</p>
      </div>

      {/* CoVe Section */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-200 flex items-center">
              <ShieldCheck className="w-5 h-5 mr-2 text-blue-400" />
              Chain-of-Verification (CoVe)
            </h2>
            <p className="text-sm text-zinc-400 mt-1">Self-correcting narrative generation to ensure mathematical and logical precision.</p>
          </div>
          <div className="flex flex-col gap-2">
            <input 
              type="text"
              value={coveInput}
              onChange={(e) => setCoveInput(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
              placeholder="Enter a financial statement to verify..."
            />
            <button 
              onClick={runCove}
              disabled={coveStatus !== 'idle' && coveStatus !== 'complete'}
              className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              <Play className="w-4 h-4 mr-2" />
              Test CoVe Pipeline
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {coveSteps.map((step, i) => (
            <div key={i} className={cn(
              "p-4 rounded-xl border transition-all duration-500",
              step.status === 'pending' ? "border-blue-500/50 bg-blue-500/5 animate-pulse" :
              step.status === 'error' ? "border-red-500/50 bg-red-500/5" :
              step.status === 'success' ? "border-emerald-500/50 bg-emerald-500/5" :
              "border-zinc-800 bg-zinc-900/50"
            )}>
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center">
                {step.status === 'error' && <AlertTriangle className="w-3 h-3 mr-1 text-red-500" />}
                {step.status === 'success' && <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" />}
                {step.title}
              </h3>
              <p className={cn(
                "text-sm",
                step.status === 'error' ? "text-red-400" :
                step.status === 'success' ? "text-emerald-400 font-medium" :
                "text-zinc-300"
              )}>{step.content}</p>
            </div>
          ))}
          {coveSteps.length === 0 && (
            <div className="col-span-4 py-8 text-center text-zinc-600 text-sm border border-dashed border-zinc-800 rounded-xl">
              Click &quot;Test CoVe Pipeline&quot; to see the verification process in action.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Code as Inference */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
          <div className="bg-zinc-900 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-200 flex items-center">
              <Code2 className="w-4 h-4 mr-2 text-blue-400" />
              Generated Python (PAL)
            </h3>
            <button 
              onClick={handleExecute}
              disabled={isExecuting}
              className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center disabled:opacity-50"
            >
              <Play className="w-3 h-3 mr-1" />
              {isExecuting ? 'Running...' : 'Execute in Sandbox'}
            </button>
          </div>
          <div className="p-4 bg-[#0d0d0d] flex-1 overflow-x-auto custom-scrollbar">
            <pre className="text-sm font-mono text-zinc-300">
              <code>{codeSnippet}</code>
            </pre>
          </div>
        </div>

        {/* Execution Environment & Results */}
        <div className="space-y-6">
          
          {/* Sandbox Status */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-zinc-200 flex items-center mb-4">
              <Box className="w-4 h-4 mr-2 text-purple-400" />
              Sandboxed Execution Environment
            </h3>
            <div className="space-y-3">
              <StatusRow label="Container Status" value={isExecuting ? "Running" : "Standby"} active={isExecuting} />
              <StatusRow label="Network Access" value="Disabled (Air-gapped)" active={false} />
              <StatusRow label="Compute Engine" value="E2B Secure Sandbox" active={true} />
            </div>
          </div>

          {/* Output & Caching */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-200 flex items-center">
                <DatabaseZap className="w-4 h-4 mr-2 text-amber-400" />
                Execution Output
              </h3>
              {cacheHit && result && (
                <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Semantic Cache Hit
                </span>
              )}
            </div>
            
            <div className={cn(
              "p-4 rounded-lg font-mono text-sm border transition-all",
              result ? "bg-zinc-950 border-zinc-700 text-emerald-400" : "bg-zinc-950/50 border-zinc-800 text-zinc-600"
            )}>
              {isExecuting ? "Executing code and awaiting stdout..." : (result || "Awaiting execution...")}
            </div>
            
            {result && (
              <p className="text-xs text-zinc-500 mt-3">
                * Math performed by CPU, not LLM token prediction. 100% deterministic.
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, value, active }: { label: string, value: string, active: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-zinc-400">{label}</span>
      <div className="flex items-center">
        {active && <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />}
        <span className="text-zinc-200 font-medium">{value}</span>
      </div>
    </div>
  );
}
