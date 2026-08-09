import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, DollarSign, Bell } from 'lucide-react';

export default function CFOGlance() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl border border-white/10 shadow-lg backdrop-blur-xl bg-black/40"
      style={{ boxShadow: 'var(--glass-premium)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="text-accent-primary" size={18} />
        <h2 className="text-sm font-semibold text-white/90">CFO Glance</h2>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
            <span className="text-xs text-white/50">Total Assets</span>
            <span className="text-sm font-bold text-white">$4.2M</span>
        </div>
        <div className="flex justify-between items-center">
            <span className="text-xs text-white/50">Runway</span>
            <span className="text-sm font-bold text-accent-success">14 Months</span>
        </div>
      </div>
    </motion.div>
  );
}
