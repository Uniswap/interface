import { Currency } from '@uniswap/sdk-core'
import Fuse from 'fuse.js'
import React, { useCallback, useState } from 'react'
import { Box } from 'src/components/layout'
import TokenWarningModal from 'src/components/tokens/TokenWarningModal'
import WarningIcon from 'src/components/tokens/WarningIcon'
import { Option } from 'src/components/TokenSelector/Option'
import { TokenOption } from 'src/components/TokenSelector/types'
import {
  TokenWarningLevel,
  TokenWarningLevelMap,
  useDismissTokenWarnings,
} from 'src/features/tokens/useTokenWarningLevel'
import { currencyId } from 'src/utils/currencyId'

interface OptionProps {
  option: TokenOption
  onPress: () => void
  tokenWarningLevelMap: TokenWarningLevelMap
  matches: Fuse.FuseResult<Currency>['matches']
}

export function TokenOptionItem({ option, onPress, tokenWarningLevelMap, matches }: OptionProps) {
  const [showWarningModal, setShowWarningModal] = useState(false)
  const { currency } = option
  const id = currencyId(currency.wrapped)

  const tokenWarningLevel =
    tokenWarningLevelMap?.[currency.chainId]?.[id] ?? TokenWarningLevel.MEDIUM

  const [dismissedWarningTokens, dismissTokenWarning] = useDismissTokenWarnings()
  const dismissed = Boolean(dismissedWarningTokens[currency.chainId]?.[currency.wrapped.address])

  const handleSelectCurrency = useCallback(() => {
    if (tokenWarningLevel === TokenWarningLevel.BLOCKED) {
      setShowWarningModal(true)
      return
    }

    if (
      (tokenWarningLevel === TokenWarningLevel.LOW ||
        tokenWarningLevel === TokenWarningLevel.MEDIUM) &&
      !dismissed
    ) {
      setShowWarningModal(true)
      return
    }

    onPress()
  }, [dismissed, onPress, tokenWarningLevel])

  return (
    <Box opacity={tokenWarningLevel === TokenWarningLevel.BLOCKED ? 0.5 : 1}>
      {showWarningModal ? (
        <TokenWarningModal
          isVisible
          currency={currency}
          tokenWarningLevel={tokenWarningLevel}
          onAccept={() => {
            dismissTokenWarning(currency)
            setShowWarningModal(false)
            onPress()
          }}
          onClose={() => setShowWarningModal(false)}
        />
      ) : null}
      <Option
        icon={dismissed ? null : <WarningIcon tokenWarningLevel={tokenWarningLevel} />}
        matches={matches}
        metadataType={tokenWarningLevel === TokenWarningLevel.BLOCKED ? 'disabled' : 'balance'}
        option={option}
        onPress={handleSelectCurrency}
      />
    </Box>
  )
}
