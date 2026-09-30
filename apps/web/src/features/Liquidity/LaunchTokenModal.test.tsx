import { fireEvent } from '@testing-library/react'
import { TestID } from '@universe/test'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LaunchTokenModal } from '~/features/Liquidity/LaunchTokenModal'
import { render, screen } from '~/test-utils/render'

const mockNavigate = vi.fn()
vi.mock('react-router', async () => ({
  ...(await vi.importActual('react-router')),
  useNavigate: () => mockNavigate,
}))

const mockOpenUri = vi.fn().mockResolvedValue(undefined)
vi.mock('uniswap/src/utils/linking', async () => ({
  ...(await vi.importActual('uniswap/src/utils/linking')),
  openUri: (args: unknown) => mockOpenUri(args),
}))

describe('LaunchTokenModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders both launch options', () => {
    render(<LaunchTokenModal isOpen onClose={vi.fn()} />)
    expect(screen.getByText('Launch a token')).toBeTruthy()
    expect(screen.getByText('Custom Launch')).toBeTruthy()
    expect(screen.getAllByText('Pools.trade').length).toBeGreaterThan(0)
  })

  it('navigates to the auction flow via Continue with the default (Custom) selection', () => {
    const onClose = vi.fn()
    render(<LaunchTokenModal isOpen onClose={onClose} />)

    fireEvent.click(screen.getByTestId(TestID.LaunchTokenModalContinue))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith('/liquidity/launch-auction')
    expect(mockOpenUri).not.toHaveBeenCalled()
  })

  it('only selects (does not navigate or open) when a card body is clicked', () => {
    render(<LaunchTokenModal isOpen onClose={vi.fn()} />)

    fireEvent.click(screen.getByTestId(TestID.LaunchTokenModalCustomOption))
    fireEvent.click(screen.getByTestId(TestID.LaunchTokenModalPoolsOption))

    expect(mockNavigate).not.toHaveBeenCalled()
    expect(mockOpenUri).not.toHaveBeenCalled()
  })

  it('opens pools.xyz via Continue once the Pools card is selected', () => {
    const onClose = vi.fn()
    render(<LaunchTokenModal isOpen onClose={onClose} />)

    fireEvent.click(screen.getByTestId(TestID.LaunchTokenModalPoolsOption))
    fireEvent.click(screen.getByTestId(TestID.LaunchTokenModalContinue))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(mockOpenUri).toHaveBeenCalledWith({ uri: 'https://pools.xyz', openExternalBrowser: true })
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('opens pools.xyz directly when the Pools card title link is clicked', () => {
    const onClose = vi.fn()
    render(<LaunchTokenModal isOpen onClose={onClose} />)

    fireEvent.click(screen.getByTestId(TestID.LaunchTokenModalPoolsLink))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(mockOpenUri).toHaveBeenCalledWith({ uri: 'https://pools.xyz', openExternalBrowser: true })
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
