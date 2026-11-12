import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { runAxe } from '../testing/axe'
import { LoaderCompat } from './LoaderCompat'

afterEach(() => {
  cleanup()
})

describe('LoaderCompat skeletons', () => {
  it.each(Object.entries(LoaderCompat))('hides the %s skeleton from assistive tech', async (_name, Loader) => {
    const { container } = render(<Loader />)
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true')
    expect(await runAxe(container)).toHaveNoAxeViolations()
  })
})
