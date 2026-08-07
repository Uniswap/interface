import { render, screen } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { TamaguiProvider } from 'ui/src'
import config from 'ui/src/tamagui.config'
import { PermissionedPill } from '~/pages/TokenDetails/components/info/TokenDescriptionPills'

function ThemeWrapper({ children }: PropsWithChildren): JSX.Element {
  return (
    <TamaguiProvider config={config} defaultTheme="light">
      {children}
    </TamaguiProvider>
  )
}

const renderWithTheme = (ui: React.ReactElement): ReturnType<typeof render> => render(ui, { wrapper: ThemeWrapper })

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => (opts?.['issuer'] ? `${key}:${opts['issuer']}` : key),
  }),
}))

// PermissionedTokenTooltip wraps the trigger in Tooltip; flatten it to a div with
// data-attributes so we can assert the trigger renders and the tooltip body content
// without dealing with floating-ui portals in JSDOM.
vi.mock('uniswap/src/features/permissionedTokens/PermissionedTokenTooltip', () => ({
  PermissionedTokenTooltip: ({
    baseText,
    verifiedSuffix,
    trigger,
  }: {
    baseText: string
    verifiedSuffix?: string
    trigger?: React.ReactNode
  }) => (
    <div data-testid="permissioned-tooltip" data-base-text={baseText} data-verified-suffix={verifiedSuffix ?? ''}>
      {trigger}
    </div>
  ),
}))

describe('PermissionedPill', () => {
  it('renders the Permissioned label inside the tooltip trigger', () => {
    renderWithTheme(<PermissionedPill issuer={undefined} />)

    expect(screen.getByText('permissionedPool.tdp.permissioned')).toBeTruthy()
    expect(screen.getByTestId('permissioned-tooltip')).toBeTruthy()
  })

  it('passes only base text to the tooltip when issuer is undefined', () => {
    renderWithTheme(<PermissionedPill issuer={undefined} />)

    const tooltip = screen.getByTestId('permissioned-tooltip')
    expect(tooltip.getAttribute('data-base-text')).toBe('permissionedPool.tooltip.lockIcon')
    expect(tooltip.getAttribute('data-verified-suffix')).toBe('')
  })

  it('passes the verified-suffix with issuer label when issuer is provided', () => {
    renderWithTheme(<PermissionedPill issuer="Superstate" />)

    const tooltip = screen.getByTestId('permissioned-tooltip')
    expect(tooltip.getAttribute('data-base-text')).toBe('permissionedPool.tooltip.lockIcon')
    expect(tooltip.getAttribute('data-verified-suffix')).toBe(
      'permissionedPool.tooltip.lockIcon.verifiedSuffix:Superstate',
    )
  })
})
