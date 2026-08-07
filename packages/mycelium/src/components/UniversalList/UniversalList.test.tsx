import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Text } from '../text'
import type { UniversalListRenderItemInfo } from './types'
import { UniversalList } from './UniversalList'

// Avoid resolving the real logger package in tests.
vi.mock('@universe/logger', () => ({
  createConsoleLogger: () => ({ error: () => undefined }),
}))

// The real @universe/environment loads app config at import; stub the one function used.
vi.mock('@universe/environment', () => ({
  isProdEnv: () => true,
}))

// The platform VirtualList wraps Legend List, which needs real layout/ResizeObserver and can't
// render under jsdom. Swap it for MockVirtualList — a non-virtualized rendering with the same
// contract (the .web variant resolves here). Async factory avoids vi.mock hoisting issues.
vi.mock('./internal/VirtualList', async () => ({
  VirtualList: (await import('./internal/MockVirtualList')).MockVirtualList,
}))

afterEach(cleanup)

const keyExtractor = (item: string): string => item
const renderItem = ({ item }: UniversalListRenderItemInfo<string>): JSX.Element => <Text>{item}</Text>

describe('UniversalList', () => {
  it('renders ListEmptyComponent when data is empty', () => {
    render(
      <UniversalList
        data={[]}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={<Text>empty state</Text>}
      />,
    )

    expect(screen.getByText('empty state')).toBeTruthy()
    expect(screen.queryByText('Alpha')).toBeNull()
  })

  it('renders items when data is present', () => {
    render(<UniversalList data={['Alpha', 'Bravo']} keyExtractor={keyExtractor} renderItem={renderItem} />)

    expect(screen.getByText('Alpha')).toBeTruthy()
    expect(screen.getByText('Bravo')).toBeTruthy()
  })

  it('does not render the empty component when data is present', () => {
    render(
      <UniversalList
        data={['Alpha']}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={<Text>empty state</Text>}
      />,
    )

    expect(screen.queryByText('empty state')).toBeNull()
    expect(screen.getByText('Alpha')).toBeTruthy()
  })

  describe('snapshots', () => {
    it('matches the snapshot when rendering items', () => {
      const { asFragment } = render(
        <UniversalList data={['Alpha', 'Bravo', 'Charlie']} keyExtractor={keyExtractor} renderItem={renderItem} />,
      )

      expect(asFragment()).toMatchSnapshot()
    })

    it('matches the snapshot for the empty state', () => {
      const { asFragment } = render(
        <UniversalList
          data={[]}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListEmptyComponent={<Text>Nothing here yet</Text>}
        />,
      )

      expect(asFragment()).toMatchSnapshot()
    })
  })
})
