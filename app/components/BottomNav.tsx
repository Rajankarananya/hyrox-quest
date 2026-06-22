'use client'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { label: 'Home', icon: '🏠', path: '/dashboard' },
  { label: 'Analytics', icon: '📊', path: '/analytics' },
  { label: 'Rewards', icon: '🎁', path: '/rewards' },
  { label: 'Profile', icon: '👤', path: '/profile' },
]

export default function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#111] border-t border-white/5 px-4 py-3 flex justify-around z-50">
      {NAV.map(item => (
        <button key={item.path} onClick={() => router.push(item.path)}
          className={`flex flex-col items-center gap-1 transition-all ${
            pathname === item.path ? 'opacity-100' : 'opacity-30'
          }`}>
          <span className="text-xl">{item.icon}</span>
          <span className="text-[9px] tracking-widest text-white font-bold">{item.label}</span>
        </button>
      ))}
    </div>
  )
}