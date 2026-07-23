import dayjs from 'dayjs'
import { useCallback, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Button, Flex, Text, TouchableArea, UniversalImage } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { MorphoLogoFull } from 'ui/src/components/icons/MorphoLogoFull'
import { borderRadii, iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { UniswapHelpUrls, UniswapStaticUrls } from 'uniswap/src/constants/urls'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { FORMAT_DATE_MEDIUM, useFormattedDate } from 'uniswap/src/features/language/localizedDayjs'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { ExplorerDataType, getExplorerLink, openUri } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'

interface DetailsTabProps {
  vault: EarnVaultInfo
  hasPosition: boolean
  isConnected: boolean
  onDeposit: () => void
  onConnectWallet: () => void
}

export function DetailsTab({
  vault,
  hasPosition,
  isConnected,
  onDeposit,
  onConnectWallet,
}: DetailsTabProps): JSX.Element {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const onOpenMorphoHome = useCallback(() => {
    if (vault.morphoUrl) {
      openUri({ uri: vault.morphoUrl }).catch(() => undefined)
    }
  }, [vault.morphoUrl])

  return (
    <Flex gap="$spacing16">
      <VaultStatsGrid vault={vault} />
      <ExpandoRow
        isExpanded={expanded}
        label={expanded ? t('common.button.showLess') : t('common.button.showMore')}
        color="$neutral2"
        onPress={() => setExpanded((prev) => !prev)}
      />
      {expanded && (
        <>
          <VaultDetailsList vault={vault} />
          <VaultDescription />
        </>
      )}
      {!isConnected ? (
        <Button fill={false} width="100%" variant="branded" emphasis="secondary" size="large" onPress={onConnectWallet}>
          {t('common.connectWallet.button')}
        </Button>
      ) : (
        !hasPosition && (
          <Button fill={false} width="100%" variant="branded" emphasis="primary" size="large" onPress={onDeposit}>
            {t('explore.earn.vault.deposit')}
          </Button>
        )
      )}
      <Flex row alignItems="center" justifyContent="center" gap="$spacing6">
        <Text variant="body4" color="$neutral3">
          {t('swap.details.poweredBy')}
        </Text>

        <TouchableArea width={70} height={14} onPress={vault.morphoUrl ? onOpenMorphoHome : undefined}>
          {/* width/height are stripped from IconProps but flow through to the SVG at runtime,
              which is the only way to render the 70x14 Morpho wordmark at its true aspect ratio. */}
          {/* @ts-expect-error see comment above */}
          <MorphoLogoFull color="$neutral3" width="100%" height="100%" />
        </TouchableArea>
      </Flex>
    </Flex>
  )
}

function VaultDescription(): JSX.Element {
  const onOpenUniswapTerms = useCallback(() => {
    openUri({
      uri: UniswapHelpUrls.articles.uniswapLabsTermsOfService,
      openExternalBrowser: true,
      isSafeUri: true,
    }).catch(() => undefined)
  }, [])

  const onOpenMorphoDisclaimer = useCallback(() => {
    openUri({ uri: UniswapStaticUrls.morphoDisclaimerUrl, openExternalBrowser: true, isSafeUri: true }).catch(
      () => undefined,
    )
  }, [])

  return (
    <Text variant="body4" color="$neutral2">
      <Trans
        components={{
          morphoDisclaimerLink: (
            <Text
              variant="body4"
              color="$neutral1"
              textDecorationLine="underline"
              cursor="pointer"
              onPress={onOpenMorphoDisclaimer}
            />
          ),
          termsLink: (
            <Text
              variant="body4"
              color="$neutral1"
              textDecorationLine="underline"
              cursor="pointer"
              onPress={onOpenUniswapTerms}
            />
          ),
        }}
        i18nKey="explore.earn.vault.details.legalDisclaimer"
      />
    </Text>
  )
}

function VaultStatsGrid({ vault }: { vault: EarnVaultInfo }): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent, formatNumberOrString } = useLocalizationContext()

  const formatFiatShort = (value: number): string => formatNumberOrString({ value, type: NumberType.FiatTokenDetails })

  return (
    <Flex borderWidth="$spacing1" borderColor="$surface3" borderRadius="$rounded16" overflow="hidden">
      <Flex row>
        <StatCell
          label={t('explore.earn.vault.estApy')}
          value={
            <Text variant="heading3" color="$accent1">
              {formatPercent(vault.apyPercent)}
            </Text>
          }
          borderRightWidth="$spacing1"
          borderBottomWidth="$spacing1"
        />
        <StatCell
          label={t('explore.earn.vault.exposure')}
          value={<ExposureStack currencyIds={vault.exposureCurrencyIds} />}
          borderBottomWidth="$spacing1"
        />
      </Flex>
      <Flex row>
        <StatCell
          label={t('explore.earn.vault.totalDeposits')}
          value={
            <Text variant="heading3" color="$neutral1">
              {formatFiatShort(vault.totalDepositsUsd)}
            </Text>
          }
          borderRightWidth="$spacing1"
        />
        <StatCell
          label={t('explore.earn.vault.liquidity')}
          value={
            <Text variant="heading3" color="$neutral1">
              {formatFiatShort(vault.liquidityUsd)}
            </Text>
          }
        />
      </Flex>
    </Flex>
  )
}

function StatCell({
  label,
  value,
  borderRightWidth,
  borderBottomWidth,
}: {
  label: string
  value: React.ReactNode
  borderRightWidth?: '$spacing1'
  borderBottomWidth?: '$spacing1'
}): JSX.Element {
  return (
    <Flex
      width="50%"
      alignItems="center"
      justifyContent="center"
      gap="$spacing4"
      p="$spacing16"
      borderColor="$surface3"
      borderRightWidth={borderRightWidth}
      borderBottomWidth={borderBottomWidth}
    >
      <Text variant="body3" color="$neutral2">
        {label}
      </Text>
      {value}
    </Flex>
  )
}

function ExposureStack({ currencyIds }: { currencyIds: readonly string[] }): JSX.Element {
  return (
    <Flex row alignItems="center" height={iconSizes.icon28}>
      {currencyIds.slice(0, 4).map((currencyId, index) => (
        <Flex
          key={currencyId}
          ml={index === 0 ? 0 : -8}
          borderWidth="$spacing2"
          borderColor="$surface1"
          borderRadius="$roundedFull"
          zIndex={currencyIds.length - index}
        >
          <ExposureTokenLogo currencyId={currencyId} />
        </Flex>
      ))}
    </Flex>
  )
}

function ExposureTokenLogo({ currencyId }: { currencyId: string }): JSX.Element {
  const currencyInfo = useCurrencyInfo(currencyId)
  const currency = currencyInfo?.currency
  return (
    <TokenLogo
      hideNetworkLogo
      url={currencyInfo?.logoUrl}
      size={iconSizes.icon24}
      chainId={currency?.chainId}
      symbol={currency?.symbol}
      name={currency?.name}
    />
  )
}

function VaultDetailsList({ vault }: { vault: EarnVaultInfo }): JSX.Element {
  const { t } = useTranslation()
  const formattedDeploymentDate = useFormattedDate(dayjs(vault.deploymentDate ?? 0), FORMAT_DATE_MEDIUM)
  const deploymentDateLabel = vault.deploymentDate ? formattedDeploymentDate : '--'

  const vaultExplorerUrl = getExplorerLink({
    chainId: vault.chainId,
    data: vault.vaultAddress,
    type: ExplorerDataType.ADDRESS,
  })
  const onOpenVaultExplorer = useCallback(() => {
    openUri({ uri: vaultExplorerUrl }).catch(() => undefined)
  }, [vaultExplorerUrl])
  const onOpenExposureAndRisk = useCallback(() => {
    if (vault.exposureAndRiskUrl) {
      openUri({ uri: vault.exposureAndRiskUrl }).catch(() => undefined)
    }
  }, [vault.exposureAndRiskUrl])

  return (
    <Flex gap="$spacing12">
      <DetailRow
        label={t('explore.earn.vault.curator')}
        value={
          <Flex row alignItems="center" gap="$spacing4">
            {vault.curator.imageUrl && (
              <UniversalImage
                size={{ width: iconSizes.icon16, height: iconSizes.icon16 }}
                style={{ image: { borderRadius: borderRadii.roundedFull } }}
                uri={vault.curator.imageUrl}
              />
            )}
            <Text variant="body3">{vault.curator.name}</Text>
          </Flex>
        }
      />
      <DetailRow
        label={t('explore.earn.vault.vault')}
        value={
          <TouchableArea row alignItems="center" gap="$spacing4" onPress={onOpenVaultExplorer}>
            <Text variant="body3">{shortenAddress({ address: vault.vaultAddress })}</Text>
            <ExternalLink color="$neutral2" size="$icon.16" />
          </TouchableArea>
        }
      />
      <DetailRow
        label={t('explore.earn.vault.exposureAndRisk')}
        value={
          <TouchableArea
            row
            alignItems="center"
            gap="$spacing4"
            onPress={vault.exposureAndRiskUrl ? onOpenExposureAndRisk : undefined}
          >
            <Text variant="body3">{t('explore.earn.vault.viewDetails')}</Text>
            <ExternalLink color="$neutral2" size="$icon.16" />
          </TouchableArea>
        }
      />
      <DetailRow
        label={t('explore.earn.vault.deploymentDate')}
        value={<Text variant="body3">{deploymentDateLabel}</Text>}
      />
    </Flex>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }): JSX.Element {
  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Text variant="body3" color="$neutral2">
        {label}
      </Text>
      {value}
    </Flex>
  )
}
