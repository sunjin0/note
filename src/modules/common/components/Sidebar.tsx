'use client';

import React from 'react';
import { cn } from '@/core/utils';
import { ViewType } from '@/types';
import { useTranslation } from '@/core/i18n';
import { LayoutDashboard, Calendar, BookOpen, Settings, Heart, Menu, X } from 'lucide-react';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const NAV_ITEMS: { view: ViewType; label: string; icon: React.ElementType }[] = [
    { view: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { view: 'calendar', label: t('nav.calendar'), icon: Calendar },
    { view: 'journal', label: t('nav.journal'), icon: BookOpen },
    { view: 'settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden rounded-xl bg-card p-2.5 shadow-medium border border-border"
        aria-label={t('nav.menu')}
      >
        {mobileOpen ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5 text-foreground" />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full w-64 gradient-sidebar border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-border">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
            <Heart className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground">{t('app.title')}</h1>
            <p className="text-xs text-muted-foreground">{t('app.subtitle')}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(({ view, label, icon: Icon }) => (
            <button
              key={view}
              onClick={() => { onViewChange(view); setMobileOpen(false); }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                currentView === view
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
              {label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="rounded-xl bg-accent/50 p-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('settings.about.storageNote')}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
