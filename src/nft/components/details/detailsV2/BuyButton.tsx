import { Trans } from '@lingui/macro'
import { formatNumber } from '@uniswap/conedison/format'
import { ButtonPrimary } from 'components/Button'
import Loader from 'components/Icons/LoadingSpinner'
import { useBuyAssetCallback } from 'nft/hooks/useFetchAssets'
import { GenieAsset } from 'nft/types'
import styled from 'styled-components/macro'

import { OfferButton } from './OfferButton'
import { ButtonStyles } from './shared'

const StyledBuyButton = styled(ButtonPrimary)`
  display: flex;
  flex-direction: row;
  padding: 16px 24px;
  gap: 8px;
  line-height: 24px;
  white-space: nowrap;

  ${ButtonStyles}
`

const Price = styled.div`
  color: ${({ theme }) => theme.accentTextLightSecondary};
`

export const BuyButton = ({ asset, onDataPage }: { asset: GenieAsset; onDataPage?: boolean }) => {
  const { fetchAndPurchaseSingleAsset, isLoading: isLoadingRoute } = useBuyAssetCallback()
  const price = asset.sellorders?.[0]?.price.value

  if (!price) {
    return <OfferButton />
  }

  return (
    <>
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
      {onDataPage && <OfferButton smallVersion />}
    </>
  )
}
