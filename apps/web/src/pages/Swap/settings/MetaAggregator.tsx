import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Switch, Text, TouchableArea } from 'ui/src'
import { useTransactionSettingsContext } from 'uniswap/src/features/transactions/components/settings/contexts/TransactionSettingsContext'
import { AggregatorType } from 'uniswap/src/features/transactions/components/settings/slice'
import { TransactionSettingConfig } from 'uniswap/src/features/transactions/components/settings/types'

const ALL_AGGREGATORS = [
  AggregatorType.Enso,
  AggregatorType.OneInch,
  AggregatorType.UniswapX,
  AggregatorType.BitGet,
  AggregatorType.OpenOcean,
  // AggregatorType.Kyber,
  // AggregatorType.Velora,
  AggregatorType.Nordstern,
]

const DEFAULT_AGGREGATORS = [
  AggregatorType.OneInch,
  AggregatorType.Enso,
  AggregatorType.BitGet,
  AggregatorType.OpenOcean,
]

const HEADER_PREVIEW_AGGREGATORS = [
  AggregatorType.UniswapX,
  AggregatorType.OneInch,
  AggregatorType.Kyber,
  AggregatorType.Enso,
]

function getAggregatorName(type: AggregatorType): string {
  switch (type) {
    case AggregatorType.Enso:
      return 'Enso'
    case AggregatorType.OneInch:
      return '1inch'
    case AggregatorType.UniswapX:
      return 'UniswapX'
    case AggregatorType.BitGet:
      return 'Bitget Wallet'
    case AggregatorType.Kyber:
      return 'Kyber'
    case AggregatorType.OpenOcean:
      return 'OpenOcean'
    case AggregatorType.Nordstern:
      return 'Nordstern'
    default:
      return type
  }
}

function getAggregatorLogo(type: AggregatorType): string {
  switch (type) {
    case AggregatorType.Enso:
      return '/images/aggregators/enso.png'
    case AggregatorType.OneInch:
      return '/images/aggregators/1inch_logo.png'
    case AggregatorType.UniswapX:
      return '/images/192x192_App_Icon.png'
    case AggregatorType.BitGet:
      return '/images/aggregators/bitget_wallet_logo_circle.png'
    case AggregatorType.Kyber:
      return '/images/aggregators/kyber_logo.png'
    case AggregatorType.OpenOcean:
      return '/images/aggregators/openocean.avif'
    case AggregatorType.Nordstern:
      return '/images/aggregators/nordstern.svg'
    default:
      return type
  }
}

function MetaAggregatorControl(): JSX.Element {
  const { t } = useTranslation()
  const { selectedAggregators = DEFAULT_AGGREGATORS } = useTransactionSettingsContext()

  const isDefault =
    DEFAULT_AGGREGATORS.length === selectedAggregators.length &&
    DEFAULT_AGGREGATORS.every((a) => selectedAggregators.includes(a))

  return (
    <Text
      color="$neutral2"
      flexWrap="wrap"
      variant="subheading2"
      $group-hover={{
        color: '$neutral2Hovered',
      }}
    >
      {isDefault ? t('common.default') : t('common.custom')}
    </Text>
  )
}

function MetaAggregatorPreviewIcon({ aggregators }: { aggregators: AggregatorType[] }): JSX.Element {
  const prioritizedAggregators = HEADER_PREVIEW_AGGREGATORS.filter((aggregator) => aggregators.includes(aggregator))
  const fallbackAggregators = HEADER_PREVIEW_AGGREGATORS.filter(
    (aggregator) => !prioritizedAggregators.includes(aggregator),
  )
  const previewAggregators = [...prioritizedAggregators, ...fallbackAggregators].slice(0, 4)

  return (
    <Flex
      alignItems="center"
      flexDirection="row"
      flexWrap="wrap"
      gap={2}
      height={22}
      justifyContent="center"
      width={22}
    >
      {previewAggregators.map((aggregator) => (
        <Flex
          key={aggregator}
          backgroundColor="$surface1"
          borderColor="$surface3"
          borderRadius="$roundedFull"
          borderWidth="$spacing1"
          height={10}
          overflow="hidden"
          width={10}
        >
          <img
            src={getAggregatorLogo(aggregator)}
            alt={getAggregatorName(aggregator)}
            width={10}
            height={10}
            style={{ display: 'block', objectFit: 'cover' }}
          />
        </Flex>
      ))}
    </Flex>
  )
}

function MetaAggregatorHeaderButton({ onPress }: { onPress: () => void }): JSX.Element {
  const { selectedAggregators = DEFAULT_AGGREGATORS } = useTransactionSettingsContext()

  return (
    <TouchableArea onPress={onPress}>
      <Flex
        centered
        row
        backgroundColor="$surface3"
        borderRadius="$roundedFull"
        gap="$spacing4"
        px="$spacing8"
        py="$spacing4"
        height="$spacing32"
      >
        <MetaAggregatorPreviewIcon aggregators={selectedAggregators} />
        <Text color="$neutral2" variant="buttonLabel3">
          ({selectedAggregators.length})
        </Text>
      </Flex>
    </TouchableArea>
  )
}

function MetaAggregatorScreen(): JSX.Element {
  const { selectedAggregators = DEFAULT_AGGREGATORS, updateTransactionSettings } = useTransactionSettingsContext()

  const toggleAggregator = useCallback(
    (aggregator: AggregatorType) => {
      let newSelected: AggregatorType[]
      if (selectedAggregators.includes(aggregator)) {
        newSelected = selectedAggregators.filter((a) => a !== aggregator)
      } else {
        newSelected = [...selectedAggregators, aggregator]
      }
      updateTransactionSettings({ selectedAggregators: newSelected })
    },
    [selectedAggregators, updateTransactionSettings],
  )

  return (
    <Flex gap="$spacing16" py="$spacing12" width="100%">
      <Text variant="body2" color="$neutral2" px="$spacing16" mb="$spacing8" width="100%">
        Select which aggregators to use for finding the best price.
      </Text>
      {ALL_AGGREGATORS.map((aggregator) => (
        <Flex
          key={aggregator}
          row
          alignItems="center"
          justifyContent="space-between"
          px="$spacing16"
          py="$spacing4"
          gap="$spacing8"
          width="100%"
        >
          <Flex row alignItems="center" gap="$spacing8" flex={1} minWidth={0}>
            <img src={`${getAggregatorLogo(aggregator)}`} alt={getAggregatorName(aggregator)} width={30} height={30} />
            <Text variant="subheading1" color="$neutral1" numberOfLines={1} textOverflow="ellipsis" whiteSpace="nowrap">
              {getAggregatorName(aggregator)}
            </Text>
          </Flex>
          <Switch
            variant="branded"
            checked={selectedAggregators.includes(aggregator)}
            onCheckedChange={() => toggleAggregator(aggregator)}
          />
        </Flex>
      ))}
    </Flex>
  )
}

export const MetaAggregator: TransactionSettingConfig = {
  renderTitle: (t) => t('swap.settings.metaAggregators.title'),
  HeaderButton: MetaAggregatorHeaderButton,
  Control() {
    return <MetaAggregatorControl />
  },
  Screen() {
    return <MetaAggregatorScreen />
  },
}
