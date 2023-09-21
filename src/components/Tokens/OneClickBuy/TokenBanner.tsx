import { Trans } from '@lingui/macro'
import { NativeCurrency, Token } from '@uniswap/sdk-core'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Row from 'components/Row'
import { QueryToken } from 'graphql/data/Token'
import { TokenPriceQuery } from 'graphql/data/TokenPrice'
import { useImageColor } from 'hooks/useImageColor'
import { Text } from 'rebass'
import styled, { useTheme } from 'styled-components'
import { useFormatter } from 'utils/formatNumbers'

import { usePriceHistory } from '../TokenDetails/ChartSection'
import { calculateDelta, DeltaArrow, DeltaText, formatDelta } from '../TokenDetails/Delta'

const Container = styled.div<{ logo?: string; color: string }>`
  width: 434px;
  height: 176px;
  padding: 16px;
  background-image: linear-gradient(to bottom, ${({ theme }) => theme.background}, ${({ color }) => color}), url(${({
  logo,
}) => (logo ? logo : undefined)}});
  background-size: cover;
  backgrasync ound-position: center center;
  background-repeat: no-repeat;
  background-color: transparent;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
`
const BannerText = styled(Text)`
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
`
const StyledPrice = styled.span`
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
`

export function TokenBanner({
  token,
  tokenPriceQuery,
  tokenLogoUrl,
}: {
  token: NativeCurrency | Token | QueryToken | null
  tokenPriceQuery: TokenPriceQuery
  tokenLogoUrl?: string
}) {
  const DATA_EMPTY = { value: 0, timestamp: 0 }
  const prices = usePriceHistory(tokenPriceQuery)
  const startingPrice = prices?.[0] ?? DATA_EMPTY
  const endingPrice = prices?.[prices.length - 1] ?? DATA_EMPTY
  const delta = calculateDelta(startingPrice.value, endingPrice.value)
  const formattedDelta = formatDelta(delta)
  const color = useImageColor(tokenLogoUrl)
  const { formatFiatPrice } = useFormatter()
  const theme = useTheme()

  return (
    <Container logo={tokenLogoUrl} color={`rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.7)`}>
      <Row justify="center">
        <CurrencyLogo currency={token} size="32px" hideL2Icon={false} />
      </Row>
      <Row justify="center">
        <BannerText color={theme.neutral1} paddingTop="12px">
          <Trans>{token?.name ?? 'Name not found'}</Trans>
        </BannerText>
      </Row>
      <Row justify="center">
        <BannerText color={theme.neutral2}>
          <Trans>{token?.symbol ?? 'Symbol not found'}</Trans>
        </BannerText>
      </Row>
      <Row justify="center">
        <StyledPrice>{formatFiatPrice({ price: endingPrice.value })}</StyledPrice>
        <DeltaArrow delta={delta} />
        <DeltaText delta={delta}>{formattedDelta}</DeltaText>
      </Row>
    </Container>
  )
}
