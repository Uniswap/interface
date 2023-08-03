import React, { memo } from 'react'
import OverlayIcon from 'src/components/icons/OverlayIcon'
import { Box } from 'src/components/layout'
import NoTransactionFgIcon from 'ui/src/assets/icons/empty-state-coin.svg'
import NoTransactionBgIcon from 'ui/src/assets/icons/empty-state-transaction.svg'
import { theme } from 'ui/src/theme/restyle/theme'

export const NoTransactions = memo(function _NoTransactions() {
  return (
    <Box mb="spacing24">
      <OverlayIcon
        bottom={-23}
        icon={<NoTransactionBgIcon color={theme.colors.DEP_textSecondary} />}
        left={5}
        overlay={
          <NoTransactionFgIcon
            color={theme.colors.DEP_background3}
            fill={theme.colors.DEP_accentAction}
          />
        }
      />
    </Box>
  )
})
