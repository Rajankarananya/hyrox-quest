'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import BottomNav from '../components/BottomNav'

type Message = {
  id: string
  message: string
  created_at: string
  read: boolean
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    fetchMessages()

    const channel = supabase
      .channel('messages_page_realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        setMessages(prev => [payload.new as Message, ...prev])
        // Mark as read since user is on messages page
        markRead(payload.new.id)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setMessages(data)
      // Mark all unread as read since user opened the page
      const unreadIds = data.filter(m => !m.read).map(m => m.id)
      if (unreadIds.length > 0) {
        await supabase
          .from('messages')
          .update({ read: true })
          .in('id', unreadIds)
        setMessages(data.map(m => ({ ...m, read: true })))
      }
    }
    setLoading(false)
  }

  const markRead = async (id: string) => {
    await supabase.from('messages').update({ read: true }).eq('id', id)
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m))
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
      <div className="text-pink-400 text-lg font-black animate-pulse">Loading Messages...</div>
    </div>
  )

  return (
    <main className="min-h-screen bg-[#0d0d0d] text-white pb-24">

      {/* Header */}
      <div className="bg-[#111] border-b border-white/5 px-5 py-4">
        <div className="text-[10px] text-pink-400 tracking-widest">HYROX QUEST</div>
        <div className="text-xl font-black">💌 Messages</div>
        <div className="text-[11px] text-white/30 mt-1">Messages from Ananya 👑</div>
      </div>

      <div className="px-5 pt-6 flex flex-col gap-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">💌</div>
            <div className="text-white/40 text-sm">No messages yet.</div>
            <div className="text-white/20 text-xs mt-1">Ananya hasn't sent anything yet!</div>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id}
              className={`rounded-2xl px-4 py-4 border transition-all ${
                msg.read
                  ? 'bg-[#111] border-white/5'
                  : 'bg-pink-500/10 border-pink-500/20'
              }`}>
              <div className="flex items-center justify-between mb-2">
                <div className={`text-[10px] tracking-widest font-bold ${msg.read ? 'text-white/30' : 'text-pink-400'}`}>
                  👑 ANANYA {!msg.read && (
                    <span className="ml-2 bg-pink-500 text-white text-[8px] px-2 py-0.5 rounded-full">NEW</span>
                  )}
                </div>
                <div className="text-[9px] text-white/20">{formatDate(msg.created_at)}</div>
              </div>
              <div className={`text-sm leading-relaxed ${msg.read ? 'text-white/50' : 'text-white/90'}`}>
                {msg.message}
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </main>
  )
}