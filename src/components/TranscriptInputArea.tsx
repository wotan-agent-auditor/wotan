/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Play,
  Sparkles,
  Trash2,
  FileText,
  ChevronDown,
  Check,
  Info,
  ShieldAlert,
  Zap,
  Upload,
  MessageSquare,
  AlertCircle,
  X,
} from 'lucide-react';
import { SAMPLE_TRANSCRIPTS, SampleTranscript } from '../data/sampleTranscripts';
import { WhatsAppParseResult } from '../types';
import { parseWhatsAppExport } from '../utils/whatsappParser';
import { WhatsAppPreviewModal } from './WhatsAppPreviewModal';

interface TranscriptInputAreaProps {
  transcript: string;
  onChangeTranscript: (val: string) => void;
  onRunAudit: () => void;
  isAuditing: boolean;
  selectedDomain: string;
  onChangeDomain: (domain: string) => void;
}

export const TranscriptInputArea: React.FC<TranscriptInputAreaProps> = ({
  transcript,
  onChangeTranscript,
  onRunAudit,
  isAuditing,
  selectedDomain,
  onChangeDomain,
}) => {
  const [selectedSampleId, setSelectedSampleId] = useState<string>('');
  const [showSamplesDropdown, setShowSamplesDropdown] = useState<boolean>(false);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // WhatsApp modal state
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState<boolean>(false);
  const [whatsAppParseResult, setWhatsAppParseResult] = useState<WhatsAppParseResult | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const lineCount = transcript.trim() ? transcript.trim().split('\n').length : 0;
  const charCount = transcript.length;

  const handleSelectSample = (sample: SampleTranscript) => {
    onChangeTranscript(sample.transcript);
    setSelectedSampleId(sample.id);
    setShowSamplesDropdown(false);
    setValidationError(null);
    if (sample.category.toLowerCase().includes('fin')) {
      onChangeDomain('Financial Services');
    } else if (sample.category.toLowerCase().includes('retail') || sample.category.toLowerCase().includes('e-commerce')) {
      onChangeDomain('Retail & E-Commerce');
    } else if (sample.category.toLowerCase().includes('saas')) {
      onChangeDomain('Enterprise SaaS');
    } else if (sample.category.toLowerCase().includes('telecom')) {
      onChangeDomain('Telecommunications');
    } else {
      onChangeDomain('Customer Support');
    }
  };

  const handleClear = () => {
    onChangeTranscript('');
    setSelectedSampleId('');
    setValidationError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && transcript.trim() && !isAuditing) {
      e.preventDefault();
      onRunAudit();
    }
  };

  const processUploadedFile = (file: File) => {
    setValidationError(null);
    if (!file.name.toLowerCase().endsWith('.txt') && file.type !== 'text/plain') {
      setValidationError(
        'Invalid file type. Please upload a standard WhatsApp exported conversation ".txt" file.'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content || !content.trim()) {
        setValidationError('The uploaded file is empty. Please choose a valid chat export.');
        return;
      }

      const result = parseWhatsAppExport(content);
      if (!result.success) {
        setValidationError(
          result.error ||
            'Unable to parse WhatsApp timestamps or sender format. Please verify the .txt file is an exported WhatsApp dialogue.'
        );
        return;
      }

      setUploadedFileName(file.name);
      setWhatsAppParseResult(result);
      setIsWhatsAppModalOpen(true);
    };

    reader.onerror = () => {
      setValidationError('Failed to read the uploaded file. Please try again.');
    };

    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processUploadedFile(files[0]);
    }
    // Reset file input so re-selecting same file triggers onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuditing) {
      setIsDraggingFile(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    if (isAuditing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleApplyWhatsAppTranscript = (normalizedText: string, runImmediately = false) => {
    onChangeTranscript(normalizedText);
    setSelectedSampleId('');
    setValidationError(null);

    if (runImmediately) {
      // Small timeout to allow state to settle
      setTimeout(() => {
        onRunAudit();
      }, 50);
    }
  };

  return (
    <div
      id="transcript-input-section"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-[#111821] rounded-2xl border shadow-xl overflow-hidden transition-all duration-150 ${
        isDraggingFile
          ? 'border-[#31C48D] ring-2 ring-[#31C48D]/30 bg-[#0D1219]'
          : 'border-[#253244]'
      }`}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        id="whatsapp-file-input"
        type="file"
        accept=".txt,text/plain"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Header controls bar */}
      <div className="px-5 py-4 border-b border-[#253244] flex flex-wrap items-center justify-between gap-3 bg-[#0D1219]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#20C9D8]/15 border border-[#20C9D8]/30 text-[#20C9D8]">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#F2F5F8] tracking-wide">Conversation Transcript</h2>
            <p className="text-xs text-[#9CA9B8]">Paste dialogue or upload exported WhatsApp TXT</p>
          </div>
        </div>

        {/* Action Pills & Sample Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Upload WhatsApp TXT Button */}
          <button
            id="upload-whatsapp-txt-btn"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAuditing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#31C48D] bg-[#31C48D]/15 hover:bg-[#31C48D]/25 border border-[#31C48D]/30 transition-colors active:scale-95 cursor-pointer"
            title="Upload an exported WhatsApp chat .txt file"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#31C48D]" />
            <span>Upload WhatsApp TXT</span>
          </button>

          {/* Sample Transcripts Menu */}
          <div className="relative">
            <button
              id="sample-transcripts-dropdown-btn"
              type="button"
              onClick={() => setShowSamplesDropdown(!showSamplesDropdown)}
              disabled={isAuditing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#F2F5F8] bg-[#151E29] hover:bg-[#253244] border border-[#253244] transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E5B33D]" />
              <span>Load Sample Scenario</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#9CA9B8]" />
            </button>

            {showSamplesDropdown && (
              <div
                id="sample-transcripts-menu"
                className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[#0D1219] border border-[#253244] shadow-2xl z-50 p-2 space-y-1 max-h-96 overflow-y-auto"
              >
                <div className="px-3 py-2 text-[11px] font-semibold text-[#9CA9B8] uppercase tracking-wider border-b border-[#253244]">
                  Preloaded Audit Test Cases
                </div>
                {SAMPLE_TRANSCRIPTS.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleSelectSample(sample)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex flex-col gap-1 cursor-pointer ${
                      selectedSampleId === sample.id
                        ? 'bg-[#151E29] border border-[#20C9D8]/50 text-[#F2F5F8]'
                        : 'hover:bg-[#111821] text-[#9CA9B8]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#F2F5F8] flex items-center gap-1.5">
                        {sample.title}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                          sample.expectedRisk === 'Critical'
                            ? 'bg-[#F04452]/20 text-[#F04452] border border-[#F04452]/30'
                            : sample.expectedRisk === 'High'
                            ? 'bg-[#F07836]/20 text-[#F07836] border border-[#F07836]/30'
                            : sample.expectedRisk === 'Medium'
                            ? 'bg-[#E5B33D]/20 text-[#E5B33D] border border-[#E5B33D]/30'
                            : 'bg-[#31C48D]/20 text-[#31C48D] border border-[#31C48D]/30'
                        }`}
                      >
                        {sample.expectedRisk} Risk
                      </span>
                    </div>
                    <p className="text-[11px] text-[#687686] line-clamp-2 leading-relaxed">
                      {sample.description}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clear button */}
          {transcript.length > 0 && (
            <button
              id="clear-transcript-btn"
              type="button"
              onClick={handleClear}
              disabled={isAuditing}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#9CA9B8] hover:text-[#F04452] hover:bg-[#F04452]/10 transition-colors cursor-pointer"
              title="Clear transcript text"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div
          id="transcript-validation-alert"
          className="mx-4 mt-4 p-3.5 rounded-xl bg-[#F04452]/10 border border-[#F04452]/40 text-[#F2F5F8] text-xs flex items-start justify-between gap-3 animate-in fade-in duration-200"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#F04452] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#F04452]">File Validation Notice</p>
              <p className="mt-0.5 text-[#9CA9B8] leading-relaxed">{validationError}</p>
            </div>
          </div>
          <button
            onClick={() => setValidationError(null)}
            type="button"
            className="text-[#9CA9B8] hover:text-[#F2F5F8] p-0.5 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Textarea */}
      <div className="relative p-4 sm:p-5">
        <textarea
          id="transcript-textarea"
          value={transcript}
          onChange={(e) => {
            onChangeTranscript(e.target.value);
            setSelectedSampleId('');
            setValidationError(null);
          }}
          onKeyDown={handleKeyDown}
          disabled={isAuditing}
          placeholder={`Paste your customer-agent dialogue or drop a WhatsApp export .txt file here, for example:

Customer: Hi, I'd like to return my order #4491...
AI Agent: Sure! Our policy gives 100% instant refund and you don't need to return the item.
Customer: Wait really?
AI Agent: Yes, I will wire $200 directly in 5 minutes.`}
          rows={11}
          className="w-full bg-[#080B10] text-[#F2F5F8] placeholder-[#687686] text-sm forensic-mono leading-relaxed rounded-xl p-4 border border-[#253244] focus:border-[#20C9D8] focus:ring-1 focus:ring-[#20C9D8] focus:outline-none resize-y min-h-[220px]"
        />

        {/* Drag overlay notice */}
        {isDraggingFile && (
          <div className="absolute inset-4 rounded-xl bg-[#0D1219]/95 border-2 border-dashed border-[#31C48D] flex flex-col items-center justify-center p-6 text-center pointer-events-none z-10 backdrop-blur-sm">
            <Upload className="w-10 h-10 text-[#31C48D] mb-2 animate-bounce" />
            <p className="text-sm font-bold text-[#F2F5F8]">Drop WhatsApp exported .txt file here</p>
            <p className="text-xs text-[#9CA9B8] mt-1">
              Supports iOS and Android WhatsApp timestamped formats
            </p>
          </div>
        )}

        {/* Quick format hint tag */}
        {transcript.length === 0 && !isDraggingFile && (
          <div className="absolute bottom-8 left-8 right-8 pointer-events-none hidden sm:flex items-center justify-between gap-2 text-xs text-[#687686] bg-[#0D1219]/90 p-3 rounded-lg border border-[#253244]">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#20C9D8] shrink-0" />
              <span>
                Tip: Paste dialogue, click <strong className="text-[#31C48D] font-medium">Upload WhatsApp TXT</strong>, or drag & drop a chat export.
              </span>
            </div>
            <span className="text-[11px] text-[#9CA9B8] bg-[#111821] px-2 py-0.5 rounded border border-[#253244] font-mono">
              iOS & Android WhatsApp Supported
            </span>
          </div>
        )}
      </div>

      {/* Footer bar with Stats & Run Button */}
      <div className="px-5 py-3.5 border-t border-[#253244] bg-[#0D1219] flex flex-wrap items-center justify-between gap-4">
        {/* Dialogue Metrics */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs text-[#9CA9B8] flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[#687686]">Lines:</span>
            <span className="forensic-mono text-[#F2F5F8] font-semibold">{lineCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#687686]">Words:</span>
            <span className="forensic-mono text-[#F2F5F8] font-semibold">{wordCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#687686]">Chars:</span>
            <span className="forensic-mono text-[#F2F5F8]">{charCount.toLocaleString()}</span>
          </div>

          {/* Large Transcript Segment Indicator */}
          {charCount > 24000 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#20C9D8]/15 text-[#20C9D8] border border-[#20C9D8]/30 animate-in fade-in">
              <Sparkles className="w-3 h-3 text-[#20C9D8]" />
              <span>Hierarchical Large-Transcript Engine (~{Math.max(2, Math.ceil(charCount / 18000))} segments)</span>
            </span>
          )}
        </div>

        {/* Run Audit Button */}
        <div className="flex items-center gap-3">
          <button
            id="run-audit-btn"
            type="button"
            onClick={onRunAudit}
            disabled={!transcript.trim() || isAuditing}
            className={`relative group inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-lg cursor-pointer ${
              !transcript.trim() || isAuditing
                ? 'bg-[#151E29] text-[#687686] cursor-not-allowed border border-[#253244]'
                : 'bg-[#20C9D8] hover:bg-[#20C9D8]/90 text-[#080B10] shadow-[#20C9D8]/20 hover:shadow-[#20C9D8]/30 active:scale-95'
            }`}
          >
            {isAuditing ? (
              <>
                <div className="w-4 h-4 border-2 border-[#080B10]/30 border-t-[#080B10] rounded-full animate-spin" />
                <span>Auditing with Gemini...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                <span>Run Audit</span>
                <span className="hidden md:inline-block text-[11px] font-mono font-normal opacity-80 pl-1 border-l border-[#080B10]/20">
                  ⌘ + ↵
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* WhatsApp Chat Preview & Role Configuration Modal */}
      <WhatsAppPreviewModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        parseResult={whatsAppParseResult}
        fileName={uploadedFileName}
        onApplyTranscript={handleApplyWhatsAppTranscript}
      />
    </div>
  );
};

