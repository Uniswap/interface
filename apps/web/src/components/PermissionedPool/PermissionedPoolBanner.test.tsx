vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.tokenSymbol) {
        return `${key}:${opts.tokenSymbol}`
      }
      return key
    },
  }),
}))

// The info bottom sheet wraps a portal-based Modal; mock it as a pass-through that
// renders children when open so JSDOM can find them.
vi.mock('uniswap/src/features/permissionedTokens/PermissionedTokenInfoBottomSheet', () => ({
  PermissionedTokenInfoBottomSheet: ({ isOpen, tokenSymbol }: { isOpen: boolean; tokenSymbol: string }) =>
    isOpen ? <div data-testid="info-sheet">{tokenSymbol}</div> : null,
}))

import { fireEvent, render, screen } from '@testing-library/react'
import { TestID } from '@universe/test'
import { PermissionedPoolBanner } from '~/components/PermissionedPool/PermissionedPoolBanner'

describe('PermissionedPoolBanner', () => {
  it('renders the banner with heading and description', () => {
    render(<PermissionedPoolBanner tokenSymbol="SLINK" />)

    expect(screen.getByTestId(TestID.PermissionedPoolBanner)).toBeInTheDocument()
    expect(screen.getByText('permissionedPool.banner.heading:SLINK')).toBeInTheDocument()
    expect(screen.getByText('permissionedPool.banner.description')).toBeInTheDocument()
  })

  it('opens the info bottom sheet on press', () => {
    render(<PermissionedPoolBanner tokenSymbol="SLINK" />)

    expect(screen.queryByTestId('info-sheet')).toBeNull()

    fireEvent.click(screen.getByText('permissionedPool.banner.heading:SLINK'))

    expect(screen.getByTestId('info-sheet')).toBeInTheDocument()
    expect(screen.getByTestId('info-sheet').textContent).toBe('SLINK')
  })
})
