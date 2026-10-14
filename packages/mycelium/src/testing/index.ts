export { MyceliumThemeTestWrapper, type MyceliumThemeTestWrapperProps } from './MyceliumThemeTestWrapper'

/**
 * Non-virtualized stand-in for `UniversalList`, for consumers testing under jsdom. The real engine
 * measures a zero-height viewport there and renders no rows, so assertions about row content fail
 * even though header/footer/empty slots render. Swap it in with:
 *
 *     vi.mock('@universe/mycelium', async (importOriginal) => ({
 *       ...(await importOriginal<typeof import('@universe/mycelium')>()),
 *       UniversalList: (await import('@universe/mycelium/testing')).UniversalListTestDouble,
 *     }))
 *
 * It renders header → every row (or the empty slot) → footer, so it exercises slot wiring and
 * `keyExtractor` but deliberately not virtualization; cover that on a real device or browser.
 */
export { MockVirtualList as UniversalListTestDouble } from '../components/UniversalList/internal/MockVirtualList'
