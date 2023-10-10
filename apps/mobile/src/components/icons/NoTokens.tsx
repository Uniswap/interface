import React, { memo } from 'react'
import OverlayIcon from 'src/components/icons/OverlayIcon'
import { Flex, useSporeColors } from 'ui/src'
import NoTokensFgIcon from 'ui/src/assets/icons/empty-state-coin.svg'
import NoTokensBgIcon from 'ui/src/assets/icons/empty-state-tokens.svg'

export const NoTokens = memo(function _NoTokens() {
  const colors = useSporeColors()
  return (
    <Flex>
      <OverlayIcon
        bottom={0}
        icon={<NoTokensBgIcon color={colors.neutral2.get()} />}
        overlay={<NoTokensFgIcon color={colors.surface2.get()} fill={colors.accent1.get()} />}
        right={0}
      />
    </Flex>
  )
})
