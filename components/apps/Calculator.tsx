'use client';

import React, { useState } from 'react';
import { PieChart, Calculator as CalcIcon } from 'lucide-react';

export default function Calculator() {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');

  const handleInput = (val: string) => {
    if (display === '0') {
      setDisplay(val);
    } else {
      setDisplay(display + val);
    }
  };

  const handleOperator = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
  };

  const handleEqual = () => {
    try {
      const result = eval(equation + display);
      setDisplay(result.toString());
      setEquation('');
    } catch (e) {
      setDisplay('Error');
    }
  };

  return (
    <div className="h-full bg-transparent text-white font-sans flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-xs bg-zinc-900/50 border border-white/10 rounded-3xl p-6 shadow-2xl">
        <div className="text-right mb-6">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest h-4">{equation}</p>
          <h2 className="text-4xl font-black tracking-tighter truncate">{display}</h2>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {['C', '/', '*', '-'].map((op, i) => (
            <button 
              key={i} 
              onClick={() => op === 'C' ? handleClear() : handleOperator(op)}
              className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-sm font-bold hover:bg-white/10 transition-colors text-emerald-500"
            >
              {op}
            </button>
          ))}
          {[7, 8, 9].map((val, i) => (
            <button 
              key={i} 
              onClick={() => handleInput(val.toString())}
              className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-sm font-bold hover:bg-white/10 transition-colors"
            >
              {val}
            </button>
          ))}
          <button 
            onClick={() => handleOperator('+')}
            className="w-14 h-[120px] bg-white/5 rounded-2xl flex items-center justify-center text-sm font-bold hover:bg-white/10 transition-colors text-emerald-500 row-span-2"
          >
            +
          </button>
          {[4, 5, 6].map((val, i) => (
            <button 
              key={i} 
              onClick={() => handleInput(val.toString())}
              className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-sm font-bold hover:bg-white/10 transition-colors"
            >
              {val}
            </button>
          ))}
          {[1, 2, 3].map((val, i) => (
            <button 
              key={i} 
              onClick={() => handleInput(val.toString())}
              className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-sm font-bold hover:bg-white/10 transition-colors"
            >
              {val}
            </button>
          ))}
          <button 
            onClick={handleEqual}
            className="w-14 h-[120px] rounded-2xl flex items-center justify-center text-sm font-bold transition-colors bg-emerald-500 text-black hover:bg-emerald-400 row-span-2"
          >
            =
          </button>
          <button 
            onClick={() => handleInput('0')}
            className="w-full h-14 bg-white/5 rounded-2xl flex items-center justify-center text-sm font-bold hover:bg-white/10 transition-colors col-span-2"
          >
            0
          </button>
          <button 
            onClick={() => handleInput('.')}
            className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-sm font-bold hover:bg-white/10 transition-colors"
          >
            .
          </button>
        </div>
      </div>
    </div>
  );
}
