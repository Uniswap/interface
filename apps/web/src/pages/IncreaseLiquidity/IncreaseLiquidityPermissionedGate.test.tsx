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

// PermissionedPoolBanner waits on ui/src (Tamagui TouchableArea) and requires a theme provider;
// mock it so the gate renders provider-free. The gate's contract here is only whether it mounts.
vi.mock('~/components/PermissionedPool/PermissionedPoolBanner', async () => {
  const { TestID } = await import('@universe/test')
  return {
    PermissionedPoolBanner: ({ tokenSymbol }: { tokenSymbol: string }) => (
      <div data-testid={TestID.PermissionedPoolBanner}>{tokenSymbol}</div>
    ),
  }
})

// The gate must drive the sheet from local controlled state, never the global modal slot:
// this form renders inside the AddLiquidity modal, and dispatching another modal name into
// the single-slot registry unmounts the whole subtree. Throwing here pins that contract.
vi.mock('~/hooks/useModalState', () => ({
  useModalState: () => {
    throw new Error('IncreaseLiquidityPermissionedGate must not use the global modal slot')
  },
}))

import { render, screen } from '@testing-library/react'
import { TestID } from '@universe/test'
import { IncreaseLiquidityPermissionedGate } from '~/pages/IncreaseLiquidity/IncreaseLiquidityPermissionedGate'

const baseProps = {
  tokenSymbol: 'PTOK2',
  permissionedConfig: { registrationUrl: 'https://app.superstate.com', issuer: 'Superstate' },
  onCloseVerifyIdentity: vi.fn(),
}

describe('IncreaseLiquidityPermissionedGate', () => {
  it('renders nothing when the wallet is allowlisted', () => {
    render(<IncreaseLiquidityPermissionedGate {...baseProps} showVerifyIdentity={false} isVerifyIdentityOpen={false} />)

    expect(screen.queryByTestId(TestID.PermissionedPoolBanner)).toBeNull()
    expect(screen.queryByTestId('verify-identity-sheet')).toBeNull()
  })

  it('renders the permissioned banner when gated, sheet closed', () => {
    render(<IncreaseLiquidityPermissionedGate {...baseProps} showVerifyIdentity={true} isVerifyIdentityOpen={false} />)

    expect(screen.getByTestId(TestID.PermissionedPoolBanner)).toBeInTheDocument()
    expect(screen.queryByTestId('verify-identity-sheet')).toBeNull()
  })

  it('shows the Verify Identity sheet from the controlled isOpen prop', () => {
    render(<IncreaseLiquidityPermissionedGate {...baseProps} showVerifyIdentity={true} isVerifyIdentityOpen={true} />)

    expect(screen.getByTestId('verify-identity-sheet')).toHaveTextContent('PTOK2')
  })
})
