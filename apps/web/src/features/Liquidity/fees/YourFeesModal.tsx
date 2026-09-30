import type { UniverseChainId } from '@universe/chains'
import { Flex, Skeleton, Text, TouchableArea } from '@universe/mycelium'
import { X } from '@universe/mycelium/icons/X'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useWalletPositionsBalance } from 'uniswap/src/features/positions/hooks/useWalletPositionsBalance'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { CollectableFeesList } from '~/features/Liquidity/fees/CollectableFeesList'
import { useCollectableFeePositions } from '~/features/Liquidity/fees/useCollectableFeePositions'
import { formatUsdTotal } from '~/features/Liquidity/utils/formatUsdTotal'
import { useDocumentScrollLock } from '~/hooks/useDocumentScrollLock'

interface YourFeesModalProps {
  isOpen: boolean
  onClose: () => void
  walletAddress?: string
  /** Same chain scope as the fees chip that opened the modal, so the two can't disagree. */
  chainIds?: UniverseChainId[]
}

/**
 * Wallet-level "Your fees" modal: total uncollected fees over per-position rows, each row's
 * Collect handing off to the existing claim-fee modal. Desktop dialog / mWeb bottom sheet.
 * The hero total is the same GetWalletPositionsBalance figure the chip shows.
 */
export function YourFeesModal({ isOpen, onClose, walletAddress, chainIds }: YourFeesModalProps): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const { totalFeesUsd, isLoading: isTotalLoading } = useWalletPositionsBalance({
    account: walletAddress,
    chainIds,
  })
  // Enabled only while open so the closed modal (mounted with the chips on every page view)
  // doesn't kick off the fetch-all-pages positions crawl.
  const { positions, isFetching, hasError } = useCollectableFeePositions({
    walletAddress,
    chainIds,
    enabled: isOpen,
  })

  useDocumentScrollLock(isOpen)

  return (
    <Modal
      name={ModalName.YourFees}
      isModalOpen={isOpen}
      onClose={onClose}
      alignment="center"
      maxWidth={420}
      padding="$spacing24"
      pt="$spacing16"
      disableRemoveScroll
    >
      <Flex gap="$gap16" testID={TestID.YourFeesModal}>
        <Flex row alignItems="center" justifyContent="space-between">
          <Text variant="subheading1" color="$neutral1">
            {t('pool.fees.yourFees')}
          </Text>
          {/* The sheet breakpoint gets a handlebar and drag-to-dismiss, so the X is desktop-only. */}
          <TouchableArea
            alignItems="center"
            justifyContent="center"
            onPress={onClose}
            testID={TestID.YourFeesModalClose}
            $md={{ display: 'none' }}
          >
            <X size="$icon.24" color="$neutral2" hoverColor="$neutral1" />
          </TouchableArea>
        </Flex>
        <Flex gap="$gap4">
          <Text variant="body3" color="$neutral2">
            {t('pool.fees.totalEarned')}
          </Text>
          {isTotalLoading ? (
            <Skeleton>
              <Flex height={40} width={140} borderRadius="$rounded8" backgroundColor="$surface3" />
            </Skeleton>
          ) : (
            <Text variant="heading2" color="$neutral1" testID={TestID.YourFeesModalTotal}>
              {formatUsdTotal(totalFeesUsd, convertFiatAmountFormatted).display}
            </Text>
          )}
        </Flex>
        {hasError ? (
          <Text variant="body2" color="$neutral2">
            {t('common.card.error.description')}
          </Text>
        ) : (
          <CollectableFeesList
            positions={positions}
            isFetching={isFetching}
            showCollectButton
            onBeforeCollect={onClose}
            rowPaddingVertical="$spacing8"
            rowGap="$none"
          />
        )}
      </Flex>
    </Modal>
  )
}
