import { Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import CopyHelper from 'components/Copy'
import Loader from 'components/Loader'
import ActionButtonGroup from 'components/WalletPopup/AccountInfo/ActionButtonGroup'
import CardBackground from 'components/WalletPopup/AccountInfo/CardBackground'
import MinimalActionButtonGroup from 'components/WalletPopup/AccountInfo/MinimalActionButtonGroup'
import Settings from 'components/WalletPopup/AccountInfo/Settings'
import { SUPPORTED_WALLETS } from 'constants/wallets'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useIsDarkMode } from 'state/user/hooks'
import { ExternalLinkIcon } from 'theme'
import { formatNumberWithPrecisionRange, getEtherscanLink, shortenAddress } from 'utils'

const ContentWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 160px;
`

const Content = styled.div`
  position: relative;
  z-index: 2;

  width: 100%;
  height: 100%;
  padding: 20px;

  display: flex;
  flex-direction: column;
  justify-content: space-between;
`

const BalanceTitle = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.subText};
`

const BalanceValue = styled.span`
  font-size: 36px;
  font-weight: 500;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`

type WrapperProps = {
  $minimal: boolean
}
const Wrapper = styled.div.attrs<WrapperProps>(props => ({
  'data-minimal': props.$minimal,
}))<WrapperProps>`
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: all 100ms;

  ${ActionButtonGroup} {
    display: flex;
  }
  ${MinimalActionButtonGroup} {
    display: none;
  }

  &[data-minimal='true'] {
    ${MinimalActionButtonGroup} {
      display: flex;
      align-self: flex-end;
    }
    ${ActionButtonGroup} {
      display: none;
    }
    ${ContentWrapper} {
      height: 120px;
    }
    ${Content} {
      padding: 12px;
    }
    ${BalanceValue} {
      font-size: 20px;
    }
  }
`

const IconWrapper = styled.div`
  display: flex;
  width: 20px;
  height: 20px;
  justify-content: center;
  align-items: center;
`

type Props = {
  totalBalanceInUsd: number | null
  isMinimal: boolean
} & ClickHandlerProps

export type ClickHandlerProps = {
  disabledSend: boolean
  onClickBuy: () => void
  onClickReceive: () => void
  onClickSend: () => void
}

export default function AccountInfo({
  totalBalanceInUsd,
  disabledSend,
  onClickBuy,
  onClickReceive,
  onClickSend,
  isMinimal,
}: Props) {
  const { chainId, account = '', walletKey } = useActiveWeb3React()
  const theme = useTheme()
  const isDarkMode = useIsDarkMode()

  return (
    <Wrapper $minimal={isMinimal}>
      <ContentWrapper>
        <CardBackground noLogo={isMinimal} />
        <Content>
          <Flex alignItems="center" justifyContent={'space-between'}>
            <Flex alignItems={'center'} style={{ gap: 5 }} color={theme.subText}>
              {walletKey && (
                <IconWrapper>
                  <img
                    height={18}
                    src={isDarkMode ? SUPPORTED_WALLETS[walletKey].icon : SUPPORTED_WALLETS[walletKey].iconLight}
                    alt={SUPPORTED_WALLETS[walletKey].name + ' icon'}
                  />
                </IconWrapper>
              )}
              <Text as="span" fontWeight="500">
                {shortenAddress(chainId, account, 5, false)}
              </Text>
              <CopyHelper toCopy={account} />
              <ExternalLinkIcon href={getEtherscanLink(chainId, account, 'address')} color={theme.subText} />
            </Flex>

            <Settings />
          </Flex>

          <Flex
            sx={{
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Flex
              sx={{
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <BalanceTitle>
                <Trans>Total Balance</Trans>
              </BalanceTitle>

              <BalanceValue>
                {totalBalanceInUsd !== null ? (
                  `$${formatNumberWithPrecisionRange(totalBalanceInUsd, 0, 8)}`
                ) : (
                  <Loader size="30px" />
                )}
              </BalanceValue>
            </Flex>

            <MinimalActionButtonGroup
              disabledSend={disabledSend}
              onClickBuy={onClickBuy}
              onClickReceive={onClickReceive}
              onClickSend={onClickSend}
            />
          </Flex>
        </Content>
      </ContentWrapper>

      <ActionButtonGroup
        disabledSend={disabledSend}
        onClickBuy={onClickBuy}
        onClickReceive={onClickReceive}
        onClickSend={onClickSend}
      />
    </Wrapper>
  )
}
