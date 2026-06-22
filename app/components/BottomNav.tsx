'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const NAV = [
  { label: 'Home',     icon: '🏠', path: '/dashboard' },
  { label: 'Analytics', icon: '📊', path: '/analytics' },
  { label: 'Rewards',  icon: '🎁', path: '/rewards' },
  { label: 'Messages', icon: '💌', path: '/messages' },
  { label: 'Profile',  icon: '👤', path: '/profile' },
]

export default function BottomNav() {
  const router   = useRouter()
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchUnread()

    const channel = supabase
      .channel('bottomnav_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, () => {
        setUnreadCount(prev => prev + 1)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // Reset unread dot when user is on messages page
  useEffect(() => {
    if (pathname === '/messages') {
      setUnreadCount(0)
    }
  }, [pathname])

  const fetchUnread = async () => {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('read', false)
    setUnreadCount(count || 0)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#111] border-t border-white/5 px-4 py-3 flex justify-around z-50">
      {NAV.map(item => (
        <button key={item.path} onClick={() => router.push(item.path)}
          className={`flex flex-col items-center gap-1 transition-all relative ${
            pathname === item.path ? 'opacity-100' : 'opacity-30'
          }`}>
          <span className="text-xl">{item.icon}</span>
          {item.path === '/messages' && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="text-[9px] tracking-widest text-white font-bold">{item.label}</span>
        </button>
      ))}
    </div>
  )
}