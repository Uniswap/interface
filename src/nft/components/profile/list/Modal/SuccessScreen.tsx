import { Trans } from '@lingui/macro'
import Row from 'components/Row'
import { useSellAsset } from 'nft/hooks'
import { pluralize } from 'nft/utils'
import { X } from 'react-feather'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

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

export const SuccessScreen = ({ overlayClick }: { overlayClick: () => void }) => {
  const sellAssets = useSellAsset((state) => state.sellAssets)
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
    </>
  )
}
