/**
 * HookSwap Terminal — Widget Builder.
 *
 * Configure the embeddable swap widget and copy a ready-to-paste <iframe> snippet,
 * with a LIVE preview of the real widget (`/embed/swap`). No mock data — the
 * preview is the actual embed route rendering a live swap ticket.
 *
 * Controls bind to the same URL grammar the embed parses (see embedParams.ts):
 * chain (enabled chains only), input/output token (NATIVE or 0x… address), theme.
 */
import { useMemo, useState } from 'react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { buildEmbedQuery, type WidgetTheme } from '~/embed/embedParams'
import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'

const MONO = terminalFonts.mono
const DISPLAY = terminalFonts.display
const SANS = terminalFonts.sans

const WIDGET_W = 400
const WIDGET_H = 620

/** Small labeled field wrapper. */
function Field({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <span style={{ display: 'block', fontFamily: SANS, fontSize: 12, color: terminalColors.ink3Alt, marginBottom: 6 }}>
        {label}
      </span>
      {children}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontFamily: MONO,
  fontSize: 13,
  color: terminalColors.ink,
  background: terminalColors.panel,
  border: `1px solid ${terminalColors.line2}`,
  borderRadius: 10,
  padding: '10px 12px',
  boxSizing: 'border-box',
  outline: 'none',
}

export function WidgetBuilderScreen(): JSX.Element {
  const { chains } = useEnabledChains()

  const [chainId, setChainId] = useState<number>(chains[0] ?? 1)
  const [inputCurrency, setInputCurrency] = useState('NATIVE')
  const [outputCurrency, setOutputCurrency] = useState('')
  const [theme, setTheme] = useState<WidgetTheme>('light')
  const [copied, setCopied] = useState(false)

  const query = useMemo(
    () => buildEmbedQuery({ chainId, inputCurrency, outputCurrency, theme }),
    [chainId, inputCurrency, outputCurrency, theme],
  )

  // Absolute origin so the snippet works when pasted on any host.
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hookswap.org'
  // Cache-bust the PREVIEW only (stable per mount) so it never shows a stale
  // /embed/swap render; the copy-able snippet below uses the clean URL.
  const [previewNonce] = useState(() => Date.now())
  const src = `${origin}/embed/swap?${query}`
  const previewSrc = `${src}&_p=${previewNonce}`
  const snippet = `<iframe\n  src="${src}"\n  width="${WIDGET_W}"\n  height="${WIDGET_H}"\n  style="border:0;border-radius:18px;max-width:100%"\n  title="HookSwap swap widget"\n  loading="lazy"\n></iframe>`

  const onCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div style={{ padding: '28px 24px 40px', minWidth: 0 }}>
      <h1
        style={{
          fontFamily: DISPLAY,
          fontSize: 26,
          fontWeight: 600,
          letterSpacing: '-0.02em',
          color: terminalColors.ink,
          margin: 0,
        }}
      >
        Widget builder
      </h1>
      <p style={{ fontFamily: SANS, fontSize: 13.5, lineHeight: 1.6, color: terminalColors.ink2, margin: '8px 0 28px', maxWidth: 620 }}>
        Embed a live HookSwap swap on any site. Configure the defaults, then copy the{' '}
        <code style={{ fontFamily: MONO }}>&lt;iframe&gt;</code> snippet. The widget quotes and swaps against HookSwap&apos;s
        own v2 + v3 deployments; a &ldquo;Powered by HookSwap&rdquo; link is included.
      </p>

      {/* Two columns: config (left) + live preview (right), wrapping on narrow widths. */}
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Config */}
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          <div
            style={{
              border: `1px solid ${terminalColors.line}`,
              borderRadius: 14,
              background: terminalColors.bg,
              padding: 18,
            }}
          >
            <Field label="Chain">
              <select
                value={chainId}
                onChange={(e) => setChainId(Number(e.target.value))}
                style={{ ...inputStyle, fontFamily: SANS, cursor: 'pointer' }}
              >
                {chains.map((id) => (
                  <option key={id} value={id}>
                    {getChainLabel(id)} · {id}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Sell token (NATIVE or 0x… address)">
              <input value={inputCurrency} onChange={(e) => setInputCurrency(e.target.value.trim())} placeholder="NATIVE" style={inputStyle} />
            </Field>

            <Field label="Buy token (optional — 0x… address)">
              <input value={outputCurrency} onChange={(e) => setOutputCurrency(e.target.value.trim())} placeholder="0x…" style={inputStyle} />
            </Field>

            <Field label="Theme">
              <div style={{ display: 'flex', gap: 8 }}>
                {(['light', 'dark'] as const).map((t) => {
                  const active = t === theme
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTheme(t)}
                      style={{
                        flex: 1,
                        padding: '9px 12px',
                        borderRadius: 10,
                        border: `1px solid ${active ? terminalColors.brandGreen : terminalColors.line2}`,
                        background: active ? terminalColors.greenBg : terminalColors.bg,
                        color: active ? terminalColors.greenDeep : terminalColors.ink2,
                        fontFamily: SANS,
                        fontSize: 13,
                        fontWeight: active ? 600 : 500,
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
            </Field>

            {/* Snippet */}
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: SANS, fontSize: 12, color: terminalColors.ink3Alt }}>Embed snippet</span>
                <button
                  type="button"
                  onClick={onCopy}
                  style={{
                    fontFamily: SANS,
                    fontSize: 12,
                    fontWeight: 600,
                    color: terminalColors.btnInk,
                    background: terminalColors.brandGreen,
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 12px',
                    cursor: 'pointer',
                  }}
                >
                  {copied ? 'Copied ✓' : 'Copy'}
                </button>
              </div>
              <pre
                style={{
                  fontFamily: MONO,
                  fontSize: 11.5,
                  lineHeight: 1.55,
                  color: terminalColors.ink2,
                  background: terminalColors.panel,
                  border: `1px solid ${terminalColors.line2}`,
                  borderRadius: 10,
                  padding: 12,
                  margin: 0,
                  overflowX: 'auto',
                  whiteSpace: 'pre',
                }}
              >
                {snippet}
              </pre>
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div style={{ flex: '0 0 auto', minWidth: 0 }}>
          <div style={{ fontFamily: SANS, fontSize: 12, color: terminalColors.ink3Alt, marginBottom: 8 }}>Live preview</div>
          <iframe
            key={query}
            src={previewSrc}
            width={WIDGET_W}
            height={WIDGET_H}
            title="HookSwap swap widget preview"
            style={{ border: `1px solid ${terminalColors.line}`, borderRadius: 18, maxWidth: '100%', background: terminalColors.bg }}
          />
        </div>
      </div>
    </div>
  )
}

export default WidgetBuilderScreen
