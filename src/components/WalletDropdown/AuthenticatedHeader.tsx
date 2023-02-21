import { Trans } from '@lingui/macro'
import { sendAnalyticsEvent } from '@uniswap/analytics'
import { InterfaceEventName } from '@uniswap/analytics-events'
import { formatUSDPrice } from '@uniswap/conedison/format'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { ButtonEmphasis, ButtonSize, LoadingButtonSpinner, ThemeButton } from 'components/Button'
import Tooltip from 'components/Tooltip'
import { getConnection } from 'connection'
import { getChainInfoOrDefault } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import useStablecoinPrice from 'hooks/useStablecoinPrice'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { useProfilePageState, useSellAsset, useWalletCollections } from 'nft/hooks'
import { useIsNftClaimAvailable } from 'nft/hooks/useIsNftClaimAvailable'
import { ProfilePageStateType } from 'nft/types'
import { useCallback, useMemo, useState } from 'react'
import { Copy, CreditCard, Info, Power, Settings } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { useCurrencyBalanceString } from 'state/connection/hooks'
import { useAppDispatch } from 'state/hooks'
import { updateSelectedWallet } from 'state/user/reducer'
import styled from 'styled-components/macro'
import { CopyHelper, ExternalLink, ThemedText } from 'theme'

import { shortenAddress } from '../../nft/utils/address'
import { useCloseModal, useFiatOnrampAvailability, useOpenModal, useToggleModal } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'
import { useUserHasAvailableClaim, useUserUnclaimedAmount } from '../../state/claim/hooks'
import StatusIcon from '../Identicon/StatusIcon'
import IconButton, { IconHoverText } from './IconButton'

const BuyCryptoButton = styled(ThemeButton)`
  border-color: transparent;
  border-radius: 12px;
  border-style: solid;
  border-width: 1px;
  height: 40px;
  margin-top: 8px;
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
const FiatOnrampNotAvailableText = styled(ThemedText.Caption)`
  align-items: center;
  color: ${({ theme }) => theme.textSecondary};
  display: flex;
  justify-content: center;
`
const FiatOnrampAvailabilityExternalLink = styled(ExternalLink)`
  align-items: center;
  display: flex;
  height: 14px;
  justify-content: center;
  margin-left: 6px;
  width: 14px;
`

const StatusWrapper = styled.div`
  display: inline-block;
  margin-top: 4px;
  width: 70%;
  padding-right: 4px;
  display: inline-flex;
`

const AccountNamesWrapper = styled.div`
  overflow: hidden;
  white-space: nowrap;
  display: flex;
  width: 100%;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
`

const StyledInfoIcon = styled(Info)`
  height: 12px;
  width: 12px;
  flex: 1 1 auto;
`
const StyledLoadingButtonSpinner = styled(LoadingButtonSpinner)`
  fill: ${({ theme }) => theme.accentAction};
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

const CopyText = styled(CopyHelper).attrs({
  InitialIcon: Copy,
  CopiedIcon: Copy,
  gap: 4,
  iconSize: 14,
  iconPosition: 'right',
})``

const AuthenticatedHeader = () => {
  const { account, chainId, connector, ENSName } = useWeb3React()
  const dispatch = useAppDispatch()
  const balanceString = useCurrencyBalanceString(account ?? '')
  const {
    nativeCurrency: { symbol: nativeCurrencySymbol },
  } = getChainInfoOrDefault(chainId ? chainId : SupportedChainId.MAINNET)
  const navigate = useNavigate()
  const closeModal = useCloseModal()
  const setSellPageState = useProfilePageState((state) => state.setProfilePageState)
  const resetSellAssets = useSellAsset((state) => state.reset)
  const clearCollectionFilters = useWalletCollections((state) => state.clearCollectionFilters)
  const isClaimAvailable = useIsNftClaimAvailable((state) => state.isClaimAvailable)

  const unclaimedAmount: CurrencyAmount<Token> | undefined = useUserUnclaimedAmount(account)
  const isUnclaimed = useUserHasAvailableClaim(account)
  const connection = getConnection(connector)
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

  const navigateToProfile = useCallback(() => {
    resetSellAssets()
    setSellPageState(ProfilePageStateType.VIEWING)
    clearCollectionFilters()
    navigate('/nfts/profile')
    closeModal()
  }, [clearCollectionFilters, closeModal, navigate, resetSellAssets, setSellPageState])

  const openFiatOnrampModal = useOpenModal(ApplicationModal.FIAT_ONRAMP)
  const openFoRModalWithAnalytics = useCallback(() => {
    sendAnalyticsEvent(InterfaceEventName.FIAT_ONRAMP_WIDGET_OPENED)
    openFiatOnrampModal()
  }, [openFiatOnrampModal])

  const [shouldCheck, setShouldCheck] = useState(false)
  const {
    available: fiatOnrampAvailable,
    availabilityChecked: fiatOnrampAvailabilityChecked,
    error,
    loading: fiatOnrampAvailabilityLoading,
  } = useFiatOnrampAvailability(shouldCheck, openFoRModalWithAnalytics)

  const handleBuyCryptoClick = useCallback(() => {
    if (!fiatOnrampAvailabilityChecked) {
      setShouldCheck(true)
    } else if (fiatOnrampAvailable) {
      openFoRModalWithAnalytics()
    }
  }, [fiatOnrampAvailabilityChecked, fiatOnrampAvailable, openFoRModalWithAnalytics])
  const disableBuyCryptoButton = Boolean(
    error || (!fiatOnrampAvailable && fiatOnrampAvailabilityChecked) || fiatOnrampAvailabilityLoading
  )
  const [showFiatOnrampUnavailableTooltip, setShow] = useState<boolean>(false)
  const openFiatOnrampUnavailableTooltip = useCallback(() => setShow(true), [setShow])
  const closeFiatOnrampUnavailableTooltip = useCallback(() => setShow(false), [setShow])

  return (
    <>
      <HeaderWrapper>
        <StatusWrapper>
          <StatusIcon connection={connection} size={44} />
          {account && (
            <AccountNamesWrapper>
              <ThemedText.SubHeader color="textPrimary" fontWeight={500}>
                <CopyText toCopy={ENSName ?? account}>{ENSName ?? shortenAddress(account, 4, 4)}</CopyText>
              </ThemedText.SubHeader>
              {/* Displays smaller view of account if ENS name was rendered above */}
              {ENSName && (
                <ThemedText.BodySmall color="textTertiary">
                  <CopyText toCopy={account}>{shortenAddress(account, 4, 4)}</CopyText>
                </ThemedText.BodySmall>
              )}
            </AccountNamesWrapper>
          )}
        </StatusWrapper>
        <IconContainer>
          <IconButton target="_blank" Icon={Settings}>
            <Trans>Settings</Trans>
          </IconButton>
          <IconButton data-testid="wallet-disconnect" onClick={disconnect} Icon={Power}>
            <Trans>Disconnect</Trans>
          </IconButton>
        </IconContainer>
      </HeaderWrapper>
      <Column>
        <BalanceWrapper>
          <ThemedText.SubHeaderSmall>ETH Balance</ThemedText.SubHeaderSmall>
          <ThemedText.HeadlineLarge fontSize={36} fontWeight={400}>
            {balanceString} {nativeCurrencySymbol}
          </ThemedText.HeadlineLarge>
          {amountUSD !== undefined && <USDText>{formatUSDPrice(amountUSD)} USD</USDText>}
        </BalanceWrapper>
        <ProfileButton
          data-testid="nft-view-self-nfts"
          onClick={navigateToProfile}
          size={ButtonSize.medium}
          emphasis={ButtonEmphasis.medium}
        >
          <Trans>View and sell NFTs</Trans>
        </ProfileButton>
        <BuyCryptoButton
          size={ButtonSize.medium}
          emphasis={ButtonEmphasis.medium}
          onClick={handleBuyCryptoClick}
          disabled={disableBuyCryptoButton}
        >
          {error ? (
            <ThemedText.BodyPrimary>{error}</ThemedText.BodyPrimary>
          ) : (
            <>
              {fiatOnrampAvailabilityLoading ? (
                <StyledLoadingButtonSpinner />
              ) : (
                <CreditCard height="20px" width="20px" />
              )}{' '}
              <Trans>Buy crypto</Trans>
            </>
          )}
        </BuyCryptoButton>
        {Boolean(!fiatOnrampAvailable && fiatOnrampAvailabilityChecked) && (
          <FiatOnrampNotAvailableText marginTop="8px">
            <Trans>Not available in your region</Trans>
            <Tooltip
              show={showFiatOnrampUnavailableTooltip}
              text={<Trans>Moonpay is not available in some regions. Click to learn more.</Trans>}
            >
              <FiatOnrampAvailabilityExternalLink
                onMouseEnter={openFiatOnrampUnavailableTooltip}
                onMouseLeave={closeFiatOnrampUnavailableTooltip}
                style={{ color: 'inherit' }}
                href="https://support.uniswap.org/hc/en-us/articles/11306664890381-Why-isn-t-MoonPay-available-in-my-region-"
              >
                <StyledInfoIcon />
              </FiatOnrampAvailabilityExternalLink>
            </Tooltip>
          </FiatOnrampNotAvailableText>
        )}
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
