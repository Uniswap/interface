import { memo, useCallback } from 'react'
import { Flex, Text, Tooltip, TouchableArea, isWeb } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { get200MsAnimationDelayFromIndex } from 'ui/src/theme/animations/delay200ms'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { useCommonTokensOptionsWithFallback } from 'uniswap/src/components/TokenSelector/hooks/useCommonTokensOptionsWithFallback'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useOnSelectCurrency } from 'uniswap/src/features/transactions/swap/hooks/useOnSelectCurrency'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isHoverable, isInterfaceDesktop } from 'utilities/src/platform'

// if we show more than 6 tokens, we may need to add more animation delays
const MAX_NUMBER_OF_TOKENS = isInterfaceDesktop ? 5 : 4
const WEB_HOVER_SCALE = 1.1
// match token icon animation time
const TOOLTIP_ANIMATION_TIME = 200

function _DefaultTokenOptions({ currencyField }: { currencyField: CurrencyField }): JSX.Element {
  const account = useAccountMeta()

  const onSelectCurrency = useOnSelectCurrency({})

  const {
    derivedSwapInfo: { chainId },
  } = useSwapFormContext()

  const { data: commonTokenOptions } = useCommonTokensOptionsWithFallback(account?.address, chainId)

  const logoSize = isInterfaceDesktop ? iconSizes.icon20 : iconSizes.icon24
  const extraMarginForHoverAnimation = isHoverable ? Math.ceil(logoSize * (WEB_HOVER_SCALE - 1)) : 0

  const TokenIcon = useCallback(
    ({
      currencyInfo: { logoUrl, currency },
      animationIndex,
    }: {
      currencyInfo: CurrencyInfo
      animationIndex: number
    }) => (
      <TouchableArea
        p="$spacing4"
        borderRadius="$roundedFull"
        backgroundColor="$surface3"
        onPress={(e) => {
          e.stopPropagation()
          onSelectCurrency(currency, currencyField, false)
        }}
        {...(isHoverable && {
          hoverStyle: {
            backgroundColor: '$surface3Hovered',
            scale: WEB_HOVER_SCALE,
          },
          '$group-hover': {
            opacity: 1,
          },
          opacity: 0,
          animation: get200MsAnimationDelayFromIndex(animationIndex),
        })}
      >
        <TokenLogo url={logoUrl} symbol={currency.symbol} chainId={currency.chainId} size={logoSize} />
      </TouchableArea>
    ),
    [onSelectCurrency, currencyField, logoSize],
  )

  const TokenOptions = useCallback(
    () =>
      commonTokenOptions?.slice(0, MAX_NUMBER_OF_TOKENS).map(({ currencyInfo }, index) => {
        const { currency } = currencyInfo
        const key = currency.isNative ? `${currency.chainId}-native` : `${currency.chainId}-${currency.address}`

        return isWeb ? (
          <Tooltip key={key} delay={{ close: TOOLTIP_ANIMATION_TIME, open: TOOLTIP_ANIMATION_TIME }} placement="top">
            <Tooltip.Trigger>
              <TokenIcon currencyInfo={currencyInfo} animationIndex={commonTokenOptions.length - index - 1} />
            </Tooltip.Trigger>
            <Tooltip.Content>
              <Text variant="body4">{currency.symbol}</Text>
              <Tooltip.Arrow />
            </Tooltip.Content>
          </Tooltip>
        ) : (
          <TokenIcon key={key} currencyInfo={currencyInfo} animationIndex={commonTokenOptions.length - index - 1} />
        )
      }),
    [commonTokenOptions, TokenIcon],
  )

  return (
    <Flex
      row
      mx={extraMarginForHoverAnimation}
      gap={isInterfaceDesktop ? '$gap4' : '$gap8'}
      {...(isHoverable && {
        opacity: 0,
        '$group-hover': {
          opacity: 1,
        },
      })}
    >
      <TokenOptions />
    </Flex>
  )
}

export const DefaultTokenOptions = memo(_DefaultTokenOptions)
