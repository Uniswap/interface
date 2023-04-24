import React, { memo } from 'react'
import NoTransactionFgIcon from 'src/assets/icons/empty-state-coin.svg'
import NoTransactionBgIcon from 'src/assets/icons/empty-state-transaction.svg'
import OverlayIcon from 'src/components/icons/OverlayIcon'
import { Box } from 'src/components/layout'
import { theme } from 'src/styles/theme'

export const NoTransactions = memo(() => (
  <Box mb="spacing24">
    <OverlayIcon
      bottom={-23}
      icon={<NoTransactionBgIcon color={theme.colors.textSecondary} />}
      left={5}
      overlay={
        <NoTransactionFgIcon color={theme.colors.background3} fill={theme.colors.accentAction} />
      }
    />
  </Box>
))
