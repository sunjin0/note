'use client';

import React from 'react';
import { Button } from '@/core/ui/button';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'default' | 'destructive' | 'outline';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  confirmVariant = 'destructive',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-sm bg-card rounded-2xl shadow-elevated border border-border animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
          </div>
          <button onClick={onCancel} className="rounded-lg p-1.5 hover:bg-accent transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 pt-0">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            {cancelText}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} className="flex-1">
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
