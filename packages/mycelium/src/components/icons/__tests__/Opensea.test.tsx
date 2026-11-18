// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Opensea } from '../Opensea'

describe('Opensea', () => {
  // Closed mobile-web sheets stay mounted with visibility:hidden, so a document-scoped id shared
  // between copies resolves to a hidden one and blanks the visible icon.
  it('renders its glyph without document-scoped id references', () => {
    const { container } = render(
      <>
        <Opensea size={16} />
        <Opensea size={16} />
      </>,
    )

    const svgs = container.querySelectorAll('svg')
    expect(svgs).toHaveLength(2)
    for (const svg of svgs) {
      expect(svg.querySelectorAll('path')).toHaveLength(2)
      expect(svg.querySelector('[id]')).toBeNull()
      expect(svg.querySelector('[clip-path], [mask], [filter]')).toBeNull()
    }
  })
})
