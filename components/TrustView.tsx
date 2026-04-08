import React, { useState } from 'react';
import { ShieldCheck, Link2, SlidersHorizontal, EyeOff, FileText, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const initialData = [
  { month: 'Oct', cash: 4200000 },
  { month: 'Nov', cash: 3800000 },
  { month: 'Dec', cash: 3500000 },
  { month: 'Jan', cash: 3100000 },
  { month: 'Feb', cash: 2800000 },
];

export default function TrustView() {
  const [engineers, setEngineers] = useState(0);
  const [isRedacted, setIsRedacted] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Calculate what-if scenario
  const costPerEngineer = 15000; // monthly cost
  const chartData = initialData.map((d, i) => ({
    month: d.month,
    cash: d.cash - (engineers * costPerEngineer * (i + 1)), // cumulative cost
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 flex items-center">
          <ShieldCheck className="w-6 h-6 mr-3 text-emerald-500" />
          Trust & Control
        </h1>
        <p className="text-zinc-400 mt-1">Features designed for financial executives.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Provenance Tracking */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-zinc-200 flex items-center mb-4">
            <Link2 className="w-5 h-5 mr-2 text-blue-400" />
            Provenance Tracking
          </h3>
          <p className="text-sm text-zinc-400 mb-4">
            Every generated number links back to the raw data source.
          </p>
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5">
            <p className="text-zinc-300 leading-relaxed">
              Based on the Q3 ledger analysis, overall marketing spend is up{' '}
              <button 
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors font-mono text-sm border border-blue-500/20 group"
              >
                10.4%
                <ArrowRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              {' '}compared to Q2. This was primarily driven by the new enterprise campaign.
            </p>
          </div>
        </div>

        {/* PII Redaction */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-zinc-200 flex items-center">
              <EyeOff className="w-5 h-5 mr-2 text-purple-400" />
              PII Redaction Layer
            </h3>
            <button 
              onClick={() => setIsRedacted(!isRedacted)}
              className="text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded transition-colors"
            >
              {isRedacted ? 'Show Raw Data' : 'Enable Redaction'}
            </button>
          </div>
          <p className="text-sm text-zinc-400 mb-4">
            Masks sensitive data before it leaves your server.
          </p>
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-sm">
            <div className="space-y-2">
              <div className="flex justify-between text-zinc-500 border-b border-zinc-800 pb-2">
                <span>Employee</span>
                <span>Account</span>
                <span>Amount</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>{isRedacted ? '[REDACTED_NAME_1]' : 'Sarah Jenkins'}</span>
                <span>{isRedacted ? '****-****-1234' : 'CHASE-9928-1234'}</span>
                <span>$4,250.00</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>{isRedacted ? '[REDACTED_NAME_2]' : 'Michael Chen'}</span>
                <span>{isRedacted ? '****-****-5521' : 'BOFA-1122-5521'}</span>
                <span>$3,800.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sensitivity Analysis (What-Ifs) */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-zinc-200 flex items-center mb-4">
            <SlidersHorizontal className="w-5 h-5 mr-2 text-amber-400" />
            Sensitivity Analysis (What-If Scenarios)
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <p className="text-sm text-zinc-400">
                Run deterministic simulations to see how decisions affect future runway.
              </p>
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-300 flex justify-between">
                  <span>New Engineering Hires</span>
                  <span className="text-emerald-400">{engineers}</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="20" 
                  value={engineers}
                  onChange={(e) => setEngineers(parseInt(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <p className="text-xs text-zinc-500">Assumes $15k/mo fully loaded cost per engineer.</p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                <p className="text-sm text-zinc-400">Projected Feb Cash Position</p>
                <p className={cn(
                  "text-2xl font-bold mt-1",
                  chartData[4].cash < 2000000 ? "text-red-400" : "text-emerald-400"
                )}>
                  ${(chartData[4].cash / 1000000).toFixed(2)}M
                </p>
              </div>
            </div>

            <div className="lg:col-span-2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="month" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis 
                    stroke="#71717a" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `$${value / 1000000}M`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                    itemStyle={{ color: '#10b981' }}
                    formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, 'Cash Position']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cash" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

      {/* Provenance Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <h3 className="text-lg font-semibold text-zinc-100 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-400" />
                Data Provenance: Marketing Spend
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-zinc-300">
                ✕
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-zinc-400 mb-4">
                The value <strong className="text-zinc-200">10.4%</strong> was calculated from the following underlying records:
              </p>
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left text-zinc-300">
                  <thead className="text-xs text-zinc-500 bg-zinc-900/50 border-b border-zinc-800">
                    <tr>
                      <th className="px-4 py-3 font-medium">Transaction ID</th>
                      <th className="px-4 py-3 font-medium">Vendor</th>
                      <th className="px-4 py-3 font-medium">Q2 Spend</th>
                      <th className="px-4 py-3 font-medium">Q3 Spend</th>
                      <th className="px-4 py-3 font-medium text-right">Delta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    <tr className="hover:bg-zinc-900/30">
                      <td className="px-4 py-3 font-mono text-xs">TXN-8821</td>
                      <td className="px-4 py-3">Google Ads</td>
                      <td className="px-4 py-3">$120,000</td>
                      <td className="px-4 py-3">$145,000</td>
                      <td className="px-4 py-3 text-right text-emerald-400">+$25,000</td>
                    </tr>
                    <tr className="hover:bg-zinc-900/30">
                      <td className="px-4 py-3 font-mono text-xs">TXN-8822</td>
                      <td className="px-4 py-3">LinkedIn Ads</td>
                      <td className="px-4 py-3">$45,000</td>
                      <td className="px-4 py-3">$52,000</td>
                      <td className="px-4 py-3 text-right text-emerald-400">+$7,000</td>
                    </tr>
                    <tr className="hover:bg-zinc-900/30">
                      <td className="px-4 py-3 font-mono text-xs">TXN-8823</td>
                      <td className="px-4 py-3">Agency Retainer</td>
                      <td className="px-4 py-3">$80,000</td>
                      <td className="px-4 py-3">$73,600</td>
                      <td className="px-4 py-3 text-right text-red-400">-$6,400</td>
                    </tr>
                    <tr className="bg-zinc-900/50 font-semibold">
                      <td colSpan={2} className="px-4 py-3 text-right">Total:</td>
                      <td className="px-4 py-3">$245,000</td>
                      <td className="px-4 py-3">$270,600</td>
                      <td className="px-4 py-3 text-right text-emerald-400">+10.4%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
