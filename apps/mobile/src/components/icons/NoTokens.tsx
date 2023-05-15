import React, { memo } from 'react'
import OverlayIcon from 'src/components/icons/OverlayIcon'
import { Box } from 'src/components/layout'
import { theme } from 'src/styles/theme'
import NoTokensFgIcon from 'ui/src/assets/icons/empty-state-coin.svg'
import NoTokensBgIcon from 'ui/src/assets/icons/empty-state-tokens.svg'

export const NoTokens = memo(() => (
  <Box>
    <OverlayIcon
      bottom={0}
      icon={<NoTokensBgIcon color={theme.colors.textSecondary} />}
      overlay={<NoTokensFgIcon color={theme.colors.background3} fill={theme.colors.accentAction} />}
      right={0}
    />
  </Box>
))
