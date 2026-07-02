import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const buf = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i)
  return buf
}

export type PushStatus = 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed'

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>('unsubscribed')

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }
    navigator.serviceWorker.ready.then(sw =>
      sw.pushManager.getSubscription().then(sub => {
        if (sub) setStatus('subscribed')
      })
    )
  }, [])

  const subscribe = async () => {
    // requestPermission deve venire prima di qualsiasi await su iOS
    // altrimenti la catena gesture→permesso si rompe e il popup non appare
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      setStatus('denied')
      return
    }
    const sw = await navigator.serviceWorker.ready
    const subscription = await sw.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
    const json = subscription.toJSON() as {
      endpoint: string
      keys: { p256dh: string; auth: string }
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: user.id,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      },
      { onConflict: 'endpoint' }
    )
    if (error) {
      console.error('push_subscriptions upsert failed', error)
      return
    }
    setStatus('subscribed')
  }

  const unsubscribe = async () => {
    const sw = await navigator.serviceWorker.ready
    const sub = await sw.pushManager.getSubscription()
    if (sub) {
      await sub.unsubscribe()
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
    }
    setStatus('unsubscribed')
  }

  return { status, subscribe, unsubscribe }
}
