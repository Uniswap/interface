import { useEffect, useRef, useState } from 'react'

export const useInView = () => {
  const ref = useRef<any>()
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.length) {
          return
        }
        const [firstEntry] = entries
        if (firstEntry.isIntersecting) {
          setInView(true)
        }
      },
      {
        threshold: 0.25,
      },
    )

    io.observe(ref.current)

    return () => {
      io.disconnect()
    }
  }, [])

  return { ref, inView }
}
