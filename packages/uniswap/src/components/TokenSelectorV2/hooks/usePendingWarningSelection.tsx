import { isWebApp } from '@universe/environment'
import { useCallback, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { BridgedAssetModal } from 'uniswap/src/components/BridgedAsset/BridgedAssetModal'
import { TokenOption, TokenSelectorOption } from 'uniswap/src/components/lists/items/types'
import { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { OnSelectCurrency } from 'uniswap/src/components/TokenSelector/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getTokenProtectionWarning, getTokenWarningSeverity } from 'uniswap/src/features/tokens/warnings/safetyUtils'
import {
  dismissedBridgedAssetWarningsSelector,
  dismissedWarningTokensSelector,
} from 'uniswap/src/features/tokens/warnings/slice/selectors'
import TokenWarningModal from 'uniswap/src/features/tokens/warnings/TokenWarningModal'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { useIsKeyboardOpen } from 'utilities/src/device/keyboard/useIsKeyboardOpen'
import { useEvent } from 'utilities/src/react/hooks'

// Mobile web: modal height breaks if it opens while the keyboard is still up (legacy OptionItem workaround).
const MOBILE_WEB_KEYBOARD_HIDE_DELAY_MS = 700

/** A press waiting on warning acknowledgement; V2 keeps ONE modal at list level instead of one per row. */
interface PendingWarningSelection {
  currencyInfo: CurrencyInfo
  step: 'token-warning' | 'bridged-asset'
  needsBridgedStepAfterWarning: boolean
  proceed: () => void
}

// oxlint-disable-next-line max-params -- biome-parity: oxlint is stricter here
export type OnSelectTokenOption = (
  option: TokenOption,
  section: OnchainItemSection<TokenSelectorOption>,
  index: number,
) => void

/**
 * Warning-gated token selection shared by every V2 press surface (vertical rows, recent pills,
 * suggested tiles, sidebar rows). Routes a press through the token-protection and bridged-asset
 * warning modals before committing the selection; Blocked tokens can never proceed
 * (TokenWarningModal's Blocked branch closes without calling onAcknowledge).
 */
export function usePendingWarningSelection({
  showTokenWarnings,
  onSelectCurrency,
}: {
  showTokenWarnings: boolean
  onSelectCurrency: OnSelectCurrency
}): {
  handleTokenPress: OnSelectTokenOption
  pendingModal: JSX.Element | null
} {
  const [pendingSelection, setPendingSelection] = useState<PendingWarningSelection | null>(null)
  const dismissedWarningTokens = useSelector(dismissedWarningTokensSelector)
  const dismissedBridgedAssetWarnings = useSelector(dismissedBridgedAssetWarningsSelector)
  const isKeyboardOpen = useIsKeyboardOpen()

  const showPendingSelection = useEvent((selection: PendingWarningSelection): void => {
    const show = (): void => {
      dismissNativeKeyboard()
      setPendingSelection(selection)
    }
    if (isKeyboardOpen && isWebApp) {
      // Wait for the keyboard to hide before showing the modal to avoid height issues
      const activeElement = document.activeElement as HTMLElement | null
      activeElement?.blur()
      setTimeout(show, MOBILE_WEB_KEYBOARD_HIDE_DELAY_MS)
    } else {
      show()
    }
  })

  const handleTokenPress: OnSelectTokenOption = useEvent(
    // oxlint-disable-next-line max-params
    (option: TokenOption, section: OnchainItemSection<TokenSelectorOption>, index: number): void => {
      const { currencyInfo } = option
      const { currency } = currencyInfo
      const proceed = (): void => onSelectCurrency(currencyInfo, section, index)

      if (!showTokenWarnings) {
        proceed()
        return
      }

      const address = currency.isToken ? getValidAddress(currency) : null

      const severity = getTokenWarningSeverity(currencyInfo)
      const protectionWarning = getTokenProtectionWarning(currencyInfo)
      const warningDismissed = Boolean(
        address && dismissedWarningTokens[currency.chainId]?.[address]?.warnings.includes(protectionWarning),
      )
      const needsTokenWarning =
        severity === WarningSeverity.Blocked || (severity !== WarningSeverity.None && !warningDismissed)

      const bridgedDismissed = Boolean(address && dismissedBridgedAssetWarnings[currency.chainId]?.[address])
      const needsBridgedWarning = Boolean(currencyInfo.isBridged) && !bridgedDismissed

      if (needsTokenWarning) {
        showPendingSelection({
          currencyInfo,
          step: 'token-warning',
          needsBridgedStepAfterWarning: needsBridgedWarning,
          proceed,
        })
      } else if (needsBridgedWarning) {
        showPendingSelection({ currencyInfo, step: 'bridged-asset', needsBridgedStepAfterWarning: false, proceed })
      } else {
        proceed()
      }
    },
  )

  const closePendingSelection = useCallback(() => setPendingSelection(null), [])

  const onAcknowledgeWarning = useCallback(() => {
    if (!pendingSelection) {
      return
    }
    if (pendingSelection.step === 'token-warning' && pendingSelection.needsBridgedStepAfterWarning) {
      setPendingSelection({ ...pendingSelection, step: 'bridged-asset', needsBridgedStepAfterWarning: false })
      return
    }
    setPendingSelection(null)
    pendingSelection.proceed()
  }, [pendingSelection])

  const pendingModal = useMemo(() => {
    if (!pendingSelection) {
      return null
    }
    if (pendingSelection.step === 'bridged-asset') {
      return (
        <BridgedAssetModal
          isOpen
          currencyInfo0={pendingSelection.currencyInfo}
          onClose={closePendingSelection}
          onContinue={onAcknowledgeWarning}
        />
      )
    }
    return (
      <TokenWarningModal
        isVisible
        currencyInfo0={pendingSelection.currencyInfo}
        closeModalOnly={closePendingSelection}
        onAcknowledge={onAcknowledgeWarning}
      />
    )
  }, [pendingSelection, closePendingSelection, onAcknowledgeWarning])

  return { handleTokenPress, pendingModal }
}
