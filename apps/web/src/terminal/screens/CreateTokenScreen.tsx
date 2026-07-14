/**
 * HookSwap Terminal — Create Token / launch a fixed-supply ERC-20 (INLINE, client-side).
 *
 * Robinhood-only launch scope. Launching a token here is a self-contained CLIENT-SIDE flow
 * against the deployed `HookSwapTokenFactory` — NO backend, NO Permit2, NO approval: a
 * single `createToken(name, symbol, decimals, supply)` deploys a fresh `HookSwapERC20` whose
 * full supply is minted to you. See `~/terminal/tokenfactory/useCreateToken`.
 *
 * DATA POLICY (no mock data — handoff hard rule):
 *   • Inputs — name / symbol / decimals / supply come straight from the user; validated
 *     (non-empty name + symbol, positive supply) before a tx can be signed.
 *   • Create fee — REAL on-chain read of `createFee()` (forwarded as `value`; 0 = free).
 *   • Create — REAL write (wagmi); the new token address is DECODED from the on-chain
 *     `TokenCreated` log — never fabricated.
 *   • When the factory isn't deployed on the chain, the screen renders an honest
 *     "not deployed" state — never a fake success. The new token address then hands off to
 *     the pool-creation flow (`/pools/new?project=<address>`).
 */
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { formatUnits } from '~/chains'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { useAccount } from '~/hooks/useAccount'
import { StatCard } from '~/terminal/components/StatCard'
import { getTokenFactoryAddress } from '~/terminal/tokenfactory/addresses'
import { useCreateToken } from '~/terminal/tokenfactory/useCreateToken'
import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'
import { assume0xAddress } from '~/utils/wagmi'

const MONO = terminalFonts.mono
const DISPLAY = terminalFonts.display
const SANS = terminalFonts.sans

/* ------------------------------------------------------------------ helpers */

function shortAddr(a?: string): string {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '—'
}

/* ------------------------------------------------------------------ primitives */

function Panel({ children, padding = 18 }: { children: React.ReactNode; padding?: number }): JSX.Element {
  return (
    <div
      style={{
        border: `1px solid ${terminalColors.line}`,
        borderRadius: 14,
        background: terminalColors.bg,
        padding,
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  )
}

function StepLabel({ index, label, note }: { index: string; label: string; note?: string }): JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
      <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', color: terminalColors.ink3Alt }}>
        {index} · {label.toUpperCase()}
      </span>
      {note ? <span style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.ink3Alt }}>{note}</span> : null}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }): JSX.Element {
  return <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.ink3Alt, marginBottom: 5 }}>{children}</div>
}

function TextField({
  value,
  onChange,
  placeholder,
  mono = false,
  maxLength,
  inputMode,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  mono?: boolean
  maxLength?: number
  inputMode?: 'text' | 'decimal' | 'numeric'
}): JSX.Element {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      spellCheck={false}
      maxLength={maxLength}
      inputMode={inputMode}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        border: `1px solid ${terminalColors.line}`,
        borderRadius: 11,
        background: terminalColors.bg,
        padding: '10px 12px',
        fontFamily: mono ? MONO : SANS,
        fontSize: 13.5,
        fontWeight: mono ? 500 : 600,
        color: terminalColors.ink,
        outline: 'none',
      }}
    />
  )
}

function SummaryRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }): JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0' }}>
      <span style={{ fontFamily: SANS, fontSize: 12.5, color: terminalColors.ink3Alt }}>{label}</span>
      <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 500, color: valueColor ?? terminalColors.ink }}>{value}</span>
    </div>
  )
}

function Notice({ tone = 'neutral', children }: { tone?: 'neutral' | 'green' | 'muted' | 'red'; children: React.ReactNode }): JSX.Element {
  const border = tone === 'green' ? terminalColors.greenBorder : tone === 'red' ? terminalColors.redDown : terminalColors.line
  const bg = tone === 'green' ? terminalColors.greenBg : tone === 'red' ? terminalColors.redBg : terminalColors.panel
  const color = tone === 'green' ? terminalColors.greenDeep : tone === 'red' ? terminalColors.redDown : terminalColors.ink2
  return (
    <div
      style={{
        fontFamily: SANS,
        fontSize: 12,
        lineHeight: 1.5,
        color,
        background: bg,
        border: `1px ${tone === 'muted' ? 'dashed' : 'solid'} ${border}`,
        borderRadius: 11,
        padding: '10px 12px',
      }}
    >
      {children}
    </div>
  )
}

function PrimaryButton({
  label,
  onClick,
  disabled,
  variant = 'solid',
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: 'solid' | 'outline'
}): JSX.Element {
  const solid = variant === 'solid'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        marginTop: 12,
        width: '100%',
        fontFamily: SANS,
        fontSize: 14,
        fontWeight: 600,
        color: solid ? terminalColors.btnInk : terminalColors.greenDeep,
        background: solid ? (disabled ? terminalColors.line : terminalColors.brandGreen) : 'transparent',
        border: solid ? 'none' : `1px solid ${terminalColors.greenBorder}`,
        padding: '12px 0',
        borderRadius: 12,
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {label}
    </button>
  )
}

/** Honest "contract not deployed on this chain" note. */
function NotDeployedNote({ chainLabel }: { chainLabel: string }): JSX.Element {
  return (
    <div
      style={{
        fontFamily: SANS,
        fontSize: 12.5,
        color: terminalColors.ink3Alt,
        lineHeight: 1.5,
        border: `1px dashed ${terminalColors.line}`,
        borderRadius: 11,
        background: terminalColors.panel,
        padding: '11px 13px',
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: '0.06em',
          color: terminalColors.greenDeep,
          marginBottom: 6,
        }}
      >
        COMING SOON
      </div>
      Token creation isn&apos;t live on {chainLabel} yet — this screen activates automatically once the HookSwap token
      factory is deployed.
    </div>
  )
}

/* ------------------------------------------------------------------ the screen */

export function CreateTokenScreen(): JSX.Element {
  const account = useAccount()
  const accountDrawer = useAccountDrawer()
  const navigate = useNavigate()

  const chainId = account.chainId ?? UniverseChainId.Robinhood
  const connected = Boolean(account.address)
  const owner = assume0xAddress(account.address)

  const factory = getTokenFactoryAddress(chainId)
  const deployed = Boolean(factory)
  const chainLabel = getChainLabel(chainId)

  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [decimalsInput, setDecimalsInput] = useState('18')
  const [supply, setSupply] = useState('')

  // Decimals: default 18, clamped to 0–18 (uint8 display decimals). Falls back to 18 when blank.
  const decimals = ((): number => {
    const n = Number(decimalsInput)
    if (!Number.isInteger(n) || n < 0 || n > 18) {
      return 18
    }
    return n
  })()
  const decimalsValid = decimalsInput !== '' && Number.isInteger(Number(decimalsInput)) && Number(decimalsInput) >= 0 && Number(decimalsInput) <= 18

  const create = useCreateToken({
    chainId,
    owner,
    name,
    symbol,
    decimals,
    supply,
  })

  const feeLabel =
    create.createFee !== undefined
      ? create.createFee === 0n
        ? 'Free'
        : `${Number(formatUnits(create.createFee, 18)).toLocaleString('en-US', { maximumFractionDigits: 6 })} native`
      : '—'

  /* --------------------------------------------------------------- primary action */

  const busy = create.isWritePending || create.isConfirming

  const onPrimary = (): void => {
    if (!connected) {
      accountDrawer.open()
      return
    }
    if (create.isDone) {
      // Launch another token.
      create.reset()
      setName('')
      setSymbol('')
      setDecimalsInput('18')
      setSupply('')
      return
    }
    void create.create()
  }

  const primaryLabel = ((): string => {
    if (!deployed) {
      return 'Not available on this network'
    }
    if (!connected) {
      return 'Connect wallet to create a token'
    }
    if (create.isDone) {
      return 'Create another token'
    }
    if (!decimalsValid) {
      return 'Decimals must be 0–18'
    }
    if (!create.inputsValid) {
      return 'Enter name, symbol & supply'
    }
    if (create.isWritePending) {
      return 'Confirm in wallet…'
    }
    if (create.isConfirming) {
      return 'Deploying token…'
    }
    return 'Create token'
  })()

  const primaryDisabled = ((): boolean => {
    if (!deployed) {
      return true
    }
    if (!connected) {
      return false
    }
    if (create.isDone) {
      return false
    }
    if (!decimalsValid || busy) {
      return true
    }
    return !create.canCreate
  })()

  const onSeedPool = (): void => {
    if (create.createdTokenAddress) {
      navigate(`/pools/new?project=${create.createdTokenAddress}`)
    }
  }

  /* --------------------------------------------------------------- stat values */

  const supplyValue = supply.trim() !== '' && create.supplyRaw !== undefined ? Number(supply).toLocaleString('en-US') : '—'
  const symbolValue = symbol.trim() !== '' ? symbol.trim().toUpperCase() : '—'
  const decimalsValue = decimalsValid ? String(decimals) : '—'
  const networkValue = deployed ? chainLabel : 'Not live'

  return (
    <div style={{ padding: '20px var(--tm-gutter) 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', color: terminalColors.ink, margin: 0 }}>
          Create token
        </h1>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 11,
            fontWeight: 600,
            color: terminalColors.greenDeep,
            background: terminalColors.greenBg,
            border: `1px solid ${terminalColors.greenBorder}`,
            padding: '3px 8px',
            borderRadius: 999,
          }}
        >
          fixed supply · ERC-20
        </span>
      </div>
      <div style={{ fontFamily: SANS, fontSize: 13, color: terminalColors.ink2, marginBottom: 18, maxWidth: 560, lineHeight: 1.5 }}>
        Launch a fixed-supply ERC-20 in one transaction — the entire supply is minted to your wallet. No deploy,
        no code. Then seed it with liquidity in the pool flow.
      </div>

      {/* Stat tiles — honest "—" when disconnected / not deployed. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
        <StatCard size="lg" label="Symbol" value={symbolValue} />
        <StatCard size="lg" label="Total supply" value={supplyValue} />
        <StatCard size="lg" label="Decimals" value={decimalsValue} />
        <StatCard size="lg" label="Network" value={networkValue} valueColor={deployed ? 'up' : 'ink'} />
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Left: token details */}
        <div style={{ flex: '1 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel>
            <StepLabel index="01" label="Token details" note={deployed ? undefined : 'not deployed'} />
            {!deployed ? (
              <NotDeployedNote chainLabel={chainLabel} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <FieldLabel>Name</FieldLabel>
                  <TextField value={name} onChange={setName} placeholder="My Token" maxLength={64} />
                </div>
                <div>
                  <FieldLabel>Symbol</FieldLabel>
                  <TextField
                    value={symbol}
                    onChange={(v) => setSymbol(v.toUpperCase())}
                    placeholder="MYT"
                    mono
                    maxLength={16}
                  />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                    <FieldLabel>Decimals</FieldLabel>
                    <TextField
                      value={decimalsInput}
                      onChange={(v) => setDecimalsInput(v.replace(/[^0-9]/g, '').slice(0, 2))}
                      placeholder="18"
                      mono
                      inputMode="numeric"
                    />
                    {!decimalsValid ? (
                      <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.redDown, marginTop: 5 }}>
                        Must be a whole number 0–18.
                      </div>
                    ) : null}
                  </div>
                  <div style={{ flex: '2 1 200px', minWidth: 0 }}>
                    <FieldLabel>Total supply (whole tokens)</FieldLabel>
                    <TextField
                      value={supply}
                      onChange={(v) => setSupply(v.replace(/[^0-9.]/g, ''))}
                      placeholder="1000000"
                      mono
                      inputMode="decimal"
                    />
                  </div>
                </div>
              </div>
            )}
          </Panel>

          {deployed ? (
            <Notice tone="muted">
              The full supply is minted to your connected wallet on creation. Supply is fixed — the factory has no mint
              function after deploy.
            </Notice>
          ) : null}
        </div>

        {/* Right: review + create */}
        <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel>
            <SummaryRow label="Name" value={name.trim() !== '' ? name.trim() : '—'} />
            <SummaryRow label="Symbol" value={symbolValue} />
            <SummaryRow label="Decimals" value={decimalsValue} />
            <SummaryRow
              label="Total supply"
              value={supplyValue}
              valueColor={supplyValue !== '—' ? terminalColors.ink : terminalColors.faint}
            />
            <SummaryRow label="Create fee" value={deployed ? feeLabel : '—'} />
            <SummaryRow label="Mint to" value={connected && owner ? shortAddr(owner) : '—'} />
            <SummaryRow label="Network" value={deployed ? chainLabel : 'Not available'} />

            <PrimaryButton label={primaryLabel} onClick={onPrimary} disabled={primaryDisabled} />

            {create.isDone ? (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Notice tone="green">
                  Token deployed. The full supply is now in your wallet.
                  {create.createdTokenAddress ? (
                    <>
                      {' '}
                      <span style={{ fontFamily: MONO, color: terminalColors.greenDeep }}>{create.createdTokenAddress}</span>
                    </>
                  ) : null}
                </Notice>
                {create.createdTokenAddress ? (
                  <PrimaryButton label="Seed a pool with this token" onClick={onSeedPool} variant="outline" />
                ) : null}
              </div>
            ) : create.error ? (
              <div style={{ fontFamily: SANS, fontSize: 11.5, color: terminalColors.redDown, marginTop: 10, lineHeight: 1.5 }}>
                {create.error}
              </div>
            ) : deployed ? (
              <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.faint, marginTop: 10, lineHeight: 1.5 }}>
                One transaction — no approval needed. Your new token address appears here on success, ready to seed a pool.
              </div>
            ) : null}
          </Panel>
        </div>
      </div>
    </div>
  )
}
