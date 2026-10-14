import { useQueries } from '@tanstack/react-query'
import { Anchor, Flex, Text, TouchableArea, UniversalImage, iconSizes } from '@universe/mycelium'
import { CheckmarkCircle } from '@universe/mycelium/icons/CheckmarkCircle'
import { Person } from '@universe/mycelium/icons/Person'
import { TestID } from '@universe/test'
import { type ReactNode, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { LaunchProvenance } from 'uniswap/src/features/dataApi/launchProvenance'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { FORMAT_DATE_MEDIUM, useLocalizedDayjs } from 'uniswap/src/features/language/localizedDayjs'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import {
  deriveCurrencyRaisedState,
  getAuctionCheckpointQuery,
} from '~/features/Toucan/Auction/hooks/useAuctionDisplayDataSources'
import { getLaunchProvenanceFromAuction } from '~/features/Toucan/Auction/utils/auctionLaunchMethod'
import { AuctionDisplayPhase, resolveAuctionPhase } from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import { getLaunchMethodCopy } from '~/features/Toucan/Shared/getLaunchMethodCopy'
import { LaunchMethodExplainerModal } from '~/features/Toucan/Shared/LaunchMethodExplainerModal'
import { LaunchMethodIcon } from '~/features/Toucan/Shared/LaunchMethodIcon'
import { ProvenanceLaunchpadLogo } from '~/features/Toucan/Shared/ProvenanceLaunchpadLogo'
import { TokenDetailsAuctionListModal } from '~/pages/TokenDetails/components/auction/TokenDetailsAuctionListModal'
import {
  getTokenProvenanceData,
  type TokenProvenanceAuctionEntry,
  type TokenProvenanceData,
} from '~/pages/TokenDetails/components/info/tokenProvenanceData'
import { useTokenDetailsAuctionDisplay } from '~/pages/TokenDetails/hooks/useTokenDetailsAuctionDisplay'
import { useTokenDetailsAuctions } from '~/pages/TokenDetails/hooks/useTokenDetailsAuctions'
import { useTokenDetailsCcaAuctions } from '~/pages/TokenDetails/hooks/useTokenDetailsCcaAuctions'

function ProvenanceCell({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    <Flex flexBasis="33.33%" minWidth={0} gap="$spacing4" pr="$spacing16" $sm={{ flexBasis: '50%' }}>
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

/** Auction-backed production container; canonical token integration is blocked by CONS-3228. */
export function TokenProvenance(): JSX.Element | null {
  const { auction, chainId, phase, currencyRaised, currentBlock } = useTokenDetailsAuctionDisplay()
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
            // A live auction's raise still moves and is not summed, so it is not fetched either.
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
  if (!auction || chainId === undefined) {
    return null
  }

  const entries: TokenProvenanceAuctionEntry[] = hasMultipleAuctions
    ? siblings.map(({ isEnded, ...sibling }, index) => ({
        ...sibling,
        currencyRaised: deriveCurrencyRaisedState({ enabled: isEnded, checkpointQuery: checkpoints[index] }),
      }))
    : [{ auction, phase, currencyRaised }]
  const provenance = getLaunchProvenanceFromAuction({ auction })
  const auctionData = getTokenProvenanceData({ auction, chainId, entries })

  return (
    <>
      <TokenProvenanceContent
        provenance={provenance}
        auctionData={auctionData}
        onShowAuctions={hasSelector ? openAuctionList : undefined}
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
}: {
  provenance: LaunchProvenance
  auctionData?: TokenProvenanceData
  onShowAuctions?: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const localizedDayjs = useLocalizedDayjs()
  const [isExplainerOpen, setIsExplainerOpen] = useState(false)
  const methodCopy = getLaunchMethodCopy({ method: provenance.method, t })
  const destination = auctionData?.raised?.destination

  const onLaunchMethodPress = (): void => setIsExplainerOpen(true)
  const onExplainerClose = (): void => setIsExplainerOpen(false)

  return (
    <Flex testID={TestID.TokenDetailsProvenance} gap="$gap20" width="100%" $md={{ gap: '$gap16' }}>
      <Text variant="heading3">{t('toucan.auction.info')}</Text>
      <Flex row flexWrap="wrap" rowGap="$spacing16">
        {auctionData && (
          <ProvenanceCell label={t('tdp.provenance.createdBy')}>
            <Flex row gap="$spacing8" alignItems="center" minWidth={0}>
              <CreatorAvatar avatarUrl={auctionData.creator.avatarUrl} />
              {auctionData.creator.href ? (
                <Anchor
                  href={auctionData.creator.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="subheading1"
                  color="$neutral1"
                  textDecorationLine="none"
                  numberOfLines={1}
                >
                  {auctionData.creator.name}
                </Anchor>
              ) : (
                <Text variant="subheading1" color="$neutral1" numberOfLines={1}>
                  {auctionData.creator.name}
                </Text>
              )}
              {auctionData.creator.verified && <CheckmarkCircle size="$icon.16" color="$accent1" />}
            </Flex>
          </ProvenanceCell>
        )}

        <ProvenanceCell label={t('tdp.provenance.launchDate')}>
          <Text variant="subheading1" color="$neutral1">
            {provenance.launchedAt ? localizedDayjs(provenance.launchedAt).format(FORMAT_DATE_MEDIUM) : '--'}
          </Text>
        </ProvenanceCell>

        <ProvenanceCell label={t('tdp.provenance.launchpad')}>
          <Flex row gap="$spacing8" alignItems="center">
            <ProvenanceLaunchpadLogo launchpad={provenance.launchpad} size={iconSizes.icon20} />
            <Text variant="subheading1" color="$neutral1" numberOfLines={1}>
              {provenance.launchpad.name}
            </Text>
          </Flex>
        </ProvenanceCell>

        {methodCopy && (
          <ProvenanceCell label={t('tdp.provenance.launchMethod')}>
            <TouchableArea
              testID={TestID.TokenDetailsProvenanceLaunchMethod}
              flexDirection="row"
              alignItems="center"
              alignSelf="flex-start"
              gap="$spacing8"
              onPress={onLaunchMethodPress}
            >
              <LaunchMethodIcon method={provenance.method} size="$icon.16" />
              <Text variant="subheading1" color="$neutral1">
                {methodCopy.label}
              </Text>
            </TouchableArea>
          </ProvenanceCell>
        )}

        {auctionData?.raised && (
          <ProvenanceCell label={t('tdp.provenance.auctionHistory')}>
            <Flex row gap="$spacing8" alignItems="center">
              <Text variant="subheading1" color="$neutral1">
                {auctionData.raised.usd !== undefined
                  ? t('tdp.provenance.raised', {
                      amount: convertFiatAmountFormatted(auctionData.raised.usd, NumberType.FiatTokenStats),
                    })
                  : '--'}
              </Text>
              {(onShowAuctions || destination) && (
                <>
                  <Text variant="subheading1" color="$neutral3">
                    ·
                  </Text>
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
                    >
                      {t('common.details')}
                    </Anchor>
                  ) : destination ? (
                    <Link to={destination.href} style={{ textDecoration: 'none' }}>
                      <Text variant="buttonLabel3" color="$accent1">
                        {t('common.details')}
                      </Text>
                    </Link>
                  ) : null}
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
