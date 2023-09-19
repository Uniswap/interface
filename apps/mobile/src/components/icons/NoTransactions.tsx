import React, { memo } from 'react'
import OverlayIcon from 'src/components/icons/OverlayIcon'
import { Flex } from 'ui/src'
import NoTransactionFgIcon from 'ui/src/assets/icons/empty-state-coin.svg'
import NoTransactionBgIcon from 'ui/src/assets/icons/empty-state-transaction.svg'
import { theme } from 'ui/src/theme/restyle'

export const NoTransactions = memo(function _NoTransactions() {
  return (
    <Flex mb="$spacing24">
      <OverlayIcon
        bottom={-23}
        icon={<NoTransactionBgIcon color={theme.colors.neutral3} />}
        left={5}
        overlay={<NoTransactionFgIcon color={theme.colors.neutral3} fill={theme.colors.accent1} />}
      />
    </Flex>
  )
})
