import { fireEvent, screen } from '@testing-library/react'
import { PermissionedTokenWarningCard } from 'uniswap/src/features/permissionedTokens/PermissionedTokenWarningCard'
import { renderWithTheme } from 'uniswap/src/test/renderWithTheme'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => (opts?.['tokenSymbol'] ? `${key}:${opts['tokenSymbol']}` : key),
  }),
}))

vi.mock(
  'uniswap/src/features/permissionedTokens/PermissionedTokenInfoBottomSheet',
  async () => await import('uniswap/src/features/permissionedTokens/__mocks__/permissionedTokenInfoBottomSheetMock'),
)

describe('PermissionedTokenWarningCard', () => {
  it('renders the heading with the token symbol and the description', () => {
    renderWithTheme(<PermissionedTokenWarningCard tokenSymbol="TPT2" />)

    expect(screen.getByText('permissionedPool.banner.heading:TPT2')).toBeTruthy()
    expect(screen.getByText('permissionedPool.banner.description')).toBeTruthy()
  })

  it('still renders structure when the token symbol is empty', () => {
    renderWithTheme(<PermissionedTokenWarningCard tokenSymbol="" />)

    expect(screen.getByText('permissionedPool.banner.heading')).toBeTruthy()
    expect(screen.getByText('permissionedPool.banner.description')).toBeTruthy()
  })

  it('opens the info bottom sheet on press', () => {
    renderWithTheme(<PermissionedTokenWarningCard tokenSymbol="TPT2" />)

    expect(screen.queryByTestId('info-sheet')).toBeNull()

    fireEvent.click(screen.getByText('permissionedPool.banner.heading:TPT2'))

    expect(screen.getByTestId('info-sheet')).toBeTruthy()
    expect(screen.getByTestId('info-sheet').textContent).toBe('TPT2')
  })
})
