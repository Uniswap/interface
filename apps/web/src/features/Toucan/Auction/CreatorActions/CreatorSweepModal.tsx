import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { GetHelpHeader } from 'uniswap/src/components/dialog/GetHelpHeader'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { NumberType } from 'utilities/src/format/types'
import { formatUnits } from '~/chains'
import { useSweepUnsoldTokensSubmit } from '~/features/Toucan/Auction/hooks/useSweepUnsoldTokensSubmit'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { getAuctionTokenDecimals } from '~/features/Toucan/Auction/utils/tokenMetadata'
import { ToucanActionButton } from '~/features/Toucan/Shared/ToucanActionButton'

interface CreatorSweepModalProps {
  isOpen: boolean
  onClose: () => void
  variant: 'failed' | 'graduated'
  // Raw auction-token amount the sweep returns (undefined while loading)
  amountRaw: bigint | undefined
  // Refetches the on-chain sweep latch once the transaction confirms
  onSweepConfirmed: () => void
}

/**
 * Confirmation modal for the creator's sweepUnsoldTokens() transaction, mirroring the bidder
 * WithdrawModal layout: amount + token logo, then a single branded action button.
 */
export function CreatorSweepModal({
  isOpen,
  onClose,
  variant,
  amountRaw,
  onSweepConfirmed,
}: CreatorSweepModalProps): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const auctionDetails = useAuctionStore((state) => state.auctionDetails)
  const auctionToken = auctionDetails?.token
  const tokenSymbol = auctionToken?.currency.symbol ?? auctionDetails?.tokenSymbol
  const tokenDecimals = getAuctionTokenDecimals(auctionToken) ?? auctionDetails?.tokenDecimals

  const { onSubmit, isPending, isWaitingForWallet, error } = useSweepUnsoldTokensSubmit({
    onTransactionConfirmed: () => {
      onSweepConfirmed()
      onClose()
    },
  })

  const formattedAmount = useMemo(() => {
    if (amountRaw === undefined || tokenDecimals === undefined) {
      return undefined
    }
    return formatNumberOrString({ value: formatUnits(amountRaw, tokenDecimals), type: NumberType.TokenNonTx })
  }, [amountRaw, tokenDecimals, formatNumberOrString])

  const modalTitle =
    variant === 'failed' ? t('toucan.creator.sweep.failed.title') : t('toucan.creator.sweep.graduated.title')

  const buttonLabel = (() => {
    if (isWaitingForWallet) {
      return t('common.confirmWallet')
    }
    if (isPending) {
      return t('toucan.auction.withdrawTokens.withdrawingTokens')
    }
    return t('toucan.auction.withdrawTokens')
  })()

  return (
    <Modal name={ModalName.AuctionCreatorSweep} isModalOpen={isOpen} onClose={onClose} maxWidth={420} padding={0}>
      <Flex gap="$spacing16" width="100%" p="$spacing16">
        <GetHelpHeader title={modalTitle} closeModal={onClose} link={UniswapHelpUrls.articles.toucanWithdrawHelp} />

        <Flex gap="$spacing4" minHeight={64}>
          <Flex row justifyContent="space-between" alignItems="center">
            <Text variant="heading2" color="$neutral1">
              {formattedAmount ?? '-'} {tokenSymbol}
            </Text>
            <TokenLogo url={auctionToken?.logoUrl} chainId={auctionDetails?.chainId} symbol={tokenSymbol} size={40} />
          </Flex>
          <Text variant="body3" color="$neutral2">
            {variant === 'failed'
              ? t('toucan.creator.sweep.confirm.failed.description')
              : t('toucan.creator.sweep.confirm.graduated.description')}
          </Text>
        </Flex>

        {error && (
          <Text variant="body3" color="$statusCritical">
            {t('common.error.general')}
          </Text>
        )}

        <ToucanActionButton
          elementName={ElementName.AuctionCreatorSweepButton}
          label={buttonLabel}
          onPress={onSubmit}
          shouldUseBranded
          isDisabled={isPending || amountRaw === undefined}
          loading={isPending}
        />
      </Flex>
    </Modal>
  )
}
