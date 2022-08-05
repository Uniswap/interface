import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import React from 'react'
import { MobileView } from 'react-device-detect'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'

import { RowBetween } from 'components/Row'
import { MobileModalWrapper } from 'components/swapv2/styleds'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { Field } from 'state/swap/actions'
import { ButtonText } from 'theme/components'

import Routing from './Routing'

function MobileTradeRoutes({
  trade,
  formattedAmounts,
  currencies,
}: {
  trade: any
  formattedAmounts: { [x: string]: string }
  currencies: { [field in Field]?: Currency }
}) {
  const theme = useTheme()
  const isOpen = useModalOpen(ApplicationModal.MOBILE_TRADE_ROUTES)
  const toggle = useToggleModal(ApplicationModal.MOBILE_TRADE_ROUTES)

  return (
    <MobileView>
      <MobileModalWrapper isOpen={isOpen && Boolean(trade)} onDismiss={toggle} maxHeight={80}>
        <Flex flexDirection="column" width="100%" padding="20px">
          <RowBetween padding="5px 0">
            <Text fontSize={18} fontWeight={500} color={theme.subText}>
              <Trans>Your trade route</Trans>
            </Text>
            <ButtonText onClick={toggle} style={{ alignSelf: 'flex-end' }}>
              <X color={theme.text} />
            </ButtonText>
          </RowBetween>
          <Routing trade={trade} currencies={currencies} formattedAmounts={formattedAmounts} />
        </Flex>
      </MobileModalWrapper>
    </MobileView>
  )
}

export default MobileTradeRoutes
