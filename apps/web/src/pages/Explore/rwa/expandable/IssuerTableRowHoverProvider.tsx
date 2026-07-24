import type { ReactNode } from 'react'
import { useState } from 'react'
import { Flex, type FlexProps } from 'ui/src'
import { EXPANDABLE_ASSET_INNER_PADDING_X_PX } from 'uniswap/src/features/expandableAsset/expandableAssetLayout'
import { IssuerTableRowHoverContext } from 'uniswap/src/features/expandableAsset/IssuerTableRowHoverContext'

/** Tracks pointer hover for a single issuer table row (avoids shared Tamagui group-hover). */
export function IssuerTableRowHoverProvider({
  children,
  hoverStyle,
  onPress,
  alignColumnsWithParentRow = false,
  alignColumnsBleedPx = EXPANDABLE_ASSET_INNER_PADDING_X_PX,
}: {
  children: ReactNode
  hoverStyle?: FlexProps['hoverStyle']
  onPress?: FlexProps['onPress']
  /** Pulls the table row outward so token columns line up with the parent row above. */
  alignColumnsWithParentRow?: boolean
  /** Horizontal bleed (each side) used to align columns. RWA shells are widened by the shell padding, so
   *  bleeding past the inner panel padding (4px) is enough. Non-widened shells must also bleed past the
   *  shell padding (8px total) or the fixed-width sub-row overflows the shell's right edge. */
  alignColumnsBleedPx?: number
}): JSX.Element {
  const [isHovered, setIsHovered] = useState(false)
  const issuerRowBleedPx = alignColumnsBleedPx * 2

  const row = alignColumnsWithParentRow ? (
    <Flex mx={-alignColumnsBleedPx} width={`calc(100% + ${issuerRowBleedPx}px)`}>
      {children}
    </Flex>
  ) : (
    children
  )

  return (
    <IssuerTableRowHoverContext.Provider value={isHovered}>
      <Flex
        width="100%"
        borderRadius="$rounded12"
        hoverStyle={hoverStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onPress={onPress}
      >
        {row}
      </Flex>
    </IssuerTableRowHoverContext.Provider>
  )
}
