import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { MobileView, isMobile } from 'react-device-detect'
import { Info, X } from 'react-feather'
import { Flex, Text } from 'rebass'

import { RowBetween } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import TokenInfo from 'components/swapv2/TokenInfo'
import { MobileModalWrapper, StyledActionButtonSwapForm } from 'components/swapv2/styleds'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { Field } from 'state/swap/actions'
import { ButtonText } from 'theme/components'

function MobileTradeRoutes({
  currencies,
  onClick,
}: {
  currencies: { [field in Field]?: Currency }
  onClick?: () => void
}) {
  const theme = useTheme()
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
