import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import styled from 'styled-components/macro'
import { DarkGreyCard, GreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { RowFixed, RowFlat } from 'components/Row'
import CurrencyLogo from 'components/CurrencyLogo'
import { TYPE, StyledInternalLink, CustomLightSpinner } from 'theme'
import HoverInlineText from 'components/HoverInlineText'
import { getBlockFromTimestamp, getTokenData, useEthPrice, useKibaPairData, useTopPairData } from 'state/logs/utils'
import { useCurrency } from 'hooks/Tokens'
import { AnyAsyncThunk } from '@reduxjs/toolkit/dist/matchers'
import _ from 'lodash'
import { ChevronUp, ChevronDown } from 'react-feather'
import { LoadingRows } from 'pages/Pool/styleds'
import Badge, { BadgeVariant } from 'components/Badge'
import { useWeb3React } from '@web3-react/core'
import { fetchBscTokenData, getBlocksFromTimestamps, getDeltaTimestamps, useBlocksFromTimestamps, useBnbPrices } from 'state/logs/bscUtils'
import Marquee, { Motion } from "react-marquee-slider";
import useInterval from 'hooks/useInterval'

const CardWrapper = styled(StyledInternalLink)`
  min-width: 190px;
  width:100%;
  margin-right: 16px;
  padding:3px;
  :hover {
    cursor: pointer;
    opacity: 0.6;
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
  const token = useCurrency(tokenData.id);
  const { chainId } = useWeb3React()
  return (
    <CardWrapper to={'/selective-charts/' + tokenData.id + '/' + tokenData.symbol}>
      <GreyCard padding="3px">
        <RowFixed>
          <AutoColumn gap="3px" style={{ marginLeft: '12px' }}>
            <TYPE.label fontSize="13px">

              <div style={{ display: 'flex', flexFlow: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <small><Badge style={{ marginRight: "2px" }} variant={BadgeVariant.POSITIVE_OUTLINE}>{index + 1}</Badge></small>

                <CurrencyLogo style={{ marginRight: "2px" }} currency={(chainId === 1 || !chainId) ? token : tokenData} size="20px" />
                <HoverInlineText text={chainId === 56 ? tokenData?.symbol : tokenData?.symbol?.substring(0, tokenData?.symbol?.length >= 5 ? 5 : tokenData.symbol.length)} />
                {!!tokenData?.priceChangeUSD && (
                  <>
                    {tokenData?.priceChangeUSD < 0 ? <ChevronDown color={'red'} /> : <ChevronUp color={'green'} />}
                    {parseFloat(tokenData?.priceChangeUSD).toFixed(2)}%
                  </>
                )}
              </div>
            </TYPE.label>

          </AutoColumn>
        </RowFixed>
      </GreyCard>
    </CardWrapper>
  )
}, _.isEqual)
DataCard.displayName = 'DataCard';


export default function TopTokenMovers() {
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
        kibaPair.data.pairs) {
        setHasEffectRan(true);
        const blockOne: number = blocks[0].number, blockTwo: number = blocks[1].number;
        const allTokens = await Promise.all(
          [
            ...allTokenData.data.pairs,
            ...kibaPair.data.pairs
          ].map(async (pair: any) => {
            const value = (!chainId || chainId === 1) ? await getTokenData(pair.token0.id, ethPrice, ethPriceOld, blockOne, blockTwo) as any : await fetchBscTokenData(pair.token0.id, bnbPrices?.current, bnbPrices?.oneDay, blockOne, blockTwo)
            value.chainId = chainId ?? 1;
            return value;
          })
        );
        setAllTokens(allTokens);
      }
    }
  }, [timestampsFromBlocks, hasEffectRan, chainId, kibaPair, allTokens, allTokenData])

  React.useEffect(() => {
    let cancelled = false;
    if (allTokenData.loading) return;
    if (kibaPair.loading) return;
    if (!hasEffectRan &&
      !cancelled &&
      allTokenData &&
      timestampsFromBlocks?.blocks &&
      allTokenData?.data?.pairs &&
      kibaPair?.data?.pairs &&
      ((!chainId || chainId === 1) &&
        ethPriceOld &&
        ethPrice) ||
      (chainId === 56 && bnbPrices?.current && bnbPrices?.oneDay)
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
    return [
      // slot kiba at #1 always
      allTokens.find((a: any) => a?.symbol === 'KIBA'),
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
          (a?.chainId === chainId || !chainId))]
  }, [allTokens, chainId])
  const increaseRef = useRef<HTMLDivElement>(null)
  return (
    <DarkGreyCard style={{ zIndex: 3, padding: "0px", background: 'transparent', position: 'fixed', top: 0, margin: 0 }}>
      {(allTokens.length > 0) &&
        (
          <Marquee onInit={() => { return }}
            onFinish={() => { return }}
            scatterRandomly={false}
            direction={'rtl'}
            resetAfterTries={200}
            velocity={11}
            key={'TOPMOVER'}
          >
            <></>
            <FixedContainer style={{ background: 'rgb(0 0 1 / 50%)' }} gap="xs">
              <ScrollableRow ref={increaseRef}>
                {topPriceIncrease.filter((a: any) => !a?.symbol?.includes('SCAM') && !a?.symbol?.includes('rebass')).map((entry, i) =>
                  entry ? <DataCard index={i} key={'top-card-token-' + entry.id} tokenData={entry} /> : null
                )}
              </ScrollableRow>
            </FixedContainer>
          </Marquee>
        )
      }
    </DarkGreyCard>
  )
}
