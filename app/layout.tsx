import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Synapse CFO Web OS',
  description: 'AI-native operating system for finance teams, featuring SpendSense for outflow intelligence and PredictiveAR for inflow intelligence.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
