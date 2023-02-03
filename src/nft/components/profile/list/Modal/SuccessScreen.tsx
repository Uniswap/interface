import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import Row from 'components/Row'
import useStablecoinPrice from 'hooks/useStablecoinPrice'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { getTotalEthValue } from 'nft/components/bag/profile/utils'
import { useSellAsset } from 'nft/hooks'
import { formatEth, pluralize } from 'nft/utils'
import { useMemo } from 'react'
import { X } from 'react-feather'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { formatDollar, priceToPreciseFloat } from 'utils/formatNumbers'

import { TitleRow } from '../shared'

const SuccessImage = styled.img<{ numImages: number }>`
  width: calc(${({ numImages }) => (numImages > 1 ? (numImages > 2 ? '33%' : '50%') : '100%')} - 16px);
  border-radius: 12px;
`

const SuccessImageWrapper = styled(Row)`
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  overflow-y: scroll;
  margin-bottom: 16px;
`

const ProceedsColumn = styled(Column)`
  text-align: right;
`

export const SuccessScreen = ({ overlayClick }: { overlayClick: () => void }) => {
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const nativeCurrency = useNativeCurrency()
  const nativeCurrencyPrice = useStablecoinPrice(nativeCurrency ?? undefined)

  const totalEthListingValue = useMemo(() => getTotalEthValue(sellAssets), [sellAssets])

  return (
    <>
      <TitleRow>
        <ThemedText.HeadlineSmall lineHeight="28px">
          <Trans>Successfully listed</Trans>&nbsp;{sellAssets.length > 1 ? ` ${sellAssets.length} ` : ''}
          NFT{pluralize(sellAssets.length)}!
        </ThemedText.HeadlineSmall>
        <X size={24} cursor="pointer" onClick={overlayClick} />
      </TitleRow>
      <SuccessImageWrapper>
        {sellAssets.map((asset) => (
          <SuccessImage
            src={asset.imageUrl}
            key={asset?.asset_contract?.address ?? '' + asset?.tokenId}
            numImages={sellAssets.length}
          />
        ))}
      </SuccessImageWrapper>
      <Row justify="space-between" align="flex-start">
        <ThemedText.SubHeader lineHeight="24px">
          <Trans>Proceeds if sold</Trans>
        </ThemedText.SubHeader>
        <ProceedsColumn>
          <ThemedText.SubHeader lineHeight="24px">{formatEth(totalEthListingValue)} ETH</ThemedText.SubHeader>
          {nativeCurrencyPrice && (
            <ThemedText.BodySmall lineHeight="20px" color="textSecondary">
              {formatDollar({
                num: priceToPreciseFloat(nativeCurrencyPrice) ?? 0 * totalEthListingValue,
                isPrice: true,
              })}
            </ThemedText.BodySmall>
          )}
        </ProceedsColumn>
      </Row>
    </>
  )
}
