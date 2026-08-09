'use client';

import React, { useState } from 'react';

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

  const btnBase = "flex items-center justify-center text-sm font-semibold rounded-xl transition-all duration-100 active:translate-y-[1px] active:shadow-none select-none";
  
  const numBtn = `${btnBase} hover:bg-white/[0.06]`;
  const opBtn = `${btnBase} hover:bg-white/[0.06]`;
  
  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
      <div 
        className="w-full max-w-[280px] rounded-2xl p-5"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--glass-border)' }}
      >
        {/* Display */}
        <div className="text-right mb-5 px-1">
          <p className="text-[10px] font-semibold h-4 truncate" style={{ color: 'var(--text-ghost)' }}>
            {equation}
          </p>
          <h2 
            className="text-4xl font-bold tracking-tight truncate mt-1"
            style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}
          >
            {display}
          </h2>
        </div>
        
        {/* Buttons */}
        <div className="grid grid-cols-4 gap-1.5">
          {/* Row 1: C / * - */}
          {['C', '/', '*', '-'].map((op) => (
            <button 
              key={op} 
              onClick={() => op === 'C' ? handleClear() : handleOperator(op)}
              className={`${opBtn} w-full h-[52px]`}
              style={{ 
                background: 'var(--surface-3)',
                color: 'var(--accent-primary)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
              }}
            >
              {op}
            </button>
          ))}

          {/* Row 2: 7 8 9 + */}
          {[7, 8, 9].map((val) => (
            <button 
              key={val} 
              onClick={() => handleInput(val.toString())}
              className={`${numBtn} w-full h-[52px]`}
              style={{ 
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--text-primary)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
              }}
            >
              {val}
            </button>
          ))}
          <button 
            onClick={() => handleOperator('+')}
            className={`${opBtn} w-full h-[108px] row-span-2`}
            style={{ 
              background: 'var(--surface-3)',
              color: 'var(--accent-primary)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }}
          >
            +
          </button>

          {/* Row 3: 4 5 6 */}
          {[4, 5, 6].map((val) => (
            <button 
              key={val} 
              onClick={() => handleInput(val.toString())}
              className={`${numBtn} w-full h-[52px]`}
              style={{ 
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--text-primary)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
              }}
            >
              {val}
            </button>
          ))}

          {/* Row 4: 1 2 3 = */}
          {[1, 2, 3].map((val) => (
            <button 
              key={val} 
              onClick={() => handleInput(val.toString())}
              className={`${numBtn} w-full h-[52px]`}
              style={{ 
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--text-primary)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
              }}
            >
              {val}
            </button>
          ))}
          <button 
            onClick={handleEqual}
            className={`${btnBase} w-full h-[108px] row-span-2`}
            style={{ 
              background: 'var(--accent-primary)',
              color: 'white',
              boxShadow: '0 2px 8px var(--accent-primary-glow), 0 1px 2px rgba(0,0,0,0.2)',
            }}
          >
            =
          </button>

          {/* Row 5: 0 . */}
          <button 
            onClick={() => handleInput('0')}
            className={`${numBtn} w-full h-[52px] col-span-2`}
            style={{ 
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--text-primary)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
            }}
          >
            0
          </button>
          <button 
            onClick={() => handleInput('.')}
            className={`${numBtn} w-full h-[52px]`}
            style={{ 
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--text-primary)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
            }}
          >
            .
          </button>
        </div>
      </div>
    </div>
  );
}
