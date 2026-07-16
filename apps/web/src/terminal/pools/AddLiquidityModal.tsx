/**
 * HookSwap Terminal — Add-liquidity modal for an EXISTING v2 position.
 *
 * Opened from a v2 row's "Add" action on the Positions screen. Deposits into the
 * pair the position already holds, at the current on-chain reserve ratio, via the
 * client-side `useAddV2Liquidity` hook (direct to the deployed own UniswapV2Router02
 * — NO backend, NO Permit2). This REPLACES the legacy navigate-to-Uniswap add flow,
 * whose hosted liquidity gateway 404s on Robinhood.
 *
 * DATA POLICY (no mock data — handoff hard rule): every displayed value comes from the
 * hook's REAL on-chain reads. The typed side echoes the user input; the counterpart
 * side shows the hook's DERIVED amount (`baseAmountFormatted` / `projectAmountFormatted`)
 * computed from live reserves. While reserves are still loading the derived side shows an
 * honest "—", never a fabricated 0.
 *
 * Native/WETH mapping (mirrors `PoolsScreen`/`useCreateV2Pool`): when one pair side is the
 * chain's WETH, it is mapped to the hook's `base` with the NATIVE sentinel so the user
 * deposits native ETH (the router wraps it — no approval). The other ERC-20 side is
 * `project`. When neither side is WETH, both sides are ERC-20 (`base` = currency0).
 */
import type { Currency } from '@uniswap/sdk-core'
import { useMemo, useState } from 'react'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import type { V2PairInfo } from 'uniswap/src/features/positions/types'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { DoubleCurrencyLogo } from '~/components/Logo/DoubleLogo'
import { useAccount } from '~/hooks/useAccount'
import { Modal } from '~/terminal/components/Modal'
import { getPoolAddresses } from '~/terminal/pools/addresses'
import { DEFAULT_ADD_SLIPPAGE_BIPS, useAddV2Liquidity, type AddLiquiditySide } from '~/terminal/pools/useAddV2Liquidity'
import type { PoolTokenInput } from '~/terminal/pools/useCreateV2Pool'
import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'
import { assume0xAddress } from '~/utils/wagmi'

const MONO = terminalFonts.mono
const SANS = terminalFonts.sans

/* ------------------------------------------------------------------ helpers */

/** ERC-20 address of a currency, or undefined for the native currency. */
function tokenAddress(c: Currency): string | undefined {
  return c.isToken ? c.address : undefined
}

function sanitizeNumberInput(raw: string): string {
  const cleaned = raw.replace(/[^0-9.]/g, '')
  const first = cleaned.indexOf('.')
  if (first === -1) {
    return cleaned
  }
  return cleaned.slice(0, first + 1) + cleaned.slice(first + 1).replace(/\./g, '')
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

function SummaryRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }): JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0' }}>
      <span style={{ fontFamily: SANS, fontSize: 12.5, color: terminalColors.ink3Alt }}>{label}</span>
      <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 500, color: valueColor ?? terminalColors.ink }}>
        {value}
      </span>
    </div>
  )
}

/** A deposit input row matching the PoolsScreen `DepositField` styling exactly. */
function DepositField({
  symbol,
  amount,
  onChange,
  derivedLabel,
  readOnly,
}: {
  symbol: string
  amount: string
  onChange?: (v: string) => void
  derivedLabel?: string
  readOnly?: boolean
}): JSX.Element {
  return (
    <div
      style={{
        border: `1px solid ${terminalColors.line}`,
        borderRadius: 11,
        background: terminalColors.bg,
        padding: '11px 12px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: terminalColors.panel2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: MONO,
              fontSize: 10,
              fontWeight: 600,
              color: terminalColors.ink2,
              flexShrink: 0,
            }}
          >
            {symbol.slice(0, 1)}
          </span>
          <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: terminalColors.ink }}>{symbol}</span>
        </span>
        {derivedLabel ? (
          <span style={{ fontFamily: MONO, fontSize: 10.5, color: terminalColors.faint }}>{derivedLabel}</span>
        ) : null}
      </div>
      <input
        value={amount}
        onChange={onChange ? (e) => onChange(sanitizeNumberInput(e.target.value)) : undefined}
        readOnly={readOnly}
        placeholder="0.00"
        inputMode="decimal"
        style={{
          width: '100%',
          minWidth: 0,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontFamily: MONO,
          fontSize: 20,
          fontWeight: 600,
          color: readOnly ? terminalColors.ink2 : terminalColors.ink,
          padding: 0,
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ the modal */

export function AddLiquidityModal({
  position,
  open,
  onClose,
  onSuccess,
}: {
  position: V2PairInfo
  open: boolean
  onClose: () => void
  /** Called after a confirmed add (so the caller can refetch its positions list). */
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
  const a0 = tokenAddress(c0)
  const a1 = tokenAddress(c1)

  // Map the pair's two tokens onto the hook's base/project. A WETH side becomes the
  // native base (deposit native ETH — the router wraps it, no approval). Otherwise
  // both sides are ERC-20 with currency0 as base.
  const c0IsWeth = Boolean(wethLower && a0 && a0.toLowerCase() === wethLower)
  const c1IsWeth = Boolean(wethLower && a1 && a1.toLowerCase() === wethLower)

  const { base, project, baseSymbol, projectSymbol, baseIsNative } = useMemo((): {
    base: PoolTokenInput
    project: PoolTokenInput
    baseSymbol: string
    projectSymbol: string
    baseIsNative: boolean
  } => {
    if (c0IsWeth) {
      return {
        base: { address: NATIVE_CHAIN_ID, decimals: 18, symbol: nativeSymbol },
        project: { address: a1, decimals: c1.decimals, symbol: c1.symbol },
        baseSymbol: nativeSymbol,
        projectSymbol: c1.symbol ?? 'Token',
        baseIsNative: true,
      }
    }
    if (c1IsWeth) {
      return {
        base: { address: NATIVE_CHAIN_ID, decimals: 18, symbol: nativeSymbol },
        project: { address: a0, decimals: c0.decimals, symbol: c0.symbol },
        baseSymbol: nativeSymbol,
        projectSymbol: c0.symbol ?? 'Token',
        baseIsNative: true,
      }
    }
    return {
      base: { address: a0, decimals: c0.decimals, symbol: c0.symbol },
      project: { address: a1, decimals: c1.decimals, symbol: c1.symbol },
      baseSymbol: c0.symbol ?? 'Token',
      projectSymbol: c1.symbol ?? 'Token',
      baseIsNative: false,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c0IsWeth, c1IsWeth, a0, a1, c0.decimals, c1.decimals, c0.symbol, c1.symbol, nativeSymbol])

  const [inputSide, setInputSide] = useState<AddLiquiditySide>('base')
  const [inputAmount, setInputAmount] = useState('')

  const add = useAddV2Liquidity({ chainId, owner, base, project, inputSide, inputAmount })

  // Field values: the typed side echoes the input; the other shows the hook's derived amount.
  const baseFieldValue = inputSide === 'base' ? inputAmount : trimAmount(add.baseAmountFormatted)
  const projectFieldValue = inputSide === 'project' ? inputAmount : trimAmount(add.projectAmountFormatted)

  const onBaseChange = (v: string): void => {
    setInputSide('base')
    setInputAmount(v)
  }
  const onProjectChange = (v: string): void => {
    setInputSide('project')
    setInputAmount(v)
  }

  const busy = add.isWritePending || add.baseApproving || add.projectApproving || add.isConfirming

  const closeAndReset = (): void => {
    add.reset()
    setInputAmount('')
    setInputSide('base')
    onClose()
  }

  const onPrimary = (): void => {
    if (!connected) {
      accountDrawer.open()
      return
    }
    if (add.isDone) {
      onSuccess?.()
      closeAndReset()
      return
    }
    if (add.needsProjectApproval) {
      void add.approveProject()
      return
    }
    if (add.needsBaseApproval) {
      void add.approveBase()
      return
    }
    void add.add()
  }

  const primaryLabel = ((): string => {
    if (!chainReady) {
      return 'Not available on this network'
    }
    if (!connected) {
      return 'Connect wallet'
    }
    if (add.isDone) {
      return 'Done — close'
    }
    if (add.projectApproving || add.baseApproving) {
      return 'Approving…'
    }
    if (add.isWritePending) {
      return 'Confirm in wallet…'
    }
    if (add.isConfirming) {
      return 'Adding liquidity…'
    }
    if (!add.reservesLoaded) {
      return 'Loading pool…'
    }
    if (!add.poolHasReserves) {
      return 'Pool has no reserves'
    }
    if (!inputAmount || !add.inputsValid) {
      return 'Enter an amount'
    }
    if (add.needsProjectApproval) {
      return `Approve ${projectSymbol}`
    }
    if (add.needsBaseApproval) {
      return `Approve ${baseSymbol}`
    }
    return 'Add liquidity'
  })()

  const primaryDisabled = ((): boolean => {
    if (!chainReady) {
      return true
    }
    if (!connected || add.isDone) {
      return false
    }
    if (busy || !add.reservesLoaded || !add.poolHasReserves) {
      return true
    }
    if (add.needsProjectApproval || add.needsBaseApproval) {
      return false
    }
    return !add.canAdd
  })()

  if (!open) {
    return null
  }

  return (
    <Modal open={open} onClose={busy ? () => undefined : closeAndReset} title="Add liquidity" width={420} radius={20}>
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
          <Notice>Add liquidity isn&apos;t available on this network yet.</Notice>
        ) : (
          <>
            {/* Deposit — the typed side; counterpart is derived from live reserves */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <DepositField
                symbol={baseSymbol}
                amount={baseFieldValue}
                onChange={onBaseChange}
                derivedLabel={inputSide === 'project' ? 'estimated' : undefined}
              />
              <DepositField
                symbol={projectSymbol}
                amount={projectFieldValue}
                onChange={onProjectChange}
                derivedLabel={inputSide === 'base' ? 'estimated' : undefined}
              />
            </div>

            {baseIsNative ? (
              <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.faint }}>
                Native {baseSymbol} is wrapped for the pool — no approval needed.
              </div>
            ) : null}

            {/* Summary */}
            <div>
              <SummaryRow label="Rate source" value="Current pool reserves" />
              <SummaryRow label="Slippage tolerance" value={`${(DEFAULT_ADD_SLIPPAGE_BIPS / 100).toFixed(2)}%`} />
            </div>

            {add.isDone ? (
              <Notice tone="green">Liquidity added. Your position updates once the block is indexed.</Notice>
            ) : add.error ? (
              <div style={{ fontFamily: SANS, fontSize: 11.5, color: terminalColors.redDown, lineHeight: 1.5 }}>
                {add.error}
              </div>
            ) : add.reservesLoaded && !add.poolHasReserves ? (
              <Notice>This pool has no reserves to match against. Add liquidity from the New pool flow instead.</Notice>
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
