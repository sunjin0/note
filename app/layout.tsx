import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '心情日记 - 记录每一天的心情',
  description: '一个简洁的心情追踪和日记应用，帮助你了解随时间变化的情绪模式。记录心情、写日记、添加照片，发现情绪规律。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
