import { useQueries } from '@tanstack/react-query'
import { AddressStringFormat, normalizeAddress } from '@universe/chains'
import { Anchor, Flex, Text, TouchableArea, UniversalImage, iconSizes } from '@universe/mycelium'
import { CheckmarkCircle } from '@universe/mycelium/icons/CheckmarkCircle'
import { Person } from '@universe/mycelium/icons/Person'
import { TestID } from '@universe/test'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { LaunchProvenance } from 'uniswap/src/features/dataApi/launchProvenance'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { FORMAT_DATE_MEDIUM, useLocalizedDayjs } from 'uniswap/src/features/language/localizedDayjs'
import { AuctionEventName, ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { WalletHoverCard } from '~/components/HoverCard/WalletHoverCard/WalletHoverCard'
import {
  deriveCurrencyRaisedState,
  getAuctionCheckpointQuery,
} from '~/features/Toucan/Auction/hooks/useAuctionDisplayDataSources'
import { getAnalyticsLaunchMethod } from '~/features/Toucan/Auction/utils/provenanceAnalytics'
import {
  AuctionDisplayPhase,
  PoolAvailability,
  resolveAuctionPhase,
} from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import { getLaunchMethodCopy } from '~/features/Toucan/Shared/getLaunchMethodCopy'
import { LaunchMethodExplainerModal } from '~/features/Toucan/Shared/LaunchMethodExplainerModal'
import { LaunchMethodIcon } from '~/features/Toucan/Shared/LaunchMethodIcon'
import { getLaunchpadDestination, ProvenanceLaunchpadLink } from '~/features/Toucan/Shared/ProvenanceLaunchpadLink'
import { ProvenanceLaunchpadLogo } from '~/features/Toucan/Shared/ProvenanceLaunchpadLogo'
import { TokenDetailsAuctionListModal } from '~/pages/TokenDetails/components/auction/TokenDetailsAuctionListModal'
import {
  getTokenProvenanceData,
  type TokenProvenanceData,
} from '~/pages/TokenDetails/components/info/tokenProvenanceData'
import { TokenDetailsSourceState } from '~/pages/TokenDetails/context/tokenDetailsSourceState'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useTokenDetailsAuctionDisplay } from '~/pages/TokenDetails/hooks/useTokenDetailsAuctionDisplay'
import { useTokenDetailsAuctions } from '~/pages/TokenDetails/hooks/useTokenDetailsAuctions'
import { useTokenDetailsCcaAuctions } from '~/pages/TokenDetails/hooks/useTokenDetailsCcaAuctions'
import { sendTokenDetailsProvenanceEvent } from '~/pages/TokenDetails/utils/tokenDetailsProvenanceAnalytics'

type AuctionHistoryDestination = 'pools' | 'auction_details' | 'auction_list'

// One cell per row at phone width: two columns wrap a value onto a second line and leave the
// "· Details" link baseline-aligned to it.
function ProvenanceCell({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    <Flex flexBasis="33.33%" minWidth={0} gap="$spacing4" pr="$spacing16" $sm={{ flexBasis: '100%' }}>
      <Text variant="body3" color="$neutral2">
        {label}
      </Text>
      {children}
    </Flex>
  )
}

function CreatorAvatar({ avatarUrl }: { avatarUrl: string | undefined }): JSX.Element {
  return (
    <Flex
      width={20}
      height={20}
      borderRadius="$roundedFull"
      backgroundColor="$surface3"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      flexShrink={0}
    >
      {avatarUrl ? (
        <UniversalImage uri={avatarUrl} size={{ width: 20, height: 20 }} />
      ) : (
        <Person size="$icon.12" color="$neutral2" />
      )}
    </Flex>
  )
}

function AuctionCountBadge({ count }: { count: number }): JSX.Element {
  return (
    <Flex
      width={20}
      height={20}
      borderRadius="$roundedFull"
      backgroundColor="$surface3"
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
    >
      <Text variant="buttonLabel4" color="$neutral1">
        {count}
      </Text>
    </Flex>
  )
}

/**
 * The module belongs to the token, not to an auction: a launch the backend attributes is enough to
 * render it, and the creator and auction-history cells are added only where an auction backs them.
 */
export function TokenProvenance(): JSX.Element | null {
  const display = useTokenDetailsAuctionDisplay()
  const { auction, chainId, phase, poolAvailability, currencyRaised, currentBlock, provenance, isAuctionOnlyPending } =
    display
  const tokenAddress = useTDPStore((state) => state.address)
  const isAuctionLookupPending = useTDPStore((state) => state.auctionSource.status === TokenDetailsSourceState.Loading)
  // The history total counts every auction on the token; the selector lists only those with a page.
  const auctions = useTokenDetailsAuctions()
  const selectableAuctions = useTokenDetailsCcaAuctions()
  const hasMultipleAuctions = auctions.length > 1
  const hasSelector = selectableAuctions.length > 1
  const [isAuctionListOpen, setIsAuctionListOpen] = useState(false)
  const openAuctionList = useEvent(() => setIsAuctionListOpen(true))
  const closeAuctionList = useEvent(() => setIsAuctionListOpen(false))
  // One list builds the queries and the entries, so filtering it can never attribute a sibling's raise
  // to a different auction, and one `isEnded` gates both the fetch and the derived raise.
  const siblings = useMemo(
    () =>
      hasMultipleAuctions
        ? auctions.map((entry) => {
            const siblingPhase = resolveAuctionPhase({ auction: entry, currentBlock })
            // A live auction contributes the volume already committed to it, which the auction itself
            // carries, so only an ended one needs its checkpoint fetched.
            return { auction: entry, phase: siblingPhase, isEnded: siblingPhase === AuctionDisplayPhase.Ended }
          })
        : [],
    [auctions, currentBlock, hasMultipleAuctions],
  )
  const checkpoints = useQueries({
    queries: siblings.map((sibling) =>
      getAuctionCheckpointQuery({
        chainId: sibling.auction.chainId,
        auctionAddress: sibling.auction.address,
        enabled: sibling.isEnded,
      }),
    ),
  })
  // Keyed on the auction where there is one, so switching auctions is a new visit; otherwise on the
  // token, since a launchpad is shared by every token it launched and navigating between two of them
  // does not have to remount this module.
  const provenanceKey =
    auction && chainId !== undefined
      ? `${chainId}:${normalizeAddress(auction.address, AddressStringFormat.Lowercase)}`
      : provenance && `${provenance.launchpad.id}:${chainId}:${tokenAddress}`
  // Served attribution arrives with the token, ahead of the auction lookup, so without this the key
  // would settle on the launchpad and then flip to the auction — two impressions for one visit.
  // The lookup's own status carries that offline too, where `isAuctionOnlyPending` stops waiting.
  const isResolved =
    !isAuctionLookupPending &&
    !isAuctionOnlyPending &&
    (!auction || (phase !== AuctionDisplayPhase.Loading && poolAvailability !== PoolAvailability.Loading))
  const sendImpression = useEvent(() => {
    sendTokenDetailsProvenanceEvent({
      eventName: AuctionEventName.ProvenanceModuleViewed,
      display,
      entry_point: 'tdp_provenance_module',
      has_auction_history: hasMultipleAuctions || phase === AuctionDisplayPhase.Ended,
    })
  })
  const impression = useRef({ provenanceKey, sent: false })

  // One impression per selected auction once its display state has settled; later phase or pool
  // changes on the same auction are not new visits, while returning to an earlier auction is.
  useEffect(() => {
    if (impression.current.provenanceKey !== provenanceKey) {
      impression.current = { provenanceKey, sent: false }
    }
    if (provenanceKey && isResolved && !impression.current.sent) {
      impression.current.sent = true
      sendImpression()
    }
  }, [provenanceKey, isResolved, sendImpression])

  if (!provenance) {
    return null
  }

  // Nothing served carries a first-trade time, so the auction's creation date stands in for one and is
  // only shown once a pool exists — an upcoming or failed launch has never traded.
  const displayProvenance =
    poolAvailability === PoolAvailability.HasPool ? provenance : { ...provenance, launchedAt: undefined }

  const auctionData =
    auction && chainId !== undefined
      ? getTokenProvenanceData({
          auction,
          chainId,
          entries: hasMultipleAuctions
            ? siblings.map(({ isEnded, ...sibling }, index) => ({
                ...sibling,
                currencyRaised: deriveCurrencyRaisedState({ enabled: isEnded, checkpointQuery: checkpoints[index] }),
              }))
            : [{ auction, phase, currencyRaised }],
        })
      : undefined

  // Opening the history list is a selector event, not an ADP navigation; the ADP event fires on select.
  const onShowAuctions = (): void => {
    if (chainId !== undefined) {
      sendAnalyticsEvent(AuctionEventName.AuctionSelectorOpened, {
        chain_id: chainId,
        auction_count: selectableAuctions.length,
        entry_point: 'tdp_provenance_module',
      })
    }
    openAuctionList()
  }

  const onLaunchpadPress = (): void => {
    sendTokenDetailsProvenanceEvent({
      eventName: AuctionEventName.TokenDetailsToLaunchesClicked,
      display,
      entry_point: 'tdp_provenance_module',
      destination: 'explore_auctions',
    })
  }

  const onDetailsPress = (destination: AuctionHistoryDestination): void => {
    if (destination === 'auction_details') {
      sendTokenDetailsProvenanceEvent({
        eventName: AuctionEventName.TokenDetailsToAuctionDetailsClicked,
        display,
        entry_point: 'tdp_provenance_module',
        destination,
      })
    }
  }

  return (
    <>
      <TokenProvenanceContent
        onDetailsPress={onDetailsPress}
        onLaunchpadPress={onLaunchpadPress}
        provenance={displayProvenance}
        auctionData={auctionData}
        onShowAuctions={hasSelector ? onShowAuctions : undefined}
      />
      {/* Mounted whenever it is reachable, so closing animates out; a single-auction page never pays for it. */}
      {hasSelector && (
        <TokenDetailsAuctionListModal
          auctions={selectableAuctions}
          isOpen={isAuctionListOpen}
          onClose={closeAuctionList}
        />
      )}
    </>
  )
}

/** Renders normalized provenance. Auction-only details must belong to this provenance's auction. */
export function TokenProvenanceContent({
  provenance,
  auctionData,
  onShowAuctions,
  onDetailsPress,
  onLaunchpadPress,
}: {
  provenance: LaunchProvenance
  auctionData?: TokenProvenanceData
  onShowAuctions?: () => void
  onDetailsPress?: (destination: AuctionHistoryDestination) => void
  onLaunchpadPress?: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const localizedDayjs = useLocalizedDayjs()
  const [isExplainerOpen, setIsExplainerOpen] = useState(false)
  const methodCopy = getLaunchMethodCopy({ method: provenance.method, t })
  const destination = auctionData?.raised?.destination
  const detailsDestination: AuctionHistoryDestination = onShowAuctions
    ? 'auction_list'
    : destination?.isExternal
      ? 'pools'
      : 'auction_details'

  const onHistoryDetailsPress = (): void => onDetailsPress?.(detailsDestination)
  const onLaunchMethodPress = (): void => setIsExplainerOpen(true)
  const onExplainerClose = (): void => setIsExplainerOpen(false)

  return (
    <Flex testID={TestID.TokenDetailsProvenance} gap="$gap20" width="100%" $md={{ gap: '$gap16' }}>
      <Text variant="heading3">{t('toucan.auction.info')}</Text>
      <Flex row flexWrap="wrap" rowGap="$spacing20">
        {auctionData && (
          <ProvenanceCell label={t('tdp.provenance.launchedBy')}>
            <WalletHoverCard address={auctionData.creator.address} chainId={auctionData.creator.chainId}>
              <Flex row gap="$spacing8" alignItems="center" minWidth={0}>
                <CreatorAvatar avatarUrl={auctionData.creator.avatarUrl} />
                {auctionData.creator.href ? (
                  <Trace
                    logPress
                    element={ElementName.ProvenanceCreator}
                    properties={{ launch_method: getAnalyticsLaunchMethod(provenance.method) }}
                  >
                    <Anchor
                      href={auctionData.creator.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="subheading1"
                      color="$neutral1"
                      hoverStyle={{ color: '$neutral1Hovered' }}
                      textDecorationLine="none"
                      numberOfLines={1}
                    >
                      {auctionData.creator.name}
                    </Anchor>
                  </Trace>
                ) : (
                  <Text variant="subheading1" color="$neutral1" numberOfLines={1}>
                    {auctionData.creator.name}
                  </Text>
                )}
                {auctionData.creator.verified && <CheckmarkCircle size="$icon.16" color="$accent1" />}
              </Flex>
            </WalletHoverCard>
          </ProvenanceCell>
        )}

        <ProvenanceCell label={t('tdp.provenance.firstTraded')}>
          <Text variant="subheading1" color="$neutral1">
            {provenance.launchedAt ? localizedDayjs(provenance.launchedAt).format(FORMAT_DATE_MEDIUM) : '--'}
          </Text>
        </ProvenanceCell>

        <ProvenanceCell label={t('tdp.provenance.launchpad')}>
          <ProvenanceLaunchpadLink
            launchpad={provenance.launchpad}
            {...getLaunchpadDestination({ provenance })}
            element={ElementName.ProvenanceInfoLaunchpad}
            launchMethod={getAnalyticsLaunchMethod(provenance.method)}
            onPress={onLaunchpadPress}
          >
            <Flex row gap="$spacing8" alignItems="center">
              <ProvenanceLaunchpadLogo launchpad={provenance.launchpad} size={iconSizes.icon20} />
              <Text
                variant="subheading1"
                color="$neutral1"
                hoverStyle={{ color: '$neutral1Hovered' }}
                numberOfLines={1}
              >
                {provenance.launchpad.name}
              </Text>
            </Flex>
          </ProvenanceLaunchpadLink>
        </ProvenanceCell>

        {methodCopy && (
          <ProvenanceCell label={t('tdp.provenance.launchMethod')}>
            <Trace
              logPress
              element={ElementName.AuctionTypeTag}
              properties={{ launch_method: getAnalyticsLaunchMethod(provenance.method) }}
            >
              <TouchableArea
                testID={TestID.TokenDetailsProvenanceLaunchMethod}
                flexDirection="row"
                alignItems="center"
                alignSelf="flex-start"
                gap="$spacing8"
                onPress={onLaunchMethodPress}
              >
                <LaunchMethodIcon method={provenance.method} size="$icon.16" />
                <Text variant="subheading1" color="$neutral1" hoverStyle={{ color: '$neutral1Hovered' }}>
                  {methodCopy.label}
                </Text>
              </TouchableArea>
            </Trace>
          </ProvenanceCell>
        )}

        {auctionData?.raised && (
          <ProvenanceCell label={t('tdp.provenance.auctionHistory')}>
            <Flex row gap="$spacing8" alignItems="center">
              <Flex row gap="$spacing4" alignItems="center" minWidth={0}>
                {auctionData.raised.count > 1 && <AuctionCountBadge count={auctionData.raised.count} />}
                <Text variant="subheading1" color="$neutral1" numberOfLines={1}>
                  {auctionData.raised.failed
                    ? t('tdp.auctions.failedToLaunch')
                    : auctionData.raised.usd !== undefined
                      ? t('tdp.provenance.raised', {
                          amount: convertFiatAmountFormatted(auctionData.raised.usd, NumberType.FiatTokenStats),
                        })
                      : '--'}
                </Text>
              </Flex>
              {(onShowAuctions || destination) && (
                <>
                  <Text variant="subheading1" color="$neutral3">
                    ·
                  </Text>
                  <Trace
                    logPress
                    element={ElementName.ProvenanceAuctionHistory}
                    properties={{
                      launch_method: getAnalyticsLaunchMethod(provenance.method),
                      destination: detailsDestination,
                    }}
                  >
                    {onShowAuctions ? (
                      <TouchableArea role="button" onPress={onShowAuctions}>
                        <Text variant="buttonLabel3" color="$accent1">
                          {t('common.details')}
                        </Text>
                      </TouchableArea>
                    ) : destination?.isExternal ? (
                      <Anchor
                        href={destination.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="buttonLabel3"
                        color="$accent1"
                        textDecorationLine="none"
                        onPress={onHistoryDetailsPress}
                      >
                        {t('common.details')}
                      </Anchor>
                    ) : destination ? (
                      <Link to={destination.href} style={{ textDecoration: 'none' }} onClick={onHistoryDetailsPress}>
                        <Text variant="buttonLabel3" color="$accent1">
                          {t('common.details')}
                        </Text>
                      </Link>
                    ) : null}
                  </Trace>
                </>
              )}
            </Flex>
          </ProvenanceCell>
        )}
      </Flex>

      <LaunchMethodExplainerModal method={provenance.method} isOpen={isExplainerOpen} onClose={onExplainerClose} />
    </Flex>
  )
}
