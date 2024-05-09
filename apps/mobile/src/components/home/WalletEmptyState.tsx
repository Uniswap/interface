import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ImageBackground,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  ViewStyle,
  VirtualizedList,
} from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import Trace from 'src/components/Trace/Trace'
import { openModal } from 'src/features/modals/modalSlice'
import { Flex, Text, TouchableArea, useIsDarkMode } from 'ui/src'
import { CRYPTO_PURCHASE_BACKGROUND_DARK, CRYPTO_PURCHASE_BACKGROUND_LIGHT } from 'ui/src/assets'
import { ArrowDownCircle, Buy as BuyIcon, PaperStack } from 'ui/src/components/icons'
import { borderRadii } from 'ui/src/theme'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { ScannerModalState } from 'wallet/src/components/QRCodeScanner/constants'
import { useCexTransferProviders } from 'wallet/src/features/fiatOnRamp/api'
import { ImageUri } from 'wallet/src/features/images/ImageUri'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'
import { ElementName, ElementNameType, ModalName } from 'wallet/src/telemetry/constants'

interface ActionCardItem {
  title: string
  blurb: string
  icon: JSX.Element
  backgroundImage?: ImageSourcePropType
  onPress: () => void
  elementName: ElementNameType
  badgeText?: string
}

enum ActionOption {
  Buy = 'Buy',
  Import = 'Import',
  Receive = 'Receive',
}

const ICON_SIZE = 28
const ICON_SHIFT = -10

export function WalletEmptyState(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const isDarkMode = useIsDarkMode()

  const activeAccount = useActiveAccount()
  const isViewOnly = activeAccount?.type === AccountType.Readonly
  const forAggregatorEnabled = useFeatureFlag(FeatureFlags.ForAggregator)
  const cexTransferEnabled = useFeatureFlag(FeatureFlags.CexTransfers)
  const cexTransferProviders = useCexTransferProviders(cexTransferEnabled)

  const options: { [key in ActionOption]: ActionCardItem } = useMemo(
    () => ({
      [ActionOption.Buy]: {
        title: t('home.tokens.empty.action.buy.title'),
        blurb: t('home.tokens.empty.action.buy.description'),
        elementName: ElementName.EmptyStateBuy,
        icon: <BuyIcon color="$accent1" size="$icon.28" />,
        backgroundImage: isDarkMode
          ? CRYPTO_PURCHASE_BACKGROUND_DARK
          : CRYPTO_PURCHASE_BACKGROUND_LIGHT,
        onPress: () =>
          dispatch(
            openModal({
              name: forAggregatorEnabled ? ModalName.FiatOnRampAggregator : ModalName.FiatOnRamp,
            })
          ),
      },
      [ActionOption.Receive]: {
        title: t('home.tokens.empty.action.receive.title'),
        blurb: t('home.tokens.empty.action.receive.description'),
        elementName: ElementName.EmptyStateReceive,
        icon:
          cexTransferProviders.length > 0 ? (
            <OverlappingLogos
              logos={cexTransferProviders.map((provider) => provider.logos.lightLogo)}
            />
          ) : (
            <ArrowDownCircle color="$accent1" size="$icon.28" />
          ),
        onPress: () =>
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
                  }
            )
          ),
      },
      [ActionOption.Import]: {
        title: t('home.tokens.empty.action.import.title'),
        blurb: t('home.tokens.empty.action.import.description'),
        elementName: ElementName.EmptyStateImport,
        icon: <PaperStack color="$accent1" size="$icon.28" />,
        onPress: () => dispatch(openModal({ name: ModalName.AccountSwitcher })),
      },
    }),
    [t, isDarkMode, cexTransferProviders, dispatch, forAggregatorEnabled]
  )

  // Order options based on view only status
  const sortedOptions = isViewOnly ? [options.Import] : [options.Buy, options.Receive]

  return (
    <Flex gap="$spacing8">
      {sortedOptions.map((option) => (
        <ActionCard key={option.title} {...option} />
      ))}
    </Flex>
  )
}

const ActionCard = ({
  title,
  blurb,
  onPress,
  icon,
  elementName,
  backgroundImage,
}: ActionCardItem): JSX.Element => (
  <Trace logPress element={elementName}>
    <TouchableArea
      backgroundColor={backgroundImage ? undefined : '$surface1'}
      borderColor="$surface3"
      borderRadius="$rounded24"
      borderWidth={1}
      onPress={onPress}>
      <BackgroundWrapper backgroundImage={backgroundImage}>
        <Flex centered shrink alignContent="center" gap="$spacing4" px="$spacing20" py="$spacing12">
          {icon}
          <Flex centered shrink alignContent="center">
            <Text textAlign="center" variant="buttonLabel3">
              {title}
            </Text>
            <Text color="$neutral2" textAlign="center" variant="body3">
              {blurb}
            </Text>
          </Flex>
        </Flex>
      </BackgroundWrapper>
    </TouchableArea>
  </Trace>
)

const BackgroundWrapper = ({
  children,
  backgroundImage,
}: {
  children: React.ReactNode
  backgroundImage?: ImageSourcePropType
}): JSX.Element => {
  return backgroundImage !== undefined ? (
    <ImageBackground borderRadius={borderRadii.rounded24} source={backgroundImage}>
      {children}
    </ImageBackground>
  ) : (
    <Flex>{children}</Flex>
  )
}

function ReceiveCryptoIcon(): JSX.Element {
  return (
    <Flex
      key="ReceiveCryptoIcon"
      centered
      shrink
      backgroundColor="$surface1"
      style={{
        ...styles.iconContainer,
        borderRadius: borderRadii.roundedFull,
      }}>
      <ArrowDownCircle
        color="$accent1"
        style={{
          borderRadius: borderRadii.roundedFull,
          height: ICON_SIZE - 2,
          width: ICON_SIZE - 2,
        }}
      />
    </Flex>
  )
}

function ServiceProviderLogo({ uri }: { uri: string }): JSX.Element {
  return (
    <Flex
      key={uri}
      centered
      shrink
      animation="quick"
      backgroundColor="$surface1"
      borderColor="$surface1"
      borderWidth={2}
      enterStyle={{ opacity: 0 }}
      exitStyle={{ opacity: 0 }}
      style={styles.iconContainer}>
      <ImageUri
        imageStyle={{
          borderRadius: borderRadii.rounded8,
          height: ICON_SIZE - 3,
          overflow: 'hidden',
          width: ICON_SIZE - 3,
        }}
        resizeMode="cover"
        uri={uri}
      />
    </Flex>
  )
}

function renderItem({ item }: { item: string }): JSX.Element {
  return item === 'icon' ? <ReceiveCryptoIcon /> : <ServiceProviderLogo uri={item} />
}

function keyExtractor(item: string): string {
  return item
}

/*
 * Set the zIndex to -index to reverse the order of the elements.
 */
const LogoRendererComponent = ({
  children,
  index,
  style,
  ...props
}: {
  children: React.ReactNode
  index: number
  style: StyleProp<ViewStyle>
}): JSX.Element => {
  const cellStyle = [style, { zIndex: -index }]

  return (
    <Flex style={cellStyle} {...props}>
      {children}
    </Flex>
  )
}

function OverlappingLogos({ logos }: { logos: string[] }): JSX.Element {
  const getItem = (_data: unknown, index: number): string => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return index === 0 ? 'icon' : logos[index - 1]!
  }

  const getItemCount = (): number => {
    return logos.length + 1
  }

  return (
    <Flex height={ICON_SIZE}>
      <VirtualizedList<string>
        horizontal
        CellRendererComponent={LogoRendererComponent}
        contentContainerStyle={{
          paddingRight: -ICON_SHIFT,
        }}
        getItem={getItem}
        getItemCount={getItemCount}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
      />
    </Flex>
  )
}

const styles = StyleSheet.create({
  iconContainer: {
    borderRadius: borderRadii.rounded8,
    height: ICON_SIZE,
    marginRight: ICON_SHIFT,
    overflow: 'hidden',
    width: ICON_SIZE,
  },
})
