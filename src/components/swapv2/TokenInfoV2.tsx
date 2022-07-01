import React, { useEffect } from 'react'
import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import useTokenInfo, { TokenInfo } from 'hooks/useTokenInfo'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { TokenInfoWrapper } from './styleds'
import SingleTokenInfo, { HowToSwap } from 'components/swapv2/SingleTokenInfo'
import { TOKEN_INFO_DESCRIPTION, WHITE_LIST_TOKEN_INFO_PAIR } from 'constants/tokenLists/token-info'
import { getSymbolSlug } from 'utils/string'
import { useActiveWeb3React } from 'hooks'

const isEmptyData = (tokenInfo: TokenInfo) => {
  return !tokenInfo.price && !tokenInfo?.description?.en && !tokenInfo.tradingVolume && !tokenInfo.marketCapRank
}

const checkTokenDescription = ({
  tokenInfo1,
  tokenInfo2,
  tokenWrapped1,
  tokenWrapped2,
  chainId,
}: {
  tokenInfo1: TokenInfo
  tokenInfo2: TokenInfo
  tokenWrapped1: Currency | undefined
  tokenWrapped2: Currency | undefined
  chainId: ChainId | undefined
}) => {
  // hard code pair description for SEO
  const rs1 = JSON.parse(JSON.stringify(tokenInfo1))
  const rs2 = JSON.parse(JSON.stringify(tokenInfo2))
  let isHardCode = false
  if (tokenWrapped1 && tokenWrapped2 && chainId) {
    const mapByNetwork = WHITE_LIST_TOKEN_INFO_PAIR[chainId]
    const symbol1 = getSymbolSlug(tokenWrapped1)
    const symbol2 = getSymbolSlug(tokenWrapped2)
    const str1 = `${symbol1},${symbol2}`
    const str2 = `${symbol2},${symbol1}`

    if (mapByNetwork && (mapByNetwork[str1] || mapByNetwork[str2])) {
      const descHardCode1 = TOKEN_INFO_DESCRIPTION[symbol1]
      const descHardCode2 = TOKEN_INFO_DESCRIPTION[symbol2]
      if (descHardCode1) {
        rs1.description.en = descHardCode1
        isHardCode = true
      }
      if (descHardCode2) {
        rs2.description.en = descHardCode2
        isHardCode = true
      }
    }
  }
  return {
    tokenInfo1: rs1,
    tokenInfo2: rs2,
    isHardCode,
  }
}

const TokenInfoV2 = ({
  currencyIn,
  currencyOut,
  callback,
}: {
  currencyIn?: Currency
  currencyOut?: Currency
  callback: (show: boolean) => void
}) => {
  const inputNativeCurrency = useCurrencyConvertedToNative(currencyIn)
  const outputNativeCurrency = useCurrencyConvertedToNative(currencyOut)

  const inputToken = inputNativeCurrency?.wrapped
  const outputToken = outputNativeCurrency?.wrapped

  const { data: data1, loading: loading1 } = useTokenInfo(inputToken)
  const { data: data2, loading: loading2 } = useTokenInfo(outputToken)

  const { chainId } = useActiveWeb3React()

  const { tokenInfo1, tokenInfo2, isHardCode } = checkTokenDescription({
    tokenInfo1: data1,
    tokenInfo2: data2,
    tokenWrapped1: currencyIn,
    tokenWrapped2: currencyOut,
    chainId,
  })

  const showToken1 = !isEmptyData(tokenInfo1)
  const showToken2 = !isEmptyData(tokenInfo2)

  useEffect(() => {
    callback(showToken2 || showToken1)
  }, [callback, showToken2, showToken1])

  if (!showToken2 && !showToken1) return null
  const showHow2Swap = Boolean(showToken1 && showToken2 && currencyIn && currencyOut && isHardCode)
  return (
    <TokenInfoWrapper>
      {showToken1 && (
        <SingleTokenInfo
          data={tokenInfo1}
          borderBottom={showToken2}
          loading={loading1}
          currency={inputNativeCurrency}
        />
      )}
      {showToken2 && (
        <SingleTokenInfo
          data={tokenInfo2}
          loading={loading2}
          currency={outputNativeCurrency}
          borderBottom={showHow2Swap}
        />
      )}
      {showHow2Swap && (
        <HowToSwap
          fromCurrency={currencyIn}
          toCurrency={currencyOut}
          fromCurrencyInfo={tokenInfo1}
          toCurrencyInfo={tokenInfo2}
        />
      )}
    </TokenInfoWrapper>
  )
}

export default TokenInfoV2
