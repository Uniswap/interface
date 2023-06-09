import React, { memo } from 'react'
import OverlayIcon from 'src/components/icons/OverlayIcon'
import { Box } from 'src/components/layout'
import NoTokensFgIcon from 'ui/assets/icons/empty-state-coin.svg'
import NoTokensBgIcon from 'ui/assets/icons/empty-state-tokens.svg'
import { theme } from 'ui/theme/restyle/theme'

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
