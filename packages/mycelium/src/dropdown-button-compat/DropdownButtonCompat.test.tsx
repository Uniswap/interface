import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DROPDOWN_EXPANDED_ICON_CLASSES,
  DROPDOWN_FRAME_EXPANDED_CLASSES,
  DROPDOWN_TEXT_EXPANDED_CLASSES,
} from '../button-frame-compat/compile'
import { DropdownButtonCompat } from './DropdownButtonCompat'

const LABEL = 'A dropdown label far wider than the frame that contains it'
const ELLIPSIS = ['max-w-full', 'overflow-hidden', 'text-ellipsis', 'whitespace-nowrap']

afterEach(cleanup)

function classesOf(element: Element | null | undefined): string[] {
  return Array.from(element?.classList ?? [])
}

function labelSpans(container: HTMLElement): HTMLSpanElement[] {
  return Array.from(container.querySelectorAll('span')).filter((span) => span.textContent === LABEL)
}

describe('DropdownButtonCompat', () => {
  it('themes a string label once, with the single-line ellipsis', () => {
    const { container } = render(<DropdownButtonCompat isExpanded={false}>{LABEL}</DropdownButtonCompat>)
    const [label, ...rest] = labelSpans(container)
    expect(rest).toEqual([])
    expect(classesOf(label)).toEqual(expect.arrayContaining(ELLIPSIS))
  })

  it('renders an explicit DropdownButton.Text once, without re-wrapping it in a second label', () => {
    const { container } = render(
      <DropdownButtonCompat isExpanded={false}>
        <DropdownButtonCompat.Text color="$neutral2">{LABEL}</DropdownButtonCompat.Text>
      </DropdownButtonCompat>,
    )
    expect(labelSpans(container)).toHaveLength(1)
  })

  it('applies the expanded frame, label and icon classes only while expanded', () => {
    const expandedFrame = DROPDOWN_FRAME_EXPANDED_CLASSES.secondary.split(' ')
    const expandedText = DROPDOWN_TEXT_EXPANDED_CLASSES.split(' ')
    const expandedIcon = DROPDOWN_EXPANDED_ICON_CLASSES.split(' ')

    const collapsed = render(<DropdownButtonCompat isExpanded={false}>{LABEL}</DropdownButtonCompat>)
    expect(classesOf(collapsed.getByRole('button'))).not.toEqual(expect.arrayContaining(expandedFrame))
    expect(classesOf(labelSpans(collapsed.container)[0])).not.toEqual(expect.arrayContaining(expandedText))
    cleanup()

    const expanded = render(<DropdownButtonCompat isExpanded>{LABEL}</DropdownButtonCompat>)
    expect(classesOf(expanded.getByRole('button'))).toEqual(expect.arrayContaining(expandedFrame))
    expect(classesOf(labelSpans(expanded.container)[0])).toEqual(expect.arrayContaining(expandedText))
    const chevronSlot = expanded.getByRole('button').querySelector('svg')?.closest('span')
    expect(classesOf(chevronSlot)).toEqual(expect.arrayContaining(expandedIcon))
  })

  it('groups icon and label in one row for elementPositioning="grouped"', () => {
    const icon = <svg data-testid="leading-icon" />
    const grouped = render(
      <DropdownButtonCompat isExpanded={false} elementPositioning="grouped" icon={icon}>
        {LABEL}
      </DropdownButtonCompat>,
    )
    const row = grouped.getByTestId('leading-icon').closest('[class*="flex-row"]')
    expect(row?.textContent).toBe(LABEL)
  })

  it('fires onPress', () => {
    const onPress = vi.fn()
    const { getByRole } = render(
      <DropdownButtonCompat isExpanded={false} onPress={onPress}>
        {LABEL}
      </DropdownButtonCompat>,
    )
    fireEvent.click(getByRole('button'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
