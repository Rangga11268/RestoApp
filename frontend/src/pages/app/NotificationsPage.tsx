import { useState } from 'react'
import { ShoppingCart, CheckCircle, Clock, Warning, Bell, Check } from "@phosphor-icons/react"
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type Category = 'all' | 'order' | 'payment' | 'system'

interface Notification {
  id: number
  icon: typeof ShoppingCart
  category: Exclude<Category, 'all'>
  title: string
  time: string
  dateGroup: string
  color: string
  unread: boolean
}

const notifications: Notification[] = [
  { id: 1, icon: ShoppingCart, category: 'order', title: 'Pesanan baru #124 dari Meja 5 — 2 item', time: '2 menit lalu', dateGroup: 'Hari Ini', color: 'text-accent', unread: true },
  { id: 2, icon: Clock, category: 'order', title: 'Pesanan #122 menunggu konfirmasi dapur', time: '15 menit lalu', dateGroup: 'Hari Ini', color: 'text-amber-600', unread: true },
  { id: 3, icon: CheckCircle, category: 'order', title: 'Pesanan #123 siap diantar ke Meja 3', time: '25 menit lalu', dateGroup: 'Hari Ini', color: 'text-green-600', unread: false },
  { id: 4, icon: ShoppingCart, category: 'order', title: 'Pesanan baru #121 dari Meja 8 — 5 item', time: '1 jam lalu', dateGroup: 'Hari Ini', color: 'text-accent', unread: true },
  { id: 5, icon: Warning, category: 'payment', title: 'Pembayaran #INV-001 gagal — kartu ditolak', time: '3 jam lalu', dateGroup: 'Kemarin', color: 'text-danger', unread: true },
  { id: 6, icon: CheckCircle, category: 'payment', title: 'Pembayaran #INV-002 lunas — Rp 245.000', time: '5 jam lalu', dateGroup: 'Kemarin', color: 'text-green-600', unread: false },
  { id: 7, icon: Bell, category: 'system', title: 'Staff baru "Rina" telah bergabung', time: 'Kemarin, 14:30', dateGroup: 'Kemarin', color: 'text-accent', unread: false },
  { id: 8, icon: Clock, category: 'system', title: 'Cadangan stok bahan baku menipis', time: '2 hari lalu', dateGroup: 'Lainnya', color: 'text-amber-600', unread: false },
]

const categoryLabels: Record<Category, string> = { all: 'Semua', order: 'Pesanan', payment: 'Pembayaran', system: 'Sistem' }

export default function NotificationsPage() {
  const [items, setItems] = useState(notifications)
  const [filter, setFilter] = useState<Category>('all')

  const filtered = items.filter(n => filter === 'all' || n.category === filter)
  const grouped = filtered.reduce<Record<string, Notification[]>>((acc, n) => {
    ;(acc[n.dateGroup] ??= []).push(n)
    return acc
  }, {})

  const unreadCount = items.filter(n => n.unread).length

  const markRead = (id: number) => setItems(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n))
  const markAllRead = () => setItems(prev => prev.map(n => ({ ...n, unread: false })))

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-ink tracking-tight">Notifikasi</h1>
          {unreadCount > 0 && (
            <Badge variant="primary" className="text-[10px] px-2">{unreadCount} baru</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllRead} className="text-xs gap-1.5">
            <Check size={14} weight="bold" /> Tandai semua dibaca
          </Button>
        )}
      </div>

      <div className="flex gap-1">
        {(Object.entries(categoryLabels) as [Category, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              filter === key ? 'bg-accent text-white' : 'bg-surface text-ink-2 hover:text-ink border border-rule'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bell size={40} weight="bold" className="text-ink-2/20 mb-4" />
          <p className="text-sm font-medium text-ink-2">Tidak ada notifikasi</p>
          <p className="text-xs text-ink-2/60 mt-1">Semua sudah dibaca atau belum ada aktivitas</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([group, notifs]) => (
            <div key={group}>
              <p className="text-[10px] font-semibold text-ink-2 uppercase tracking-widest mb-3 pl-1">{group}</p>
              <div className="space-y-1">
                {notifs.map(n => (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={cn(
                      'w-full flex items-start gap-4 p-4 rounded-lg border text-left transition-colors',
                      n.unread ? 'bg-accent-light/30 border-accent/15' : 'bg-paper-2 border-rule hover:bg-surface'
                    )}
                  >
                    {n.unread && <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-3.5" />}
                    <div className={cn('w-9 h-9 rounded-lg bg-surface border border-rule flex items-center justify-center flex-shrink-0', n.color, !n.unread && 'opacity-60')}>
                      <n.icon size={18} weight="bold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm', n.unread ? 'font-semibold text-ink' : 'font-medium text-ink-2')}>{n.title}</p>
                      <p className="text-xs text-ink-2/60 mt-0.5">{n.time}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}