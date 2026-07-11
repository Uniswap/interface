/**
 * HookSwap Terminal — B12 Settings.
 *
 * Pixel-perfect recreation of design handoff screen B12 (column 1b) — see
 * `design_handoff_hookswap_terminal/screenshots/B12-settings.png` and the B12
 * markup in `design/HookSwap Redesign.dc.html`. A 210px settings-nav on the left,
 * a content header with Reset + Save changes, and a built-out "Trading" panel of
 * setting rows (label + description → control).
 *
 * DATA POLICY (no mock data — handoff hard rule):
 *   • Default slippage — LIVE + PERSISTED. Reads/writes the app's real global user
 *     slippage (`useUserSlippageTolerance` → the redux `user` slice, redux-persisted).
 *     This is the same durable setting the classic swap / LP flows read; an empty
 *     custom field maps to the app default (Auto). Changes survive reload.
 *   • Transaction deadline — LIVE + PERSISTED. Reads `state.user.userDeadline`
 *     (seconds) and writes it via `updateUserDeadline`. This is the exact TTL that
 *     `useGetTransactionDeadline` applies to every submitted transaction.
 *   • Appearance (theme) — LIVE + PERSISTED. Reads/writes the real appearance slice
 *     (`useCurrentAppearanceSetting` / `setSelectedAppearanceSettings`) — System /
 *     Light / Dark, the same setting that drives the app's Tamagui color scheme.
 *   • Network panel — read-only view of the app's REAL enabled chains
 *     (`useEnabledChains` + `getChainLabel`). No fabricated networks.
 *
 *   Save/Reset semantics: the controls edit a local DRAFT seeded from the real
 *   stores. "Save changes" commits the draft to the persisted stores (so it truly
 *   persists — not component state that evaporates); "Reset" discards unsaved edits
 *   back to the stored values. Both are disabled when there are no unsaved changes.
 *
 *   HONEST PLACEHOLDERS (no real web backing store → rendered disabled, never a fake
 *   toggle that silently does nothing):
 *     • MEV protection — private-flow / protected routing is not available for the
 *       target chains (needs the self-hosted routing backend). Disabled row.
 *     • Expert mode — no expert-mode store exists in the web app. Disabled row.
 *     • Gas preference — no persisted gas-speed setting and no live gas oracle wired
 *       (the Terminal top bar's gas pill is likewise a data TODO). Disabled row with
 *       an honest "—" base fee; NO fabricated gwei series is drawn.
 *     • Notifications / Security / Connected apps panels — no backing store yet;
 *       honest "coming soon" empty states.
 *
 * HookSwap ships v2 + v3 only (no Uniswap v4 / hooks — LOCKED decision). The design's
 * "Default hook" row is REMOVED entirely (not "coming soon" — gone), per hard rule.
 */
import { Percent } from '@uniswap/sdk-core'
import { CSSProperties, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useCurrentAppearanceSetting } from 'uniswap/src/features/appearance/hooks'
import { AppearanceSettingType, setSelectedAppearanceSettings } from 'uniswap/src/features/appearance/slice'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { DEFAULT_DEADLINE_FROM_NOW } from '~/constants/misc'
import { useAppDispatch, useAppSelector } from '~/state/hooks'
import { updateUserDeadline } from '~/state/user/reducer'
import { useUserSlippageTolerance } from '~/state/user/hooks'
import { SlippageTolerance } from '~/state/user/types'
import { useIsMobileViewport } from '~/terminal/hooks/useIsMobileViewport'
import { terminalColors, terminalFonts } from '~/terminal/theme/tokens'

const MONO = terminalFonts.mono
const DISPLAY = terminalFonts.display
const SANS = terminalFonts.sans

/* --------------------------------------------------------------- settings nav */

type PanelId = 'trading' | 'appearance' | 'notifications' | 'network' | 'security' | 'connected'

const NAV_ITEMS: ReadonlyArray<{ id: PanelId; label: string }> = [
  { id: 'trading', label: 'Trading' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'network', label: 'Network' },
  { id: 'security', label: 'Security' },
  { id: 'connected', label: 'Connected apps' },
]

/* --------------------------------------------------------------- slippage util */

const SLIPPAGE_PRESETS = [0.1, 0.5, 1.0] as const
const DEADLINE_MIN = 1
const DEADLINE_MAX = 180

/** The app default slippage (Auto) is represented by an empty custom field. */
function slippageToDraftString(tolerance: Percent | SlippageTolerance.Auto): string {
  return tolerance === SlippageTolerance.Auto ? '' : tolerance.toFixed(2)
}

/** Compare two draft slippage strings by numeric value ('' === Auto). */
function slippageStringsEqual(a: string, b: string): boolean {
  const na = a.trim()
  const nb = b.trim()
  if (na === '' || nb === '') {
    return na === '' && nb === ''
  }
  return Math.abs(Number(na) - Number(nb)) < 1e-9
}

function matchesPreset(draft: string, preset: number): boolean {
  if (draft.trim() === '') {
    return false
  }
  return Math.abs(Number(draft) - preset) < 1e-9
}

/* ------------------------------------------------------------------- layout */

/** One label + description / control row (border-top divider, 18px vertical pad). */
function SettingRow({
  title,
  description,
  control,
  align = 'center',
  last,
  disabledNote,
}: {
  title: string
  description: string
  control: ReactNode
  /** flex-start when the control is taller than the label block (e.g. segmented). */
  align?: 'center' | 'flex-start'
  last?: boolean
  /** Honest "unavailable" tag rendered next to the title for placeholder rows. */
  disabledNote?: string
}): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: align,
        justifyContent: 'space-between',
        gap: 20,
        padding: '18px 0',
        borderTop: `1px solid ${terminalColors.line2}`,
        borderBottom: last ? `1px solid ${terminalColors.line2}` : undefined,
      }}
    >
      <div style={{ maxWidth: 360 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: 600, color: terminalColors.ink }}>{title}</span>
          {disabledNote ? (
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10,
                fontWeight: 600,
                color: terminalColors.ink3Alt,
                background: terminalColors.panel2,
                padding: '2px 6px',
                borderRadius: 5,
                whiteSpace: 'nowrap',
              }}
            >
              {disabledNote}
            </span>
          ) : null}
        </div>
        <div style={{ fontFamily: SANS, fontSize: 12.5, color: terminalColors.ink3Alt, marginTop: 3, lineHeight: 1.45 }}>
          {description}
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>{control}</div>
    </div>
  )
}

/* --------------------------------------------------------------- controls */

interface SegmentOption<T extends string> {
  value: T
  label: string
}

/** Segmented control matching §Design tokens (track #F0F3F6, active white pill). */
function Segmented<T extends string>({
  options,
  value,
  onChange,
  mono,
  disabled,
  fontSize = 12.5,
}: {
  options: ReadonlyArray<SegmentOption<T>>
  value: T | undefined
  onChange?: (value: T) => void
  mono?: boolean
  disabled?: boolean
  fontSize?: number
}): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        gap: 2,
        background: terminalColors.panel2,
        padding: 3,
        borderRadius: 9,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={disabled ? undefined : () => onChange?.(opt.value)}
            style={{
              fontFamily: mono ? MONO : SANS,
              fontSize,
              fontWeight: active ? 600 : mono ? 400 : 500,
              color: active ? terminalColors.ink : terminalColors.ink2,
              background: active ? terminalColors.bg : 'transparent',
              boxShadow: active ? '0 1px 2px rgba(11,15,20,.06)' : undefined,
              padding: '7px 13px',
              borderRadius: 6,
              border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/** On/off pill toggle (40×23). Disabled placeholder rows render it faded + locked. */
function Toggle({
  on,
  onToggle,
  disabled,
  ariaLabel,
}: {
  on: boolean
  onToggle?: () => void
  disabled?: boolean
  ariaLabel: string
}): JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={disabled ? undefined : onToggle}
      style={{
        width: 40,
        height: 23,
        borderRadius: 999,
        background: on ? terminalColors.brandGreen : terminalColors.line,
        position: 'relative',
        border: 'none',
        padding: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        transition: 'background 120ms ease',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2.5,
          left: on ? 19.5 : 2.5,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: terminalColors.ink,
          transition: 'left 120ms ease',
        }}
      />
    </button>
  )
}

/** Deadline stepper: −/+ around a mono minutes value. */
function DeadlineStepper({
  minutes,
  onChange,
}: {
  minutes: number
  onChange: (m: number) => void
}): JSX.Element {
  const stepButton: CSSProperties = {
    width: 24,
    height: 24,
    borderRadius: 6,
    border: `1px solid ${terminalColors.line}`,
    background: terminalColors.bg,
    color: terminalColors.ink2,
    fontFamily: MONO,
    fontSize: 15,
    lineHeight: 1,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  }
  const dec = (): void => onChange(Math.max(DEADLINE_MIN, minutes - 1))
  const inc = (): void => onChange(Math.min(DEADLINE_MAX, minutes + 1))
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: terminalColors.panel,
        border: `1px solid ${terminalColors.line2}`,
        borderRadius: 9,
        padding: '7px 10px',
      }}
    >
      <button type="button" aria-label="Decrease deadline" onClick={dec} disabled={minutes <= DEADLINE_MIN} style={stepButton}>
        −
      </button>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 48, justifyContent: 'center' }}>
        <span style={{ fontFamily: MONO, fontSize: 14, color: terminalColors.ink }}>{minutes}</span>
        <span style={{ fontFamily: SANS, fontSize: 12.5, color: terminalColors.ink3Alt }}>min</span>
      </span>
      <button type="button" aria-label="Increase deadline" onClick={inc} disabled={minutes >= DEADLINE_MAX} style={stepButton}>
        +
      </button>
    </div>
  )
}

/* -------------------------------------------------------------- slippage row */

function SlippageControl({
  draft,
  onChange,
}: {
  draft: string
  onChange: (value: string) => void
}): JSX.Element {
  const isCustom = draft.trim() !== '' && !SLIPPAGE_PRESETS.some((p) => matchesPreset(draft, p))
  const isAuto = draft.trim() === ''

  const cell = (active: boolean): CSSProperties => ({
    fontFamily: MONO,
    fontSize: 12.5,
    fontWeight: active ? 600 : 400,
    color: active ? terminalColors.ink : terminalColors.ink2,
    background: active ? terminalColors.bg : 'transparent',
    boxShadow: active ? '0 1px 2px rgba(11,15,20,.06)' : undefined,
    padding: '7px 13px',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {isCustom ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: terminalColors.panel,
            border: `1px solid ${terminalColors.line2}`,
            borderRadius: 8,
            padding: '5px 9px',
          }}
        >
          <input
            inputMode="decimal"
            value={draft}
            aria-label="Custom slippage percent"
            onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
            style={{
              fontFamily: MONO,
              fontSize: 13,
              color: terminalColors.ink,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              width: 46,
              padding: 0,
              textAlign: 'right',
            }}
          />
          <span style={{ fontFamily: MONO, fontSize: 13, color: terminalColors.ink3Alt }}>%</span>
        </div>
      ) : null}
      <div style={{ display: 'flex', gap: 2, background: terminalColors.panel2, padding: 3, borderRadius: 9 }}>
        {SLIPPAGE_PRESETS.map((preset) => {
          const active = matchesPreset(draft, preset)
          return (
            <button key={preset} type="button" onClick={() => onChange(String(preset))} style={cell(active)}>
              {preset.toFixed(1)}%
            </button>
          )
        })}
        {/* "Custom" cell: activates the free-text field (also active while typing).
            When Auto (empty), a click seeds a sensible custom starting point. */}
        <button
          type="button"
          onClick={() => onChange(isAuto ? '0.30' : draft)}
          title={isAuto ? 'Currently Auto — click to set a custom value' : undefined}
          style={cell(isCustom)}
        >
          Custom
        </button>
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- panels */

function PanelHeading({ title, subtitle }: { title: string; subtitle: string }): JSX.Element {
  return (
    <>
      <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 19, color: terminalColors.ink, marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ fontFamily: SANS, fontSize: 13.5, color: terminalColors.ink3Alt, marginBottom: 24 }}>{subtitle}</div>
    </>
  )
}

interface TradingDraft {
  slippage: string
  deadlineMin: number
  appearance: AppearanceSettingType
}

function TradingPanel({
  draft,
  setDraft,
}: {
  draft: TradingDraft
  setDraft: (patch: Partial<TradingDraft>) => void
}): JSX.Element {
  return (
    <>
      <PanelHeading title="Trading" subtitle="Defaults applied to every swap and position." />

      <SettingRow
        title="Default slippage"
        description="Max price movement tolerated before a swap reverts."
        align="flex-start"
        control={<SlippageControl draft={draft.slippage} onChange={(v) => setDraft({ slippage: v })} />}
      />

      <SettingRow
        title="Transaction deadline"
        description="Pending swaps revert after this window."
        control={<DeadlineStepper minutes={draft.deadlineMin} onChange={(m) => setDraft({ deadlineMin: m })} />}
      />

      {/* Honest placeholder — no private-flow routing for the target chains yet. */}
      <SettingRow
        title="MEV protection"
        description="Route swaps through private flow to block sandwich attacks. Requires the self-hosted protected-routing backend (not yet available for HookSwap chains)."
        disabledNote="Unavailable"
        control={<Toggle on={false} disabled ariaLabel="MEV protection (unavailable)" />}
      />

      {/* Honest placeholder — no expert-mode store exists in the web app. */}
      <SettingRow
        title="Expert mode"
        description="Allow high price impact trades and skip confirmations. No expert-mode store is wired in this build."
        disabledNote="Unavailable"
        control={<Toggle on={false} disabled ariaLabel="Expert mode (unavailable)" />}
      />

      {/* Honest placeholder — no persisted gas-speed setting and no live gas oracle. */}
      <SettingRow
        title="Gas preference"
        description="Current base fee — gwei. Live gas oracle and a persisted speed preference are not yet wired."
        disabledNote="Unavailable"
        last
        control={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* No real gas history → a muted skeleton line, never a fabricated series. */}
            <span
              style={{
                width: 70,
                height: 12,
                borderRadius: 4,
                background: terminalColors.line2,
                display: 'inline-block',
              }}
              aria-hidden
            />
            <Segmented<'normal' | 'fast' | 'instant'>
              options={[
                { value: 'normal', label: 'Normal' },
                { value: 'fast', label: 'Fast' },
                { value: 'instant', label: 'Instant' },
              ]}
              value={undefined}
              disabled
              fontSize={12}
            />
          </div>
        }
      />
    </>
  )
}

function AppearancePanel({
  value,
  onChange,
}: {
  value: AppearanceSettingType
  onChange: (v: AppearanceSettingType) => void
}): JSX.Element {
  return (
    <>
      <PanelHeading title="Appearance" subtitle="How the HookSwap Terminal looks on this device." />
      <SettingRow
        title="Theme"
        description="Match your system, or force a light or dark color scheme."
        control={
          <Segmented<AppearanceSettingType>
            options={[
              { value: AppearanceSettingType.System, label: 'System' },
              { value: AppearanceSettingType.Light, label: 'Light' },
              { value: AppearanceSettingType.Dark, label: 'Dark' },
            ]}
            value={value}
            onChange={onChange}
          />
        }
      />
    </>
  )
}

function NetworkPanel(): JSX.Element {
  const { chains } = useEnabledChains()
  return (
    <>
      <PanelHeading title="Network" subtitle="Networks enabled for this app. Switch the active chain from the top bar." />
      <div
        style={{
          border: `1px solid ${terminalColors.line}`,
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '11px 14px',
            borderBottom: `1px solid ${terminalColors.line2}`,
            background: terminalColors.panel,
          }}
        >
          <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: terminalColors.ink2 }}>
            Enabled networks
          </span>
          <span style={{ fontFamily: MONO, fontSize: 12, color: terminalColors.ink3Alt }}>{chains.length}</span>
        </div>
        {chains.map((chainId, i) => (
          <div
            key={chainId}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '11px 14px',
              borderBottom: i === chains.length - 1 ? undefined : `1px solid ${terminalColors.line3}`,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: terminalColors.greenUp }} />
              <span style={{ fontFamily: SANS, fontSize: 13, color: terminalColors.ink }}>{getChainLabel(chainId)}</span>
            </span>
            <span style={{ fontFamily: MONO, fontSize: 12, color: terminalColors.ink3Alt }}>{chainId}</span>
          </div>
        ))}
      </div>
    </>
  )
}

function ComingSoonPanel({ title, subtitle }: { title: string; subtitle: string }): JSX.Element {
  return (
    <>
      <PanelHeading title={title} subtitle={subtitle} />
      <div
        style={{
          border: `1px dashed ${terminalColors.line}`,
          borderRadius: 12,
          padding: '40px 20px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 15, color: terminalColors.ink2 }}>
          Coming soon
        </div>
        <div style={{ fontFamily: SANS, fontSize: 12.5, color: terminalColors.ink3Alt, marginTop: 6 }}>
          No settings are wired here yet.
        </div>
      </div>
    </>
  )
}

/* --------------------------------------------------------------- the screen */

export function SettingsScreen(): JSX.Element {
  const [panel, setPanel] = useState<PanelId>('trading')
  const isMobile = useIsMobileViewport()

  // --- Real, persisted stores ------------------------------------------------
  const [userSlippage, setUserSlippage] = useUserSlippageTolerance()
  const userDeadlineSec = useAppSelector((state) => state.user.userDeadline)
  const storeAppearance = useCurrentAppearanceSetting()
  const dispatch = useAppDispatch()

  // Committed store values, normalized to the draft's shape.
  const committed = useMemo<TradingDraft>(
    () => ({
      slippage: slippageToDraftString(userSlippage),
      deadlineMin: Math.max(DEADLINE_MIN, Math.round(userDeadlineSec / 60)),
      appearance: storeAppearance,
    }),
    [userSlippage, userDeadlineSec, storeAppearance],
  )

  // Local DRAFT — initially seeded from the stores; "Save" commits it back.
  const [draft, setDraftState] = useState<TradingDraft>(committed)
  const setDraft = (patch: Partial<TradingDraft>): void => setDraftState((prev) => ({ ...prev, ...patch }))

  // Re-seed the draft when the persisted store rehydrates late (redux-persist can
  // resolve AFTER first render, changing `committed` from its initial defaults). Only
  // re-seed while the draft is still pristine relative to the PREVIOUS committed value,
  // so an in-progress user edit is never clobbered.
  const prevCommittedRef = useRef<TradingDraft>(committed)
  useEffect(() => {
    const prev = prevCommittedRef.current
    const committedChanged =
      !slippageStringsEqual(prev.slippage, committed.slippage) ||
      prev.deadlineMin !== committed.deadlineMin ||
      prev.appearance !== committed.appearance
    if (!committedChanged) {
      return
    }
    prevCommittedRef.current = committed
    setDraftState((current) => {
      const draftPristine =
        slippageStringsEqual(current.slippage, prev.slippage) &&
        current.deadlineMin === prev.deadlineMin &&
        current.appearance === prev.appearance
      return draftPristine ? committed : current
    })
  }, [committed])

  const isDirty =
    !slippageStringsEqual(draft.slippage, committed.slippage) ||
    draft.deadlineMin !== committed.deadlineMin ||
    draft.appearance !== committed.appearance

  const onSave = (): void => {
    if (!isDirty) {
      return
    }
    // Slippage: empty custom field → app default (Auto); otherwise bips = pct × 100.
    const raw = draft.slippage.trim()
    const pct = Number(raw)
    if (raw === '' || Number.isNaN(pct) || pct <= 0) {
      setUserSlippage(SlippageTolerance.Auto)
    } else {
      setUserSlippage(new Percent(Math.round(pct * 100), 10_000))
    }

    dispatch(updateUserDeadline({ userDeadline: draft.deadlineMin * 60 }))
    dispatch(setSelectedAppearanceSettings(draft.appearance))
  }

  const onReset = (): void => setDraftState(committed)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 640 }}>
      {/* Content header — Settings title + Reset / Save changes */}
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
        <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 15, color: terminalColors.ink }}>Settings</span>
        <div style={{ display: 'flex', gap: 9 }}>
          <button
            type="button"
            onClick={onReset}
            disabled={!isDirty}
            title="Discard unsaved changes"
            style={{
              fontFamily: SANS,
              fontSize: 12.5,
              fontWeight: 600,
              color: terminalColors.ink2,
              background: terminalColors.bg,
              border: `1px solid ${terminalColors.line}`,
              padding: '8px 16px',
              borderRadius: 9,
              cursor: isDirty ? 'pointer' : 'not-allowed',
              opacity: isDirty ? 1 : 0.5,
            }}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!isDirty}
            style={{
              fontFamily: SANS,
              fontSize: 12.5,
              fontWeight: 600,
              color: isDirty ? terminalColors.btnInk : terminalColors.ink3,
              background: isDirty ? terminalColors.brandGreen : terminalColors.panel2,
              border: 'none',
              padding: '8px 18px',
              borderRadius: 9,
              cursor: isDirty ? 'pointer' : 'not-allowed',
            }}
          >
            Save changes
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, flexDirection: isMobile ? 'column' : 'row' }}>
        {/* Settings nav — a fixed 210px side column on desktop; on mobile it becomes a
            horizontally scrollable tab strip above the panel so nothing overflows. */}
        <div
          style={{
            width: isMobile ? '100%' : 210,
            flexShrink: 0,
            borderRight: isMobile ? 'none' : `1px solid ${terminalColors.line2}`,
            borderBottom: isMobile ? `1px solid ${terminalColors.line2}` : 'none',
            background: terminalColors.bg,
            padding: isMobile ? '10px var(--tm-gutter)' : '16px 12px',
            display: 'flex',
            flexDirection: isMobile ? 'row' : 'column',
            gap: isMobile ? 6 : 2,
            overflowX: isMobile ? 'auto' : undefined,
          }}
        >
          {NAV_ITEMS.map((item) => {
            const active = item.id === panel
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPanel(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: isMobile ? '8px 12px' : active ? '9px 11px' : '9px 11px 9px 24px',
                  borderRadius: 9,
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  background: active ? terminalColors.greenBg : 'transparent',
                  color: active ? terminalColors.ink : terminalColors.ink2,
                  fontFamily: SANS,
                  fontSize: 13.5,
                  fontWeight: active ? 600 : 500,
                }}
              >
                {active ? (
                  <span style={{ width: 3, height: 16, borderRadius: 3, background: terminalColors.brandGreen }} />
                ) : null}
                {item.label}
              </button>
            )
          })}
        </div>

        {/* Active panel */}
        <div style={{ flex: 1, minWidth: 0, padding: isMobile ? '22px var(--tm-gutter) 40px' : '26px 30px', maxWidth: 760 }}>
          {panel === 'trading' && <TradingPanel draft={draft} setDraft={setDraft} />}
          {panel === 'appearance' && (
            <AppearancePanel value={draft.appearance} onChange={(v) => setDraft({ appearance: v })} />
          )}
          {panel === 'network' && <NetworkPanel />}
          {panel === 'notifications' && (
            <ComingSoonPanel title="Notifications" subtitle="Choose which alerts reach you and where." />
          )}
          {panel === 'security' && (
            <ComingSoonPanel title="Security" subtitle="Session, spending-limit and confirmation controls." />
          )}
          {panel === 'connected' && (
            <ComingSoonPanel title="Connected apps" subtitle="Review dapps and sessions connected to your wallet." />
          )}
        </div>
      </div>
    </div>
  )
}
