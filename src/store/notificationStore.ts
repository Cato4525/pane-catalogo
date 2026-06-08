import { create } from 'zustand'
import { getSupabase } from '../services/supabaseClient'

export interface Notification {
  id: string
  type: 'reserva' | 'consulta'
  title: string
  description: string
  timestamp: string
  read: boolean
  link?: string
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  unreadReservas: number
  unreadConsultas: number
  addNotification: (n: Notification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clear: () => void
  subscribe: () => () => void
}

const computeCounts = (notifications: Notification[]) => ({
  unreadCount: notifications.filter(n => !n.read).length,
  unreadReservas: notifications.filter(n => !n.read && n.type === 'reserva').length,
  unreadConsultas: notifications.filter(n => !n.read && n.type === 'consulta').length,
})

const STORAGE_KEY = 'pane-admin-notifications'

const loadFromStorage = (): Notification[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const saveToStorage = (notifications: Notification[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, 50)))
  } catch { /* noop */ }
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: loadFromStorage(),
  ...computeCounts(loadFromStorage()),

  addNotification: (n) => {
    set((state) => {
      const updated = [n, ...state.notifications].slice(0, 50)
      saveToStorage(updated)
      return {
        notifications: updated,
        ...computeCounts(updated),
      }
    })
  },

  markAsRead: (id) => {
    set((state) => {
      const updated = state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      )
      saveToStorage(updated)
      return {
        notifications: updated,
        ...computeCounts(updated),
      }
    })
  },

  markAllAsRead: () => {
    set((state) => {
      const updated = state.notifications.map(n => ({ ...n, read: true }))
      saveToStorage(updated)
      return { notifications: updated, ...computeCounts(updated) }
    })
  },

  clear: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ notifications: [], unreadCount: 0, unreadReservas: 0, unreadConsultas: 0 })
  },

  subscribe: () => {
    const supabase = getSupabase()
    if (!supabase) return () => {}

    const handleInsert = (
      payload: { new: Record<string, any> },
      type: Notification['type'],
    ) => {
      const record: Record<string, any> = payload.new
      const now = new Date().toISOString()
      const notifId = `${type}-${String(record.id ?? Date.now())}-${now}`

      const notification: Notification =
        type === 'reserva'
          ? {
              id: notifId,
              type: 'reserva',
              title: 'Nueva reserva',
              description: `${record.cliente_nombre || 'Cliente'} — $${Number(record.total || 0).toFixed(2)}`,
              timestamp: now,
              read: false,
              link: '/admin/reservas',
            }
          : {
              id: notifId,
              type: 'consulta',
              title: 'Nueva consulta',
              description: `${record.cliente_nombre || 'Anónimo'} — ${(record.mensaje || '').substring(0, 50)}`,
              timestamp: now,
              read: false,
              link: '/admin/consultas',
            }

      get().addNotification(notification)
    }

    const channel = supabase.channel('admin-notifications')

    channel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reservations' },
        (payload: any) => handleInsert(payload, 'reserva'),
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'product_queries' },
        (payload: any) => handleInsert(payload, 'consulta'),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },
}))
