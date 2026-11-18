import { Flex, type FlexCompatProps as FlexProps } from '@universe/mycelium'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { EXPANDABLE_ASSET_ISSUER_ROW_ALIGNMENT_INSET_X_PX } from 'uniswap/src/features/expandableAsset/expandableAssetLayout'
import { IssuerTableRowHoverContext } from 'uniswap/src/features/expandableAsset/IssuerTableRowHoverContext'

/** Tracks pointer hover for a single issuer table row (avoids shared Tamagui group-hover). */
export function IssuerTableRowHoverProvider({
  children,
  hoverStyle,
  onPress,
  alignColumnsWithParentRow = false,
  alignColumnsBleedPx = EXPANDABLE_ASSET_ISSUER_ROW_ALIGNMENT_INSET_X_PX,
}: {
  children: ReactNode
  hoverStyle?: FlexProps['hoverStyle']
  onPress?: FlexProps['onPress']
  /** Pulls the table row outward so token columns line up with the parent row above. */
  alignColumnsWithParentRow?: boolean
  /** Horizontal bleed (each side) used to align issuer columns with the parent row. Defaults to the full
   *  shell + inner-panel inset so the sub-row's content edge lines up with the parent metrics row, which
   *  bleeds to the shell edge. */
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
