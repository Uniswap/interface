import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import React, { PropsWithChildren, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native'
import { useDispatch } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { useOpenReceiveModal } from 'src/features/modals/hooks/useOpenReceiveModal'
import { openModal } from 'src/features/modals/modalSlice'
import { Flex, useShadowPropsShort } from 'ui/src'
import { ArrowDownCircle, Buy } from 'ui/src/components/icons'
import { borderRadii, iconSizes, spacing } from 'ui/src/theme'
import { ActionCard, ActionCardItem } from 'uniswap/src/components/misc/ActionCard'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ImageUri } from 'uniswap/src/components/nfts/images/ImageUri'
import { useCexTransferProviders } from 'uniswap/src/features/fiatOnRamp/useCexTransferProviders'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { usePortfolioEmptyStateBackground } from 'wallet/src/components/portfolio/empty'

export function FundWalletModal(): JSX.Element {
  const shadowProps = useShadowPropsShort()
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const cexTransferProviders = useCexTransferProviders()
  const openReceiveModal = useOpenReceiveModal()

  const { onClose } = useReactNavigationModal()

  const disableForKorea = useFeatureFlag(FeatureFlags.DisableFiatOnRampKorea)

  const backgroundImageWrapperCallback = usePortfolioEmptyStateBackground()

  const onPressBuy = useCallback(() => {
    onClose()
    disableForKorea
      ? navigate(ModalName.KoreaCexTransferInfoModal)
      : dispatch(
          openModal({
            name: ModalName.FiatOnRampAggregator,
          }),
        )
  }, [disableForKorea, onClose, dispatch])

  const onPressReceive = useCallback(() => {
    onClose()
    openReceiveModal()
  }, [onClose, openReceiveModal])

  const cards = useMemo(
    () =>
      [
        {
          title: t('home.tokens.empty.action.buy.title'),
          blurb: t('home.tokens.empty.action.buy.description'),
          elementName: ElementName.EmptyStateBuy,
          // Intentionally sized differently per designs because this icon has more vertical padding than others
          icon: (
            <Flex my={-spacing.spacing4}>
              <Buy color="$accent1" size="$icon.28" />
            </Flex>
          ),
          onPress: onPressBuy,
          backgroundImageWrapperCallback,
        },
        {
          title: t('home.tokens.empty.action.receive.title'),
          blurb: t('home.tokens.empty.action.receive.description'),
          elementName: ElementName.EmptyStateReceive,
          icon:
            cexTransferProviders.length > 0 ? (
              <OverlappingLogos
                // biome-ignore lint/correctness/useJsxKeyInIterable: Array items are static and don't require keys
                logos={[<ReceiveCryptoIcon />, ...cexTransferProviders.map((provider) => provider.logos.lightLogo)]}
              />
            ) : (
              <ArrowDownCircle color="$accent1" size="$icon.24" />
            ),
          onPress: onPressReceive,
        },
      ] satisfies ActionCardItem[],
    [backgroundImageWrapperCallback, cexTransferProviders, onPressBuy, onPressReceive, t],
  )
  return (
    <Modal name={ModalName.FundWallet} onClose={onClose}>
      <Flex gap="$spacing12" pb="$spacing12" px="$spacing16">
        {cards.map((card) => (
          <ActionCard
            key={card.title}
            {...card}
            containerProps={{
              ...shadowProps,
              py: '$spacing20',
              px: '$spacing20',
            }}
          />
        ))}
      </Flex>
    </Modal>
  )
}

const ICON_SHIFT = 10

function OverlappingLogos({ logos }: { logos: (string | JSX.Element)[] }): JSX.Element {
  return (
    <Flex height={iconSizes.icon24}>
      <FlatList
        horizontal
        CellRendererComponent={LogoRendererComponent}
        contentContainerStyle={{
          paddingEnd: -ICON_SHIFT,
          marginEnd: ICON_SHIFT,
        }}
        data={logos}
        renderItem={({ item }) => (typeof item === 'string' ? <ServiceProviderLogo uri={item} /> : item)}
      />
    </Flex>
  )
}

/*
 * Set the zIndex to -index to reverse the order of the elements.
 */
const LogoRendererComponent = ({
  children,
  index,
}: PropsWithChildren<{
  index: number
}>): JSX.Element => {
  return (
    <Flex
      centered
      animation="quick"
      enterStyle={{ opacity: 0 }}
      exitStyle={{ opacity: 0 }}
      marginEnd={-ICON_SHIFT}
      zIndex={-index}
    >
      {children}
    </Flex>
  )
}

function ServiceProviderLogo({ uri }: { uri: string }): JSX.Element {
  return (
    <Flex
      backgroundColor="$surface1"
      borderColor="$surface1"
      borderRadius="$rounded8"
      borderWidth="$spacing2"
      overflow="hidden"
    >
      <ImageUri
        imageStyle={{
          borderRadius: borderRadii.rounded8,
          height: iconSizes.icon24,
          width: iconSizes.icon24,
        }}
        resizeMode="cover"
        uri={uri}
      />
    </Flex>
  )
}

function ReceiveCryptoIcon(): JSX.Element {
  return (
    <Flex
      backgroundColor="$surface1"
      borderColor="$surface1"
      borderRadius="$roundedFull"
      borderWidth="$spacing1"
      overflow="hidden"
    >
      <ArrowDownCircle color="$accent1" size="$icon.24" />
    </Flex>
  )
}
