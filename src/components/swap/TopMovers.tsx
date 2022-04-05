import React, { useMemo, useRef, useState, useEffect } from 'react'
import styled from 'styled-components/macro'
import { DarkGreyCard, GreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { RowFixed, RowFlat } from 'components/Row'
import CurrencyLogo from 'components/CurrencyLogo'
import { TYPE, StyledInternalLink } from 'theme'
import HoverInlineText from 'components/HoverInlineText'
import { getTokenData, useEthPrice, useTopPairData } from 'state/logs/utils'
import { useCurrency } from 'hooks/Tokens'
import { AnyAsyncThunk } from '@reduxjs/toolkit/dist/matchers'
import _ from 'lodash'
import {ChevronUp, ChevronDown} from 'react-feather'
import { LoadingRows } from 'pages/Pool/styleds'
import Badge, { BadgeVariant } from 'components/Badge'
import { useWeb3React } from '@web3-react/core'
import { fetchBscTokenData, useBnbPrices } from 'state/logs/bscUtils'
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

const FixedContainer = styled(AutoColumn)``

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
    const token =useCurrency(tokenData.id);
    const {chainId } = useWeb3React()
  return (
    <CardWrapper to={ '/selective-charts/' + tokenData.id + '/' + tokenData.symbol}>
      <GreyCard  padding="3px">
        <RowFixed>
          <AutoColumn gap="3px" style={{ marginLeft: '12px' }}>
            <TYPE.label fontSize="13px">

              <div style={{display:'flex', flexFlow:'row', alignItems:'center', justifyContent:'space-between'}}>
              <small><Badge style={{marginRight :"2px"}} variant={BadgeVariant.POSITIVE_OUTLINE}>{index + 1}</Badge></small>

              <CurrencyLogo style={{marginRight :"2px"}} currency={chainId === 1 ? token as any : tokenData as any} size="20px" />
              <HoverInlineText text={chainId === 56 ? tokenData?.symbol : tokenData?.symbol?.substring(0, tokenData?.symbol?.length >= 5 ? 5 : tokenData.symbol.length)} />
             {!!tokenData?.priceChangeUSD && <>{tokenData?.priceChangeUSD < 0 ? <ChevronDown color={'red'} /> : <ChevronUp color={'green'} />}
              {parseFloat(tokenData?.priceChangeUSD).toFixed(2)}%</>}
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
  const {chainId } = useWeb3React()
  const [allTokens ,setAllTokens] = React.useState<any[]>([])
  const [ethPrice, ethPriceOld] = useEthPrice()
  const bnbPrices = useBnbPrices()
  React.useEffect(() => {
      const fn = async () => {
    if (allTokenData && allTokenData.data && !allTokens.length) {
        const allTokens = await Promise.all(allTokenData.data.pairs.map(async (pair:any) => {
            const value = chainId === 1 ?  await getTokenData(pair.token0.id, ethPrice, ethPriceOld) as any : pair.token0
            return value;
        }))
        setAllTokens(allTokens as any[]);
    }
}   
fn();
  }, [allTokenData, chainId])
  const topPriceIncrease = useMemo(() => {
    return [allTokens.find(a => a?.symbol === 'KIBA'),
    ..._.uniqBy(allTokens, i => {
         return i?.id
    })
      .sort((a, b) => {
        return a && b ? a?.priceChangeUSD && b?.priceChangeUSD ? (Math.abs(a?.priceChangeUSD) > Math.abs(b?.priceChangeUSD) ? -1 : 1) : a.tradeVolumeUSD > b.tradeVolumeUSD ? -1 : 1 : -1
      })
      .slice(0, 20)
      .filter((a:any) =>!!a?.symbol && a?.symbol !== 'KIBA')]

  }, [allTokens])
  const increaseRef = useRef<HTMLDivElement>(null)
  // const [pauseAnimation, setPauseAnimation] = useState(false)
  // const [resetInterval, setClearInterval] = useState<() => void | undefined>()

  useEffect(() => {
      let leftValue = 0;
      let operation = 'plus';
      if (increaseRef.current) {
      setInterval(() => {
        if (increaseRef.current) {
          const newLeftValue = increaseRef.current.scrollLeft;
          if (newLeftValue === leftValue && newLeftValue > 0) operation = 'minus';
          if (newLeftValue === leftValue && newLeftValue <= 0) operation = 'plus';
          leftValue = increaseRef.current.scrollLeft;
          const operator = operation === 'plus' ? leftValue + 1 : leftValue - 1;
          increaseRef.current.scrollTo(newLeftValue === 0 ? operator : operator, 0)
        }
      }, 35)
    }
  }, [increaseRef.current])

  // function handleHover() {
  //   if (resetInterval) {
  //     resetInterval()
  //   }
  //   setPauseAnimation(true)
  // }

  return (
    <DarkGreyCard style={{ zIndex: 3, padding: "0px", background:'transparent',position:'fixed', top:0, margin:0 }}>
      {(allTokens.length > 0 )&& 
    <FixedContainer style={{background:'rgb(0 0 1 / 50%)'}} gap="xs">
      <ScrollableRow ref={increaseRef}>
        {topPriceIncrease.filter((a:any) => !a?.symbol?.includes('SCAM') && !a?.symbol?.includes('rebass')).map((entry, i) =>
          entry ? <DataCard index={i} key={'top-card-token-' + entry.id} tokenData={entry} /> : null
        )}
      </ScrollableRow>
    </FixedContainer>}

    </DarkGreyCard>
  )
}
