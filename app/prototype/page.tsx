'use client';

import Link from 'next/link';
import {
  BadgeInfo,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  Heart,
  LayoutDashboard,
  Lock,
  MoreHorizontal,
  NotebookPen,
  PanelLeft,
  PenSquare,
  Search,
  Settings,
  Sparkles,
  Star,
  SunMedium,
  Upload,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/ui/card';

const moodItems = [
  { label: '很棒', emoji: '😊', active: true },
  { label: '不错', emoji: '🙂' },
  { label: '一般', emoji: '😐' },
  { label: '难过', emoji: '😢' },
  { label: '生气', emoji: '😡' },
];

const factorItems = ['工作', '家庭', '健康', '天气', '运动', '饮食', '睡眠', '社交'];

const templateItems = ['工作日常', '学习复盘', '运动记录', '睡眠观察'];

const prototypeScreens = [
  {
    id: 'lock',
    title: '应用锁屏页',
    icon: Lock,
    accent: 'from-slate-700 via-slate-600 to-zinc-700',
    render: () => (
      <div className="mx-auto flex min-h-[660px] max-w-[430px] flex-col justify-between rounded-[2rem] border border-border bg-card p-6 shadow-[0_24px_90px_rgba(15,23,42,0.12)]">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
              <Heart className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">Mood Journal</p>
              <h3 className="text-2xl font-bold">心情日记</h3>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-3xl font-semibold tracking-tight">输入密码，进入你的每日记录</p>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">门禁页面强调安全与克制，把访问门槛压到最短，同时保留找回入口和锁定反馈。</p>
          </div>

          <div className="space-y-4 rounded-[1.75rem] border border-border bg-background p-5 shadow-sm">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>访问密码</span>
                <span>忘记密码</span>
              </div>
              <div className="rounded-2xl border border-border bg-muted/50 px-4 py-4 text-center text-lg tracking-[0.5em] text-foreground">
                • • • • • •
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((item) => (
                <div key={item} className="rounded-2xl border border-border bg-card py-3 text-center text-muted-foreground shadow-sm">
                  {item}
                </div>
              ))}
            </div>

            <button className="w-full rounded-2xl bg-primary py-3.5 text-sm font-medium text-primary-foreground shadow-soft">解锁进入</button>
          </div>
        </div>

        <div className="rounded-[1.5rem] bg-gradient-to-r from-amber-500/10 to-fuchsia-500/10 p-4 text-sm leading-6 text-muted-foreground">
          错误次数过多时会显示锁定倒计时，并提供安全问题找回。
        </div>
      </div>
    ),
  },
  {
    id: 'dashboard',
    title: '仪表盘页',
    icon: LayoutDashboard,
    accent: 'from-violet-700 via-fuchsia-600 to-rose-500',
    render: () => (
      <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_24px_90px_rgba(15,23,42,0.12)]">
        <div className="flex min-h-[720px]">
          <aside className="hidden w-72 border-r border-border bg-background/80 px-5 py-6 lg:block">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">Mood Journal</p>
                <h3 className="font-semibold">心情日记</h3>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {['仪表盘', '日历', '日记本', '设置'].map((item, index) => (
                <div
                  key={item}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3 ${index === 0 ? 'bg-primary text-primary-foreground shadow-soft' : 'text-muted-foreground hover:bg-muted/60'}`}
                >
                  <span>{item}</span>
                  {index === 0 ? <Star className="h-4 w-4" /> : null}
                </div>
              ))}
            </div>
          </aside>

          <main className="flex-1 p-6 md:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                  今日概览
                </div>
                <h2 className="mt-3 text-3xl font-bold tracking-tight">今天感觉不错</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  这是一个带明显主次层级的首页：上方承载情绪概览，中间承载统计和趋势，底部承载最近记录与快速操作。
                </p>
              </div>
              <button className="rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-soft">记录今日心情</button>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
              <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-fuchsia-600 to-rose-500 p-7 text-white shadow-[0_24px_90px_rgba(124,58,237,0.25)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs">今天</div>
                    <h3 className="mt-4 text-4xl font-bold tracking-tight">😊 不错</h3>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-white/85">快速记录今日心情、影响因素和照片，保存后立刻刷新统计、日历和列表。</p>
                  </div>
                  <div className="rounded-[1.5rem] bg-white/15 p-5 text-5xl shadow-inner">🙂</div>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-3">
                  {[
                    ['连续记录', '18 天'],
                    ['总记录数', '124 条'],
                    ['积极比例', '76%'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-[1.25rem] bg-white/15 px-4 py-4 backdrop-blur">
                      <p className="text-xs text-white/75">{label}</p>
                      <p className="mt-2 text-2xl font-bold">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                {[
                  { title: '连续记录', value: '18 天', tone: 'from-violet-500/20 to-fuchsia-500/10' },
                  { title: '总记录数', value: '124 条', tone: 'from-sky-500/20 to-cyan-500/10' },
                  { title: '最常心情', value: '🙂 不错', tone: 'from-emerald-500/20 to-lime-500/10' },
                  { title: '积极比例', value: '76%', tone: 'from-amber-500/20 to-orange-500/10' },
                ].map((item) => (
                  <div key={item.title} className={`rounded-[1.5rem] bg-gradient-to-br ${item.tone} p-[1px]`}>
                    <div className="rounded-[1.45rem] bg-card p-5">
                      <p className="text-sm text-muted-foreground">{item.title}</p>
                      <p className="mt-3 text-3xl font-bold tracking-tight">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[2rem] border border-border bg-background p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">本周趋势</h3>
                    <p className="text-sm text-muted-foreground">支持 7 / 30 / 90 天趋势切换</p>
                  </div>
                  <div className="flex gap-1 text-xs text-muted-foreground">
                    <span className="rounded-full bg-primary px-3 py-1 text-primary-foreground">7天</span>
                    <span className="rounded-full bg-muted px-3 py-1">30天</span>
                    <span className="rounded-full bg-muted px-3 py-1">90天</span>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-3">
                  {[58, 72, 48, 80, 66, 74, 88].map((h, index) => (
                    <div key={index} className="flex h-52 flex-col justify-end rounded-[1.5rem] bg-muted/30 p-2">
                      <div className="rounded-[1.25rem] bg-gradient-to-t from-primary via-fuchsia-500 to-rose-400" style={{ height: `${h}%` }} />
                      <span className="mt-2 text-center text-xs text-muted-foreground">{['一', '二', '三', '四', '五', '六', '日'][index]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-border bg-background p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">最近记录</h3>
                    <p className="text-sm text-muted-foreground">可点击进入对应日期编辑</p>
                  </div>
                  <button className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">查看全部</button>
                </div>
                <div className="space-y-3">
                  {[
                    ['2026-05-15', '🙂 不错', '项目推进顺利，晚上散步放松。'],
                    ['2026-05-14', '😐 一般', '工作比较忙，晚上需要早点休息。'],
                    ['2026-05-13', '😊 很棒', '完成了一个重要里程碑。'],
                  ].map(([date, mood, desc]) => (
                    <div key={date} className="rounded-[1.25rem] border border-border p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{date}</p>
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">{mood}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    ),
  },
  {
    id: 'calendar',
    title: '日历页',
    icon: Calendar,
    accent: 'from-sky-700 via-cyan-600 to-teal-500',
    render: () => (
      <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_24px_90px_rgba(15,23,42,0.12)]">
        <div className="flex min-h-[720px] flex-col gap-5 p-5 md:p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">日期定位与趋势查看</p>
              <h3 className="text-3xl font-bold tracking-tight">2026年5月</h3>
            </div>
            <div className="flex gap-2">
              <button className="rounded-2xl border border-border bg-background p-2.5"><ChevronLeft className="h-4 w-4" /></button>
              <button className="rounded-2xl border border-border bg-background p-2.5"><ChevronRight className="h-4 w-4" /></button>
              <button className="rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground">今天</button>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[2rem] border border-border bg-background p-5">
              <div className="mb-4 grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground">
                {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
                  <div key={d} className="py-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }).map((_, index) => {
                  const current = index >= 4 && index <= 33;
                  const highlighted = [6, 8, 11, 15, 17, 20, 24, 27, 31].includes(index);
                  return (
                    <div
                      key={index}
                      className={`min-h-28 rounded-[1.4rem] border p-2 ${current ? 'border-border bg-card' : 'border-dashed border-border/60 bg-muted/25 text-muted-foreground'}`}
                    >
                      <div className="flex items-start justify-between text-xs">
                        <span>{current ? index - 3 : ''}</span>
                        {highlighted ? <span className="text-base">{['😊', '🙂', '😐', '😢'][index % 4]}</span> : null}
                      </div>
                      {highlighted ? <div className="mt-4 rounded-full bg-primary/10 px-2 py-1 text-center text-[10px] text-primary">有记录</div> : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[2rem] border border-border bg-background p-5">
                <h4 className="text-lg font-semibold">本月统计</h4>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  {[
                    ['记录天数', '21'],
                    ['积极比例', '76%'],
                    ['最长连续', '12'],
                    ['最常心情', '🙂'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-[1.25rem] bg-muted/40 p-4">
                      <p className="text-muted-foreground">{label}</p>
                      <p className="mt-2 text-2xl font-bold">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-border bg-background p-5">
                <h4 className="text-lg font-semibold">90 天热图</h4>
                <div className="mt-4 grid grid-cols-9 gap-2">
                  {Array.from({ length: 54 }).map((_, index) => (
                    <div key={index} className={`aspect-square rounded-[0.35rem] ${index % 5 === 0 ? 'bg-primary/90' : index % 4 === 0 ? 'bg-primary/60' : index % 3 === 0 ? 'bg-primary/35' : 'bg-muted/80'}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'journal',
    title: '日记列表页',
    icon: Search,
    accent: 'from-emerald-700 via-lime-600 to-green-500',
    render: () => (
      <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_24px_90px_rgba(15,23,42,0.12)]">
        <div className="grid min-h-[720px] gap-0 xl:grid-cols-[320px_1fr]">
          <aside className="border-b border-border bg-background p-5 xl:border-b-0 xl:border-r">
            <div className="mb-4 flex items-center gap-2 rounded-[1.25rem] border border-border bg-muted/40 px-4 py-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">搜索日记、心情、因素...</span>
            </div>
            <div className="space-y-3">
              <div className="rounded-[1.5rem] border border-border p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium"><Filter className="h-4 w-4" />筛选</div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="rounded-xl bg-muted/60 px-3 py-2">日期范围：最近 30 天</div>
                  <div className="rounded-xl bg-muted/60 px-3 py-2">心情：🙂 😐 😢</div>
                  <div className="rounded-xl bg-muted/60 px-3 py-2">因素：工作 / 睡眠 / 运动</div>
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-border p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium"><MoreHorizontal className="h-4 w-4" />分组</div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="rounded-xl bg-muted/60 px-3 py-2">最近一周</div>
                  <div className="rounded-xl bg-muted/60 px-3 py-2">按月归档</div>
                  <div className="rounded-xl bg-muted/60 px-3 py-2">按年归档</div>
                </div>
              </div>
            </div>
          </aside>

          <main className="p-5 md:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
                  <PanelLeft className="h-3.5 w-3.5" />
                  记录浏览
                </div>
                <h3 className="mt-3 text-3xl font-bold tracking-tight">日记本</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">共 124 条记录，支持搜索、筛选、展开详情和二次确认删除。</p>
              </div>
              <button className="rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-soft">新建记录</button>
            </div>

            <div className="space-y-3">
              {[
                { date: '2026-05-15', mood: '🙂 不错', factor: '工作 / 运动', text: '今天的会议推进顺利，晚上跑步后状态更好了。' },
                { date: '2026-05-14', mood: '😐 一般', factor: '睡眠 / 天气', text: '昨晚睡得有点晚，白天效率一般。' },
                { date: '2026-05-13', mood: '😊 很棒', factor: '家庭 / 爱好', text: '和家人一起做饭，晚上画画放松。' },
              ].map((item, index) => (
                <div key={item.date} className="rounded-[1.5rem] border border-border bg-background p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        <span>{item.date}</span>
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">{item.mood}</span>
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{item.factor}</span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.text}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-muted-foreground">
                      <button className="rounded-xl border border-border p-2"><PenSquare className="h-4 w-4" /></button>
                      <button className="rounded-xl border border-border p-2"><CheckCircle2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  {index === 0 ? <div className="mt-4 rounded-[1.25rem] bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">展开详情后展示富文本内容、照片列表和更多操作。</div> : null}
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    ),
  },
  {
    id: 'settings',
    title: '设置页',
    icon: Settings,
    accent: 'from-teal-700 via-cyan-600 to-sky-500',
    render: () => (
      <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_24px_90px_rgba(15,23,42,0.12)]">
        <div className="grid min-h-[720px] gap-0 xl:grid-cols-[1fr_360px]">
          <main className="p-5 md:p-6">
            <div className="mb-5">
              <h3 className="text-3xl font-bold tracking-tight">设置</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">语言、安全、因素和数据管理入口。</p>
            </div>
            <div className="space-y-4">
              {[
                { title: '语言设置', desc: '简体中文 / English', icon: Sparkles },
                { title: '隐私与安全', desc: '密码保护、找回与会话控制', icon: Lock },
                { title: '自定义因素', desc: '新增、编辑、删除、排序', icon: Heart },
                { title: '数据导出', desc: '导出 JSON / PDF', icon: Upload },
                { title: '清空数据', desc: '需要二次确认', icon: MoreHorizontal },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-center justify-between rounded-[1.5rem] border border-border bg-background p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                );
              })}
            </div>
          </main>

          <aside className="border-t border-border bg-background p-5 xl:border-l xl:border-t-0">
            <div className="rounded-[1.75rem] border border-border bg-card p-5">
              <h4 className="font-semibold">自定义因素管理</h4>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">支持从预设因素中选择，也可添加自定义因素。</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {factorItems.map((item) => (
                  <span key={item} className="rounded-full border border-border bg-muted/50 px-3 py-2 text-sm">{item}</span>
                ))}
                <button className="rounded-full border border-dashed border-primary px-3 py-2 text-sm text-primary">+ 添加因素</button>
              </div>
            </div>

            <div className="mt-4 rounded-[1.75rem] border border-border bg-card p-5">
              <h4 className="font-semibold">导出 / 恢复</h4>
              <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                <div className="rounded-2xl bg-muted/50 p-3">导出记录、模板、因素和安全信息</div>
                <div className="rounded-2xl bg-muted/50 p-3">导出后可用于备份恢复</div>
                <div className="rounded-2xl bg-muted/50 p-3">清空前必须二次确认</div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    ),
  },
  {
    id: 'editor',
    title: '心情编辑器',
    icon: NotebookPen,
    accent: 'from-amber-700 via-orange-600 to-rose-500',
    render: () => (
      <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_24px_90px_rgba(15,23,42,0.12)]">
        <div className="grid min-h-[760px] gap-0 xl:grid-cols-[1.1fr_0.9fr]">
          <main className="p-5 md:p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">2026-05-15</p>
                <h3 className="text-3xl font-bold tracking-tight">记录心情</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">页面使用强层级的表单布局，保证记录动作一眼可见。</p>
              </div>
              <div className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">草稿已保存</div>
            </div>

            <div className="space-y-5 rounded-[1.75rem] border border-border bg-background p-5 shadow-sm">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium">选择心情</p>
                  <span className="text-xs text-muted-foreground">单选</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {moodItems.map((item) => (
                    <button
                      key={item.label}
                      className={`rounded-[1.25rem] border p-3 text-center transition ${
                        item.active ? 'border-primary bg-primary/10 shadow-soft' : 'border-border bg-card'
                      }`}
                    >
                      <div className="text-2xl">{item.emoji}</div>
                      <div className="mt-1 text-xs">{item.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium">影响因素</p>
                  <span className="text-xs text-muted-foreground">多选</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {factorItems.map((factor, index) => (
                    <span
                      key={factor}
                      className={`rounded-full px-3 py-2 text-sm ${index < 4 ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}
                    >
                      {factor}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium">日记内容</p>
                  <div className="flex gap-1 text-xs text-muted-foreground">
                    <span className="rounded-md border border-border px-2 py-1">加粗</span>
                    <span className="rounded-md border border-border px-2 py-1">斜体</span>
                    <span className="rounded-md border border-border px-2 py-1">对齐</span>
                    <span className="rounded-md border border-border px-2 py-1">图片</span>
                  </div>
                </div>
                <div className="min-h-48 rounded-[1.5rem] border border-border bg-card p-5 text-sm leading-7 text-muted-foreground">
                  今天的会议推进比较顺利，下午完成了一个重要节点。晚上去跑步之后，感觉状态明显轻松了很多。
                  <br />
                  <br />
                  富文本编辑区下面是照片和模板入口，所有核心动作都在同一视域内完成。
                </div>
              </div>
            </div>
          </main>

          <aside className="border-t border-border bg-background p-5 xl:border-l xl:border-t-0">
            <div className="space-y-4">
              <div className="rounded-[1.75rem] border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">模板入口</h4>
                  <BadgeInfo className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-4 space-y-2">
                  {templateItems.map((tpl, index) => (
                    <div key={tpl} className={`rounded-2xl px-4 py-3 text-sm ${index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted/50'}`}>
                      {tpl}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">照片上传</h4>
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="aspect-square rounded-2xl bg-gradient-to-br from-muted to-muted/30 p-2">
                      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
                        照片 {n}
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-4 w-full rounded-2xl border border-dashed border-primary py-3 text-sm text-primary">+ 添加照片</button>
              </div>

              <div className="rounded-[1.75rem] border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">保存状态</span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">保存中</span>
                </div>
                <div className="mt-4 flex gap-3">
                  <button className="flex-1 rounded-2xl border border-border bg-card py-3 text-sm">取消</button>
                  <button className="flex-1 rounded-2xl bg-primary py-3 text-sm text-primary-foreground">保存记录</button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    ),
  },
];

function SectionBadge({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <Card className="border-border/70 shadow-soft">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

function PreviewFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-border bg-background shadow-[0_24px_90px_rgba(15,23,42,0.12)]">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
        </div>
        <div className="rounded-full bg-background px-3 py-1 text-xs text-muted-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">/prototype</div>
      </div>
      {children}
    </div>
  );
}

export default function PrototypePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border bg-gradient-to-br from-background via-background to-accent/20">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
                <BadgeInfo className="h-3.5 w-3.5" />
                商业级页面原型
              </div>
              <h1 className="text-3xl font-bold tracking-tight md:text-5xl">心情日记真实页面原型</h1>
              <p className="text-sm leading-6 text-muted-foreground md:text-base">
                本页直接渲染真实页面骨架、视觉层级和交互布局，不是说明卡片。页面代码保存在当前项目内，可通过 `/prototype` 访问。
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-2xl border border-input bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                返回主应用
              </Link>
              <a
                href="#screens"
                className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:brightness-110"
              >
                查看详细页面
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10 space-y-8">
        <div className="grid gap-4 md:grid-cols-3">
          <SectionBadge icon={LayoutDashboard} title="页面清单" desc="覆盖锁屏、仪表盘、日历、日记列表、设置和编辑器。" />
          <SectionBadge icon={PanelLeft} title="页面流程" desc="支持主流程、记录流程和提醒流程。" />
          <SectionBadge icon={Sparkles} title="状态说明" desc="覆盖空态、加载态、异常态和编辑态。" />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            ['层级', '强主次、强入口、强状态'],
            ['节奏', '大面积留白 + 紧凑信息块'],
            ['视觉', '渐变、卡片、浮层、柔和阴影'],
            ['组件', '统一按钮、标签、输入、列表'],
          ].map(([title, desc]) => (
            <Card key={title} className="border-border/70 shadow-soft">
              <CardHeader className="space-y-2">
                <CardTitle className="text-base">{title}</CardTitle>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="rounded-[2rem] border border-border bg-background p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">原型定位</p>
              <h2 className="text-2xl font-bold">页面级视觉原型</h2>
            </div>
            <div className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">更强层级 / 更真实布局 / 更接近成品</div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[1.25rem] bg-muted/40 p-4 text-sm">左侧导航 + 主内容的桌面布局</div>
            <div className="rounded-[1.25rem] bg-muted/40 p-4 text-sm">卡片、列表、表单、热图和标签</div>
            <div className="rounded-[1.25rem] bg-muted/40 p-4 text-sm">按钮、空态、状态和危险操作</div>
          </div>
        </div>

        <div id="screens" className="space-y-10">
          {prototypeScreens.map((screen) => {
            const Icon = screen.icon;
            return (
              <section key={screen.id} className="space-y-4">
                <div className={`rounded-[2rem] bg-gradient-to-r ${screen.accent} p-5 md:p-6 text-white shadow-[0_18px_60px_rgba(15,23,42,0.12)]`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white shadow-soft">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold md:text-2xl">{screen.title}</h2>
                      <p className="text-sm text-white/80">真实页面骨架与交互布局。</p>
                    </div>
                  </div>
                </div>
                <PreviewFrame title={screen.title}>
                  {screen.render()}
                </PreviewFrame>
              </section>
            );
          })}
        </div>

        <Card className="border-border/70 shadow-soft">
          <CardHeader>
            <CardTitle>交付约束</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[1.25rem] bg-background p-4 text-sm leading-6 text-muted-foreground">
              原型通过后的 HTML 页面或框架组件代码必须保存在当前项目内，并通过页面配置直接访问。
            </div>
            <div className="rounded-[1.25rem] bg-background p-4 text-sm leading-6 text-muted-foreground">
              原型产物链接与项目内原型代码位置需要在需求文档中留痕。
            </div>
            <div className="rounded-[1.25rem] bg-background p-4 text-sm leading-6 text-muted-foreground">
              页面必须覆盖空态、加载态、异常态与编辑态，方便设计确认。
            </div>
            <div className="rounded-[1.25rem] bg-background p-4 text-sm leading-6 text-muted-foreground">
              原型不是说明卡片，必须像真实页面一样呈现视觉层级和操作区。
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
