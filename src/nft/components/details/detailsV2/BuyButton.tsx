import { Trans } from '@lingui/macro'
import { formatNumber } from '@uniswap/conedison/format'
import { ButtonGray, ButtonPrimary } from 'components/Button'
import Loader from 'components/Icons/LoadingSpinner'
import Row from 'components/Row'
import { useBuyAssetCallback } from 'nft/hooks/useFetchAssets'
import { GenieAsset } from 'nft/types'
import styled, { css } from 'styled-components/macro'

const ButtonStyles = css`
  width: min-content;
  flex-shrink: 0;
  border-radius: 16px;
`

const ButtonContainers = styled(Row)`
  padding: 16px 24px;
  gap: 8px;
  line-height: 24px;
  white-space: nowrap;
`

const StyledBuyButton = styled(ButtonPrimary)`
  display: flex;
  flex-direction: row;
  padding: 16px 24px;
  gap: 8px;
  line-height: 24px;
  white-space: nowrap;

  ${ButtonStyles}
`

const NotAvailableButton = styled(ButtonGray)`
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
  )
}
