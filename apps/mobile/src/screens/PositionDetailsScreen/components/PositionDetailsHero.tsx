import { Flex, Text, TouchableArea, iconSizes } from '@universe/mycelium'
import { ExchangeHorizontal } from '@universe/mycelium/icons/ExchangeHorizontal'
import { useTranslation } from 'react-i18next'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getPoolName } from 'uniswap/src/features/pools/names'
import { orderPoolDataByQuoteToken } from 'uniswap/src/features/pools/quoteToken'
import { PositionInfo } from 'uniswap/src/features/positions/types'
import { getFeeLabel, getProtocolVersionLabel } from 'uniswap/src/features/positions/utils'
import { shortenAddress } from 'utilities/src/addresses'

const SUBTITLE_DOT_SIZE = 3

interface PositionDetailsHeroProps {
  positionInfo: PositionInfo
  currency0Info: Maybe<CurrencyInfo>
  currency1Info: Maybe<CurrencyInfo>
  formattedValue: string
  conversionText?: string
  onTogglePriceDirection: () => void
}

export function PositionDetailsHero({
  positionInfo,
  currency0Info,
  currency1Info,
  formattedValue,
  conversionText,
  onTogglePriceDirection,
}: PositionDetailsHeroProps): JSX.Element {
  const { t } = useTranslation()
  const { currency0Amount, currency1Amount, version, feeTier, v4hook, chainId, isToken0Quote } = positionInfo
  const [baseInfo, quoteInfo] = orderPoolDataByQuoteToken({
    token0IsQuote: isToken0Quote,
    data0: currency0Info,
    data1: currency1Info,
  })
  const poolName = getPoolName({
    symbol0: currency0Amount.currency.symbol,
    symbol1: currency1Amount.currency.symbol,
    token0IsQuote: isToken0Quote,
    spaced: true,
  })

  const protocolLabel = getProtocolVersionLabel(version)
  const feeLabel = getFeeLabel({ version, feeTier, dynamicLabel: t('common.dynamic') })
  const hookLabel = v4hook && v4hook !== ZERO_ADDRESS ? shortenAddress({ address: v4hook }) : undefined
  const subtitleParts = [protocolLabel, feeLabel, hookLabel].filter((part): part is string => Boolean(part))

  return (
    <Flex gap="$spacing20" width="100%">
      <Flex row alignItems="center" gap="$spacing16" width="100%">
        <SplitLogo
          chainId={chainId}
          inputCurrencyInfo={baseInfo}
          outputCurrencyInfo={quoteInfo}
          size={iconSizes.icon48}
        />
        <Flex shrink gap="$spacing2">
          <Text color="$neutral1" numberOfLines={1} variant="subheading1">
            {poolName}
          </Text>
          <Flex row alignItems="center" gap="$spacing6">
            {subtitleParts.map((part, index) => (
              <Flex key={part} row alignItems="center" gap="$spacing6">
                {index > 0 && (
                  <Flex
                    backgroundColor="$neutral3"
                    borderRadius="$roundedFull"
                    height={SUBTITLE_DOT_SIZE}
                    width={SUBTITLE_DOT_SIZE}
                  />
                )}
                <Text color="$neutral2" numberOfLines={1} variant="body3">
                  {part}
                </Text>
              </Flex>
            ))}
          </Flex>
        </Flex>
      </Flex>

      <Flex gap="$spacing8">
        <Text color="$neutral1" variant="heading2">
          {formattedValue}
        </Text>
        {conversionText ? (
          <TouchableArea onPress={onTogglePriceDirection}>
            <Flex row alignItems="center" gap="$spacing8">
              <Text color="$neutral2" variant="body3">
                {conversionText}
              </Text>
              <ExchangeHorizontal color="$neutral2" size="$icon.16" />
            </Flex>
          </TouchableArea>
        ) : null}
      </Flex>
    </Flex>
  )
}
