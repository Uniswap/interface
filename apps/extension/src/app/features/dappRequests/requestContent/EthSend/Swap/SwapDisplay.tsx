import { useTranslation } from 'react-i18next'
import { DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import { Flex, Separator, Text } from 'ui/src'
import { ArrowDown } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { NumberType } from 'utilities/src/format/types'

export function SwapDisplay({
  inputAmount,
  outputAmount,
  inputCurrencyInfo,
  outputCurrencyInfo,
  chainId,
  transactionGasFeeResult,
  showSmartWalletActivation,
  onCancel,
  onConfirm,
  isUniswapX,
  isWrap,
  isUnwrap,
}: {
  inputAmount: string
  outputAmount: string
  inputCurrencyInfo: Maybe<CurrencyInfo>
  outputCurrencyInfo: Maybe<CurrencyInfo>
  chainId: UniverseChainId | null
  transactionGasFeeResult?: GasFeeResult
  showSmartWalletActivation?: boolean
  onCancel?: () => Promise<void>
  onConfirm?: () => Promise<void>
  isUniswapX?: boolean
  isWrap?: boolean
  isUnwrap?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const { formatCurrencyAmount } = useLocalizationContext()

  const inputCurrencyAmount = getCurrencyAmount({
    value: inputAmount,
    valueType: ValueType.Exact,
    currency: inputCurrencyInfo?.currency,
  })
  const inputValue = useUSDCValue(inputCurrencyAmount)

  const outputCurrencyAmount = getCurrencyAmount({
    value: outputAmount,
    valueType: ValueType.Exact,
    currency: outputCurrencyInfo?.currency,
  })
  const outputValue = useUSDCValue(outputCurrencyAmount)

  const currencyIn = inputCurrencyInfo?.currency
  const currencyOut = outputCurrencyInfo?.currency
  const showSplitLogo = Boolean(inputCurrencyInfo?.logoUrl && outputCurrencyInfo?.logoUrl)
  const showSwapDetails = Boolean(currencyIn?.symbol && currencyOut?.symbol)

  // Determine the appropriate title based on transaction type
  let title = ''
  if (isWrap && currencyIn?.symbol) {
    title = t('common.wrap', { symbol: currencyIn.symbol })
  } else if (isUnwrap && currencyIn?.symbol) {
    title = t('position.wrapped.unwrap', { wrappedToken: currencyIn.symbol })
  } else if (currencyIn?.symbol && currencyOut?.symbol) {
    title = t('swap.request.title.full', {
      inputCurrencySymbol: currencyIn.symbol,
      outputCurrencySymbol: currencyOut.symbol,
    })
  } else {
    title = t('swap.request.title.short')
  }

  return (
    <DappRequestContent
      showNetworkCost
      confirmText={isWrap ? t('swap.button.wrap') : isUnwrap ? t('common.unwrap.button') : t('swap.button.swap')}
      headerIcon={
        showSplitLogo ? (
          <SplitLogo
            chainId={chainId}
            inputCurrencyInfo={inputCurrencyInfo}
            outputCurrencyInfo={outputCurrencyInfo}
            size={iconSizes.icon40}
          />
        ) : undefined
      }
      isUniswapX={isUniswapX}
      title={title}
      transactionGasFeeResult={transactionGasFeeResult}
      showSmartWalletActivation={showSmartWalletActivation}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      {showSwapDetails && (
        <>
          <Separator />
          <Flex
            alignItems="flex-start"
            flexDirection="column"
            flexGrow={1}
            gap="$spacing12"
            justifyContent="flex-start"
            px="$spacing8"
            py="$spacing16"
          >
            <Flex flexDirection="row" justifyContent="space-between" width="100%">
              <Flex flexDirection="column">
                <Text color="$neutral1" variant="heading3">
                  {formatCurrencyAmount({ value: inputCurrencyAmount, type: NumberType.TokenTx })} {currencyIn?.symbol}
                </Text>
                <Text color="$neutral2" variant="body3">
                  {formatCurrencyAmount({ value: inputValue, type: NumberType.FiatTokenPrice })}
                </Text>
              </Flex>
              <CurrencyLogo currencyInfo={inputCurrencyInfo} />
            </Flex>
            <ArrowDown color="$neutral3" size="$icon.24" />
            <Flex flexDirection="row" justifyContent="space-between" width="100%">
              <Flex flexDirection="column">
                <Text color="$neutral1" variant="heading3">
                  {formatCurrencyAmount({ value: outputCurrencyAmount, type: NumberType.TokenTx })}{' '}
                  {currencyOut?.symbol}
                </Text>
                <Text color="$neutral2" variant="body3">
                  {formatCurrencyAmount({ value: outputValue, type: NumberType.FiatTokenPrice })}
                </Text>
              </Flex>
              <CurrencyLogo currencyInfo={outputCurrencyInfo} />
            </Flex>
          </Flex>
        </>
      )}
    </DappRequestContent>
  )
}
