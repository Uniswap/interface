import { render, screen } from '@testing-library/react'
import React from 'react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => (opts?.['tokenSymbol'] ? `${key}:${opts['tokenSymbol']}` : key),
  }),
}))

// Capture the props handed to DappRequestContent: the hard-block contract is that no
// confirmText is ever passed (no approve button can render).
const mockDappRequestContent = vi.fn(
  ({ children, title }: { children: React.ReactNode; title: string; confirmText?: string }) => (
    <div data-testid="dapp-request-content" data-title={title}>
      {children}
    </div>
  ),
)
vi.mock('src/app/features/dappRequests/DappRequestContent', () => ({
  DappRequestContent: (props: { children: React.ReactNode; title: string; confirmText?: string }) =>
    mockDappRequestContent(props),
}))

vi.mock('ui/src', () => ({
  Button: ({ children, onPress, testID }: { children: React.ReactNode; onPress: () => void; testID?: string }) => (
    <button data-testid={testID} onClick={onPress}>
      {children}
    </button>
  ),
  Flex: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Text: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
}))

vi.mock('ui/src/components/icons/Lock', () => ({
  Lock: () => <div data-testid="lock-icon" />,
}))

const mockOpenUri = vi.fn().mockResolvedValue(undefined)
vi.mock('uniswap/src/utils/linking', () => ({
  openUri: (args: unknown) => mockOpenUri(args),
}))

import { PermissionedSwapBlockedContent } from 'src/app/features/dappRequests/requestContent/EthSend/Swap/PermissionedSwapBlockedContent'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const KYC_URL = 'https://app.superstate.com'

describe('PermissionedSwapBlockedContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the refusal copy and never pass a confirmText (no approve button)', () => {
    render(<PermissionedSwapBlockedContent blockedSymbol="PTOK2" kycUrl={KYC_URL} />)

    expect(screen.getByText('permissionedPool.dappRequest.notAllowlisted:PTOK2')).toBeTruthy()
    // Key-absence check: the confirm button renders iff confirmText is set, so the prop
    // must not exist at all (a present-but-undefined key would also pass toBeUndefined).
    const passedProps = mockDappRequestContent.mock.calls[0]?.[0] as Record<string, unknown>
    expect(Object.prototype.hasOwnProperty.call(passedProps, 'confirmText')).toBe(false)
    expect(Object.prototype.hasOwnProperty.call(passedProps, 'onConfirm')).toBe(false)
  })

  it('should open the KYC url in an external tab when Verify identity is pressed', () => {
    render(<PermissionedSwapBlockedContent blockedSymbol="PTOK2" kycUrl={KYC_URL} />)

    screen.getByTestId(TestID.VerifyIdentityButton).click()

    expect(mockOpenUri).toHaveBeenCalledWith(
      expect.objectContaining({ uri: KYC_URL, openExternalBrowser: true, isSafeUri: true }),
    )
  })

  it('should hide the Verify identity CTA when no kycUrl is available', () => {
    render(<PermissionedSwapBlockedContent blockedSymbol="PTOK2" kycUrl={undefined} />)

    expect(screen.queryByTestId(TestID.VerifyIdentityButton)).toBeNull()
  })

  it('should not open a non-https kycUrl even if pressed (self-contained https guard)', () => {
    // A non-https value (here plain http) should never reach openUri with isSafeUri:true, regardless
    // of upstream sanitization. The CTA may still render (kycUrl is truthy), but the press is a no-op.
    render(<PermissionedSwapBlockedContent blockedSymbol="PTOK2" kycUrl="http://app.superstate.com" />)

    screen.getByTestId(TestID.VerifyIdentityButton).click()

    expect(mockOpenUri).not.toHaveBeenCalled()
  })
})
