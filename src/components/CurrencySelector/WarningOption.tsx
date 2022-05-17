import { Currency } from '@uniswap/sdk-core'
import Fuse from 'fuse.js'
import React, { useCallback, useState } from 'react'
import { Option } from 'src/components/CurrencySelector/Option'
import { Modal } from 'src/components/modals/Modal'
import TokenWarningModalContent from 'src/components/tokens/TokenWarningModalContent'
import WarningIcon from 'src/components/tokens/WarningIcon'
import {
  TokenWarningLevel,
  TokenWarningLevelMap,
  useDismissTokenWarnings,
} from 'src/features/tokens/useTokenWarningLevel'
import { currencyId } from 'src/utils/currencyId'
import { Flex } from '../layout'

interface OptionProps {
  currency: Currency
  onPress: () => void
  tokenWarningLevelMap: TokenWarningLevelMap
  matches: Fuse.FuseResult<Currency>['matches']
}

export function WarningOption({ currency, onPress, tokenWarningLevelMap, matches }: OptionProps) {
  const [showWarningModal, setShowWarningModal] = useState(false)
  const id = currencyId(currency.wrapped)

  const tokenWarningLevel =
    tokenWarningLevelMap?.[currency.chainId]?.[id] ?? TokenWarningLevel.MEDIUM

  const [dismissedWarningTokens, dismissTokenWarning] = useDismissTokenWarnings()
  const dismissed = Boolean(dismissedWarningTokens[currency.chainId]?.[currency.wrapped.address])

  const handleSelectCurrency = useCallback(() => {
    if (tokenWarningLevel === TokenWarningLevel.BLOCKED) {
      return null
    }
    if (
      (tokenWarningLevel === TokenWarningLevel.LOW ||
        tokenWarningLevel === TokenWarningLevel.MEDIUM) &&
      !dismissed
    ) {
      setShowWarningModal(true)
    } else {
      onPress()
    }
  }, [dismissed, onPress, tokenWarningLevel])

  return (
    <Flex opacity={tokenWarningLevel === TokenWarningLevel.BLOCKED ? 0.5 : 1}>
      <Modal
        hide={() => setShowWarningModal(false)}
        position="bottom"
        visible={showWarningModal}
        width="100%">
        <TokenWarningModalContent
          currency={currency}
          onAccept={() => {
            dismissTokenWarning(currency)
            onPress()
          }}
          onClose={() => setShowWarningModal(false)}
        />
      </Modal>
      <Option
        currency={currency}
        icon={dismissed ? null : <WarningIcon tokenWarningLevel={tokenWarningLevel} />}
        matches={matches}
        metadataType={tokenWarningLevel === TokenWarningLevel.BLOCKED ? 'disabled' : 'balance'}
        onPress={handleSelectCurrency}
      />
    </Flex>
  )
}
