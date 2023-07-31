import { Trans } from '@lingui/macro'
import { formatCurrencyAmount, NumberType } from '@uniswap/conedison/format'
import { useWeb3React } from '@web3-react/core'
import Column from 'components/Column'
import { ScrollBarStyles } from 'components/Common'
import Row from 'components/Row'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { getTotalEthValue } from 'nft/components/profile/list/utils'
import { useSellAsset } from 'nft/hooks'
import { formatEth, generateTweetForList, pluralize } from 'nft/utils'
import { useMemo } from 'react'
import { Twitter, X } from 'react-feather'
import styled, { css, useTheme } from 'styled-components/macro'
import { BREAKPOINTS, ThemedText } from 'theme'

import { TitleRow } from '../shared'

const SuccessImage = styled.img<{ numImages: number }>`
  width: calc(${({ numImages }) => (numImages > 1 ? (numImages > 2 ? '33%' : '50%') : '100%')} - 12px);
  border-radius: 12px;
`

const SuccessImageWrapper = styled(Row)`
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  overflow-y: scroll;
  margin-bottom: 16px;
  ${ScrollBarStyles}
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

const TweetButton = styled.a`
  background-color: ${({ theme }) => theme.accentAction};
  color: ${({ theme }) => theme.accentTextLightPrimary};
  text-decoration: none;
  ${buttonStyle}
`

const TweetRow = styled(Row)`
  justify-content: center;
  gap: 4px;
`

export const SuccessScreen = ({ overlayClick }: { overlayClick: () => void }) => {
  const theme = useTheme()
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const { chainId } = useWeb3React()
  const nativeCurrency = useNativeCurrency(chainId)

  const totalEthListingValue = useMemo(() => getTotalEthValue(sellAssets), [sellAssets])
  const parsedAmount = tryParseCurrencyAmount(totalEthListingValue.toString(), nativeCurrency)
  const usdcValue = useStablecoinValue(parsedAmount)

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
        <ThemedText.SubHeader>
          <Trans>Proceeds if sold</Trans>
        </ThemedText.SubHeader>
        <ProceedsColumn>
          <ThemedText.SubHeader>{formatEth(totalEthListingValue)} ETH</ThemedText.SubHeader>
          {usdcValue && (
            <ThemedText.BodySmall lineHeight="20px" color="textSecondary">
              {formatCurrencyAmount(usdcValue, NumberType.FiatTokenPrice)}
            </ThemedText.BodySmall>
          )}
        </ProceedsColumn>
      </Row>
      <Row justify="space-between" flexWrap="wrap">
        <ReturnButton onClick={() => window.location.reload()}>
          <Trans>Return to My NFTs</Trans>
        </ReturnButton>
        <TweetButton href={generateTweetForList(sellAssets)} target="_blank" rel="noreferrer">
          <TweetRow>
            <Twitter height={20} width={20} color={theme.accentTextLightPrimary} fill={theme.accentTextLightPrimary} />
            <Trans>Share on Twitter</Trans>
          </TweetRow>
        </TweetButton>
      </Row>
    </>
  )
}
