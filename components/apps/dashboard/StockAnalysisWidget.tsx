'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Settings } from 'lucide-react';
import { getStockPrice } from '@/app/actions/stocks';

const ALL_STOCKS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'AMD'];

export default function StockAnalysisWidget() {
  const [selectedStocks, setSelectedStocks] = useState(['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA']);
  const [prices, setPrices] = useState<Record<string, any>>({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    async function fetchPrices() {
      const newPrices: Record<string, any> = {};
      for (const symbol of selectedStocks) {
        const data = await getStockPrice(symbol);
        if (data) newPrices[symbol] = data;
      }
      setPrices(newPrices);
    }
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [selectedStocks]);

  const toggleStock = (symbol: string) => {
    if (selectedStocks.includes(symbol)) {
      if (selectedStocks.length > 1) {
        setSelectedStocks(selectedStocks.filter(s => s !== symbol));
      }
    } else if (selectedStocks.length < 6) {
      setSelectedStocks([...selectedStocks, symbol]);
    }
  };

  return (
    <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-white">Market Watch</h3>
        <button onClick={() => setIsEditing(!isEditing)} className="text-zinc-500 hover:text-white">
          <Settings size={16} />
        </button>
      </div>

      {isEditing ? (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {ALL_STOCKS.map(symbol => (
            <button
              key={symbol}
              onClick={() => toggleStock(symbol)}
              className={`p-2 rounded-lg text-xs font-bold ${selectedStocks.includes(symbol) ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}
            >
              {symbol}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {selectedStocks.map(symbol => {
            const priceData = prices[symbol];
            const isUp = priceData ? priceData.change >= 0 : true;
            return (
              <div key={symbol} className="flex justify-between items-center p-3 bg-zinc-900 rounded-xl">
                <span className="font-bold text-white">{symbol}</span>
                <div className="text-right">
                  <div className="text-sm font-mono text-white">
                    {priceData ? `$${priceData.price.toFixed(2)}` : '...'}
                  </div>
                  <div className={`text-xs flex items-center justify-end ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {priceData ? `${Math.abs(priceData.change).toFixed(2)}%` : '...'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
