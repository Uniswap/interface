import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Trans } from '@lingui/macro'
import { Flex } from 'rebass'
import Loader from 'components/Loader'
import CurrencyLogo from 'components/CurrencyLogo'
import { formattedNum } from 'utils'
import { useRef } from 'react'
import { formatDollarAmount } from 'utils/numbers'
import { isMobile } from 'react-device-detect'
import { TokenInfo } from 'hooks/useTokenInfo'
import { Currency } from '@kyberswap/ks-sdk-core'
import { MAP_TOKEN_NAME } from 'constants/tokenLists/token-info'
import { getSymbolSlug } from 'utils/string'

const NOT_AVAIALBLE = '--'
const NUM_LINE_DESC = 5
// 2 styles: border and no border
const Wrapper = styled.div<{ borderBottom?: boolean }>`
  width: 100%;
  padding: 0px
  margin-top: 0px;
  margin-bottom: 0px;
  border: none;
  ${({ borderBottom, theme }) =>
    borderBottom
      ? `
  border-bottom: 1px solid ${theme.border}; 
  margin-bottom: 30px;
  padding-bottom: 30px;`
      : ``}
  ${({ theme, borderBottom }) => theme.mediaWidth.upToSmall`
    margin-top: 24px;
    ${
      borderBottom
        ? `
    margin-bottom: 10px;
    margin-padding: 10px;
    `
        : ``
    }
`}
`

const InfoRow = styled.div<{ isFirst?: boolean; isLast?: boolean }>`
  width: 33%;
  text-align: ${({ isLast }) => (isLast ? 'right' : `left`)};
  padding: 7px 0px 7px ${({ isFirst }) => (isFirst ? '0px' : '40px')};
  border-left: ${({ theme, isFirst }) => (isFirst ? 'none' : `1px solid ${theme.border}`)};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    border: none;
    padding: 20px 0px;
`}
`

const InfoRowValue = styled.div`
  color: ${({ theme }) => theme.text};
  font-size: 20px;
  font-weight: 400;
`

const InfoRowLabel = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  font-weight: 500;
  padding-bottom: 8px;
`

const AboutText = styled.h2`
  color: ${({ theme }) => theme.subText};
  font-size: 20px;
  font-weight: 500;
  margin: 0;
`

const LINE_HEIGHT = 24
const DescText = styled(InfoRowLabel)<{ showLimitLine: boolean }>`
  margin: 10px 0px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin: 10px 0px 0px 0px;
  `}
  .desc {
    line-height: ${LINE_HEIGHT}px;
    ${({ showLimitLine }) =>
      showLimitLine
        ? `
    text-overflow:ellipsis;
    overflow:hidden;
    display: -webkit-box !important;
    height: ${LINE_HEIGHT * NUM_LINE_DESC}px;
    -webkit-line-clamp: ${NUM_LINE_DESC};
    -webkit-box-orient: vertical;
    white-space: normal;
  `
        : ''}
  }
`
const SeeMore = styled.a`
  cursor: pointer;
  margin-top: 5px;
  display: block;
  text-align: right;
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
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // replace script tag
}

enum SeeStatus {
  NOT_SHOW,
  SEE_MORE,
  SEE_LESS,
}

export function HowToSwap({
  fromCurrency,
  toCurrency,
  fromCurrencyInfo,
  toCurrencyInfo,
}: {
  fromCurrency: Currency | undefined
  toCurrency: Currency | undefined
  fromCurrencyInfo: TokenInfo
  toCurrencyInfo: TokenInfo
}) {
  if (!fromCurrency || !toCurrency || !fromCurrencyInfo || !toCurrencyInfo) return null
  const symbol1 = fromCurrency.symbol
  const symbol2 = toCurrency.symbol
  const name1 = fromCurrency.name
  const name2 = toCurrency.name

  let fromName = name1 !== symbol1 ? name1 : fromCurrencyInfo.name || name1
  let toName = name2 !== symbol2 ? name2 : toCurrencyInfo.name || name2

  fromName = MAP_TOKEN_NAME[getSymbolSlug(fromCurrency)] || fromName
  toName = MAP_TOKEN_NAME[getSymbolSlug(toCurrency)] || toName
  return (
    <Wrapper borderBottom={false}>
      <Flex>
        <AboutText>
          How to swap {symbol1} to {symbol2}?
        </AboutText>
      </Flex>

      <DescText showLimitLine={false}>
        <p className="desc">
          {fromName} ({symbol1}) can be exchanged to {toName} ({symbol1} to {symbol2}) on KyberSwap, a cryptocurrency
          decentralized exchange. By using KyberSwap, users can trade {symbol1} to {symbol2} on networks at the best
          rates, and earn more with your {symbol1} token without needing to check rates across multiple platforms.
        </p>
      </DescText>
    </Wrapper>
  )
}

const SingleTokenInfo = ({
  data: tokenInfo,
  borderBottom,
  currency,
  loading,
}: {
  data: TokenInfo
  currency?: Currency
  borderBottom?: boolean
  loading: boolean
}) => {
  const description = replaceHtml(tokenInfo?.description?.en)
  const [seeMoreStatus, setShowMoreDesc] = useState(SeeStatus.NOT_SHOW)

  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const descTag = ref.current
    if (descTag && description) {
      const lineHeight = +getComputedStyle(descTag).lineHeight.replace('px', '')
      const lines = descTag.getBoundingClientRect().height / lineHeight
      setShowMoreDesc(lines < NUM_LINE_DESC ? SeeStatus.NOT_SHOW : SeeStatus.SEE_MORE)
    }
  }, [description])

  const isSeeMore = seeMoreStatus === SeeStatus.SEE_MORE

  const toggleSeeMore = () => setShowMoreDesc(isSeeMore ? SeeStatus.SEE_LESS : SeeStatus.SEE_MORE)

  const symbol = currency?.symbol
  const currencyName = tokenInfo.name || currency?.name

  const listField = [
    { label: 'Price', value: tokenInfo.price ? formattedNum(tokenInfo.price.toString(), true) : NOT_AVAIALBLE },
    {
      label: 'Market Cap Rank',
      value: tokenInfo.marketCapRank ? `#${formattedNum(tokenInfo.marketCapRank.toString())}` : NOT_AVAIALBLE,
    },
    {
      label: '24H Volume',
      value: !tokenInfo.tradingVolume
        ? NOT_AVAIALBLE
        : isMobile
        ? formatDollarAmount(tokenInfo.tradingVolume, 2).toUpperCase()
        : formattedNum(tokenInfo.tradingVolume.toString(), true),
    },
  ]
  return (
    <Wrapper borderBottom={borderBottom}>
      <Flex alignItems="center">
        <CurrencyLogo currency={currency} size="24px" style={{ marginRight: 10 }} />
        <AboutText>
          {/* About Usdt (Tether(...)) => Usdt (Tether) */}
          About {symbol} {currencyName !== symbol ? `(${currencyName?.replace(/\s\(.*\)/i, '')})` : null}
        </AboutText>
      </Flex>

      <DescText showLimitLine={isSeeMore}>
        <div
          className="desc"
          ref={ref}
          dangerouslySetInnerHTML={{
            __html: isSeeMore
              ? description.replace(/<[^>]+>/g, '') // plain text
              : description.replaceAll('\r\n\r\n', '<br><br>'),
          }}
        ></div>
        {seeMoreStatus !== SeeStatus.NOT_SHOW && (
          <SeeMore onClick={toggleSeeMore}>See {isSeeMore ? 'more' : 'less'}</SeeMore>
        )}
      </DescText>

      <Flex flexWrap="wrap">
        {listField.map((item, i) => (
          <InfoRow key={item.label} isFirst={i === 0} isLast={i === listField.length - 1}>
            <InfoRowLabel>
              <Trans>{item.label}</Trans>
            </InfoRowLabel>
            <InfoRowValue>{loading ? <Loader /> : item.value}</InfoRowValue>
          </InfoRow>
        ))}
      </Flex>
    </Wrapper>
  )
}

export default SingleTokenInfo
