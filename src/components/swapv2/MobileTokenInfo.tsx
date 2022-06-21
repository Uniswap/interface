import React, { useContext } from 'react'
import { MobileModalWrapper } from 'components/swapv2/styleds'
import { Flex, Text } from 'rebass'
import { ButtonText } from 'theme/components'
import { X } from 'react-feather'
import { ThemeContext } from 'styled-components'
import { isMobile, MobileView } from 'react-device-detect'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/actions'
import { RowBetween } from 'components/Row'
import { Trans } from '@lingui/macro'
import { Field } from 'state/swap/actions'
import { Currency } from '@kyberswap/ks-sdk-core'
import TokenInfo from 'components/swapv2/TokenInfo'
import { Info } from 'react-feather'

function MobileTradeRoutes({
  currencies,
  onClick,
}: {
  currencies: { [field in Field]?: Currency }
  onClick?: () => void
}) {
  const theme = useContext(ThemeContext)
  const isOpen = useModalOpen(ApplicationModal.MOBILE_TOKEN_INFO)
  const toggle = useToggleModal(ApplicationModal.MOBILE_TOKEN_INFO)

  return (
    <>
      <Info
        size={20}
        onClick={isMobile ? toggle : onClick}
        style={{
          display: 'flex',
          width: 36,
        }}
      />
      <MobileView>
        <MobileModalWrapper isOpen={isOpen} onDismiss={toggle} maxHeight={80}>
          <Flex flexDirection="column" alignItems="center" width="100%">
            <Flex flexDirection="column" width="100%" padding="20px 20px 0px 20px">
              <RowBetween padding="5px 0">
                <Text fontSize={18} fontWeight={500} color={theme.subText}>
                  <Trans>Info</Trans>
                </Text>
                <ButtonText onClick={toggle} style={{ alignSelf: 'flex-end' }}>
                  <X color={theme.text} />
                </ButtonText>
              </RowBetween>
            </Flex>
            <Flex flexDirection="column" width="100%" padding="0px 20px" marginBottom={20}>
              <TokenInfo currencies={currencies} border={false} />
            </Flex>
          </Flex>
        </MobileModalWrapper>
      </MobileView>
    </>
  )
}

export default MobileTradeRoutes
