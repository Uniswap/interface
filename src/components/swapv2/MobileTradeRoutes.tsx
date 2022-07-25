import React, { useContext } from 'react'
import { MobileModalWrapper } from 'components/swapv2/styleds'
import { Flex, Text } from 'rebass'
import { ButtonText } from 'theme/components'
import { X } from 'react-feather'
import { ThemeContext } from 'styled-components'
import { MobileView } from 'react-device-detect'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/actions'
import { RowBetween } from 'components/Row'
import Routing from './Routing'
import { Trans } from '@lingui/macro'
import { Field } from 'state/swap/actions'
import { Currency } from '@kyberswap/ks-sdk-core'

function MobileTradeRoutes({
  trade,
  formattedAmounts,
  currencies,
}: {
  trade: any
  formattedAmounts: { [x: string]: string }
  currencies: { [field in Field]?: Currency }
}) {
  const theme = useContext(ThemeContext)
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
