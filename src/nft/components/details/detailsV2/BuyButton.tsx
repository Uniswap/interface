import { Trans } from '@lingui/macro'
import { formatNumber } from '@uniswap/conedison/format'
import { useWeb3React } from '@web3-react/core'
import { useAccountDrawer } from 'components/AccountDrawer'
import { ButtonPrimary } from 'components/Button'
import { ButtonGray } from 'components/Button'
import Loader from 'components/Icons/LoadingSpinner'
import Row from 'components/Row'
import { AddToBagIcon, CondensedBagIcon } from 'nft/components/icons'
import { useBag } from 'nft/hooks'
import { useBuyAssetCallback } from 'nft/hooks/useFetchAssets'
import { useIsAssetInBag } from 'nft/hooks/useIsAssetInBag'
import { GenieAsset } from 'nft/types'
import { MouseEvent, useCallback, useEffect, useState } from 'react'
import styled, { css } from 'styled-components/macro'
import { BREAKPOINTS } from 'theme'
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

const ButtonSeparator = styled.div<{ shouldHide: boolean }>`
  height: 24px;
  width: 0px;
  border-left: 0.5px solid #f5f6fc;

  ${({ shouldHide }) => shouldHide && `display: none;`}
`

const AddToBagButton = styled(BaseButton)<{ isExpanded: boolean }>`
  width: ${({ isExpanded }) => (isExpanded ? '100%' : 'min-content')};
  transition: ${({ theme }) => theme.transition.duration.medium};
  flex-shrink: 0;
  will-change: width;
`

const StyledBuyButton = styled(BaseButton)<{ shouldHide: boolean }>`
  min-width: 0px;
  transition: ${({ theme }) => theme.transition.duration.medium};
  will-change: width;
  overflow: hidden;

  ${({ shouldHide }) =>
    shouldHide &&
    css`
      width: 0px;
      padding: 0px;
    `}
`

const ButtonContainer = styled(Row)<{ onDataPage: boolean }>`
  width: 100%;
  background-color: ${({ theme }) => theme.accentAction};
  border-radius: 16px;
  overflow: hidden;
  white-space: nowrap;

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    width: ${({ onDataPage }) => (onDataPage ? 'min-content' : '320px')};
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

export const BuyButton = ({ asset, onDataPage }: { asset: GenieAsset; onDataPage?: boolean }) => {
  const { account } = useWeb3React()
  const [accountDrawerOpen, toggleWalletDrawer] = useAccountDrawer()
  const { fetchAndPurchaseSingleAsset, isLoading: isLoadingRoute } = useBuyAssetCallback()
  const [wishBuyAsset, setWishBuyAsset] = useState(false)
  const [addToBagExpanded, setAddToBagExpanded] = useState(false)
  const assetInBag = useIsAssetInBag(asset)
  const price = asset.sellorders?.[0]?.price.value
  const { addAssetsToBag, removeAssetsFromBag } = useBag(
    ({ addAssetsToBag, removeAssetsFromBag }) => ({
      addAssetsToBag,
      removeAssetsFromBag,
    }),
    shallow
  )

  const oneClickBuyAsset = useCallback(() => {
    if (!account) {
      if (!accountDrawerOpen) toggleWalletDrawer()
      setWishBuyAsset(true)
      setTimeout(() => setWishBuyAsset(false), 20000)
      return
    }

    fetchAndPurchaseSingleAsset(asset)
  }, [account, accountDrawerOpen, asset, fetchAndPurchaseSingleAsset, toggleWalletDrawer])

  useEffect(() => {
    if (wishBuyAsset && account) {
      setWishBuyAsset(false)
      fetchAndPurchaseSingleAsset(asset)
    }
  }, [wishBuyAsset, account, fetchAndPurchaseSingleAsset, asset])

  const secondaryButtonCta = assetInBag ? 'Remove from Bag' : 'Add to Bag'
  const SecondaryButtonIcon = () =>
    assetInBag ? <CondensedBagIcon width="24px" height="24px" /> : <AddToBagIcon width="24px" height="24px" />
  const secondaryButtonAction = (event: MouseEvent<HTMLButtonElement>) => {
    assetInBag ? removeAssetsFromBag([asset]) : addAssetsToBag([asset])
    event.currentTarget.blur()
  }

  if (!price) {
    if (onDataPage) {
      return null
    }

    return (
      <NotAvailableButton disabled>
        <Trans>Not available for purchase</Trans>
      </NotAvailableButton>
    )
  }

  return (
    <ButtonContainer onDataPage={Boolean(onDataPage)}>
      {!onDataPage && (
        <>
          <StyledBuyButton
            shouldHide={addToBagExpanded}
            disabled={isLoadingRoute || wishBuyAsset}
            onClick={() => oneClickBuyAsset()}
          >
            {wishBuyAsset && (
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
            {!wishBuyAsset && !isLoadingRoute && (
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
        isExpanded={addToBagExpanded || Boolean(onDataPage)}
      >
        <SecondaryButtonIcon />
        {(addToBagExpanded || Boolean(onDataPage)) && secondaryButtonCta}
      </AddToBagButton>
    </ButtonContainer>
  )
}
