import { Trans } from '@lingui/macro'
import { formatNumber } from '@uniswap/conedison/format'
import { ButtonPrimary } from 'components/Button'
import { ButtonGray } from 'components/Button'
import Loader from 'components/Icons/LoadingSpinner'
import Row from 'components/Row'
import { AddToBagIcon } from 'nft/components/icons'
import { useBag } from 'nft/hooks'
import { useBuyAssetCallback } from 'nft/hooks/useFetchAssets'
import { GenieAsset } from 'nft/types'
import styled, { css } from 'styled-components/macro'

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

const ButtonContainer = styled(Row)`
  width: 320px;
  background-color: ${({ theme }) => theme.accentAction};
  border-radius: 16px;
  overflow: hidden;
  white-space: nowrap;
`

const ButtonSeparator = styled.div`
  height: 24px;
  width: 0px;
  border-left: 0.5px solid #f5f6fc;
`

const StyledBuyButton = styled(BaseButton)``

const AddToBagButton = styled(BaseButton)`
  width: min-content;
  flex-shrink: 0;
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
  const addAssetsToBag = useBag((state) => state.addAssetsToBag)
  const { fetchAndPurchaseSingleAsset, isLoading: isLoadingRoute } = useBuyAssetCallback()
  const price = asset.sellorders?.[0]?.price.value

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
    <ButtonContainer>
      <StyledBuyButton disabled={isLoadingRoute} onClick={() => fetchAndPurchaseSingleAsset(asset)}>
        {isLoadingRoute ? (
          <>
            <Trans>Fetching Route</Trans>
            <Loader size="24px" stroke="white" />
          </>
        ) : (
          <>
            <Trans>Buy</Trans>
            <Price>{formatNumber(price)} ETH</Price>
          </>
        )}
      </StyledBuyButton>
      <ButtonSeparator />
      <AddToBagButton onClick={() => addAssetsToBag([asset])}>
        <AddToBagIcon width="24px" height="24px" />
      </AddToBagButton>
    </ButtonContainer>
  )
}
