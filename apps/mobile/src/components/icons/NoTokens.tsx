import React, { memo } from 'react'
import OverlayIcon from 'src/components/icons/OverlayIcon'
import { Box } from 'src/components/layout'
import NoTokensFgIcon from 'ui/src/assets/icons/empty-state-coin.svg'
import NoTokensBgIcon from 'ui/src/assets/icons/empty-state-tokens.svg'
import { theme } from 'ui/src/theme/restyle/theme'

export const NoTokens = memo(function _NoTokens() {
  return (
    <Box>
      <OverlayIcon
        bottom={0}
        icon={<NoTokensBgIcon color={theme.colors.neutral2} />}
        overlay={<NoTokensFgIcon color={theme.colors.surface2} fill={theme.colors.accent1} />}
        right={0}
      />
    </Box>
  )
})
