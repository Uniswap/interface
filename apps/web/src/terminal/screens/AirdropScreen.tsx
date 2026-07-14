/**
 * HookSwap Terminal — Airdrop (create a merkle distributor + recipients claim).
 *
 * Robinhood-only launch scope. Two tabs:
 *   • "Create"  — MerkleDistributorFactory `createDistributor(token, merkleRoot)`: builds the
 *                 merkle tree client-side from a `address,amount` CSV, deploys a fresh
 *                 `MerkleDistributor`, then FUNDS it with a plain `token.transfer(distributor,
 *                 total)`. On success the creator downloads `claims-<distributor>.json` — the
 *                 proof artifact recipients need (the project hosts it; the one external dep).
 *   • "Claim"   — a recipient pastes the distributor address + loads that claims.json (or
 *                 re-pastes the recipient CSV to recompute proofs); the connected wallet's
 *                 allocation + a Claim button appear, or an honest "not in this airdrop" /
 *                 "already claimed" state.
 *
 * DATA POLICY (facts-only, no fabricated data — handoff hard rule):
 *   • The factory address is config-driven (`~/terminal/airdrop/addresses.ts`). Until it is
 *     deployed on a chain the screen renders an honest "Airdrops aren't live on {chain} yet"
 *     state — never an error, never mock data.
 *   • The token's symbol/decimals/balance, `distributorsLength()`, the distributor's on-chain
 *     `merkleRoot()` / `isClaimed()` and every amount are REAL on-chain reads. They read "—"
 *     until they resolve.
 *   • The merkle ROOT and PROOFS are REAL computations whose leaf/node encoding is verified
 *     byte-for-byte against the contract (see `~/terminal/airdrop/merkle.ts`). The claim tab
 *     cross-checks the loaded source's root against the on-chain root, so a wrong file can never
 *     present a proof that would revert.
 *
 * Contract signatures: see `~/terminal/airdrop/abis.ts`
 * (`contracts/airdrop/src/MerkleDistributorFactory.sol` + `MerkleDistributor.sol`).
 */
import { useMemo, useRef, useState } from 'react'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { useReadContract } from 'wagmi'
import { formatUnits, type Address } from '~/chains'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { useAccount } from '~/hooks/useAccount'
import { merkleDistributorFactoryAbi } from '~/terminal/airdrop/abis'
import { getAirdropFactory } from '~/terminal/airdrop/addresses'
import { useClaimAirdrop, useCreateAirdrop, type ClaimsFile } from '~/terminal/airdrop/useAirdrop'
import { StatCard } from '~/terminal/components/StatCard'
import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'
import { assume0xAddress } from '~/utils/wagmi'

const MONO = terminalFonts.mono
const DISPLAY = terminalFonts.display
const SANS = terminalFonts.sans

type AirdropTab = 'create' | 'claim'

/* ------------------------------------------------------------------ helpers */

function shortAddr(a?: string): string {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '—'
}

function shortHash(h?: string): string {
  return h ? `${h.slice(0, 10)}…${h.slice(-6)}` : '—'
}

/** Raw token units → readable amount using the token's real decimals ("—" until known). */
function fmtAmount(raw: bigint, decimals?: number): string {
  if (decimals === undefined) {
    return '—'
  }
  const n = Number(formatUnits(raw, decimals))
  if (!Number.isFinite(n)) {
    return '—'
  }
  return n.toLocaleString('en-US', { maximumFractionDigits: 6 })
}

/** Trigger a client-side download of `text` as `filename`. */
function download(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
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
  mono = true,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  mono?: boolean
}): JSX.Element {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      spellCheck={false}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        border: `1px solid ${terminalColors.line}`,
        borderRadius: 11,
        background: terminalColors.bg,
        padding: '10px 12px',
        fontFamily: mono ? MONO : SANS,
        fontSize: 13.5,
        fontWeight: 500,
        color: terminalColors.ink,
        outline: 'none',
      }}
    />
  )
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 8,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}): JSX.Element {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      spellCheck={false}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        border: `1px solid ${terminalColors.line}`,
        borderRadius: 11,
        background: terminalColors.panel,
        padding: '10px 12px',
        fontFamily: MONO,
        fontSize: 12.5,
        fontWeight: 500,
        color: terminalColors.ink,
        outline: 'none',
        resize: 'vertical',
        lineHeight: 1.5,
      }}
    />
  )
}

function SummaryRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }): JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', gap: 12 }}>
      <span style={{ fontFamily: SANS, fontSize: 12.5, color: terminalColors.ink3Alt, whiteSpace: 'nowrap' }}>{label}</span>
      <span
        style={{
          fontFamily: MONO,
          fontSize: 12.5,
          fontWeight: 500,
          color: valueColor ?? terminalColors.ink,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
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

/** Secondary (outlined) button — used for the claims.json download / file picker. */
function GhostButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        fontFamily: SANS,
        fontSize: 13,
        fontWeight: 600,
        color: disabled ? terminalColors.faint : terminalColors.greenDeep,
        background: disabled ? terminalColors.panel : terminalColors.greenBg,
        border: `1px solid ${disabled ? terminalColors.line : terminalColors.greenBorder}`,
        padding: '10px 0',
        borderRadius: 11,
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
      <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', color: terminalColors.greenDeep, marginBottom: 6 }}>
        COMING SOON
      </div>
      Airdrops aren&apos;t live on {chainLabel} yet — this panel activates automatically once the HookSwap merkle
      distributor factory is deployed.
    </div>
  )
}

function ConnectInline({ text, onConnect }: { text: string; onConnect: () => void }): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, padding: '10px 0' }}>
      <div style={{ fontFamily: SANS, fontSize: 12.5, color: terminalColors.ink2 }}>{text}</div>
      <button
        type="button"
        onClick={onConnect}
        style={{
          fontFamily: SANS,
          fontSize: 13,
          fontWeight: 600,
          color: terminalColors.btnInk,
          background: terminalColors.brandGreen,
          border: 'none',
          padding: '9px 18px',
          borderRadius: 11,
          cursor: 'pointer',
        }}
      >
        Connect wallet
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ recipients preview */

function RecipientsPreview({
  parsed,
  symbol,
}: {
  parsed: ReturnType<typeof useCreateAirdrop>['parsed']
  symbol?: string
}): JSX.Element | null {
  if (parsed.rows.length === 0) {
    return null
  }
  const shown = parsed.rows.slice(0, 50)
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 8 }}>
        <span style={{ fontFamily: SANS, fontSize: 11.5, color: terminalColors.ink3Alt }}>
          Recipients <span style={{ fontFamily: MONO, color: terminalColors.ink, fontWeight: 600 }}>{parsed.validCount}</span>
        </span>
        {parsed.invalidCount > 0 ? (
          <span style={{ fontFamily: SANS, fontSize: 11.5, color: terminalColors.redDown }}>
            Invalid lines <span style={{ fontFamily: MONO, fontWeight: 600 }}>{parsed.invalidCount}</span>
          </span>
        ) : null}
        <span style={{ fontFamily: SANS, fontSize: 11.5, color: terminalColors.ink3Alt }}>
          Total{' '}
          <span style={{ fontFamily: MONO, color: terminalColors.ink, fontWeight: 600 }}>
            {parsed.totalWhole.toLocaleString('en-US', { maximumFractionDigits: 6 })}
          </span>{' '}
          {symbol ?? ''}
        </span>
      </div>
      <div
        style={{
          border: `1px solid ${terminalColors.line}`,
          borderRadius: 11,
          maxHeight: 220,
          overflowY: 'auto',
          background: terminalColors.panel,
        }}
      >
        {shown.map((r, i) => (
          <div
            key={`${r.line}-${i}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              padding: '6px 11px',
              borderTop: i === 0 ? undefined : `1px solid ${terminalColors.line3}`,
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 11.5, color: r.valid ? terminalColors.ink2 : terminalColors.redDown, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {r.address ? shortAddr(r.address) : `line ${r.line}`}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
              <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600, color: r.valid ? terminalColors.ink : terminalColors.faint }}>
                {r.amountText ?? '—'}
              </span>
              {!r.valid ? <span style={{ fontFamily: SANS, fontSize: 10.5, color: terminalColors.redDown }}>{r.error}</span> : null}
            </span>
          </div>
        ))}
        {parsed.rows.length > shown.length ? (
          <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.faint, padding: '6px 11px', borderTop: `1px solid ${terminalColors.line3}` }}>
            +{parsed.rows.length - shown.length} more…
          </div>
        ) : null}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ create tab */

function CreateTab({
  create,
  token,
  setToken,
  csv,
  setCsv,
  chainLabel,
  chainId,
  connected,
  owner,
  onConnect,
}: {
  create: ReturnType<typeof useCreateAirdrop>
  token: string
  setToken: (v: string) => void
  csv: string
  setCsv: (v: string) => void
  chainLabel: string
  chainId?: number
  connected: boolean
  owner?: Address
  onConnect: () => void
}): JSX.Element {
  const deployed = create.ready
  const symbolLabel = create.tokenSymbol ?? (create.validToken ? '…' : '—')

  const onPrimary = (): void => {
    if (!connected) {
      onConnect()
      return
    }
    if (create.isFunded) {
      create.reset()
      setToken('')
      setCsv('')
      return
    }
    if (!create.distributor) {
      void create.deploy()
      return
    }
    void create.fund()
  }

  const primaryLabel = ((): string => {
    if (!deployed) {
      return 'Not available on this network'
    }
    if (!connected) {
      return 'Connect wallet to create an airdrop'
    }
    if (create.isFunded) {
      return 'Create another airdrop'
    }
    if (!create.distributor) {
      if (!create.inputsValid) {
        return 'Enter a token & recipients'
      }
      if (create.isWritePending) {
        return 'Confirm in wallet…'
      }
      if (create.isDeploying) {
        return 'Deploying distributor…'
      }
      return 'Deploy distributor'
    }
    // Distributor exists → fund step.
    if (create.insufficientBalance) {
      return 'Insufficient token balance'
    }
    if (create.isWritePending) {
      return 'Confirm in wallet…'
    }
    if (create.isFunding) {
      return 'Funding distributor…'
    }
    return `Fund distributor (${create.tree ? fmtAmount(create.tree.tokenTotal, create.tokenDecimals) : '—'} ${create.tokenSymbol ?? ''})`.trim()
  })()

  const primaryDisabled = ((): boolean => {
    if (!deployed) {
      return true
    }
    if (!connected || create.isFunded) {
      return false
    }
    if (!create.distributor) {
      return !create.canDeploy
    }
    return !create.canFund
  })()

  const claimsJson = useMemo(() => {
    if (!create.tree) {
      return undefined
    }
    return JSON.stringify(
      {
        chainId,
        token: create.validToken ? token : undefined,
        tokenSymbol: create.tokenSymbol,
        tokenDecimals: create.tokenDecimals,
        distributor: create.distributor,
        merkleRoot: create.tree.root,
        tokenTotal: create.tree.tokenTotal.toString(),
        claims: create.tree.claims,
      },
      null,
      2,
    )
  }, [create.tree, create.distributor, create.tokenSymbol, create.tokenDecimals, create.validToken, token, chainId])

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* Left: token + recipients */}
      <div style={{ flex: '1 1 360px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Panel>
          <StepLabel index="01" label="Token & recipients" note={deployed ? undefined : 'not deployed'} />
          {!deployed ? (
            <NotDeployedNote chainLabel={chainLabel} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <FieldLabel>Token address</FieldLabel>
                <TextField value={token} onChange={setToken} placeholder="0x…" />
                {token !== '' && !create.validToken ? (
                  <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.redDown, marginTop: 5 }}>
                    Enter a valid ERC-20 contract address.
                  </div>
                ) : create.tokenSymbol ? (
                  <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.ink3Alt, marginTop: 5 }}>
                    {create.tokenSymbol}
                    {create.tokenDecimals !== undefined ? ` · ${create.tokenDecimals} decimals` : ''}
                    {create.tokenBalance !== undefined ? ` · balance ${fmtAmount(create.tokenBalance, create.tokenDecimals)}` : ''}
                  </div>
                ) : null}
              </div>

              <div>
                <FieldLabel>Recipients — one `address,amount` per line (whole tokens)</FieldLabel>
                <TextArea
                  value={csv}
                  onChange={setCsv}
                  rows={9}
                  placeholder={'0xabc…,100\n0xdef…,250.5\n0x123…,42'}
                />
                {create.scaleError ? (
                  <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.redDown, marginTop: 5 }}>
                    {create.scaleError}
                  </div>
                ) : null}
                <RecipientsPreview parsed={create.parsed} symbol={create.tokenSymbol} />
              </div>
            </div>
          )}
        </Panel>

        {deployed ? (
          <Notice tone="muted">
            The recipient set is committed to a single 32-byte merkle root on-chain. Only claimers pay gas: you deploy
            the distributor and transfer the total in, then each recipient submits their proof to claim. Amounts are
            entered as whole tokens and scaled by the token&apos;s on-chain decimals.
          </Notice>
        ) : null}
      </div>

      {/* Right: review + deploy + fund */}
      <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Panel>
          <SummaryRow label="Token" value={symbolLabel} />
          <SummaryRow label="Recipients" value={create.parsed.validCount > 0 ? String(create.parsed.validCount) : '—'} />
          <SummaryRow
            label="Total to distribute"
            value={create.tree ? `${fmtAmount(create.tree.tokenTotal, create.tokenDecimals)} ${create.tokenSymbol ?? ''}`.trim() : '—'}
          />
          <SummaryRow label="Merkle root" value={create.tree ? shortHash(create.tree.root) : '—'} valueColor={create.tree ? terminalColors.greenDeep : undefined} />
          <SummaryRow label="Distributor" value={create.distributor ? shortAddr(create.distributor) : 'Created on deploy'} />
          <SummaryRow label="Funded by" value={connected && owner ? shortAddr(owner) : '—'} />
          <SummaryRow label="Network" value={deployed ? chainLabel : 'Not available'} />

          <PrimaryButton label={primaryLabel} onClick={onPrimary} disabled={primaryDisabled} />

          {/* Step feedback */}
          {create.distributor && !create.isFunded ? (
            <div style={{ marginTop: 10 }}>
              <Notice tone="green">
                Distributor deployed at <span style={{ fontFamily: MONO }}>{shortAddr(create.distributor)}</span>. Now fund
                it by transferring the total in — recipients can claim as soon as it holds the tokens.
              </Notice>
            </div>
          ) : null}

          {create.isFunded ? (
            <div style={{ marginTop: 10 }}>
              <Notice tone="green">
                Airdrop is live. Distributor <span style={{ fontFamily: MONO }}>{shortAddr(create.distributor)}</span> is
                funded — download the claims file below and host it so recipients can claim.
              </Notice>
            </div>
          ) : create.error ? (
            <div style={{ fontFamily: SANS, fontSize: 11.5, color: terminalColors.redDown, marginTop: 10, lineHeight: 1.5 }}>
              {create.error}
            </div>
          ) : deployed && !create.distributor ? (
            <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.faint, marginTop: 10, lineHeight: 1.5 }}>
              Deploy creates the distributor committing to your merkle root; funding is a second, plain token transfer of
              the full total.
            </div>
          ) : null}
        </Panel>

        {/* Claims artifact — the one thing the project must host for recipients */}
        {create.distributor && claimsJson ? (
          <Panel>
            <StepLabel index="02" label="Claims file" />
            <div style={{ fontFamily: SANS, fontSize: 12, color: terminalColors.ink2, lineHeight: 1.5, marginBottom: 10 }}>
              Download <span style={{ fontFamily: MONO, color: terminalColors.ink }}>claims-{shortAddr(create.distributor)}.json</span>{' '}
              and host it (e.g. your site / IPFS). Recipients load it in the Claim tab to generate their proof — the
              proofs are NOT on-chain, so this file is the one external dependency.
            </div>
            <GhostButton
              label="Download claims.json"
              onClick={() => download(`claims-${create.distributor}.json`, claimsJson)}
            />
          </Panel>
        ) : null}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ claim tab */

function ClaimTab({
  deployed,
  connected,
  chainLabel,
  chainId,
  owner,
  onConnect,
}: {
  deployed: boolean
  connected: boolean
  chainLabel: string
  chainId?: number
  owner?: Address
  onConnect: () => void
}): JSX.Element {
  const [distributor, setDistributor] = useState('')
  const [claimsFile, setClaimsFile] = useState<ClaimsFile | undefined>(undefined)
  const [fileName, setFileName] = useState<string | undefined>(undefined)
  const [fileError, setFileError] = useState<string | undefined>(undefined)
  const [csv, setCsv] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  const claim = useClaimAirdrop({ chainId, owner, distributor, claimsFile, csv: claimsFile ? undefined : csv })

  const onFile = (file?: File): void => {
    setFileError(undefined)
    if (!file) {
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const json = JSON.parse(String(reader.result)) as ClaimsFile
        if (!json || typeof json.root !== 'string' || typeof json.claims !== 'object') {
          throw new Error('Not a HookSwap claims file (missing root/claims).')
        }
        setClaimsFile(json)
        setFileName(file.name)
      } catch (e) {
        setClaimsFile(undefined)
        setFileName(undefined)
        setFileError(e instanceof Error ? e.message : 'Could not read claims file.')
      }
    }
    reader.onerror = () => setFileError('Could not read claims file.')
    reader.readAsText(file)
  }

  const onPrimary = (): void => {
    if (!connected) {
      onConnect()
      return
    }
    void claim.claim()
  }

  const primaryLabel = ((): string => {
    if (!connected) {
      return 'Connect wallet to claim'
    }
    if (!claim.validDistributor) {
      return 'Enter the distributor address'
    }
    if (!claimsFile && csv.trim() === '') {
      return 'Load a claims file or recipient CSV'
    }
    if (claim.rootMismatch) {
      return 'Claims file does not match this airdrop'
    }
    if (!claim.rootVerified) {
      return 'Verifying claims…'
    }
    if (!claim.inAirdrop) {
      return 'You are not in this airdrop'
    }
    if (claim.alreadyClaimed) {
      return 'Already claimed'
    }
    if (claim.isDone) {
      return 'Claimed'
    }
    if (claim.isWritePending) {
      return 'Confirm in wallet…'
    }
    if (claim.isConfirming) {
      return 'Claiming…'
    }
    return 'Claim allocation'
  })()

  const allocationLabel =
    claim.myClaim && claim.tokenDecimals !== undefined
      ? `${fmtAmount(BigInt(claim.myClaim.amount), claim.tokenDecimals)} ${claim.tokenSymbol ?? ''}`.trim()
      : claim.inAirdrop
        ? '…'
        : '—'

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* Left: distributor + source */}
      <div style={{ flex: '1 1 360px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Panel>
          <StepLabel index="01" label="Airdrop" note={deployed ? undefined : 'not deployed'} />
          {!deployed ? (
            <NotDeployedNote chainLabel={chainLabel} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <FieldLabel>Distributor address</FieldLabel>
                <TextField value={distributor} onChange={setDistributor} placeholder="0x… (from the airdrop creator)" />
                {distributor !== '' && !claim.validDistributor ? (
                  <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.redDown, marginTop: 5 }}>
                    Enter a valid distributor contract address.
                  </div>
                ) : claim.tokenSymbol ? (
                  <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.ink3Alt, marginTop: 5 }}>
                    Distributing {claim.tokenSymbol}
                    {claim.tokenDecimals !== undefined ? ` · ${claim.tokenDecimals} decimals` : ''}
                  </div>
                ) : null}
              </div>

              <div>
                <FieldLabel>Claims file (claims.json)</FieldLabel>
                <input
                  ref={fileInput}
                  type="file"
                  accept="application/json,.json"
                  style={{ display: 'none' }}
                  onChange={(e) => onFile(e.target.files?.[0])}
                />
                <GhostButton
                  label={fileName ? `Loaded: ${fileName}` : 'Choose claims.json'}
                  onClick={() => fileInput.current?.click()}
                />
                {fileError ? (
                  <div style={{ fontFamily: SANS, fontSize: 11, color: terminalColors.redDown, marginTop: 5 }}>{fileError}</div>
                ) : null}
              </div>

              {!claimsFile ? (
                <div>
                  <FieldLabel>…or paste the recipient CSV to recompute proofs</FieldLabel>
                  <TextArea value={csv} onChange={setCsv} rows={5} placeholder={'0xabc…,100\n0xdef…,250.5'} />
                </div>
              ) : null}

              {claim.rootMismatch ? (
                <Notice tone="red">
                  This claims source does not match the distributor&apos;s on-chain merkle root — it belongs to a
                  different airdrop. Load the correct file to claim.
                </Notice>
              ) : claim.rootVerified ? (
                <Notice tone="green">Claims verified against the on-chain merkle root.</Notice>
              ) : null}
            </div>
          )}
        </Panel>
      </div>

      {/* Right: allocation + claim */}
      <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Panel>
          <SummaryRow label="Token" value={claim.tokenSymbol ?? (claim.validDistributor ? '…' : '—')} />
          <SummaryRow label="Your address" value={connected && owner ? shortAddr(owner) : '—'} />
          <SummaryRow
            label="Your allocation"
            value={allocationLabel}
            valueColor={claim.inAirdrop ? terminalColors.greenDeep : undefined}
          />
          <SummaryRow
            label="Status"
            value={
              !claim.inAirdrop
                ? claim.rootVerified
                  ? 'Not eligible'
                  : '—'
                : claim.alreadyClaimed === undefined
                  ? '…'
                  : claim.alreadyClaimed
                    ? 'Claimed'
                    : 'Unclaimed'
            }
          />
          <SummaryRow label="Network" value={deployed ? chainLabel : 'Not available'} />

          <PrimaryButton label={primaryLabel} onClick={onPrimary} disabled={connected ? !claim.canClaim && !claim.isDone : false} />

          {claim.isDone ? (
            <div style={{ marginTop: 10 }}>
              <Notice tone="green">Claim confirmed. Your tokens have been transferred to your wallet.</Notice>
            </div>
          ) : claim.error ? (
            <div style={{ fontFamily: SANS, fontSize: 11.5, color: terminalColors.redDown, marginTop: 10, lineHeight: 1.5 }}>
              {claim.error}
            </div>
          ) : !connected ? (
            <div style={{ marginTop: 10 }}>
              <ConnectInline text="Connect a wallet to check and claim your allocation." onConnect={onConnect} />
            </div>
          ) : null}
        </Panel>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ the screen */

export function AirdropScreen(): JSX.Element {
  const account = useAccount()
  const accountDrawer = useAccountDrawer()
  const [tab, setTab] = useState<AirdropTab>('create')

  // Create-form state lives here so the header/stat tiles can reflect it live.
  const [token, setToken] = useState('')
  const [csv, setCsv] = useState('')

  const connected = Boolean(account.address)
  const owner = assume0xAddress(account.address)

  const { defaultChainId, chains } = useEnabledChains()
  const chainId = (account.chainId ?? defaultChainId ?? chains[0]) as typeof account.chainId
  const chainLabel = chainId ? getChainLabel(chainId) : '—'
  // Native currency read kept for parity with the other tool screens (network context).
  void (chainId ? getChainInfo(chainId).nativeCurrency : undefined)

  const factory = getAirdropFactory(chainId)
  const deployed = Boolean(factory)

  const create = useCreateAirdrop({ chainId, owner, token, csv })

  // Registry-wide airdrop count (real read) — "—" until deployed.
  const countRead = useReadContract({
    address: factory,
    chainId,
    abi: merkleDistributorFactoryAbi,
    functionName: 'distributorsLength',
    query: { enabled: Boolean(factory && chainId) },
  })
  const totalCount = countRead.data as bigint | undefined

  const totalAirdropsValue = !deployed ? '—' : totalCount !== undefined ? String(totalCount) : undefined
  const recipientsValue = !deployed ? '—' : create.parsed.validCount > 0 ? String(create.parsed.validCount) : '0'
  const totalValue = !deployed
    ? '—'
    : create.tree
      ? `${fmtAmount(create.tree.tokenTotal, create.tokenDecimals)} ${create.tokenSymbol ?? ''}`.trim()
      : '—'

  const onConnect = (): void => accountDrawer.open()

  return (
    <div style={{ padding: '20px var(--tm-gutter) 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', color: terminalColors.ink, margin: 0 }}>
          Airdrop
        </h1>
        <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: terminalColors.ink3Alt }}>
          {totalCount !== undefined ? `${String(totalCount)} total airdrops` : '— total airdrops'}
        </span>
      </div>
      <div style={{ fontFamily: SANS, fontSize: 13, color: terminalColors.ink2, marginBottom: 18, maxWidth: 580, lineHeight: 1.5 }}>
        Distribute a token to many wallets with a gas-efficient merkle airdrop. Upload a recipient list, deploy a
        distributor committing to a single on-chain root, fund it, and let recipients claim with a proof — only claimers
        pay gas.
      </div>

      {/* Stat tiles — real reads + live parse (honest "—" when not deployed). */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard
          size="lg"
          label="Total airdrops"
          value={totalAirdropsValue}
          loading={deployed && countRead.isLoading && totalCount === undefined}
          error={countRead.error ? 'Failed to load' : undefined}
        />
        <StatCard size="lg" label="Recipients (draft)" value={recipientsValue} />
        <StatCard size="lg" label="To distribute (draft)" value={totalValue} valueColor={create.tree ? 'up' : 'ink'} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: terminalColors.panel2, padding: 4, borderRadius: 11, width: 'fit-content', marginBottom: 20 }}>
        {(['create', 'claim'] as const).map((id) => {
          const active = tab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              style={{
                padding: '7px 18px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontFamily: SANS,
                fontSize: 13,
                fontWeight: 600,
                color: active ? terminalColors.ink : terminalColors.ink2,
                background: active ? terminalColors.bg : 'transparent',
                boxShadow: active ? '0 1px 2px rgba(11,15,20,.06)' : undefined,
              }}
            >
              {id === 'create' ? 'Create' : 'Claim'}
            </button>
          )
        })}
      </div>

      {tab === 'create' ? (
        <CreateTab
          create={create}
          token={token}
          setToken={setToken}
          csv={csv}
          setCsv={setCsv}
          chainLabel={chainLabel}
          chainId={chainId}
          connected={connected}
          owner={owner}
          onConnect={onConnect}
        />
      ) : (
        <ClaimTab
          deployed={deployed}
          connected={connected}
          chainLabel={chainLabel}
          chainId={chainId}
          owner={owner}
          onConnect={onConnect}
        />
      )}
    </div>
  )
}
