import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'
import { formatUnits } from '~/chains'
import { GraduatedCardFrame } from '~/features/Toucan/Auction/Bids/GraduatedCardFrame'
import { CreatorSweepModal } from '~/features/Toucan/Auction/CreatorActions/CreatorSweepModal'
import { getCreatorSweepDisplay } from '~/features/Toucan/Auction/CreatorActions/getCreatorSweepDisplay'
import { useAuctionCreatorInfo } from '~/features/Toucan/Auction/hooks/useAuctionCreatorInfo'
import { useSweepUnsoldTokensState } from '~/features/Toucan/Auction/hooks/useSweepUnsoldTokensState'
import { useAuctionOutcome, useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { safeBigInt } from '~/features/Toucan/Auction/utils/safeBigInt'
import { getAuctionTokenDecimals } from '~/features/Toucan/Auction/utils/tokenMetadata'
import { ToucanActionButton } from '~/features/Toucan/Shared/ToucanActionButton'

/**
 * Post-auction card shown only to the auction's tokensRecipient wallet:
 * - failed launch: withdraw the full deposited token supply
 * - graduated launch: recover the unsold remainder
 * Renders nothing for everyone else. The CTA flips to a done state once the one-shot
 * sweepUnsoldTokens() has run (sweepUnsoldTokensBlock != 0 on-chain). Uses the same glow
 * hero shell as the graduated bidder card (GraduatedCardFrame).
 */
export function CreatorSweepCard(): JSX.Element | null {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const openModal = useCallback(() => setIsModalOpen(true), [])
  const closeModal = useCallback(() => setIsModalOpen(false), [])

  const { auctionDetails, tokenColor } = useAuctionStore((state) => ({
    auctionDetails: state.auctionDetails,
    tokenColor: state.tokenColor,
  }))
  const outcome = useAuctionOutcome()
  const { isConnectedTokensRecipient, tokensRecipient } = useAuctionCreatorInfo()
  const { hasSwept, remainingSupplyRaw, refetchSweepBlock } = useSweepUnsoldTokensState({
    enabled: isConnectedTokensRecipient,
  })

  const display = getCreatorSweepDisplay({
    outcome,
    isConnectedTokensRecipient,
    hasSwept,
    depositedSupplyRaw: safeBigInt(auctionDetails?.totalSupply) ?? undefined,
    remainingSupplyRaw,
  })

  const auctionToken = auctionDetails?.token
  const tokenDecimals = getAuctionTokenDecimals(auctionToken) ?? auctionDetails?.tokenDecimals
  const tokenSymbol = auctionToken?.currency.symbol ?? auctionDetails?.tokenSymbol
  const chainId = auctionDetails?.chainId

  const formattedAmount = useMemo(() => {
    if (display?.amountRaw === undefined || tokenDecimals === undefined) {
      return undefined
    }
    return formatNumberOrString({
      value: formatUnits(display.amountRaw, tokenDecimals),
      type: NumberType.TokenNonTx,
    })
  }, [display?.amountRaw, tokenDecimals, formatNumberOrString])

  if (!display || chainId === undefined) {
    return null
  }

  const { variant, isSwept } = display
  const availableDescription =
    variant === 'failed'
      ? t('toucan.creator.sweep.failed.description')
      : t('toucan.creator.sweep.graduated.description', {
          address: tokensRecipient ? shortenAddress({ address: tokensRecipient }) : '',
        })
  const ctaLabel = isSwept ? t('toucan.auction.withdrawTokens.tokensWithdrawn') : t('toucan.auction.withdrawTokens')

  // A failed sweep returns the (static) deposited supply, so the withdrawn amount is always known.
  // A graduated sweep reads remainingSupply(), which is 0 once swept — fall back to a message.
  const showWithdrawnAmount =
    isSwept && formattedAmount !== undefined && display.amountRaw !== undefined && display.amountRaw > 0n

  const amountRow =
    formattedAmount === undefined ? null : (
      <Flex row gap="$spacing8" alignItems="center">
        <Text variant="heading2" color="$neutral1">
          {formattedAmount}
        </Text>
        <Text variant="heading2" color="$neutral1">
          {tokenSymbol}
        </Text>
      </Flex>
    )

  return (
    <Flex gap="$spacing12" width="100%">
      <GraduatedCardFrame
        auctionLogoUrl={auctionToken?.logoUrl}
        auctionSymbol={tokenSymbol}
        chainId={chainId}
        tokenColor={tokenColor}
      >
        {/* Top-anchored below the logo (logo→first line 34, then 6px between lines). Once swept we
            mirror the bidder's graduated card: a short label above the withdrawn token amount. */}
        <Flex flex={1} gap={6} width="100%" alignItems="center">
          {isSwept ? (
            showWithdrawnAmount ? (
              <>
                <Text variant="subheading1" color="$neutral2" textAlign="center" mt={34}>
                  {t('toucan.creator.sweep.youWithdrew')}
                </Text>
                {amountRow}
              </>
            ) : (
              <Text variant="body2" color="$neutral2" textAlign="center" maxWidth={320} mt={34}>
                {t('toucan.creator.sweep.graduated.withdrawn.description')}
              </Text>
            )
          ) : (
            <>
              <Text variant="subheading1" color="$neutral2" textAlign="center" mt={34}>
                {t('toucan.creator.sweep.availableToWithdraw')}
              </Text>
              {amountRow}
              <Text variant="body2" color="$neutral2" textAlign="center" maxWidth={320}>
                {availableDescription}
              </Text>
            </>
          )}
        </Flex>
      </GraduatedCardFrame>
      <ToucanActionButton
        elementName={ElementName.AuctionCreatorSweepButton}
        label={ctaLabel}
        onPress={openModal}
        isDisabled={isSwept}
        shouldUseBranded
      />
      <CreatorSweepModal
        isOpen={isModalOpen}
        onClose={closeModal}
        variant={variant}
        amountRaw={display.amountRaw}
        onSweepConfirmed={refetchSweepBlock}
      />
    </Flex>
  )
}
