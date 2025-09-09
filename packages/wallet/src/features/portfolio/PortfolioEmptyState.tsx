import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageBackground, ImageSourcePropType, StyleProp, StyleSheet, ViewStyle, VirtualizedList } from 'react-native'
import { Flex, useIsDarkMode } from 'ui/src'
import { CRYPTO_PURCHASE_BACKGROUND_DARK, CRYPTO_PURCHASE_BACKGROUND_LIGHT } from 'ui/src/assets'
import { ArrowDownCircle, Buy as BuyIcon, PaperStack } from 'ui/src/components/icons'
import { borderRadii } from 'ui/src/theme'
import { ActionCard, ActionCardItem } from 'uniswap/src/components/misc/ActionCard'
import { ImageUri } from 'uniswap/src/components/nfts/images/ImageUri'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useCexTransferProviders } from 'uniswap/src/features/fiatOnRamp/useCexTransferProviders'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'

enum ActionOption {
  Buy = 'Buy',
  Import = 'Import',
  Receive = 'Receive',
}

const ICON_SIZE = 28
const ICON_SHIFT = -10

type WalletEmptyStateProps = {
  onPressReceive: () => void
  // Buying and importing are optionally supported
  onPressImport?: () => void
  onPressBuy?: () => void
  // If buy is supported but not from a cex like on the extension
  disableCexTransfers?: boolean
}

export function PortfolioEmptyState({
  onPressReceive,
  onPressImport,
  onPressBuy,
  disableCexTransfers = false,
}: WalletEmptyStateProps): JSX.Element {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()

  const activeAccount = useActiveAccount()
  const isViewOnly = activeAccount?.type === AccountType.Readonly
  const cexTransferProviders = useCexTransferProviders({ isDisabled: disableCexTransfers })

  const BackgroundImageWrapperCallback = useCallback(
    ({ children }: { children: React.ReactNode }) => {
      return (
        <BackgroundImage image={isDarkMode ? CRYPTO_PURCHASE_BACKGROUND_DARK : CRYPTO_PURCHASE_BACKGROUND_LIGHT}>
          {children}
        </BackgroundImage>
      )
    },
    [isDarkMode],
  )

  const options: { [key in ActionOption]: ActionCardItem } = useMemo(
    () => ({
      [ActionOption.Buy]: {
        title: t('home.tokens.empty.action.buy.title'),
        blurb: t('home.tokens.empty.action.buy.description'),
        elementName: ElementName.EmptyStateBuy,
        icon: <BuyIcon color="$accent1" size="$icon.28" />,
        onPress: onPressBuy,
        BackgroundImageWrapperCallback,
      },
      [ActionOption.Receive]: {
        title: t('home.tokens.empty.action.receive.title'),
        blurb: t('home.tokens.empty.action.receive.description'),
        elementName: ElementName.EmptyStateReceive,
        icon:
          cexTransferProviders.length > 0 ? (
            <OverlappingLogos logos={cexTransferProviders.map((provider) => provider.logos.lightLogo)} />
          ) : (
            <ArrowDownCircle color="$accent1" size="$icon.28" />
          ),
        onPress: onPressReceive,
      },
      [ActionOption.Import]: {
        title: t('home.tokens.empty.action.import.title'),
        blurb: t('home.tokens.empty.action.import.description'),
        elementName: ElementName.EmptyStateImport,
        icon: <PaperStack color="$accent1" size="$icon.28" />,
        onPress: onPressImport,
      },
    }),
    [t, onPressBuy, BackgroundImageWrapperCallback, cexTransferProviders, onPressReceive, onPressImport],
  )

  // Order options based on view only status, and wether we have a valid buy handler
  const sortedOptions =
    isViewOnly && onPressImport ? [options.Import] : [...(onPressBuy ? [options.Buy] : []), options.Receive]

  return (
    <Flex gap="$spacing8">
      {sortedOptions.map((option) => (
        <ActionCard key={option.title} {...option} />
      ))}
    </Flex>
  )
}

const BackgroundImage = ({
  children,
  image,
}: {
  children: React.ReactNode
  image: ImageSourcePropType
}): JSX.Element => {
  return (
    <ImageBackground borderRadius={borderRadii.rounded24} source={image}>
      {children}
    </ImageBackground>
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
      }}
    >
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
      borderWidth="$spacing2"
      enterStyle={{ opacity: 0 }}
      exitStyle={{ opacity: 0 }}
      style={styles.iconContainer}
    >
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
