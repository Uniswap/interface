import { isWebPlatform } from '@universe/environment'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea, useIsDarkMode } from 'ui/src'
import { iconSizes, type FontVariantToken } from 'ui/src/theme'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { PositionItemContextMenu } from 'uniswap/src/components/portfolio/PositionItem/PositionItemContextMenu'
import { UNISWAP_WEB_URL } from 'uniswap/src/constants/urls'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { LiquidityPositionStatusIndicator } from 'uniswap/src/features/positions/components/LiquidityPositionStatusIndicator'
import { getPositionUrl } from 'uniswap/src/features/positions/getPositionUrl'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { getFeeLabel, getProtocolVersionLabel } from 'uniswap/src/features/positions/utils'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { getPoolDetailsURL, openUri } from 'uniswap/src/utils/linking'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'

const TITLE_VARIANT = isWebPlatform ? 'body2' : 'body1'
const SUBTITLE_VARIANT = isWebPlatform ? 'body3' : 'body2'

export interface PositionItemContextMenuConfig {
  isVisible: boolean
  onReportSuccess?: () => void
}

interface PositionItemProps {
  positionInfo: PositionInfo
  onPress?: () => void
  hasOuterPadding?: boolean
  contextMenuActions?: PositionItemContextMenuConfig
}

export const PositionItem = memo(function PositionItemInner({
  positionInfo,
  onPress,
  hasOuterPadding,
  contextMenuActions,
}: PositionItemProps): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const isDataLivelinessEnabled = useFeatureFlag(FeatureFlags.DataLivelinessUI)
  // Ensure items rerender when theme is switched — memoized row otherwise misses Tamagui token re-resolution.
  useIsDarkMode()

  const { currency0Amount, currency1Amount, chainId, version, feeTier, status, totalValueUsd } = positionInfo

  const [currency0Info, currency1Info] = useCurrencyInfos([
    currencyId(currency0Amount.currency),
    currencyId(currency1Amount.currency),
  ])

  const onManagePress = useEvent(() => {
    void openUri({
      uri: `${UNISWAP_WEB_URL}${getPositionUrl(positionInfo)}`,
      openExternalBrowser: true,
      isSafeUri: true,
    })
  })
  const onPoolInfoPress = useEvent(() => {
    void openUri({
      uri: `${UNISWAP_WEB_URL}${getPoolDetailsURL(positionInfo.poolId, chainId)}`,
      openExternalBrowser: true,
      isSafeUri: true,
    })
  })

  const protocolLabel = getProtocolVersionLabel(version)
  const feeLabel = getFeeLabel({ version, feeTier, dynamicLabel: t('common.dynamic') })
  const balanceFormatted =
    totalValueUsd !== undefined ? convertFiatAmountFormatted(totalValueUsd, NumberType.FiatTokenQuantity) : undefined

  const row = (
    <Flex
      group
      row
      alignItems="center"
      backgroundColor="$surface1"
      borderRadius="$rounded16"
      gap="$spacing12"
      hoverStyle={{ backgroundColor: '$surface2' }}
      justifyContent="space-between"
      px={hasOuterPadding ? '$spacing24' : '$spacing8'}
      py="$spacing8"
      testID={`PositionItem_${positionInfo.poolId}`}
    >
      <Flex row shrink alignItems="center" gap="$spacing12">
        <SplitLogo
          chainId={chainId}
          inputCurrencyInfo={currency0Info}
          outputCurrencyInfo={currency1Info}
          size={iconSizes.icon40}
        />
        <Flex shrink minWidth={0} alignItems="flex-start" gap="$spacing2" overflow="hidden">
          <Text ellipsizeMode="tail" numberOfLines={1} variant={TITLE_VARIANT}>
            {currency0Amount.currency.symbol} / {currency1Amount.currency.symbol}
          </Text>
          <Flex row alignItems="center" gap="$spacing6">
            {protocolLabel ? (
              <Text color="$neutral2" numberOfLines={1} variant={SUBTITLE_VARIANT}>
                {protocolLabel}
              </Text>
            ) : null}
            {protocolLabel && feeLabel ? (
              <Flex backgroundColor="$neutral3" borderRadius="$roundedFull" height={3} width={3} />
            ) : null}
            {feeLabel ? (
              <Text color="$neutral2" numberOfLines={1} variant={SUBTITLE_VARIANT}>
                {feeLabel}
              </Text>
            ) : null}
          </Flex>
        </Flex>
      </Flex>

      <Flex alignItems="flex-end" justifyContent="center">
        {balanceFormatted !== undefined ? (
          isDataLivelinessEnabled ? (
            <AnimatedNumber
              color="$neutral1"
              numericValue={totalValueUsd}
              textVariant={`$${TITLE_VARIANT}` as FontVariantToken}
              value={balanceFormatted}
            />
          ) : (
            <Text color="$neutral1" numberOfLines={1} variant={TITLE_VARIANT}>
              {balanceFormatted}
            </Text>
          )
        ) : null}
        <LiquidityPositionStatusIndicator status={status} />
      </Flex>
    </Flex>
  )

  if (contextMenuActions) {
    return (
      <PositionItemContextMenu
        isVisible={contextMenuActions.isVisible}
        positionInfo={positionInfo}
        onReportSuccess={contextMenuActions.onReportSuccess}
        onRowPress={onPress}
        onManagePress={onManagePress}
        onPoolInfoPress={onPoolInfoPress}
      >
        {row}
      </PositionItemContextMenu>
    )
  }

  if (onPress) {
    return <TouchableArea onPress={onPress}>{row}</TouchableArea>
  }

  return row
})
