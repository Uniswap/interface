import { useEffect, useMemo, useState } from 'react'

export function usePinnedColumns({
  defaultPinnedColumns,
  maxWidth,
  forcePinning,
}: {
  defaultPinnedColumns: string[]
  maxWidth: number | undefined
  forcePinning: boolean
}) {
  const [pinnedColumns, setPinnedColumns] = useState<string[]>([])

  useEffect(() => {
    const resizeHandler = () => {
      if (!defaultPinnedColumns.length) {
        return
      }

      if ((maxWidth && window.innerWidth < maxWidth) || forcePinning) {
        setPinnedColumns(defaultPinnedColumns)
      } else {
        setPinnedColumns([])
      }
    }
    resizeHandler()
    window.addEventListener('resize', resizeHandler)
    return () => {
      window.removeEventListener('resize', resizeHandler)
    }
  }, [maxWidth, defaultPinnedColumns, forcePinning])

  const hasPinnedColumns = useMemo(() => pinnedColumns.length > 0, [pinnedColumns])

  return { pinnedColumns, hasPinnedColumns }
}
