import { Box } from 'nft/components/Box'
import * as styles from 'nft/components/layout/Marquee.css'
import { ReactNode, useEffect, useRef, useState } from 'react'

export const Marquee = ({ children, speed = 20 }: { children: ReactNode; speed?: number }) => {
  const [duration, setDuration] = useState(0)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const marqueeRef = useRef<HTMLDivElement | null>(null)

  const updateScrollDuration = () => {
    let containerWidth = 0
    let marqueeWidth = 0

    try {
      if (marqueeRef.current && containerRef.current) {
        containerWidth = containerRef.current.getBoundingClientRect().width
        marqueeWidth = marqueeRef.current.getBoundingClientRect().width
      }
    } catch (e) {}

    if (marqueeWidth < containerWidth) {
      setDuration(containerWidth / speed)
    } else {
      setDuration(marqueeWidth / speed)
    }
  }

  useEffect(() => {
    updateScrollDuration()
    // Rerender on window resize
    window.addEventListener('resize', updateScrollDuration)
    return () => {
      window.removeEventListener('resize', updateScrollDuration)
    }
  })

  return (
    <Box ref={containerRef} overflowX="hidden" display="flex" flexDirection="row" position="relative" width="full">
      <div ref={marqueeRef} style={{ ['--duration' as string]: `${duration}s` }} className={styles.marquee}>
        {children}
      </div>
      <div style={{ ['--duration' as string]: `${duration}s` }} className={styles.marquee}>
        {children}
      </div>
    </Box>
  )
}
