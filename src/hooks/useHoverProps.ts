import { useState } from 'react'

export default function useHoverProps(): [boolean, { onMouseEnter: () => void; onMouseLeave: () => void }] {
  const [hover, setHover] = useState(false)
  const hoverProps = { onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false) }

  return [hover, hoverProps]
}
