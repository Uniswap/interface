import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { FocusedRowControl, OptionItem } from 'uniswap/src/components/lists/items/OptionItem'
import { EarnVaultOption } from 'uniswap/src/components/lists/items/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'

type EarnVaultOptionItemProps = {
  option: EarnVaultOption
  onPress: () => void
  rightElement?: JSX.Element
  focusedRowControl?: FocusedRowControl
}

function EarnVaultOptionItemInner({
  option,
  onPress,
  rightElement,
  focusedRowControl,
}: EarnVaultOptionItemProps): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent, convertFiatAmountFormatted } = useLocalizationContext()

  const { vault, underlyingCurrencyInfo, apyPercent, positionValueUsd } = option
  const currency = underlyingCurrencyInfo?.currency
  const title = currency?.name ?? getSymbolDisplayText(currency?.symbol) ?? ''

  return (
    <OptionItem
      image={
        <TokenLogo
          hideNetworkLogo
          chainId={currency?.chainId}
          name={currency?.name}
          symbol={currency?.symbol}
          url={underlyingCurrencyInfo?.logoUrl ?? undefined}
        />
      }
      title={title}
      subtitle={
        <Flex row alignItems="center" gap="$spacing8">
          <Text color="$accent1" numberOfLines={1} variant="body3">
            {t('explore.earn.apy', { apy: formatPercent(apyPercent) })}
          </Text>
          {positionValueUsd !== undefined && (
            <Text color="$neutral2" numberOfLines={1} variant="body3">
              {t('explore.earn.search.deposited', {
                amount: convertFiatAmountFormatted(positionValueUsd, NumberType.PortfolioBalance),
              })}
            </Text>
          )}
        </Flex>
      }
      rightElement={rightElement}
      testID={`earn-vault-option-${vault.id}`}
      focusedRowControl={focusedRowControl}
      onPress={onPress}
    />
  )
}

export const EarnVaultOptionItem = memo(EarnVaultOptionItemInner)
