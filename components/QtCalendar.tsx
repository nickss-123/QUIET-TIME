'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CalendarIcon } from './NavIcons'

// A small "QT CALENDAR" icon button. Tapping it opens the reading schedule
// full-screen; the image can be zoomed (pinch, wheel, or double-tap) and
// panned. Tapping anywhere outside the image closes it.
export default function QtCalendar({
  title,
  url,
}: {
  title: string
  url: string | null
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => url && setOpen(true)}
        disabled={!url}
        title={url ? title : 'No reading plan is published yet'}
        className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium tracking-wide text-ink hover:bg-bg disabled:opacity-50"
      >
        <CalendarIcon className="h-4 w-4 text-accent" />
        QT CALENDAR
      </button>
      {open && url && <Lightbox url={url} title={title} onClose={() => setOpen(false)} />}
    </>
  )
}

function Lightbox({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<{ dist: number; scale: number; moved: boolean } | null>(null)
  const drag = useRef<{ x: number; y: number; px: number; py: number; moved: boolean } | null>(null)
  const lastTap = useRef(0)

  const clamp = (s: number) => Math.min(6, Math.max(1, s))

  const reset = useCallback(() => {
    setScale(1)
    setPos({ x: 0, y: 0 })
  }, [])

  function onWheel(e: React.WheelEvent) {
    e.preventDefault()
    const next = clamp(scale * (e.deltaY < 0 ? 1.15 : 0.87))
    setScale(next)
    if (next === 1) setPos({ x: 0, y: 0 })
  }

  function onPointerDown(e: React.PointerEvent) {
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      gesture.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale, moved: false }
      drag.current = null
    } else if (pointers.current.size === 1) {
      drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y, moved: false }
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2 && gesture.current) {
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      gesture.current.moved = true
      setScale(clamp(gesture.current.scale * (dist / gesture.current.dist)))
    } else if (drag.current && scale > 1) {
      const dx = e.clientX - drag.current.x
      const dy = e.clientY - drag.current.y
      if (Math.abs(dx) + Math.abs(dy) > 4) drag.current.moved = true
      setPos({ x: drag.current.px + dx, y: drag.current.py + dy })
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId)
    const wasDrag = drag.current?.moved || gesture.current?.moved
    if (pointers.current.size < 2) gesture.current = null
    if (pointers.current.size === 0) {
      drag.current = null
      if (!wasDrag) {
        // Double-tap toggles between fit and 2.5x zoom.
        const now = Date.now()
        if (now - lastTap.current < 300) {
          if (scale > 1) reset()
          else setScale(2.5)
        }
        lastTap.current = now
      }
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <div className="pointer-events-none absolute left-0 right-0 top-0 flex items-center justify-between p-4 text-white/90">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-white/60">Pinch or double-tap to zoom {'\u00b7'} tap outside to close</p>
      </div>
      <div
        className="max-h-[90dvh] max-w-[96vw] overflow-hidden"
        style={{ touchAction: 'none' }}
        onClick={(e) => e.stopPropagation()}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={`Bible reading and quiet time schedule: ${title}`}
          draggable={false}
          className="max-h-[90dvh] max-w-[96vw] select-none object-contain"
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            transformOrigin: 'center',
            transition: gesture.current || drag.current ? 'none' : 'transform 120ms ease-out',
          }}
        />
      </div>
    </div>
  )
}
