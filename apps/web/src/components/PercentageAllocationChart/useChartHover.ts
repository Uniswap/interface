import { useState } from 'react'
import { useEvent } from 'utilities/src/react/hooks'

export function useChartHover(): {
  hoveredItemId: string | null
  onHover: (id: string | null) => void
} {
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null)
  const onHover = useEvent((id: string | null) => {
    setHoveredItemId(id)
  })
  return { hoveredItemId, onHover }
}
