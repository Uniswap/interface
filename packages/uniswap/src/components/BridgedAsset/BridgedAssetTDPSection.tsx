import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { InfoCircle } from 'ui/src/components/icons/InfoCircle'
import { OneToOne } from 'ui/src/components/icons/OneToOne'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

export function BridgedAssetTDPSection({
  currencyInfo,
  onPress,
}: {
  currencyInfo: CurrencyInfo
  onPress: () => void
}): JSX.Element | null {
  const { t } = useTranslation()
  const chainName = getChainLabel(currencyInfo.currency.chainId)
  if (!currencyInfo.currency.symbol) {
    return null
  }
  return (
    <Trace logPress element={ElementName.BridgedAssetTDPSection}>
      <TouchableArea onPress={onPress}>
        <Flex
          row
          p="$spacing12"
          gap="$spacing12"
          alignItems="flex-start"
          borderRadius="$rounded20"
          borderColor="$surface3"
          borderWidth="$spacing1"
          hoverStyle={{ opacity: 0.8 }}
        >
          <OneToOne color="$accent1" size="$icon.20" />
          <Flex flex={1}>
            <Text variant="body3" color="$neutral1">
              {t('bridgedAsset.modal.title', { currencySymbol: currencyInfo.currency.symbol, chainName })}
            </Text>
            <Text variant="body4" color="$neutral2" textWrap="wrap" whiteSpace="wrap">
              {t('bridgedAsset.tdp.description', { currencySymbol: currencyInfo.currency.symbol })}
            </Text>
          </Flex>
          <InfoCircle color="$neutral2" size="$icon.16" alignSelf="center" />
        </Flex>
      </TouchableArea>
    </Trace>
  )
}
