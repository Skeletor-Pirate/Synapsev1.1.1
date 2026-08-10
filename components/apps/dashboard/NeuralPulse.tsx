import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

export default function NeuralPulse() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex gap-1 items-center justify-center py-4">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={shouldReduceMotion ? { opacity: 0.3 } : {
            scale: [1, 1.5, 1],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
          className="w-1.5 h-1.5 rounded-full bg-accent-cyan"
        />
      ))}
    </div>
  );
}
