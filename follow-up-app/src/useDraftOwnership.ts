import { useEffect, useRef, useState } from 'react'

type Status = 'checking' | 'owned' | 'elsewhere' | 'unavailable'

// Hold one browser-managed writer lock for the lifetime of an editing page.
export function useDraftOwnership(name: string, beforeRelease: () => void) {
  const [status, setStatus] = useState<Status>('checking')
  const owned = useRef(false)
  const alive = useRef(false)
  const requestId = useRef(0)
  const finish = useRef<(() => void) | null>(null)
  const flush = useRef(beforeRelease)
  flush.current = beforeRelease

  function claim() {
    if (owned.current) return
    const id = ++requestId.current
    setStatus('checking')
    // Defer until after effect cleanup so StrictMode does not race its own request.
    void Promise.resolve().then(() => {
      if (!alive.current || id !== requestId.current) return
      if (!navigator.locks) { setStatus('unavailable'); return }
      return navigator.locks.request(name, { ifAvailable: true }, lock => {
        if (!alive.current || id !== requestId.current) return
        if (!lock) { setStatus('elsewhere'); return }
        owned.current = true
        setStatus('owned')
        return new Promise<void>(resolve => { finish.current = resolve })
      })
    }).catch(() => { if (alive.current && id === requestId.current) setStatus('unavailable') })
  }

  function release() {
    ++requestId.current
    if (owned.current) flush.current()
    owned.current = false
    finish.current?.()
    finish.current = null
  }

  useEffect(() => {
    alive.current = true
    claim()
    const resume = (event: PageTransitionEvent) => { if (event.persisted) claim() }
    window.addEventListener('pagehide', release)
    window.addEventListener('pageshow', resume)
    return () => {
      alive.current = false
      release()
      window.removeEventListener('pagehide', release)
      window.removeEventListener('pageshow', resume)
    }
  }, [name])

  return { status, claim, isOwner: () => owned.current }
}
