# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run format       # Prettier format src/** and app/**
npm run test         # Vitest unit tests (src/core/**/__tests__/**)
npm run test:watch   # Vitest watch mode
npm run test:e2e     # Playwright E2E tests
```

Run a single test file: `npx vitest run src/core/storage/__tests__/storage.test.ts`

## Architecture

```
src/
├── types/index.ts           # Global types: Mood, MoodEntry, FactorOption, JournalTemplate, etc.
├── core/                    # Infrastructure layer — no business logic
│   ├── storage/             # localStorage CRUD (entries, factors, settings, auth, sync, crypto, backup, stats)
│   ├── context/             # React Context global state (GlobalProvider → useGlobal, useSync, useAuth, useEntries)
│   ├── i18n/                # zh-CN / en-US, useTranslation() hook, I18nProvider
│   ├── config/              # Mood options, factor presets, template definitions
│   ├── api/                 # API client, auth API, sync API
│   └── ui/                  # Primitive UI components (Button, Card) with cva variants
├── modules/                 # Feature modules — each has components/ + index.ts barrel
│   ├── common/              # Providers (theme/toast), Sidebar, EmojiPicker, ConfirmDialog, Toast, ExportFormatDialog
│   ├── journal/             # MoodEditor (TipTap-based), JournalList, TemplatePicker, CustomTemplateEditor, SmartReminder
│   ├── dashboard/           # Stats dashboard with recharts
│   ├── calendar/            # CalendarView with mood heatmap
│   └── settings/            # Settings, PasswordLock, AuthModal, SyncSettings, ConflictResolution, ForgotPasswordModal
```

## Key patterns

- **Path alias**: `@/` maps to `src/` (e.g., `import { getEntries } from '@/core/storage'`)
- **CSS**: Tailwind with CSS variables in `app/globals.css`. Class merging via `cn()` from `@/core/utils`.
- **UI components**: Built with `class-variance-authority` (cva) — see `src/core/ui/button.tsx` for the pattern.
- **Data flow**: All data lives in localStorage. `GlobalProvider` polls every 3 seconds to sync state. Use `useEntries()` for entry data, `useAuth()` for auth state, `useSync()` for sync state.
- **i18n**: `useTranslation().t('key.path')` for string translations. Array values (e.g., weekDays) require `t<string[]>('calendar.weekDays', {})`.
- **App shell**: `app/page.tsx` is a single-page shell with sidebar navigation between 4 views: dashboard, calendar, journal, settings. `MoodEditor` is rendered as a modal overlay.
- **Rich text**: Journal content is HTML edited via TipTap (`RichTextEditor.tsx`). Content is stored as HTML strings in localStorage.
- **Theme**: Dark mode via `class` strategy. `useTheme()` hook provides `theme` and `setTheme` (light/dark/system).
- **Password lock**: `PasswordLock` component gates the entire app. Session validity checked in `Providers.tsx` on mount.
- **Sync**: Optional cloud sync with conflict resolution. Controlled via `SyncSettings` component and `useSync()` hook.

## LocalStorage keys

| Key | Content |
|-----|---------|
| `mood_journal_entries` | MoodEntry[] |
| `mood_journal_custom_factors` | FactorOption[] |
| `mood_journal_security` | SecuritySettings |
| `mood_journal_session` | SessionData |
| `mood_journal_locale` | Language code |
| `mood_journal_recent_emojis` | string[] |
| `mood-journal-theme` | light/dark/system |