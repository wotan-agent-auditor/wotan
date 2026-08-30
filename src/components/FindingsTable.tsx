/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  AlertOctagon,
  AlertTriangle,
  AlertCircle,
  Info,
  Quote,
  Copy,
  Check,
  ShieldCheck,
  Building,
  ArrowUpDown,
  Sparkles,
  Download,
} from 'lucide-react';
import { AuditFinding, FindingCategory, FindingSeverity } from '../types';
import {
  CATEGORY_DEFINITIONS,
  getCategoryLabel,
  getSeverityBadgeStyles,
} from '../utils/auditHelpers';

interface FindingsTableProps {
  findings: AuditFinding[];
  selectedSeverity: 'all' | FindingSeverity;
  onSelectSeverity: (severity: 'all' | FindingSeverity) => void;
}

export const FindingsTable: React.FC<FindingsTableProps> = ({
  findings,
  selectedSeverity,
  onSelectSeverity,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | FindingCategory>('all');
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());
  const [copiedActionId, setCopiedActionId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'severity' | 'turn' | 'category'>('severity');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Toggle row expand
  const toggleRow = (id: string) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedRowIds(new Set(findings.map((f) => f.id)));
  };

  const collapseAll = () => {
    setExpandedRowIds(new Set());
  };

  const handleCopyAction = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedActionId(id);
    setTimeout(() => setCopiedActionId(null), 2000);
  };

  // Filter and sort findings
  const filteredFindings = useMemo(() => {
    const severityWeight: Record<FindingSeverity, number> = {
      Critical: 4,
      High: 3,
      Medium: 2,
      Low: 1,
    };

    return findings
      .filter((f) => {
        // Severity filter
        if (selectedSeverity !== 'all' && f.severity !== selectedSeverity) return false;
        // Category filter
        if (selectedCategory !== 'all' && f.category !== selectedCategory) return false;
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchEvidence = f.exactEvidence.toLowerCase().includes(q);
          const matchExplanation = f.explanation.toLowerCase().includes(q);
          const matchImpact = f.potentialBusinessImpact.toLowerCase().includes(q);
          const matchAction = f.recommendedCorrectiveAction.toLowerCase().includes(q);
          const matchCat = f.categoryLabel.toLowerCase().includes(q);
          if (!matchEvidence && !matchExplanation && !matchImpact && !matchAction && !matchCat) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortField === 'severity') {
          const diff = severityWeight[b.severity] - severityWeight[a.severity];
          return sortAsc ? -diff : diff;
        }
        if (sortField === 'turn') {
          const tA = a.turnNumber ?? 0;
          const tB = b.turnNumber ?? 0;
          return sortAsc ? tA - tB : tB - tA;
        }
        if (sortField === 'category') {
          return sortAsc
            ? a.categoryLabel.localeCompare(b.categoryLabel)
            : b.categoryLabel.localeCompare(a.categoryLabel);
        }
        return 0;
      });
  }, [findings, selectedSeverity, selectedCategory, searchQuery, sortField, sortAsc]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    findings.forEach((f) => {
      counts[f.category] = (counts[f.category] || 0) + 1;
    });
    return counts;
  }, [findings]);

  return (
    <div
      id="findings-table-card"
      className="p-6 rounded-2xl bg-[#111821] border border-[#253244] shadow-xl space-y-5"
    >
      {/* Header with Title and Quick Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#253244] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#F2F5F8] tracking-wide">
              Detailed Audit Findings
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#20C9D8]/15 text-[#20C9D8] border border-[#20C9D8]/30">
              {filteredFindings.length} of {findings.length}
            </span>
          </div>
          <p className="text-xs text-[#9CA9B8]">
            Forensic analysis of conversational defects, exact transcript evidence, and impact
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#9CA9B8] hover:text-[#F2F5F8] bg-[#151E29] hover:bg-[#253244] border border-[#253244] transition-colors cursor-pointer"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#9CA9B8] hover:text-[#F2F5F8] bg-[#151E29] hover:bg-[#253244] border border-[#253244] transition-colors cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#687686]" />
          <input
            id="findings-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search evidence, explanation, impact, or recommendation..."
            className="w-full pl-9 pr-4 py-2 bg-[#080B10] border border-[#253244] rounded-xl text-xs sm:text-sm text-[#F2F5F8] placeholder-[#687686] focus:outline-none focus:border-[#20C9D8]"
          />
        </div>

        {/* Severity Filter Dropdown */}
        <div className="flex items-center gap-2">
          <select
            id="findings-severity-select"
            value={selectedSeverity}
            onChange={(e) => onSelectSeverity(e.target.value as any)}
            className="px-3 py-2 bg-[#080B10] border border-[#253244] rounded-xl text-xs font-medium text-[#F2F5F8] focus:outline-none focus:border-[#20C9D8] cursor-pointer"
          >
            <option value="all">All Severities</option>
            <option value="Critical">Critical Only</option>
            <option value="High">High Only</option>
            <option value="Medium">Medium Only</option>
            <option value="Low">Low Only</option>
          </select>

          {/* Sort field */}
          <button
            type="button"
            onClick={() => {
              if (sortField === 'severity') setSortField('turn');
              else if (sortField === 'turn') setSortField('category');
              else setSortField('severity');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#080B10] border border-[#253244] rounded-xl text-xs font-medium text-[#9CA9B8] hover:text-[#F2F5F8] transition-colors cursor-pointer"
            title="Cycle sort order"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#20C9D8]" />
            <span className="capitalize">Sort: {sortField}</span>
          </button>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs custom-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-[#20C9D8] text-[#080B10] font-bold shadow-md shadow-[#20C9D8]/20'
              : 'bg-[#080B10] text-[#9CA9B8] hover:text-[#F2F5F8] hover:bg-[#151E29] border border-[#253244]'
          }`}
        >
          All Categories ({findings.length})
        </button>

        {(Object.keys(CATEGORY_DEFINITIONS) as FindingCategory[]).map((cat) => {
          const count = categoryCounts[cat] || 0;
          if (count === 0 && selectedCategory !== cat) return null;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#20C9D8] text-[#080B10] font-bold shadow-md shadow-[#20C9D8]/20'
                  : 'bg-[#080B10] text-[#9CA9B8] hover:text-[#F2F5F8] hover:bg-[#151E29] border border-[#253244]'
              }`}
            >
              <span>{CATEGORY_DEFINITIONS[cat]?.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                selectedCategory === cat ? 'bg-[#080B10]/20 text-[#080B10]' : 'bg-[#151E29] text-[#9CA9B8]'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Findings List / Table */}
      {filteredFindings.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-[#080B10] border border-[#253244]">
          <p className="text-sm font-medium text-[#687686]">No findings match the active filters.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              onSelectSeverity('all');
            }}
            className="mt-2 text-xs text-[#20C9D8] hover:underline cursor-pointer"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFindings.map((finding) => {
            const isExpanded = expandedRowIds.has(finding.id);
            const severityStyles = getSeverityBadgeStyles(finding.severity);

            return (
              <div
                key={finding.id}
                className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? 'bg-[#151E29] border-[#253244] shadow-lg ring-1 ring-[#20C9D8]/30'
                    : 'bg-[#080B10] border-[#253244] hover:border-[#20C9D8]/40 hover:bg-[#0D1219]'
                }`}
              >
                {/* Row Header (Always Visible) */}
                <div
                  onClick={() => toggleRow(finding.id)}
                  className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      className="p-1 rounded text-[#687686] hover:text-[#F2F5F8] shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-[#20C9D8]" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    {/* Severity Chip & Validation Badge */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono uppercase tracking-wider border ${severityStyles.pillBg}`}
                      >
                        {finding.severity}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase bg-[#31C48D]/15 text-[#31C48D] border border-[#31C48D]/40 hidden sm:inline-flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> VALIDATED
                      </span>
                    </div>

                    {/* Category Label */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#F2F5F8] text-sm truncate">
                          {finding.categoryLabel}
                        </span>
                        {finding.turnNumber && (
                          <span className="text-[10px] text-[#687686] font-mono hidden sm:inline">
                            Turn #{finding.turnNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#9CA9B8] truncate mt-0.5 max-w-xl">
                        {finding.explanation}
                      </p>
                    </div>
                  </div>

                  {/* Right side summary snippet */}
                  <div className="hidden md:flex items-center gap-3 shrink-0 text-xs text-[#687686]">
                    <span className="italic max-w-xs truncate text-[#687686]">
                      "{finding.exactEvidence.substring(0, 45)}..."
                    </span>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-[#253244] space-y-4 bg-[#080B10]">
                    {/* Black-Box Evidence Callout */}
                    <div className="p-3.5 rounded-lg bg-[#111821] border border-[#253244] space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#253244] pb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase tracking-wider bg-[#E5B33D]/15 text-[#E5B33D] border border-[#E5B33D]/30">
                            BLACK-BOX EVIDENCE
                          </span>
                          <span className="text-xs font-semibold text-[#F2F5F8]">
                            Exact Target Output
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-mono text-[#9CA9B8]">
                          <span>
                            <strong className="text-[#687686] font-normal">Source:</strong> Observed Target Behavior
                          </span>
                          <span>•</span>
                          <span>
                            <strong className="text-[#687686] font-normal">Surface:</strong> Public Chat/API
                          </span>
                          {finding.turnNumber && (
                            <>
                              <span>•</span>
                              <span className="text-[#20C9D8] font-semibold">Turn #{finding.turnNumber}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <blockquote className="text-xs forensic-mono text-[#E5B33D] bg-[#080B10] p-3 rounded border border-[#253244] leading-relaxed italic">
                        "{finding.exactEvidence}"
                      </blockquote>
                    </div>

                    {/* Explanation & Impact Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                      {/* Detailed Explanation */}
                      <div className="p-3 rounded-lg bg-[#111821] border border-[#253244]">
                        <span className="font-semibold text-[#F2F5F8] block mb-1">
                          Defect Explanation
                        </span>
                        <p className="text-[#9CA9B8] leading-relaxed">
                          {finding.explanation}
                        </p>
                      </div>

                      {/* Potential Business Impact */}
                      <div className="p-3 rounded-lg bg-[#F04452]/10 border border-[#F04452]/40">
                        <span className="font-semibold text-[#F04452] block mb-1">
                          Potential Business Impact
                        </span>
                        <p className="text-[#F2F5F8] leading-relaxed">
                          {finding.potentialBusinessImpact}
                        </p>
                      </div>
                    </div>

                    {/* Recommended Corrective Action */}
                    <div className="p-3.5 rounded-lg bg-[#20C9D8]/10 border border-[#20C9D8]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-[#20C9D8] block mb-1">
                          Recommended Corrective Action / Guardrail Rule
                        </span>
                        <p className="text-xs text-[#F2F5F8] forensic-mono leading-relaxed">
                          {finding.recommendedCorrectiveAction}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleCopyAction(finding.recommendedCorrectiveAction, finding.id)
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[#F2F5F8] hover:text-[#080B10] bg-[#151E29] hover:bg-[#20C9D8] border border-[#253244] transition-colors shrink-0 cursor-pointer"
                      >
                        {copiedActionId === finding.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#31C48D]" />
                            <span className="text-[#31C48D]">Copied Rule</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Prompt Rule</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
