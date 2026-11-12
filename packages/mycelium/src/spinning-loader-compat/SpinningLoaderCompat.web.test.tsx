import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { runAxe } from '../testing/axe'
import { SpinningLoaderCompat } from './SpinningLoaderCompat.web'

afterEach(() => {
  cleanup()
})

describe('SpinningLoaderCompat semantics', () => {
  it.each([false, true])('is a labelled status (unstyled: %s)', async (unstyled) => {
    const { container } = render(<SpinningLoaderCompat label="Loading" unstyled={unstyled} />)
    expect(screen.getByRole('status', { name: 'Loading' })).toBeTruthy()
    expect(await runAxe(container)).toHaveNoAxeViolations()
  })

  it('is not a status when disabled', () => {
    render(<SpinningLoaderCompat disabled label="Loading" />)
    expect(screen.queryByRole('status')).toBeNull()
  })
})
