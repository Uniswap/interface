import Badge, { BadgeVariant } from 'components/Badge'
import { TrendingDown as ChevronDown, TrendingUp as ChevronUp } from 'react-feather'
import { DarkGreyCard, GreyCard } from 'components/Card'
import React, { useCallback, useMemo } from 'react'
import { StyledInternalLink, TYPE } from 'theme'
import { fetchBscTokenData, getDeltaTimestamps, useBlocksFromTimestamps, useBnbPrices } from 'state/logs/bscUtils'
import { getTokenData, useEthPrice, useKibaPairData, useTopPairData } from 'state/logs/utils'

import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import HoverInlineText from 'components/HoverInlineText'
import Marquee from "react-fast-marquee";
import { RowFixed } from 'components/Row'
import _ from 'lodash'
import cultureTokens from '../../../src/trending.json'
import styled from 'styled-components/macro'
import { useIsDarkMode } from 'state/user/hooks'
import useTheme from 'hooks/useTheme'
import { useToken } from 'hooks/Tokens'
import { useWeb3React } from '@web3-react/core'

const CardWrapper = styled(StyledInternalLink)`
  min-width: 190px;
  width:100%;
  padding: 6px;
  :hover {
    cursor: pointer;
    opacity: 0.6;
    text-decoration: none;
  }
`

type TopMover = {
  id: number,
  name: string,
  symbol: string,
  slug: string,
  num_market_pairs: number,
  date_added: string,
  tags: string[],
  max_supply: number,
  circulating_supply: number,
  total_supply: number,
  platform: {
    id: number,
    name: string,
    symbol: string,
    slug: string,
    token_address: string,
  },
  is_active: number,
  cmc_rank: number,
  is_fiat: number,
  last_updated: string,
  quote: {
    USD:
    {
      price: number,
      volume_24h: number,
      volume_change_24h: number,
      percent_change_1h: number,
      percent_change_24h: number,
      percent_change_7d: number,
      percent_change_30d: number,
      percent_change_60d: number,
      percent_change_90d: number,
      market_cap: number,
      market_cap_dominance: number,
      fully_diluted_market_cap: string,
      last_updated: string
    }
  }
}

export const FixedContainer = styled(AutoColumn)``

export const ScrollableRow = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  overflow-x: auto;
  white-space: nowrap;
  ::-webkit-scrollbar {
    display: none;
  }
`

const DataCard = React.memo(({ tokenData, index }: { tokenData: any, index: number }) => {
  const token = useToken(tokenData?.id?.toLowerCase());
  const { chainId } = useWeb3React()
  const theme = useTheme()
  const darkMode = useIsDarkMode()
  const network = chainId == 1 ? 'ethereum' : chainId == 56 ? 'bsc' : 'ethereum'
  const route = tokenData?.pairAddress ?
    '/selective-charts/' + network + '/' + tokenData?.pairAddress :
    '/selective-charts/' + tokenData?.id + '/' + tokenData?.symbol + '/' + tokenData?.name + '/' + tokenData?.decimals

  return !tokenData?.id ? null : (
    <CardWrapper to={route}>
      <GreyCard padding="3px">
        <RowFixed>
          <AutoColumn gap="3px" style={{ marginLeft: '3px' }}>
            <TYPE.small color={darkMode ? 'white' : 'text1'} fontSize="12.5px">
              <div style={{ display: 'flex', flexFlow: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <small><Badge style={{ marginRight: "6px" }} variant={BadgeVariant.POSITIVE_OUTLINE}>{index + 1}</Badge></small>
                <CurrencyLogo style={{ marginRight: "2px" }} currency={(chainId === 1 || !chainId) ? token : tokenData} size="20px" />
                <HoverInlineText text={chainId === 56 ? tokenData?.symbol : tokenData?.symbol?.substring(0, tokenData?.symbol?.length >= 7 ? 7 : tokenData.symbol.length)} />
                {!!tokenData?.priceChangeUSD && (
                  <>
                    {tokenData?.priceChangeUSD < 0 ?
                      <ChevronDown color={'red'} />
                      : <ChevronUp color={'green'} />
                    }&nbsp;
                    {parseFloat(tokenData?.priceChangeUSD).toFixed(2)}%
                  </>
                )}
              </div>
            </TYPE.small>
          </AutoColumn>
        </RowFixed>
      </GreyCard>
    </CardWrapper>
  )
})
DataCard.displayName = 'DataCard';


const _TopTokenMovers = React.memo(() => {
  const allTokenData = useTopPairData()
  const { chainId } = useWeb3React()
  const [allTokens, setAllTokens] = React.useState<any>([])
  const [ethPrice, ethPriceOld] = useEthPrice()
  const bnbPrices = useBnbPrices()
  const [t24, t48, ,] = getDeltaTimestamps()
  const timestampsFromBlocks = useBlocksFromTimestamps([t24, t48])
  const kibaPair = useKibaPairData()
  const [hasEffectRan, setHasEffectRan] = React.useState(false);
  React.useEffect(() => {
    //clear out the tokens for refetch on network switch
    setHasEffectRan(false)
    setAllTokens([])
  }, [chainId])
  const fn = useCallback(async (isIntervalled: boolean) => {
    // validate the required parameters are all met before initializing a fetch
    const { blocks } = timestampsFromBlocks;
    const shouldEffectRun = !hasEffectRan || isIntervalled;
    if (shouldEffectRun &&
      blocks &&
      blocks[0] &&
      blocks[1]) {
      if (allTokenData &&
        allTokenData.data &&
        kibaPair.data &&
        allTokenData.data.pairs &&
        kibaPair.data.pairs &&
        ((chainId === 1 &&
          ethPrice &&
          ethPriceOld ||
          chainId === 56 &&
          bnbPrices &&
          bnbPrices?.current &&
          bnbPrices?.oneDay)
          ||
          !chainId)) {
        setHasEffectRan(true);
        const blockOne: number = blocks[0].number, blockTwo: number = blocks[1].number;
        const allTokens = await Promise.all(
          [
            ...kibaPair.data.pairs,
            ...allTokenData.data.pairs,
            ...cultureTokens.map((token) => ({
              token0: {
                id: token.address
              }
            })),
            {
              token0: {
                id: `0x79a06acb8bdd138beeecce0f1605971f3ac7c09b`
              }
            }
          ].map(async (pair: any) => {
            const value = (!chainId || chainId === 1) ? await getTokenData(pair.token0.id, ethPrice, ethPriceOld, blockOne, blockTwo) as any : await fetchBscTokenData(pair.token0.id, bnbPrices?.current, bnbPrices?.oneDay, blockOne, blockTwo)
            if (value) {
              value.chainId = chainId ? chainId : 1;
              value.pairAddress = pair.id;
            }
            return value;
          })
        );
        setAllTokens(allTokens);
      }
    }
  }, [timestampsFromBlocks, ethPrice, ethPriceOld, bnbPrices, hasEffectRan, chainId, kibaPair, allTokens, allTokenData])

  let cancelled = false;

  React.useEffect(() => {
    if (allTokenData.loading) return;
    if (kibaPair.loading) return;
    if (!hasEffectRan &&
      !cancelled &&
      timestampsFromBlocks?.blocks &&
      allTokenData?.data?.pairs &&
      kibaPair?.data?.pairs &&
      (((!chainId || chainId === 1) &&
        ethPriceOld &&
        ethPrice) ||
        (chainId === 56 && bnbPrices?.current && bnbPrices?.oneDay))
    ) {
      fn(false)
    }
    return () => { cancelled = true; }

  },
    [
      hasEffectRan,
      allTokenData,
      ethPrice,
      ethPriceOld,
      bnbPrices,
      kibaPair,
      timestampsFromBlocks,
      chainId
    ])

  const topPriceIncrease = useMemo(() => {
    const ourTokens = [
      ...allTokens.filter((a: any) => ["kiba"].includes(a?.symbol?.toLowerCase()) || a?.name?.toLowerCase() === 'kiba inu'),
      ...allTokens.filter((a: any) => cultureTokens.map(a => a?.address?.toLowerCase()).includes(a?.id?.toLowerCase()) || cultureTokens.map(b => b?.name?.toLowerCase()).includes(a?.name?.toLowerCase())),
    ];
    return _.uniqBy([
      // slot kiba and any paying / partnerships at #1 always
      ...ourTokens,
      ..._.uniqBy(allTokens, (i: any) => {
        return i?.id
      }).sort((a: any, b: any) => {
        return a && b ?
          a?.priceChangeUSD && b?.priceChangeUSD ?
            (Math.abs(a?.priceChangeUSD) > Math.abs(b?.priceChangeUSD) ? -1 : 1) :
            a.tradeVolumeUSD > b.tradeVolumeUSD ? -1 : 1
          : -1
      })
        .slice(0, 12)
        .filter((
          a: {
            symbol: string;
            chainId?: number
          }) => !!a?.symbol && a?.symbol !== 'KIBA' &&
          (a?.chainId === chainId || !chainId))], a => a.symbol)
  }, [allTokens, chainId])

  const mappedTokens = topPriceIncrease.filter((a: any) => !a?.symbol?.includes('SCAM') && !a?.symbol?.includes('rebass'));
  return (
    <DarkGreyCard style={{
      marginBottom: 10,
      zIndex: 3,
      padding: "0",
      top: 0,
      margin: 0
    }}>
      {(allTokens.length > 0) &&
        (
          <Marquee gradient={false} pauseOnHover>
            <React.Fragment />
            <FixedContainer>
              <ScrollableRow style={{ padding: "4px 50px 4px 0" }}>
                {mappedTokens.map((entry, i) =>
                  entry ? <DataCard index={i} key={`${i}.${entry.symbol}.${entry.address}`} tokenData={entry} /> : null
                )}
              </ScrollableRow>
            </FixedContainer>
          </Marquee>
        )
      }
    </DarkGreyCard>
  )
}, () => true)
_TopTokenMovers.displayName = 'topMovers'
export const TopTokenMovers = _TopTokenMovers
