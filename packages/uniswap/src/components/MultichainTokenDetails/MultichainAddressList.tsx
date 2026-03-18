import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatedCopyLabel } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { MultichainOptionRow } from 'uniswap/src/components/MultichainTokenDetails/MultichainOptionRow'
import { MultichainScrollableList } from 'uniswap/src/components/MultichainTokenDetails/MultichainScrollableList'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { shortenAddress } from 'utilities/src/addresses'

export const COPY_FEEDBACK_RESET_MS = 750

interface MultichainAddressListProps {
  chains: MultichainTokenEntry[]
  onCopyAddress: (address: string) => void
  showInlineFeedback?: boolean
  /** Pass true when rendered inside a Modal to enable BottomSheetScrollView on native. */
  renderedInModal?: boolean
}

/**
 * Scrollable list of per-chain contract addresses with copy functionality.
 * Each row shows chain logo, chain name, shortened address, and a copy icon
 * that animates to a checkmark when copied.
 */
export function MultichainAddressList({
  chains,
  onCopyAddress,
  showInlineFeedback = true,
  renderedInModal,
}: MultichainAddressListProps): JSX.Element {
  const { t } = useTranslation()
  const [copiedChainId, setCopiedChainId] = useState<UniverseChainId | null>(null)

  useEffect(() => {
    if (copiedChainId === null) {
      return undefined
    }
    const timeoutId = setTimeout(() => {
      setCopiedChainId(null)
    }, COPY_FEEDBACK_RESET_MS)
    return () => clearTimeout(timeoutId)
  }, [copiedChainId])

  const handleCopy = useCallback(
    (chainId: UniverseChainId, address: string) => {
      onCopyAddress(address)
      if (showInlineFeedback) {
        setCopiedChainId(chainId)
      }
    },
    [onCopyAddress, showInlineFeedback],
  )

  const renderAddressRow = useCallback(
    (entry: MultichainTokenEntry) => {
      const isCopied = showInlineFeedback && copiedChainId === entry.chainId
      const shortened = shortenAddress({ address: entry.address })

      return (
        <MultichainOptionRow
          chainId={entry.chainId}
          testID={TestID.MultichainCopyAddress}
          rightContent={
            <AnimatedCopyLabel
              isCopied={isCopied}
              label={shortened}
              copiedLabel={t('common.copied')}
              iconSize={iconSizes.icon16}
              iconColor="$neutral1"
            />
          }
          onPress={() => handleCopy(entry.chainId, entry.address)}
        />
      )
    },
    [copiedChainId, handleCopy, showInlineFeedback, t],
  )

  return <MultichainScrollableList data={chains} renderItem={renderAddressRow} renderedInModal={renderedInModal} />
}
