import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

/** A soft focus ring that trails the mouse and opens up over anything clickable.
 *  Desktop only; hidden for touch screens and for visitors who reduce motion. */
export default function Cursor() {
  const [enabled, setEnabled] = useState(false)
  const [hover, setHover] = useState(false)
  const [down, setDown] = useState(false)
  const [visible, setVisible] = useState(false)
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 })

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduce) return
    setEnabled(true)
    const move = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      setVisible(true)
      const el = e.target instanceof Element ? e.target.closest('a, button, [role="button"], [role="tab"], input, select, textarea, label') : null
      setHover(!!el)
    }
    const leave = () => setVisible(false)
    const press = () => setDown(true)
    const release = () => setDown(false)
    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerleave', leave)
    window.addEventListener('pointerdown', press)
    window.addEventListener('pointerup', release)
    return () => {
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', leave)
      window.removeEventListener('pointerdown', press)
      window.removeEventListener('pointerup', release)
    }
  }, [x, y])

  if (!enabled) return null
  const size = hover ? 44 : 22
  return (
    <motion.div
      aria-hidden="true"
      className="fixed top-0 left-0 z-[100] pointer-events-none rounded-full"
      style={{ x: sx, y: sy, translateX: '-50%', translateY: '-50%', border: '1.5px solid var(--c-accent)' }}
      animate={{ width: size, height: size, opacity: visible ? 1 : 0, scale: down ? 0.8 : 1, backgroundColor: hover ? 'rgba(var(--c-accent-rgb),0.12)' : 'rgba(var(--c-accent-rgb),0)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    />
  )
}
