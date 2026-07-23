import { useEffect, useRef, useState } from 'react'

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null
}

function toHex(rgb: [number, number, number]): string {
  return `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
}

export function useChartAnimatedColor(target: string, duration = 400): string {
  const [color, setColor] = useState(target)
  const colorRef = useRef(target)
  const rafRef = useRef<number | undefined>(undefined)
  const animRef = useRef<{ from: string; to: string; startTime: number } | null>(null)

  useEffect(() => {
    if (target !== colorRef.current) {
      if (rafRef.current !== undefined) {
        cancelAnimationFrame(rafRef.current)
      }

      animRef.current = { from: colorRef.current, to: target, startTime: performance.now() }

      const tick = (now: number) => {
        const anim = animRef.current
        if (!anim) {
          return
        }
        const t = Math.min((now - anim.startTime) / duration, 1)
        const eased = 1 - Math.pow(1 - t, 3)
        const fromRgb = parseHex(anim.from)
        const toRgb = parseHex(anim.to)
        const next =
          fromRgb && toRgb
            ? toHex([
                fromRgb[0] + (toRgb[0] - fromRgb[0]) * eased,
                fromRgb[1] + (toRgb[1] - fromRgb[1]) * eased,
                fromRgb[2] + (toRgb[2] - fromRgb[2]) * eased,
              ])
            : anim.to
        colorRef.current = next
        setColor(next)
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick)
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    return () => {
      if (rafRef.current !== undefined) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [target, duration])

  return color
}
