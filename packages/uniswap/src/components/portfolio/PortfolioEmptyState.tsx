import { CellContainer, FlashList } from '@shopify/flash-list'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { StyleProp, ViewStyle } from 'react-native'
import { Flex } from 'ui/src'
import { ArrowDownCircle } from 'ui/src/components/icons/ArrowDownCircle'
import { Buy as BuyIcon } from 'ui/src/components/icons/Buy'
import { PaperStack } from 'ui/src/components/icons/PaperStack'
import { borderRadii } from 'ui/src/theme'
import { ActionCard, ActionCardItem } from 'uniswap/src/components/misc/ActionCard'
import { ImageUri } from 'uniswap/src/components/nfts/images/ImageUri'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useCexTransferProviders } from 'uniswap/src/features/fiatOnRamp/useCexTransferProviders'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'

enum ActionOption {
  Buy = 'Buy',
  Import = 'Import',
  Receive = 'Receive',
}

const ICON_SIZE = 28
const ICON_SHIFT = -10

type PortfolioEmptyStateProps = {
  onPressReceive: () => void
  // Buying and importing are optionally supported
  onPressImport?: () => void
  onPressBuy?: () => void
  backgroundImageWrapperCallback?: React.FC<{ children: React.ReactNode }>
  // If buy is supported but not from a cex like on the extension
  disableCexTransfers?: boolean
}

export function PortfolioEmptyState({
  onPressReceive,
  onPressImport,
  onPressBuy,
  backgroundImageWrapperCallback,
  disableCexTransfers = false,
}: PortfolioEmptyStateProps): JSX.Element {
  const { t } = useTranslation()

  const { evmAccount } = useWallet()
  const isViewOnly = !evmAccount || evmAccount.accountType === AccountType.Readonly
  const cexTransferProviders = useCexTransferProviders({ isDisabled: disableCexTransfers })

  const options: { [key in ActionOption]: ActionCardItem } = useMemo(
    () => ({
      [ActionOption.Buy]: {
        title: t('home.tokens.empty.action.buy.title'),
        blurb: t('home.tokens.empty.action.buy.description'),
        elementName: ElementName.EmptyStateBuy,
        icon: <BuyIcon color="$accent1" size="$icon.28" />,
        onPress: onPressBuy,
        backgroundImageWrapperCallback,
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
    [t, onPressBuy, backgroundImageWrapperCallback, cexTransferProviders, onPressReceive, onPressImport],
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

function ReceiveCryptoIcon(): JSX.Element {
  return (
    <Flex
      key="ReceiveCryptoIcon"
      centered
      shrink
      backgroundColor="$surface1"
      style={{
        ...iconContainerStyle,
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
      style={iconContainerStyle}
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
    <CellContainer index={index} style={cellStyle} {...props}>
      {children}
    </CellContainer>
  )
}

function renderItem({ item }: { item: string }): JSX.Element {
  return item === 'icon' ? <ReceiveCryptoIcon /> : <ServiceProviderLogo uri={item} />
}

function OverlappingLogos({ logos }: { logos: string[] }): JSX.Element {
  return (
    <Flex height={ICON_SIZE}>
      <FlashList
        horizontal
        CellRendererComponent={LogoRendererComponent}
        contentContainerStyle={{
          paddingRight: -ICON_SHIFT,
        }}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        data={['icon', ...logos]}
      />
    </Flex>
  )
}

const iconContainerStyle = {
  borderRadius: borderRadii.rounded8,
  height: ICON_SIZE,
  marginRight: ICON_SHIFT,
  overflow: 'hidden',
  width: ICON_SIZE,
}
