'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  CreditCard, 
  FileText, 
  BrainCircuit, 
  Settings, 
  PieChart,
  Landmark,
  ShieldAlert,
  Tag,
  TrendingUp,
  ShoppingBag,
  BarChart3,
  Folder,
  Terminal as TerminalIcon,
  Activity,
  Search,
  Music,
  Sparkles,
  Database,
  Music2,
  Mic
} from 'lucide-react';

import Dashboard from '@/components/apps/Dashboard';
import SpendSense from '@/components/apps/SpendSense';
import PredictiveAR from '@/components/apps/PredictiveAR';
import AIBrain from '@/components/apps/AIBrain';
import BudgetBrain from '@/components/apps/BudgetBrain';
import Treasury from '@/components/apps/Treasury';
import TaxPilot from '@/components/apps/TaxPilot';
import VendorIQ from '@/components/apps/VendorIQ';
import InvestIQ from '@/components/apps/InvestIQ';
import DataMarket from '@/components/apps/DataMarket';
import SettingsApp from '@/components/apps/SettingsApp';
import AIFPNAStudio from '@/components/apps/AIFPNAStudio';
import FileExplorer from '@/components/apps/FileExplorer';
import Terminal from '@/components/apps/Terminal';
import Calculator from '@/components/apps/Calculator';
import Calendar from '@/components/apps/Calendar';
import TaskManager from '@/components/apps/TaskManager';
import GoogleApp from '@/components/apps/GoogleApp';
import NotesApp from '@/components/apps/NotesApp';
import SynapseMusic from '@/components/apps/SynapseMusic';

export type AppId = 
  | 'dashboard' 
  | 'spendsense' 
  | 'predictivear' 
  | 'budgetbrain' 
  | 'treasury' 
  | 'taxpilot' 
  | 'vendoriq' 
  | 'investiq' 
  | 'datamarket' 
  | 'aibrain' 
  | 'settings' 
  | 'fpnastudio' 
  | 'explorer' 
  | 'terminal' 
  | 'calculator' 
  | 'calendar'
  | 'taskmanager'
  | 'google'
  | 'notes'
  | 'music'
  | 'voice';

export interface AppDefinition {
  id: AppId;
  name: string;
  icon: any;
  color: string;
  component: React.ComponentType<any>;
  hidden?: boolean;
}

export const AppRegistry: AppDefinition[] = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, color: 'bg-blue-500', component: Dashboard },
  { id: 'spendsense', name: 'SpendSense', icon: CreditCard, color: 'bg-emerald-500', component: SpendSense },
  { id: 'predictivear', name: 'PredictiveAR', icon: FileText, color: 'bg-amber-500', component: PredictiveAR },
  { id: 'budgetbrain', name: 'BudgetBrain', icon: PieChart, color: 'bg-purple-500', component: BudgetBrain, hidden: true },
  { id: 'treasury', name: 'Treasury', icon: Landmark, color: 'bg-indigo-500', component: Treasury, hidden: true },
  { id: 'taxpilot', name: 'TaxPilot', icon: ShieldAlert, color: 'bg-rose-500', component: TaxPilot },
  { id: 'vendoriq', name: 'VendorIQ', icon: Tag, color: 'bg-teal-500', component: VendorIQ },
  { id: 'investiq', name: 'InvestIQ', icon: TrendingUp, color: 'bg-cyan-500', component: InvestIQ },
  { id: 'datamarket', name: 'DataMarket', icon: ShoppingBag, color: 'bg-pink-500', component: DataMarket, hidden: true },
  { id: 'fpnastudio', name: 'FP&A Studio', icon: BarChart3, color: 'bg-orange-500', component: AIFPNAStudio },
  { id: 'explorer', name: 'File Explorer', icon: Folder, color: 'bg-blue-600', component: FileExplorer },
  { id: 'terminal', name: 'Terminal', icon: TerminalIcon, color: 'bg-zinc-800', component: Terminal },
  { id: 'calculator', name: 'Calculator', icon: PieChart, color: 'bg-emerald-600', component: Calculator },
  { id: 'calendar', name: 'Calendar', icon: LayoutDashboard, color: 'bg-rose-600', component: Calendar },
  { id: 'taskmanager', name: 'Task Manager', icon: Activity, color: 'bg-zinc-700', component: TaskManager },
  { id: 'google', name: 'Google', icon: Search, color: 'bg-white', component: GoogleApp },
  { id: 'notes', name: 'Notes', icon: FileText, color: 'bg-amber-600', component: NotesApp },
  { id: 'music', name: 'Music', icon: Music, color: 'bg-indigo-600', component: SynapseMusic },
  { id: 'voice', name: 'Voice', icon: Mic, color: 'bg-blue-500', component: () => null }, // Placeholder for desktop icon
  { id: 'aibrain', name: 'Velyra', icon: Sparkles, color: 'bg-indigo-400', component: AIBrain },
  { id: 'settings', name: 'Settings', icon: Settings, color: 'bg-zinc-500', component: SettingsApp },
];
