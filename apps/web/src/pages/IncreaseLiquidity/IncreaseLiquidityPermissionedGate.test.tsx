vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => (opts?.tokenSymbol ? `${key}:${opts.tokenSymbol}` : key),
  }),
}))

// Portal-based shared components; render pass-throughs so JSDOM can assert on them.
vi.mock('uniswap/src/features/permissionedTokens/PermissionedTokenInfoBottomSheet', () => ({
  PermissionedTokenInfoBottomSheet: () => null,
}))

vi.mock('uniswap/src/features/permissionedTokens/VerifyIdentityBottomSheet', () => ({
  VerifyIdentityBottomSheetView: ({ isOpen, tokenSymbol }: { isOpen: boolean; tokenSymbol: string }) =>
    isOpen ? <div data-testid="verify-identity-sheet">{tokenSymbol}</div> : null,
}))

// The gate must drive the sheet from local controlled state, never the global modal slot:
// this form renders inside the AddLiquidity modal, and dispatching another modal name into
// the single-slot registry unmounts the whole subtree. Throwing here pins that contract.
vi.mock('~/hooks/useModalState', () => ({
  useModalState: () => {
    throw new Error('IncreaseLiquidityPermissionedGate must not use the global modal slot')
  },
}))

import { render, screen } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { TamaguiProvider } from 'ui/src'
import config from 'ui/src/tamagui.config'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { IncreaseLiquidityPermissionedGate } from '~/pages/IncreaseLiquidity/IncreaseLiquidityPermissionedGate'

function ThemeWrapper({ children }: PropsWithChildren) {
  return (
    <TamaguiProvider config={config} defaultTheme="light">
      {children}
    </TamaguiProvider>
  )
}

const baseProps = {
  tokenSymbol: 'PTOK2',
  permissionedConfig: { registrationUrl: 'https://app.superstate.com', issuer: 'Superstate' },
  onCloseVerifyIdentity: vi.fn(),
}

describe('IncreaseLiquidityPermissionedGate', () => {
  it('renders nothing when the wallet is allowlisted', () => {
    render(
      <IncreaseLiquidityPermissionedGate {...baseProps} showVerifyIdentity={false} isVerifyIdentityOpen={false} />,
      { wrapper: ThemeWrapper },
    )

    expect(screen.queryByTestId(TestID.PermissionedPoolBanner)).toBeNull()
    expect(screen.queryByTestId('verify-identity-sheet')).toBeNull()
  })

  it('renders the permissioned banner when gated, sheet closed', () => {
    render(
      <IncreaseLiquidityPermissionedGate {...baseProps} showVerifyIdentity={true} isVerifyIdentityOpen={false} />,
      {
        wrapper: ThemeWrapper,
      },
    )

    expect(screen.getByTestId(TestID.PermissionedPoolBanner)).toBeInTheDocument()
    expect(screen.queryByTestId('verify-identity-sheet')).toBeNull()
  })

  it('shows the Verify Identity sheet from the controlled isOpen prop', () => {
    render(<IncreaseLiquidityPermissionedGate {...baseProps} showVerifyIdentity={true} isVerifyIdentityOpen={true} />, {
      wrapper: ThemeWrapper,
    })

    expect(screen.getByTestId('verify-identity-sheet')).toHaveTextContent('PTOK2')
  })
})
