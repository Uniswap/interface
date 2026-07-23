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
}: {
  children: ReactNode
  hoverStyle?: FlexProps['hoverStyle']
  onPress?: FlexProps['onPress']
  /** Pulls the table row outward so token columns line up with the parent row above. */
  alignColumnsWithParentRow?: boolean
}): JSX.Element {
  const [isHovered, setIsHovered] = useState(false)
  const issuerRowBleedPx = EXPANDABLE_ASSET_INNER_PADDING_X_PX * 2

  const row = alignColumnsWithParentRow ? (
    <Flex mx={-EXPANDABLE_ASSET_INNER_PADDING_X_PX} width={`calc(100% + ${issuerRowBleedPx}px)`}>
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
