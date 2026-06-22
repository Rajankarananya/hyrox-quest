'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const HARDCODED_REWARDS = {
  daily: [
    { name: '10 Kisses', emoji: '💋' },
    { name: 'Extra Long Hug', emoji: '🤗' },
    { name: '15-Minute Cuddle Pass', emoji: '❤️' },
    { name: 'Cute Selfie Together', emoji: '📸' },
    { name: 'Coffee Date Voucher', emoji: '☕' },
    { name: 'Gaming Night Pass', emoji: '🎮' },
  ],
  weekly: [
    { name: 'Movie Night', emoji: '🎬' },
    { name: 'Favourite Meal', emoji: '🍕' },
    { name: 'Ice Cream Date', emoji: '🍦' },
    { name: 'Surprise Drive', emoji: '🚗' },
    { name: 'Special Date Planned By You', emoji: '📍' },
  ],
  milestone: [
    { name: '50 Kiss Bonus', emoji: '💋', unlock: '10-Day Streak' },
    { name: 'Calvin Klein Underwear', emoji: '🎁', unlock: '20-Day Streak' },
    { name: 'Gym Accessory', emoji: '🏋️', unlock: '30-Day Streak' },
    { name: 'Premium Gear Upgrade', emoji: '⚡', unlock: '40-Day Streak' },
  ],
}

const STATUS_STYLE: Record<string, string> = {
  pending:  'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  approved: 'bg-green-500/20 text-green-400 border border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border border-red-500/30',
}

const STATUS_LABEL: Record<string, string> = {
  pending:  '⏳ Pending',
  approved: '✅ Approved',
  rejected: '❌ Rejected',
}

const SECTION_TITLE: Record<string, string> = {
  daily:     '⚡ Daily Rewards',
  weekly:    '🗓️ Weekly Rewards',
  milestone: '🏆 Milestone Rewards',
  custom:    '👑 Ananya\'s Special Rewards',
}

export default function RewardsPage() {
  const [claims, setClaims]         = useState<any[]>([])
  const [customRewards, setCustomRewards] = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [claiming, setClaiming]     = useState<string | null>(null)

  useEffect(() => {
    fetchAll()

    const channel = supabase
      .channel('reward_claims_changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'reward_claims',
      }, (payload) => {
        setClaims(prev =>
          prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c)
        )
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const fetchAll = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: claimsData }, { data: rewardsData }] = await Promise.all([
      supabase.from('reward_claims').select('*')
        .eq('athlete_id', user.id)
        .order('claimed_date', { ascending: false }),
      supabase.from('rewards').select('*')
        .order('created_at', { ascending: false }),
    ])

    setClaims(claimsData || [])
    setCustomRewards(rewardsData || [])
    setLoading(false)
  }

  const handleClaim = async (rewardName: string, type: string) => {
    const alreadyPending = claims.find(
      c => c.reward_name === rewardName && c.status === 'pending'
    )
    if (alreadyPending) {
      alert("Already waiting for Ananya's approval! 👑")
      return
    }

    setClaiming(rewardName)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('reward_claims')
      .insert({
        athlete_id:  user.id,
        reward_name: rewardName,
        reward_type: type,
        status:      'pending',
      })
      .select()
      .single()

    if (!error && data) {
      setClaims(prev => [data, ...prev])
    } else {
      alert('Error: ' + error?.message)
    }
    setClaiming(null)
  }

  const getStatus = (rewardName: string) =>
    claims.find(c => c.reward_name === rewardName)?.status || null

  if (loading) return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
      <div className="text-orange-400 text-lg font-black animate-pulse">Loading Rewards...</div>
    </div>
  )

  // Merge custom rewards into the sections
  const allSections: { type: string; rewards: { name: string; emoji: string; unlock?: string }[] }[] = [
    { type: 'daily',     rewards: HARDCODED_REWARDS.daily },
    { type: 'weekly',    rewards: HARDCODED_REWARDS.weekly },
    { type: 'milestone', rewards: HARDCODED_REWARDS.milestone },
  ]

  // Add custom rewards as their own section if any exist
  if (customRewards.length > 0) {
    allSections.push({
      type: 'custom',
      rewards: customRewards.map(r => ({ name: r.reward_name, emoji: r.emoji })),
    })
  }

  return (
    <main className="min-h-screen bg-[#0d0d0d] text-white pb-16">

      {/* Header */}
      <div className="bg-[#111] border-b border-white/5 px-5 py-4">
        <div className="text-[10px] text-orange-400 tracking-widest">HYROX QUEST</div>
        <div className="text-xl font-black">🎁 Reward Chest</div>
        <div className="text-[11px] text-white/30 mt-1">Earn it. Claim it. Make her approve it. 👑</div>
      </div>

      <div className="px-5 pt-6 flex flex-col gap-8">
        {allSections.map(({ type, rewards }) => (
          <section key={type}>
            <div className="text-[10px] text-white/30 tracking-widest mb-3">
              {SECTION_TITLE[type]}
            </div>

            <div className="flex flex-col gap-3">
              {rewards.map((reward) => {
                const status     = getStatus(reward.name)
                const isClaiming = claiming === reward.name

                return (
                  <div key={reward.name}
                    className="flex items-center justify-between bg-[#111] border border-white/5 rounded-2xl px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{reward.emoji}</span>
                      <div>
                        <div className="text-sm font-bold">{reward.name}</div>
                        {'unlock' in reward && reward.unlock && (
                          <div className="text-[10px] text-white/30 mt-0.5">🔓 {reward.unlock}</div>
                        )}
                      </div>
                    </div>

                    {status ? (
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${STATUS_STYLE[status]}`}>
                        {STATUS_LABEL[status]}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleClaim(reward.name, type)}
                        disabled={isClaiming}
                        className="bg-rose-500 hover:bg-rose-400 disabled:opacity-40 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all">
                        {isClaiming ? '...' : 'Claim'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        ))}

        {/* Claim History */}
        {claims.length > 0 && (
          <section>
            <div className="text-[10px] text-white/30 tracking-widest mb-3">📜 CLAIM HISTORY</div>
            <div className="flex flex-col gap-2">
              {claims.map(claim => (
                <div key={claim.id}
                  className="flex justify-between items-center bg-[#111] border border-white/5 rounded-xl px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">{claim.reward_name}</div>
                    <div className="text-[10px] text-white/30 mt-0.5">
                      {new Date(claim.claimed_date).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${STATUS_STYLE[claim.status]}`}>
                    {STATUS_LABEL[claim.status]}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}