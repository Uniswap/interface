import { PageType, useIsPage } from 'hooks/useIsPage'
import { useMemo } from 'react'
import { ArrowUpRight } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { ClickableTamaguiStyle, ExternalLink } from 'theme/components'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { ElementAfterText, Flex, Text, TouchableArea, TouchableAreaEvent, useSporeColors } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { opacify } from 'ui/src/theme'
import { CardImage } from 'uniswap/src/components/cards/image'
import { NewTag } from 'uniswap/src/components/pill/NewTag'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useIsBridgingChain } from 'uniswap/src/features/bridging/hooks/chains'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useIsSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export function SwapBottomCard() {
  const { chainId: oldFlowChainId } = useMultichainContext()
  const { swapInputChainId: newFlowChainId } = useUniswapContext()
  const chainId = newFlowChainId ?? oldFlowChainId

  const isSupportedChain = useIsSupportedChainId(chainId)

  const isBridgingSupportedChain = useIsBridgingChain(chainId ?? UniverseChainId.Mainnet)

  const isSwapPage = useIsPage(PageType.SWAP)
  const isSendPage = useIsPage(PageType.SEND)

  const hideCard = true || !isSupportedChain || !(isSwapPage || isSendPage)

  const card = useMemo(() => {
    if (hideCard) {
      return null
    }

    if (!isBridgingSupportedChain) {
      return <MaybeExternalBridgeCard chainId={chainId} />
    } else {
      return null
    }
  }, [chainId, hideCard, isBridgingSupportedChain])

  return <>{card}</>
}

// keeping this code for any future web banners
// eslint-disable-next-line import/no-unused-modules
export function ImagePromoBanner({
  title,
  subtitle,
  image,
  isNew = false,
  onDismiss,
  onPress,
}: {
  title: string
  subtitle: string
  image: any
  isNew?: boolean
  onDismiss: () => void
  onPress: () => void
}): JSX.Element {
  return (
    <TouchableArea {...ClickableTamaguiStyle} onPress={onPress}>
      <CardInner
        isAbsoluteImage
        image={
          <Flex height="100%">
            <CardImage uri={image} />
          </Flex>
        }
        title={title}
        onDismiss={onDismiss}
        subtitle={subtitle}
        isNew={isNew}
      />
    </TouchableArea>
  )
}

interface ChainTheme {
  bgColor: string
  textColor: string
}

const CHAIN_THEME_LIGHT: Record<UniverseChainId, ChainTheme> = {
  [UniverseChainId.Mainnet]: { bgColor: '#6B8AFF33', textColor: '#6B8AFF' },
  [UniverseChainId.SmartBCH]: { bgColor: '#74DD54', textColor: '#fff' },
}

const CHAIN_THEME_DARK: Record<UniverseChainId, ChainTheme> = {
  ...CHAIN_THEME_LIGHT,
}

function useChainTheme(chainId: UniverseChainId): ChainTheme {
  const isDarkMode = useIsDarkMode()
  return isDarkMode ? CHAIN_THEME_LIGHT[chainId] : CHAIN_THEME_DARK[chainId]
}

function MaybeExternalBridgeCard({ chainId }: { chainId: UniverseChainId }) {
  const { t } = useTranslation()

  const { bgColor, textColor } = useChainTheme(chainId)
  const chainInfo = getChainInfo(chainId)
  const logoUri = chainInfo.logo as string

  return chainInfo.bridge ? (
    <ExternalLink href={chainInfo.bridge}>
      <CardInner
        image={<img width="40px" height="40px" style={{ borderRadius: '12px' }} src={logoUri} />}
        title={t('token.bridge', { label: chainInfo.label })}
        subtitle={t('common.deposit.toNetwork', { label: chainInfo.label })}
        textColor={textColor}
        backgroundColor={bgColor}
      />
    </ExternalLink>
  ) : null
}

const ICON_SIZE = 20
const ICON_SIZE_PX = `${ICON_SIZE}px`

function CardInner({
  image,
  isAbsoluteImage = false,
  backgroundColor,
  textColor,
  title,
  subtitle,
  onDismiss,
  isNew = false,
}: {
  title: string
  subtitle: string
  image: JSX.Element | null
  isAbsoluteImage?: boolean
  backgroundColor?: string
  textColor?: string
  isNew?: boolean
  onDismiss?: () => void
}) {
  const colors = useSporeColors()

  return (
    <Flex
      row
      grow
      overflow="hidden"
      borderWidth="$spacing1"
      borderColor={backgroundColor ?? opacify(0.05, colors.surface3.val)}
      backgroundColor={backgroundColor ?? '$surface1'}
      alignItems="center"
      pl={isAbsoluteImage ? '$none' : '$spacing12'}
      borderRadius="$rounded20"
      justifyContent="space-between"
      width="100%"
    >
      {image}
      <Flex row fill alignItems="center" p="$spacing12" pl={isAbsoluteImage ? '$spacing48' : '$spacing12'}>
        <Flex fill alignContent="center">
          <ElementAfterText
            text={title}
            textProps={{ color: textColor ?? '$neutral1', variant: 'subheading2' }}
            element={isNew ? <NewTag /> : undefined}
          />
          <Flex $md={{ display: 'none' }}>
            <Text variant="body4" color={textColor ?? '$neutral2'}>
              {subtitle}
            </Text>
          </Flex>
        </Flex>
        {onDismiss ? (
          <TouchableArea
            alignSelf="flex-start"
            $md={{ alignSelf: 'center' }}
            hitSlop={ICON_SIZE}
            onPress={(e: TouchableAreaEvent) => {
              e.stopPropagation()
              onDismiss()
            }}
          >
            <X color="$neutral3" size={ICON_SIZE} />
          </TouchableArea>
        ) : (
          <TouchableArea alignSelf="flex-start" $md={{ alignSelf: 'center' }}>
            <ArrowUpRight width={ICON_SIZE_PX} height={ICON_SIZE_PX} color={textColor} />
          </TouchableArea>
        )}
      </Flex>
    </Flex>
  )
}
