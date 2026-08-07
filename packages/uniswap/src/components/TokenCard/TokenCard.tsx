import { memo } from 'react'
import { TouchableArea } from 'ui/src'
import { tokenCardHoverStyle, tokenCardShellProps } from 'uniswap/src/components/TokenCard/constants'
import { TokenCardHorizontal } from 'uniswap/src/components/TokenCard/TokenCardHorizontal'
import { TokenCardVertical } from 'uniswap/src/components/TokenCard/TokenCardVertical'
import type { TokenCardProps } from 'uniswap/src/components/TokenCard/types'

/**
 * Shared presentational token card for carousel surfaces on web and mobile.
 * Data, navigation, and container concerns (e.g. scroll-snap) are owned by the call site.
 */
export const TokenCard = memo(function TokenCard(props: TokenCardProps): JSX.Element {
  const { onPress, width, testID } = props
  const isHorizontal = props.layout === 'horizontal'

  return (
    <TouchableArea
      {...tokenCardShellProps}
      alignItems={isHorizontal ? 'center' : undefined}
      flexDirection={isHorizontal ? 'row' : 'column'}
      hoverStyle={onPress ? tokenCardHoverStyle : undefined}
      testID={testID}
      width={width}
      onPress={onPress}
    >
      {props.layout === 'horizontal' ? <TokenCardHorizontal {...props} /> : <TokenCardVertical {...props} />}
    </TouchableArea>
  )
})
