// Pins the single-line-ellipsis default `ButtonTextCompat` supplies on web; the shared
// button text cell itself emits only `whitespace-nowrap`.
import { render, type RenderResult } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

// expo-blur arrives transitively and its native view manager is unavailable under jsdom.
vi.mock('expo-blur', () => ({
  BlurView: () => null,
}))

import { Flex } from '@universe/mycelium'
import { Button } from 'ui/src/components/buttons/Button/Button'
import { DropdownButton } from 'ui/src/components/buttons/DropdownButton/DropdownButton'
import { SharedUIUniswapProvider } from 'ui/src/test/render'

const LABEL = 'A button label far wider than the frame that contains it'

/** What `numberOfLines: 1` expanded to on web, minus the one class the compat cell already emits. */
const CLIPPING_CLASSES = ['max-w-full', 'overflow-hidden', 'text-ellipsis'] as const

// The leaf span: the frame is wrapped in a `display: contents` span whose textContent matches too.
function labelClassList(rendered: RenderResult): string[] {
  const label = Array.from(rendered.container.querySelectorAll('span')).find(
    (span) => span.childElementCount === 0 && span.textContent === LABEL,
  )
  if (!label) {
    throw new Error(`no leaf label element rendered for ${JSON.stringify(LABEL)}`)
  }
  return Array.from(label.classList)
}

// `2` when `Button.tsx`'s children routing has re-wrapped a label in another label.
function labelSpanCount(rendered: RenderResult): number {
  return Array.from(rendered.container.querySelectorAll('span')).filter(
    (span) => span.textContent === LABEL && span.classList.contains('whitespace-nowrap'),
  ).length
}

function missingClippingClasses(classes: string[]): string[] {
  return CLIPPING_CLASSES.filter((cls) => !classes.includes(cls))
}

describe('button label keeps legacy numberOfLines: 1 truncation', () => {
  it('Button renders its string label with the clipping and ellipsis classes', () => {
    const rendered = render(
      <SharedUIUniswapProvider>
        <Button>{LABEL}</Button>
      </SharedUIUniswapProvider>,
    )

    const classes = labelClassList(rendered)

    expect(missingClippingClasses(classes)).toEqual([])
    expect(classes).toContain('whitespace-nowrap')
  })

  it('DropdownButton renders its string label with the clipping and ellipsis classes', () => {
    const rendered = render(
      <SharedUIUniswapProvider>
        <DropdownButton isExpanded={false}>{LABEL}</DropdownButton>
      </SharedUIUniswapProvider>,
    )

    const classes = labelClassList(rendered)

    expect(missingClippingClasses(classes)).toEqual([])
    expect(classes).toContain('whitespace-nowrap')
  })

  it('Button.Text used directly carries the clipping and ellipsis classes', () => {
    const rendered = render(
      <SharedUIUniswapProvider>
        <Button p={0}>
          <Button.Text>{LABEL}</Button.Text>
        </Button>
      </SharedUIUniswapProvider>,
    )

    const classes = labelClassList(rendered)

    expect(missingClippingClasses(classes)).toEqual([])
    expect(classes).toContain('whitespace-nowrap')
  })

  // A SOLE `Button.Text` child gets re-wrapped in a second `ButtonTextCompat`, because
  // `useIsStringOrTransTag` treats any lone non-`Flex` element as a Trans-ish label; the
  // `Flex` is what routes children down the un-re-wrapped branch.
  it('Button.Text nested in a Flex reaches the wrapper once and still carries the clipping classes', () => {
    const rendered = render(
      <SharedUIUniswapProvider>
        <Button p={0} overflow="hidden">
          <Flex row width="100%" height="100%" alignItems="center" justifyContent="center">
            <Button.Text>{LABEL}</Button.Text>
          </Flex>
        </Button>
      </SharedUIUniswapProvider>,
    )

    const classes = labelClassList(rendered)

    expect(missingClippingClasses(classes)).toEqual([])
    expect(classes).toContain('whitespace-nowrap')
    // Shape guard: without this the case would silently decay into the re-wrapped one above.
    expect(labelSpanCount(rendered)).toBe(1)
  })

  it('lets a caller override the default with a multi-line clamp', () => {
    const rendered = render(
      <SharedUIUniswapProvider>
        <Button p={0}>
          <Button.Text numberOfLines={2}>{LABEL}</Button.Text>
        </Button>
      </SharedUIUniswapProvider>,
    )

    const classes = labelClassList(rendered)

    expect(classes).toContain('[-webkit-line-clamp:2]')
    expect(classes).not.toContain('text-ellipsis')
  })

  it('drops every clamp class for numberOfLines={0} without clamping the label to zero lines', () => {
    const rendered = render(
      <SharedUIUniswapProvider>
        <Button p={0}>
          <Button.Text numberOfLines={0}>{LABEL}</Button.Text>
        </Button>
      </SharedUIUniswapProvider>,
    )

    const classes = labelClassList(rendered)

    // No clamp at ALL, not `[-webkit-line-clamp:0]`, which would collapse the label away.
    expect(classes.filter((cls) => cls.startsWith('[-webkit-line-clamp:'))).toEqual([])
    expect(CLIPPING_CLASSES.filter((cls) => classes.includes(cls))).toEqual([])
    // `0` un-clamps but does not let the label wrap: the cell's nowrap is unconditional.
    expect(classes).toContain('whitespace-nowrap')
  })
})
