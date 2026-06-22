'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Home() {
  const [days, setDays] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const race = new Date('2026-07-24T08:00:00')
    const diff = race.getTime() - Date.now()
    setDays(Math.max(0, Math.floor(diff / 86400000)))
  }, [])

  return (
    <main className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center text-white px-6">
      <div className="w-full max-w-sm flex flex-col gap-6">

        {/* Live badge */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-full px-4 py-2 w-fit">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-[10px] text-white/40 tracking-widest font-medium">
            {mounted ? `${days} DAYS TO RACE DAY` : '...'}
          </span>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-6xl font-black leading-none tracking-tight">
            HYROX<br />
            <span className="text-orange-500">QUEST</span>
          </h1>
          <p className="text-[11px] text-white/25 tracking-[4px] mt-4 uppercase">
            Train · Earn · Conquer
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/5" />

        {/* CTA */}
        <div className="flex flex-col gap-3">
          <Link href="/login">
            <button className="w-full bg-orange-500 hover:bg-orange-400 active:scale-95 text-white font-black py-4 rounded-2xl text-base tracking-widest transition-all uppercase">
              🔥 Enter the Quest
            </button>
          </Link>
          <p className="text-center text-[10px] text-white/15 tracking-widest">
            JULY 24 · 2026 · HYROX
          </p>
        </div>

      </div>
    </main>
  )
}