/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertOctagon, AlertTriangle, AlertCircle, Info, Layers } from 'lucide-react';
import { FindingSeverity, SeverityCounts } from '../types';

interface SeveritySummaryCardsProps {
  counts: SeverityCounts;
  selectedSeverity: 'all' | FindingSeverity;
  onSelectSeverity: (severity: 'all' | FindingSeverity) => void;
}

export const SeveritySummaryCards: React.FC<SeveritySummaryCardsProps> = ({
  counts,
  selectedSeverity,
  onSelectSeverity,
}) => {
  const cards = [
    {
      id: 'all' as const,
      label: 'Total Findings',
      count: counts.total,
      icon: Layers,
      color: 'text-[#20C9D8]',
      activeBorder: 'border-[#20C9D8] ring-1 ring-[#20C9D8]/50 bg-[#151E29]',
      hoverBorder: 'hover:border-[#20C9D8]/40',
      bgGlow: 'from-[#20C9D8]/10 to-transparent',
    },
    {
      id: 'Critical' as const,
      label: 'Critical Severity',
      count: counts.critical,
      icon: AlertOctagon,
      color: 'text-[#F04452]',
      activeBorder: 'border-[#F04452] ring-1 ring-[#F04452]/50 bg-[#F04452]/10',
      hoverBorder: 'hover:border-[#F04452]/40',
      bgGlow: 'from-[#F04452]/10 to-transparent',
      badge: counts.critical > 0 ? 'Urgent Action' : undefined,
    },
    {
      id: 'High' as const,
      label: 'High Severity',
      count: counts.high,
      icon: AlertTriangle,
      color: 'text-[#F07836]',
      activeBorder: 'border-[#F07836] ring-1 ring-[#F07836]/50 bg-[#F07836]/10',
      hoverBorder: 'hover:border-[#F07836]/40',
      bgGlow: 'from-[#F07836]/10 to-transparent',
    },
    {
      id: 'Medium' as const,
      label: 'Medium Severity',
      count: counts.medium,
      icon: AlertCircle,
      color: 'text-[#E5B33D]',
      activeBorder: 'border-[#E5B33D] ring-1 ring-[#E5B33D]/50 bg-[#E5B33D]/10',
      hoverBorder: 'hover:border-[#E5B33D]/40',
      bgGlow: 'from-[#E5B33D]/10 to-transparent',
    },
    {
      id: 'Low' as const,
      label: 'Low Severity',
      count: counts.low,
      icon: Info,
      color: 'text-[#6B8EAD]',
      activeBorder: 'border-[#6B8EAD] ring-1 ring-[#6B8EAD]/50 bg-[#6B8EAD]/10',
      hoverBorder: 'hover:border-[#6B8EAD]/40',
      bgGlow: 'from-[#6B8EAD]/10 to-transparent',
    },
  ];

  return (
    <div id="severity-summary-cards" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = selectedSeverity === card.id;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectSeverity(card.id)}
            className={`p-4 rounded-xl border text-left transition-all duration-200 relative overflow-hidden group cursor-pointer ${
              isSelected
                ? card.activeBorder
                : `bg-[#111821] border-[#253244] ${card.hoverBorder} hover:bg-[#151E29]`
            }`}
          >
            {/* Top gradient glow */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGlow} opacity-30 pointer-events-none`} />

            <div className="relative z-10 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#9CA9B8] block truncate">{card.label}</span>
              <Icon className={`w-4 h-4 ${card.color} shrink-0`} />
            </div>

            <div className="relative z-10 mt-2 flex items-baseline justify-between">
              <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${card.color}`}>
                {card.count}
              </span>
              {card.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F04452]/20 text-[#F04452] border border-[#F04452]/40 animate-pulse">
                  {card.badge}
                </span>
              )}
            </div>

            <div className="relative z-10 mt-1 text-[11px] text-[#687686] flex items-center gap-1 group-hover:text-[#9CA9B8] transition-colors">
              <span>{isSelected ? 'Filtering active' : 'Click to filter'}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

