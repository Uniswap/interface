import { BoxProps } from '@shopify/restyle'
import React from 'react'
import { ViewProps } from 'react-native'
import { TOKEN_ITEM_BOX_MINWIDTH } from 'src/components/explore/PinnedTokenCard'
import { Box } from 'src/components/layout'
import { Theme } from 'src/styles/theme'

export function FavoriteLoader({ ...props }: BoxProps<Theme, true> & ViewProps) {
  //  TODO(dcj): refactor favorite token loader to derive height from placeholder content: simulated text elements etc.
  const boxMinHeight = 116
  return (
    <Box
      backgroundColor="backgroundAction"
      borderRadius="md"
      minHeight={boxMinHeight}
      width={TOKEN_ITEM_BOX_MINWIDTH}
      {...props}
    />
  )
}
