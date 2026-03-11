import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import React from "react";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '心情日记 - 记录每一天的心情',
  icons: '/favicon.ico',
  manifest: '/manifest.json',
  description: '一个简洁的心情追踪和日记应用，帮助你了解随时间变化的情绪模式。记录心情、写日记、添加照片，发现情绪规律。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
