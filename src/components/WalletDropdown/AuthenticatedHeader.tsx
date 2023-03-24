import { Trans } from '@lingui/macro'
import { formatUSDPrice } from '@uniswap/conedison/format'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { ButtonEmphasis, ButtonSize, ThemeButton } from 'components/Button'
import { getConnection } from 'connection/utils'
import { getChainInfoOrDefault } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import useCopyClipboard from 'hooks/useCopyClipboard'
import useStablecoinPrice from 'hooks/useStablecoinPrice'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { useIsNftClaimAvailable } from 'nft/hooks/useIsNftClaimAvailable'
import { useCallback, useMemo } from 'react'
import { Copy, ExternalLink as ExternalLinkIcon, Power } from 'react-feather'
import { useCurrencyBalanceString } from 'state/connection/hooks'
import { useAppDispatch } from 'state/hooks'
import { updateSelectedWallet } from 'state/user/reducer'
import styled, { css, keyframes } from 'styled-components/macro'
import { ThemedText } from 'theme'

import { shortenAddress } from '../../nft/utils/address'
import { useToggleModal } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'
import { useUserHasAvailableClaim, useUserUnclaimedAmount } from '../../state/claim/hooks'
import StatusIcon from '../Identicon/StatusIcon'
import IconButton, { IconHoverText } from './IconButton'

const BuyCryptoButtonBorderKeyframes = keyframes`
  0% {
    border-color: transparent;
  }
  33% {
    border-color: hsla(225, 95%, 63%, 1);
  }
  66% {
    border-color: hsla(267, 95%, 63%, 1);
  }
  100% {
    border-color: transparent;
  }
`

const BuyCryptoButton = styled(ThemeButton)`
  border-color: transparent;
  border-radius: 12px;
  border-style: solid;
  border-width: 1px;
  height: 40px;
  margin-top: 8px;
  animation-direction: alternate;
  animation-duration: ${({ theme }) => theme.transition.duration.slow};
  animation-fill-mode: none;
  animation-iteration-count: 2;
  animation-name: ${BuyCryptoButtonBorderKeyframes};
  animation-timing-function: ${({ theme }) => theme.transition.timing.inOut};
`
const WalletButton = styled(ThemeButton)`
  border-radius: 12px;
  padding-top: 10px;
  padding-bottom: 10px;
  margin-top: 4px;
  color: white;
  border: none;
`

const ProfileButton = styled(WalletButton)`
  background: ${({ theme }) => theme.accentAction};
  transition: ${({ theme }) => theme.transition.duration.fast} ${({ theme }) => theme.transition.timing.ease}
    background-color;
`

const UNIButton = styled(WalletButton)`
  background: linear-gradient(to right, #9139b0 0%, #4261d6 100%);
`

const Column = styled.div`
  display: flex;
  flex-direction: column;
  text-align: center;
`

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  & > a,
  & > button {
    margin-right: 8px;
  }

  & > button:last-child {
    margin-right: 0px;
    ${IconHoverText}:last-child {
      left: 0px;
    }
  }
`

const USDText = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.textSecondary};
  margin-top: 8px;
`

const TruncatedTextStyle = css`
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`

const FlexContainer = styled.div`
  ${TruncatedTextStyle}
  padding-right: 4px;
  display: inline-flex;
`

const AccountNamesWrapper = styled.div`
  min-width: 0;
  margin-right: 8px;
`

const ENSNameContainer = styled(ThemedText.SubHeader)`
  ${TruncatedTextStyle}
  color: ${({ theme }) => theme.textPrimary};
  margin-top: 2.5px;
`

const AccountContainer = styled(ThemedText.BodySmall)`
  ${TruncatedTextStyle}
  color: ${({ theme }) => theme.textSecondary};
  margin-top: 2.5px;
`

const BalanceWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 0;
`

const HeaderWrapper = styled.div`
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
`

const AuthenticatedHeader = () => {
  const { account, chainId, connector, ENSName } = useWeb3React()
  const [isCopied, setCopied] = useCopyClipboard()
  const copy = useCallback(() => {
    setCopied(account || '')
  }, [account, setCopied])
  const dispatch = useAppDispatch()
  const balanceString = useCurrencyBalanceString(account ?? '')
  const {
    nativeCurrency: { symbol: nativeCurrencySymbol },
    explorer,
  } = getChainInfoOrDefault(chainId ? chainId : SupportedChainId.MAINNET)
  const isClaimAvailable = useIsNftClaimAvailable((state) => state.isClaimAvailable)

  const unclaimedAmount: CurrencyAmount<Token> | undefined = useUserUnclaimedAmount(account)
  const isUnclaimed = useUserHasAvailableClaim(account)
  const connectionType = getConnection(connector).type
  const nativeCurrency = useNativeCurrency()
  const nativeCurrencyPrice = useStablecoinPrice(nativeCurrency ?? undefined)
  const openClaimModal = useToggleModal(ApplicationModal.ADDRESS_CLAIM)
  const openNftModal = useToggleModal(ApplicationModal.UNISWAP_NFT_AIRDROP_CLAIM)
  const disconnect = useCallback(() => {
    if (connector && connector.deactivate) {
      connector.deactivate()
    }
    connector.resetState()
    dispatch(updateSelectedWallet({ wallet: undefined }))
  }, [connector, dispatch])

  const amountUSD = useMemo(() => {
    if (!nativeCurrencyPrice || !balanceString) return undefined
    const price = parseFloat(nativeCurrencyPrice.toFixed(5))
    const balance = parseFloat(balanceString)
    return price * balance
  }, [balanceString, nativeCurrencyPrice])

  // animate the border of the buy crypto button when a user navigates here from the feature announcement
  // can be removed when components/FiatOnrampAnnouncment.tsx is no longer used

  return (
    <>
      <HeaderWrapper>
        <FlexContainer>
          <StatusIcon connectionType={connectionType} size={24} />
          {ENSName ? (
            <AccountNamesWrapper>
              <ENSNameContainer>{ENSName}</ENSNameContainer>
              <AccountContainer>{account && shortenAddress(account, 2, 4)}</AccountContainer>
            </AccountNamesWrapper>
          ) : (
            <ThemedText.SubHeader marginTop="2.5px">{account && shortenAddress(account, 2, 4)}</ThemedText.SubHeader>
          )}
        </FlexContainer>
        <IconContainer>
          <IconButton onClick={copy} Icon={Copy}>
            {isCopied ? <Trans>Copied!</Trans> : <Trans>Copy</Trans>}
          </IconButton>
          <IconButton href={`${explorer}address/${account}`} target="_blank" Icon={ExternalLinkIcon}>
            <Trans>Explore</Trans>
          </IconButton>
          <IconButton data-testid="wallet-disconnect" onClick={disconnect} Icon={Power}>
            <Trans>Disconnect</Trans>
          </IconButton>
        </IconContainer>
      </HeaderWrapper>
      <Column>
        <BalanceWrapper>
          <ThemedText.SubHeaderSmall>EVMOS Balance</ThemedText.SubHeaderSmall>
          <ThemedText.HeadlineLarge fontSize={36} fontWeight={400}>
            {balanceString} {nativeCurrencySymbol}
          </ThemedText.HeadlineLarge>
          {amountUSD !== undefined && <USDText>{formatUSDPrice(amountUSD)} USD</USDText>}
        </BalanceWrapper>
        <ProfileButton
          data-testid="nft-view-self-nfts"
          onClick={() => {
            window.open('https://www.orbitmarket.io/profile/' + account)
          }}
          size={ButtonSize.medium}
          emphasis={ButtonEmphasis.medium}
        >
          <Trans>View and sell NFTs</Trans>
        </ProfileButton>
        <BuyCryptoButton
          size={ButtonSize.medium}
          emphasis={ButtonEmphasis.medium}
          onClick={() => window.open('https://pay.c14.money')}
          disabled={false}
        >
          <Trans>Buy crypto</Trans>
        </BuyCryptoButton>

        {isUnclaimed && (
          <UNIButton onClick={openClaimModal} size={ButtonSize.medium} emphasis={ButtonEmphasis.medium}>
            <Trans>Claim</Trans> {unclaimedAmount?.toFixed(0, { groupSeparator: ',' } ?? '-')} <Trans>reward</Trans>
          </UNIButton>
        )}
        {isClaimAvailable && (
          <UNIButton size={ButtonSize.medium} emphasis={ButtonEmphasis.medium} onClick={openNftModal}>
            <Trans>Claim Uniswap NFT Airdrop</Trans>
          </UNIButton>
        )}
      </Column>
    </>
  )
}

export default AuthenticatedHeader
