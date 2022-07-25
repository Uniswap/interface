import React, { CSSProperties, useMemo } from 'react'
import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'
import { useActiveWeb3React } from 'hooks'
import { Trans } from '@lingui/macro'
import CurrencyLogo from 'components/CurrencyLogo'
import { ExternalLink } from 'theme'
import styled, { keyframes } from 'styled-components'
import DiscoverIcon from 'components/Icons/DiscoverIcon'
import useGetTrendingSoonTokenId from 'pages/TrueSight/hooks/useGetTrendingSoonTokenId'
import useTheme from 'hooks/useTheme'
import { rgba } from 'polished'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { Flex } from 'rebass'
import { Field } from '../../state/swap/actions'
import { NETWORKS_INFO } from 'constants/networks'

const TrendingSoonTokenBanner = ({
  currencies,
  style,
}: {
  currencies: { [field in Field]?: Currency }
  style?: CSSProperties
}) => {
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()
  const { mixpanelHandler } = useMixpanel()

  const token0 = currencies[Field.INPUT]?.wrapped
  const token1 = currencies[Field.OUTPUT]?.wrapped
  const trendingToken0Id = useGetTrendingSoonTokenId(token0)
  const trendingToken1Id = useGetTrendingSoonTokenId(token1)
  const trendingSoonCurrency = useMemo(
    () => (trendingToken0Id ? currencies[Field.INPUT] : trendingToken1Id ? currencies[Field.OUTPUT] : undefined),
    [currencies, trendingToken0Id, trendingToken1Id],
  )

  if (trendingSoonCurrency === undefined) return null

  const currencySymbol =
    trendingSoonCurrency instanceof Token
      ? trendingSoonCurrency.symbol
      : NETWORKS_INFO[chainId || ChainId.MAINNET].nativeToken.name

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

const fadeIn = keyframes`
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
`

const Container = styled.div`
  background: ${({ theme }) => rgba(theme.primary, 0.25)};
  border-radius: 999px;
  padding: 8px 12px;
  display: grid;
  grid-template-columns: auto 1fr;
  row-gap: 4px;
  column-gap: 8px;
  animation: ${fadeIn} 0.3s linear;
`

const DiscoverIconWrapper = styled.div`
  place-self: center;
`

const BannerText = styled.div`
  //display: flex;
  //align-items: center;
  font-size: 12px;

  //> * {
  //  margin-right: 4px;
  //}
`

export default TrendingSoonTokenBanner
