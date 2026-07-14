/**
 * HookSwap Terminal — Multisender / Disperse (batch send one token to many, INLINE + client-side).
 *
 * Robinhood-only launch scope. Batch-sending here is a self-contained CLIENT-SIDE flow
 * against the deployed stateless `Disperse` contract — NO backend, NO Permit2 (an ERC-20
 * approve of the total to Disperse, then a single call fans it out; the native path skips
 * approval). See `~/terminal/multisender/useMultisend`.
 *
 * DATA POLICY (no mock data — handoff hard rule):
 *   • Token — picked from the active chain's static common-bases (`COMMON_BASES`, the same
 *     source Swap uses; always covers Robinhood ETH / WETH / USDG / tHOOK) OR resolved by
 *     REAL on-chain reads (symbol / decimals / balance) of a pasted address. Never fabricated.
 *   • Recipients — parsed from the user's `address,amount` list; every row is validated
 *     (checksum-valid address + positive amount) and invalid rows are flagged, never dropped
 *     silently.
 *   • Balance / allowance / send — REAL reads + writes (wagmi), gated so a tx can't be signed
 *     while it would revert (missing approval, insufficient balance).
 *   • When Disperse isn't deployed on the chain, the screen renders an honest "not deployed"
 *     state — never a fake success.
 */
import { useMemo, useState } from 'react'
import { useReadContract, useReadContracts } from 'wagmi'
import { COMMON_BASES } from 'uniswap/src/constants/routing'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { erc20Abi, formatUnits, isAddress, parseUnits, type Address } from '~/chains'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { useAccount } from '~/hooks/useAccount'
import { StatCard } from '~/terminal/components/StatCard'
import { MAX_PER_TX, useMultisend, type MultisendEntry } from '~/terminal/multisender/useMultisend'
import { getDisperseAddress } from '~/terminal/multisender/addresses'
import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'
import { assume0xAddress } from '~/utils/wagmi'

const MONO = terminalFonts.mono
const DISPLAY = terminalFonts.display
const SANS = terminalFonts.sans

/* ------------------------------------------------------------------ token model */

interface TokenOption {
  symbol: string
  logoUrl?: string
  // Real on-chain identity (never fabricated): on-chain address, or the NATIVE sentinel.
  address: string
  decimals: number
}

/* ------------------------------------------------------------------ helpers */

function shortAddr(a?: string): string {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '—'
}

function fmtAmount(raw: bigint, decimals: number): string {
  const n = Number(formatUnits(raw, decimals))
  return n.toLocaleString('en-US', { maximumFractionDigits: decimals > 8 ? 8 : decimals })
}

interface ParsedRow {
  line: number
  raw: string
  recipient?: Address
  amount?: bigint
  error?: string
}

/**
 * Parse the `address,amount` textarea into typed rows. Each non-empty line must be a
 * checksum-valid address + a positive amount (comma / whitespace separated). Invalid rows
 * are FLAGGED (never dropped) so the UI can surface them.
 */
function parseRecipients(text: string, decimals?: number): ParsedRow[] {
  const rows: ParsedRow[] = []
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim()
    if (raw === '') {
      continue
    }
    const parts = raw.split(/[\s,]+/).filter(Boolean)
    const line = i + 1
    if (parts.length < 2) {
      rows.push({ line, raw, error: 'Expected "address, amount"' })
      continue
    }
    const [addr, amountStr] = parts
    if (!isAddress(addr)) {
      rows.push({ line, raw, error: 'Invalid address' })
      continue
    }
    const num = Number(amountStr)
    if (!Number.isFinite(num) || num <= 0) {
      rows.push({ line, raw, error: 'Invalid amount' })
      continue
    }
    if (decimals === undefined) {
      // Token not resolved yet — can't parse units. Treat as pending, not an error.
      rows.push({ line, raw, recipient: assume0xAddress(addr) })
      continue
    }
    try {
      const amount = parseUnits(amountStr, decimals)
      if (amount <= 0n) {
        rows.push({ line, raw, error: 'Invalid amount' })
        continue
      }
      rows.push({ line, raw, recipient: assume0xAddress(addr), amount })
    } catch {
      rows.push({ line, raw, error: 'Invalid amount' })
    }
  }
  return rows
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

function PrimaryButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }): JSX.Element {
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
        color: terminalColors.btnInk,
        background: disabled ? terminalColors.line : terminalColors.brandGreen,
        border: 'none',
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
      Batch sending isn&apos;t live on {chainLabel} yet — this screen activates automatically once the HookSwap Disperse
      contract is deployed.
    </div>
  )
}

function TokenCircle({ token, size = 20 }: { token?: TokenOption; size?: number }): JSX.Element {
  const [errored, setErrored] = useState(false)
  if (token?.logoUrl && !errored) {
    return (
      <img
        src={token.logoUrl}
        alt=""
        width={size}
        height={size}
        style={{ borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }}
        onError={() => setErrored(true)}
      />
    )
  }
  return (
    <span
      style={{
        width: size,
        height: size,
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
      {token?.symbol?.slice(0, 1) ?? '?'}
    </span>
  )
}

function TokenSelect({
  value,
  options,
  onChange,
}: {
  value?: TokenOption
  options: TokenOption[]
  onChange: (token: TokenOption) => void
}): JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '9px 11px',
          borderRadius: 10,
          border: `1px solid ${terminalColors.line}`,
          background: terminalColors.bg,
          cursor: 'pointer',
          boxSizing: 'border-box',
        }}
      >
        <TokenCircle token={value} size={20} />
        <span style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: terminalColors.ink, flex: 1, textAlign: 'left' }}>
          {value?.symbol ?? 'Select token'}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 11, color: terminalColors.ink3Alt }}>▾</span>
      </button>
      {open ? (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              maxHeight: 260,
              overflowY: 'auto',
              background: terminalColors.bg,
              border: `1px solid ${terminalColors.line}`,
              borderRadius: 10,
              boxShadow: '0 12px 30px -12px rgba(11,15,20,.28)',
              zIndex: 11,
              padding: 4,
            }}
          >
            {options.map((token) => (
              <button
                key={token.address}
                type="button"
                onClick={() => {
                  onChange(token)
                  setOpen(false)
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: 'none',
                  background: value?.address === token.address ? terminalColors.panel : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <TokenCircle token={token} size={20} />
                <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: terminalColors.ink, flex: 1, textAlign: 'left' }}>
                  {token.symbol}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 10.5, color: terminalColors.faint }}>
                  {token.address === NATIVE_CHAIN_ID ? 'native' : shortAddr(token.address)}
                </span>
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ the screen */

export function MultisenderScreen(): JSX.Element {
  const account = useAccount()
  const accountDrawer = useAccountDrawer()

  const chainId = account.chainId ?? UniverseChainId.Robinhood
  const connected = Boolean(account.address)
  const owner = assume0xAddress(account.address)

  const disperse = getDisperseAddress(chainId)
  const deployed = Boolean(disperse)
  const chainLabel = getChainLabel(chainId)

  // Token options from the active chain's static common-bases (includes native).
  const baseOptions: TokenOption[] = useMemo(() => {
    const out: TokenOption[] = []
    const seen = new Set<string>()
    for (const info of COMMON_BASES[chainId] ?? []) {
      const { currency } = info
      const symbol = currency.symbol
      if (!symbol) {
        continue
      }
      const address = currency.isNative ? NATIVE_CHAIN_ID : currency.address
      if (seen.has(address)) {
        continue
      }
      seen.add(address)
      out.push({ symbol, logoUrl: info.logoUrl ?? undefined, address, decimals: currency.decimals })
    }
    return out
  }, [chainId])

  // Selection: either a base option, or a resolved custom pasted token.
  const [selected, setSelected] = useState<TokenOption | undefined>(undefined)
  const [customAddr, setCustomAddr] = useState('')
  const customValid = isAddress(customAddr)
  const customAddr0x = assume0xAddress(customValid ? customAddr : undefined)

  const customMeta = useReadContracts({
    contracts: [
      { address: customAddr0x, chainId, abi: erc20Abi, functionName: 'symbol' as const },
      { address: customAddr0x, chainId, abi: erc20Abi, functionName: 'decimals' as const },
    ],
    query: { enabled: customValid },
  })
  const customSymbolEntry = customMeta.data?.[0]
  const customDecimalsEntry = customMeta.data?.[1]
  const customSymbol = customSymbolEntry?.status === 'success' ? (customSymbolEntry.result as string) : undefined
  const customDecimals = customDecimalsEntry?.status === 'success' ? Number(customDecimalsEntry.result) : undefined
  const customResolveError = customValid && customMeta.isError
  const customResolved = customValid && customSymbol !== undefined && customDecimals !== undefined

  // The active token: a resolved custom paste takes precedence; else the dropdown pick,
  // defaulting to the first base (native) once options load.
  const token: TokenOption | undefined = customResolved
    ? { symbol: customSymbol ?? shortAddr(customAddr), address: customAddr, decimals: customDecimals ?? 18 }
    : (selected ?? baseOptions[0])

  const decimals = token?.decimals

  // Parse the recipient list.
  const [recipientText, setRecipientText] = useState('')
  const parsed = useMemo(() => parseRecipients(recipientText, decimals), [recipientText, decimals])
  const invalidRows = parsed.filter((r) => r.error)
  const validEntries: MultisendEntry[] = useMemo(
    () => parsed.filter((r) => r.recipient && r.amount !== undefined).map((r) => ({ recipient: r.recipient as Address, amount: r.amount as bigint })),
    [parsed],
  )

  const multisend = useMultisend({
    chainId,
    owner,
    token: { address: token?.address, decimals: token?.decimals, symbol: token?.symbol },
    entries: validEntries,
  })

  const totalLabel = decimals !== undefined ? `${fmtAmount(multisend.total, decimals)} ${token?.symbol ?? ''}`.trim() : '—'
  const balanceLabel =
    multisend.balance !== undefined && decimals !== undefined
      ? `${fmtAmount(multisend.balance, decimals)} ${token?.symbol ?? ''}`.trim()
      : undefined

  /* --------------------------------------------------------------- primary action */

  const hasEntries = validEntries.length > 0
  const hasInvalid = invalidRows.length > 0

  const onPrimary = (): void => {
    if (!connected) {
      accountDrawer.open()
      return
    }
    if (multisend.isDone) {
      multisend.reset()
      setRecipientText('')
      return
    }
    if (multisend.needsApproval) {
      void multisend.approve()
      return
    }
    void multisend.send()
  }

  const primaryLabel = ((): string => {
    if (!deployed) {
      return 'Not available on this network'
    }
    if (!connected) {
      return 'Connect wallet to send'
    }
    if (multisend.isDone) {
      return 'Send another batch'
    }
    if (!token) {
      return 'Select a token'
    }
    if (!hasEntries) {
      return 'Add recipients'
    }
    if (hasInvalid) {
      return `Fix ${invalidRows.length} invalid line${invalidRows.length === 1 ? '' : 's'}`
    }
    if (multisend.insufficientBalance) {
      return `Insufficient ${token.symbol} balance`
    }
    if (multisend.approving) {
      return 'Approving…'
    }
    if (multisend.isSending) {
      return multisend.batchCount > 1 ? `Sending… (batch ${multisend.batchIndex} of ${multisend.batchCount})` : 'Sending…'
    }
    if (multisend.needsApproval) {
      return `Approve ${token.symbol}`
    }
    return `Send to ${validEntries.length} recipient${validEntries.length === 1 ? '' : 's'}`
  })()

  const busy = multisend.approving || multisend.isSending

  const primaryDisabled = ((): boolean => {
    if (!deployed) {
      return true
    }
    if (!connected) {
      return false
    }
    if (multisend.isDone) {
      return false
    }
    if (!token || !hasEntries || hasInvalid || multisend.insufficientBalance || busy) {
      return true
    }
    if (multisend.needsApproval) {
      return false
    }
    return !multisend.canSend
  })()

  /* --------------------------------------------------------------- stat values */

  const recipientsValue = hasEntries ? String(validEntries.length) : '—'
  const totalValue = hasEntries && decimals !== undefined ? totalLabel : '—'
  const batchesValue = multisend.chunkCount > 0 ? String(multisend.chunkCount) : '—'
  const networkValue = deployed ? chainLabel : 'Not live'

  return (
    <div style={{ padding: '20px var(--tm-gutter) 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', color: terminalColors.ink, margin: 0 }}>
          Multisender
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
          batch send · no Permit2
        </span>
      </div>
      <div style={{ fontFamily: SANS, fontSize: 13, color: terminalColors.ink2, marginBottom: 18, maxWidth: 560, lineHeight: 1.5 }}>
        Send one token — or the native currency — to many addresses in a single transaction. Paste an
        {' '}<code style={{ fontFamily: MONO }}>address, amount</code> list; approve once (native skips it), then send.
      </div>

      {/* Stat tiles — honest "—" when disconnected / not deployed. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
        <StatCard size="lg" label="Recipients" value={recipientsValue} />
        <StatCard size="lg" label="Total to send" value={totalValue} />
        <StatCard size="lg" label="Batches" value={batchesValue} />
        <StatCard size="lg" label="Network" value={networkValue} valueColor={deployed ? 'up' : 'ink'} />
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Left: token + recipients */}
        <div style={{ flex: '1 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Panel>
            <StepLabel index="01" label="Token" note={deployed ? undefined : 'not deployed'} />
            {!deployed ? (
              <NotDeployedNote chainLabel={chainLabel} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <FieldLabel>Select token (native included)</FieldLabel>
                  <TokenSelect
                    value={token}
                    options={baseOptions}
                    onChange={(t) => {
                      setSelected(t)
                      setCustomAddr('')
                    }}
                  />
                </div>
                <div>
                  <FieldLabel>Or paste a custom token address</FieldLabel>
                  <input
                    value={customAddr}
                    onChange={(e) => setCustomAddr(e.target.value.trim())}
                    placeholder="0x…"
                    spellCheck={false}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      border: `1px solid ${terminalColors.line}`,
                      borderRadius: 11,
                      background: terminalColors.bg,
                      padding: '10px 12px',
                      fontFamily: MONO,
                      fontSize: 13.5,
                      fontWeight: 500,
                      color: terminalColors.ink,
                      outline: 'none',
                    }}
                  />
                  {customAddr !== '' && !customValid ? (
                    <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.redDown, marginTop: 5 }}>Enter a valid contract address.</div>
                  ) : customValid && customMeta.isLoading ? (
                    <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.ink3Alt, marginTop: 5 }}>Resolving token…</div>
                  ) : customResolveError ? (
                    <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.redDown, marginTop: 5 }}>Not an ERC-20 on this network.</div>
                  ) : customResolved ? (
                    <div style={{ fontFamily: MONO, fontSize: 11.5, color: terminalColors.greenDeep, marginTop: 5 }}>
                      {customSymbol} · {customDecimals} decimals
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </Panel>

          {deployed ? (
            <Panel>
              <StepLabel index="02" label="Recipients" note={`one per line · max ${MAX_PER_TX}/tx`} />
              <textarea
                value={recipientText}
                onChange={(e) => setRecipientText(e.target.value)}
                placeholder={'0xRecipient1, 1.5\n0xRecipient2, 0.25\n0xRecipient3, 100'}
                spellCheck={false}
                rows={8}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  border: `1px solid ${terminalColors.line}`,
                  borderRadius: 11,
                  background: terminalColors.bg,
                  padding: '11px 12px',
                  fontFamily: MONO,
                  fontSize: 12.5,
                  lineHeight: 1.6,
                  color: terminalColors.ink,
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
              <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.faint, marginTop: 6 }}>
                Format: <code style={{ fontFamily: MONO }}>address, amount</code> — comma or space separated, one recipient per line.
              </div>
            </Panel>
          ) : null}
        </div>

        {/* Right: preview + send */}
        <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {deployed && parsed.length > 0 ? (
            <Panel padding={14}>
              <StepLabel index="03" label="Preview" />
              <div
                style={{
                  maxHeight: 220,
                  overflowY: 'auto',
                  border: `1px solid ${terminalColors.line}`,
                  borderRadius: 10,
                }}
              >
                {parsed.map((row) => (
                  <div
                    key={row.line}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      padding: '7px 10px',
                      borderBottom: `1px solid ${terminalColors.line3}`,
                    }}
                  >
                    <span style={{ fontFamily: MONO, fontSize: 11.5, color: row.error ? terminalColors.redDown : terminalColors.ink2, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.recipient ? shortAddr(row.recipient) : `L${row.line}`}
                    </span>
                    {row.error ? (
                      <span style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.redDown, flexShrink: 0 }}>{row.error}</span>
                    ) : (
                      <span style={{ fontFamily: MONO, fontSize: 11.5, color: terminalColors.ink, flexShrink: 0 }}>
                        {row.amount !== undefined && decimals !== undefined ? fmtAmount(row.amount, decimals) : '—'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {hasInvalid ? (
                <div style={{ marginTop: 10 }}>
                  <Notice tone="red">
                    {invalidRows.length} line{invalidRows.length === 1 ? '' : 's'} need fixing before you can send.
                  </Notice>
                </div>
              ) : null}
            </Panel>
          ) : null}

          <Panel>
            <SummaryRow label="Token" value={token?.symbol ?? '—'} />
            <SummaryRow label="Recipients" value={hasEntries ? String(validEntries.length) : '—'} />
            <SummaryRow label="Total" value={totalValue} valueColor={hasEntries ? terminalColors.ink : terminalColors.faint} />
            {balanceLabel ? <SummaryRow label="Your balance" value={balanceLabel} /> : null}
            <SummaryRow label="Batches" value={multisend.chunkCount > 1 ? `${multisend.chunkCount} txs` : '1 tx'} />
            <SummaryRow label="Network" value={deployed && chainId ? chainLabel : 'Not available'} />

            <PrimaryButton label={primaryLabel} onClick={onPrimary} disabled={primaryDisabled} />

            {multisend.isDone ? (
              <div style={{ marginTop: 10 }}>
                <Notice tone="green">Batch sent. Tokens went straight to each recipient — the contract never held them.</Notice>
              </div>
            ) : multisend.error ? (
              <div style={{ fontFamily: SANS, fontSize: 11.5, color: terminalColors.redDown, marginTop: 10, lineHeight: 1.5 }}>{multisend.error}</div>
            ) : deployed && multisend.chunkCount > 1 ? (
              <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.faint, marginTop: 10, lineHeight: 1.5 }}>
                {validEntries.length} recipients exceed {MAX_PER_TX}/tx — this sends in {multisend.chunkCount} sequential transactions (confirm each in your wallet).
              </div>
            ) : deployed ? (
              <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.faint, marginTop: 10, lineHeight: 1.5 }}>
                {multisend.isNative
                  ? 'Native send — no approval needed. Any over-sent dust is refunded to you.'
                  : 'Approve the total once, then send. Tokens are pulled per recipient (no Permit2).'}
              </div>
            ) : null}
          </Panel>
        </div>
      </div>
    </div>
  )
}
