/**
 * HookSwap Terminal — Send (native-framed transfer screen).
 *
 * The "Send" tab of the Terminal swap ticket routes here (mirrors how "Limit"
 * routes to `/terminal/limit`). Transfers are deeply coupled to the real send
 * pipeline — recipient/ENS resolution (`useDerivedSendInfo`), the on-chain
 * transfer callback (`useSendCallback`), the self-send / smart-contract /
 * new-address speed bumps and the review→confirm sequence. Rebuilding that
 * natively would risk breaking a live transactional flow, so this screen uses
 * the SAFE approach: it renders the REAL, working `SendForm` (the exact
 * component the app's global Send modal mounts) inside Terminal chrome.
 *
 * Provider stack mirrors the app's `SendFormModal` EXACTLY (Multichain →
 * SwapAndLimit → SendContext → TransactionModal), except it drops the `<Modal>`
 * overlay so the form renders inline in the Terminal content region. On web,
 * `TransactionModal` is just a Flex + context provider (not an overlay), so this
 * is a plain inline mount — no bottom sheet.
 *
 * REAL transfer only (no mock): amounts, balances, recipient resolution and the
 * actual on-chain send all come from the app's own send engine. Disconnected →
 * the form renders a real "Connect wallet" button (opens the app AccountDrawer).
 *
 * Default input currency = the connected chain's native token, defaulting to
 * Robinhood (the only chain the Terminal offers for live trading) when
 * disconnected. The user re-selects any token via the real currency selector.
 */
import { useMemo } from 'react'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TransactionModal } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModal'
import { noop } from 'utilities/src/react/noop'
import { SwapAndLimitContextProvider } from '~/features/Swap/state/SwapContext'
import { useAccount } from '~/hooks/useAccount'
import { SendForm } from '~/pages/Swap/Send/SendForm'
import { SendContextProvider } from '~/pages/Swap/Send/state/SendContext'
import { MultichainContextProvider } from '~/state/multichain/MultichainContext'
import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'

const DISPLAY = terminalFonts.display
const SANS = terminalFonts.sans

/** Fixed width of the framed transfer module — matches the app's Send modal (420px). */
const MODULE_WIDTH = 420

/**
 * Send screen. Mounts the app's real `SendForm` provider stack (identical to the
 * global `SendFormModal`, minus the overlay) framed in Terminal chrome. Keyed on
 * the resolved chain so switching wallets re-initializes a valid native default.
 */
export function SendScreen(): JSX.Element {
  const account = useAccount()
  // Robinhood is the only chain the Terminal offers for live trading right now;
  // fall back to it when disconnected, else use the connected chain's native token.
  const chainId = account.chainId ?? UniverseChainId.Robinhood
  const initialInputCurrency = useMemo(() => nativeOnChain(chainId), [chainId])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 640 }}>
      {/* Content header — Atlas chrome, matches other Terminal screens. */}
      <div
        style={{
          height: 52,
          flexShrink: 0,
          borderBottom: `1px solid ${terminalColors.line2}`,
          background: terminalColors.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--tm-gutter)',
        }}
      >
        <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 15, color: terminalColors.ink }}>Send</span>
        <span style={{ fontFamily: SANS, fontSize: 12, color: terminalColors.ink3Alt }}>
          Transfer tokens to any wallet address or ENS name
        </span>
      </div>

      {/* Centered framed form — content region is viewport − rail; the fixed
          max-width column keeps it clear of horizontal overflow. */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          background: terminalColors.bgApp,
          overflowY: 'auto',
          display: 'flex',
          justifyContent: 'center',
          padding: '28px var(--tm-gutter) 48px',
        }}
      >
        <div style={{ width: '100%', maxWidth: MODULE_WIDTH }}>
          <MultichainContextProvider key={chainId} initialChainId={chainId}>
            <SwapAndLimitContextProvider initialInputCurrency={initialInputCurrency}>
              <SendContextProvider>
                <TransactionModal modalName={ModalName.Send} onClose={noop}>
                  <SendForm />
                </TransactionModal>
              </SendContextProvider>
            </SwapAndLimitContextProvider>
          </MultichainContextProvider>
        </div>
      </div>
    </div>
  )
}
