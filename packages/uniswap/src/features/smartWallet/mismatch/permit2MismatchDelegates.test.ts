import { isPermit2MismatchDelegate } from 'uniswap/src/features/smartWallet/mismatch/permit2MismatchDelegates'

const mockGetDynamicConfigValue = vi.fn()

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  getDynamicConfigValue: (input: { defaultValue: string[] }): string[] => mockGetDynamicConfigValue(input),
}))

// Alchemy SemiModularAccount7702 (MAv2), used by Robinhood Wallet
const ALCHEMY_MAV2_DELEGATE = '0x69007702764179f14f51cdce752f4f775d74e139'
// MetaMask's EIP7702StatelessDeleGator
const OTHER_DELEGATE = '0x63c0c19a282a1b52b07dd5a65b58948a07dae32b'

describe('isPermit2MismatchDelegate', () => {
  beforeEach(() => {
    mockGetDynamicConfigValue.mockImplementation(({ defaultValue }: { defaultValue: string[] }) => defaultValue)
  })

  it('matches nothing with the empty default (config not populated)', () => {
    expect(isPermit2MismatchDelegate(ALCHEMY_MAV2_DELEGATE)).toBe(false)
    expect(isPermit2MismatchDelegate(OTHER_DELEGATE)).toBe(false)
    expect(isPermit2MismatchDelegate('')).toBe(false)
  })

  it('matches only delegates from the dynamic config', () => {
    mockGetDynamicConfigValue.mockReturnValue([ALCHEMY_MAV2_DELEGATE])
    expect(isPermit2MismatchDelegate(ALCHEMY_MAV2_DELEGATE)).toBe(true)
    expect(isPermit2MismatchDelegate(OTHER_DELEGATE)).toBe(false)
    expect(isPermit2MismatchDelegate('')).toBe(false)
  })

  it('matches case-insensitively', () => {
    mockGetDynamicConfigValue.mockReturnValue([ALCHEMY_MAV2_DELEGATE])
    expect(isPermit2MismatchDelegate(ALCHEMY_MAV2_DELEGATE.toUpperCase().replace('0X', '0x'))).toBe(true)
  })
})
