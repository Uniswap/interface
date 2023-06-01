import { Trans } from '@lingui/macro'
import { sendAnalyticsEvent, useTrace } from '@uniswap/analytics'
import { NFTEventName } from '@uniswap/analytics-events'
import { formatNumber } from '@uniswap/conedison/format'
import { useWeb3React } from '@web3-react/core'
import { useAccountDrawer } from 'components/AccountDrawer'
import { ButtonPrimary } from 'components/Button'
import { ButtonGray } from 'components/Button'
import Loader from 'components/Icons/LoadingSpinner'
import Row from 'components/Row'
import { useNftBalance } from 'graphql/data/nft/NftBalance'
import { AddToBagIcon, CondensedBagIcon } from 'nft/components/icons'
import { useBag, useProfilePageState, useSellAsset } from 'nft/hooks'
import { useBuyAssetCallback } from 'nft/hooks/useFetchAssets'
import { useIsAssetInBag } from 'nft/hooks/useIsAssetInBag'
import { GenieAsset, ProfilePageStateType } from 'nft/types'
import { MouseEvent, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { css } from 'styled-components/macro'
import { BREAKPOINTS } from 'theme'
import { colors } from 'theme/colors'
import { shallow } from 'zustand/shallow'

const ButtonStyles = css`
  padding: 16px;
  display: flex;
  flex-direction: row;
  gap: 8px;
  line-height: 24px;
  white-space: nowrap;
`

const BaseButton = styled(ButtonPrimary)`
  background: none;
  border: none;
  border-radius: 0px;

  ${ButtonStyles}
`

const ButtonSeparator = styled.div<{ shouldHide?: boolean }>`
  height: 24px;
  width: 0px;
  border-left: 0.5px solid ${colors.gray50};

  ${({ shouldHide }) => shouldHide && `display: none;`}
`

const AddToBagButton = styled(BaseButton)<{ isExpanded: boolean }>`
  width: ${({ isExpanded }) => (isExpanded ? '100%' : 'min-content')};
  transition: ${({ theme }) => theme.transition.duration.medium};
  flex-shrink: 0;
  will-change: width;
`

const StyledBuyButton = styled(BaseButton)<{ shouldHide?: boolean }>`
  min-width: 0px;
  transition: ${({ theme }) => theme.transition.duration.medium};
  will-change: width;
  overflow: hidden;

  ${({ shouldHide }) => shouldHide && `width: 0px; padding: 0px;`}
`

const ButtonContainer = styled(Row)<{ dataPage: boolean }>`
  width: 100%;
  background-color: ${({ theme }) => theme.accentAction};
  border-radius: 16px;
  overflow: hidden;
  white-space: nowrap;

  @media screen and (min-width: ${BREAKPOINTS.xs}px) {
    width: ${({ dataPage }) => (dataPage ? 'min-content' : '320px')};
  }
`

const NotAvailableButton = styled(ButtonGray)`
  width: min-content;
  border-radius: 16px;

  ${ButtonStyles}
`

const Price = styled.div`
  color: ${({ theme }) => theme.accentTextLightSecondary};
`

export const BuyButton = ({ asset, isOnDataPage }: { asset: GenieAsset; isOnDataPage?: boolean }) => {
  const { account } = useWeb3React()
  const [accountDrawerOpen, toggleWalletDrawer] = useAccountDrawer()
  const { fetchAndPurchaseSingleAsset, isLoading: isLoadingRoute } = useBuyAssetCallback()
  const [connectingToWallet, setConnectingToWallet] = useState(false)
  const [addToBagExpanded, setAddToBagExpanded] = useState(false)
  const navigate = useNavigate()
  const trace = useTrace()
  const setSellPageState = useProfilePageState((state) => state.setProfilePageState)
  const selectSellAsset = useSellAsset((state) => state.selectSellAsset)
  const resetSellAssets = useSellAsset((state) => state.reset)

  const { walletAssets } = useNftBalance(account ?? '', [], [{ address: asset.address, tokenId: asset.tokenId }], 1)
  const walletAsset = walletAssets?.[0]

  const price = asset.sellorders?.[0]?.price.value
  const ownsAsset = Boolean(walletAsset) && account?.toLowerCase() === asset.ownerAddress?.toLowerCase()

  const assetInBag = useIsAssetInBag(asset)
  const { addAssetsToBag, removeAssetsFromBag } = useBag(
    ({ addAssetsToBag, removeAssetsFromBag }) => ({
      addAssetsToBag,
      removeAssetsFromBag,
    }),
    shallow
  )

  const navigateToProfile = useCallback(() => {
    if (!walletAsset) {
      return
    }

    resetSellAssets()
    selectSellAsset(walletAsset)
    sendAnalyticsEvent(NFTEventName.NFT_SELL_ITEM_ADDED, {
      collection_address: asset.address,
      token_id: asset.tokenId,
      ...trace,
    })
    setSellPageState(ProfilePageStateType.LISTING)
    navigate('/nfts/profile')
  }, [asset.address, asset.tokenId, navigate, resetSellAssets, selectSellAsset, setSellPageState, trace, walletAsset])

  const oneClickBuyAsset = useCallback(() => {
    if (!account) {
      if (!accountDrawerOpen) {
        toggleWalletDrawer()
      }
      setConnectingToWallet(true)
      setTimeout(() => setConnectingToWallet(false), 20000)
    } else {
      fetchAndPurchaseSingleAsset(asset)
    }
  }, [account, accountDrawerOpen, asset, fetchAndPurchaseSingleAsset, toggleWalletDrawer])

  useEffect(() => {
    if (connectingToWallet && account) {
      setConnectingToWallet(false)
      fetchAndPurchaseSingleAsset(asset)
    }
  }, [connectingToWallet, account, fetchAndPurchaseSingleAsset, asset])

  if (ownsAsset) {
    return (
      <ButtonContainer dataPage={Boolean(isOnDataPage)}>
        <StyledBuyButton onClick={navigateToProfile}>
          {price ? (
            <>
              <Trans>Edit Listing</Trans>
              <Price>{formatNumber(price)} ETH</Price>
            </>
          ) : (
            <Trans>List</Trans>
          )}
        </StyledBuyButton>
      </ButtonContainer>
    )
  }

  if (!price) {
    return !isOnDataPage ? (
      <NotAvailableButton disabled>
        <Trans>Not available for purchase</Trans>
      </NotAvailableButton>
    ) : null
  }

  const secondaryButtonCta = assetInBag ? <Trans>Remove from Bag</Trans> : <Trans>Add to Bag</Trans>
  const SecondaryButtonIcon = () =>
    assetInBag ? <CondensedBagIcon width="24px" height="24px" /> : <AddToBagIcon width="24px" height="24px" />
  const secondaryButtonAction = (event: MouseEvent<HTMLButtonElement>) => {
    assetInBag ? removeAssetsFromBag([asset]) : addAssetsToBag([asset])
    event.currentTarget.blur()
  }
  const secondaryButtonExpanded = addToBagExpanded || Boolean(isOnDataPage)

  return (
    <ButtonContainer dataPage={Boolean(isOnDataPage)}>
      {!isOnDataPage && (
        <>
          <StyledBuyButton
            shouldHide={secondaryButtonExpanded}
            disabled={isLoadingRoute || connectingToWallet}
            onClick={oneClickBuyAsset}
          >
            {connectingToWallet && (
              <>
                <Trans>Connect Wallet</Trans>
                <Loader size="24px" stroke="white" />
              </>
            )}
            {isLoadingRoute && (
              <>
                <Trans>Fetching Route</Trans>
                <Loader size="24px" stroke="white" />
              </>
            )}
            {!connectingToWallet && !isLoadingRoute && (
              <>
                <Trans>Buy</Trans>
                <Price>{formatNumber(price)} ETH</Price>
              </>
            )}
          </StyledBuyButton>
          <ButtonSeparator shouldHide={addToBagExpanded} />
        </>
      )}
      <AddToBagButton
        onMouseEnter={() => setAddToBagExpanded(true)}
        onMouseLeave={() => setAddToBagExpanded(false)}
        onClick={secondaryButtonAction}
        isExpanded={secondaryButtonExpanded}
      >
        <SecondaryButtonIcon />
        {secondaryButtonExpanded && secondaryButtonCta}
      </AddToBagButton>
    </ButtonContainer>
  )
}
