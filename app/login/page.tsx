'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

function Countdown() {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 })

  useEffect(() => {
    const race = new Date('2026-07-24T08:00:00')
    const tick = () => {
      const diff = race.getTime() - new Date().getTime()
      if (diff <= 0) return
      setTime({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="flex items-end gap-2 justify-center mb-8">
      {[{ v: time.d, l: 'DAYS', orange: true }, { v: time.h, l: 'HRS' }, { v: time.m, l: 'MIN' }, { v: time.s, l: 'SEC' }].map((item, i) => (
        <div key={i} className="flex items-end gap-2">
          <div className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-center min-w-[58px]">
            <div className={`text-3xl font-black tabular-nums ${item.orange ? 'text-orange-500' : 'text-white'}`}>
              {pad(item.v)}
            </div>
            <div className="text-[9px] text-white/30 tracking-widest mt-1">{item.l}</div>
          </div>
          {i < 3 && <span className="text-orange-500 text-2xl font-black pb-3">:</span>}
        </div>
      ))}
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAuth = async () => {
    setLoading(true)
    setError('')
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else router.push('/onboarding')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else {
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id ?? '')
    .single()

  if (profile?.role === 'questmaster') router.push('/queenspanel')
  else if (profile) router.push('/dashboard')
  else router.push('/onboarding')
}
    }
    setLoading(false)
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 relative"
      style={{
       backgroundImage: `url('/hyrox-bg.jpeg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/75" />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">

        {/* Tag */}
        <div className="border border-orange-500/40 text-orange-500 rounded-full text-[10px] tracking-widest px-4 py-1 mb-5">
          TRAIN · EARN · CONQUER
        </div>

        {/* Title */}
        <h1 className="text-6xl font-black text-white text-center leading-none mb-2">
          HYROX<br />
          <span className="text-orange-500">QUEST</span>
        </h1>

        {/* Live dot + date */}
        <div className="flex items-center gap-2 text-white/30 text-[11px] tracking-widest mt-3 mb-6">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse inline-block" />
          RACE DAY — 24 JULY 2026
        </div>

        {/* Countdown */}
        <Countdown />

        {/* Form */}
        <div className="w-full flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-white/20 focus:outline-none focus:border-orange-500 text-sm"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-white/20 focus:outline-none focus:border-orange-500 text-sm"
          />

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button
            onClick={handleAuth}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl text-sm tracking-wide transition-all disabled:opacity-50 mt-1"
          >
            {loading ? 'Loading...' : isSignUp ? 'Create Account →' : 'Enter the Quest →'}
          </button>

          <p
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-center text-white/25 text-xs cursor-pointer hover:text-white/50 mt-1"
          >
            {isSignUp ? 'Already have an account? Login' : "No account? Sign up free"}
          </p>
        </div>
      </div>
    </main>
  )
}