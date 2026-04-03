'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/core/ui/button';

interface InputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  label?: string;
  placeholder?: string;
  initialValue?: string;
  type?: 'text' | 'url' | 'email' | 'number' | 'password';
  icon?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  required?: boolean;
  validate?: (value: string) => boolean;
}

export default function InputDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  label,
  placeholder = '',
  initialValue = '',
  type = 'text',
  icon,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  required = true,
  validate,
}: InputDialogProps) {
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedValue = value.trim();

    if (required && !trimmedValue) return;
    if (validate && !validate(trimmedValue)) return;

    onConfirm(trimmedValue);
    onClose();
  };

  const isValid = () => {
    if (required && !value.trim()) return false;
    if (validate && !validate(value.trim())) return false;
    return true;
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-card rounded-xl shadow-elevated border border-border animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-accent transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4" noValidate>
          <div>
            {label && (
              <label className="text-xs font-medium text-foreground mb-2 block">{label}</label>
            )}
            <input
              type={type}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              {cancelText}
            </Button>
            <Button type="submit" disabled={!isValid()}>
              {confirmText}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
