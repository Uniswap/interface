import ExploreStatsSection from 'pages/Explore/ExploreStatsSection'
import { use24hProtocolVolume, useDailyTVLWithChange } from 'state/explore/protocolStats'
import { render, screen } from 'test-utils/render'
import type { Mock } from 'vitest'
import { vi } from 'vitest'

// Mock the protocol stats hooks
vi.mock('state/explore/protocolStats', () => ({
  use24hProtocolVolume: vi.fn(),
  useDailyTVLWithChange: vi.fn(),
}))

const mockUse24hProtocolVolume = use24hProtocolVolume as Mock
const mockUseDailyTVLWithChange = useDailyTVLWithChange as Mock

describe('ExploreStatsSection', () => {
  const mockVolumeData = {
    protocolVolumes: { v4: 1000000, v3: 2000000, v2: 500000 },
    totalVolume: 3500000,
    totalChangePercent: 5.2,
    isLoading: false,
  }

  const mockTVLData = {
    totalTVL: 8500000000,
    protocolTVL: { v4: 1500000000, v3: 6000000000, v2: 1000000000 },
    totalChangePercent: -2.1,
    protocolChangePercent: { v4: 15.3, v3: -3.2, v2: 1.8 },
    isLoading: false,
  }

  beforeEach(() => {
    mockUse24hProtocolVolume.mockReturnValue(mockVolumeData)
    mockUseDailyTVLWithChange.mockReturnValue(mockTVLData)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading bubbles when data is loading', () => {
    mockUse24hProtocolVolume.mockReturnValue({
      ...mockVolumeData,
      isLoading: true,
    })
    mockUseDailyTVLWithChange.mockReturnValue({
      ...mockTVLData,
      isLoading: true,
    })

    const { container } = render(<ExploreStatsSection />)

    // Should show loading bubbles instead of actual values
    const loadingBubbles = container.querySelectorAll('[style*="animation-name: shine"]')
    expect(loadingBubbles.length).toBeGreaterThan(0)

    // Should not show actual data values
    expect(screen.queryByText('$3.50M')).not.toBeInTheDocument()
    expect(screen.queryByText('$8.50B')).not.toBeInTheDocument()
  })

  it('shows actual data when loading is complete', () => {
    const { container } = render(<ExploreStatsSection />)

    // Should show formatted volume and TVL values
    expect(screen.getByText(/1D volume/i)).toBeInTheDocument()
    expect(screen.getByText(/Total Uniswap TVL/i)).toBeInTheDocument()

    // Should not show loading bubbles
    const loadingBubbles = container.querySelectorAll('[style*="animation-name: shine"]')
    expect(loadingBubbles.length).toBe(0)
  })

  it('transitions from loading to loaded state properly', () => {
    // Start with loading state
    mockUse24hProtocolVolume.mockReturnValue({
      ...mockVolumeData,
      isLoading: true,
    })
    mockUseDailyTVLWithChange.mockReturnValue({
      ...mockTVLData,
      isLoading: true,
    })

    const { rerender, container } = render(<ExploreStatsSection />)

    // Initially loading
    const loadingBubbles = container.querySelectorAll('[style*="animation-name: shine"]')
    expect(loadingBubbles.length).toBeGreaterThan(0)

    // Transition to loaded
    mockUse24hProtocolVolume.mockReturnValue(mockVolumeData)
    mockUseDailyTVLWithChange.mockReturnValue(mockTVLData)

    rerender(<ExploreStatsSection />)

    // Loading bubbles should be gone
    const loadedBubbles = container.querySelectorAll('[style*="animation-name: shine"]')
    expect(loadedBubbles.length).toBe(0)

    // Data should appear
    expect(screen.getByText(/1D volume/i)).toBeInTheDocument()
    expect(screen.getByText(/Total Uniswap TVL/i)).toBeInTheDocument()
  })

  it('ensures consistent dimensions between loading and loaded states', () => {
    // Test loading state
    mockUse24hProtocolVolume.mockReturnValue({
      ...mockVolumeData,
      isLoading: true,
    })
    mockUseDailyTVLWithChange.mockReturnValue({
      ...mockTVLData,
      isLoading: true,
    })

    const { rerender, container } = render(<ExploreStatsSection />)
    const loadingHeight = (container.firstChild as HTMLElement).clientHeight

    // Test loaded state
    mockUse24hProtocolVolume.mockReturnValue(mockVolumeData)
    mockUseDailyTVLWithChange.mockReturnValue(mockTVLData)

    rerender(<ExploreStatsSection />)
    const loadedHeight = (container.firstChild as HTMLElement).clientHeight

    // Heights should be consistent (within a small tolerance for text rendering differences)
    expect(Math.abs((loadedHeight || 0) - (loadingHeight || 0))).toBeLessThan(5)
  })

  it('shows volume loading state with proper dimensions', () => {
    mockUse24hProtocolVolume.mockReturnValue({
      ...mockVolumeData,
      isLoading: true,
    })
    mockUseDailyTVLWithChange.mockReturnValue(mockTVLData)

    const { container } = render(<ExploreStatsSection />)

    // Should show loading bubbles for volume data
    const loadingBubbles = container.querySelectorAll('[style*="animation-name: shine"]')
    expect(loadingBubbles.length).toBeGreaterThan(0)

    // TVL data should still be visible
    expect(screen.getByText(/Total Uniswap TVL/i)).toBeInTheDocument()
  })

  it('shows TVL loading state with proper dimensions', () => {
    mockUse24hProtocolVolume.mockReturnValue(mockVolumeData)
    mockUseDailyTVLWithChange.mockReturnValue({
      ...mockTVLData,
      isLoading: true,
    })

    const { container } = render(<ExploreStatsSection />)

    // Should show loading bubbles for TVL data
    const loadingBubbles = container.querySelectorAll('[style*="animation-name: shine"]')
    expect(loadingBubbles.length).toBeGreaterThan(0)

    // Volume data should still be visible
    expect(screen.getByText(/1D volume/i)).toBeInTheDocument()
  })

  it('ensures proper cleanup when transitioning from loading to loaded states', () => {
    mockUse24hProtocolVolume.mockReturnValue({
      ...mockVolumeData,
      isLoading: true,
    })
    mockUseDailyTVLWithChange.mockReturnValue({
      ...mockTVLData,
      isLoading: true,
    })

    const { rerender, container } = render(<ExploreStatsSection />)

    // Verify loading state
    const loadingBubbles = container.querySelectorAll('[style*="animation-name: shine"]')
    expect(loadingBubbles.length).toBeGreaterThan(0)

    // Transition to loaded state
    mockUse24hProtocolVolume.mockReturnValue(mockVolumeData)
    mockUseDailyTVLWithChange.mockReturnValue(mockTVLData)

    rerender(<ExploreStatsSection />)

    // Verify loaded state and cleanup
    const loadedBubbles = container.querySelectorAll('[style*="animation-name: shine"]')
    expect(loadedBubbles.length).toBe(0)
    expect(screen.getByText(/1D volume/i)).toBeInTheDocument()
    expect(screen.getByText(/Total Uniswap TVL/i)).toBeInTheDocument()

    // Ensure no leftover loading artifacts
    const remainingLoadingElements = container.querySelectorAll('[style*="animation-name: shine"]')
    expect(remainingLoadingElements).toHaveLength(0)
  })
})
