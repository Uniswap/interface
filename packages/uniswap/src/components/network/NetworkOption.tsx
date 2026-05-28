import { isWebPlatform } from '@universe/environment'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ElementAfterText, Flex, FlexProps, Text } from 'ui/src'
import { CheckmarkCircle } from 'ui/src/components/icons/CheckmarkCircle'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { NewTag } from 'uniswap/src/components/pill/NewTag'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const NETWORK_OPTION_ICON_SIZE = iconSizes.icon24
const OPTION_GAP = isWebPlatform ? '$spacing8' : '$spacing6'
const BACKGROUND_COLOR = '$surface2'

export function NetworkOption({
  chainId,
  currentlySelected,
  isNew,
  borderRadius = '$rounded8',
}: {
  chainId: UniverseChainId | null
  currentlySelected?: boolean
  isNew: boolean
  borderRadius?: FlexProps['borderRadius']
}): JSX.Element {
  const { t } = useTranslation()
  const info = chainId && getChainInfo(chainId)

  const content = useMemo(() => {
    if (!info?.label) {
      return (
        <Flex row gap="$spacing12">
          <NetworkLogo chainId={null} size={NETWORK_OPTION_ICON_SIZE} />
          <Text color="$neutral1" variant="body2">
            {t('transaction.network.all')}
          </Text>
        </Flex>
      )
    }

    return (
      <Flex row gap="$spacing12">
        <NetworkLogo chainId={chainId} size={NETWORK_OPTION_ICON_SIZE} />
        <ElementAfterText
          element={isNew ? <NewTag ml={OPTION_GAP} /> : undefined}
          text={info.label}
          textProps={{ color: '$neutral1', variant: 'body2' }}
        />
      </Flex>
    )
  }, [chainId, info?.label, isNew, t])

  return (
    <Flex
      row
      alignItems="center"
      justifyContent="space-between"
      px="$spacing8"
      py={10}
      hoverStyle={{ backgroundColor: BACKGROUND_COLOR, borderRadius }}
    >
      {content}
      <Flex centered height={NETWORK_OPTION_ICON_SIZE} width={NETWORK_OPTION_ICON_SIZE}>
        {currentlySelected && <CheckmarkCircle color="$neutral1" ml={OPTION_GAP} size="$icon.20" />}
      </Flex>
    </Flex>
  )
}
