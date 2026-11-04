import { cleanup, fireEvent, render } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest'
import { resetBoundedReportBudgets } from '../compat/diagnostics'
import type { ColorValue, RadiusValue, SpaceValue } from '../compat/props'
import { ButtonCompat } from './ButtonCompat'
import type { ButtonEmphasis, ButtonVariant } from './ButtonCompat'

// The TS unions are exhaustive, but dynamically-typed prop spreads can smuggle
// values outside them at runtime — the casts below simulate that.
const OUT_OF_ENUM_VARIANT = 'spore-3000' as ButtonVariant
const OUT_OF_ENUM_EMPHASIS = 'quaternary' as ButtonEmphasis

// One UNCONDITIONAL teardown for the console.error spies the colour-lane tests
// install. Each of those tests used to create its own spy and call
// `error.mockRestore()` as its last statement, which is skipped the moment an
// assertion above it throws — leaving `console.error` mocked for every later test
// in the file, so a genuine React or compat error after the first failure was
// swallowed and the run reported one broken test instead of the real cascade.
// The spy's active window is unchanged (only tests that call `spyOnConsoleError`
// get one); only the restore moved somewhere a failure cannot skip it.
let consoleErrorSpy: MockInstance | undefined

function spyOnConsoleError(): MockInstance {
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  return consoleErrorSpy
}

afterEach(() => {
  consoleErrorSpy?.mockRestore()
  consoleErrorSpy = undefined
})

afterEach(cleanup)

// The warn dedupe is module-global, so the warn assertions below need a clean
// slate or they would pass or fail on test order (review finding).
beforeEach(() => {
  resetBoundedReportBudgets()
})

// jsdom CSSOM drops var() styles; assert on the static markup string instead.
const classesOf = (markup: string): string[] =>
  [...markup.matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1]?.split(' ') ?? [])

// Frame-class assertions scope to the first class attribute — the outermost <button>.
const frameClassesOf = (markup: string): string[] => {
  const match = /class="([^"]*)"/.exec(markup)
  return match?.[1]?.split(' ') ?? []
}

describe('ButtonCompat — out-of-enum degradation (mirrors ../compat enumClass)', () => {
  it('falls back to the default variant row when variant is out-of-enum', () => {
    const markup = renderToStaticMarkup(<ButtonCompat variant={OUT_OF_ENUM_VARIANT}>Swap</ButtonCompat>)
    // default/primary cells from FRAME_VARIANT_EMPHASIS / TEXT_VARIANT_EMPHASIS
    expect(frameClassesOf(markup)).toContain('bg-neutral1')
    expect(classesOf(markup)).toContain('text-surface1')
  })

  it("falls back to the variant row's primary cell when emphasis is out-of-enum", () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat variant="critical" emphasis={OUT_OF_ENUM_EMPHASIS}>
        Delete
      </ButtonCompat>,
    )
    expect(frameClassesOf(markup)).toContain('bg-critical')
    expect(classesOf(markup)).toContain('text-white')
  })

  it('does not throw when both variant and emphasis are out-of-enum', () => {
    expect(() =>
      renderToStaticMarkup(
        <ButtonCompat variant={OUT_OF_ENUM_VARIANT} emphasis={OUT_OF_ENUM_EMPHASIS}>
          Swap
        </ButtonCompat>,
      ),
    ).not.toThrow()
  })

  it('leaves enumerated variant/emphasis cells untouched (parity surface)', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat variant="warning" emphasis="tertiary">
        Careful
      </ButtonCompat>,
    )
    expect(frameClassesOf(markup)).toContain('border-warning-secondary')
    expect(classesOf(markup)).toContain('text-warning')
  })
})

// Legacy Button accepts `testID` (react-native-web renders it as data-testid)
// and e2e selectors depend on it; the compat maps it the same way the compat
// DOM primitives do (INFRA-3222).
describe('ButtonCompat — testID (INFRA-3222)', () => {
  it('maps testID to a data-testid attribute on the button element', () => {
    const markup = renderToStaticMarkup(<ButtonCompat testID="hook-select">Swap</ButtonCompat>)
    expect(markup).toContain('data-testid="hook-select"')
    expect(markup).not.toContain('testID=')
  })

  it('renders no data-testid when testID is absent', () => {
    const markup = renderToStaticMarkup(<ButtonCompat>Swap</ButtonCompat>)
    expect(markup).not.toContain('data-testid')
  })

  // Precedence pins: the mapping is applied conditionally AFTER prop
  // forwarding (TooltipCompat idiom, matching OptionRow/TriggerButtonCompat).
  it('explicit testID wins over a data-testid supplied alongside it', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat testID="from-prop" data-testid="explicit">
        Swap
      </ButtonCompat>,
    )
    expect(markup).toContain('data-testid="from-prop"')
    expect(markup).not.toContain('data-testid="explicit"')
  })

  it('an ambient data-testid survives when testID is absent', () => {
    const markup = renderToStaticMarkup(<ButtonCompat data-testid="ambient">Swap</ButtonCompat>)
    expect(markup).toContain('data-testid="ambient"')
  })

  it('a spread carrying data-testid: undefined does not wipe testID', () => {
    const spreadProps = { 'data-testid': undefined }
    const markup = renderToStaticMarkup(
      <ButtonCompat {...spreadProps} testID="x">
        Swap
      </ButtonCompat>,
    )
    expect(markup).toContain('data-testid="x"')
  })
})

// Intentional deviation from legacy (design-requested, INFRA-2955): every disabled
// button shows cursor: default — legacy keeps cursor: pointer when onDisabledPress
// makes a disabled button interactive.
describe('ButtonCompat — disabled cursor', () => {
  const noop = (): void => undefined

  it('shows a pointer cursor when enabled', () => {
    const markup = renderToStaticMarkup(<ButtonCompat onPress={noop}>Swap</ButtonCompat>)
    const classes = frameClassesOf(markup)
    expect(classes).toContain('cursor-pointer')
    expect(classes).not.toContain('cursor-default')
  })

  it('shows a default cursor and blocks pointer events when disabled', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat disabled onPress={noop}>
        Swap
      </ButtonCompat>,
    )
    const classes = frameClassesOf(markup)
    expect(classes).toContain('cursor-default')
    expect(classes).not.toContain('cursor-pointer')
    expect(classes).toContain('pointer-events-none')
  })

  it('shows a default cursor even when onDisabledPress keeps the button interactive', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat disabled onDisabledPress={noop}>
        Swap
      </ButtonCompat>,
    )
    const classes = frameClassesOf(markup)
    expect(classes).toContain('cursor-default')
    expect(classes).not.toContain('cursor-pointer')
    // still interactive: events must keep firing
    expect(classes).not.toContain('pointer-events-none')
    expect(markup).not.toContain('disabled=""')
  })

  it('shows a default cursor while loading', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat loading onPress={noop}>
        Swap
      </ButtonCompat>,
    )
    const classes = frameClassesOf(markup)
    expect(classes).toContain('cursor-default')
    expect(classes).not.toContain('cursor-pointer')
  })
})

// INFRA-3283: the dimension slice (minWidth / minHeight / maxWidth / maxHeight).
// Legacy Button accepts these as style props — DialogButtons.tsx keys
// every Dialog's action row on `minHeight="$spacing36"`. Token values resolve
// through the shared SPACE_TOKEN_PX map (never a near-neighbour) and land in
// the generated compat safelist; values OUTSIDE the closed set ride the
// var-indirection twins with the value on an inline `--c*` custom property
// (the INFRA-3217 emission contract), so nothing renders unstyled.
describe('ButtonCompat — dimension props (INFRA-3283)', () => {
  it('resolves a token minHeight to its exact px class (the DialogButtons shape)', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat minHeight="$spacing36" size="small">
        Swap
      </ButtonCompat>,
    )
    expect(frameClassesOf(markup)).toContain('min-h-[36px]')
  })

  it('resolves each dimension prop independently', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat maxHeight="$spacing48" maxWidth="$spacing60" minHeight="$spacing36" minWidth="$spacing24">
        Swap
      </ButtonCompat>,
    )
    const classes = frameClassesOf(markup)
    expect(classes).toContain('min-w-[24px]')
    expect(classes).toContain('min-h-[36px]')
    expect(classes).toContain('max-w-[60px]')
    expect(classes).toContain('max-h-[48px]')
  })

  it('accepts a raw number whose px value is in the closed set', () => {
    const markup = renderToStaticMarkup(<ButtonCompat minHeight={36}>Swap</ButtonCompat>)
    expect(frameClassesOf(markup)).toContain('min-h-[36px]')
  })

  it('routes an out-of-set number through the safelisted var-indirection twin', () => {
    // 37 is no token's px value, so `min-h-[37px]` is not in the generated
    // safelist — Tailwind would never emit a rule for it. The emission path
    // must swap it for the twin and carry the value inline.
    const markup = renderToStaticMarkup(<ButtonCompat minHeight={37}>Swap</ButtonCompat>)
    const classes = frameClassesOf(markup)
    expect(classes).not.toContain('min-h-[37px]')
    expect(classes.some((cls) => cls.startsWith('min-h-[var('))).toBe(true)
    expect(markup).toContain('37px')
  })

  it('passes CSS pass-through strings verbatim', () => {
    const markup = renderToStaticMarkup(<ButtonCompat maxWidth="100%">Swap</ButtonCompat>)
    expect(frameClassesOf(markup)).toContain('max-w-[100%]')
  })

  it('throws on an unknown $ token instead of emitting it raw', () => {
    expect(() => renderToStaticMarkup(<ButtonCompat minHeight="$spacing37">Swap</ButtonCompat>)).toThrow(
      /unknown size token/,
    )
  })

  it('a token minHeight beats the frame reset (min-h-0) in the merged class list', () => {
    const classes = frameClassesOf(renderToStaticMarkup(<ButtonCompat minHeight="$spacing36">Swap</ButtonCompat>))
    expect(classes).toContain('min-h-[36px]')
    expect(classes).not.toContain('min-h-0')
  })

  it('emits no dimension classes and no inline custom properties when the props are absent', () => {
    const markup = renderToStaticMarkup(<ButtonCompat>Swap</ButtonCompat>)
    const classes = frameClassesOf(markup)
    expect(
      classes.some((cls) => cls.startsWith('min-w-[') || cls.startsWith('min-h-[') || cls.startsWith('max-')),
    ).toBe(false)
    expect(markup).not.toContain('--c-')
  })

  it('does not leak the props onto the DOM element', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat maxHeight={48} minHeight="$spacing36">
        Swap
      </ButtonCompat>,
    )
    expect(markup).not.toContain('minheight')
    expect(markup).not.toContain('maxheight')
    expect(markup).not.toContain('minHeight')
    expect(markup).not.toContain('maxHeight')
  })
})

// INFRA-3478 gap 1: `width` / `height` / `justifyContent`. Legacy Tamagui
// Button accepts them as style props — PositionsHeader.tsx keys its stacked
// create button on `width="100%"` / `height="$spacing36"` /
// `justifyContent="flex-start"` (the conversion reverted in a50b216c).
// width/height ride the same INFRA-3283 dimension lane as minWidth;
// justifyContent is an enum lane over the shared JUSTIFY_CLASS utilities.
describe('ButtonCompat — width/height/justifyContent (INFRA-3478)', () => {
  it('resolves a token height to its exact px class (the PositionsHeader shape)', () => {
    const markup = renderToStaticMarkup(<ButtonCompat height="$spacing36">Swap</ButtonCompat>)
    expect(frameClassesOf(markup)).toContain('h-[36px]')
  })

  it('passes CSS pass-through width strings verbatim', () => {
    const markup = renderToStaticMarkup(<ButtonCompat width="100%">Swap</ButtonCompat>)
    expect(frameClassesOf(markup)).toContain('w-[100%]')
  })

  it('routes an out-of-set width through the safelisted var-indirection twin', () => {
    const markup = renderToStaticMarkup(<ButtonCompat width={37}>Swap</ButtonCompat>)
    const classes = frameClassesOf(markup)
    expect(classes).not.toContain('w-[37px]')
    expect(classes.some((cls) => cls.startsWith('w-[var('))).toBe(true)
    expect(markup).toContain('37px')
  })

  it('justifyContent beats the frame default (justify-center) in the merged class list', () => {
    const classes = frameClassesOf(renderToStaticMarkup(<ButtonCompat justifyContent="flex-start">Swap</ButtonCompat>))
    expect(classes).toContain('justify-start')
    expect(classes).not.toContain('justify-center')
  })

  it('keeps the frame default centered when justifyContent is absent', () => {
    const classes = frameClassesOf(renderToStaticMarkup(<ButtonCompat>Swap</ButtonCompat>))
    expect(classes).toContain('justify-center')
    expect(classes.some((cls) => cls.startsWith('justify-') && cls !== 'justify-center')).toBe(false)
  })

  it('does not leak the props onto the DOM element', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat height="$spacing36" justifyContent="flex-start" width="100%">
        Swap
      </ButtonCompat>,
    )
    expect(markup).not.toContain('justifycontent')
    expect(markup).not.toContain('justifyContent')
    expect(markup).not.toContain('width=')
    expect(markup).not.toContain('height=')
  })
})

// INFRA-3478 gap 2: the legacy link form. `ui/src` Button accepts `tag: 'a'` +
// `href` (PositionsHeroHeader.tsx's nav CTAs); ButtonCompat previously
// rendered a hardcoded `<button>`. The compat exposes the same public
// `tag`/`href` surface the compat DOM primitives do (compat/props.ts,
// forwarded in compat/dom.tsx).
describe('ButtonCompat — link form tag="a" + href (INFRA-3478)', () => {
  it('renders an anchor with the href instead of a <button>', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat href="/positions/add" tag="a" variant="branded">
        Add liquidity
      </ButtonCompat>,
    )
    expect(markup.startsWith('<a ')).toBe(true)
    expect(markup).toContain('href="/positions/add"')
    expect(markup).not.toContain('<button')
  })

  it('the anchor form keeps the button frame styling (variant/emphasis cell)', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat href="/x" tag="a" variant="branded">
        Add liquidity
      </ButtonCompat>,
    )
    expect(frameClassesOf(markup)).toContain('bg-accent1')
  })

  it('forwards target and rel like the compat DOM primitives', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat href="https://uniswap.org" rel="noopener noreferrer" tag="a" target="_blank">
        Docs
      </ButtonCompat>,
    )
    expect(markup).toContain('target="_blank"')
    expect(markup).toContain('rel="noopener noreferrer"')
  })

  it('renders neither a type nor a disabled attribute on the anchor (invalid on <a>)', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat disabled href="/x" tag="a">
        Add liquidity
      </ButtonCompat>,
    )
    expect(markup).not.toContain('type=')
    expect(markup).not.toContain(' disabled')
  })

  it('a disabled anchor keeps the aria/tabIndex disabled semantics and the disabled styling', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat disabled href="/x" tag="a">
        Add liquidity
      </ButtonCompat>,
    )
    expect(markup).toContain('aria-disabled="true"')
    expect(markup).toContain('tabindex="-1"')
    expect(frameClassesOf(markup)).toContain('pointer-events-none')
  })

  it('renders a <button> without an href when href is passed with no tag', () => {
    // `href` belongs to the link form; the button path drops it rather than
    // emitting an invalid attribute.
    const markup = renderToStaticMarkup(<ButtonCompat href="/x">Swap</ButtonCompat>)
    expect(markup.startsWith('<button ')).toBe(true)
    expect(markup).not.toContain('href')
  })

  it('tag="button" renders the default button path unchanged', () => {
    const explicit = renderToStaticMarkup(<ButtonCompat tag="button">Swap</ButtonCompat>)
    const implicit = renderToStaticMarkup(<ButtonCompat>Swap</ButtonCompat>)
    expect(explicit).toBe(implicit)
  })

  it('maps testID to data-testid on the anchor element too', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat href="/x" tag="a" testID="hero-add-liquidity">
        Add liquidity
      </ButtonCompat>,
    )
    expect(markup).toContain('data-testid="hero-add-liquidity"')
  })

  // A disabled anchor withholds href entirely: `onDisabledPress` removes
  // pointer-events-none, `<a>` has no disabled attribute, and the
  // platform-neutral press handler can't preventDefault — a kept href would
  // still navigate (and stay reachable via the browser context menu).
  it('disabled + onDisabledPress + tag="a" renders no href/target/rel but still fires onDisabledPress', () => {
    const onDisabledPress = vi.fn()
    const { container } = render(
      <ButtonCompat disabled href="/x" tag="a" target="_blank" onDisabledPress={onDisabledPress}>
        Add liquidity
      </ButtonCompat>,
    )
    const anchor = container.querySelector('a')
    expect(anchor).not.toBeNull()
    expect(anchor?.hasAttribute('href')).toBe(false)
    expect(anchor?.hasAttribute('target')).toBe(false)
    expect(anchor?.hasAttribute('rel')).toBe(false)
    if (anchor) {
      fireEvent.click(anchor)
    }
    expect(onDisabledPress).toHaveBeenCalledTimes(1)
  })

  // Focus/AT parity with the disabled BUTTON path (review round 4): with href
  // withheld the anchor lost its tab stop and implicit link role, so
  // onDisabledPress was mouse-only where the disabled button stays keyboard-
  // reachable. The parity set restores focus, role, and Enter activation.
  it('a disabled-interactive anchor stays focusable with a link role, and Enter fires onDisabledPress', () => {
    const onDisabledPress = vi.fn()
    const { container } = render(
      <ButtonCompat disabled href="/x" tag="a" onDisabledPress={onDisabledPress}>
        Add liquidity
      </ButtonCompat>,
    )
    const anchor = container.querySelector('a')
    expect(anchor?.getAttribute('tabindex')).toBe('0')
    expect(anchor?.getAttribute('role')).toBe('link')
    expect(anchor?.getAttribute('aria-disabled')).toBe('true')
    if (anchor) {
      fireEvent.keyDown(anchor, { key: 'a' })
    }
    expect(onDisabledPress).not.toHaveBeenCalled()
    if (anchor) {
      fireEvent.keyDown(anchor, { key: 'Enter' })
    }
    expect(onDisabledPress).toHaveBeenCalledTimes(1)
  })

  it('a disabled anchor without onDisabledPress keeps the link role but stays out of the tab order', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat disabled href="/x" tag="a">
        Add liquidity
      </ButtonCompat>,
    )
    expect(markup).toContain('role="link"')
    expect(markup).toContain('tabindex="-1"')
  })

  it('a disabled anchor without onDisabledPress also renders no navigation surface', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat disabled href="/x" tag="a">
        Add liquidity
      </ButtonCompat>,
    )
    expect(markup.startsWith('<a ')).toBe(true)
    expect(markup).not.toContain('href')
  })

  // Deliberate deviation from legacy (which forwarded rel untouched):
  // a targeted anchor without a caller rel gets noopener (no noreferrer).
  it('defaults rel="noopener" when target is set and no rel is passed', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat href="https://uniswap.org" tag="a" target="_blank">
        Docs
      </ButtonCompat>,
    )
    expect(markup).toContain('rel="noopener"')
    expect(markup).not.toContain('noreferrer')
  })

  it('emits no rel when neither target nor rel is passed', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat href="/x" tag="a">
        Docs
      </ButtonCompat>,
    )
    expect(markup).not.toContain('rel=')
  })

  it('the link form composes with the INFRA-3478 style props (the PositionsHeroHeader shape)', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat fill={false} href="/positions/create" size="medium" tag="a" variant="branded" width="100%">
        Create pool
      </ButtonCompat>,
    )
    expect(markup.startsWith('<a ')).toBe(true)
    expect(frameClassesOf(markup)).toContain('w-[100%]')
  })
})

// INFRA-3472: `gap` / `p` / `padding`. Legacy Button accepts them as
// style props — InfoRowActionButton.tsx keys its text-only action on
// `gap="$spacing6"` / `p={0}` (the INFRA-3112 hold). They ride the same
// deterministic-emission lane as the dimension props; the caller's class lands
// after the size variant's own gap/padding classes, so the merge lets it win.
describe('ButtonCompat — gap/p/padding (INFRA-3472)', () => {
  it('resolves a token gap to its exact px class and beats the size default (the InfoRowActionButton shape)', () => {
    const classes = frameClassesOf(
      renderToStaticMarkup(
        <ButtonCompat gap="$spacing6" size="xxsmall">
          Swap
        </ButtonCompat>,
      ),
    )
    expect(classes).toContain('gap-[6px]')
    expect(classes).not.toContain('gap-1')
  })

  it('p={0} compiles to p-[0px] and removes the size default padding (both spellings: p-1.5 and the px/py pair)', () => {
    const xxsmall = frameClassesOf(
      renderToStaticMarkup(
        <ButtonCompat p={0} size="xxsmall">
          Swap
        </ButtonCompat>,
      ),
    )
    expect(xxsmall).toContain('p-[0px]')
    expect(xxsmall).not.toContain('p-1.5')
    const small = frameClassesOf(
      renderToStaticMarkup(
        <ButtonCompat p={0} size="small">
          Swap
        </ButtonCompat>,
      ),
    )
    expect(small).toContain('p-[0px]')
    expect(small).not.toContain('px-3')
    expect(small).not.toContain('py-2')
  })

  it('the padding longhand spelling compiles to the same utility', () => {
    const classes = frameClassesOf(renderToStaticMarkup(<ButtonCompat padding="$spacing8">Swap</ButtonCompat>))
    expect(classes).toContain('p-[8px]')
  })

  it('the p shorthand wins when both spellings are set (fixed resolution — legacy resolved by JSX prop order)', () => {
    const classes = frameClassesOf(
      renderToStaticMarkup(
        <ButtonCompat padding="$spacing8" p={0}>
          Swap
        </ButtonCompat>,
      ),
    )
    expect(classes).toContain('p-[0px]')
    expect(classes).not.toContain('p-[8px]')
  })

  it('routes an out-of-set gap through the safelisted var-indirection twin', () => {
    const markup = renderToStaticMarkup(<ButtonCompat gap={7}>Swap</ButtonCompat>)
    const classes = frameClassesOf(markup)
    expect(classes).not.toContain('gap-[7px]')
    expect(classes.some((cls) => cls.startsWith('gap-[var('))).toBe(true)
    expect(markup).toContain('7px')
  })

  it('routes an out-of-set p through the safelisted var-indirection twin', () => {
    const markup = renderToStaticMarkup(<ButtonCompat p={7}>Swap</ButtonCompat>)
    const classes = frameClassesOf(markup)
    expect(classes).not.toContain('p-[7px]')
    expect(classes.some((cls) => cls.startsWith('p-[var('))).toBe(true)
    expect(markup).toContain('7px')
  })

  it('does not leak the props onto the DOM element', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat gap="$spacing6" p={0} padding="$spacing8">
        Swap
      </ButtonCompat>,
    )
    expect(markup).not.toContain('gap="')
    expect(markup).not.toContain('padding="')
    expect(markup).not.toContain(' p="')
  })

  it('keeps the size defaults untouched when neither gap nor padding is set', () => {
    const classes = frameClassesOf(renderToStaticMarkup(<ButtonCompat size="xxsmall">Swap</ButtonCompat>))
    expect(classes).toContain('gap-1')
    expect(classes).toContain('p-1.5')
  })

  it('the full InfoRowActionButton call shape compiles (fill/emphasis/focusScaling/gap/p/size)', () => {
    const classes = frameClassesOf(
      renderToStaticMarkup(
        <ButtonCompat
          emphasis="text-only"
          fill={false}
          focusScaling="equal:smaller-button"
          gap="$spacing6"
          p={0}
          size="xxsmall"
        >
          View
        </ButtonCompat>,
      ),
    )
    expect(classes).toContain('gap-[6px]')
    expect(classes).toContain('p-[0px]')
    expect(classes).toContain('shrink-0')
  })
})

// INFRA-3240: the responsive media props. Legacy Button accepts
// `$sm`/`$md`/… like any styled component — TokenDetailsEarnBanner.tsx keys its
// CTA on `$sm={{ width: '100%' }}` (full-width on mobile). The pools ride the
// dimension lane's emission, where the shared engine (../compat/compose) walks
// MEDIA_VARIANT — queries byte-identical to Tamagui's (max-width/max-height,
// inclusive bounds; ../compat/media.ts). Values under a media variant always
// ride the safelisted var-indirection twins (`media-sm:min-w-⟦var(--cF-min-w)⟧`
// — ⟦⟧ encoding per ./dimensions), so nothing renders unstyled.
describe('ButtonCompat — responsive media props (INFRA-3240)', () => {
  // THE ticket's repro, verbatim: the TokenDetailsEarnBanner /
  // TokenDetailsVaultShareBanner CTAs key on `$sm={{ width: '100%' }}`. It
  // needs `width` on the dimension surface (INFRA-3478, an ancestor of this
  // branch), so it both compiles here and renders the media-scoped class.
  it("compiles and renders the ticket's exact repro $sm={{ width: '100%' }}", () => {
    const markup = renderToStaticMarkup(<ButtonCompat $sm={{ width: '100%' }}>Swap</ButtonCompat>)
    const classes = frameClassesOf(markup)
    expect(classes.some((cls) => cls.startsWith('media-sm:w-'))).toBe(true)
    expect(markup).toContain('100%')
  })

  it('routes $sm={{ minWidth }} through the media machinery (media-sm-scoped class + inline value)', () => {
    const markup = renderToStaticMarkup(<ButtonCompat $sm={{ minWidth: '$spacing36' }}>Swap</ButtonCompat>)
    const classes = frameClassesOf(markup)
    expect(classes.some((cls) => cls.startsWith('media-sm:min-w-'))).toBe(true)
    expect(markup).toContain('36px')
  })

  it('routes $sm={{ height }} through the media machinery (media-sm-scoped class + inline value)', () => {
    const markup = renderToStaticMarkup(<ButtonCompat $sm={{ height: '$spacing48' }}>Swap</ButtonCompat>)
    const classes = frameClassesOf(markup)
    expect(classes.some((cls) => cls.startsWith('media-sm:h-'))).toBe(true)
    expect(markup).toContain('48px')
  })

  it('routes $md through its own media variant, independent of $sm', () => {
    const markup = renderToStaticMarkup(<ButtonCompat $md={{ maxWidth: 200 }}>Swap</ButtonCompat>)
    const classes = frameClassesOf(markup)
    expect(classes.some((cls) => cls.startsWith('media-md:max-w-'))).toBe(true)
    expect(classes.some((cls) => cls.startsWith('media-sm:'))).toBe(false)
    expect(markup).toContain('200px')
  })

  it('a media pool composes with a base dimension instead of replacing it', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat minHeight="$spacing36" $sm={{ minWidth: '100%' }}>
        Swap
      </ButtonCompat>,
    )
    const classes = frameClassesOf(markup)
    expect(classes).toContain('min-h-[36px]')
    expect(classes.some((cls) => cls.startsWith('media-sm:min-w-'))).toBe(true)
  })

  it('multiple media pools emit side by side ($sm and $md together)', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat $md={{ maxWidth: '$spacing60' }} $sm={{ minWidth: '$spacing36' }}>
        Swap
      </ButtonCompat>,
    )
    const classes = frameClassesOf(markup)
    expect(classes.some((cls) => cls.startsWith('media-sm:min-w-'))).toBe(true)
    expect(classes.some((cls) => cls.startsWith('media-md:max-w-'))).toBe(true)
  })

  // INFRA-3240 review: two pools contesting the SAME property must not share
  // one inline custom property. The twin machinery namespaces every var by the
  // POOL's prefix code (../compat/variant-codes: media-sm → F, media-md → E),
  // so each width rides its own var, consumed only under its own media variant
  // — the `--cF-min-w` spelling in the twin example above is pool-keyed (the F
  // IS the media-sm code), not utility-keyed. Pinned on exact strings because
  // a var collision here would render one breakpoint with the other's value.
  it('two pools setting the SAME property keep pool-scoped inline values (no shared var)', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat $md={{ width: '50%' }} $sm={{ width: '100%' }}>
        Swap
      </ButtonCompat>,
    )
    const classes = frameClassesOf(markup)
    expect(classes).toContain('media-sm:w-[var(--cF-w)]')
    expect(classes).toContain('media-md:w-[var(--cE-w)]')
    expect(markup).toContain('--cF-w:100%')
    expect(markup).toContain('--cE-w:50%')
  })

  // INFRA-3240 review: the pool surface is the whole dimension slice, but the
  // width/height family compiles through bracketed-value utilities while
  // gap/p/padding ride the spacing lane and justifyContent the enum lane —
  // each must reach its own media-scoped twin, or it renders unstyled.
  it('routes the gap/padding/justifyContent families through the media machinery too', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat $sm={{ gap: '$spacing6', padding: '$spacing8', justifyContent: 'flex-start' }}>Swap</ButtonCompat>,
    )
    const classes = frameClassesOf(markup)
    expect(classes).toContain('media-sm:gap-[var(--cF-gap)]')
    expect(classes).toContain('media-sm:p-[var(--cF-p)]')
    expect(classes).toContain('media-sm:[justify-content:var(--cF-jc)]')
    expect(markup).toContain('--cF-gap:6px')
    expect(markup).toContain('--cF-p:8px')
    expect(markup).toContain('--cF-jc:flex-start')
  })

  it('does not leak the media props onto the DOM element', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat $md={{ maxWidth: 200 }} $sm={{ minWidth: '$spacing36' }}>
        Swap
      </ButtonCompat>,
    )
    expect(markup).not.toContain('$sm')
    expect(markup).not.toContain('$md')
  })

  it('emits no media-prefixed class when no media prop is set', () => {
    const markup = renderToStaticMarkup(<ButtonCompat>Swap</ButtonCompat>)
    expect(frameClassesOf(markup).some((cls) => cls.startsWith('media-'))).toBe(false)
  })
})

describe('ButtonCompat — single-line label', () => {
  const ELLIPSIS = ['max-w-full', 'overflow-hidden', 'text-ellipsis', 'whitespace-nowrap']

  it('ellipsizes a string label and an explicit Button.Text, like legacy numberOfLines={1}', () => {
    for (const element of [
      <ButtonCompat key="string">Swap</ButtonCompat>,
      <ButtonCompat key="text">
        <ButtonCompat.Text>Swap</ButtonCompat.Text>
      </ButtonCompat>,
    ]) {
      const { container } = render(element)
      const label = container.querySelector('span')
      expect(Array.from(label?.classList ?? [])).toEqual(expect.arrayContaining(ELLIPSIS))
      cleanup()
    }
  })

  it('lets a caller whiteSpace beat the nowrap default', () => {
    const { container } = render(
      <ButtonCompat>
        <ButtonCompat.Text whiteSpace="normal">Swap</ButtonCompat.Text>
      </ButtonCompat>,
    )
    expect(container.querySelector('span')?.classList.contains('whitespace-nowrap')).toBe(false)
  })
})

// INFRA-3603: `flex` / `flexBasis`. Legacy Button accepts them as style
// props — DappRequestContent.tsx keys its footer buttons on `flexBasis={1}` and
// QueuedOrderModal spreads `{ flex: 1, flexBasis: 1 }` (web only). They ride the
// same INFRA-3283 dimension-emission lane; `flex` mirrors the shared flexbox
// lane's `grow-[n] shrink` (basis stays auto), and a call-site `flexBasis`
// overrides the fill frame default's `basis-0`.
describe('ButtonCompat — flex/flexBasis (INFRA-3603)', () => {
  it('resolves a token flexBasis to its exact px class and beats the fill default basis-0 (the DappRequestContent shape)', () => {
    const classes = frameClassesOf(renderToStaticMarkup(<ButtonCompat flexBasis={1}>Swap</ButtonCompat>))
    expect(classes).toContain('basis-[1px]')
    expect(classes).not.toContain('basis-0')
  })

  it('passes a CSS pass-through flexBasis string verbatim', () => {
    const classes = frameClassesOf(renderToStaticMarkup(<ButtonCompat flexBasis="100%">Swap</ButtonCompat>))
    expect(classes).toContain('basis-[100%]')
  })

  it('routes an out-of-set flexBasis through the safelisted var-indirection twin', () => {
    const markup = renderToStaticMarkup(<ButtonCompat flexBasis={5}>Swap</ButtonCompat>)
    const classes = frameClassesOf(markup)
    expect(classes).not.toContain('basis-[5px]')
    expect(classes.some((cls) => cls.startsWith('basis-[var('))).toBe(true)
    expect(markup).toContain('5px')
  })

  it('throws on an unknown $ token flexBasis instead of emitting it raw', () => {
    expect(() => renderToStaticMarkup(<ButtonCompat flexBasis="$spacing37">Swap</ButtonCompat>)).toThrow(
      /unknown size token/,
    )
  })

  it('compiles flex to the grow/shrink longhands, keeping basis auto (mirrors the shared flexbox lane)', () => {
    const classes = frameClassesOf(renderToStaticMarkup(<ButtonCompat flex={1}>Swap</ButtonCompat>))
    expect(classes).toContain('grow-[1]')
    expect(classes).toContain('shrink')
  })

  it('compiles the QueuedOrderModal shape {flex: 1, flexBasis: 1}: grow/shrink plus a winning basis', () => {
    const classes = frameClassesOf(
      renderToStaticMarkup(
        <ButtonCompat flex={1} flexBasis={1}>
          Swap
        </ButtonCompat>,
      ),
    )
    expect(classes).toContain('grow-[1]')
    expect(classes).toContain('shrink')
    // The longhand flexBasis is uncontested: flex emits no basis, so basis-[1px]
    // is the only flex-basis utility and still overrides the fill default.
    expect(classes).toContain('basis-[1px]')
    expect(classes).not.toContain('basis-0')
  })

  it('compiles a lone flexGrow and overflow to in-set utilities (the wallet action row / pending-swap fill shapes)', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat flexGrow={1} overflow="hidden">
        Swap
      </ButtonCompat>,
    )
    const classes = frameClassesOf(markup)
    expect(classes).toContain('grow-[1]')
    expect(classes).toContain('overflow-hidden')
    expect(classes).not.toContain('shrink')
    expect(markup).not.toContain('flexgrow')
    expect(markup).not.toContain('overflow="')
  })

  it('does not leak the props onto the DOM element', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat flex={1} flexBasis={1}>
        Swap
      </ButtonCompat>,
    )
    expect(markup).not.toContain('flexBasis')
    expect(markup).not.toContain('flexbasis')
    expect(markup).not.toContain('flex="')
  })

  it('keeps the fill default (flex-1 basis-0) untouched when neither flex nor flexBasis is set', () => {
    const classes = frameClassesOf(renderToStaticMarkup(<ButtonCompat>Swap</ButtonCompat>))
    expect(classes).toContain('flex-1')
    expect(classes).toContain('basis-0')
    expect(classes.some((cls) => cls.startsWith('grow-['))).toBe(false)
  })
})

// INFRA-3541 gap 2: `borderRadius` / `alignSelf` / top-level `$platform-web`.
// Legacy Button accepts them like any styled component —
// TopVerifiedAuctionsDiscoverySection.tsx keys its see-all link CTA on
// `borderRadius="$roundedFull"` / `alignSelf="flex-start"` /
// `$platform-web={{ textDecoration: 'none' }}` on top of the INFRA-3478
// tag="a"/href form. borderRadius rides the shared radiusClass contract,
// alignSelf is an enum lane over ALIGN_SELF_CLASS, and the $platform-web pool
// compiles through the same emission engine (applied unconditionally — these
// legs are platform-resolved).
describe('ButtonCompat — borderRadius/alignSelf/$platform-web (INFRA-3541)', () => {
  it('resolves a token borderRadius to its exact px class and beats the size variant radius (the Auctions CTA shape)', () => {
    const classes = frameClassesOf(
      renderToStaticMarkup(
        <ButtonCompat borderRadius="$roundedFull" size="small">
          See all
        </ButtonCompat>,
      ),
    )
    expect(classes).toContain('rounded-[999999px]')
    // The size variant's own rounded-12 loses the tailwind-merge conflict.
    expect(classes).not.toContain('rounded-12')
  })

  it('accepts a raw number whose px value is in the closed set', () => {
    const classes = frameClassesOf(renderToStaticMarkup(<ButtonCompat borderRadius={24}>Swap</ButtonCompat>))
    expect(classes).toContain('rounded-[24px]')
  })

  it('routes an out-of-set borderRadius through the safelisted var-indirection twin', () => {
    // 25 is no radius token's px value, so `rounded-[25px]` is not in the
    // generated safelist — the emission path must swap it for the twin and
    // carry the value inline.
    const markup = renderToStaticMarkup(<ButtonCompat borderRadius={25}>Swap</ButtonCompat>)
    const classes = frameClassesOf(markup)
    expect(classes).not.toContain('rounded-[25px]')
    expect(classes.some((cls) => cls.startsWith('rounded-[var('))).toBe(true)
    expect(markup).toContain('25px')
  })

  it('throws on an unknown $ token borderRadius instead of emitting it raw', () => {
    // The radius tokens are a closed TS union (unlike the template-typed $spacing
    // family), so smuggling an unknown one needs the OUT_OF_ENUM-style cast.
    const outOfEnumRadius = '$rounded37' as RadiusValue
    expect(() => renderToStaticMarkup(<ButtonCompat borderRadius={outOfEnumRadius}>Swap</ButtonCompat>)).toThrow(
      /unknown borderRadius token/,
    )
  })

  it('alignSelf beats the fill default (self-stretch) in the merged class list', () => {
    const classes = frameClassesOf(renderToStaticMarkup(<ButtonCompat alignSelf="flex-start">Swap</ButtonCompat>))
    expect(classes).toContain('self-start')
    expect(classes).not.toContain('self-stretch')
  })

  it('keeps the fill default self-stretch when alignSelf is absent', () => {
    const classes = frameClassesOf(renderToStaticMarkup(<ButtonCompat>Swap</ButtonCompat>))
    expect(classes).toContain('self-stretch')
    expect(classes.some((cls) => cls.startsWith('self-') && cls !== 'self-stretch')).toBe(false)
  })

  it("applies the $platform-web pool unconditionally: textDecoration 'none' compiles to the closed-set single", () => {
    const markup = renderToStaticMarkup(<ButtonCompat $platform-web={{ textDecoration: 'none' }}>Swap</ButtonCompat>)
    expect(frameClassesOf(markup)).toContain('[text-decoration:none]')
    // In-set value: no inline var lane needed.
    expect(markup).not.toContain('--c-')
  })

  it('$platform-web dimension values ride the same lanes as the top-level props', () => {
    const classes = frameClassesOf(
      renderToStaticMarkup(
        <ButtonCompat $platform-web={{ alignSelf: 'flex-start', minHeight: '$spacing36' }}>Swap</ButtonCompat>,
      ),
    )
    expect(classes).toContain('self-start')
    // The pool compiles to UNPREFIXED utilities in the same class list as the
    // frame defaults, so if it lost the tailwind-merge conflict both classes
    // would survive and the toContain above would still pass — the fill
    // default's self-stretch must be gone (the :821 top-level twin's assertion).
    expect(classes).not.toContain('self-stretch')
    expect(classes).toContain('min-h-[36px]')
  })

  // Review pin: the pool is the first one compiling to unprefixed utilities, so
  // a same-property base-vs-pool conflict is decided by composeCompatEmission's
  // pool walk order (base first, $platform-web after, later class wins the
  // tailwind-merge conflict) — the platform pool takes precedence, exactly as
  // legacy Tamagui resolves the platform pool over the base prop on web.
  it('$platform-web wins a same-property conflict against the top-level base prop', () => {
    const classes = frameClassesOf(
      renderToStaticMarkup(
        <ButtonCompat alignSelf="center" $platform-web={{ alignSelf: 'flex-start' }}>
          Swap
        </ButtonCompat>,
      ),
    )
    expect(classes).toContain('self-start')
    expect(classes).not.toContain('self-center')
    expect(classes).not.toContain('self-stretch')
  })

  it('compiles the full TopVerifiedAuctionsDiscoverySection CTA shape on the anchor form', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat
        $platform-web={{ textDecoration: 'none' }}
        alignSelf="flex-start"
        borderRadius="$roundedFull"
        emphasis="tertiary"
        fill={false}
        href="/explore/auctions"
        size="small"
        tag="a"
        variant="default"
      >
        See all
      </ButtonCompat>,
    )
    expect(markup).toContain('<a')
    expect(markup).toContain('href="/explore/auctions"')
    const classes = frameClassesOf(markup)
    expect(classes).toContain('rounded-[999999px]')
    expect(classes).toContain('self-start')
    expect(classes).toContain('[text-decoration:none]')
  })

  it('does not leak the props onto the DOM element', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat $platform-web={{ textDecoration: 'none' }} alignSelf="flex-start" borderRadius="$roundedFull">
        Swap
      </ButtonCompat>,
    )
    expect(markup).not.toContain('borderRadius')
    expect(markup).not.toContain('borderradius')
    expect(markup).not.toContain('alignSelf')
    expect(markup).not.toContain('alignself')
    expect(markup).not.toContain('$platform-web')
    expect(markup).not.toContain('platform-web=')
  })

  it('emits no radius/self/text-decoration overrides and no inline custom properties when the props are absent', () => {
    const markup = renderToStaticMarkup(<ButtonCompat>Swap</ButtonCompat>)
    const classes = frameClassesOf(markup)
    expect(classes.some((cls) => cls.startsWith('rounded-['))).toBe(false)
    expect(classes.some((cls) => cls.startsWith('[text-decoration:'))).toBe(false)
    expect(markup).not.toContain('--c-')
  })
})

describe('ButtonCompat — caller-visible group anchor (INFRA-3550)', () => {
  it('renders the unnamed group marker alongside the internal group/sbtn pool (the KycActionButton shape)', () => {
    const classes = frameClassesOf(
      renderToStaticMarkup(
        <ButtonCompat group flex={1}>
          Verify
        </ButtonCompat>,
      ),
    )
    expect(classes).toContain('group')
    // The internal pool stays private and untouched next to the caller anchor.
    expect(classes).toContain('group/sbtn')
  })

  it('a named group renders group/<name>', () => {
    const classes = frameClassesOf(renderToStaticMarkup(<ButtonCompat group="kyc">Verify</ButtonCompat>))
    expect(classes).toContain('group/kyc')
    expect(classes).not.toContain('group')
  })

  it('emits no marker when group is absent (the pinned matrix stays byte-identical)', () => {
    const classes = frameClassesOf(renderToStaticMarkup(<ButtonCompat>Swap</ButtonCompat>))
    expect(classes).not.toContain('group')
    expect(classes.some((cls) => cls.startsWith('group/') && cls !== 'group/sbtn')).toBe(false)
  })

  it('does not leak group onto the DOM element', () => {
    const markup = renderToStaticMarkup(<ButtonCompat group>Swap</ButtonCompat>)
    expect(markup).not.toContain('group=')
  })
})

describe('ButtonCompat.Text — styled legacy surface (INFRA-3550)', () => {
  // Selector-based, not positional: the label is the <span> carrying a text
  // node (icon/spinner spans only wrap an <svg>), so a block that gains an
  // icon or spinner can never shift which element is asserted.
  const textClassesOf = (markup: string): string[] => {
    const doc = new DOMParser().parseFromString(markup, 'text/html')
    const label = [...doc.querySelectorAll('span')].find((span) =>
      [...span.childNodes].some((node) => node.nodeType === Node.TEXT_NODE),
    )
    return label?.className.split(' ') ?? []
  }

  it('compiles the KycActionButton hover-reveal: position/top plus the $group-hover pool on its inline var', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat group flex={1}>
        <ButtonCompat.Text position="relative" top={0} $group-hover={{ top: -6 }}>
          Verify identity
        </ButtonCompat.Text>
      </ButtonCompat>,
    )
    const classes = textClassesOf(markup)
    expect(classes).toContain('relative')
    expect(classes).toContain('top-[0px]')
    expect(classes).toContain('group-hover:top-[var(--cgh-top)]')
    expect(markup).toContain('--cgh-top:-6px')
  })

  it('a transition rides the var twin verbatim and replaces the base color transition', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat>
        <ButtonCompat.Text transition="top 120ms cubic-bezier(0.17, 0.67, 0.45, 1)">Label</ButtonCompat.Text>
      </ButtonCompat>,
    )
    const classes = textClassesOf(markup)
    expect(classes).toContain('[transition:var(--c-t)]')
    expect(classes.some((cls) => cls.startsWith('[transition:color_100ms'))).toBe(false)
    expect(markup).toContain('--c-t:top 120ms cubic-bezier(0.17, 0.67, 0.45, 1)')
  })

  it('a theme-token color compiles through the pinned Text palette and never pins inline', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat>
        <ButtonCompat.Text color="$neutral2">Label</ButtonCompat.Text>
      </ButtonCompat>,
    )
    expect(textClassesOf(markup)).toContain('[color:var(--stext-neutral2)]')
    expect(markup).not.toContain('style=')
  })

  it('a hex color pins the label inline in every state (legacy custom-color branch)', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat>
        <ButtonCompat.Text color="#0A0B0E">Buy</ButtonCompat.Text>
      </ButtonCompat>,
    )
    expect(markup).toContain('style="color:#0A0B0E"')
  })

  it('the hex pin yields to a custom frame background (contrast class wins, like legacy)', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat backgroundColor="#FC72FF">
        <ButtonCompat.Text color="#0A0B0E">Buy</ButtonCompat.Text>
      </ButtonCompat>,
    )
    expect(textClassesOf(markup)).toContain('text-black')
    expect(markup).not.toContain('color:#0A0B0E')
  })

  it('the hex pin yields to the disabled palette', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat disabled>
        <ButtonCompat.Text color="#0A0B0E">Buy</ButtonCompat.Text>
      </ButtonCompat>,
    )
    expect(textClassesOf(markup)).toContain('text-neutral2')
    expect(markup).not.toContain('color:#0A0B0E')
  })

  it('variant overrides the parent cell (legacy styled-context semantics: the BUTTON variant)', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat>
        <ButtonCompat.Text variant="critical">Label</ButtonCompat.Text>
      </ButtonCompat>,
    )
    const classes = textClassesOf(markup)
    expect(classes).toContain('text-white')
    expect(classes).not.toContain('text-surface1')
  })

  it('opacity and whiteSpace compile (the KycActionButton second-line props)', () => {
    const classes = textClassesOf(
      renderToStaticMarkup(
        <ButtonCompat>
          <ButtonCompat.Text opacity={0} whiteSpace="nowrap">
            Label
          </ButtonCompat.Text>
        </ButtonCompat>,
      ),
    )
    expect(classes).toContain('opacity-[0]')
    expect(classes).toContain('whitespace-nowrap')
  })

  it('a caller fontSize keeps the size line-height, like legacy CustomButtonText', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat size="small">
        <ButtonCompat.Text fontSize={20}>Label</ButtonCompat.Text>
      </ButtonCompat>,
    )
    const classes = textClassesOf(markup)
    expect(classes).toContain('text-[length:var(--c-text)]')
    expect(markup).toContain('--c-text:20px')
    expect(classes).not.toContain('text-[14px]')
    expect(classes).toContain('[line-height:16.1px]')
  })

  it('animation is accepted and inert, like the shared compat surface', () => {
    const withAnimation = renderToStaticMarkup(
      <ButtonCompat>
        <ButtonCompat.Text animation="fastHeavy">Label</ButtonCompat.Text>
      </ButtonCompat>,
    )
    const without = renderToStaticMarkup(
      <ButtonCompat>
        <ButtonCompat.Text>Label</ButtonCompat.Text>
      </ButtonCompat>,
    )
    expect(withAnimation).toBe(without)
  })

  it('does not leak the styled props onto the DOM span', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat group>
        <ButtonCompat.Text position="relative" top={0} opacity={1} whiteSpace="nowrap" $group-hover={{ top: -6 }}>
          Label
        </ButtonCompat.Text>
      </ButtonCompat>,
    )
    for (const attr of ['position=', 'top=', 'opacity=', 'whiteSpace=', 'whitespace=', '$group-hover', 'transition=']) {
      expect(markup).not.toContain(attr)
    }
  })

  it('an unstyled Button.Text renders the exact span the pinned string-children path renders', () => {
    // Pins the explicit-subcomponent span to the string-children path's bytes. Only the
    // span: the frame legitimately differs (string children default the
    // Datadog action name, an element child cannot).
    const spanOf = (markup: string): string => /<span[^>]*>.*<\/span>/.exec(markup)?.[0] ?? ''
    const markup = renderToStaticMarkup(
      <ButtonCompat>
        <ButtonCompat.Text>Swap</ButtonCompat.Text>
      </ButtonCompat>,
    )
    expect(markup).not.toContain('style=')
    expect(spanOf(markup)).not.toBe('')
    expect(spanOf(markup)).toBe(spanOf(renderToStaticMarkup(<ButtonCompat>Swap</ButtonCompat>)))
  })
})

// INFRA-3661: the margin family (m/mx/my/mt/mb/ml/mr + the margin* longhand
// spellings). Legacy Button accepts them as style props — PR #40010's
// ConfirmLimitOrderModal/Error.tsx retry button needed `mt="$spacing8"` and had
// to work around the gap with a wrapper Flex. They ride the same INFRA-3283
// dimension-emission lane on the shared SpaceValue contract; the frame styles
// no margin at rest, so nothing is contested by the size variants.
describe('ButtonCompat — margin props (INFRA-3661)', () => {
  it('resolves a token mt to its exact px class (the Error.tsx retry-button shape)', () => {
    const classes = frameClassesOf(renderToStaticMarkup(<ButtonCompat mt="$spacing8">Try again</ButtonCompat>))
    expect(classes).toContain('mt-[8px]')
  })

  it('compiles every margin shorthand to its own utility', () => {
    const classes = frameClassesOf(
      renderToStaticMarkup(
        <ButtonCompat
          m="$spacing2"
          mb="$spacing12"
          ml="$spacing16"
          mr="$spacing24"
          mx="$spacing4"
          my="$spacing6"
          mt="$spacing8"
        >
          Swap
        </ButtonCompat>,
      ),
    )
    for (const cls of ['m-[2px]', 'mx-[4px]', 'my-[6px]', 'mt-[8px]', 'mb-[12px]', 'ml-[16px]', 'mr-[24px]']) {
      expect(classes).toContain(cls)
    }
  })

  it('emits the side class alongside the all-sides shorthand (CSS orders m < mx/my < sides, so the side paints)', () => {
    const classes = frameClassesOf(
      renderToStaticMarkup(
        <ButtonCompat m="$spacing16" mt="$spacing8">
          Swap
        </ButtonCompat>,
      ),
    )
    // Both classes must survive the merge: tailwind-merge must not let the
    // side utility knock out the broader one (or vice versa) — the stylesheet
    // order is what resolves the top edge, exactly like legacy's expansion.
    expect(classes).toContain('m-[16px]')
    expect(classes).toContain('mt-[8px]')
  })

  it('the margin longhand spellings compile to the same utilities', () => {
    const classes = frameClassesOf(
      renderToStaticMarkup(
        <ButtonCompat margin="$spacing2" marginHorizontal="$spacing4" marginTop="$spacing8">
          Swap
        </ButtonCompat>,
      ),
    )
    expect(classes).toContain('m-[2px]')
    expect(classes).toContain('mx-[4px]')
    expect(classes).toContain('mt-[8px]')
  })

  it('the shorthand wins when both spellings are set (fixed resolution — legacy resolved by JSX prop order)', () => {
    const classes = frameClassesOf(
      renderToStaticMarkup(
        <ButtonCompat marginTop="$spacing8" mt={0}>
          Swap
        </ButtonCompat>,
      ),
    )
    expect(classes).toContain('mt-[0px]')
    expect(classes).not.toContain('mt-[8px]')
  })

  it("passes the enumerated 'auto' special through (mx auto centering)", () => {
    const classes = frameClassesOf(renderToStaticMarkup(<ButtonCompat mx="auto">Swap</ButtonCompat>))
    expect(classes).toContain('mx-[auto]')
  })

  it('routes an out-of-set margin through the safelisted var-indirection twin', () => {
    const markup = renderToStaticMarkup(<ButtonCompat mt={7}>Swap</ButtonCompat>)
    const classes = frameClassesOf(markup)
    expect(classes).not.toContain('mt-[7px]')
    expect(classes.some((cls) => cls.startsWith('mt-[var('))).toBe(true)
    expect(markup).toContain('7px')
  })

  it('throws on an unknown $ token margin instead of emitting it raw', () => {
    // The SpaceValue token union rejects the typo at compile time; the cast
    // simulates a dynamically-typed spread smuggling it through (the
    // OUT_OF_ENUM idiom above).
    const unknownToken = '$spacing37' as SpaceValue
    expect(() => renderToStaticMarkup(<ButtonCompat mt={unknownToken}>Swap</ButtonCompat>)).toThrow(
      /unknown space token/,
    )
  })

  it('renders a margin set inside a responsive pool through the media twin', () => {
    const markup = renderToStaticMarkup(<ButtonCompat $sm={{ mt: 8 }}>Swap</ButtonCompat>)
    const classes = frameClassesOf(markup)
    expect(classes.some((cls) => cls.startsWith('media-sm:mt-['))).toBe(true)
    expect(markup).toContain('8px')
  })

  it('does not leak the props onto the DOM element', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat m="$spacing2" marginTop="$spacing8" mt="$spacing8" mx="auto">
        Swap
      </ButtonCompat>,
    )
    for (const attr of [' m="', ' mt="', ' mx="', 'margin="', 'margintop="', 'marginTop="']) {
      expect(markup).not.toContain(attr)
    }
  })

  it('emits no margin utility when none is set (the pinned matrix stays byte-identical)', () => {
    const classes = frameClassesOf(renderToStaticMarkup(<ButtonCompat>Swap</ButtonCompat>))
    expect(classes.some((cls) => /^m[xytblr]?-\[/.test(cls))).toBe(false)
  })
})

// borderColor: the LpIncentiveRewardsCard collect-button shape —
// `borderColor={isCollectDisabled ? '$neutral3' : 'unset'}` with no custom
// backgroundColor, so the internal custom-bg border path cannot stand in. The
// prop rides the dimension emission lane through the shared colour lane
// (semantic token → `border-*` utility, non-token CSS value → colour-form twin).
describe('ButtonCompat — borderColor', () => {
  it('resolves a semantic token to its border utility (the disabled collect-button outline)', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat borderColor="$neutral3" disabled>
        Collect
      </ButtonCompat>,
    )
    expect(frameClassesOf(markup)).toContain('border-neutral3')
  })

  it('emits the dark: sibling for a themed token pair', () => {
    const classes = frameClassesOf(
      renderToStaticMarkup(<ButtonCompat borderColor="$surface3Hovered">Swap</ButtonCompat>),
    )
    expect(classes).toContain('border-surface3-hovered')
    expect(classes).toContain('dark:border-surface3-hovered-dark')
  })

  it("routes the legacy non-token value ('unset') through the colour-form twin", () => {
    const markup = renderToStaticMarkup(<ButtonCompat borderColor="unset">Collect</ButtonCompat>)
    const classes = frameClassesOf(markup)
    expect(classes.some((cls) => cls.startsWith('border-[color:var('))).toBe(true)
    expect(markup).toContain('unset')
  })

  // Was a throw pin. The shared colour lane warns and continues now; the
  // warning names the prop, which is the only signal that survives the drop.
  it('warns and emits no border colour on an unknown $ token (the shared colour-lane contract)', () => {
    const unknownToken = '$neutral7' as ColorValue
    const error = spyOnConsoleError()
    const classes = frameClassesOf(renderToStaticMarkup(<ButtonCompat borderColor={unknownToken}>Swap</ButtonCompat>))
    expect(classes.filter((cls) => cls.startsWith('border-['))).toEqual([])
    expect(error.mock.calls.map((call) => String(call[0])).join('\n')).toContain('"$neutral7" for "borderColor"')
  })

  // The drop FALLS THROUGH rather than forcing a colour: ButtonCompat takes its
  // border width from its base classes and its border colour from the variant
  // cell, so an unconditional `border-transparent` here would erase the variant's
  // border. The transparent drop is reserved for a style object that sets its own
  // `borderWidth` (pinned on the Flex/View/TouchableArea bindings), which is the
  // only case where nothing else is going to colour the border.
  it('falls through to the variant cell border rather than erasing it', () => {
    const error = spyOnConsoleError()
    const withUnmappable = frameClassesOf(
      renderToStaticMarkup(
        <ButtonCompat borderColor={'$neutral7' as ColorValue} emphasis="tertiary" variant="warning">
          Careful
        </ButtonCompat>,
      ),
    )
    const withoutTheProp = frameClassesOf(
      renderToStaticMarkup(
        <ButtonCompat emphasis="tertiary" variant="warning">
          Careful
        </ButtonCompat>,
      ),
    )
    expect(withUnmappable).toContain('border-warning-secondary')
    expect(withUnmappable).not.toContain('border-transparent')
    // Byte-identical to never passing the prop: that is what "falls through" means.
    expect(withUnmappable).toEqual(withoutTheProp)
    expect(error.mock.calls.map((call) => String(call[0])).join('\n')).toContain('"$neutral7" for "borderColor"')
  })

  it('beats the variant cell border colour (explicit props beat variants)', () => {
    const classes = frameClassesOf(
      renderToStaticMarkup(
        <ButtonCompat borderColor="$neutral3" emphasis="tertiary" variant="warning">
          Careful
        </ButtonCompat>,
      ),
    )
    expect(classes).toContain('border-neutral3')
    expect(classes).not.toContain('border-warning-secondary')
  })

  it('withholds the internal custom-backgroundColor border when an explicit borderColor is set', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat backgroundColor="#123456" borderColor="$neutral3">
        Swap
      </ButtonCompat>,
    )
    expect(markup).toContain('background-color:#123456')
    expect(markup).not.toContain('border-color:#123456')
    expect(frameClassesOf(markup)).toContain('border-neutral3')
  })

  it('withholds the custom-backgroundColor border when a MEDIA POOL sets borderColor (inline would beat the media class)', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat backgroundColor="#123456" $md={{ borderColor: '$neutral3' }}>
        Swap
      </ButtonCompat>,
    )
    expect(markup).not.toContain('border-color:#123456')
    expect(frameClassesOf(markup).some((cls) => cls.startsWith('media-md:border-'))).toBe(true)
  })

  it('withholds the custom-backgroundColor border when the $platform-web pool sets borderColor', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat backgroundColor="#123456" $platform-web={{ borderColor: '$neutral3' }}>
        Swap
      </ButtonCompat>,
    )
    expect(markup).not.toContain('border-color:#123456')
    expect(frameClassesOf(markup)).toContain('border-neutral3')
  })

  it('keeps the custom-backgroundColor border when no borderColor is set (the pre-existing contract)', () => {
    const markup = renderToStaticMarkup(<ButtonCompat backgroundColor="#123456">Swap</ButtonCompat>)
    expect(markup).toContain('border-color:#123456')
  })

  it('renders a borderColor set inside a responsive pool through the media machinery', () => {
    const classes = frameClassesOf(
      renderToStaticMarkup(<ButtonCompat $md={{ borderColor: '$neutral3' }}>Swap</ButtonCompat>),
    )
    expect(classes.some((cls) => cls.startsWith('media-md:border-'))).toBe(true)
  })

  it('does not leak borderColor onto the DOM element', () => {
    const markup = renderToStaticMarkup(<ButtonCompat borderColor="$neutral3">Swap</ButtonCompat>)
    expect(markup).not.toContain('borderColor=')
    expect(markup).not.toContain('bordercolor=')
  })
})

// backgroundColor, THEME-TOKEN half: the PositionsSummaryChips collect-chip
// shape. A token must compile to a real `bg-*` utility (not raw invalid inline
// CSS) and must not force the contrast fallback `text-white` onto the label.
describe('ButtonCompat — backgroundColor theme token', () => {
  // Composed at runtime so the twin never sits LITERALLY in the scanned
  // mycelium tree, where it would compile into the native stylesheet.
  const stextTwin = (token: string): string => `[color:var(--stext-${token})]`

  const labelClassesOf = (markup: string): string[] => {
    const doc = new DOMParser().parseFromString(markup, 'text/html')
    const label = [...doc.querySelectorAll('span')].find((span) =>
      [...span.childNodes].some((node) => node.nodeType === Node.TEXT_NODE),
    )
    return label?.className.split(' ') ?? []
  }

  const collectChip = (canCollect: boolean): string =>
    renderToStaticMarkup(
      <ButtonCompat backgroundColor="$surface3" disabled={!canCollect} emphasis="secondary" size="xsmall">
        <ButtonCompat.Text color={canCollect ? '$neutral1' : '$neutral3'}>Collect</ButtonCompat.Text>
      </ButtonCompat>,
    )

  it('compiles the token to a real background utility instead of an inline declaration', () => {
    const markup = collectChip(true)
    expect(frameClassesOf(markup)).toContain('bg-surface3')
    expect(markup).not.toContain('$surface3')
    expect(markup).not.toContain('background-color:')
  })

  it('leaves the label on its own colour — no custom-background contrast class', () => {
    const classes = labelClassesOf(collectChip(true))
    expect(classes).not.toContain('text-white')
    expect(classes).toContain(stextTwin('neutral1'))
  })

  it('lets the token win over the disabled frame (props beat variants, the legacy precedence) with the disabled label palette', () => {
    const markup = collectChip(false)
    expect(frameClassesOf(markup)).toContain('bg-surface3')
    const label = labelClassesOf(markup)
    // Both colour classes co-exist (cn has no [color:...] conflict group); the
    // disabled palette paints because text-neutral2 declares later in the
    // compiled entry, pinned by web-css-coverage.test.ts.
    expect(label).toContain('text-neutral2')
    expect(label).toContain(stextTwin('neutral3'))
    expect(label).not.toContain('text-white')
  })

  it('beats the variant cell background (explicit props beat variants)', () => {
    const classes = frameClassesOf(renderToStaticMarkup(<ButtonCompat backgroundColor="$surface3">Swap</ButtonCompat>))
    expect(classes).toContain('bg-surface3')
    expect(classes).not.toContain('bg-neutral1')
  })

  it('emits the dark: sibling for a themed token pair', () => {
    const classes = frameClassesOf(
      renderToStaticMarkup(<ButtonCompat backgroundColor="$surface3Hovered">Swap</ButtonCompat>),
    )
    expect(classes).toContain('bg-surface3-hovered')
    expect(classes).toContain('dark:bg-surface3-hovered-dark')
  })

  // Was a throw pin. The shared colour lane warns and continues now, so the
  // button keeps its variant background rather than crashing the render.
  it('warns and keeps the variant background on an unknown $ token (the shared colour-lane contract)', () => {
    const error = spyOnConsoleError()
    const classes = frameClassesOf(renderToStaticMarkup(<ButtonCompat backgroundColor="$neutral7">Swap</ButtonCompat>))
    // No bg class is emitted for the unresolvable token, so the variant cell's
    // own background is what survives cn()'s merge.
    expect(classes).toContain('bg-neutral1')
    expect(classes.filter((cls) => cls.startsWith('bg-['))).toEqual([])
    expect(error.mock.calls.map((call) => String(call[0])).join('\n')).toContain('"$neutral7" for "backgroundColor"')
  })

  it('warns but still paints a raw Spore palette token via its literal', () => {
    const error = spyOnConsoleError()
    const markup = renderToStaticMarkup(<ButtonCompat backgroundColor="$greenBase">Swap</ButtonCompat>)
    // `bg-[#0C8911]` is out of the closed set, so the dimension lane swaps it
    // for its var-indirection twin — the literal still reaches the element.
    expect(frameClassesOf(markup)).toContain('bg-[color:var(--c-bg)]')
    expect(markup).toContain('--c-bg:#0C8911')
    expect(frameClassesOf(markup)).not.toContain('bg-neutral1')
    expect(error.mock.calls.map((call) => String(call[0])).join('\n')).toContain('"$greenBase" for "backgroundColor"')
  })

  it('still routes a concrete hex through the custom-background lane', () => {
    const markup = renderToStaticMarkup(<ButtonCompat backgroundColor="#FFFFFF">Swap</ButtonCompat>)
    expect(markup).toContain('background-color:#FFFFFF')
    expect(frameClassesOf(markup)).not.toContain('bg-surface3')
    expect(labelClassesOf(markup)).toContain('text-black')
  })
})

// display: the PositionsSummaryChips collect-chip shape — the chip hides below
// the md breakpoint via `$md={{ display: 'none' }}`. The prop rides the same
// dimension lane (base pool, every media pool, the $platform-web pool) through
// the shared display enum map.
describe('ButtonCompat — display', () => {
  it("compiles and renders the ticket's exact repro $md={{ display: 'none' }}", () => {
    const markup = renderToStaticMarkup(<ButtonCompat $md={{ display: 'none' }}>Collect</ButtonCompat>)
    const classes = frameClassesOf(markup)
    expect(classes.some((cls) => cls.startsWith('media-md:[display:var('))).toBe(true)
    expect(markup).toContain(':none')
  })

  it("maps top-level display='none' to the curated hidden utility, beating the frame's flex", () => {
    const classes = frameClassesOf(renderToStaticMarkup(<ButtonCompat display="none">Swap</ButtonCompat>))
    expect(classes).toContain('hidden')
    expect(classes).not.toContain('flex')
  })

  it('maps the other curated values through the shared enum lane (inline-flex)', () => {
    const classes = frameClassesOf(renderToStaticMarkup(<ButtonCompat display="inline-flex">Swap</ButtonCompat>))
    expect(classes).toContain('inline-flex')
  })

  it('does not leak display onto the DOM element', () => {
    const markup = renderToStaticMarkup(<ButtonCompat display="none">Swap</ButtonCompat>)
    expect(markup).not.toContain(' display="')
  })
})
