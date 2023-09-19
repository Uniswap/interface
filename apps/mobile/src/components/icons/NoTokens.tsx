import React, { memo } from 'react'
import OverlayIcon from 'src/components/icons/OverlayIcon'
import { Flex } from 'ui/src'
import NoTokensFgIcon from 'ui/src/assets/icons/empty-state-coin.svg'
import NoTokensBgIcon from 'ui/src/assets/icons/empty-state-tokens.svg'
import { theme } from 'ui/src/theme/restyle'

export const NoTokens = memo(function _NoTokens() {
  return (
    <Flex>
      <OverlayIcon
        bottom={0}
        icon={<NoTokensBgIcon color={theme.colors.neutral2} />}
        overlay={<NoTokensFgIcon color={theme.colors.surface2} fill={theme.colors.accent1} />}
        right={0}
      />
    </Flex>
  )
})
