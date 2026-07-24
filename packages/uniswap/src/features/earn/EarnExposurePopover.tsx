import { isMobileWeb, isWebPlatform } from '@universe/environment'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useExtractedTokenColor, useSporeColors } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { colors as palette, iconSizes, zIndexes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import type { EarnVaultExposure, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { currencyIdToAddress, currencyIdToChain, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { isSVGUri } from 'utilities/src/format/urls'

function isNativeExposure(currencyId: string): boolean {
  const chainId = currencyIdToChain(currencyId)
  return chainId !== null && isNativeCurrencyAddress(chainId, currencyIdToAddress(currencyId))
}

// Prefer the per-asset breakdown; fall back to the token-only list until the backend populates `exposures`.
export function getExposureRows(vault: EarnVaultInfo): EarnVaultExposure[] {
  if (vault.exposures.length > 0) {
    // The native token is fully deployed into the vault, so its idle exposure is 0 — hide that redundant $0 row.
    // Keep every other asset (including non-native 0-value assets) so the vault's collateral set stays visible.
    return vault.exposures.filter(
      (exposure) => !(isNativeExposure(exposure.currencyId) && (exposure.valueUsd ?? 0) === 0),
    )
  }
  return vault.exposureCurrencyIds.map((currencyId) => ({ currencyId }))
}

export function shouldShowExposurePopover(vault: EarnVaultInfo): boolean {
  return getExposureRows(vault).length > 1
}

export function EarnExposurePopover({ vault }: { vault: EarnVaultInfo }): JSX.Element {
  const { t } = useTranslation()
  const rows = getExposureRows(vault)
  // Fallback rows have no values (not $0), so only show amounts with the real breakdown.
  const showUsdValues = vault.exposures.length > 0
  const breakdown = <ExposureBreakdown rows={rows} showUsdValues={showUsdValues} />

  return (
    <WarningInfo
      // Pass the icon directly — WarningInfo wraps it in its own TouchableArea on native.
      showModalOnMobileWeb
      trigger={<InfoCircleFilled color="$neutral3" size="$icon.16" />}
      infoButton={breakdown}
      modalProps={{
        modalName: ModalName.EarnVaultExposure,
        severity: WarningSeverity.None,
        hideIcon: true,
        rejectText: t('common.button.close'),
        zIndex: zIndexes.popover,
      }}
      tooltipProps={{
        text: null,
        placement: 'right',
      }}
    />
  )
}

function ExposureBreakdown({
  rows,
  showUsdValues,
}: {
  rows: EarnVaultExposure[]
  showUsdValues: boolean
}): JSX.Element {
  return (
    // Web tooltip needs extra padding; the mobile sheet already has its own.
    <Flex gap="$spacing16" width="100%" minWidth={220} p={isWebPlatform && !isMobileWeb ? '$spacing8' : undefined}>
      <ExposureBar rows={rows} />
      <Flex gap="$spacing8" width="100%">
        {rows.map((row, index) => (
          <ExposureRow key={row.currencyId} exposure={row} colorIndex={index} showUsdValue={showUsdValues} />
        ))}
      </Flex>
    </Flex>
  )
}

// Floor width (px) for each segment so tiny-share assets stay visible in the bar.
const EXPOSURE_BAR_MIN_SEGMENT_WIDTH = 8
const EXPOSURE_SHARE_TOTAL_TOLERANCE = 0.001

export function resolveExposureColor({
  imageUrl,
  extractedColor,
  fallbackColor,
}: {
  imageUrl: string | null | undefined
  extractedColor: string | null | undefined
  fallbackColor: string
}): string {
  // SVG palettes cannot be extracted by the shared TDP hook, which otherwise returns the same
  // neutral color for every asset. Keep those segments distinct with the indexed fallback.
  return isSVGUri(imageUrl) ? fallbackColor : (extractedColor ?? fallbackColor)
}

// Returns per-row weights on a single complete basis. Null entries are informational assets that
// are not part of the distribution; they are only accepted when the known shares already total 100%.
// An incomplete share or USD vector remains indeterminate rather than treating missing data as zero.
export function getExposureWeights(rows: EarnVaultExposure[]): Array<number | null> | null {
  if (rows.every((row) => row.share !== undefined)) {
    return rows.map((row) => row.share ?? 0)
  }

  const knownShareTotal = rows.reduce((sum, row) => sum + (row.share ?? 0), 0)
  const hasKnownShares = rows.some((row) => row.share !== undefined)
  if (hasKnownShares && Math.abs(knownShareTotal - 1) <= EXPOSURE_SHARE_TOTAL_TOLERANCE) {
    return rows.map((row) => row.share ?? null)
  }

  if (rows.every((row) => row.valueUsd !== undefined)) {
    return rows.map((row) => row.valueUsd ?? 0)
  }
  return null
}

function ExposureBar({ rows }: { rows: EarnVaultExposure[] }): JSX.Element | null {
  // Pick one basis for the whole bar so we never compare shares against USD values.
  // Prefer shares when every row has one, then use a complete USD vector.
  const weights = getExposureWeights(rows)
  if (!weights) {
    return null
  }

  const total = weights.reduce<number>((sum, weight) => sum + (weight ?? 0), 0)

  if (total <= 0) {
    return null
  }

  return (
    <Flex row height={8} width="100%" gap="$spacing2">
      {rows.map((row, index) => {
        const weight = weights[index]
        if (weight === null || weight === undefined) {
          return null
        }
        return <ExposureBarSegment key={row.currencyId} exposure={row} colorIndex={index} weight={weight} />
      })}
    </Flex>
  )
}

function ExposureRow({
  exposure,
  colorIndex,
  showUsdValue,
}: {
  exposure: EarnVaultExposure
  colorIndex: number
  showUsdValue: boolean
}): JSX.Element {
  const currencyInfo = useCurrencyInfo(exposure.currencyId)
  const { formatNumberOrString } = useLocalizationContext()
  const currency = currencyInfo?.currency
  const color = useExposureColor({ currencyInfo, colorIndex })

  return (
    <Flex row alignItems="center" justifyContent="space-between" gap="$spacing12" width="100%">
      <Flex row shrink alignItems="center" gap="$spacing8">
        <TokenLogo
          hideNetworkLogo
          url={currencyInfo?.logoUrl}
          size={iconSizes.icon24}
          chainId={currency?.chainId}
          symbol={currency?.symbol}
          name={currency?.name}
        />
        <Text variant="body3" color="$neutral1">
          {currency?.symbol ?? ''}
        </Text>
      </Flex>
      <Flex row alignItems="center" gap="$spacing8">
        {showUsdValue && (
          <Text variant="body3" color="$neutral1">
            {exposure.valueUsd === undefined
              ? '-'
              : formatNumberOrString({ value: exposure.valueUsd, type: NumberType.FiatTokenDetails })}
          </Text>
        )}
        <Flex width={8} height={8} borderRadius="$roundedFull" style={{ backgroundColor: color }} />
      </Flex>
    </Flex>
  )
}

function ExposureBarSegment({
  exposure,
  colorIndex,
  weight,
}: {
  exposure: EarnVaultExposure
  colorIndex: number
  weight: number
}): JSX.Element {
  const currencyInfo = useCurrencyInfo(exposure.currencyId)
  const color = useExposureColor({ currencyInfo, colorIndex })

  return (
    <Flex
      height={8}
      flexGrow={weight}
      flexBasis={0}
      minWidth={EXPOSURE_BAR_MIN_SEGMENT_WIDTH}
      borderRadius="$roundedFull"
      style={{ backgroundColor: color }}
    />
  )
}

function useExposureColor({
  currencyInfo,
  colorIndex,
}: {
  currencyInfo: ReturnType<typeof useCurrencyInfo>
  colorIndex: number
}): string {
  const colors = useSporeColors()
  const fallbackColors = [
    palette.orangeBase,
    palette.blueBase,
    palette.greenBase,
    palette.pinkBase,
    palette.cyanBase,
    palette.yellowBase,
    palette.purpleBase,
    palette.redBase,
  ]
  const fallbackColor = fallbackColors[colorIndex % fallbackColors.length] ?? colors.neutral3.val
  const currency = currencyInfo?.currency
  const imageUrl = currencyInfo?.logoUrl
  const { tokenColor } = useExtractedTokenColor({
    imageUrl,
    tokenName: currency?.symbol ?? currency?.name,
    backgroundColor: colors.surface1.val,
    defaultColor: fallbackColor,
  })

  return resolveExposureColor({ imageUrl, extractedColor: tokenColor, fallbackColor })
}
