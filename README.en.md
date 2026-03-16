# Mood Journal

<p align="center">
  <strong>A Web application focused on personal mood tracking and journaling</strong>
</p>

<p align="center">
  <a href="README.md">中文</a> | <a href="README.en.md">English</a>
</p>

---

## 📋 Project Overview

**Mood Journal** is an elegant and simple mood tracking and journaling application that helps users record their daily mood states, write journals, tag influencing factors, and understand their emotional patterns through visual charts. All data is stored locally on the device to ensure privacy.

### ✨ Core Features

- 📝 **Daily Mood Recording** - 5 mood levels (Great, Good, Okay, Sad, Angry)
- 📅 **Calendar View** - Monthly view of history with mood heatmap
- 📊 **Statistics** - Streak counter, mood distribution, trend analysis
- 🏷️ **Factor Tags** - 12 preset tags + custom factors support
- 😀 **Emoji Picker** - 11 categories, 724+ emojis, search & recent usage
- 📝 **Journal Templates** - Multi-category preset templates + custom templates with variable support
- 🔔 **Smart Reminder** - Intelligent reminders based on recording habits
- 🔒 **Password Protection** - App lock, security questions recovery
- 🌍 **Multi-language** - Simplified Chinese / English
- 📷 **Photo Upload** - Multiple images support with preview
- 🔍 **Smart Search** - Filter by content, mood, factors, date
- 💾 **Data Management** - Export backup, data encryption

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14+ | React framework, App Router |
| **React** | 18+ | UI component library |
| **TypeScript** | 5+ | Type safety |
| **Tailwind CSS** | 3.4+ | Atomic CSS |
| **Lucide React** | latest | Icon library |
| **class-variance-authority** | latest | Component variant management |
| **tailwind-merge** | latest | Tailwind class merging |
| **localStorage** | - | Local data persistence |
| **Vitest** | latest | Unit testing |
| **Playwright** | latest | E2E testing |

---

## 📁 Project Structure

```
note/
├── app/                          # Next.js App Router
│   ├── globals.css               # Global styles & CSS variables
│   ├── layout.tsx                # Root layout (with Providers)
│   └── page.tsx                  # Main page
│
├── src/                          # Source code directory
│   ├── types/                    # Global type definitions
│   │   └── index.ts              # Mood, MoodEntry, ViewType, etc.
│   │
│   ├── core/                     # Core infrastructure
│   │   ├── ui/                   # Base UI components
│   │   │   ├── button.tsx        # Button component
│   │   │   ├── card.tsx          # Card component
│   │   │   └── index.ts          # UI components unified export
│   │   │
│   │   ├── utils/                # Utility functions
│   │   │   ├── index.ts          # cn() and other utilities
│   │   │   └── pinyin.ts         # Pinyin mapping and search
│   │   │
│   │   ├── config/               # Configuration files
│   │   │   ├── mood.ts           # Mood config, factor options
│   │   │   ├── templates.ts      # Journal template config
│   │   │   └── index.ts          # Config unified export
│   │   │
│   │   ├── storage/              # Storage management
│   │   │   ├── index.ts          # localStorage operations
│   │   │   ├── types.ts          # Storage-related types
│   │   │   └── __tests__/        # Storage module tests
│   │   │
│   │   ├── i18n/                 # Internationalization
│   │   │   ├── index.ts          # i18n unified export
│   │   │   ├── provider.tsx      # i18n Provider component
│   │   │   ├── types.ts          # i18n type definitions
│   │   │   └── locales/          # Language files
│   │   │       ├── zh-CN.json
│   │   │       └── en-US.json
│   │   │
│   │   └── index.ts              # Core module unified export
│   │
│   └── modules/                  # Feature modules
│       ├── common/               # Common/shared module
│       │   ├── components/
│       │   │   ├── Sidebar.tsx
│       │   │   ├── ConfirmDialog.tsx
│       │   │   ├── EmojiPicker.tsx
│       │   │   ├── Providers.tsx
│       │   │   └── index.ts
│       │   └── hooks/
│       │
│       ├── journal/              # Journal editing module
│       │   ├── components/
│       │   │   ├── JournalList.tsx
│       │   │   ├── MoodEditor.tsx
│       │   │   ├── TemplatePicker.tsx
│       │   │   ├── CustomTemplateEditor.tsx
│       │   │   ├── SmartReminder.tsx
│       │   │   └── index.ts
│       │   ├── hooks/
│       │   └── utils/
│       │
│       ├── dashboard/            # Dashboard module
│       │   ├── components/
│       │   │   ├── Dashboard.tsx
│       │   │   └── index.ts
│       │   └── hooks/
│       │
│       ├── calendar/             # Calendar module
│       │   ├── components/
│       │   │   ├── CalendarView.tsx
│       │   │   └── index.ts
│       │   └── hooks/
│       │
│       └── settings/             # Settings module
│           ├── components/
│           │   ├── Settings.tsx
│           │   ├── PasswordLock.tsx
│           │   └── index.ts
│           └── hooks/
│
├── test/                         # Test configuration
│   └── setup.ts                  # Vitest config
│
├── package.json                  # Dependencies
├── tailwind.config.ts            # Tailwind config
├── next.config.mjs               # Next.js config
├── tsconfig.json                 # TypeScript config
└── vitest.config.ts              # Vitest config
```

---

## 🔧 Core Modules

### 1. MoodEditor.tsx - Mood Editor

**Path**: `@/modules/journal/components/MoodEditor`

A feature-rich modal for creating and editing mood entries.

**Import:**
```typescript
// Recommended: Import via module index
import { MoodEditor } from '@/modules/journal';

// Or direct import
import MoodEditor from '@/modules/journal/components/MoodEditor';
```

**Features:**
- **Mood Selection**: 5 mood levels with emoji, colors, and styles
- **Factor Tags**: Display preset + custom factors, multi-select support
- **Rich Text Editor**: contentEditable with formatting toolbar
  - Bold, italic, underline, strikethrough
  - Left/center/right alignment
  - Insert divider
  - Undo/redo
  - Clear formatting
- **Resizable Height**: Drag handle to adjust height (80-500px)
- **Character Limit**: Max 5000 characters, auto-prevent overflow
- **Photo Upload**: Multi-file select, Base64 storage, preview & delete
- **Image Preview**: Modal for large image view with navigation

**Props Interface:**
```typescript
interface MoodEditorProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  initialMood?: Mood;
  initialJournal?: string;
  initialFactors?: string[];
  initialPhotos?: string[];
  onSave: (data: {
    mood: Mood;
    journal: string;
    factors: string[];
    photos: string[];
  }) => void;
}
```

---

### 2. EmojiPicker.tsx - Emoji Picker

**Path**: `@/modules/common/components/EmojiPicker`

A complete emoji selection component.

**Import:**
```typescript
// Recommended: Import via module index
import { EmojiPicker } from '@/modules/common/components';

// Or direct import
import EmojiPicker from '@/modules/common/components/EmojiPicker';
```

**Features:**
- **11 Categories**: Recent, Work & Study, Family, Health, Weather, Food, Entertainment, Animals, Transport, Emotions, Objects
- **724+ Emojis**: Rich emoji library
- **Smart Search**: Chinese/English keyword search
- **Recent Usage**: Auto-track last 16 selected emojis
- **Real-time Sync**: Update recent list immediately after selection
- **Responsive Layout**: 10-column grid, w-11 h-11 size, hover scale effect
- **Selected State**: Highlight current selected emoji

---

### 3. Dashboard.tsx - Dashboard

**Path**: `@/modules/dashboard/components/Dashboard`

Home page displaying key statistics.

**Import:**
```typescript
// Recommended: Import via module index
import { Dashboard } from '@/modules/dashboard';

// Or direct import
import Dashboard from '@/modules/dashboard/components/Dashboard';
```

**Features:**
- **Hero Banner**: Today's mood display, quick record entry
- **Stat Cards**:
  - Streak counter
  - Total entries
  - Most common mood
  - Positive mood ratio
- **Weekly Trend Chart**: Bar chart of last 7 days
- **Quick Check-in**: One-click mood selection
- **Recent Entries**: Last 5 entries with detail view

---

### 4. CalendarView.tsx - Calendar View

**Path**: `@/modules/calendar/components/CalendarView`

Monthly view of mood records.

**Import:**
```typescript
// Recommended: Import via module index
import { CalendarView } from '@/modules/calendar';

// Or direct import
import CalendarView from '@/modules/calendar/components/CalendarView';
```

**Features:**
- **Calendar Grid**: Full month display with marked dates
- **Mood Color Coding**: Different colors for different moods
- **Month Navigation**: Previous / Next / Today
- **Monthly Stats**: Count of each mood type
- **Mood Heatmap**: 90-day trend (GitHub-style)
- **Click Interaction**: Click date to open editor

---

### 5. JournalList.tsx - Journal List

**Path**: `@/modules/journal/components/JournalList`

Complete journal browsing and management interface.

**Import:**
```typescript
// Recommended: Import via module index
import { JournalList } from '@/modules/journal';

// Or direct import
import JournalList from '@/modules/journal/components/JournalList';
```

**Features:**
- **Search**: Full-text search (content, mood, factors, date)
- **Advanced Filters**:
  - Date range filter
  - Mood type multi-select
  - Factor multi-select
- **Smart Grouping**:
  - Recent (within week)
  - Archive by year/month/week
- **Expand/Collapse**: Click card to expand full content
- **Rich Text Rendering**: HTML content support
- **Pagination**: 10/20/50 per page
- **Edit/Delete**: Modify and delete entries
- **Smart Date Display**: Today, Yesterday, specific date

---

### 6. Settings.tsx - Settings

**Path**: `@/modules/settings/components/Settings`

App configuration and data management.

**Import:**
```typescript
// Recommended: Import via module index
import { Settings } from '@/modules/settings';

// Or direct import
import Settings from '@/modules/settings/components/Settings';
```

**Features:**
- **Language Switch**: Simplified Chinese / English, real-time
- **Privacy**: Data encryption option (reserved)
- **Password Protection**:
  - Set/change password
  - 1-5 security questions for recovery
  - Wrong attempt lockout
- **Custom Factors**:
  - Add factor (name + emoji)
  - Edit existing factors
  - Delete factor (with confirmation)
  - Drag to reorder
  - EmojiPicker for icon selection
- **Data Export**: Export all records as JSON
- **Clear Data**: Delete all records (with confirmation)
- **About**: App version and privacy info

---

### 7. Sidebar.tsx - Sidebar Navigation

**Path**: `@/modules/common/components/Sidebar`

Responsive sidebar navigation.

**Import:**
```typescript
// Recommended: Import via module index
import { Sidebar } from '@/modules/common/components';

// Or direct import
import Sidebar from '@/modules/common/components/Sidebar';
```

**Features:**
- **Nav Menu**: Dashboard, Calendar, Journal, Settings
- **Mobile Adaptation**: Hamburger menu + overlay
- **Current Highlight**: Highlight current page
- **Brand Display**: Logo and app name
- **Privacy Note**: Local storage info at bottom

---

### 8. ConfirmDialog.tsx - Confirmation Dialog

**Path**: `@/modules/common/components/ConfirmDialog`

Generic confirmation dialog component.

**Import:**
```typescript
// Recommended: Import via module index
import { ConfirmDialog } from '@/modules/common/components';

// Or direct import
import ConfirmDialog from '@/modules/common/components/ConfirmDialog';
```

**Props Interface:**
```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
}
```

---

### 9. PasswordLock.tsx - Password Lock

**Path**: `@/modules/settings/components/PasswordLock`

App password protection component.

**Import:**
```typescript
// Recommended: Import via module index
import { PasswordLock } from '@/modules/settings';

// Or direct import
import PasswordLock from '@/modules/settings/components/PasswordLock';
```

**Features:**
- Password input validation
- Wrong attempt limit and lockout
- Security questions for recovery
- Remember login state (session management)

---

### 10. Providers.tsx - Global Provider

**Path**: `@/modules/common/components/Providers`

Combines all global providers.

**Import:**
```typescript
// Recommended: Import via module index
import { Providers, useTheme } from '@/modules/common/components';

// Or direct import
import { Providers, useTheme } from '@/modules/common/components/Providers';
```

---

### 11. TemplatePicker.tsx - Template Picker

**Path**: `@/modules/journal/components/TemplatePicker`

Journal template selection component with rich preset and custom templates.

**Import:**
```typescript
// Recommended: Import via module index
import { TemplatePicker } from '@/modules/journal';

// Or direct import
import TemplatePicker from '@/modules/journal/components/TemplatePicker';
```

**Features:**
- **Multi-category Templates**: Work, Study, Travel, Health, Life categories
- **Favorites**: Bookmark frequently used templates for quick access
- **Recent Usage**: Automatically tracks recently used templates
- **Custom Templates**: Create, edit, and delete personal templates
- **Variable Support**: Templates support variables like `{{date}}`, `{{year}}`, `{{month}}` for auto-replacement
- **Category Icons**: Each category has corresponding emoji icons

**Props Interface:**
```typescript
interface TemplatePickerProps {
  isOpen: boolean;                    // Control visibility
  onClose: () => void;                // Close callback
  date: string;                       // Current date for variable substitution
  onSelectTemplate: (content: string) => void;  // Template selection callback
}
```

---

### 12. CustomTemplateEditor.tsx - Custom Template Editor

**Path**: `@/modules/journal/components/CustomTemplateEditor`

Component for creating and editing custom journal templates.

**Import:**
```typescript
// Recommended: Import via module index
import { CustomTemplateEditor } from '@/modules/journal';

// Or direct import
import CustomTemplateEditor from '@/modules/journal/components/CustomTemplateEditor';
```

**Features:**
- **Template Title**: Custom template name
- **Category Selection**: Choose template category (Work, Study, Travel, Health, Life)
- **Content Editing**: Multi-line text editing support
- **Variable Hints**: Display available template variables
- **Edit Mode**: Support editing existing custom templates

**Supported Variables:**
- `{{date}}` - Full date (YYYY-MM-DD)
- `{{year}}` - Year
- `{{month}}` - Month
- `{{day}}` - Day
- `{{weekday}}` - Weekday (English)
- `{{weekdayZh}}` - Weekday (Chinese)

---

### 13. SmartReminder.tsx - Smart Reminder

**Path**: `@/modules/journal/components/SmartReminder`

Smart reminder component that reminds users to write journal based on their habits.

**Import:**
```typescript
// Recommended: Import via module index
import { SmartReminder } from '@/modules/journal';

// Or direct import
import SmartReminder from '@/modules/journal/components/SmartReminder';
```

**Features:**
- **Smart Reminder Time**: Analyzes user's history to determine optimal reminder time
- **Streak Protection**: Reminds users to maintain consecutive recording days
- **Local Storage**: Reminder settings saved locally
- **Dismissible**: Users can choose to remind later or record now
- **Auto Check**: Checks every hour if reminder is needed

**Props Interface:**
```typescript
interface SmartReminderProps {
  entries: { date: string }[];        // Journal entries list
  onRemind: () => void;               // Reminder callback, opens editor
}
```

---

## 💾 Data Management

### Storage Solution

Using browser **localStorage** for local persistence:

| Storage Key | Content | Description |
|-------------|---------|-------------|
| `mood_journal_entries` | MoodEntry[] | All journal entries |
| `mood_journal_settings` | AppSettings | App settings (encryption) |
| `mood_journal_custom_factors` | FactorOption[] | Custom factors |
| `mood_journal_security` | SecuritySettings | Password settings |
| `mood_journal_session` | SessionData | Session state |
| `mood_journal_locale` | Locale | Language setting |
| `mood_journal_recent_emojis` | string[] | Recent emojis |

### Core Data Structures

```typescript
type Mood = 'great' | 'good' | 'okay' | 'sad' | 'angry';

interface MoodEntry {
  id: string;
  date: string;
  mood: Mood;
  journal: string;
  factors: string[];
  photos: string[];
  createdAt: string;
  updatedAt: string;
  journalEncrypted?: boolean;
}

interface FactorOption {
  id: string;
  label: string;
  emoji: string;
  isCustom?: boolean;
}

type ViewType = 'dashboard' | 'calendar' | 'journal' | 'settings';

interface MoodStats {
  great: number;
  good: number;
  okay: number;
  sad: number;
  angry: number;
}
```

### Storage Functions (@/core/storage)

```typescript
// Entry operations
import { getEntries, saveEntry, deleteEntry, getEntryByDate } from '@/core/storage';

function getEntries(): MoodEntry[];
function saveEntry(entry: MoodEntry): void;
function deleteEntry(id: string): void;
function getEntryByDate(date: string): MoodEntry | undefined;

// Statistics
function getStreak(): number;
function getMoodStats(): MoodStats;

// Custom factors
function getCustomFactors(): FactorOption[];
function saveCustomFactors(factors: FactorOption[]): void;
function addCustomFactor(factor: Omit<FactorOption, 'isCustom'>): FactorOption;
function updateCustomFactor(id: string, updates: Partial<FactorOption>): FactorOption | null;
function deleteCustomFactor(id: string): boolean;
function getAllFactors(): FactorOption[];

// Data management
function exportData(): string;
function clearAllData(): void;

// Password protection
function isPasswordEnabled(): boolean;
function isSessionValid(): boolean;
function verifyPassword(password: string): boolean;
function resetPassword(newPassword: string): { success: boolean; error?: string };
function getLockoutStatus(): { isLocked: boolean; remainingMinutes: number };
```

---

## 🎨 Design System

### Color System

```css
/* Base colors */
--background: 40 33% 98%;
--foreground: 263 20% 15%;
--primary: 263 70% 50%;
--secondary: 263 30% 95%;
--accent: 280 40% 93%;
--destructive: 0 84% 60%;
--border: 263 20% 90%;

/* Mood colors */
--mood-great: 38 92% 50%;
--mood-good: 152 69% 40%;
--mood-okay: 199 89% 48%;
--mood-sad: 234 65% 55%;
--mood-angry: 350 80% 58%;
```

### Animations

| Animation | Effect | Usage |
|-----------|--------|-------|
| `fade-in` | Fade in | Page load |
| `scale-in` | Scale in | Modal display |
| `slide-in` | Slide in | Sidebar |
| `hover:scale-110` | Hover scale | Emoji buttons |

---

## 🚀 Quick Start

### Requirements

- Node.js 18+
- npm 9+ or yarn 1.22+

### Installation

```bash
# 1. Enter project directory
cd note

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev

# 4. Open browser at http://localhost:3000
```

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (localhost:3000) |
| `npm run build` | Build production version |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:watch` | Watch mode testing |
| `npm run test:e2e` | Run E2E tests (Playwright) |

---

## 🌍 Internationalization (i18n)

### Usage

```typescript
import { useTranslation, useLocale } from '@/core/i18n';

function MyComponent() {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  
  return (
    <div>
      <h1>{t('app.title')}</h1>
      <p>{t('dashboard.streak')}</p>
      <p>{t('journal.recordCount', { count: 5 })}</p>
      <button onClick={() => setLocale('zh-CN')}>
        切换到中文
      </button>
    </div>
  );
}
```

### Array Type Translation Values

When retrieving array-type translation values (like `weekDays`), use generic parameter to specify return type:

```typescript
// Correct: Use generic parameter to get array type
const weekDays = t<string[]>('calendar.weekDays', {});
weekDays.map(day => ...);  // ✅ Works correctly

// Incorrect: Without generic, type is inferred as string
const weekDays = t('calendar.weekDays', {});
weekDays.map(day => ...);  // ❌ Compile error: .map is not a function
```

### Supported Languages

| Code | Language | File |
|------|----------|------|
| `zh-CN` | Simplified Chinese | `src/core/i18n/locales/zh-CN.json` |
| `en-US` | English | `src/core/i18n/locales/en-US.json` |

---

## 🧪 Testing

### Unit Tests (Vitest)

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# With coverage
npm run test -- --coverage
```

### E2E Tests (Playwright)

```bash
# Run E2E tests
npm run test:e2e

# With UI
npm run test:e2e -- --ui
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

```
MIT License

Copyright (c) 2024 Mood Journal

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

### License Summary

- **Free to Use**: You are free to use, modify, and distribute this software
- **Commercial Friendly**: Commercial use is allowed without requiring open-sourcing derivative works
- **Attribution Required**: Original copyright notice must be preserved
- **No Warranty**: Software is provided "as is" without any liability
