import { ChainId, Currency } from '@kyberswap/ks-sdk-core'

import { TokenInfoWrapper } from 'components/swapv2/styleds'
import { TOKEN_INFO_DESCRIPTION } from 'constants/tokenLists/token-info'
import { useActiveWeb3React } from 'hooks'
import useTokenInfo, { TokenInfo } from 'hooks/useTokenInfo'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { getSymbolSlug } from 'utils/string'
import { checkPairInWhiteList } from 'utils/tokenInfo'

import SingleTokenInfo, { HowToSwap } from './SingleTokenInfo'

const isEmptyData = (tokenInfo: TokenInfo) => {
  return !tokenInfo.price && !tokenInfo?.description?.en && !tokenInfo.tradingVolume && !tokenInfo.marketCapRank
}

const copyToken = (tokenInfo: TokenInfo) => {
  const result: TokenInfo = { ...tokenInfo, description: { ...tokenInfo.description } }
  return result
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
  chainId: ChainId
}) => {
  // hard code pair description for SEO
  const rs1: TokenInfo = copyToken(tokenInfo1)
  const rs2: TokenInfo = copyToken(tokenInfo2)
  let inWhiteList = false
  if (tokenWrapped1 && tokenWrapped2 && chainId) {
    const symbol1 = getSymbolSlug(tokenWrapped1)
    const symbol2 = getSymbolSlug(tokenWrapped2)
    const { isInWhiteList, data } = checkPairInWhiteList(chainId, symbol1, symbol2)
    if (isInWhiteList) {
      inWhiteList = isInWhiteList
      const descHardCode1 = TOKEN_INFO_DESCRIPTION[symbol1]
      const descHardCode2 = TOKEN_INFO_DESCRIPTION[symbol2]
      const nameHardCode1 = data[symbol1]?.name
      const nameHardCode2 = data[symbol2]?.name
      if (nameHardCode1) rs1.name = nameHardCode1
      if (nameHardCode2) rs2.name = nameHardCode2
      if (descHardCode1) rs1.description.en = descHardCode1
      if (descHardCode2) rs2.description.en = descHardCode2
    }
  }
  return {
    tokenInfo1: rs1,
    tokenInfo2: rs2,
    isInWhiteList: inWhiteList,
  }
}

const TokenInfoV2 = ({ currencyIn, currencyOut }: { currencyIn?: Currency; currencyOut?: Currency }) => {
  const inputNativeCurrency = useCurrencyConvertedToNative(currencyIn)
  const outputNativeCurrency = useCurrencyConvertedToNative(currencyOut)

  const inputToken = inputNativeCurrency?.wrapped
  const outputToken = outputNativeCurrency?.wrapped

  const { data: data1, loading: loading1 } = useTokenInfo(inputToken)
  const { data: data2, loading: loading2 } = useTokenInfo(outputToken)

  const { chainId } = useActiveWeb3React()

  const { tokenInfo1, tokenInfo2, isInWhiteList } = checkTokenDescription({
    tokenInfo1: data1,
    tokenInfo2: data2,
    tokenWrapped1: currencyIn,
    tokenWrapped2: currencyOut,
    chainId,
  })

  const showToken1 = !isEmptyData(tokenInfo1) && isInWhiteList
  const showToken2 = !isEmptyData(tokenInfo2) && isInWhiteList

  if (!showToken2 && !showToken1) return null
  const showHow2Swap = Boolean(showToken1 && showToken2 && currencyIn && currencyOut && isInWhiteList)
  return (
    <TokenInfoWrapper>
      {showToken1 && (
        <SingleTokenInfo expandedOnMount data={tokenInfo1} loading={loading1} currency={inputNativeCurrency} />
      )}
      {showToken2 && <SingleTokenInfo data={tokenInfo2} loading={loading2} currency={outputNativeCurrency} />}
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
