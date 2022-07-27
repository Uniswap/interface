import React, { useRef } from 'react'
import styled from 'styled-components'
import { Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'
import { Currency } from '@kyberswap/ks-sdk-core'
import { isMobile } from 'react-device-detect'
import { BarChart2, DollarSign, Repeat } from 'react-feather'

import Loader from 'components/Loader'
import CurrencyLogo from 'components/CurrencyLogo'
import { TokenInfo } from 'hooks/useTokenInfo'
import useTheme from 'hooks/useTheme'
import { formatDollarAmount } from 'utils/numbers'
import { formattedNum } from 'utils'

import BlockWrapper from './BlockWrapper'

const NOT_AVAILABLE = '--'

const InfoRow = styled.div`
  flex: 0 0 32%;

  display: flex;
  flex-direction: column;
  row-gap: 4px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    border: none;
    padding: 20px 0px;
`}
`

const InfoRowValue = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 16px;
  font-weight: 500;
  line-height: 20px;
`

const InfoRowLabel = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  font-weight: 500;
  line-height: 24px;
`

const AboutText = styled.h2`
  color: ${({ theme }) => theme.text};
  font-size: 20px;
  font-weight: 500;
  margin: 0;
`

/**
 * replace a tag, script tag.    the others tags will remain.
 * @param text
 * @returns
 */
function replaceHtml(text: string) {
  if (!text) return ''
  return text
    .replace(/\u200B/g, '') // remove zero width space
    .replace(/<a[^>]*>/g, '') // replace a tag
    .replace(/<\/a>/g, '') // replace a close tag
    .replace(/<.*?script.*?>.*?<\/.*?script.*?>/gim, '') // replace script tag
}

/**
 * Tether (USDT) => Tether
 * @param text
 * @returns
 */
function formatString(text: string | undefined) {
  return text ? text.replace(/\s\(.*\)/i, '') : ''
}

const SwapInstruction = styled.div`
  margin-top: 16px;
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  font-weight: 500;
  line-height: 24px;
`

export function HowToSwap({
  fromCurrency,
  toCurrency,
  fromCurrencyInfo,
  toCurrencyInfo,
  expandedOnMount,
}: {
  fromCurrency: Currency | undefined
  toCurrency: Currency | undefined
  fromCurrencyInfo: TokenInfo
  toCurrencyInfo: TokenInfo
  expandedOnMount?: boolean
}) {
  const theme = useTheme()

  if (!fromCurrency || !toCurrency || !fromCurrencyInfo || !toCurrencyInfo) return null
  const symbol1 = fromCurrency.symbol
  const symbol2 = toCurrency.symbol
  const name1 = fromCurrency.name
  const name2 = toCurrency.name

  const fromName = formatString(fromCurrencyInfo.name || name1)
  const toName = formatString(toCurrencyInfo.name || name2)

  return (
    <BlockWrapper
      expandedOnMount={expandedOnMount}
      header={
        <Text
          as="h2"
          sx={{
            color: theme.text,
            fontSize: '20px',
            fontWeight: 500,
          }}
        >
          How to swap {symbol1} to {symbol2}?
        </Text>
      }
    >
      <SwapInstruction>
        <Text as="span">
          {fromName} ({symbol1}) can be exchanged to {toName} ({symbol1} to {symbol2}) on KyberSwap, a cryptocurrency
          decentralized exchange. By using KyberSwap, users can trade {symbol1} to {symbol2} on networks at the best
          rates, and earn more with your {symbol1} token without needing to check rates across multiple platforms.
        </Text>
      </SwapInstruction>
    </BlockWrapper>
  )
}

const PriceLabel = () => {
  const theme = useTheme()
  return (
    <Flex
      alignItems={'center'}
      sx={{
        color: theme.text,
        fontSize: '14px',
        fontWeight: 500,
        lineHeight: '24px',
        columnGap: '4px',
      }}
    >
      <Flex
        sx={{
          borderRadius: '99999px',
          width: '14px',
          height: '14px',
          background: theme.text,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <DollarSign width="12px" height="12px" color={theme.background} />
      </Flex>

      <Text as="span">
        <Trans>Price</Trans>
      </Text>
    </Flex>
  )
}

const MarketCapRankLabel = () => {
  const theme = useTheme()
  return (
    <Flex
      alignItems={'center'}
      sx={{
        color: theme.text,
        fontSize: '14px',
        fontWeight: 500,
        lineHeight: '24px',
        columnGap: '4px',
      }}
    >
      <BarChart2 strokeWidth="5px" fill="currentColor" width="16px" height="16px" />
      <Text as="span">
        <Trans>Market Cap Rank</Trans>
      </Text>
    </Flex>
  )
}

const VolumeLabel = () => {
  const theme = useTheme()
  return (
    <Flex
      alignItems={'center'}
      sx={{
        color: theme.text,
        fontSize: '14px',
        fontWeight: 500,
        lineHeight: '24px',
        columnGap: '4px',
      }}
    >
      <Repeat strokeWidth="4px" width="14px" height="14px" />
      <Text as="span">
        <Trans>24H Volume</Trans>
      </Text>
    </Flex>
  )
}

const SingleTokenInfo = ({
  data: tokenInfo,
  currency,
  loading,
  expandedOnMount,
}: {
  data: TokenInfo
  currency?: Currency
  loading: boolean
  expandedOnMount?: boolean
}) => {
  const description = replaceHtml(tokenInfo?.description?.en)

  const ref = useRef<HTMLParagraphElement>(null)

  const symbol = currency?.symbol
  const currencyName = tokenInfo.name || currency?.name

  const listField = [
    { label: <PriceLabel />, value: tokenInfo.price ? formattedNum(tokenInfo.price.toString(), true) : NOT_AVAILABLE },
    {
      label: <MarketCapRankLabel />,
      value: tokenInfo.marketCapRank ? `#${formattedNum(tokenInfo.marketCapRank.toString())}` : NOT_AVAILABLE,
    },
    {
      label: <VolumeLabel />,
      value: !tokenInfo.tradingVolume
        ? NOT_AVAILABLE
        : isMobile
        ? formatDollarAmount(tokenInfo.tradingVolume, 2).toUpperCase()
        : formattedNum(tokenInfo.tradingVolume.toString(), true),
    },
  ]
  return (
    <BlockWrapper
      expandedOnMount={expandedOnMount}
      header={
        <Flex alignItems="center">
          <CurrencyLogo currency={currency} size="24px" style={{ marginRight: 10 }} />
          <AboutText>
            {/* About Usdt (Tether(...)) => Usdt (Tether) */}
            About {symbol} {currencyName !== symbol ? `(${formatString(currencyName)})` : null}
          </AboutText>
        </Flex>
      }
    >
      <InfoRowLabel
        className="desc"
        ref={ref}
        dangerouslySetInnerHTML={{
          __html: description.replaceAll('\r\n\r\n', '<br><br>'),
        }}
      />
      <Flex flexWrap="wrap">
        {listField.map((item, i) => (
          <InfoRow key={i}>
            <InfoRowLabel>
              <Trans>{item.label}</Trans>
            </InfoRowLabel>
            <InfoRowValue>{loading ? <Loader /> : item.value}</InfoRowValue>
          </InfoRow>
        ))}
      </Flex>
    </BlockWrapper>
  )
}

export default SingleTokenInfo
