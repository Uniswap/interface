import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react'
import { TAB_BAR_HEIGHT, TAB_VIEW_SCROLL_THROTTLE } from 'src/components/layout/TabHelpers'
import { dimensions } from 'ui/src/theme/restyle/sizing'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'

export function useAdaptiveFooterHeight({ headerHeight }: { headerHeight?: number }): {
  onContentSizeChange: ((w: number, h: number) => void) | undefined
  footerHeight: number
  setFooterHeight: Dispatch<SetStateAction<number>>
} {
  const [footerHeight, setFooterHeight] = useState(0)
  const activeAccount = useActiveAccount()

  const onContentSizeChange = useCallback(
    (_: number, contentHeight: number) => {
      if (headerHeight === undefined) return
      const footerHeightCorrection =
        dimensions.fullHeight + headerHeight - TAB_BAR_HEIGHT - contentHeight + 1
      // it should work without +1 but it doesn't, so we add 1. Probably some layout rounding issue.
      setTimeout(() => {
        // setFooterHeight would trigger onContentSizeChange, so we throttle to avoid too often updates
        setFooterHeight(footerHeight + footerHeightCorrection)
      }, TAB_VIEW_SCROLL_THROTTLE)
    },
    [footerHeight, headerHeight]
  )

  useEffect(() => {
    // we need to reset footerHeight when account changes
    // the actual value doesn't matter, as it will be set moments later in onContentSizeChange
    setFooterHeight(0.1)
  }, [activeAccount])
  return {
    onContentSizeChange: headerHeight === undefined ? undefined : onContentSizeChange,
    footerHeight,
    setFooterHeight,
  }
}
