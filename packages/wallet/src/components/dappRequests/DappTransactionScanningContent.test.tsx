import type { BlockaidScanTransactionResponse } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import type { EthTransaction } from 'uniswap/src/types/walletConnect'
import type { Mock } from 'vitest'
import { DappTransactionScanningContent } from 'wallet/src/components/dappRequests/DappTransactionScanningContent'
import {
  TransactionApprovalAction,
  TransactionErrorType,
  TransactionRiskLevel,
  TransactionSectionType,
} from 'wallet/src/features/dappRequests/types'
import { render } from 'wallet/src/test/test-utils'

// Capture how the Blockaid scan hook is invoked so we can assert an unverifiable target is never scanned.
const scanCalls: Array<{ request: unknown }> = []
const previewProps: { current: Record<string, unknown> | undefined } = { current: undefined }
const footerProps: { current: Record<string, unknown> | undefined } = { current: undefined }
let mockHasScanFailed = false
let mockIsScanFailurePermanent = false
let mockIsLoading = false
let mockScanResult: BlockaidScanTransactionResponse | null = null
vi.mock('wallet/src/features/dappRequests/hooks/useBlockaidTransactionScan', () => ({
  useBlockaidTransactionScan: (request: unknown) => {
    scanCalls.push({ request })
    return {
      scanResult: mockScanResult,
      isLoading: mockIsLoading,
      hasScanFailed: mockHasScanFailed || request === null,
      isScanFailurePermanent: mockIsScanFailurePermanent,
    }
  },
}))

// The preview card / footer pull in gas + provider machinery we don't need to exercise here.
vi.mock('wallet/src/components/dappRequests/TransactionPreviewCard', () => ({
  TransactionPreviewCard: (props: Record<string, unknown>) => {
    previewProps.current = props
    return null
  },
}))
vi.mock('wallet/src/components/dappRequests/DappRequestFooter', () => ({
  DappRequestFooter: (props: Record<string, unknown>) => {
    footerProps.current = props
    return null
  },
}))
vi.mock('wallet/src/features/dappRequests/hooks/useEarnAwareSections', () => ({
  useEarnAwareSections: ({ sections }: { sections: unknown[] }) => sections,
}))

// Drive the parsed Blockaid verdict so we can exercise a genuine malicious result — the one case that
// should get the destructive confirm-button styling. Defaults to None; set per-test.
const parsed = vi.hoisted(() => ({ riskLevel: undefined as unknown }))
vi.mock('wallet/src/features/dappRequests/utils/blockaidUtils', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  const realParse = actual['parseTransactionSections'] as (...args: unknown[]) => Record<string, unknown>
  return {
    ...actual,
    // Delegate to the real parser so scan-result-driven section tests work — spread its full result so
    // any field it gains later is preserved rather than silently dropped — while still letting a test pin
    // `parsed.riskLevel` to force a verdict (e.g. the destructive-styling path) without a full scan result.
    parseTransactionSections: (...args: unknown[]) => {
      const real = realParse(...args)
      return { ...real, riskLevel: parsed.riskLevel ?? real['riskLevel'] }
    },
  }
})

const ACCOUNT = '0x1234567890123456789012345678901234567890'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const SPENDER = '0x2222222222222222222222222222222222222222'
const APPROVE_CALLDATA = `0x095ea7b3${SPENDER.slice(2).padStart(64, '0')}${BigInt(500_000_000)
  .toString(16)
  .padStart(64, '0')}`

function renderContent(
  to: string | undefined,
  from = ACCOUNT,
  transactionOverrides: Partial<EthTransaction> = {},
): { onRiskLevelChange: Mock; onCriticalRiskChange: Mock } {
  const onRiskLevelChange = vi.fn()
  const onCriticalRiskChange = vi.fn()
  const transaction: EthTransaction = { from, to, value: '0x0', data: '0x', ...transactionOverrides }
  render(
    <DappTransactionScanningContent
      transaction={transaction}
      chainId={UniverseChainId.Mainnet}
      account={ACCOUNT}
      dappUrl="https://dapp.example"
      confirmedRisk={false}
      onConfirmRisk={vi.fn()}
      onRiskLevelChange={onRiskLevelChange}
      onCriticalRiskChange={onCriticalRiskChange}
    />,
  )
  return { onRiskLevelChange, onCriticalRiskChange }
}

describe('DappTransactionScanningContent unverifiable recipient', () => {
  beforeEach(() => {
    scanCalls.length = 0
    previewProps.current = undefined
    footerProps.current = undefined
    mockHasScanFailed = false
    mockIsScanFailurePermanent = false
    mockIsLoading = false
    parsed.riskLevel = undefined
    mockScanResult = null
  })

  // ethers resolves an ENS `to` at signing time, so a non-address target lets the scanned target
  // diverge from the signed one and Blockaid fails open. The scan must be skipped and the request
  // hard-blocked as critical instead (finding #755).
  it('hard-blocks an ENS `to` as critical without scanning it', () => {
    const { onRiskLevelChange } = renderContent('usdc.eth')

    expect(onRiskLevelChange).toHaveBeenLastCalledWith(null)
    // A bogus target is never sent to Blockaid.
    expect(scanCalls.every((call) => call.request === null)).toBe(true)
    expect(previewProps.current).toMatchObject({
      riskLevel: TransactionRiskLevel.Critical,
      errorType: TransactionErrorType.UnverifiedRecipient,
    })
    expect(footerProps.current).toMatchObject({ riskLevel: TransactionRiskLevel.None })
    expect(footerProps.current?.['onConfirmRisk']).toBeUndefined()
  })

  it('hard-blocks an empty `to` without scanning it', () => {
    const { onRiskLevelChange } = renderContent('')

    expect(onRiskLevelChange).toHaveBeenLastCalledWith(null)
    expect(scanCalls.every((call) => call.request === null)).toBe(true)
    expect(footerProps.current).toMatchObject({ riskLevel: TransactionRiskLevel.None })
    expect(footerProps.current?.['onConfirmRisk']).toBeUndefined()
  })

  it('scans a concrete address target as usual', () => {
    const { onRiskLevelChange, onCriticalRiskChange } = renderContent(USDC)

    // Benign (null) scan result → no critical block, and the address is actually scanned.
    expect(onRiskLevelChange).toHaveBeenLastCalledWith(TransactionRiskLevel.None)
    expect(scanCalls.some((call) => call.request !== null)).toBe(true)
    // A benign (None) result is not a malicious verdict, so the confirm button gets no destructive styling.
    expect(onCriticalRiskChange).toHaveBeenLastCalledWith(false)
  })

  it('applies destructive styling only for a genuine malicious verdict', () => {
    parsed.riskLevel = TransactionRiskLevel.Critical

    const { onRiskLevelChange, onCriticalRiskChange } = renderContent(USDC)

    // A real Blockaid malicious verdict (Critical with no scan failure) is the only case that publishes
    // the destructive-styling signal.
    expect(onRiskLevelChange).toHaveBeenLastCalledWith(TransactionRiskLevel.Critical)
    expect(onCriticalRiskChange).toHaveBeenLastCalledWith(true)
  })

  it('passes a plain ERC20 approval from the scan parser into the preview', () => {
    mockScanResult = {
      block: '12345',
      chain: 'ethereum',
      validation: {
        status: 'Success',
        classification: 'benign',
        description: 'Safe transaction',
        features: [],
        reason: '',
        result_type: 'benign',
      },
      simulation: {
        status: 'Success',
        assets_diffs: {},
        transaction_actions: [],
        total_usd_diff: {},
        exposures: {},
        total_usd_exposure: {},
        address_details: {},
        account_summary: {
          assets_diffs: [],
          traces: [],
          exposures: [
            {
              asset: {
                type: 'ERC20',
                symbol: 'USDC',
                name: 'USD Coin',
                address: USDC,
                decimals: 6,
              },
              spenders: {
                [SPENDER]: {
                  approval: '0x1dcd6500',
                  exposure: [{ value: '250', usd_price: '250' }],
                },
              },
            },
          ],
          total_usd_exposure: {},
        },
      },
    }

    renderContent(USDC, ACCOUNT, { data: APPROVE_CALLDATA })

    expect(previewProps.current).toMatchObject({
      riskLevel: TransactionRiskLevel.None,
      sections: [
        {
          type: TransactionSectionType.Approving,
          assets: [
            {
              type: 'ERC20',
              symbol: 'USDC',
              name: 'USD Coin',
              amount: '500',
              address: USDC,
              chainId: UniverseChainId.Mainnet,
              spenderAddress: SPENDER,
              approvalAction: TransactionApprovalAction.Grant,
            },
          ],
        },
      ],
    })
  })

  it('scans with the connected account instead of a dapp-supplied sender', () => {
    renderContent(USDC, '0x0000000000000000000000000000000000000001')

    expect(scanCalls).toContainEqual({
      request: expect.objectContaining({
        account_address: ACCOUNT,
        data: expect.objectContaining({ from: ACCOUNT }),
      }),
    })
  })

  it('scans an accepted no-prefix address using the same checksummed recipient ethers will use', () => {
    const noPrefixAddress = USDC.slice(2)

    renderContent(noPrefixAddress)

    expect(scanCalls).toContainEqual({
      request: expect.objectContaining({
        data: expect.objectContaining({ to: USDC }),
      }),
    })
  })

  it('surfaces an informational caution (no gate) when the security scan fails transiently', () => {
    mockHasScanFailed = true

    const { onRiskLevelChange, onCriticalRiskChange } = renderContent(USDC)

    // A transient failure is an un-aimable blip: it publishes no gating verdict (None, not Critical),
    // so confirmation stays enabled and the banner shows the caution without a checkbox. It's not a
    // malicious verdict, so the parent keeps the standard (non-destructive) button.
    expect(onRiskLevelChange).toHaveBeenLastCalledWith(TransactionRiskLevel.None)
    expect(footerProps.current).toMatchObject({
      riskLevel: TransactionRiskLevel.None,
      scanFailureError: TransactionErrorType.ScanFailed,
    })
    expect(onCriticalRiskChange).toHaveBeenLastCalledWith(false)
  })

  it('surfaces a permanently unscannable request as an acknowledgeable caution, not a hard block', () => {
    mockHasScanFailed = true
    mockIsScanFailurePermanent = true

    const { onRiskLevelChange, onCriticalRiskChange } = renderContent(USDC)

    // A permanent failure (oversized payload, unsupported chain/method) can never be retried into a
    // usable scan, but it is still surfaced as an acknowledgeable caution — the footer raises the
    // severity via the ScanUnavailable error while keeping the acknowledgement path open.
    expect(onRiskLevelChange).toHaveBeenLastCalledWith(TransactionRiskLevel.Critical)
    expect(footerProps.current).toMatchObject({
      riskLevel: TransactionRiskLevel.Critical,
      scanFailureError: TransactionErrorType.ScanUnavailable,
    })
    expect(footerProps.current?.['onConfirmRisk']).toBeDefined()
    // Even the high-severity permanent caution is not a malicious verdict — no destructive button.
    expect(onCriticalRiskChange).toHaveBeenLastCalledWith(false)
  })

  it('fails closed when the transaction cannot be represented for scanning', () => {
    const { onRiskLevelChange } = renderContent(USDC, ACCOUNT, { value: '-1' })

    expect(scanCalls).toContainEqual({ request: null })
    expect(onRiskLevelChange).toHaveBeenLastCalledWith(null)
    expect(footerProps.current).toMatchObject({ riskLevel: TransactionRiskLevel.None })
    expect(footerProps.current?.['onConfirmRisk']).toBeUndefined()
  })

  it('keeps confirmation blocked until the security scan completes', () => {
    mockIsLoading = true

    const { onRiskLevelChange } = renderContent(USDC)

    expect(onRiskLevelChange).toHaveBeenLastCalledWith(null)
    expect(footerProps.current).toBeUndefined()
  })

  // A 0x-prefixed, 42-char value that isn't valid hex (so ethers won't sign it as-is) must still be
  // hard-blocked — a length/prefix-only check would wave it through.
  it('hard-blocks a well-shaped but non-hex `to`', () => {
    const { onRiskLevelChange } = renderContent(`0x${'z'.repeat(40)}`)

    expect(onRiskLevelChange).toHaveBeenLastCalledWith(null)
    expect(scanCalls.every((call) => call.request === null)).toBe(true)
    expect(footerProps.current?.['onConfirmRisk']).toBeUndefined()
  })

  // Contract creation has no recipient; it must not be treated as unverifiable.
  it('scans a contract-creation tx (no `to`) without blocking', () => {
    const { onRiskLevelChange } = renderContent(undefined)

    expect(onRiskLevelChange).toHaveBeenLastCalledWith(TransactionRiskLevel.None)
    expect(scanCalls.some((call) => call.request !== null)).toBe(true)
  })

  // A user who acknowledges a permanent scan-failure caution must not carry that acknowledgement over to
  // a real malicious verdict if a later refetch produces one (a failed required simulation can succeed on
  // a newer block). The acknowledgement is reset when the shown banner changes identity.
  it('resets the acknowledgement when a scan-failure caution becomes a real verdict', () => {
    const onConfirmRisk = vi.fn()
    const props = {
      transaction: { from: ACCOUNT, to: USDC, value: '0x0', data: '0x' } as EthTransaction,
      chainId: UniverseChainId.Mainnet,
      account: ACCOUNT,
      dappUrl: 'https://dapp.example',
      confirmedRisk: true,
      onConfirmRisk,
      onRiskLevelChange: vi.fn(),
      onCriticalRiskChange: vi.fn(),
    }

    // Phase 1: a permanent scan-failure caution the user has acknowledged.
    mockHasScanFailed = true
    mockIsScanFailurePermanent = true
    const { rerender } = render(<DappTransactionScanningContent {...props} />)
    onConfirmRisk.mockClear()

    // Phase 2: a later refetch resolves to a genuine malicious verdict; the scan-failure caution is gone.
    mockHasScanFailed = false
    mockIsScanFailurePermanent = false
    parsed.riskLevel = TransactionRiskLevel.Critical
    rerender(<DappTransactionScanningContent {...props} />)

    // The banner's identity changed (ScanUnavailable caution → malicious verdict), so the stale
    // acknowledgement is cleared and the malicious verdict cannot render pre-confirmed.
    expect(onConfirmRisk).toHaveBeenCalledWith(false)
  })
})
