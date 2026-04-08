'use client';

import React from 'react';
import { Button } from '@/core/ui/button';
import { X, FileText, Download } from 'lucide-react';
import { useTranslation } from '@/core/i18n';

interface ExportFormatDialogProps {
  isOpen: boolean;
  onExportPDF: () => void;
  onExportJSON: () => void;
  onCancel: () => void;
}

export default function ExportFormatDialog({
  isOpen,
  onExportPDF,
  onExportJSON,
  onCancel,
}: ExportFormatDialogProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md bg-card rounded-2xl shadow-elevated border border-border animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">{t('journal.exportFormat.title')}</h3>
          </div>
          <button onClick={onCancel} className="rounded-lg p-1.5 hover:bg-accent transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">{t('journal.exportFormat.description')}</p>

          {/* PDF Option */}
          <div
            className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer group"
            onClick={onExportPDF}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {t('journal.exportFormat.pdf.title')}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('journal.exportFormat.pdf.description')}
                </p>
              </div>
            </div>
          </div>

          {/* JSON Option */}
          <div
            className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer group"
            onClick={onExportJSON}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {t('journal.exportFormat.json.title')}
                  </h4>
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded-full">
                    {t('journal.exportFormat.json.recommended')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('journal.exportFormat.json.description')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 pt-0">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            {t('journal.cancel')}
          </Button>
        </div>
      </div>
    </div>
  );
}
