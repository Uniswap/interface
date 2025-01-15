import React, { PropsWithChildren, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ImageBackground } from 'react-native'
import { useDispatch } from 'react-redux'
import { openModal } from 'src/features/modals/modalSlice'
import { Flex, useIsDarkMode, useShadowPropsShort } from 'ui/src'
import { CRYPTO_PURCHASE_BACKGROUND_DARK, CRYPTO_PURCHASE_BACKGROUND_LIGHT } from 'ui/src/assets'
import { ArrowDownCircle, Buy } from 'ui/src/components/icons'
import { borderRadii, iconSizes, spacing } from 'ui/src/theme'
import { ActionCard, ActionCardItem } from 'uniswap/src/components/misc/ActionCard'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useCexTransferProviders } from 'uniswap/src/features/fiatOnRamp/useCexTransferProviders'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { ScannerModalState } from 'wallet/src/components/QRCodeScanner/constants'
import { ImageUri } from 'wallet/src/features/images/ImageUri'

export function FundWalletModal({ onClose }: { onClose: () => void }): JSX.Element {
  const isDarkMode = useIsDarkMode()
  const shadowProps = useShadowPropsShort()
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const cexTransferProviders = useCexTransferProviders()

  const disableForKorea = useFeatureFlag(FeatureFlags.DisableFiatOnRampKorea)

  const BackgroundImageWrapperCallback = useCallback(
    ({ children }: { children: React.ReactNode }) => {
      return (
        <ImageBackground
          borderRadius={borderRadii.rounded24}
          source={isDarkMode ? CRYPTO_PURCHASE_BACKGROUND_DARK : CRYPTO_PURCHASE_BACKGROUND_LIGHT}
        >
          {children}
        </ImageBackground>
      )
    },
    [isDarkMode],
  )

  const onPressBuy = useCallback(() => {
    onClose()
    dispatch(
      openModal({
        name: disableForKorea ? ModalName.KoreaCexTransferInfoModal : ModalName.FiatOnRampAggregator,
      }),
    )
  }, [disableForKorea, onClose, dispatch])

  const onPressReceive = useCallback(() => {
    onClose()
    dispatch(
      openModal(
        cexTransferProviders.length > 0
          ? {
              name: ModalName.ReceiveCryptoModal,
              initialState: cexTransferProviders,
            }
          : {
              name: ModalName.WalletConnectScan,
              initialState: ScannerModalState.WalletQr,
            },
      ),
    )
  }, [cexTransferProviders, dispatch, onClose])

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
          BackgroundImageWrapperCallback,
        },
        {
          title: t('home.tokens.empty.action.receive.title'),
          blurb: t('home.tokens.empty.action.receive.description'),
          elementName: ElementName.EmptyStateReceive,
          icon:
            cexTransferProviders.length > 0 ? (
              <OverlappingLogos
                logos={[<ReceiveCryptoIcon />, ...cexTransferProviders.map((provider) => provider.logos.lightLogo)]}
              />
            ) : (
              <ArrowDownCircle color="$accent1" size="$icon.24" />
            ),
          onPress: onPressReceive,
        },
      ] satisfies ActionCardItem[],
    [BackgroundImageWrapperCallback, cexTransferProviders, onPressBuy, onPressReceive, t],
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
      borderWidth={2}
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
      borderWidth={1}
      overflow="hidden"
    >
      <ArrowDownCircle color="$accent1" size="$icon.24" />
    </Flex>
  )
}
