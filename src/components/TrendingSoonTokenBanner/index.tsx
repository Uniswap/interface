import { Currency, Token, WETH } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { CSSProperties, memo, useMemo } from 'react'
import { Flex } from 'rebass'
import styled from 'styled-components'

import CurrencyLogo from 'components/CurrencyLogo'
import DiscoverIcon from 'components/Icons/DiscoverIcon'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import useGetTrendingSoonTokenId from 'pages/TrueSight/hooks/useGetTrendingSoonTokenId'
import { ExternalLink } from 'theme'
import { FadeIn } from 'utils/keyframes'

const TrendingSoonTokenBanner = ({
  currencyIn,
  currencyOut,
  style,
}: {
  style?: CSSProperties
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
}) => {
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()
  const { mixpanelHandler } = useMixpanel()

  const token0 = currencyIn?.wrapped
  const token1 = currencyOut?.wrapped
  const trendingToken0Id = useGetTrendingSoonTokenId(token0)
  const trendingToken1Id = useGetTrendingSoonTokenId(token1)
  const trendingSoonCurrency = useMemo(
    () => (trendingToken0Id ? currencyIn : trendingToken1Id ? currencyOut : undefined),
    [currencyIn, currencyOut, trendingToken0Id, trendingToken1Id],
  )

  if (trendingSoonCurrency === undefined) return null

  const currencySymbol = trendingSoonCurrency instanceof Token ? trendingSoonCurrency.symbol : WETH[chainId].name

  return (
    <Container style={style}>
      <DiscoverIconWrapper>
        <DiscoverIcon size={16} color={theme.primary} />
      </DiscoverIconWrapper>
      <Flex alignItems="center">
        <CurrencyLogo currency={trendingSoonCurrency} size="16px" style={{ marginRight: '4px' }} />
        <BannerText>
          {currencySymbol} <Trans>could be trending very soon!</Trans> <Trans>View</Trans>{' '}
          <ExternalLink
            href={
              window.location.origin + '/discover?tab=trending_soon&token_id=' + (trendingToken0Id ?? trendingToken1Id)
            }
            target="_blank"
            onClickCapture={() => {
              mixpanelHandler(MIXPANEL_TYPE.DISCOVER_SWAP_SEE_HERE_CLICKED, { trending_token: currencySymbol })
            }}
          >
            <Trans>here</Trans>
          </ExternalLink>
        </BannerText>
      </Flex>
    </Container>
  )
}

const Container = styled.div`
  background: ${({ theme }) => rgba(theme.primary, 0.25)};
  border-radius: 999px;
  padding: 8px 12px;
  display: grid;
  grid-template-columns: auto 1fr;
  row-gap: 4px;
  column-gap: 8px;
  animation: ${FadeIn} 0.3s linear;
`

const DiscoverIconWrapper = styled.div`
  place-self: center;
`

const BannerText = styled.div`
  font-size: 12px;
`

export default memo(TrendingSoonTokenBanner)
