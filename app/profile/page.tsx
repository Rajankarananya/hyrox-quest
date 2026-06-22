'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    name: '',
    event_date: '',
    target_time: '',
    current_weight: '',
    goal_weight: '',
    wake_up_time: '',
    sleep_time: '',
    running_days: '',
    strength_days: '',
    recovery_days: '',
    water_goal: '',
    protein_goal: '',
    sleep_goal: '',
    biggest_motivation: '',
    dday_reward: '',
  })

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: profile }, { data: athlete }] = await Promise.all([
        supabase.from('profiles').select('name').eq('id', user.id).single(),
        supabase.from('athlete_profile').select('*').eq('id', user.id).single(),
      ])

      setForm({
        name: profile?.name ?? '',
        event_date: athlete?.event_date ?? '',
        target_time: athlete?.target_time ?? '',
        current_weight: athlete?.current_weight?.toString() ?? '',
        goal_weight: athlete?.goal_weight?.toString() ?? '',
        wake_up_time: athlete?.wake_up_time ?? '',
        sleep_time: athlete?.sleep_time ?? '',
        running_days: athlete?.running_days?.toString() ?? '',
        strength_days: athlete?.strength_days?.toString() ?? '',
        recovery_days: athlete?.recovery_days?.toString() ?? '',
        water_goal: athlete?.water_goal?.toString() ?? '',
        protein_goal: athlete?.protein_goal?.toString() ?? '',
        sleep_goal: athlete?.sleep_goal?.toString() ?? '',
        biggest_motivation: athlete?.biggest_motivation ?? '',
        dday_reward: athlete?.dday_reward ?? '',
      })
      setLoading(false)
    }

    fetchProfile()
  }, [])

  const update = (key: string, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ error: profileError }, { error: athleteError }] = await Promise.all([
      supabase.from('profiles').upsert({ id: user.id, name: form.name }),
      supabase.from('athlete_profile').upsert({
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
      }),
    ])

    setSaving(false)
    if (!profileError && !athleteError) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } else {
      alert('Save failed. Please try again.')
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400">Loading profile...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10 pb-28">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-8">

        <div>
          <h1 className="text-2xl font-black">Your Profile ✏️</h1>
          <p className="text-gray-400 text-sm mt-1">Edit anything and hit save.</p>
        </div>

        {/* Section: Identity */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-bold text-orange-500 uppercase tracking-widest">Identity</h2>

          <div>
            <label className="text-gray-400 text-sm">Name</label>
            <input
              value={form.name}
              onChange={e => update('name', e.target.value)}
              className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 focus:outline-none focus:border-orange-500"
            />
          </div>
        </section>

        {/* Section: Event */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-bold text-orange-500 uppercase tracking-widest">HYROX Event</h2>

          <div>
            <label className="text-gray-400 text-sm">Event Date</label>
            <input
              type="date"
              value={form.event_date}
              onChange={e => update('event_date', e.target.value)}
              className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm">Target Time</label>
            <input
              placeholder="e.g. 1:25:00"
              value={form.target_time}
              onChange={e => update('target_time', e.target.value)}
              className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-gray-400 text-sm">Current Weight (kg)</label>
              <input
                type="number"
                value={form.current_weight}
                onChange={e => update('current_weight', e.target.value)}
                className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="flex-1">
              <label className="text-gray-400 text-sm">Goal Weight (kg)</label>
              <input
                type="number"
                value={form.goal_weight}
                onChange={e => update('goal_weight', e.target.value)}
                className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </section>

        {/* Section: Schedule */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-bold text-orange-500 uppercase tracking-widest">Daily Schedule</h2>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-gray-400 text-sm">Wake Up</label>
              <input
                type="time"
                value={form.wake_up_time}
                onChange={e => update('wake_up_time', e.target.value)}
                className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="flex-1">
              <label className="text-gray-400 text-sm">Sleep Time</label>
              <input
                type="time"
                value={form.sleep_time}
                onChange={e => update('sleep_time', e.target.value)}
                className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </section>

        {/* Section: Training */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-bold text-orange-500 uppercase tracking-widest">Training Goals</h2>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-gray-400 text-sm">Run days</label>
              <input
                type="number"
                value={form.running_days}
                onChange={e => update('running_days', e.target.value)}
                className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Strength</label>
              <input
                type="number"
                value={form.strength_days}
                onChange={e => update('strength_days', e.target.value)}
                className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Recovery</label>
              <input
                type="number"
                value={form.recovery_days}
                onChange={e => update('recovery_days', e.target.value)}
                className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-gray-400 text-sm">Water (L)</label>
              <input
                type="number"
                value={form.water_goal}
                onChange={e => update('water_goal', e.target.value)}
                className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Protein (g)</label>
              <input
                type="number"
                value={form.protein_goal}
                onChange={e => update('protein_goal', e.target.value)}
                className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Sleep (hr)</label>
              <input
                type="number"
                value={form.sleep_goal}
                onChange={e => update('sleep_goal', e.target.value)}
                className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </section>

        {/* Section: Motivation */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-bold text-orange-500 uppercase tracking-widest">Motivation</h2>

          <div>
            <label className="text-gray-400 text-sm">Biggest Motivation</label>
            <textarea
              value={form.biggest_motivation}
              onChange={e => update('biggest_motivation', e.target.value)}
              rows={3}
              className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm">👑 D-Day Reward</label>
            <textarea
              value={form.dday_reward}
              onChange={e => update('dday_reward', e.target.value)}
              rows={3}
              className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>
        </section>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full font-bold py-4 rounded-xl text-lg transition-colors disabled:opacity-50
            ${saved ? 'bg-green-600' : 'bg-orange-500 hover:bg-orange-600'}`}
        >
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
        </button>

      </div>
    </main>
  )
}