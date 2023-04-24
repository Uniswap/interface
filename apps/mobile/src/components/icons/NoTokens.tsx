import React, { memo } from 'react'
import NoTokensFgIcon from 'src/assets/icons/empty-state-coin.svg'
import NoTokensBgIcon from 'src/assets/icons/empty-state-tokens.svg'
import OverlayIcon from 'src/components/icons/OverlayIcon'
import { Box } from 'src/components/layout'
import { theme } from 'src/styles/theme'

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
