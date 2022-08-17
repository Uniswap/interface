import { Box } from 'nft/components/Box'
import * as styles from 'nft/components/layout/Marquee.css'
import { ReactNode, useEffect, useRef, useState } from 'react'

export const Marquee = ({ children, speed = 20 }: { children: ReactNode; speed?: number }) => {
  const [containerWidth, setContainerWidth] = useState(0)
  const [marqueeWidth, setMarqueeWidth] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const marqueeRef = useRef<HTMLDivElement | null>(null)

  const calculateWidth = () => {
    // Find width of container and width of marquee

    try {
      if (marqueeRef.current && containerRef.current) {
        setContainerWidth(containerRef.current.getBoundingClientRect().width)
        setMarqueeWidth(marqueeRef.current.getBoundingClientRect().width)
      }
    } catch (e) {
      console.error('Refs became unexpectedly null', e)
    }

    if (marqueeWidth < containerWidth) {
      setDuration(containerWidth / speed)
    } else {
      setDuration(marqueeWidth / speed)
    }
  }

  useEffect(() => {
    calculateWidth()
    // Rerender on window resize
    window.addEventListener('resize', calculateWidth)
    return () => {
      window.removeEventListener('resize', calculateWidth)
    }
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <>
      {!isMounted ? null : (
        <Box ref={containerRef} overflowX="hidden" display="flex" flexDirection="row" position="relative" width="full">
          <div ref={marqueeRef} style={{ ['--duration' as string]: `${duration}s` }} className={styles.marquee}>
            {children}
          </div>
          <div style={{ ['--duration' as string]: `${duration}s` }} className={styles.marquee}>
            {children}
          </div>
        </Box>
      )}
    </>
  )
}
