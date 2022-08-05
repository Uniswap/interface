import React, { useContext } from 'react'
import { MobileModalWrapper, StyledActionButtonSwapForm } from 'components/swapv2/styleds'
import { Flex, Text } from 'rebass'
import { ButtonText } from 'theme/components'

import { ThemeContext } from 'styled-components'
import { isMobile, MobileView } from 'react-device-detect'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/actions'
import { RowBetween } from 'components/Row'
import { Trans, t } from '@lingui/macro'
import { Field } from 'state/swap/actions'
import { Currency } from '@kyberswap/ks-sdk-core'
import TokenInfo from 'components/swapv2/TokenInfo'
import { X, Info } from 'react-feather'
import { MouseoverTooltip } from 'components/Tooltip'

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
      <MobileView>
        <MobileModalWrapper isOpen={isOpen} onDismiss={toggle} maxHeight={80}>
          <Flex flexDirection="column" alignItems="center" width="100%">
            <Flex flexDirection="column" width="100%" padding="16px 16px 0px" marginBottom="1rem">
              <RowBetween>
                <Text fontSize={16} fontWeight={500}>
                  <Trans>Info</Trans>
                </Text>
                <ButtonText onClick={toggle} style={{ alignSelf: 'flex-end', lineHeight: 0 }}>
                  <X color={theme.subText} size={24} />
                </ButtonText>
              </RowBetween>
            </Flex>
            <Flex flexDirection="column" width="100%" padding="0px 16px" marginBottom={20}>
              <TokenInfo currencies={currencies} />
            </Flex>
          </Flex>
        </MobileModalWrapper>
      </MobileView>
      <StyledActionButtonSwapForm onClick={isMobile ? toggle : onClick}>
        <MouseoverTooltip text={t`Token Info`} placement="top" width="fit-content">
          <Info color={theme.subText} size={20} />
        </MouseoverTooltip>
      </StyledActionButtonSwapForm>
    </>
  )
}

export default MobileTradeRoutes
