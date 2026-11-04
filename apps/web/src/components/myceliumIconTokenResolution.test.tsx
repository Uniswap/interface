import { fireEvent } from '@testing-library/react'
import { Button, TouchableArea } from '@universe/mycelium'
import { AlertTriangleFilled } from '@universe/mycelium/icons/AlertTriangleFilled'
import { ArrowChange } from '@universe/mycelium/icons/ArrowChange'
import { ArrowLeft } from '@universe/mycelium/icons/ArrowLeft'
import { ArrowRight } from '@universe/mycelium/icons/ArrowRight'
import { Blocked } from '@universe/mycelium/icons/Blocked'
import { Caret } from '@universe/mycelium/icons/Caret'
import { ChartBarCrossed } from '@universe/mycelium/icons/ChartBarCrossed'
import { Check } from '@universe/mycelium/icons/Check'
import { CheckCircleFilled } from '@universe/mycelium/icons/CheckCircleFilled'
import { ContractInteraction } from '@universe/mycelium/icons/ContractInteraction'
import { Contrast } from '@universe/mycelium/icons/Contrast'
import { ExternalLink } from '@universe/mycelium/icons/ExternalLink'
import { GoogleLogoGradient } from '@universe/mycelium/icons/GoogleLogoGradient'
import { IcloudPasswordLogo } from '@universe/mycelium/icons/IcloudPasswordLogo'
import { Magic } from '@universe/mycelium/icons/Magic'
import { NoTokens } from '@universe/mycelium/icons/NoTokens'
import { Passkey } from '@universe/mycelium/icons/Passkey'
import { Person } from '@universe/mycelium/icons/Person'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Provider } from 'react-redux'
/**
 * Icon token-resolution contract for converted mycelium icons (INFRA-2971).
 *
 * Snapshot tests cannot see this regression class: jsdom's CSSOM silently
 * drops `var()` values from serialized inline styles, so a snapshot looks
 * identical whether a color token resolved to `var(--neutral2)` or leaked
 * into the DOM as a literal `$neutral2`. This suite asserts through
 * `renderToStaticMarkup` — real markup, no CSSOM — that token props resolve:
 * sizes to px, colors to `var(--*)` (or passthrough values), and that no
 * `$`-token literal ever reaches the SVG (the INFRA-2971 base-gap class,
 * fixed by #37205).
 *
 * Wave-reusable: later conversion batches extend REPRESENTATIVE_CASES with
 * their own converted icons / prop shapes instead of writing new suites.
 */
import store from '~/state'
import { render } from '~/test-utils/render'
import { ColorSchemeProvider } from '~/theme/colorSchemeProvider'

interface IconCase {
  name: string
  element: ReactElement
  expectedPx: number
  expectedColor: string
  /** Extra raw-markup pins, e.g. gradient defs / explicit brand fills that must survive the default color. */
  alsoContains?: string[]
}

// Each case mirrors a real converted call site (batch 1 unless noted).
const REPRESENTATIVE_CASES: IconCase[] = [
  {
    // theme/components/ThemeToggle.tsx
    name: 'Contrast size="$icon.24" color="$neutral2"',
    element: <Contrast size="$icon.24" color="$neutral2" />,
    expectedPx: 24,
    expectedColor: 'var(--neutral2)',
  },
  {
    // ConnectedAccountBlocked.tsx
    name: 'Blocked color="$neutral2" size="$icon.24"',
    element: <Blocked color="$neutral2" size="$icon.24" />,
    expectedPx: 24,
    expectedColor: 'var(--neutral2)',
  },
  {
    // Table/ErrorBox.tsx
    name: 'ChartBarCrossed size="$icon.20" color="$neutral2"',
    element: <ChartBarCrossed size="$icon.20" color="$neutral2" />,
    expectedPx: 20,
    expectedColor: 'var(--neutral2)',
  },
  {
    // UnitagRateLimitSpeedbump/UnitagRateLimitSpeedbumpModal.tsx
    name: 'Person color="$neutral1" size="$icon.24"',
    element: <Person color="$neutral1" size="$icon.24" />,
    expectedPx: 24,
    expectedColor: 'var(--neutral1)',
  },
  {
    // AccountDrawer/MiniPortfolio/PortfolioLogo.tsx:82 — numeric size, no token
    name: 'ContractInteraction size={40} color="$neutral2"',
    element: <ContractInteraction size={40} color="$neutral2" />,
    expectedPx: 40,
    expectedColor: 'var(--neutral2)',
  },
  {
    // AccountDrawer/SettingsButton.tsx:52 — hand-written icon whose SVG sits
    // inside a mycelium Flex wrapper; the token color must still resolve on
    // the inner SVG, not leak onto (or vanish from) the wrapper.
    name: 'RotatableChevron color="$neutral3" direction="right" size="$icon.20" (Flex-wrapped)',
    element: <RotatableChevron color="$neutral3" direction="right" size="$icon.20" />,
    expectedPx: 20,
    expectedColor: 'var(--neutral3)',
  },
  {
    // Passkey/authenticatorProvider.tsx:15 — brand logo with NO color prop:
    // createIcon defaults to currentColor on the svg root, which must not
    // repaint the logo's explicit brand fills.
    name: 'GoogleLogoGradient size="$icon.20" (no color — brand fills survive)',
    element: <GoogleLogoGradient size="$icon.20" />,
    expectedPx: 20,
    expectedColor: 'currentColor',
    alsoContains: ['fill="#4285F4"', 'fill="#34A853"'],
  },
  {
    // WalletModal/SwitchWalletModal.tsx — monochrome icon with NO color prop,
    // rendered here without its TouchableArea wrapper (the wrapped shape,
    // where INFRA-3537's injection applies, is pinned in the TouchableArea
    // describe below): the root defaults to currentColor and the paths keep
    // fill="currentColor" so the ambient text color cascades into them.
    name: 'ArrowLeft size="$icon.24" (monochrome, no color — currentColor cascade)',
    element: <ArrowLeft size="$icon.24" />,
    expectedPx: 24,
    expectedColor: 'currentColor',
    alsoContains: ['fill="currentColor"'],
  },
  {
    // Passkey/authenticatorProvider.tsx:17 — gradient logo with NO color prop:
    // the default currentColor must leave the gradient defs and url(#...) path
    // fills intact (a forced tint would render the logo flat).
    name: 'IcloudPasswordLogo size="$icon.20" (no color — gradient defs survive)',
    element: <IcloudPasswordLogo size="$icon.20" />,
    expectedPx: 20,
    expectedColor: 'currentColor',
    alsoContains: ['<linearGradient', 'fill="url(#paint0_linear'],
  },
  {
    // Batch 2: Swap/Send/SelfSendSpeedBump.tsx — status color token (first
    // non-neutral semantic color in the wave's converted set). The legacy
    // token name is repointed, not mirrored: $statusCritical resolves to
    // mycelium's var(--critical), not a same-named variable.
    name: 'AlertTriangleFilled color="$statusCritical" size="$icon.28" (batch 2)',
    element: <AlertTriangleFilled color="$statusCritical" size="$icon.28" />,
    expectedPx: 28,
    expectedColor: 'var(--critical)',
  },
  {
    // Batch 2: Liquidity/CreateAuction/components/KycCard.tsx — surface token
    // as icon color (check-on-accent badge) at the smallest token size.
    name: 'Check size="$icon.12" color="$surface1" (batch 2)',
    element: <Check size="$icon.12" color="$surface1" />,
    expectedPx: 12,
    expectedColor: 'var(--surface1)',
  },
  {
    // Batch 2: PoolDetails/usePoolDetailsHeaderActions.tsx — supported SVG
    // presentation prop (strokeWidth) rides along with token props untouched.
    name: 'ExternalLink size="$icon.16" color="$neutral2" strokeWidth={0} (batch 2)',
    element: <ExternalLink size="$icon.16" color="$neutral2" strokeWidth={0} />,
    expectedPx: 16,
    expectedColor: 'var(--neutral2)',
  },
  {
    // Batch 2: Portfolio/Tokens/Table/columns/UnrealizedPnl.tsx:77 — the
    // batch's only DYNAMIC color site: `color={arrowColor}` where
    // getValueSignInfo() returns $statusSuccess for gains. The critical leg
    // is pinned above via SelfSendSpeedBump; this pins the success leg, so
    // every token the dynamic site can emit is on the resolved map.
    name: 'Caret color="$statusSuccess" direction="n" size="$icon.16" (batch 2, dynamic site)',
    element: <Caret color="$statusSuccess" direction="n" size="$icon.16" />,
    expectedPx: 16,
    expectedColor: 'var(--success)',
  },
  // Batch 3 (apps/web/src/features) shapes below.
  {
    // features/Liquidity/components/emptyStates/ErrorPositionsView.tsx:22 (and
    // BidReviewModal's four error banners) — status token. NOTE the repointed
    // name: $statusCritical resolves to var(--critical), not
    // var(--statusCritical) (packages/mycelium/src/compat/tokens.ts).
    name: 'AlertTriangleFilled size="$icon.24" color="$statusCritical"',
    element: <AlertTriangleFilled size="$icon.24" color="$statusCritical" />,
    expectedPx: 24,
    expectedColor: 'var(--critical)',
  },
  {
    // features/Liquidity/LPIncentives/PoolAprTooltip.tsx (Total APR row) —
    // accent token + the smallest icon-size token.
    name: 'Magic size="$icon.12" color="$accent1"',
    element: <Magic size="$icon.12" color="$accent1" />,
    expectedPx: 12,
    expectedColor: 'var(--accent1)',
  },
  {
    // features/Toucan/Auction/Bids/BidDetailsModal/StatusIndicator.tsx:96 —
    // dynamic color: useBidStatusColors() passes useSporeColors().statusSuccess.val,
    // an already-RESOLVED literal (#0C8911 light — equal to var(--success)'s
    // target in theme.css), not a $token. Resolved values must pass through
    // untouched.
    name: 'CheckCircleFilled size="$icon.16" color={resolved literal} (useSporeColors .val passthrough)',
    element: <CheckCircleFilled size="$icon.16" color="#0C8911" />,
    expectedPx: 16,
    expectedColor: '#0C8911',
  },
  // Batch 4 (apps/web/src/components residue) shapes below.
  {
    // DeltaArrow/DeltaArrow.tsx up-arrow — DYNAMIC color site
    // (`isZero || noColor ? '$neutral3' : '$statusSuccess'`) with a numeric
    // default size and the `rotate` shorthand riding along. This pins the
    // success leg of the range; the $neutral3 leg is pinned above
    // (RotatableChevron) and the critical leg by the down-arrow case below.
    // NOTE the repointed name: $statusSuccess resolves to var(--success).
    name: 'ArrowChange color="$statusSuccess" rotate="180deg" size={16} (batch 4, dynamic site)',
    element: <ArrowChange color="$statusSuccess" rotate="180deg" size={16} />,
    expectedPx: 16,
    expectedColor: 'var(--success)',
    alsoContains: ['transform:rotate(180deg)'],
  },
  {
    // DeltaArrow/DeltaArrow.tsx down-arrow — the critical leg of the same
    // dynamic site (`noColor ? '$neutral3' : '$statusCritical'`).
    // $statusCritical is repointed to var(--critical).
    name: 'ArrowChange color="$statusCritical" size={16} (batch 4, dynamic site)',
    element: <ArrowChange color="$statusCritical" size={16} />,
    expectedPx: 16,
    expectedColor: 'var(--critical)',
  },
  {
    // Table/TableSideScrollButtons/TableScrollButton.tsx (and
    // TokenCardCarousel/CarouselScrollButtonVisual.tsx) — an explicit
    // `transform` string on the icon, resolved through the CSS lane.
    name: 'ArrowRight color="$neutral1" size="$icon.12" transform="rotate(180deg)" (batch 4)',
    element: <ArrowRight color="$neutral1" size="$icon.12" transform="rotate(180deg)" />,
    expectedPx: 12,
    expectedColor: 'var(--neutral1)',
    alsoContains: ['transform:rotate(180deg)'],
  },
  {
    // StickyCollapsibleHeader/HeaderActions/useShareAction.tsx — a spacing
    // token on the icon's CSS lane (`padding="$spacing1"`) rides along with
    // the repointed success color.
    name: 'Check size="$icon.18" padding="$spacing1" color="$statusSuccess" (batch 4)',
    element: <Check size="$icon.18" padding="$spacing1" color="$statusSuccess" />,
    expectedPx: 18,
    expectedColor: 'var(--success)',
    alsoContains: ['padding:1px'],
  },
  {
    // features/wallet/components/GetTheAppModal/PasskeyGeneration.tsx — $white is a
    // theme-INVARIANT token: resolveIconColor emits the literal (#FFFFFF, the
    // legacy resolved value in both themes), not a var(), because the raw
    // --color-* palette vars are tree-shaken from compiled app CSS
    // (LITERAL_SEMANTIC_COLORS in packages/mycelium/src/compat/tokens.ts).
    name: 'Passkey size="$icon.24" color="$white" (batch 4, theme-invariant literal lane)',
    element: <Passkey size="$icon.24" color="$white" />,
    expectedPx: 24,
    expectedColor: '#FFFFFF',
  },
  // Batch 5 (packages/uniswap/src/components) below.
  {
    // The only pin of the large $icon.100 size token.
    name: 'NoTokens color="$neutral3" size="$icon.100" ($icon.100 size token)',
    element: <NoTokens color="$neutral3" size="$icon.100" />,
    expectedPx: 100,
    expectedColor: 'var(--neutral3)',
  },
]

function svgStyle(markup: string): string {
  const match = markup.match(/<svg[^>]*style="([^"]*)"/)
  if (!match) {
    throw new Error(`no styled <svg> root in markup: ${markup.slice(0, 200)}`)
  }
  return match[1]
}

describe('converted mycelium icons resolve token props (INFRA-2971)', () => {
  it.each(REPRESENTATIVE_CASES.map((testCase) => [testCase.name, testCase] as const))(
    '%s',
    (_name, { element, expectedPx, expectedColor, alsoContains }) => {
      const markup = renderToStaticMarkup(element)
      const style = svgStyle(markup)

      // Sizes resolve to px on the inline-style channel (numeric and token alike).
      expect(style).toContain(`width:${expectedPx}px`)
      expect(style).toContain(`height:${expectedPx}px`)

      // Token colors resolve to theme-aware CSS custom-property references;
      // omitted color defaults to currentColor without repainting the icon.
      expect(style).toContain(`color:${expectedColor}`)

      // Shape-specific pins (gradient defs, explicit brand fills, ...).
      for (const fragment of alsoContains ?? []) {
        expect(markup).toContain(fragment)
      }

      // The base-gap class: a `$`-token literal must never reach the DOM —
      // neither as an attribute value (`="$…"`) nor inside a style value
      // (`color:$…`).
      expect(markup).not.toMatch(/[="':]\$[a-zA-Z]/)
    },
  )
})

describe('mycelium icons inside TouchableArea (the real color-injection path, #38813)', () => {
  // Static legs assert through renderToStaticMarkup like everything above
  // (jsdom's CSSOM drops the injected `var()` from mounted styles); the
  // mounted cases here prove the full render path cannot throw, which is
  // what #38813 guarded.
  const staticProviders = (element: ReactElement): string =>
    renderToStaticMarkup(
      <Provider store={store}>
        <ColorSchemeProvider>{element}</ColorSchemeProvider>
      </Provider>,
    )

  it('an explicitly colored icon keeps its own color un-hovered', () => {
    // Exactly the VerifyIdentityModal close-button shape (batch 4's listed
    // known limitation): a mycelium icon with an explicit $neutral2 directly
    // under a TouchableArea.
    const markup = staticProviders(
      <TouchableArea>
        <ArrowLeft color="$neutral2" size="$icon.24" />
      </TouchableArea>,
    )
    expect(svgStyle(markup)).toContain('color:var(--neutral2)')
  })

  it('hovering the wrapper re-renders the icon with the hovered twin without throwing — the #38813 crash stays fixed', () => {
    // The hover leg has to mount (component-local hover state), where jsdom
    // hides the injected `var()` — so this case pins what a mount CAN pin:
    // the swapped-in $neutral2Hovered / $neutral1Hovered tokens resolve
    // through createIcon without the render throw #38813 fixed, on both the
    // explicit-color and the defaulted path, across the full hover cycle.
    const { container } = render(
      <>
        <TouchableArea testID="explicit">
          <ArrowLeft color="$neutral2" size="$icon.24" />
        </TouchableArea>
        <TouchableArea testID="defaulted">
          <ArrowLeft size="$icon.24" />
        </TouchableArea>
      </>,
    )
    const frames = container.querySelectorAll('[role="button"]')
    expect(frames.length).toBe(2)

    for (const frame of frames) {
      // React synthesizes mouseenter/mouseleave from mouseover/mouseout.
      fireEvent.mouseOver(frame)
      fireEvent.mouseOut(frame)
    }
    // Both icons survived the hover round-trip.
    expect(container.querySelectorAll('svg').length).toBe(2)
  })
})

describe('mycelium icons inside the Button icon prop (the icon-slot injection path)', () => {
  it('takes the Button-injected themed color, resolved (the Passkey precedent, batch 2)', () => {
    // Exactly IncreaseLiquidityCta's Verify Identity shape. Asserted through
    // renderToStaticMarkup (with the theme providers the resolution needs) because jsdom's
    // CSSOM drops a `var()` from a mounted element's serialized style.
    const markup = renderToStaticMarkup(
      <Provider store={store}>
        <ColorSchemeProvider>
          <Button
            size="large"
            variant="default"
            emphasis="primary"
            icon={<ExternalLink size="$icon.20" />}
            iconPosition="after"
          >
            Verify identity
          </Button>
        </ColorSchemeProvider>
      </Provider>,
    )
    const style = svgStyle(markup)

    // `currentColor` on the glyph, so the wrapper's colour beats any baked `defaultFill`.
    expect(style).toContain('color:currentColor')
    expect(markup).toMatch(/<span[^>]*class="[^"]*text-surface1[^"]*"/)
    // The injected width/height beat the icon's own `size` per axis, but must still be real px.
    expect(style).toMatch(/width:[\d.]+px/)
    expect(style).toMatch(/height:[\d.]+px/)
    // The base-gap class, same as REPRESENTATIVE_CASES: no `$`-token literal
    // may reach the DOM anywhere in the button's markup.
    expect(markup).not.toMatch(/[="':]\$[a-zA-Z]/)
  })
})
