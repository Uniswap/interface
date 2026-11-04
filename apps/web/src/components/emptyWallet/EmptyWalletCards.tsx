import { Flex } from '@universe/mycelium'
import { ENTER_PRESET_CLASSES } from '@universe/mycelium/compat'
import { useShadowPropsShort, useDeviceDimensions } from '@universe/mycelium/theme-hooks-compat'
import { ActionCard } from 'uniswap/src/components/misc/ActionCard'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { useAddFundsOptions } from '~/components/emptyWallet/AddFundsOptions'
import { edgeFadeMaskStyle, useHorizontalScrollFades } from '~/hooks/useHorizontalScrollFades'

const EMPTY_WALLET_CARD_WIDTH = 464
const APP_PADDING = 16

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
  const { fullWidth } = useDeviceDimensions()
  const shadowProps = useShadowPropsShort()
  const { scrollerRef, edgeFades } = useHorizontalScrollFades()
  const { options, providers } = useAddFundsOptions({ buyElementName, receiveElementName, cexTransferElementName })

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
        ...edgeFadeMaskStyle(edgeFades),
      }
    : undefined

  return (
    <Flex position="relative" width="100%" className={ENTER_PRESET_CLASSES.fadeInDown}>
      <Flex
        ref={isScrollableLayout ? scrollerRef : undefined}
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
