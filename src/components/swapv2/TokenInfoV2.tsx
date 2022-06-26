import React, { useEffect } from 'react'
import { Currency } from '@kyberswap/ks-sdk-core'
import useTokenInfo, { TokenInfo } from 'hooks/useTokenInfo'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { TokenInfoWrapper } from './styleds'
import SingleTokenInfo from 'components/swapv2/SingleTokenInfo'

const isEmptyData = (tokenInfo: TokenInfo) => {
  return !tokenInfo.price && !tokenInfo.description && !tokenInfo.tradingVolume && !tokenInfo.marketCapRank
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

  const { data: tokenInfo, loading: loading1 } = useTokenInfo(inputToken)
  const { data: tokenInfo2, loading: loading2 } = useTokenInfo(outputToken)

  const showToken1 = !isEmptyData(tokenInfo)
  const showToken2 = !isEmptyData(tokenInfo2)

  useEffect(() => {
    callback(showToken2 || showToken1)
  }, [callback, showToken2, showToken1])

  if (!showToken2 && !showToken1) return null
  return (
    <TokenInfoWrapper>
      {showToken1 && (
        <SingleTokenInfo data={tokenInfo} borderBottom={showToken2} loading={loading1} currency={inputNativeCurrency} />
      )}
      {showToken2 && <SingleTokenInfo data={tokenInfo2} loading={loading2} currency={outputNativeCurrency} />}
    </TokenInfoWrapper>
  )
}

export default TokenInfoV2
