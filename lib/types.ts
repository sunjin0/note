export type Mood = 'great' | 'good' | 'okay' | 'sad' | 'angry';

export interface MoodEntry {
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

export type ViewType = 'dashboard' | 'calendar' | 'journal' | 'settings';

export interface MoodStats {
  great: number;
  good: number;
  okay: number;
  sad: number;
  angry: number;
}

export const MOOD_CONFIG: Record<Mood, { emoji: string; label: string; color: string; bgClass: string; ringClass: string }> = {
  great: { emoji: '😊', label: '很棒', color: 'text-mood-great', bgClass: 'mood-bg-great', ringClass: 'mood-ring-great' },
  good: { emoji: '🙂', label: '不错', color: 'text-mood-good', bgClass: 'mood-bg-good', ringClass: 'mood-ring-good' },
  okay: { emoji: '😐', label: '一般', color: 'text-mood-okay', bgClass: 'mood-bg-okay', ringClass: 'mood-ring-okay' },
  sad: { emoji: '😢', label: '难过', color: 'text-mood-sad', bgClass: 'mood-bg-sad', ringClass: 'mood-ring-sad' },
  angry: { emoji: '😡', label: '生气', color: 'text-mood-angry', bgClass: 'mood-bg-angry', ringClass: 'mood-ring-angry' },
};

export const FACTOR_OPTIONS = [
  { id: 'work', label: '工作', emoji: '💼' },
  { id: 'family', label: '家庭', emoji: '👨‍👩‍👧‍👦' },
  { id: 'health', label: '健康', emoji: '💪' },
  { id: 'weather', label: '天气', emoji: '🌤️' },
  { id: 'exercise', label: '运动', emoji: '🏃' },
  { id: 'food', label: '饮食', emoji: '🍜' },
  { id: 'sleep', label: '睡眠', emoji: '😴' },
  { id: 'social', label: '社交', emoji: '👥' },
  { id: 'hobby', label: '爱好', emoji: '🎨' },
  { id: 'study', label: '学习', emoji: '📚' },
  { id: 'travel', label: '旅行', emoji: '✈️' },
  { id: 'love', label: '感情', emoji: '❤️' },
];
