import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { ReceiveModalState } from 'components/ReceiveCryptoModal/types'
import { useOpenReceiveCryptoModal } from 'components/ReceiveCryptoModal/useOpenReceiveCryptoModal'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Flex, useIsDarkMode, useShadowPropsShort, useSporeColors } from 'ui/src'
import { ArrowDownCircle } from 'ui/src/components/icons/ArrowDownCircle'
import { Bank } from 'ui/src/components/icons/Bank'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import type { ActionCardItem } from 'uniswap/src/components/misc/ActionCard'
import { ActionCard } from 'uniswap/src/components/misc/ActionCard'
import type { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { useCexTransferProviders } from 'uniswap/src/features/fiatOnRamp/useCexTransferProviders'
import { getServiceProviderLogo } from 'uniswap/src/features/fiatOnRamp/utils'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { isExtensionApp } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'

const ICON_SIZE = 28
const ICON_SHIFT = 18
const EMPTY_WALLET_CARD_WIDTH = 464
const APP_PADDING = 16

function CEXTransferLogo({ providers }: { providers: FORServiceProvider[] }) {
  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()
  const displayProviders = providers.slice(0, 3)
  const totalLogos = displayProviders.length

  return (
    <Flex height={ICON_SIZE} width={totalLogos === 1 ? ICON_SIZE : ICON_SIZE + (totalLogos - 1) * ICON_SHIFT}>
      {displayProviders.map((provider, index) => (
        <Flex
          key={provider.serviceProvider}
          position="absolute"
          left={totalLogos === 1 ? 0 : index * ICON_SHIFT}
          borderRadius="$rounded8"
          zIndex={-index}
        >
          <img
            key={provider.serviceProvider}
            width={ICON_SIZE}
            height={ICON_SIZE}
            src={getServiceProviderLogo(provider.logos, isDarkMode)}
            alt={provider.name}
            style={{
              borderRadius: 8,
              borderWidth: 2,
              borderStyle: 'solid',
              borderColor: colors.surface1.val,
            }}
          />
        </Flex>
      ))}
    </Flex>
  )
}

export const EmptyWalletCards = (
  {
    horizontalLayout,
    growFullWidth,
    buyElementName,
    receiveElementName,
    cexTransferElementName,
  }: {
    horizontalLayout?: boolean
    growFullWidth?: boolean
    buyElementName: ElementName
    receiveElementName: ElementName
    cexTransferElementName: ElementName
  } = {
    horizontalLayout: false,
    growFullWidth: false,
    buyElementName: ElementName.EmptyStateBuy,
    receiveElementName: ElementName.EmptyStateReceive,
    cexTransferElementName: ElementName.EmptyStateCEXTransfer,
  },
): JSX.Element => {
  const { t } = useTranslation()
  const providers = useCexTransferProviders()
  const accountDrawer = useAccountDrawer()
  const navigate = useNavigate()
  const { fullWidth } = useDeviceDimensions()
  const shadowProps = useShadowPropsShort()

  const handleBuyCryptoClick = useEvent(() => {
    accountDrawer.close()
    navigate(`/buy`, isExtensionApp ? { replace: true } : undefined)
  })

  const handleReceiveCryptoClick = useOpenReceiveCryptoModal({
    modalState: ReceiveModalState.DEFAULT,
  })
  const handleCEXTransferClick = useOpenReceiveCryptoModal({
    modalState: ReceiveModalState.CEX_TRANSFER,
  })

  const options: ActionCardItem[] = useMemo(
    () => [
      {
        title: t('home.tokens.empty.action.buy.title'),
        blurb: t('home.tokens.empty.action.buy.description'),
        elementName: buyElementName,
        icon: <Bank color="$accent1" size="$icon.28" />,
        onPress: handleBuyCryptoClick,
      },
      {
        title: t('home.empty.transfer'),
        blurb: t('home.empty.transfer.description'),
        elementName: receiveElementName,
        icon: <ArrowDownCircle color="$accent1" size="$icon.28" />,
        onPress: handleReceiveCryptoClick,
      },
      ...(providers.length > 0
        ? [
            {
              title: t('home.empty.cexTransfer'),
              blurb: t('home.empty.cexTransfer.description'),
              elementName: cexTransferElementName,
              icon: <CEXTransferLogo providers={providers} />,
              onPress: handleCEXTransferClick,
            },
          ]
        : []),
    ],
    [
      providers,
      handleBuyCryptoClick,
      handleReceiveCryptoClick,
      handleCEXTransferClick,
      t,
      buyElementName,
      receiveElementName,
      cexTransferElementName,
    ],
  )

  // Determine layout mode
  const isScrollableLayout = horizontalLayout && !growFullWidth
  const isFullWidthLayout = horizontalLayout && growFullWidth
  const needsLeftOffset = isScrollableLayout && fullWidth < EMPTY_WALLET_CARD_WIDTH - APP_PADDING

  // Calculate outer container width
  const outerContainerWidth = isFullWidthLayout ? '100%' : horizontalLayout ? fullWidth : '100%'

  // Calculate inner grid width
  const innerGridWidth = isFullWidthLayout ? '100%' : horizontalLayout ? EMPTY_WALLET_CARD_WIDTH : '100%'

  // Scroll styles for scrollable layout
  const scrollStyles = isScrollableLayout
    ? {
        overflowX: 'scroll' as const,
        scrollbarWidth: 'none' as const,
        paddingBottom: 6,
      }
    : undefined

  return (
    <Flex position="relative" width="100%" animation="fast" animateEnterExit="fadeInDownOutDown">
      <Flex
        row
        left={needsLeftOffset ? -APP_PADDING : undefined}
        width={outerContainerWidth}
        position={isScrollableLayout ? 'absolute' : undefined}
        style={scrollStyles}
      >
        <Flex
          $platform-web={
            horizontalLayout
              ? {
                  display: 'grid',
                  gridTemplateColumns: providers.length > 0 ? '1fr 1fr 1fr' : '1fr 1fr',
                }
              : undefined
          }
          gap="$spacing12"
          width={innerGridWidth}
        >
          {options.map((option) => (
            <ActionCard
              key={option.title}
              {...option}
              leftAlign
              containerProps={horizontalLayout ? { gap: '$spacing8', px: '$spacing12' } : undefined}
              borderRadius={horizontalLayout ? '$rounded16' : undefined}
              shadowProps={shadowProps}
              hoverStyle={{
                backgroundColor: '$surface1Hovered',
                borderColor: '$surface3Hovered',
              }}
            />
          ))}
        </Flex>
        {isScrollableLayout && <Flex width={40} />}
      </Flex>
    </Flex>
  )
}
