import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import Row from 'components/Row'
import useStablecoinPrice from 'hooks/useStablecoinPrice'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { getTotalEthValue } from 'nft/components/bag/profile/utils'
import { useSellAsset } from 'nft/hooks'
import { formatEth, pluralize } from 'nft/utils'
import { useMemo } from 'react'
import { Twitter, X } from 'react-feather'
import styled, { css, useTheme } from 'styled-components/macro'
import { BREAKPOINTS, ThemedText } from 'theme'
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

const buttonStyle = css`
  width: 182px;
  cursor: pointer;
  padding: 12px 0px;
  text-align: center;
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  border-radius: 12px;
  border: none;

  &:hover {
    opacity: 0.6;
  }

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    width: 100%;
    margin-bottom: 8px;
  }
`

const ReturnButton = styled.button`
  background-color: ${({ theme }) => theme.backgroundInteractive};
  color: ${({ theme }) => theme.textPrimary};
  ${buttonStyle}
`

const TweetButton = styled.button`
  background-color: ${({ theme }) => theme.accentAction};
  color: ${({ theme }) => theme.textPrimary};
  ${buttonStyle}
`

const TweetRow = styled(Row)`
  justify-content: center;
  gap: 4px;
`

export const SuccessScreen = ({ overlayClick }: { overlayClick: () => void }) => {
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const nativeCurrency = useNativeCurrency()
  const nativeCurrencyPrice = useStablecoinPrice(nativeCurrency ?? undefined)
  const theme = useTheme()

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
      <Row justify="space-between" align="flex-start" marginBottom="16px">
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
      <Row justify="space-between" flexWrap="wrap">
        <ReturnButton onClick={() => window.location.reload()}>
          <Trans>Return to My NFTs</Trans>
        </ReturnButton>
        <TweetButton>
          <TweetRow>
            <Twitter height={20} width={20} color={theme.textPrimary} fill={theme.textPrimary} />
            <Trans>Share on Twitter</Trans>
          </TweetRow>
        </TweetButton>
      </Row>
    </>
  )
}
