import { SharedEventName } from '@uniswap/analytics-events'
import { chainIdToPlatform, Platform, type UniverseChainId } from '@universe/chains'
import { Flex, iconSizes, Text, useIsTouchDevice } from '@universe/mycelium'
import { TestID } from '@universe/test'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { ExplorerDataType, getExplorerLink, openUri } from 'uniswap/src/utils/linking'
import { NumberType } from 'utilities/src/format/types'
import { useCopyClipboard } from 'utilities/src/react/useCopyClipboard'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import {
  HoverCard,
  HoverCardArmOnHover,
  type HoverCardPlacement,
  useHoverCardState,
} from '~/components/HoverCard/HoverCard'
import { HoverCardBody } from '~/components/HoverCard/HoverCardContent'

interface WalletHoverCardProps {
  address?: string
  /** Picks the address platform for the balance query and the explorer the header links to. */
  chainId: UniverseChainId
  placement?: HoverCardPlacement
  offset?: number
  offsetFromScrollContainerEdge?: boolean
  childOwnsPressFeedback?: boolean
  children: ReactNode
}

export function useShowsWalletHoverCard(address?: string): boolean {
  const isTouchDevice = useIsTouchDevice()
  return Boolean(address) && !isTouchDevice
}

export function WalletHoverCard({ address, children, ...props }: WalletHoverCardProps): JSX.Element {
  const showsHoverCard = useShowsWalletHoverCard(address)

  if (!address || !showsHoverCard) {
    return <>{children}</>
  }

  return (
    <HoverCardArmOnHover
      childOwnsPressFeedback={props.childOwnsPressFeedback}
      renderMounted={() => (
        <MountedWalletHoverCard address={address} {...props}>
          {children}
        </MountedWalletHoverCard>
      )}
    >
      {children}
    </HoverCardArmOnHover>
  )
}

function MountedWalletHoverCard({
  address,
  chainId,
  placement,
  offset,
  offsetFromScrollContainerEdge,
  childOwnsPressFeedback,
  children,
}: WalletHoverCardProps & { address: string }): JSX.Element {
  const { isOpen, onOpenChange } = useHoverCardState()

  return (
    <HoverCard
      isOpen={isOpen}
      placement={placement}
      offset={offset}
      offsetFromScrollContainerEdge={offsetFromScrollContainerEdge}
      childOwnsPressFeedback={childOwnsPressFeedback}
      content={<WalletHoverCardContent address={address} chainId={chainId} />}
      onOpenChange={onOpenChange}
    >
      {children}
    </HoverCard>
  )
}

/** Only rendered while the card is open, so closed rows don't hold the balance query or its selectors. */
function WalletHoverCardContent({ address, chainId }: { address: string; chainId: UniverseChainId }): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const [isCopied, copyToClipboard] = useCopyClipboard(ONE_SECOND_MS)
  const platform = chainIdToPlatform(chainId)

  const { data, error, loading } = usePortfolioTotalValue({
    evmAddress: platform === Platform.EVM ? address : undefined,
    svmAddress: platform === Platform.SVM ? address : undefined,
  })
  const isLoading = !data && loading && !error

  const handleCopyAddress = (): void => {
    copyToClipboard(address)
    dispatch(
      pushNotification({
        type: AppNotificationType.Copied,
        copyType: CopyNotificationType.Address,
      }),
    )
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.CopyAddress,
    })
  }

  const handleOpenExplorer = (): Promise<void> =>
    openUri({ uri: getExplorerLink({ chainId, data: address, type: ExplorerDataType.ADDRESS }) })

  return (
    <HoverCardBody
      identity={
        <AddressDisplay
          showAccountIcon
          address={address}
          size={iconSizes.icon32}
          variant="body3"
          captionVariant="body3"
          captionTextColor="$neutral2"
          horizontalGap="$spacing8"
          addressNumVisibleCharacters={4}
        />
      }
      isCopied={isCopied}
      explorerTestID={TestID.AddressHoverCardExplorerLink}
      onCopy={handleCopyAddress}
      onOpenExplorer={handleOpenExplorer}
    >
      <Flex gap="$spacing8" pt="$spacing4">
        <Flex row justifyContent="space-between" alignItems="center" gap="$spacing8">
          <Text variant="body3" color="$neutral2">
            {t('portfolio.tokens.table.column.balance')}
          </Text>
          <Text variant="body3" color="$neutral1" loading={isLoading} loadingPlaceholderText="$00,000.00">
            {convertFiatAmountFormatted(data?.balanceUSD, NumberType.PortfolioBalance)}
          </Text>
        </Flex>
        <Flex row justifyContent="space-between" alignItems="center" gap="$spacing8">
          <Text variant="body3" color="$neutral2">
            {t('portfolio.tokens.table.column.change1d')}
          </Text>
          <RelativeChange
            change={data?.percentChange}
            absoluteChange={data?.absoluteChangeUSD}
            loading={isLoading}
            variant="body3"
            arrowSize="$icon.12"
          />
        </Flex>
      </Flex>
    </HoverCardBody>
  )
}
