import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ElementAfterText, Flex, Text, isWeb, useSporeColors } from 'ui/src'
import { CheckmarkCircle } from 'ui/src/components/icons/CheckmarkCircle'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { NewTag } from 'uniswap/src/components/pill/NewTag'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const NETWORK_OPTION_ICON_SIZE = iconSizes.icon24
const OPTION_GAP = isWeb ? '$spacing8' : '$spacing6'

export function NetworkOption({
  chainId,
  currentlySelected,
  isNew,
}: {
  chainId: UniverseChainId | null
  currentlySelected?: boolean
  isNew: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const info = chainId && getChainInfo(chainId)

  let content: ReactNode = null

  if (!info?.label) {
    content = (
      <Flex row gap="$spacing12">
        <NetworkLogo chainId={null} size={NETWORK_OPTION_ICON_SIZE} />
        <Text color="$neutral1" variant="body2">
          {t('transaction.network.all')}
        </Text>
      </Flex>
    )
  } else {
    content = (
      <Flex row gap="$spacing12">
        {(chainId && <NetworkLogo chainId={chainId} size={NETWORK_OPTION_ICON_SIZE} />) || (
          <Flex width={NETWORK_OPTION_ICON_SIZE} />
        )}
        <ElementAfterText
          element={isNew ? <NewTag ml={OPTION_GAP} /> : undefined}
          text={info.label}
          textProps={{ color: '$neutral1', variant: 'body2' }}
        />
      </Flex>
    )
  }

  return (
    <Flex row alignItems="center" justifyContent="space-between" px="$spacing8" py={10}>
      {content}
      <Flex centered height={NETWORK_OPTION_ICON_SIZE} width={NETWORK_OPTION_ICON_SIZE}>
        {currentlySelected && <CheckmarkCircle color={colors.neutral1.get()} ml={OPTION_GAP} size={iconSizes.icon20} />}
      </Flex>
    </Flex>
  )
}
