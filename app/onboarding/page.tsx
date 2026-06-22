'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const steps = ['profile', 'goals', 'motivation']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    event_date: '2025-07-24',
    target_time: '',
    current_weight: '',
    goal_weight: '',
    wake_up_time: '06:00',
    sleep_time: '22:30',
    running_days: '4',
    strength_days: '3',
    recovery_days: '1',
    water_goal: '4',
    protein_goal: '150',
    sleep_goal: '8',
    biggest_motivation: '',
    dday_reward: '',
  })

  const update = (key: string, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      alert('Not logged in!')
      router.push('/login')
      return
    }

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      name: form.name,
      role: 'athlete',
    })

    if (profileError) {
      alert('Profile save failed: ' + profileError.message)
      setLoading(false)
      return
    }

    const { error: athleteError } = await supabase.from('athlete_profile').upsert({
      id: user.id,
      event_date: form.event_date,
      target_time: form.target_time,
      current_weight: parseFloat(form.current_weight),
      goal_weight: parseFloat(form.goal_weight),
      wake_up_time: form.wake_up_time,
      sleep_time: form.sleep_time,
      running_days: parseInt(form.running_days),
      strength_days: parseInt(form.strength_days),
      recovery_days: parseInt(form.recovery_days),
      water_goal: parseFloat(form.water_goal),
      protein_goal: parseFloat(form.protein_goal),
      sleep_goal: parseFloat(form.sleep_goal),
      biggest_motivation: form.biggest_motivation,
      dday_reward: form.dday_reward,
    })

    if (athleteError) {
      alert('Athlete profile save failed: ' + athleteError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10 flex flex-col items-center">
      <div className="w-full max-w-sm">

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-orange-500' : 'bg-gray-700'}`} />
          ))}
        </div>

        {/* Step 1 - Profile */}
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-black mb-2">Your Profile 🏃‍♂️</h2>

            <input placeholder="Your Name" value={form.name}
              onChange={e => update('name', e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 placeholder-gray-500 focus:outline-none focus:border-orange-500" />

            <label className="text-gray-400 text-sm">HYROX Event Date</label>
            <input type="date" value={form.event_date}
              onChange={e => update('event_date', e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 focus:outline-none focus:border-orange-500" />

            <input placeholder="Target Time (e.g. 1:25:00)" value={form.target_time}
              onChange={e => update('target_time', e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 placeholder-gray-500 focus:outline-none focus:border-orange-500" />

            <div className="flex gap-3">
              <input placeholder="Current Weight (kg)" value={form.current_weight}
                onChange={e => update('current_weight', e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 placeholder-gray-500 focus:outline-none focus:border-orange-500 w-1/2" />
              <input placeholder="Goal Weight (kg)" value={form.goal_weight}
                onChange={e => update('goal_weight', e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 placeholder-gray-500 focus:outline-none focus:border-orange-500 w-1/2" />
            </div>

            <button onClick={() => setStep(1)}
              className="bg-orange-500 hover:bg-orange-600 font-bold py-4 rounded-xl text-lg mt-2">
              Next →
            </button>
          </div>
        )}

        {/* Step 2 - Goals */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-black mb-2">Training Goals 🎯</h2>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-gray-400 text-sm">Running Days/week</label>
                <input type="number" value={form.running_days}
                  onChange={e => update('running_days', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 focus:outline-none focus:border-orange-500 mt-1" />
              </div>
              <div className="flex-1">
                <label className="text-gray-400 text-sm">Strength Days/week</label>
                <input type="number" value={form.strength_days}
                  onChange={e => update('strength_days', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 focus:outline-none focus:border-orange-500 mt-1" />
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-sm">Daily Water Goal (Litres)</label>
              <input type="number" value={form.water_goal}
                onChange={e => update('water_goal', e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 focus:outline-none focus:border-orange-500 mt-1" />
            </div>

            <div>
              <label className="text-gray-400 text-sm">Daily Protein Goal (g)</label>
              <input type="number" value={form.protein_goal}
                onChange={e => update('protein_goal', e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 focus:outline-none focus:border-orange-500 mt-1" />
            </div>

            <div>
              <label className="text-gray-400 text-sm">Sleep Goal (hours)</label>
              <input type="number" value={form.sleep_goal}
                onChange={e => update('sleep_goal', e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 focus:outline-none focus:border-orange-500 mt-1" />
            </div>

            <div className="flex gap-3 mt-2">
              <button onClick={() => setStep(0)}
                className="flex-1 border border-gray-700 font-bold py-4 rounded-xl">
                ← Back
              </button>
              <button onClick={() => setStep(2)}
                className="flex-1 bg-orange-500 hover:bg-orange-600 font-bold py-4 rounded-xl">
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 - Motivation */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-black mb-2">What Drives You? 🔥</h2>

            <label className="text-gray-400 text-sm">Biggest Motivation</label>
            <textarea placeholder="e.g. Finish under 1h 30m, podium finish..." value={form.biggest_motivation}
              onChange={e => update('biggest_motivation', e.target.value)}
              rows={3}
              className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none" />

            <label className="text-gray-400 text-sm">👑 D-Day Reward (if you hit your target time)</label>
            <textarea placeholder="e.g. Weekend trip, expensive gift, anything I want 😈" value={form.dday_reward}
              onChange={e => update('dday_reward', e.target.value)}
              rows={3}
              className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none" />

            <div className="flex gap-3 mt-2">
              <button onClick={() => setStep(1)}
                className="flex-1 border border-gray-700 font-bold py-4 rounded-xl">
                ← Back
              </button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 bg-orange-500 hover:bg-orange-600 font-bold py-4 rounded-xl disabled:opacity-50">
                {loading ? 'Saving...' : 'Let\'s Go! 🚀'}
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}