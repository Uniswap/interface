/**
 * HookSwap Terminal — Remove-liquidity modal for an EXISTING v2 position.
 *
 * Opened from a v2 row's "Remove" action on the Positions screen. Burns a chosen
 * percentage of the wallet's LP (pair) tokens back into the two underlying tokens via
 * the client-side `useRemoveV2Liquidity` hook (direct to the deployed own
 * UniswapV2Router02 — NO backend, NO Permit2). This REPLACES the legacy
 * navigate-to-Uniswap remove flow, whose hosted liquidity gateway 404s on Robinhood.
 *
 * v2 has no separate fee "collect": swap fees accrue into the pool reserves and are
 * realized pro-rata on remove — so the previewed token-out amounts already INCLUDE the
 * position's share of accrued fees. (That is why the Positions screen shows no Collect
 * button for v2.)
 *
 * DATA POLICY (no mock data — handoff hard rule): the LP balance and the previewed
 * amounts-out are the hook's REAL on-chain reads (`lpBalanceFormatted`,
 * `expectedAmountA/BFormatted`). While the balance is still loading the preview shows an
 * honest "—", never a fabricated 0.
 */
import type { Currency } from '@uniswap/sdk-core'
import { useMemo, useState } from 'react'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import type { V2PairInfo } from 'uniswap/src/features/positions/types'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { DoubleCurrencyLogo } from '~/components/Logo/DoubleLogo'
import { useAccount } from '~/hooks/useAccount'
import { Modal } from '~/terminal/components/Modal'
import { getPoolAddresses } from '~/terminal/pools/addresses'
import { DEFAULT_REMOVE_SLIPPAGE_BIPS, useRemoveV2Liquidity } from '~/terminal/pools/useRemoveV2Liquidity'
import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'
import { assume0xAddress } from '~/utils/wagmi'

const MONO = terminalFonts.mono
const SANS = terminalFonts.sans

const PRESETS = [25, 50, 75, 100] as const

/* ------------------------------------------------------------------ helpers */

function tokenAddress(c: Currency): string | undefined {
  return c.isToken ? c.address : undefined
}

/** Trim a full-precision formatUnits string to a readable length without fabricating digits. */
function trimAmount(v?: string): string {
  if (!v) {
    return '—'
  }
  const n = Number(v)
  if (!Number.isFinite(n)) {
    return v
  }
  if (n === 0) {
    return '0'
  }
  return n.toLocaleString('en-US', { maximumFractionDigits: n >= 1 ? 6 : 10 })
}

/* ------------------------------------------------------------------ styled bits */

function Notice({ tone = 'neutral', children }: { tone?: 'neutral' | 'green'; children: React.ReactNode }): JSX.Element {
  const green = tone === 'green'
  return (
    <div
      style={{
        fontFamily: SANS,
        fontSize: 12,
        lineHeight: 1.5,
        color: green ? terminalColors.greenDeep : terminalColors.ink2,
        background: green ? terminalColors.greenBg : terminalColors.panel,
        border: `1px solid ${green ? terminalColors.greenBorder : terminalColors.line}`,
        borderRadius: 11,
        padding: '10px 12px',
      }}
    >
      {children}
    </div>
  )
}

function OutRow({ symbol, amount }: { symbol: string; amount: string }): JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: terminalColors.panel2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: MONO,
            fontSize: 9,
            fontWeight: 600,
            color: terminalColors.ink2,
          }}
        >
          {symbol.slice(0, 1)}
        </span>
        <span style={{ fontFamily: SANS, fontSize: 12.5, color: terminalColors.ink2 }}>{symbol}</span>
      </span>
      <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: terminalColors.ink }}>{amount}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ the modal */

export function RemoveLiquidityModal({
  position,
  open,
  onClose,
  onSuccess,
}: {
  position: V2PairInfo
  open: boolean
  onClose: () => void
  /** Called after a confirmed remove (so the caller can refetch its positions list). */
  onSuccess?: () => void
}): JSX.Element | null {
  const account = useAccount()
  const accountDrawer = useAccountDrawer()
  const connected = Boolean(account.address)
  const owner = assume0xAddress(account.address)

  const chainId = position.chainId
  const addrs = getPoolAddresses(chainId)
  const chainReady = Boolean(addrs)
  const wethLower = addrs?.weth?.toLowerCase()
  const nativeSymbol = ((): string => {
    try {
      return getChainInfo(chainId).nativeCurrency.symbol ?? 'ETH'
    } catch {
      return 'ETH'
    }
  })()

  const c0 = position.currency0Amount.currency
  const c1 = position.currency1Amount.currency
  const pairAddress = position.liquidityToken.address

  const tokenA = useMemo(
    () => ({ address: tokenAddress(c0), decimals: c0.decimals, symbol: c0.symbol }),
    [c0],
  )
  const tokenB = useMemo(
    () => ({ address: tokenAddress(c1), decimals: c1.decimals, symbol: c1.symbol }),
    [c1],
  )

  const aIsWeth = Boolean(wethLower && tokenA.address && tokenA.address.toLowerCase() === wethLower)
  const bIsWeth = Boolean(wethLower && tokenB.address && tokenB.address.toLowerCase() === wethLower)

  const [percent, setPercent] = useState(50)
  const [receiveNative, setReceiveNative] = useState(true)

  const remove = useRemoveV2Liquidity({
    chainId,
    owner,
    pairAddress,
    tokenA,
    tokenB,
    percent,
    receiveNative,
  })

  // Display symbols: a WETH side shows the native symbol when unwrapping to native ETH.
  const symbolA = aIsWeth && remove.willReceiveNative ? nativeSymbol : c0.symbol ?? 'Token'
  const symbolB = bIsWeth && remove.willReceiveNative ? nativeSymbol : c1.symbol ?? 'Token'

  const busy = remove.isWritePending || remove.approving || remove.isConfirming
  const hasBalance = remove.lpBalanceRaw !== undefined && remove.lpBalanceRaw > 0n

  const closeAndReset = (): void => {
    remove.reset()
    onClose()
  }

  const onPrimary = (): void => {
    if (!connected) {
      accountDrawer.open()
      return
    }
    if (remove.isDone) {
      onSuccess?.()
      closeAndReset()
      return
    }
    if (remove.needsApproval) {
      void remove.approve()
      return
    }
    void remove.remove()
  }

  const primaryLabel = ((): string => {
    if (!chainReady) {
      return 'Not available on this network'
    }
    if (!connected) {
      return 'Connect wallet'
    }
    if (remove.isDone) {
      return 'Done — close'
    }
    if (remove.approving) {
      return 'Approving…'
    }
    if (remove.isWritePending) {
      return 'Confirm in wallet…'
    }
    if (remove.isConfirming) {
      return 'Removing…'
    }
    if (remove.lpBalanceRaw === undefined) {
      return 'Loading balance…'
    }
    if (!hasBalance) {
      return 'No LP balance'
    }
    if (!remove.inputsValid) {
      return 'Select an amount'
    }
    if (remove.needsApproval) {
      return 'Approve LP token'
    }
    return 'Remove liquidity'
  })()

  const primaryDisabled = ((): boolean => {
    if (!chainReady) {
      return true
    }
    if (!connected || remove.isDone) {
      return false
    }
    if (busy || remove.lpBalanceRaw === undefined || !hasBalance) {
      return true
    }
    if (remove.needsApproval) {
      return false
    }
    return !remove.canRemove
  })()

  if (!open) {
    return null
  }

  return (
    <Modal open={open} onClose={busy ? () => undefined : closeAndReset} title="Remove liquidity" width={420} radius={20}>
      <div style={{ padding: '2px 22px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Pair header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <DoubleCurrencyLogo currencies={[c0, c1]} size={24} />
          <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: terminalColors.ink }}>
            {c0.symbol ?? '—'} / {c1.symbol ?? '—'}
          </div>
          <span
            style={{
              marginLeft: 'auto',
              fontFamily: MONO,
              fontSize: 11,
              fontWeight: 600,
              color: terminalColors.greenDeep,
              background: terminalColors.greenBg,
              border: `1px solid ${terminalColors.greenBorder}`,
              padding: '2px 8px',
              borderRadius: 999,
            }}
          >
            v2 · 0.30%
          </span>
        </div>

        {!chainReady ? (
          <Notice>Remove liquidity isn&apos;t available on this network yet.</Notice>
        ) : (
          <>
            {/* Percent selector */}
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: SANS, fontSize: 11.5, color: terminalColors.ink3Alt }}>Amount to remove</span>
                <span style={{ fontFamily: MONO, fontSize: 20, fontWeight: 600, color: terminalColors.ink }}>
                  {percent}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={percent}
                onChange={(e) => setPercent(Number(e.target.value))}
                style={{ width: '100%', accentColor: terminalColors.brandGreen, cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                {PRESETS.map((p) => {
                  const active = percent === p
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPercent(p)}
                      style={{
                        flex: 1,
                        fontFamily: MONO,
                        fontSize: 12,
                        fontWeight: 600,
                        color: active ? terminalColors.btnInk : terminalColors.ink2,
                        background: active ? terminalColors.brandGreen : terminalColors.bg,
                        border: `1px solid ${active ? terminalColors.brandGreen : terminalColors.line}`,
                        padding: '6px 0',
                        borderRadius: 9,
                        cursor: 'pointer',
                      }}
                    >
                      {p === 100 ? 'Max' : `${p}%`}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* LP balance + preview */}
            <div
              style={{
                border: `1px solid ${terminalColors.line}`,
                borderRadius: 11,
                background: terminalColors.panel,
                padding: '10px 12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8 }}>
                <span style={{ fontFamily: SANS, fontSize: 12, color: terminalColors.ink3Alt }}>LP balance</span>
                <span style={{ fontFamily: MONO, fontSize: 12.5, color: terminalColors.ink }}>
                  {trimAmount(remove.lpBalanceFormatted)}
                </span>
              </div>
              <div style={{ borderTop: `1px solid ${terminalColors.line}`, paddingTop: 4 }}>
                <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.faint, padding: '5px 0 2px' }}>
                  You receive
                </div>
                <OutRow symbol={symbolA} amount={trimAmount(remove.expectedAmountAFormatted)} />
                <OutRow symbol={symbolB} amount={trimAmount(remove.expectedAmountBFormatted)} />
              </div>
            </div>

            {/* Receive-native toggle (only when a WETH side exists) */}
            {remove.hasNativeSide ? (
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <span style={{ fontFamily: SANS, fontSize: 12.5, color: terminalColors.ink2 }}>
                  Receive native {nativeSymbol}
                </span>
                <input
                  type="checkbox"
                  checked={receiveNative}
                  onChange={(e) => setReceiveNative(e.target.checked)}
                  style={{ accentColor: terminalColors.brandGreen, width: 16, height: 16, cursor: 'pointer' }}
                />
              </label>
            ) : null}

            <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.faint, lineHeight: 1.5 }}>
              Slippage tolerance {(DEFAULT_REMOVE_SLIPPAGE_BIPS / 100).toFixed(2)}%. Amounts shown include your share of
              accrued v2 fees.
            </div>

            {remove.isDone ? (
              <Notice tone="green">Liquidity removed. Your position updates once the block is indexed.</Notice>
            ) : remove.error ? (
              <div style={{ fontFamily: SANS, fontSize: 11.5, color: terminalColors.redDown, lineHeight: 1.5 }}>
                {remove.error}
              </div>
            ) : null}

            <button
              type="button"
              onClick={onPrimary}
              disabled={primaryDisabled}
              style={{
                width: '100%',
                fontFamily: SANS,
                fontSize: 14,
                fontWeight: 600,
                color: terminalColors.btnInk,
                background: primaryDisabled ? terminalColors.line : terminalColors.brandGreen,
                border: 'none',
                padding: '12px 0',
                borderRadius: 12,
                cursor: primaryDisabled ? 'default' : 'pointer',
              }}
            >
              {primaryLabel}
            </button>
          </>
        )}
      </div>
    </Modal>
  )
}
