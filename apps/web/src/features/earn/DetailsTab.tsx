import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, TouchableArea } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { GauntletLogo } from 'ui/src/components/icons/GauntletLogo'
import { MorphoLogo } from 'ui/src/components/icons/MorphoLogo'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'

const MORPHO_BLUE = '#2470FF'

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

  return (
    <Flex gap="$spacing16">
      <VaultStatsGrid vault={vault} />
      <VaultDetailsList vault={vault} />
      <Button
        emphasis="tertiary"
        size="small"
        py="$spacing16"
        borderRadius="$rounded16"
        icon={<MorphoLogo color={MORPHO_BLUE} size="$icon.16" />}
        onPress={() => {
          // TODO(CONS-1781): link to the Morpho vault URL once backend provides it.
        }}
      >
        {t('explore.earn.vault.viewOnMorpho')}
      </Button>
      <VaultDescription curatorName={vault.curator.name} />
      {!isConnected ? (
        <Button emphasis="primary" size="medium" py="$spacing16" onPress={onConnectWallet}>
          {t('common.connectWallet.button')}
        </Button>
      ) : (
        !hasPosition && (
          <Button emphasis="primary" size="medium" py="$spacing16" onPress={onDeposit}>
            {t('explore.earn.vault.deposit')}
          </Button>
        )
      )}
    </Flex>
  )
}

function VaultDescription({ curatorName }: { curatorName: string }): JSX.Element {
  const { t } = useTranslation()
  return (
    <Text variant="body4" color="$neutral2">
      {t('explore.earn.vault.details.description', { curator: curatorName })}{' '}
      <Text
        variant="body4"
        color="$neutral1"
        textDecorationLine="underline"
        cursor="pointer"
        onPress={() => {
          // TODO(CONS-1782): link the description "Learn more" to the vault governance article.
        }}
      >
        {t('common.button.learn')}
      </Text>
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
      url={currencyInfo?.logoUrl}
      size={iconSizes.icon24}
      chainId={currency?.chainId}
      symbol={currency?.symbol}
      name={currency?.name}
      hideNetworkLogo
    />
  )
}

function VaultDetailsList({ vault }: { vault: EarnVaultInfo }): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const curatorAddress = vault.curator.address
  const curatorTvlUsd = vault.curator.tvlUsd

  const deploymentDateLabel =
    vault.deploymentDate?.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) ?? '--'

  return (
    <Flex gap="$spacing12">
      <DetailRow
        label={t('explore.earn.vault.curator')}
        value={
          <Flex row alignItems="center" gap="$spacing4">
            <GauntletLogo color="$neutral2" size="$icon.16" />
            <Text variant="body3" color="$neutral1">
              {vault.curator.name}
            </Text>
          </Flex>
        }
      />
      <DetailRow
        label={t('explore.earn.vault.curatorAddress')}
        value={
          curatorAddress ? (
            <TouchableArea
              row
              alignItems="center"
              gap="$spacing4"
              onPress={() => {
                // TODO(CONS-1781): link to etherscan with the real curator address once backend provides it.
              }}
            >
              <Text variant="body3" color="$neutral1">
                {shortenAddress({ address: curatorAddress })}
              </Text>
              <ExternalLink color="$neutral2" size="$icon.16" />
            </TouchableArea>
          ) : (
            <Text variant="body3" color="$neutral1">
              --
            </Text>
          )
        }
      />
      <DetailRow
        label={t('explore.earn.vault.curatorTvl')}
        value={
          <Text variant="body3" color="$neutral1">
            {curatorTvlUsd === undefined
              ? '--'
              : formatNumberOrString({ value: curatorTvlUsd, type: NumberType.FiatTokenDetails })}
          </Text>
        }
      />
      <DetailRow
        label={t('explore.earn.vault.exposureAndRisk')}
        value={
          <TouchableArea
            row
            alignItems="center"
            gap="$spacing4"
            onPress={() => {
              // TODO(CONS-1781): link to exposure-and-risk details page.
            }}
          >
            <Text variant="body3" color="$neutral1">
              {t('explore.earn.vault.viewDetails')}
            </Text>
            <ExternalLink color="$neutral2" size="$icon.16" />
          </TouchableArea>
        }
      />
      <DetailRow
        label={t('explore.earn.vault.deploymentDate')}
        value={
          <Text variant="body3" color="$neutral1">
            {deploymentDateLabel}
          </Text>
        }
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
