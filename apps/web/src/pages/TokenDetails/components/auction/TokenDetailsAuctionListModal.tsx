import type { PlainMessage } from '@bufbuild/protobuf'
import type { Auction } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { AddressStringFormat, type EVMUniverseChainId, isEVMChain, normalizeAddress } from '@universe/chains'
import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { X } from '@universe/mycelium/icons/X'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'
import { parseFiniteNumber } from 'utilities/src/primitives/number'
import { useEvent } from 'utilities/src/react/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useSharedMachineTimeMs } from 'utilities/src/time/useSharedMachineTimeMs'
import { useAuctionDisplayDataSources } from '~/features/Toucan/Auction/hooks/useAuctionDisplayDataSources'
import { useAuctionTimeRemaining } from '~/features/Toucan/Auction/hooks/useAuctionTimeRemaining'
import { getRaisedUsd } from '~/features/Toucan/Auction/utils/getRaisedUsd'
import {
  AuctionDisplayResult,
  resolveAuctionDisplayState,
} from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import { getAuctionDestination } from '~/features/Toucan/utils/auctionDestination'
import { showAuctionOpenFailedPopup, useNavigateToAuctionDetails } from '~/hooks/useNavigateToAuctionDetails'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { toSeconds } from '~/pages/TokenDetails/utils/tokenDetailsAuctionDisplay'
import { sortTokenDetailsAuctions } from '~/pages/TokenDetails/utils/tokenDetailsAuctionList'

// TODO(CONS-3362): read the graduated/failed result from data-api once it serves one, instead of resolving it here.
function useAuctionListRowResult({
  auction,
  chainId,
}: {
  auction: PlainMessage<Auction>
  chainId: EVMUniverseChainId | undefined
}): { result: AuctionDisplayResult; raisedUsd: number | undefined } {
  const { currentBlock, currencyRaised, pools } = useAuctionDisplayDataSources({
    chainId,
    // Rows only consume the auction result, so they do not need token pool availability.
    tokenAddress: undefined,
    auctionAddress: auction.address,
    startBlock: auction.startBlock,
    endBlock: auction.endBlock,
    enabled: chainId !== undefined,
  })
  const { result } = resolveAuctionDisplayState({ auction, currentBlock, currencyRaised, pools })
  return { result, raisedUsd: getRaisedUsd({ auction, currencyRaised }) }
}

function AuctionListRow({
  auction,
  chainId,
  logoUrl,
  onSelect,
}: {
  auction: PlainMessage<Auction>
  chainId: EVMUniverseChainId | undefined
  logoUrl: string | undefined
  onSelect: (auction: PlainMessage<Auction>) => void
}): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const { phase, timeString, progressPercentage } = useAuctionTimeRemaining({
    startBlockTimestamp: toSeconds(auction.estimatedStartTime),
    endBlockTimestamp: toSeconds(auction.estimatedEndTime),
  })
  const isUpcoming = phase === 'notStarted'
  const isEnded = phase === 'completed'
  const { result, raisedUsd } = useAuctionListRowResult({ auction, chainId })
  const launched = isEnded && result === AuctionDisplayResult.Successful
  const failed = isEnded && result === AuctionDisplayResult.Failed
  const amountUsd = launched ? raisedUsd : parseFiniteNumber(auction.totalBidVolumeUsd)
  const amount = amountUsd === undefined ? '—' : convertFiatAmountFormatted(amountUsd, NumberType.FiatTokenStats)
  const amountColor = isUpcoming ? '$neutral3' : failed ? '$neutral2' : '$neutral1'

  const onPress = useEvent(() => onSelect(auction))

  return (
    <Trace logPress element={ElementName.TokenDetailsAuctionListRow}>
      <TouchableArea
        row
        alignItems="center"
        gap="$spacing12"
        p="$spacing12"
        borderRadius="$rounded16"
        hoverStyle={{ backgroundColor: '$surface2' }}
        onPress={onPress}
        testID={TestID.TokenDetailsAuctionListRow}
      >
        <Flex opacity={failed ? 0.5 : 1}>
          <TokenLogo
            url={logoUrl}
            size={28}
            chainId={auction.chainId}
            symbol={auction.tokenSymbol}
            name={auction.tokenName}
          />
        </Flex>
        <Flex fill gap="$spacing2">
          <Text variant="body2" color={amountColor}>
            {amount}
          </Text>
          {!isUpcoming && (
            <Text variant="body4" color={failed ? '$neutral3' : '$neutral2'}>
              {launched ? t('tdp.auctions.raised') : t('tdp.auctions.committed')}
            </Text>
          )}
        </Flex>
        <Flex alignItems="flex-end" gap={phase === 'live' ? '$spacing8' : '$spacing2'}>
          {phase === undefined ? (
            <Text variant="body2" color="$neutral2">
              —
            </Text>
          ) : isUpcoming ? (
            <>
              <Text variant="body2" color="$neutral2">
                {t('toucan.auction.status.startingSoon')}
              </Text>
              <Text variant="body4" color="$neutral3">
                {timeString}
              </Text>
            </>
          ) : isEnded ? (
            <>
              <Text variant="body2" color="$neutral1">
                {launched
                  ? t('toucan.auction.timeRemaining.completed')
                  : failed
                    ? t('tdp.auctions.failedToLaunch')
                    : t('common.ended')}
              </Text>
              <Text variant="body4" color="$neutral2">
                {timeString}
              </Text>
            </>
          ) : (
            <>
              <Flex width={80} height="6px" backgroundColor="$surface3" borderRadius="$roundedFull" overflow="hidden">
                <Flex width={`${progressPercentage}%`} height="100%" backgroundColor="$neutral2" />
              </Flex>
              <Text variant="body4" color="$neutral2">
                {timeString}
              </Text>
            </>
          )}
        </Flex>
      </TouchableArea>
    </Trace>
  )
}

/** The page's auctions, live first, each pressing through to wherever that auction's details live. */
export function TokenDetailsAuctionListModal({
  isOpen,
  onClose,
  auctions,
}: {
  isOpen: boolean
  onClose: () => void
  auctions: PlainMessage<Auction>[]
}): JSX.Element {
  const { t } = useTranslation()
  const { chainId, tokenAddress, symbol } = useTDPStore((s) => ({
    chainId: s.currencyChainId,
    tokenAddress: s.address,
    symbol: s.currency?.symbol,
  }))
  const evmChainId = isEVMChain(chainId) ? chainId : undefined
  // The rows' clock, so a row cannot read Ended while still bucketed under Live.
  const nowMs = useSharedMachineTimeMs(ONE_SECOND_MS)
  const sorted = sortTokenDetailsAuctions({ auctions, nowMs })
  const logoUrl = useCurrencyInfo(tokenAddress ? buildCurrencyId(chainId, tokenAddress) : undefined)?.logoUrl
  const navigateToAuctionDetails = useNavigateToAuctionDetails()

  const onSelect = useEvent((auction: PlainMessage<Auction>) => {
    // Shared with the provenance row so one auction never opens pools.xyz here and the ADP there.
    const destination = getAuctionDestination({ auction, chainId: auction.chainId })
    if (!destination) {
      // A pools.xyz launch off its chains has no page anywhere; the in-app ADP would show someone else's auction.
      logger.warn('TokenDetailsAuctionListModal', 'onSelect', 'Cannot open auction details', {
        auctionAddress: auction.address,
        chainId: auction.chainId,
      })
      showAuctionOpenFailedPopup(t)
      return
    }
    if (destination.isExternal) {
      window.open(destination.href, '_blank', 'noopener,noreferrer')
    } else {
      navigateToAuctionDetails({ auctionAddress: auction.address, chainId: auction.chainId })
    }
    onClose()
  })

  return (
    <Modal isModalOpen={isOpen} name={ModalName.TokenDetailsAuctionList} onClose={onClose} maxWidth={420} padding={0}>
      <Flex
        position="relative"
        backgroundColor="$surface1"
        p="$spacing12"
        gap="$spacing8"
        testID={TestID.TokenDetailsAuctionListModal}
      >
        <Flex row alignItems="center" justifyContent="space-between" px="$spacing12" pt="$spacing8">
          <Text variant="body2" color="$neutral1">
            {t('tdp.auctions.modalTitle', { symbol: symbol ?? '' })}
          </Text>
          <TouchableArea p="$spacing4" borderRadius="$rounded8" onPress={onClose}>
            <X size="$icon.24" color="$neutral2" />
          </TouchableArea>
        </Flex>
        <Flex>
          {sorted.map((auction) => (
            <AuctionListRow
              key={normalizeAddress(auction.address, AddressStringFormat.Lowercase)}
              auction={auction}
              chainId={evmChainId}
              logoUrl={logoUrl ?? undefined}
              onSelect={onSelect}
            />
          ))}
        </Flex>
      </Flex>
    </Modal>
  )
}
