import { Trans } from '@lingui/macro'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { getConnection } from 'connection/utils'
import { getChainInfoOrDefault } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import { BaseVariant } from 'featureFlags'
import { useFiatOnrampFlag } from 'featureFlags/flags/fiatOnramp'
import useCopyClipboard from 'hooks/useCopyClipboard'
import useStablecoinPrice from 'hooks/useStablecoinPrice'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { useProfilePageState, useSellAsset, useWalletCollections } from 'nft/hooks'
import { useIsNftClaimAvailable } from 'nft/hooks/useIsNftClaimAvailable'
import { ProfilePageStateType } from 'nft/types'
import { useCallback, useMemo } from 'react'
import { Copy, CreditCard, ExternalLink, Power } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import { useCurrencyBalanceString } from 'state/connection/hooks'
import { useAppDispatch } from 'state/hooks'
import { updateSelectedWallet } from 'state/user/reducer'
import styled, { css } from 'styled-components/macro'
import { ThemedText } from 'theme'

import { shortenAddress } from '../../nft/utils/address'
import { useCloseModal, useToggleModal } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'
import { useUserHasAvailableClaim, useUserUnclaimedAmount } from '../../state/claim/hooks'
import { ButtonEmphasis, ButtonSize, ThemeButton } from '../Button'
import StatusIcon from '../Identicon/StatusIcon'
import IconButton, { IconHoverText } from './IconButton'

const BuyCryptoButton = styled(ThemeButton)`
  margin-top: 12px;
`

const WalletButton = styled(ThemeButton)`
  border-radius: 12px;
  padding-top: 10px;
  padding-bottom: 10px;
  margin-top: 12px;
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

const FlexContainer = styled.div`
  display: flex;
`

const StatusWrapper = styled.div`
  display: inline-block;
  margin-top: 4px;
  width: 70%;
`

const TruncatedTextStyle = css`
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`

const AccountNamesWrapper = styled.div`
  ${TruncatedTextStyle}
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
  padding: 16px 0;
`

const HeaderWrapper = styled.div`
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
`

const AuthenticatedHeaderWrapper = styled.div`
  padding: 0 16px;
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
  const navigate = useNavigate()
  const closeModal = useCloseModal(ApplicationModal.WALLET_DROPDOWN)
  const fiatOnrampFlag = useFiatOnrampFlag()
  const setSellPageState = useProfilePageState((state) => state.setProfilePageState)
  const resetSellAssets = useSellAsset((state) => state.reset)
  const clearCollectionFilters = useWalletCollections((state) => state.clearCollectionFilters)
  const isClaimAvailable = useIsNftClaimAvailable((state) => state.isClaimAvailable)

  const unclaimedAmount: CurrencyAmount<Token> | undefined = useUserUnclaimedAmount(account)
  const isUnclaimed = useUserHasAvailableClaim(account)
  const connectionType = getConnection(connector).type
  const nativeCurrency = useNativeCurrency()
  const nativeCurrencyPrice = useStablecoinPrice(nativeCurrency ?? undefined) || 0
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
    const price = parseFloat(nativeCurrencyPrice.toFixed(5))
    const balance = parseFloat(balanceString || '0')
    return price * balance
  }, [balanceString, nativeCurrencyPrice])

  const navigateToProfile = () => {
    resetSellAssets()
    setSellPageState(ProfilePageStateType.VIEWING)
    clearCollectionFilters()
    navigate('/nfts/profile')
    closeModal()
  }

  return (
    <AuthenticatedHeaderWrapper>
      <HeaderWrapper>
        <StatusWrapper>
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
        </StatusWrapper>
        <IconContainer>
          <IconButton onClick={copy} Icon={Copy}>
            {isCopied ? <Trans>Copied!</Trans> : <Trans>Copy</Trans>}
          </IconButton>
          <IconButton href={`${explorer}address/${account}`} target="_blank" Icon={ExternalLink}>
            <Trans>Explore</Trans>
          </IconButton>
          <IconButton data-testid="wallet-disconnect" onClick={disconnect} Icon={Power}>
            <Trans>Disconnect</Trans>
          </IconButton>
        </IconContainer>
      </HeaderWrapper>
      <Column>
        <BalanceWrapper>
          <Text fontSize={36} fontWeight={400}>
            {balanceString} {nativeCurrencySymbol}
          </Text>
          <USDText>${amountUSD.toFixed(2)} USD</USDText>
        </BalanceWrapper>
        <ProfileButton
          data-testid="nft-view-self-nfts"
          onClick={navigateToProfile}
          size={ButtonSize.medium}
          emphasis={ButtonEmphasis.medium}
        >
          <Trans>View and sell NFTs</Trans>
        </ProfileButton>
        {fiatOnrampFlag === BaseVariant.Enabled && (
          <BuyCryptoButton size={ButtonSize.medium} emphasis={ButtonEmphasis.medium} onClick={openNftModal}>
            <CreditCard /> <Trans>Buy crypto</Trans>
          </BuyCryptoButton>
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
    </AuthenticatedHeaderWrapper>
  )
}

export default AuthenticatedHeader
