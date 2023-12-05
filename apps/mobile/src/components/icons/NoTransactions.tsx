import React, { memo } from 'react'
import OverlayIcon from 'src/components/icons/OverlayIcon'
import { Flex, useSporeColors } from 'ui/src'
import NoTransactionFgIcon from 'ui/src/assets/icons/empty-state-coin.svg'
import NoTransactionBgIcon from 'ui/src/assets/icons/empty-state-transaction.svg'

export const NoTransactions = memo(function _NoTransactions() {
  const colors = useSporeColors()
  return (
    <Flex mb="$spacing24">
      <OverlayIcon
        bottom={-23}
        icon={<NoTransactionBgIcon color={colors.neutral3.get()} />}
        left={5}
        overlay={<NoTransactionFgIcon color={colors.neutral3.get()} />}
      />
    </Flex>
  )
})
