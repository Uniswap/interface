import { act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { getOverrideAdapter } from '@universe/gating'
import { TestID } from '@universe/test'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { setClipboard } from 'utilities/src/clipboard/clipboard'
import { sleep } from 'utilities/src/time/timing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FeatureFlagModal } from '~/components/FeatureFlagModal/FeatureFlagModal'
import { DevFlagsBox } from '~/dev/DevFlagsBox'
import store from '~/state'
import { setCloseModal } from '~/state/application/reducer'
import { render, screen } from '~/test-utils/render'

vi.mock('utilities/src/clipboard/clipboard', () => ({ setClipboard: vi.fn(() => Promise.resolve()) }))

async function renderExpanded() {
  render(
    <>
      <button type="button">Outside</button>
      <DevFlagsBox />
      <FeatureFlagModal />
    </>,
  )
  await userEvent.click(screen.getByTestId(TestID.DevFlagsBox))
  expect(screen.getByText('Dev Tools')).toBeInTheDocument()
}

describe('DevFlagsBox', () => {
  beforeEach(() => {
    store.dispatch(setCloseModal())
    window.history.replaceState(null, '', '/swap?chain=base')
    vi.spyOn(getOverrideAdapter(), 'refreshStatsig').mockImplementation(() => undefined)
  })

  afterEach(() => {
    getOverrideAdapter().removeAllOverrides()
  })

  it('stays collapsed until the box is pressed', () => {
    render(<DevFlagsBox />)

    expect(screen.queryByText('Dev Tools')).not.toBeInTheDocument()
    expect(screen.queryByTestId(TestID.DevFlagsClose)).not.toBeInTheDocument()
  })

  it('opens the feature flags modal from the Feature flags button and keeps the panel open', async () => {
    await renderExpanded()

    await userEvent.click(screen.getByRole('button', { name: 'Feature flags' }))

    expect(store.getState().application.openModal?.name).toBe(ModalName.FeatureFlags)
    expect(screen.getByText('Dev Tools')).toBeInTheDocument()
  })

  it('closes the feature flags modal when the Feature flags button is pressed again', async () => {
    await renderExpanded()
    const featureFlagsButton = screen.getByRole('button', { name: 'Feature flags' })

    await userEvent.click(featureFlagsButton)
    expect(store.getState().application.openModal?.name).toBe(ModalName.FeatureFlags)
    await userEvent.click(featureFlagsButton)

    expect(store.getState().application.openModal).toBeNull()
  })

  it('collapses the panel from the close button without opening the feature flags modal', async () => {
    await renderExpanded()

    await userEvent.click(screen.getByRole('button', { name: 'Close dev tools' }))

    expect(screen.queryByText('Dev Tools')).not.toBeInTheDocument()
    expect(screen.queryByTestId(TestID.DevFlagsClose)).not.toBeInTheDocument()
    expect(store.getState().application.openModal).toBeNull()
  })

  it('collapses the panel when the user clicks outside it', async () => {
    await renderExpanded()

    await userEvent.click(screen.getByRole('button', { name: 'Outside' }))

    expect(screen.queryByText('Dev Tools')).not.toBeInTheDocument()
  })

  it('stays expanded when the user clicks inside the panel', async () => {
    await renderExpanded()

    await userEvent.click(screen.getByText('Dev Tools'))
    await userEvent.click(screen.getByTestId(TestID.DevFlagsBox))

    expect(screen.getByText('Dev Tools')).toBeInTheDocument()
  })

  it('stays expanded while the user interacts with the open feature flags modal', async () => {
    await renderExpanded()
    await userEvent.click(screen.getByRole('button', { name: 'Feature flags' }))

    await userEvent.click(screen.getByPlaceholderText('Search flags...'))
    // The modal marks the rest of the page aria-hidden and overlays it, so press the outside node directly.
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Outside', hidden: true }))

    expect(store.getState().application.openModal?.name).toBe(ModalName.FeatureFlags)
    expect(screen.getByText('Dev Tools')).toBeInTheDocument()
  })

  it('copies the current URL with every active gate override', async () => {
    getOverrideAdapter().overrideGate('gate_a', true)
    getOverrideAdapter().overrideGate('gate_b', true)
    getOverrideAdapter().overrideGate('gate_off', false)
    await renderExpanded()

    await userEvent.click(screen.getByRole('button', { name: 'Copy URL' }))

    expect(vi.mocked(setClipboard).mock.calls.at(-1)?.[0]).toBe(
      `${window.location.origin}/swap?chain=base&featureFlagOverride=gate_a,gate_b&featureFlagOverrideOff=gate_off`,
    )
    expect(screen.getByText('Dev Tools')).toBeInTheDocument()
  })

  it('shows the copied confirmation and then resets it', async () => {
    await renderExpanded()

    await userEvent.click(screen.getByRole('button', { name: 'Copy URL' }))

    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Copy URL' }, { timeout: 2000 })).toBeInTheDocument()
  })

  it('explains the copy button in a tooltip after a hover delay', async () => {
    await renderExpanded()

    await userEvent.hover(screen.getByRole('button', { name: 'Copy URL' }))
    await act(() => sleep(350))

    expect(screen.queryByText('Copy current URL with all active feature flags')).not.toBeInTheDocument()
    expect(await screen.findByText('Copy current URL with all active feature flags')).toBeInTheDocument()
  })
})
