import { Trans } from '@lingui/macro'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { darken } from 'polished'
import React from 'react'
import styled, { css } from 'styled-components'

import { MouseoverTooltip } from 'components/Tooltip'
import { SUPPORTED_WALLET, SUPPORTED_WALLETS } from 'constants/wallets'
import { useActiveWeb3React } from 'hooks'
import { useIsAcceptedTerm, useIsDarkMode } from 'state/user/hooks'
import { ExternalLink } from 'theme'
import { isEVMWallet, isSolanaWallet } from 'utils'
import checkForBraveBrowser from 'utils/checkForBraveBrowser'

import { C98OverrideGuide } from './WarningBox'

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;

  & > img,
  span {
    height: 20px;
    width: 20px;
  }
  ${({ theme }) => theme.mediaWidth.upToMedium`
    align-items: flex-end;
  `};
`

const HeaderText = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  color: ${({ theme }) => theme.subText};
  font-weight: 500;
`

const OptionCardClickable = styled.div<{
  connected: boolean
  installLink?: string
  isDisabled?: boolean
  overridden?: boolean
}>`
  height: 36px;
  width: 100%;
  border-radius: 18px;
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  background-color: ${({ theme }) => theme.tableHeader};
  overflow: hidden;
  white-space: nowrap;
  font-size: 14px;

  cursor: ${({ isDisabled, installLink, overridden }) =>
    !isDisabled && !installLink && !overridden ? 'pointer' : 'not-allowed'};

  ${({ isDisabled, connected, theme }) =>
    !isDisabled && connected
      ? `
      background-color: ${theme.primary};
      & ${HeaderText} {
        color: ${theme.darkText} !important;
      }
    `
      : ''}

  &:hover {
    text-decoration: none;
    ${({ installLink, isDisabled, overridden }) =>
      installLink || isDisabled || overridden
        ? ''
        : css`
            background-color: ${({ theme }) => darken(0.1, theme.tableHeader)};
            color: ${({ theme }) => theme.text} !important;
          `}
  }

  ${({ isDisabled, installLink, overridden, theme }) =>
    isDisabled || installLink || overridden
      ? `
      filter: grayscale(100%);
      & ${HeaderText} {
        color: ${theme.border};
      }
    `
      : ''}
`

const OptionCardLeft = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  justify-content: center;
  height: 100%;
`

const StyledLink = styled(ExternalLink)`
  width: 100%;
  &:hover {
    text-decoration: none;
  }
`

const Option = ({
  walletKey,
  readyState,
  isSupportCurrentChain,
  installLink,
  isOverridden,
  onSelected,
}: {
  walletKey: SUPPORTED_WALLET
  isSupportCurrentChain: boolean
  readyState?: WalletReadyState
  installLink?: string
  isOverridden?: boolean
  onSelected?: (walletKey: SUPPORTED_WALLET) => any
}) => {
  const isDarkMode = useIsDarkMode()
  const { walletKey: walletKeyConnected, isEVM, isSolana } = useActiveWeb3React()
  const isBraveBrowser = checkForBraveBrowser()
  const [isAcceptedTerm] = useIsAcceptedTerm()

  const wallet = SUPPORTED_WALLETS[walletKey]
  const isConnected = !!walletKeyConnected && walletKey === walletKeyConnected

  const icon = isDarkMode ? wallet.icon : wallet.iconLight

  const content = (
    <OptionCardClickable
      id={`connect-${walletKey}`}
      onClick={
        onSelected &&
        !isConnected &&
        (readyState === WalletReadyState.Installed ||
          (walletKey === 'COINBASE' && isEVM && readyState === WalletReadyState.NotDetected) ||
          (readyState === WalletReadyState.Loadable && isSolanaWallet(wallet))) &&
        isAcceptedTerm &&
        isSupportCurrentChain &&
        !isOverridden &&
        !(walletKey === 'BRAVE' && !isBraveBrowser)
          ? () => onSelected(walletKey)
          : undefined
      }
      connected={isConnected}
      isDisabled={!isAcceptedTerm}
      installLink={installLink}
      overridden={isOverridden}
    >
      <IconWrapper>
        <img src={icon} alt={'Icon'} />
      </IconWrapper>
      <OptionCardLeft>
        <HeaderText>{wallet.name}</HeaderText>
      </OptionCardLeft>
    </OptionCardClickable>
  )

  if (!isSupportCurrentChain) {
    return null
  }

  if (!isAcceptedTerm) return content

  if (readyState === WalletReadyState.Loadable && isEVMWallet(wallet) && wallet.href) {
    return <StyledLink href={wallet.href}>{content}</StyledLink>
  }

  if (walletKey === 'BRAVE') {
    // Brave wallet only can use in Brave browser
    if (!isBraveBrowser) {
      return (
        <MouseoverTooltip
          placement="bottom"
          text={
            <Trans>
              Brave wallet can only be used in Brave Browser. Download it{' '}
              <ExternalLink href={wallet.installLink || ''}>here↗</ExternalLink>
            </Trans>
          }
        >
          {content}
        </MouseoverTooltip>
      )
    }
    // Brave wallet overrided by Metamask extension
    if (isBraveBrowser && !window.ethereum?.isBraveWallet && isEVM) {
      return (
        <MouseoverTooltip
          placement="bottom"
          text={
            <Trans>
              Brave Wallet overridden by MetaMask Wallet. Disable MetaMask extension in order to use Brave Wallet.
            </Trans>
          }
        >
          {content}
        </MouseoverTooltip>
      )
    }
    // Brave wallet overrided by Metamask extension
    if (isBraveBrowser && !window.solana?.isBraveWallet && isSolana) {
      return (
        <MouseoverTooltip
          placement="bottom"
          text={
            <Trans>
              Brave Wallet overridden by Phantom Wallet. Disable Phantom extension in order to use Brave Wallet.
            </Trans>
          }
        >
          {content}
        </MouseoverTooltip>
      )
    }
  }

  if (readyState === WalletReadyState.NotDetected && (walletKey !== 'COINBASE' || !isEVM)) {
    return (
      <MouseoverTooltip
        placement="bottom"
        text={
          <Trans>
            You will need to install {wallet.name} extension/dapp before you can connect with it on KyberSwap. Get it{' '}
            <ExternalLink href={wallet.installLink || ''}>here↗</ExternalLink>
          </Trans>
        }
      >
        {content}
      </MouseoverTooltip>
    )
  }

  if (isOverridden) {
    return (
      <MouseoverTooltip
        width="500px"
        text={
          walletKey === 'COIN98' ? (
            <Trans>
              You need to enable <b>&quot;Override Wallet&quot;</b> in Coin98 settings.
            </Trans>
          ) : (
            <C98OverrideGuide walletKey={walletKey} />
          )
        }
        placement="bottom"
      >
        {content}
      </MouseoverTooltip>
    )
  }

  return content
}

export default React.memo(Option)
