'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import BottomNav from '../components/BottomNav'

export default function AnalyticsPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [xpLog, setXpLog] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: allTasks } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('athlete_id', user.id)
      .order('date', { ascending: true })
    if (allTasks) setTasks(allTasks)

    const { data: xp } = await supabase
      .from('xp_log')
      .select('*')
      .eq('athlete_id', user.id)
      .order('created_at', { ascending: true })
    if (xp) setXpLog(xp)

    setLoading(false)
  }

  // Group tasks by date
  const byDate: Record<string, { total: number; done: number }> = {}
  tasks.forEach(t => {
    if (!byDate[t.date]) byDate[t.date] = { total: 0, done: 0 }
    byDate[t.date].total++
    if (t.completed) byDate[t.date].done++
  })

  const dates = Object.keys(byDate).slice(-7)

  // XP per day
  const xpByDate: Record<string, number> = {}
  xpLog.forEach(x => {
    const date = x.created_at?.split('T')[0]
    if (!date) return
    xpByDate[date] = (xpByDate[date] || 0) + x.xp
  })
  const xpDates = Object.keys(xpByDate).slice(-7)
  const maxXp = Math.max(...Object.values(xpByDate), 1)

  // Task completion stats
  const totalTasks = tasks.length
  const doneTasks = tasks.filter(t => t.completed).length
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const totalXp = xpLog.reduce((s, x) => s + x.xp, 0)

  // Per task stats
  const taskStats: Record<string, { done: number; total: number }> = {}
  tasks.forEach(t => {
    if (!taskStats[t.task_name]) taskStats[t.task_name] = { done: 0, total: 0 }
    taskStats[t.task_name].total++
    if (t.completed) taskStats[t.task_name].done++
  })

  const TASK_INFO: Record<string, { label: string; emoji: string }> = {
    workout: { label: 'Workout', emoji: '🏋️' },
    protein: { label: 'Protein', emoji: '🥩' },
    water: { label: 'Water', emoji: '💧' },
    mobility: { label: 'Mobility', emoji: '🧘' },
    sleep: { label: 'Sleep', emoji: '😴' },
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
      <div className="text-orange-500 font-black animate-pulse">LOADING ANALYTICS...</div>
    </div>
  )

  return (
    <main className="min-h-screen bg-[#0d0d0d] text-white pb-24">

      {/* Header */}
      <div className="bg-[#111] border-b border-white/5 px-5 py-4">
        <div className="text-[10px] text-white/30 tracking-widest">HYROX QUEST</div>
        <div className="text-xl font-black">Analytics 📊</div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-4">

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#111] border border-white/5 rounded-xl p-3 text-center">
            <div className="text-2xl font-black text-orange-500">{totalXp}</div>
            <div className="text-[9px] text-white/30 tracking-widest mt-1">TOTAL XP</div>
          </div>
          <div className="bg-[#111] border border-white/5 rounded-xl p-3 text-center">
            <div className="text-2xl font-black text-white">{completionRate}%</div>
            <div className="text-[9px] text-white/30 tracking-widest mt-1">COMPLETION</div>
          </div>
          <div className="bg-[#111] border border-white/5 rounded-xl p-3 text-center">
            <div className="text-2xl font-black text-green-400">{doneTasks}</div>
            <div className="text-[9px] text-white/30 tracking-widest mt-1">TASKS DONE</div>
          </div>
        </div>

        {/* Daily completion bar chart */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-4">
          <div className="text-[10px] text-white/30 tracking-widest mb-4">
            DAILY COMPLETION — LAST 7 DAYS
          </div>
          {dates.length === 0 && (
            <div className="text-white/20 text-sm text-center py-4">No data yet</div>
          )}
          <div className="flex items-end gap-2 h-32">
            {dates.map(date => {
              const { total, done } = byDate[date]
              const pct = total > 0 ? (done / total) * 100 : 0
              const height = Math.max(pct, 4)
              const label = new Date(date).toLocaleDateString('en', { weekday: 'short' })
              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[9px] text-orange-500 font-bold">{done}/{total}</div>
                  <div className="w-full flex items-end" style={{ height: '80px' }}>
                    <div
                      className="w-full rounded-t-lg transition-all"
                      style={{
                        height: `${height}%`,
                        background: pct === 100
                          ? '#22c55e'
                          : pct >= 60
                          ? '#ff6b35'
                          : '#333'
                      }}
                    />
                  </div>
                  <div className="text-[9px] text-white/30">{label}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* XP bar chart */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-4">
          <div className="text-[10px] text-white/30 tracking-widest mb-4">
            XP EARNED — LAST 7 DAYS
          </div>
          {xpDates.length === 0 && (
            <div className="text-white/20 text-sm text-center py-4">No XP data yet</div>
          )}
          <div className="flex items-end gap-2 h-32">
            {xpDates.map(date => {
              const val = xpByDate[date]
              const pct = (val / maxXp) * 100
              const label = new Date(date).toLocaleDateString('en', { weekday: 'short' })
              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[9px] text-orange-500 font-bold">{val}</div>
                  <div className="w-full flex items-end" style={{ height: '80px' }}>
                    <div
                      className="w-full rounded-t-lg bg-orange-500 transition-all"
                      style={{ height: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                  <div className="text-[9px] text-white/30">{label}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Per task breakdown */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-4">
          <div className="text-[10px] text-white/30 tracking-widest mb-4">
            TASK BREAKDOWN
          </div>
          <div className="flex flex-col gap-3">
            {Object.entries(taskStats).map(([key, stat]) => {
              const info = TASK_INFO[key] || { label: key, emoji: '✅' }
              const pct = stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0
              return (
                <div key={key}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <span>{info.emoji}</span>
                      <span className="text-sm font-medium">{info.label}</span>
                    </div>
                    <span className="text-xs text-orange-500 font-bold">{pct}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 80 ? '#22c55e' : pct >= 50 ? '#ff6b35' : '#555'
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
      <BottomNav />
    </main>
  )
}