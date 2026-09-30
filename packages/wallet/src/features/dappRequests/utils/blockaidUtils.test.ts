// Mock chain info to avoid importing chain data with PNG files
vi.mock('uniswap/src/features/chains/chainInfo', () => ({
  // Chain ids treated as supported by isUniverseChainId in these tests (Mainnet, Base)
  ALL_CHAIN_IDS: [1, 8453],
  getChainInfo: vi.fn((chainId: number) => ({
    nativeCurrency: {
      address: `0xNATIVE${chainId}`,
      name: 'Mock Native',
      symbol: 'MOCK',
      decimals: 18,
    },
    wrappedNativeCurrency: {
      address: `0xWRAPPED${chainId}`,
    },
  })),
}))

import { type BlockaidScanTransactionResponse } from '@universe/api/src'
import { UniverseChainId } from '@universe/chains'
import { encodeFunctionData } from 'viem'
import {
  TransactionApprovalAction,
  TransactionApprovalScope,
  TransactionRiskLevel,
  TransactionSectionType,
} from 'wallet/src/features/dappRequests/types'
import { parseApprovals, UNLIMITED_APPROVAL_AMOUNT } from 'wallet/src/features/dappRequests/utils/blockaidApprovalUtils'
import { roundToDecimals } from 'wallet/src/features/dappRequests/utils/blockaidAssetUtils'
import {
  extractContractName,
  extractFunctionName,
  getRiskLevelFromClassification,
  getRiskLevelFromValidation,
  parseReceivingAssets,
  parseSendingAssets,
  parseTransactionSections,
} from 'wallet/src/features/dappRequests/utils/blockaidUtils'

const TEST_CHAIN_ID = UniverseChainId.Mainnet
const NFT_ADDRESS = '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d'
const SPENDER_ADDRESS = '0xa77ac4e2a77ac4e2a77ac4e2a77ac4e2a77ac4e2'
const OTHER_SPENDER_ADDRESS = '0xb88bc4e2b88bc4e2b88bc4e2b88bc4e2b88bc4e2'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const NFT_APPROVAL_ABI = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'setApprovalForAll',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    outputs: [],
  },
] as const

describe('blockaidUtils', () => {
  describe('roundToDecimals', () => {
    it('should round to 6 decimal places', () => {
      expect(roundToDecimals('123.123456789')).toBe('123.123457')
    })

    it('should handle exact zero', () => {
      expect(roundToDecimals(0)).toBe('0')
      expect(roundToDecimals('0')).toBe('0')
    })

    it('should preserve non-zero values that would round to zero in decimal notation', () => {
      expect(roundToDecimals('0.0000001')).toBe('0.0000001')
      expect(roundToDecimals(0.0000001)).toBe('0.0000001')
      expect(roundToDecimals('0.00000001')).toBe('0.00000001')
      expect(roundToDecimals(1e-10)).toBe('0.0000000001')
    })

    it('should pass through NaN values as original string', () => {
      expect(roundToDecimals('not a number')).toBe('not a number')
    })

    it('should remove trailing zeros', () => {
      expect(roundToDecimals('1.500000')).toBe('1.5')
      expect(roundToDecimals('2.000000')).toBe('2')
    })
  })

  describe('getRiskLevelFromClassification', () => {
    it('should return None for undefined classification', () => {
      expect(getRiskLevelFromClassification(undefined)).toBe(TransactionRiskLevel.None)
    })

    it('should return None for benign classification', () => {
      expect(getRiskLevelFromClassification('benign')).toBe(TransactionRiskLevel.None)
    })

    it('should return Critical for malicious classification', () => {
      expect(getRiskLevelFromClassification('malicious')).toBe(TransactionRiskLevel.Critical)
      expect(getRiskLevelFromClassification('Malicious')).toBe(TransactionRiskLevel.Critical)
      expect(getRiskLevelFromClassification('MALICIOUS')).toBe(TransactionRiskLevel.Critical)
    })

    it('should return Critical for attack classification', () => {
      expect(getRiskLevelFromClassification('attack')).toBe(TransactionRiskLevel.Critical)
      expect(getRiskLevelFromClassification('phishing_attack')).toBe(TransactionRiskLevel.Critical)
    })

    it('should return Warning for warning classification', () => {
      expect(getRiskLevelFromClassification('warning')).toBe(TransactionRiskLevel.Warning)
      expect(getRiskLevelFromClassification('Warning')).toBe(TransactionRiskLevel.Warning)
    })

    it('should return Warning for suspicious classification', () => {
      expect(getRiskLevelFromClassification('suspicious')).toBe(TransactionRiskLevel.Warning)
      expect(getRiskLevelFromClassification('Suspicious Activity')).toBe(TransactionRiskLevel.Warning)
    })
  })

  describe('getRiskLevelFromValidation', () => {
    it('should return None for undefined validation', () => {
      expect(getRiskLevelFromValidation(undefined)).toBe(TransactionRiskLevel.None)
    })

    it('should map result_type Malicious to Critical (case-insensitive)', () => {
      // Live API returns PascalCase; existing fixtures use lowercase. Both must resolve to Critical.
      expect(
        getRiskLevelFromValidation({
          status: 'Success',
          result_type: 'Malicious',
          classification: 'untrusted_address',
          description: '',
          reason: '',
          features: [],
        }),
      ).toBe(TransactionRiskLevel.Critical)
      expect(
        getRiskLevelFromValidation({
          status: 'Success',
          result_type: 'malicious',
          classification: '',
          description: '',
          reason: '',
          features: [],
        }),
      ).toBe(TransactionRiskLevel.Critical)
    })

    it('should map result_type Warning to Warning', () => {
      expect(
        getRiskLevelFromValidation({
          status: 'Success',
          result_type: 'Warning',
          classification: 'approval_farming',
          description: '',
          reason: '',
          features: [],
        }),
      ).toBe(TransactionRiskLevel.Warning)
    })

    it('should map result_type Benign to None', () => {
      expect(
        getRiskLevelFromValidation({
          status: 'Success',
          result_type: 'Benign',
          classification: 'benign',
          description: '',
          reason: '',
          features: [],
        }),
      ).toBe(TransactionRiskLevel.None)
    })

    it('should map result_type Spam to None', () => {
      expect(
        getRiskLevelFromValidation({
          status: 'Success',
          result_type: 'Spam',
          classification: 'spam',
          description: '',
          reason: '',
          features: [],
        }),
      ).toBe(TransactionRiskLevel.None)
    })

    it('REGRESSION (INFRA-2251): result_type Malicious with a classification lacking any legacy substring still maps to Critical', () => {
      expect(
        getRiskLevelFromValidation({
          status: 'Success',
          result_type: 'Malicious',
          classification: 'untrusted_address',
          description: 'The transaction is assessed as high risk for token loss',
          reason: 'high_risk_approval',
          features: [
            { type: 'Malicious', feature_id: 'HIGH_RISK_SPENDER', description: 'This address is a high-risk spender' },
          ],
        }),
      ).toBe(TransactionRiskLevel.Critical)
    })

    it('should elevate to Critical from a Malicious feature even when result_type is benign', () => {
      expect(
        getRiskLevelFromValidation({
          status: 'Success',
          result_type: 'Benign',
          classification: 'benign',
          description: '',
          reason: '',
          features: [{ type: 'Malicious', feature_id: 'HIGH_RISK_SPENDER', description: '' }],
        }),
      ).toBe(TransactionRiskLevel.Critical)
    })

    it('should elevate to Warning from a Warning feature when result_type is benign', () => {
      expect(
        getRiskLevelFromValidation({
          status: 'Success',
          result_type: 'Benign',
          classification: 'benign',
          description: '',
          reason: '',
          features: [{ type: 'Warning', feature_id: 'UNVERIFIED_CONTRACT', description: '' }],
        }),
      ).toBe(TransactionRiskLevel.Warning)
    })

    it('should let a Malicious feature override a Spam result_type', () => {
      expect(
        getRiskLevelFromValidation({
          status: 'Success',
          result_type: 'Spam',
          classification: 'spam',
          description: '',
          reason: '',
          features: [{ type: 'Malicious', feature_id: 'HIGH_RISK_SPENDER', description: '' }],
        }),
      ).toBe(TransactionRiskLevel.Critical)
    })

    it('should fall back to the classification substring when result_type is unrecognized', () => {
      expect(
        getRiskLevelFromValidation({
          status: 'Success',
          result_type: 'unknown_future_value',
          classification: 'phishing_attack',
          description: '',
          reason: '',
          features: [],
        }),
      ).toBe(TransactionRiskLevel.Critical)
    })

    it('should derive risk from result_type even on the Error validation arm', () => {
      expect(
        getRiskLevelFromValidation({
          status: 'Error',
          result_type: 'Malicious',
          classification: 'untrusted_address',
          description: '',
          reason: '',
          features: [],
          error: 'simulation failed',
        }),
      ).toBe(TransactionRiskLevel.Critical)
    })

    it('should not over-warn on the real benign response shape (Benign result_type, empty classification, Benign/Info features)', () => {
      expect(
        getRiskLevelFromValidation({
          status: 'Success',
          result_type: 'Benign',
          classification: '',
          description: '',
          reason: '',
          features: [
            { type: 'Benign', feature_id: 'TRUSTED_ADDRESS', description: 'A trusted address, safe to interact with' },
            { type: 'Info', feature_id: 'EMITS_APPROVALS', description: 'The transaction approves assets' },
          ],
        }),
      ).toBe(TransactionRiskLevel.None)
    })
  })

  describe('parseSendingAssets', () => {
    it('should return null when no assets are being sent', () => {
      const assetsDiffs = [
        {
          asset: {
            type: 'ERC20',
            symbol: 'USDC',
            address: '0xusdc',
            chain_id: 1,
          },
          out: [],
          in: [{ value: '100' }],
        },
      ] as any

      const result = parseSendingAssets(assetsDiffs, TEST_CHAIN_ID)

      expect(result).toBeNull()
    })

    it('should parse ERC20 sending assets correctly', () => {
      const assetsDiffs = [
        {
          asset: {
            type: 'ERC20',
            symbol: 'USDC',
            name: 'USD Coin',
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            logo_url: 'https://example.com/usdc.png',
            chain_id: 1,
          },
          out: [
            {
              value: '100.5',
              usd_price: '100.50',
            },
          ],
          in: [],
        },
      ] as any

      const result = parseSendingAssets(assetsDiffs, TEST_CHAIN_ID)

      expect(result).not.toBeNull()
      expect(result?.type).toBe(TransactionSectionType.Sending)
      expect(result?.assets).toHaveLength(1)
      expect(result?.assets[0]).toEqual({
        type: 'ERC20',
        symbol: 'USDC',
        name: 'USD Coin',
        amount: '100.5',
        usdValue: '100.50',
        logoUrl: 'https://example.com/usdc.png',
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        chainId: TEST_CHAIN_ID,
      })
    })

    it('should parse native token sending assets correctly', () => {
      const assetsDiffs = [
        {
          asset: {
            type: 'NATIVE',
            symbol: 'ETH',
            name: 'Ethereum',
            chain_id: 1,
          },
          out: [
            {
              value: '1.5',
              usd_price: '3000.00',
            },
          ],
          in: [],
        },
      ] as any

      const result = parseSendingAssets(assetsDiffs, TEST_CHAIN_ID)

      expect(result?.assets[0]?.address).toBe('0xNATIVE1')
      expect(result?.assets[0]?.symbol).toBe('ETH')
      expect(result?.assets[0]?.amount).toBe('1.5')
    })

    it('REGRESSION (INFRA-2850): should fall back to the asset address for a NATIVE asset with an unsupported chain_id', () => {
      const assetsDiffs = [
        {
          asset: {
            type: 'NATIVE',
            symbol: 'FAKE',
            name: 'Fake Chain Token',
            address: '0xfallback',
            chain_id: 999999,
          },
          out: [{ value: '1' }],
          in: [],
        },
      ] as any

      const result = parseSendingAssets(assetsDiffs, TEST_CHAIN_ID)

      expect(result?.assets[0]?.address).toBe('0xfallback')
    })

    it('REGRESSION (INFRA-2850): should fall back to an empty address for a NATIVE asset with an unsupported chain_id and no address', () => {
      const assetsDiffs = [
        {
          asset: {
            type: 'NATIVE',
            symbol: 'FAKE',
            name: 'Fake Chain Token',
            chain_id: 999999,
          },
          out: [{ value: '1' }],
          in: [],
        },
      ] as any

      const result = parseSendingAssets(assetsDiffs, TEST_CHAIN_ID)

      expect(result?.assets[0]?.address).toBe('')
    })

    it('should skip assets with no out amount', () => {
      const assetsDiffs = [
        {
          asset: {
            type: 'ERC20',
            symbol: 'USDC',
            address: '0xusdc',
            chain_id: 1,
          },
          out: [],
          in: [],
        },
      ] as any

      const result = parseSendingAssets(assetsDiffs, TEST_CHAIN_ID)

      expect(result).toBeNull()
    })

    it('should preserve very small native token amounts instead of rounding to zero', () => {
      const assetsDiffs = [
        {
          asset: {
            type: 'NATIVE',
            symbol: 'ETH',
            name: 'Ethereum',
            chain_id: 1,
          },
          out: [
            {
              value: '0.0000001',
              usd_price: '0.0000289',
            },
          ],
          in: [],
        },
      ] as any

      const result = parseSendingAssets(assetsDiffs, TEST_CHAIN_ID)
      expect(result?.assets[0]?.amount).not.toBe('0')
    })

    it('should round amounts to 6 decimal places', () => {
      const assetsDiffs = [
        {
          asset: {
            type: 'ERC20',
            symbol: 'DAI',
            address: '0xdai',
            chain_id: 1,
          },
          out: [{ value: '123.123456789' }],
          in: [],
        },
      ] as any

      const result = parseSendingAssets(assetsDiffs, TEST_CHAIN_ID)

      expect(result?.assets[0]?.amount).toBe('123.123457')
    })

    it('passes a NONERC asset through as a generic asset keyed by its contract address, without ERC-20 handling', () => {
      const assetsDiffs: Parameters<typeof parseSendingAssets>[0] = [
        {
          asset_type: 'ERC20',
          asset: { type: 'NONERC', address: '0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE' },
          out: [{ raw_value: '0x3cb71f51fc5580000' }],
          in: [],
        },
      ]

      const result = parseSendingAssets(assetsDiffs, TEST_CHAIN_ID)

      expect(result?.assets).toEqual([
        {
          type: 'NONERC',
          symbol: undefined,
          name: undefined,
          amount: undefined,
          usdValue: undefined,
          logoUrl: undefined,
          address: '0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE',
          chainId: TEST_CHAIN_ID,
        },
      ])
    })
  })

  describe('parseReceivingAssets', () => {
    it('should return null when no assets are being received', () => {
      const assetsDiffs = [
        {
          asset: {
            type: 'ERC20',
            symbol: 'USDC',
            address: '0xusdc',
            chain_id: 1,
          },
          out: [{ value: '100' }],
          in: [],
        },
      ] as any

      const result = parseReceivingAssets(assetsDiffs, TEST_CHAIN_ID)

      expect(result).toBeNull()
    })

    it('should parse ERC20 receiving assets correctly', () => {
      const assetsDiffs = [
        {
          asset: {
            type: 'ERC20',
            symbol: 'DAI',
            name: 'Dai Stablecoin',
            address: '0x6b175474e89094c44da98b954eedeac495271d0f',
            logo_url: 'https://example.com/dai.png',
            chain_id: 1,
          },
          out: [],
          in: [
            {
              value: '50.25',
              usd_price: '50.25',
            },
          ],
        },
      ] as any

      const result = parseReceivingAssets(assetsDiffs, TEST_CHAIN_ID)

      expect(result).not.toBeNull()
      expect(result?.type).toBe(TransactionSectionType.Receiving)
      expect(result?.assets).toHaveLength(1)
      expect(result?.assets[0]).toEqual({
        type: 'ERC20',
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        amount: '50.25',
        usdValue: '50.25',
        logoUrl: 'https://example.com/dai.png',
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        chainId: TEST_CHAIN_ID,
      })
    })

    it('should parse native token receiving assets correctly', () => {
      const assetsDiffs = [
        {
          asset: {
            type: 'NATIVE',
            symbol: 'ETH',
            name: 'Ethereum',
            chain_id: 1,
          },
          out: [],
          in: [
            {
              value: '2.0',
              usd_price: '4000.00',
            },
          ],
        },
      ] as any

      const result = parseReceivingAssets(assetsDiffs, TEST_CHAIN_ID)

      expect(result?.assets[0]?.address).toBe('0xNATIVE1')
      expect(result?.assets[0]?.symbol).toBe('ETH')
      expect(result?.assets[0]?.amount).toBe('2')
    })

    it('should skip assets with no in amount', () => {
      const assetsDiffs = [
        {
          asset: {
            type: 'ERC20',
            symbol: 'USDC',
            address: '0xusdc',
            chain_id: 1,
          },
          out: [],
          in: [],
        },
      ] as any

      const result = parseReceivingAssets(assetsDiffs, TEST_CHAIN_ID)

      expect(result).toBeNull()
    })
  })

  describe('parseApprovals', () => {
    it('should return null when no exposures exist', () => {
      const exposures = [] as any

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID })

      expect(result).toBeNull()
    })

    it('preserves an ERC721 token approval and derives its grant from a later batch call', () => {
      const exposures = [
        {
          asset_type: 'ERC721',
          asset: { type: 'ERC721', address: NFT_ADDRESS, name: 'Bored Ape Yacht Club', symbol: 'BAYC' },
          spenders: {
            [SPENDER_ADDRESS]: {
              exposure: [{ token_id: '8817', arbitrary_collection_token: false }],
              is_approved_for_all: false,
            },
          },
        },
      ] as any
      const calls = [
        { to: '0x1111111111111111111111111111111111111111', data: '0x' },
        {
          to: NFT_ADDRESS,
          data: encodeFunctionData({
            abi: NFT_APPROVAL_ABI,
            functionName: 'approve',
            args: [SPENDER_ADDRESS, BigInt(8817)],
          }),
        },
      ]

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID, calls })

      expect(result?.assets).toEqual([
        expect.objectContaining({
          symbol: 'BAYC',
          tokenId: '8817',
          approvalScope: TransactionApprovalScope.SingleToken,
          approvalAction: TransactionApprovalAction.Grant,
          spenderAddress: SPENDER_ADDRESS,
        }),
      ])
    })

    it.each([
      { providerTokenId: '0x2271', expectedTokenId: '8817' },
      { providerTokenId: '0008817', expectedTokenId: '8817' },
      { providerTokenId: 'not-a-token-id', expectedTokenId: 'not-a-token-id' },
    ])(
      'matches equivalent NFT token ID representations without trusting malformed IDs: $providerTokenId',
      ({ providerTokenId, expectedTokenId }) => {
        const exposures = [
          {
            asset_type: 'ERC721',
            asset: { type: 'ERC721', address: NFT_ADDRESS, name: 'Bored Ape Yacht Club', symbol: 'BAYC' },
            spenders: {
              [SPENDER_ADDRESS]: {
                exposure: [{ token_id: providerTokenId, arbitrary_collection_token: false }],
                is_approved_for_all: false,
              },
            },
          },
        ] as any
        const calls = [
          {
            to: NFT_ADDRESS,
            data: encodeFunctionData({
              abi: NFT_APPROVAL_ABI,
              functionName: 'approve',
              args: [SPENDER_ADDRESS, BigInt(8817)],
            }),
          },
        ]

        const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID, calls })

        expect(result?.assets).toEqual([
          expect.objectContaining({
            tokenId: expectedTokenId,
            approvalAction:
              providerTokenId === 'not-a-token-id' ? TransactionApprovalAction.Change : TransactionApprovalAction.Grant,
          }),
        ])
      },
    )

    it('stays neutral when a batch revokes a token the simulation still reports as exposed', () => {
      const exposures = [
        {
          asset_type: 'ERC721',
          asset: { type: 'ERC721', address: NFT_ADDRESS, name: 'Bored Ape Yacht Club', symbol: 'BAYC' },
          spenders: {
            [SPENDER_ADDRESS]: {
              exposure: [{ token_id: '8817', arbitrary_collection_token: false }],
              is_approved_for_all: false,
            },
          },
        },
      ] as any
      const calls = [
        {
          to: NFT_ADDRESS,
          data: encodeFunctionData({
            abi: NFT_APPROVAL_ABI,
            functionName: 'approve',
            args: [SPENDER_ADDRESS, BigInt(8817)],
          }),
        },
        {
          to: NFT_ADDRESS,
          data: encodeFunctionData({
            abi: NFT_APPROVAL_ABI,
            functionName: 'approve',
            args: [ZERO_ADDRESS, BigInt(8817)],
          }),
        },
      ]

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID, calls })

      // The simulation still lists token 8817 as exposed after the batch, contradicting the calldata's
      // final revoke — so the direction stays neutral rather than a reassuring revoke.
      expect(result?.assets).toEqual([
        expect.objectContaining({
          tokenId: '8817',
          approvalScope: TransactionApprovalScope.SingleToken,
          approvalAction: TransactionApprovalAction.Change,
        }),
      ])
    })

    it('stays neutral on the fallback row when an ambiguous exposure contradicts a calldata revoke', () => {
      // arbitrary_collection_token filters the entry out of the exact-token exposures, so the
      // revoke routes through the fallback row rather than the token path. The simulation still
      // reports the spender exposed, contradicting the calldata revoke — so the fallback row must
      // apply the same Revoke->Change downgrade as the token/collection rows, not render a revoke.
      const exposures = [
        {
          asset_type: 'ERC721',
          asset: { type: 'ERC721', address: NFT_ADDRESS, name: 'Bored Ape Yacht Club', symbol: 'BAYC' },
          spenders: {
            [SPENDER_ADDRESS]: {
              exposure: [{ token_id: '8817', arbitrary_collection_token: true }],
              is_approved_for_all: false,
            },
          },
        },
      ] as any
      const calls = [
        {
          to: NFT_ADDRESS,
          data: encodeFunctionData({
            abi: NFT_APPROVAL_ABI,
            functionName: 'approve',
            args: [SPENDER_ADDRESS, BigInt(8817)],
          }),
        },
        {
          to: NFT_ADDRESS,
          data: encodeFunctionData({
            abi: NFT_APPROVAL_ABI,
            functionName: 'approve',
            args: [ZERO_ADDRESS, BigInt(8817)],
          }),
        },
      ]

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID, calls })

      expect(result?.assets).toEqual([
        expect.objectContaining({
          approvalScope: TransactionApprovalScope.SingleToken,
          approvalAction: TransactionApprovalAction.Change,
        }),
      ])
    })

    it.each([
      { exposure: undefined, expectedAction: TransactionApprovalAction.Change },
      { exposure: [], expectedAction: TransactionApprovalAction.Revoke },
    ])(
      'uses explicit post-simulation exposure data to corroborate a fallback token revoke: $expectedAction',
      ({ exposure, expectedAction }) => {
        const exposures = [
          {
            asset_type: 'ERC721',
            asset: { type: 'ERC721', address: NFT_ADDRESS, name: 'Bored Ape Yacht Club', symbol: 'BAYC' },
            spenders: {
              [SPENDER_ADDRESS]: {
                ...(exposure === undefined ? {} : { exposure }),
                is_approved_for_all: false,
              },
            },
          },
        ] as any
        const calls = [
          {
            to: NFT_ADDRESS,
            data: encodeFunctionData({
              abi: NFT_APPROVAL_ABI,
              functionName: 'approve',
              args: [SPENDER_ADDRESS, BigInt(8817)],
            }),
          },
          {
            to: NFT_ADDRESS,
            data: encodeFunctionData({
              abi: NFT_APPROVAL_ABI,
              functionName: 'approve',
              args: [ZERO_ADDRESS, BigInt(8817)],
            }),
          },
        ]

        const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID, calls })

        expect(result?.assets).toEqual([
          expect.objectContaining({
            tokenId: '8817',
            approvalScope: TransactionApprovalScope.SingleToken,
            approvalAction: expectedAction,
          }),
        ])
      },
    )

    it('uses post-simulation token exposure to preserve a grant after a later opaque call', () => {
      const exposures = [
        {
          asset_type: 'ERC721',
          asset: { type: 'ERC721', address: NFT_ADDRESS, name: 'Bored Ape Yacht Club', symbol: 'BAYC' },
          spenders: {
            [SPENDER_ADDRESS]: {
              exposure: [{ token_id: '8817', arbitrary_collection_token: false }],
              is_approved_for_all: false,
            },
          },
        },
      ] as any
      const calls = [
        {
          to: NFT_ADDRESS,
          data: encodeFunctionData({
            abi: NFT_APPROVAL_ABI,
            functionName: 'approve',
            args: [SPENDER_ADDRESS, BigInt(8817)],
          }),
        },
        { to: NFT_ADDRESS, data: '0x12345678' },
      ]

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID, calls })

      expect(result?.assets).toEqual([
        expect.objectContaining({
          tokenId: '8817',
          approvalScope: TransactionApprovalScope.SingleToken,
          approvalAction: TransactionApprovalAction.Grant,
          spenderAddress: SPENDER_ADDRESS,
        }),
      ])
    })

    it('keeps an unclassified ERC721 spender exposure visible as a neutral permission change', () => {
      const exposures = [
        {
          asset_type: 'ERC721',
          asset: { type: 'ERC721', address: NFT_ADDRESS, name: 'Bored Ape Yacht Club', symbol: 'BAYC' },
          spenders: {
            [SPENDER_ADDRESS]: {
              exposure: [],
              is_approved_for_all: false,
            },
          },
        },
      ] as any

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID })

      expect(result?.assets).toEqual([
        expect.objectContaining({
          tokenId: undefined,
          approvalScope: TransactionApprovalScope.SingleToken,
          approvalAction: TransactionApprovalAction.Change,
          spenderAddress: SPENDER_ADDRESS,
        }),
      ])
    })

    it('does not assign another token intent when Blockaid omits the exposed token id', () => {
      const exposures = [
        {
          asset_type: 'ERC721',
          asset: { type: 'ERC721', address: NFT_ADDRESS, name: 'Bored Ape Yacht Club', symbol: 'BAYC' },
          spenders: {
            [SPENDER_ADDRESS]: {
              exposure: [],
              is_approved_for_all: false,
            },
          },
        },
      ] as any
      const calls = [
        {
          to: NFT_ADDRESS,
          data: encodeFunctionData({
            abi: NFT_APPROVAL_ABI,
            functionName: 'approve',
            args: [SPENDER_ADDRESS, BigInt(8817)],
          }),
        },
        {
          to: NFT_ADDRESS,
          data: encodeFunctionData({
            abi: NFT_APPROVAL_ABI,
            functionName: 'approve',
            args: [OTHER_SPENDER_ADDRESS, BigInt(42)],
          }),
        },
      ]

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID, calls })

      expect(result?.assets).toEqual([
        expect.objectContaining({
          tokenId: '8817',
          approvalScope: TransactionApprovalScope.SingleToken,
          approvalAction: TransactionApprovalAction.Grant,
          spenderAddress: SPENDER_ADDRESS,
        }),
      ])
    })

    it('keeps distinct ERC721 token approvals as distinct assets', () => {
      const exposures = [
        {
          asset_type: 'ERC721',
          asset: { type: 'ERC721', address: NFT_ADDRESS, symbol: 'BAYC' },
          spenders: {
            [SPENDER_ADDRESS]: {
              exposure: [
                { token_id: '8817', arbitrary_collection_token: false },
                { token_id: '42', arbitrary_collection_token: false },
              ],
              is_approved_for_all: false,
            },
          },
        },
      ] as any

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID })

      expect(result?.assets.map((asset) => asset.tokenId)).toEqual(['8817', '42'])
      expect(result?.assets.every((asset) => asset.approvalAction === TransactionApprovalAction.Change)).toBe(true)
    })

    it('uses an explicit simulated ERC1155 grant when calldata claims to revoke', () => {
      const exposures = [
        {
          asset_type: 'ERC1155',
          asset: { type: 'ERC1155', address: NFT_ADDRESS, name: 'Collection', symbol: 'COLL' },
          spenders: {
            [SPENDER_ADDRESS]: {
              exposure: [{ token_id: '42', value: '1', arbitrary_collection_token: false }],
              is_approved_for_all: true,
            },
          },
        },
      ] as any
      const calls = [
        {
          to: NFT_ADDRESS,
          data: encodeFunctionData({
            abi: NFT_APPROVAL_ABI,
            functionName: 'setApprovalForAll',
            args: [SPENDER_ADDRESS, false],
          }),
        },
      ]

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID, calls })

      // The full-batch simulation is authoritative: the spender remains approved for all, so surface
      // the risky grant instead of the contradictory calldata revoke.
      expect(result?.assets).toEqual([
        expect.objectContaining({
          approvalScope: TransactionApprovalScope.Collection,
          approvalAction: TransactionApprovalAction.Grant,
        }),
      ])
      expect(result?.assets[0]?.amount).toBeUndefined()
    })

    it.each([
      { approvals: [false, true], expectedAction: TransactionApprovalAction.Grant },
      { approvals: [true, false], expectedAction: TransactionApprovalAction.Revoke },
    ] as const)('uses the final collection approval in a batch: $approvals', ({ approvals, expectedAction }) => {
      const exposures = [
        {
          asset_type: 'ERC721',
          asset: { type: 'ERC721', address: NFT_ADDRESS, name: 'Bored Ape Yacht Club', symbol: 'BAYC' },
          spenders: {
            [SPENDER_ADDRESS]: {
              exposure: [],
              // The simulated approval-for-all must match the batch's final call, otherwise a [true,false]
              // batch would be a (contradictory) revoke-with-approval that collapses to the neutral label.
              is_approved_for_all: approvals[approvals.length - 1],
            },
          },
        },
      ] as any
      const calls = approvals.map((approved) => ({
        to: NFT_ADDRESS,
        data: encodeFunctionData({
          abi: NFT_APPROVAL_ABI,
          functionName: 'setApprovalForAll',
          args: [SPENDER_ADDRESS, approved],
        }),
      }))

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID, calls })

      expect(result?.assets).toEqual([
        expect.objectContaining({
          approvalScope: TransactionApprovalScope.Collection,
          approvalAction: expectedAction,
        }),
      ])
    })

    it('does not label a spender missing from the calldata as an ERC721 revoke', () => {
      // A contract that revokes at the top level while granting internally must not render the
      // internal grantee under the Revoke header.
      const exposures = [
        {
          asset_type: 'ERC721',
          asset: { type: 'ERC721', address: NFT_ADDRESS, symbol: 'BAYC' },
          spenders: {
            [OTHER_SPENDER_ADDRESS]: {
              exposure: [{ token_id: '8817', arbitrary_collection_token: false }],
              is_approved_for_all: false,
            },
          },
        },
      ] as any
      const calls = [
        {
          to: NFT_ADDRESS,
          data: encodeFunctionData({
            abi: NFT_APPROVAL_ABI,
            functionName: 'approve',
            args: [ZERO_ADDRESS, BigInt(8817)],
          }),
        },
      ]

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID, calls })

      expect(result?.assets).toEqual([
        expect.objectContaining({
          tokenId: '8817',
          approvalScope: TransactionApprovalScope.SingleToken,
          approvalAction: TransactionApprovalAction.Change,
          spenderAddress: OTHER_SPENDER_ADDRESS,
        }),
      ])
    })

    it('uses an explicit simulated grant instead of another operator’s setApprovalForAll direction', () => {
      // Approval-for-all state is per operator: a decoy revoke of operator A says nothing about
      // the operator Blockaid reports, whose explicit post-simulation state proves a grant.
      const exposures = [
        {
          asset_type: 'ERC721',
          asset: { type: 'ERC721', address: NFT_ADDRESS, symbol: 'BAYC' },
          spenders: {
            [OTHER_SPENDER_ADDRESS]: {
              exposure: [],
              is_approved_for_all: true,
            },
          },
        },
      ] as any
      const calls = [
        {
          to: NFT_ADDRESS,
          data: encodeFunctionData({
            abi: NFT_APPROVAL_ABI,
            functionName: 'setApprovalForAll',
            args: [SPENDER_ADDRESS, false],
          }),
        },
      ]

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID, calls })

      expect(result?.assets).toEqual([
        expect.objectContaining({
          approvalScope: TransactionApprovalScope.Collection,
          approvalAction: TransactionApprovalAction.Grant,
          spenderAddress: OTHER_SPENDER_ADDRESS,
        }),
      ])
    })

    it('infers missing collection scope from matching setApprovalForAll calldata', () => {
      const exposures = [
        {
          asset_type: 'ERC721',
          asset: { type: 'ERC721', address: NFT_ADDRESS, name: 'Bored Ape Yacht Club', symbol: 'BAYC' },
          spenders: {
            [SPENDER_ADDRESS]: {
              exposure: [{ arbitrary_collection_token: true }],
            },
          },
        },
      ] as any
      const calls = [
        {
          to: NFT_ADDRESS,
          data: encodeFunctionData({
            abi: NFT_APPROVAL_ABI,
            functionName: 'setApprovalForAll',
            args: [SPENDER_ADDRESS, true],
          }),
        },
      ]

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID, calls })

      expect(result?.assets).toEqual([
        expect.objectContaining({
          approvalScope: TransactionApprovalScope.Collection,
          approvalAction: TransactionApprovalAction.Grant,
          spenderAddress: SPENDER_ADDRESS,
        }),
      ])
      expect(result?.assets[0]?.tokenId).toBeUndefined()
    })

    it('preserves a token grant beside an inferred collection revoke in the same batch', () => {
      const exposures = [
        {
          asset_type: 'ERC721',
          asset: { type: 'ERC721', address: NFT_ADDRESS, name: 'Bored Ape Yacht Club', symbol: 'BAYC' },
          spenders: {
            [SPENDER_ADDRESS]: {
              exposure: [{ token_id: '8817', arbitrary_collection_token: false }],
              is_approved_for_all: false,
            },
          },
        },
      ] as any
      const calls = [
        {
          to: NFT_ADDRESS,
          data: encodeFunctionData({
            abi: NFT_APPROVAL_ABI,
            functionName: 'setApprovalForAll',
            args: [SPENDER_ADDRESS, false],
          }),
        },
        {
          to: NFT_ADDRESS,
          data: encodeFunctionData({
            abi: NFT_APPROVAL_ABI,
            functionName: 'approve',
            args: [SPENDER_ADDRESS, BigInt(8817)],
          }),
        },
      ]

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID, calls })

      expect(result?.assets).toEqual([
        expect.objectContaining({
          approvalScope: TransactionApprovalScope.Collection,
          approvalAction: TransactionApprovalAction.Revoke,
          spenderAddress: SPENDER_ADDRESS,
        }),
        expect.objectContaining({
          tokenId: '8817',
          approvalScope: TransactionApprovalScope.SingleToken,
          approvalAction: TransactionApprovalAction.Grant,
          spenderAddress: SPENDER_ADDRESS,
        }),
      ])
    })

    it('lets an explicit simulated collection grant subsume a token grant despite calldata revoke', () => {
      const exposures = [
        {
          asset_type: 'ERC721',
          asset: { type: 'ERC721', address: NFT_ADDRESS, name: 'Bored Ape Yacht Club', symbol: 'BAYC' },
          spenders: {
            [SPENDER_ADDRESS]: {
              exposure: [{ token_id: '8817', arbitrary_collection_token: false }],
              is_approved_for_all: true,
            },
          },
        },
      ] as any
      const calls = [
        {
          to: NFT_ADDRESS,
          data: encodeFunctionData({
            abi: NFT_APPROVAL_ABI,
            functionName: 'setApprovalForAll',
            args: [SPENDER_ADDRESS, false],
          }),
        },
        {
          to: NFT_ADDRESS,
          data: encodeFunctionData({
            abi: NFT_APPROVAL_ABI,
            functionName: 'approve',
            args: [SPENDER_ADDRESS, BigInt(8817)],
          }),
        },
      ]

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID, calls })

      expect(result?.assets).toEqual([
        expect.objectContaining({
          approvalScope: TransactionApprovalScope.Collection,
          approvalAction: TransactionApprovalAction.Grant,
          spenderAddress: SPENDER_ADDRESS,
        }),
      ])
    })

    it('preserves a reported token exposure beside an inferred collection revoke without a matching token call', () => {
      const exposures = [
        {
          asset_type: 'ERC721',
          asset: { type: 'ERC721', address: NFT_ADDRESS, name: 'Bored Ape Yacht Club', symbol: 'BAYC' },
          spenders: {
            [SPENDER_ADDRESS]: {
              exposure: [{ token_id: '8817', arbitrary_collection_token: false }],
              is_approved_for_all: false,
            },
          },
        },
      ] as any
      const calls = [
        {
          to: NFT_ADDRESS,
          data: encodeFunctionData({
            abi: NFT_APPROVAL_ABI,
            functionName: 'setApprovalForAll',
            args: [SPENDER_ADDRESS, false],
          }),
        },
      ]

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID, calls })

      expect(result?.assets).toEqual([
        expect.objectContaining({
          approvalScope: TransactionApprovalScope.Collection,
          approvalAction: TransactionApprovalAction.Revoke,
        }),
        expect.objectContaining({
          tokenId: '8817',
          approvalScope: TransactionApprovalScope.SingleToken,
          approvalAction: TransactionApprovalAction.Change,
        }),
      ])
    })

    it('lets an explicit simulated collection grant subsume token exposure without decoded calldata', () => {
      const exposures = [
        {
          asset_type: 'ERC721',
          asset: { type: 'ERC721', address: NFT_ADDRESS, name: 'Bored Ape Yacht Club', symbol: 'BAYC' },
          spenders: {
            [SPENDER_ADDRESS]: {
              exposure: [{ token_id: '8817', arbitrary_collection_token: false }],
              is_approved_for_all: true,
            },
          },
        },
      ] as any

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID })

      expect(result?.assets).toEqual([
        expect.objectContaining({
          approvalScope: TransactionApprovalScope.Collection,
          approvalAction: TransactionApprovalAction.Grant,
        }),
      ])
    })

    it('lets an effective collection grant subsume reported token exposures', () => {
      const exposures = [
        {
          asset_type: 'ERC721',
          asset: { type: 'ERC721', address: NFT_ADDRESS, name: 'Bored Ape Yacht Club', symbol: 'BAYC' },
          spenders: {
            [SPENDER_ADDRESS]: {
              exposure: [{ token_id: '8817', arbitrary_collection_token: false }],
              is_approved_for_all: true,
            },
          },
        },
      ] as any
      const calls = [
        {
          to: NFT_ADDRESS,
          data: encodeFunctionData({
            abi: NFT_APPROVAL_ABI,
            functionName: 'setApprovalForAll',
            args: [SPENDER_ADDRESS, true],
          }),
        },
      ]

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID, calls })

      expect(result?.assets).toEqual([
        expect.objectContaining({
          approvalScope: TransactionApprovalScope.Collection,
          approvalAction: TransactionApprovalAction.Grant,
        }),
      ])
    })

    it('keeps collection direction neutral when a later call cannot be decoded', () => {
      const exposures = [
        {
          asset_type: 'ERC721',
          asset: { type: 'ERC721', address: NFT_ADDRESS, name: 'Bored Ape Yacht Club', symbol: 'BAYC' },
          spenders: {
            [SPENDER_ADDRESS]: {
              exposure: [],
              is_approved_for_all: false,
            },
          },
        },
      ] as any
      const calls = [
        {
          to: NFT_ADDRESS,
          data: encodeFunctionData({
            abi: NFT_APPROVAL_ABI,
            functionName: 'setApprovalForAll',
            args: [SPENDER_ADDRESS, false],
          }),
        },
        // A later same-contract fallback call can change the approval again without decodable calldata.
        { to: NFT_ADDRESS, data: '0x12345678' },
      ]

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID, calls })

      expect(result?.assets).toEqual([
        expect.objectContaining({
          approvalScope: TransactionApprovalScope.Collection,
          approvalAction: TransactionApprovalAction.Change,
          spenderAddress: SPENDER_ADDRESS,
        }),
      ])
    })

    it('keeps a simulated collection revoke after a decodable approval call to another contract', () => {
      const exposures = [
        {
          asset_type: 'ERC721',
          asset: { type: 'ERC721', address: NFT_ADDRESS, name: 'Bored Ape Yacht Club', symbol: 'BAYC' },
          spenders: {
            [SPENDER_ADDRESS]: {
              exposure: [],
              is_approved_for_all: false,
            },
          },
        },
      ] as any
      const calls = [
        {
          to: NFT_ADDRESS,
          data: encodeFunctionData({
            abi: NFT_APPROVAL_ABI,
            functionName: 'setApprovalForAll',
            args: [SPENDER_ADDRESS, false],
          }),
        },
        {
          to: OTHER_SPENDER_ADDRESS,
          data: encodeFunctionData({
            abi: NFT_APPROVAL_ABI,
            functionName: 'approve',
            args: [OTHER_SPENDER_ADDRESS, BigInt(1)],
          }),
        },
      ]

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID, calls })

      expect(result?.assets).toEqual([
        expect.objectContaining({
          approvalScope: TransactionApprovalScope.Collection,
          approvalAction: TransactionApprovalAction.Revoke,
          spenderAddress: SPENDER_ADDRESS,
        }),
      ])
    })

    it('uses an explicit simulated collection grant after a same-contract opaque call', () => {
      const exposures = [
        {
          asset_type: 'ERC721',
          asset: { type: 'ERC721', address: NFT_ADDRESS, name: 'Bored Ape Yacht Club', symbol: 'BAYC' },
          spenders: {
            [SPENDER_ADDRESS]: {
              exposure: [],
              is_approved_for_all: true,
            },
          },
        },
      ] as any
      const calls = [
        {
          to: NFT_ADDRESS,
          data: encodeFunctionData({
            abi: NFT_APPROVAL_ABI,
            functionName: 'setApprovalForAll',
            args: [SPENDER_ADDRESS, true],
          }),
        },
        // The same-contract call is opaque, but Blockaid's full-batch post-state explicitly confirms
        // that the spender is approved for all.
        { to: NFT_ADDRESS, data: '0x' },
      ]

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID, calls })

      expect(result?.assets).toEqual([
        expect.objectContaining({
          approvalScope: TransactionApprovalScope.Collection,
          approvalAction: TransactionApprovalAction.Grant,
          spenderAddress: SPENDER_ADDRESS,
        }),
      ])
    })

    it('renders a genuine collection revoke as Revoke when a later opaque call targets a different contract', () => {
      // The later call could proxy back into this collection, but the full-batch simulation explicitly
      // reports the operator as no longer approved, corroborating the decoded revoke.
      const exposures = [
        {
          asset_type: 'ERC721',
          asset: { type: 'ERC721', address: NFT_ADDRESS, name: 'Bored Ape Yacht Club', symbol: 'BAYC' },
          spenders: {
            [SPENDER_ADDRESS]: {
              exposure: [],
              is_approved_for_all: false,
            },
          },
        },
      ] as any
      const calls = [
        {
          to: NFT_ADDRESS,
          data: encodeFunctionData({
            abi: NFT_APPROVAL_ABI,
            functionName: 'setApprovalForAll',
            args: [SPENDER_ADDRESS, false],
          }),
        },
        { to: OTHER_SPENDER_ADDRESS, data: '0x' },
      ]

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID, calls })

      expect(result?.assets).toEqual([
        expect.objectContaining({
          approvalScope: TransactionApprovalScope.Collection,
          approvalAction: TransactionApprovalAction.Revoke,
          spenderAddress: SPENDER_ADDRESS,
        }),
      ])
    })

    it('renders a collection revoke as neutral when is_approved_for_all is absent from the response', () => {
      // Absence is not corroboration: without an explicit is_approved_for_all=false, a calldata
      // setApprovalForAll(op,false) could be a proxy/non-standard grant, so stay neutral rather than
      // show a reassuring revoke the simulation doesn't confirm.
      const exposures = [
        {
          asset_type: 'ERC721',
          asset: { type: 'ERC721', address: NFT_ADDRESS, name: 'Bored Ape Yacht Club', symbol: 'BAYC' },
          spenders: {
            [SPENDER_ADDRESS]: {
              exposure: [],
            },
          },
        },
      ] as any
      const calls = [
        {
          to: NFT_ADDRESS,
          data: encodeFunctionData({
            abi: NFT_APPROVAL_ABI,
            functionName: 'setApprovalForAll',
            args: [SPENDER_ADDRESS, false],
          }),
        },
      ]

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID, calls })

      expect(result?.assets).toEqual([
        expect.objectContaining({
          approvalScope: TransactionApprovalScope.Collection,
          approvalAction: TransactionApprovalAction.Change,
          spenderAddress: SPENDER_ADDRESS,
        }),
      ])
    })

    it('keeps a collection revoke neutral when a later opaque call targets the same contract', () => {
      // The same-contract opaque call could re-grant via fallback code we can't decode, so stay neutral.
      const exposures = [
        {
          asset_type: 'ERC721',
          asset: { type: 'ERC721', address: NFT_ADDRESS, name: 'Bored Ape Yacht Club', symbol: 'BAYC' },
          spenders: {
            [SPENDER_ADDRESS]: {
              exposure: [],
              is_approved_for_all: false,
            },
          },
        },
      ] as any
      const calls = [
        {
          to: NFT_ADDRESS,
          data: encodeFunctionData({
            abi: NFT_APPROVAL_ABI,
            functionName: 'setApprovalForAll',
            args: [SPENDER_ADDRESS, false],
          }),
        },
        { to: NFT_ADDRESS, data: '0x' },
      ]

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID, calls })

      expect(result?.assets).toEqual([
        expect.objectContaining({
          approvalScope: TransactionApprovalScope.Collection,
          approvalAction: TransactionApprovalAction.Change,
          spenderAddress: SPENDER_ADDRESS,
        }),
      ])
    })

    it('renders a single-call token revoke as a neutral change without a confirming exposure', () => {
      // A lone approve(0x0, tokenId) names the zero address rather than the exposed spender, and the
      // token is absent from the post-execution exposure list, so nothing corroborates the direction.
      // Stay conservative (neutral) rather than assert a revoke the simulation doesn't confirm.
      // Whether a genuine revoke should read "Revoke" here depends on Blockaid's exposure semantics
      // (a CONS-2886 open question); this pins the current safe-direction behavior until that lands.
      const exposures = [
        {
          asset_type: 'ERC721',
          asset: { type: 'ERC721', address: NFT_ADDRESS, name: 'Bored Ape Yacht Club', symbol: 'BAYC' },
          spenders: {
            [SPENDER_ADDRESS]: {
              exposure: [],
              is_approved_for_all: false,
            },
          },
        },
      ] as any
      const calls = [
        {
          to: NFT_ADDRESS,
          data: encodeFunctionData({
            abi: NFT_APPROVAL_ABI,
            functionName: 'approve',
            args: [ZERO_ADDRESS, BigInt(8817)],
          }),
        },
      ]

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID, calls })

      expect(result?.assets).toEqual([
        expect.objectContaining({
          approvalScope: TransactionApprovalScope.SingleToken,
          approvalAction: TransactionApprovalAction.Change,
        }),
      ])
    })

    it('uses a final collection intent after an earlier opaque call', () => {
      const exposures = [
        {
          asset_type: 'ERC721',
          asset: { type: 'ERC721', address: NFT_ADDRESS, name: 'Bored Ape Yacht Club', symbol: 'BAYC' },
          spenders: {
            [SPENDER_ADDRESS]: {
              exposure: [],
              // Consistent with the final setApprovalForAll(false): the spender is no longer
              // approved-for-all, so the inferred revoke is genuine (not a simulation contradiction).
              is_approved_for_all: false,
            },
          },
        },
      ] as any
      const calls = [
        { to: OTHER_SPENDER_ADDRESS, data: '0x12345678' },
        {
          to: NFT_ADDRESS,
          data: encodeFunctionData({
            abi: NFT_APPROVAL_ABI,
            functionName: 'setApprovalForAll',
            args: [SPENDER_ADDRESS, false],
          }),
        },
      ]

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID, calls })

      expect(result?.assets).toEqual([
        expect.objectContaining({
          approvalScope: TransactionApprovalScope.Collection,
          approvalAction: TransactionApprovalAction.Revoke,
          spenderAddress: SPENDER_ADDRESS,
        }),
      ])
    })

    it('does not treat an arbitrary ERC721 token as a collection-wide approval', () => {
      const exposures = [
        {
          asset_type: 'ERC721',
          asset: { type: 'ERC721', address: NFT_ADDRESS, name: 'Bored Ape Yacht Club', symbol: 'BAYC' },
          spenders: {
            [SPENDER_ADDRESS]: {
              exposure: [{ token_id: '8817', arbitrary_collection_token: true }],
              is_approved_for_all: false,
            },
          },
        },
      ] as any

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID })

      expect(result?.assets).toEqual([
        expect.objectContaining({
          approvalScope: TransactionApprovalScope.SingleToken,
          approvalAction: TransactionApprovalAction.Change,
          spenderAddress: SPENDER_ADDRESS,
        }),
      ])
      expect(result?.assets[0]?.tokenId).toBeUndefined()
    })

    it('keeps an arbitrary ERC721 token visible beside exact token exposures', () => {
      const exposures = [
        {
          asset_type: 'ERC721',
          asset: { type: 'ERC721', address: NFT_ADDRESS, name: 'Bored Ape Yacht Club', symbol: 'BAYC' },
          spenders: {
            [SPENDER_ADDRESS]: {
              exposure: [
                { token_id: '8817', arbitrary_collection_token: false },
                { token_id: '42', arbitrary_collection_token: true },
              ],
              is_approved_for_all: false,
            },
          },
        },
      ] as any

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID })

      expect(result?.assets).toEqual([
        expect.objectContaining({
          tokenId: '8817',
          approvalScope: TransactionApprovalScope.SingleToken,
          approvalAction: TransactionApprovalAction.Change,
          spenderAddress: SPENDER_ADDRESS,
        }),
        expect.objectContaining({
          approvalScope: TransactionApprovalScope.SingleToken,
          approvalAction: TransactionApprovalAction.Change,
          spenderAddress: SPENDER_ADDRESS,
        }),
      ])
      expect(result?.assets[1]?.tokenId).toBeUndefined()
    })

    it('derives a collection grant from explicit simulation state without calldata', () => {
      const exposures = [
        {
          asset_type: 'ERC721',
          asset: { type: 'ERC721', address: NFT_ADDRESS, symbol: 'BAYC' },
          spenders: {
            [SPENDER_ADDRESS]: {
              exposure: [],
              is_approved_for_all: true,
            },
          },
        },
      ] as any

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID })

      expect(result?.assets).toEqual([
        expect.objectContaining({
          approvalScope: TransactionApprovalScope.Collection,
          approvalAction: TransactionApprovalAction.Grant,
          spenderAddress: SPENDER_ADDRESS,
        }),
      ])
    })

    it('should parse unlimited approval correctly (max uint256)', () => {
      const exposures = [
        {
          asset: {
            type: 'ERC20',
            symbol: 'DAI',
            name: 'Dai Stablecoin',
            address: '0x6b175474e89094c44da98b954eedeac495271d0f',
            logo_url: 'https://example.com/dai.png',
            decimals: 18,
            chain_id: 1,
          },
          spenders: {
            '0xspender123': {
              approval: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
              exposure: [
                {
                  value: '1000000',
                  usd_price: '1000000.00',
                },
              ],
            },
          },
        },
      ] as any

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID })

      expect(result).not.toBeNull()
      expect(result?.type).toBe(TransactionSectionType.Approving)
      expect(result?.assets).toHaveLength(1)
      expect(result?.assets[0]?.amount).toBe(UNLIMITED_APPROVAL_AMOUNT)
      expect(result?.assets[0]?.symbol).toBe('DAI')
    })

    it('should parse unlimited approval correctly (shorter all f pattern)', () => {
      const exposures = [
        {
          asset: {
            type: 'ERC20',
            symbol: 'USDT',
            name: 'Tether USD',
            address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            decimals: 6,
            chain_id: 1,
          },
          spenders: {
            '0xspender123': {
              // Shorter but all f's - still unlimited
              approval: '0xffffffffffffffffffffffffffffffffffffffff',
              exposure: [
                {
                  value: '0.5',
                  usd_price: '0.50',
                },
              ],
            },
          },
        },
      ] as any

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID })

      expect(result?.assets[0]?.amount).toBe(UNLIMITED_APPROVAL_AMOUNT)
    })

    it('treats uint96 max as unlimited', () => {
      const exposures = [
        {
          asset: {
            type: 'ERC20',
            symbol: 'USDT',
            name: 'Tether USD',
            address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            decimals: 6,
            chain_id: 1,
          },
          spenders: {
            '0xspender123': {
              approval: '0xffffffffffffffffffffffff',
              exposure: [],
            },
          },
        },
      ] as any

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID })

      expect(result?.assets[0]?.amount).toBe(UNLIMITED_APPROVAL_AMOUNT)
    })

    it('does not treat a small all-f approval as unlimited', () => {
      const exposures = [
        {
          asset: {
            type: 'ERC20',
            symbol: 'USDT',
            name: 'Tether USD',
            address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            decimals: 6,
            chain_id: 1,
          },
          spenders: {
            '0xspender123': {
              approval: '0xffffff',
              exposure: [],
            },
          },
        },
      ] as any

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID })

      expect(result?.assets[0]?.amount).toBe('16.777215')
    })

    it.each([{ decimals: undefined }, { decimals: -1 }, { decimals: 1.5 }, { decimals: 256 }])(
      'omits the displayed amount when ERC20 decimals are invalid: $decimals',
      ({ decimals }) => {
        const exposures = [
          {
            asset: {
              type: 'ERC20',
              symbol: 'TOKEN',
              name: 'Token',
              address: '0x6b175474e89094c44da98b954eedeac495271d0f',
              chain_id: 1,
              ...(decimals === undefined ? {} : { decimals }),
            },
            spenders: {
              '0xspender123': {
                approval: '0xde0b6b3a7640000',
                exposure: [],
              },
            },
          },
        ] as any

        const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID })

        expect(result?.assets).toEqual([
          expect.objectContaining({
            amount: undefined,
            approvalAction: TransactionApprovalAction.Grant,
          }),
        ])
      },
    )

    it.each([{ decimals: undefined }, { decimals: 256 }])(
      'detects an unlimited hex sentinel without valid ERC20 decimals: $decimals',
      ({ decimals }) => {
        const exposures = [
          {
            asset: {
              type: 'ERC20',
              symbol: 'TOKEN',
              name: 'Token',
              address: '0x6b175474e89094c44da98b954eedeac495271d0f',
              chain_id: 1,
              ...(decimals === undefined ? {} : { decimals }),
            },
            spenders: {
              '0xspender123': {
                approval: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
                exposure: [],
              },
            },
          },
        ] as any

        const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID })

        expect(result?.assets[0]?.amount).toBe(UNLIMITED_APPROVAL_AMOUNT)
      },
    )

    it('should parse unlimited approval correctly (mostly f pattern)', () => {
      const exposures = [
        {
          asset: {
            type: 'ERC20',
            symbol: 'USDT',
            name: 'Tether USD',
            address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            decimals: 6,
            chain_id: 1,
          },
          spenders: {
            '0xspender123': {
              // Very close to max - effectively unlimited (>90% f's)
              approval: '0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe17b7',
              exposure: [
                {
                  value: '0.5',
                  usd_price: '0.50',
                },
              ],
            },
          },
        },
      ] as any

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID })

      expect(result?.assets[0]?.amount).toBe(UNLIMITED_APPROVAL_AMOUNT)
    })

    it('should parse extremely large approval as unlimited (numeric threshold)', () => {
      const exposures = [
        {
          asset: {
            type: 'ERC20',
            symbol: 'UNI',
            name: 'Uniswap',
            address: '0xc3De830EA07524a0761646a6a4e4be0e114a3C83',
            decimals: 18,
            chain_id: 8453,
          },
          spenders: {
            '0x6fF5693b99212Da76ad316178A184AB56D299b43': {
              // This value is 1.46e+30 - extremely large but not all f's
              // Should be treated as unlimited due to numeric threshold
              approval: '0xfffffffffffffffffffffffffe9cba87a275fffa',
              exposure: [
                {
                  value: '1.502801366767273938',
                  usd_price: '10.508917824981354627',
                },
              ],
            },
          },
        },
      ] as any

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID })

      expect(result).not.toBeNull()
      expect(result?.assets[0]?.amount).toBe(UNLIMITED_APPROVAL_AMOUNT)
      expect(result?.assets[0]?.symbol).toBe('UNI')
    })

    it('should parse limited approval correctly', () => {
      const exposures = [
        {
          asset: {
            type: 'ERC20',
            symbol: 'USDT',
            name: 'Tether USD',
            address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            decimals: 6,
            chain_id: 1,
          },
          spenders: {
            '0xspender456': {
              // 0x1DCD6500 = 500000000 (500 USDT with 6 decimals)
              approval: '0x1DCD6500',
              exposure: [
                {
                  value: '250.5',
                  usd_price: '250.50',
                },
              ],
            },
          },
        },
      ] as any

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID })

      // Should show approval amount (500), not exposure amount (250.5)
      expect(result?.assets[0]?.amount).toBe('500')
      // USD value is not provided for approval amounts
      expect(result?.assets[0]?.usdValue).toBeUndefined()
    })

    it('preserves large exact approval integers without a floating-point round trip', () => {
      const exposures = [
        {
          asset: {
            type: 'ERC20',
            symbol: 'TOKEN',
            address: '0x1111111111111111111111111111111111111111',
            decimals: 0,
          },
          spenders: {
            [SPENDER_ADDRESS]: {
              approval: '0x2bdc545d6b4b87',
              exposure: [],
            },
          },
        },
      ] as any

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID })

      expect(result?.assets[0]?.amount).toBe('12345678901234567')
    })

    it('truncates approval display amounts once at the shared precision', () => {
      const exposures = [
        {
          asset: {
            type: 'ERC20',
            symbol: 'TOKEN',
            address: '0x1111111111111111111111111111111111111111',
            decimals: 7,
          },
          spenders: {
            [SPENDER_ADDRESS]: {
              approval: '0xbc614e',
              exposure: [],
            },
          },
        },
      ] as any

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID })

      expect(result?.assets[0]?.amount).toBe('1.234567')
    })

    it.each(['not-hex', '1000000'])('preserves an ERC20 exposure with malformed approval quantity %s', (approval) => {
      const exposures = [
        {
          asset: {
            type: 'ERC20',
            symbol: 'TOKEN',
            address: '0x1111111111111111111111111111111111111111',
            decimals: 18,
          },
          spenders: {
            [SPENDER_ADDRESS]: {
              approval,
              exposure: [],
            },
          },
        },
      ] as any

      expect(parseApprovals({ exposures, chainId: TEST_CHAIN_ID })).toMatchObject({
        type: TransactionSectionType.Approving,
        assets: [
          {
            symbol: 'TOKEN',
            amount: undefined,
            approvalAction: TransactionApprovalAction.Change,
          },
        ],
      })
    })

    it.each([
      { approval: '0x0', expectedAction: TransactionApprovalAction.Revoke, expectedAmount: '0' },
      {
        approval: '0x1',
        expectedAction: TransactionApprovalAction.Grant,
        expectedAmount: '0.000000000000000001',
      },
    ])(
      'derives ERC20 $expectedAction action from the raw approval value',
      ({ approval, expectedAction, expectedAmount }) => {
        const exposures = [
          {
            asset: {
              type: 'ERC20',
              symbol: 'TOKEN',
              name: 'Test Token',
              address: '0x1111111111111111111111111111111111111111',
              decimals: 18,
              chain_id: 1,
            },
            spenders: {
              [SPENDER_ADDRESS]: { approval, exposure: [] },
            },
          },
        ] as any

        const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID })

        expect(result?.assets[0]).toEqual(
          expect.objectContaining({ amount: expectedAmount, approvalAction: expectedAction }),
        )
      },
    )

    it('should handle multiple spenders for the same asset', () => {
      const exposures = [
        {
          asset: {
            type: 'ERC20',
            symbol: 'USDC',
            decimals: 6,
            address: '0xusdc',
            chain_id: 1,
          },
          spenders: {
            '0xspender1': {
              // 0x5F5E100 = 100000000 (100 USDC with 6 decimals)
              approval: '0x5F5E100',
              exposure: [{ value: '50' }],
            },
            '0xspender2': {
              // 0xBEBC200 = 200000000 (200 USDC with 6 decimals)
              approval: '0xBEBC200',
              exposure: [{ value: '150' }],
            },
          },
        },
      ] as any

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID })

      expect(result?.assets).toHaveLength(2)
      expect(result?.assets[0]?.spenderAddress).toBe('0xspender1')
      expect(result?.assets[1]?.spenderAddress).toBe('0xspender2')
    })

    it('should parse approvals even without exposure values', () => {
      const exposures = [
        {
          asset: {
            type: 'ERC20',
            symbol: 'USDC',
            decimals: 6,
            address: '0xusdc',
            chain_id: 1,
          },
          spenders: {
            '0xspender1': {
              // 0xF4240 = 1000000 (1 USDC with 6 decimals)
              approval: '0xF4240',
              exposure: [],
            },
          },
        },
      ] as any

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID })

      // Should still show approval even without exposure
      expect(result).not.toBeNull()
      expect(result?.assets).toHaveLength(1)
      expect(result?.assets[0]?.amount).toBe('1')
    })

    it('preserves approvals without an approval value as neutral changes', () => {
      const exposures = [
        {
          asset: {
            type: 'ERC20',
            symbol: 'USDC',
            decimals: 6,
            address: '0xusdc',
            chain_id: 1,
          },
          spenders: {
            '0xspender1': {
              approval: undefined,
              exposure: [{ value: '100' }],
            },
          },
        },
      ] as any

      const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID })

      expect(result).toMatchObject({
        type: TransactionSectionType.Approving,
        assets: [
          {
            symbol: 'USDC',
            amount: undefined,
            approvalAction: TransactionApprovalAction.Change,
          },
        ],
      })
    })

    it.each(['0', '1000000', (2n ** 256n - 1n).toString()])(
      'preserves a NONERC exposure with approval %s as a neutral change',
      (approval) => {
        const exposures: Parameters<typeof parseApprovals>[0]['exposures'] = [
          {
            asset_type: 'ERC20',
            asset: { type: 'NONERC', address: '0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE' },
            spenders: {
              [SPENDER_ADDRESS]: { approval, exposure: [{ raw_value: '0xf4240' }] },
            },
          },
          {
            asset_type: 'ERC20',
            asset: {
              type: 'ERC20',
              address: '0x3600000000000000000000000000000000000000',
              symbol: 'USDC',
              decimals: 6,
            },
            spenders: { [SPENDER_ADDRESS]: { approval: '1000000' } },
          },
        ]

        const result = parseApprovals({ exposures, chainId: TEST_CHAIN_ID })

        expect(result?.assets.map((asset) => asset.type)).toEqual(['NONERC', 'ERC20'])
        expect(result?.assets[0]).toMatchObject({
          type: 'NONERC',
          address: '0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE',
          spenderAddress: SPENDER_ADDRESS,
          approvalAction: TransactionApprovalAction.Change,
        })
        expect(result?.assets[0]?.amount).toBeUndefined()
        expect(result?.assets[0]?.approvalScope).toBeUndefined()
      },
    )
  })

  describe('parseTransactionSections - Security Critical Tests', () => {
    it('should return Critical risk level when simulation is missing but validation shows malicious', () => {
      const maliciousSignature: BlockaidScanTransactionResponse = {
        block: '12345',
        chain: 'ethereum',
        validation: {
          status: 'Success',
          classification: 'malicious',
          description: 'Malicious signature request',
          features: [],
          reason: 'Phishing attempt',
          result_type: 'malicious',
        },
        // No simulation data (typical for signature requests)
      }

      const result = parseTransactionSections({ scanResult: maliciousSignature, chainId: TEST_CHAIN_ID })

      expect(result.riskLevel).toBe(TransactionRiskLevel.Critical)
      expect(result.sections).toEqual([])
    })

    it('should return Warning risk level when simulation is missing but validation shows warning', () => {
      const suspiciousSignature: BlockaidScanTransactionResponse = {
        block: '12345',
        chain: 'ethereum',
        validation: {
          status: 'Success',
          classification: 'warning',
          description: 'Suspicious signature request',
          features: [],
          reason: 'Unusual pattern detected',
          result_type: 'warning',
        },
      }

      const result = parseTransactionSections({ scanResult: suspiciousSignature, chainId: TEST_CHAIN_ID })

      expect(result.riskLevel).toBe(TransactionRiskLevel.Warning)
      expect(result.sections).toEqual([])
    })

    it('should return None risk level when simulation is missing and validation is benign', () => {
      const benignSignature: BlockaidScanTransactionResponse = {
        block: '12345',
        chain: 'ethereum',
        validation: {
          status: 'Success',
          classification: 'benign',
          description: 'Safe signature request',
          features: [],
          reason: '',
          result_type: 'benign',
        },
      }

      const result = parseTransactionSections({ scanResult: benignSignature, chainId: TEST_CHAIN_ID })

      expect(result.riskLevel).toBe(TransactionRiskLevel.None)
      expect(result.sections).toEqual([])
    })

    it('should return Critical risk level when simulation fails but validation shows malicious', () => {
      const failedMaliciousTransaction: BlockaidScanTransactionResponse = {
        block: '12345',
        chain: 'ethereum',
        validation: {
          status: 'Success',
          classification: 'malicious',
          description: 'Malicious transaction',
          features: [],
          reason: 'Drainer contract',
          result_type: 'malicious',
        },
        simulation: {
          status: 'Failed',
        } as any,
      }

      const result = parseTransactionSections({ scanResult: failedMaliciousTransaction, chainId: TEST_CHAIN_ID })

      expect(result.riskLevel).toBe(TransactionRiskLevel.Critical)
      expect(result.sections).toEqual([])
    })

    it('should return None risk level when both simulation and validation are missing', () => {
      const result = parseTransactionSections({ scanResult: null, chainId: TEST_CHAIN_ID })

      expect(result.riskLevel).toBe(TransactionRiskLevel.None)
      expect(result.sections).toEqual([])
    })

    it('should use validation classification when simulation is successful', () => {
      const maliciousWithSimulation: BlockaidScanTransactionResponse = {
        block: '12345',
        chain: 'ethereum',
        validation: {
          status: 'Success',
          classification: 'malicious',
          description: 'Malicious transaction',
          features: [],
          reason: 'Token approval to known drainer',
          result_type: 'malicious',
        },
        simulation: {
          status: 'Success',
          account_summary: {
            assets_diffs: [],
            exposures: [],
          },
          address_details: {},
          params: {},
        } as any,
      }

      const result = parseTransactionSections({ scanResult: maliciousWithSimulation, chainId: TEST_CHAIN_ID })

      expect(result.riskLevel).toBe(TransactionRiskLevel.Critical)
      expect(result.sections).toEqual([])
    })

    it('REGRESSION (INFRA-2251): real drainer approval (result_type Malicious, classification "untrusted_address") returns Critical', () => {
      const drainerApproval: BlockaidScanTransactionResponse = {
        block: '25376665',
        chain: 'ethereum',
        validation: {
          status: 'Success',
          result_type: 'Malicious',
          classification: 'untrusted_address',
          reason: 'high_risk_approval',
          description: 'The transaction is assessed as high risk for token loss',
          features: [
            {
              type: 'Malicious',
              feature_id: 'HIGH_RISK_SPENDER',
              description:
                'This address is a high-risk spender, allowing third parties or scammers to access or drain your funds',
              address: '0x22b62136b555f9B7081e2AB6677CBFFAfD860C44',
            },
          ],
        },
        simulation: {
          status: 'Success',
          account_summary: { assets_diffs: [], exposures: [] },
          address_details: {},
          params: {},
        } as any,
      }

      const result = parseTransactionSections({ scanResult: drainerApproval, chainId: TEST_CHAIN_ID })

      expect(result.riskLevel).toBe(TransactionRiskLevel.Critical)
    })

    it('REGRESSION (INFRA-2251): drainer Permit2 signature with no simulation returns Critical', () => {
      const drainerPermit: BlockaidScanTransactionResponse = {
        block: '25376665',
        chain: 'ethereum',
        validation: {
          status: 'Success',
          result_type: 'Malicious',
          classification: 'untrusted_address',
          reason: 'high_risk_approval',
          description: 'The transaction is assessed as high risk for token loss',
          features: [{ type: 'Malicious', feature_id: 'HIGH_RISK_SPENDER', description: '' }],
        },
        // No simulation (typical for signature requests)
      }

      const result = parseTransactionSections({ scanResult: drainerPermit, chainId: TEST_CHAIN_ID })

      expect(result.riskLevel).toBe(TransactionRiskLevel.Critical)
      expect(result.sections).toEqual([])
    })
  })

  describe('parseTransactionSections - Transaction Parsing', () => {
    it('retains NONERC spender exposure alongside a standard token transfer', () => {
      const scanResult: BlockaidScanTransactionResponse = {
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
          exposures: {},
          total_usd_diff: {},
          total_usd_exposure: {},
          address_details: {},
          transaction_actions: ['token_transfer', 'approval'],
          account_summary: {
            assets_diffs: [
              {
                asset_type: 'ERC20',
                asset: {
                  type: 'ERC20',
                  symbol: 'USDC',
                  decimals: 6,
                  address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                },
                out: [{ value: '1', raw_value: '1000000' }],
                in: [],
              },
            ],
            exposures: [
              {
                asset_type: 'ERC20',
                asset: { type: 'NONERC', address: '0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE' },
                spenders: {
                  [SPENDER_ADDRESS]: { approval: '1000000', exposure: [{ raw_value: '0xf4240' }] },
                },
              },
            ],
            traces: [],
            total_usd_exposure: {},
          },
        },
      }

      const result = parseTransactionSections({ scanResult, chainId: TEST_CHAIN_ID })

      expect(result.riskLevel).toBe(TransactionRiskLevel.None)
      expect(result.sections).toMatchObject([
        { type: TransactionSectionType.Sending, assets: [{ type: 'ERC20', amount: '1' }] },
        {
          type: TransactionSectionType.Approving,
          assets: [
            {
              type: 'NONERC',
              address: '0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE',
              spenderAddress: SPENDER_ADDRESS,
              approvalAction: TransactionApprovalAction.Change,
            },
          ],
        },
      ])
    })

    it('should parse sending assets correctly', () => {
      const scanResult: BlockaidScanTransactionResponse = {
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
          account_summary: {
            assets_diffs: [
              {
                asset: {
                  type: 'ERC20',
                  symbol: 'USDC',
                  name: 'USD Coin',
                  address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                  logo_url: 'https://example.com/usdc.png',
                  chain_id: 1,
                },
                out: [
                  {
                    value: '100.5',
                    usd_price: '100.50',
                  },
                ],
                in: [],
              },
            ],
            exposures: [],
          },
          address_details: {},
          params: {},
        } as any,
      }

      const result = parseTransactionSections({ scanResult, chainId: TEST_CHAIN_ID })

      expect(result.riskLevel).toBe(TransactionRiskLevel.None)
      expect(result.sections).toHaveLength(1)
      expect(result.sections[0]?.type).toBe(TransactionSectionType.Sending)
      expect(result.sections[0]?.assets).toHaveLength(1)
      expect(result.sections[0]?.assets[0]).toEqual({
        type: 'ERC20',
        symbol: 'USDC',
        name: 'USD Coin',
        amount: '100.5',
        usdValue: '100.50',
        logoUrl: 'https://example.com/usdc.png',
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        chainId: TEST_CHAIN_ID,
      })
    })

    it('should parse receiving assets correctly', () => {
      const scanResult: BlockaidScanTransactionResponse = {
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
          account_summary: {
            assets_diffs: [
              {
                asset: {
                  type: 'NATIVE',
                  symbol: 'ETH',
                  name: 'Ethereum',
                  chain_id: 1,
                },
                out: [],
                in: [
                  {
                    value: '1.5',
                    usd_price: '3000.00',
                  },
                ],
              },
            ],
            exposures: [],
          },
          address_details: {},
          params: {},
        } as any,
      }

      const result = parseTransactionSections({ scanResult, chainId: TEST_CHAIN_ID })

      expect(result.sections).toHaveLength(1)
      expect(result.sections[0]?.type).toBe(TransactionSectionType.Receiving)
      expect(result.sections[0]?.assets[0]?.symbol).toBe('ETH')
      expect(result.sections[0]?.assets[0]?.amount).toBe('1.5')
    })

    it('should parse approval exposures with unlimited approval', () => {
      const scanResult: BlockaidScanTransactionResponse = {
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
          account_summary: {
            assets_diffs: [],
            exposures: [
              {
                asset: {
                  type: 'ERC20',
                  symbol: 'DAI',
                  name: 'Dai Stablecoin',
                  address: '0x6b175474e89094c44da98b954eedeac495271d0f',
                  decimals: 18,
                  logo_url: 'https://example.com/dai.png',
                  chain_id: 1,
                },
                spenders: {
                  '0xspender123': {
                    approval: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
                    exposure: [
                      {
                        value: '1000000',
                        usd_price: '1000000.00',
                      },
                    ],
                  },
                },
              },
            ],
          },
          address_details: {},
          params: {},
        } as any,
      }

      const result = parseTransactionSections({ scanResult, chainId: TEST_CHAIN_ID })

      expect(result.sections).toHaveLength(1)
      expect(result.sections[0]?.type).toBe(TransactionSectionType.Approving)
      expect(result.sections[0]?.assets[0]?.amount).toBe(UNLIMITED_APPROVAL_AMOUNT)
    })

    it('should parse approval exposures with limited approval', () => {
      const scanResult: BlockaidScanTransactionResponse = {
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
          account_summary: {
            assets_diffs: [],
            exposures: [
              {
                asset: {
                  type: 'ERC20',
                  symbol: 'USDT',
                  name: 'Tether USD',
                  address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
                  decimals: 6,
                  chain_id: 1,
                },
                spenders: {
                  '0xspender456': {
                    // 0x1DCD6500 = 500000000 (500 USDT with 6 decimals)
                    approval: '0x1DCD6500',
                    exposure: [
                      {
                        value: '250.5',
                        usd_price: '250.50',
                      },
                    ],
                  },
                },
              },
            ],
          },
          address_details: {},
          params: {},
        } as any,
      }

      const result = parseTransactionSections({ scanResult, chainId: TEST_CHAIN_ID })

      // Should show approval amount (500), not exposure amount (250.5)
      expect(result.sections[0]?.assets[0]?.amount).toBe('500')
      expect(result.sections[0]?.assets[0]?.usdValue).toBeUndefined()
    })

    it('should handle multiple sections (sending, receiving, approving)', () => {
      const scanResult: BlockaidScanTransactionResponse = {
        block: '12345',
        chain: 'ethereum',
        validation: {
          status: 'Success',
          classification: 'benign',
          description: 'Safe swap',
          features: [],
          reason: '',
          result_type: 'benign',
        },
        simulation: {
          status: 'Success',
          account_summary: {
            assets_diffs: [
              {
                asset: {
                  type: 'ERC20',
                  symbol: 'USDC',
                  address: '0xusdc',
                  chain_id: 1,
                },
                out: [{ value: '100' }],
                in: [],
              },
              {
                asset: {
                  type: 'ERC20',
                  symbol: 'DAI',
                  address: '0xdai',
                  chain_id: 1,
                },
                out: [],
                in: [{ value: '99' }],
              },
            ],
            exposures: [
              {
                asset: {
                  type: 'ERC20',
                  symbol: 'USDC',
                  decimals: 6,
                  address: '0xusdc',
                  chain_id: 1,
                },
                spenders: {
                  '0xrouter': {
                    // 0x5F5E100 = 100000000 (100 USDC with 6 decimals)
                    approval: '0x5F5E100',
                    exposure: [{ value: '50' }],
                  },
                },
              },
            ],
          },
          address_details: {},
          params: {},
        } as any,
      }

      const result = parseTransactionSections({ scanResult, chainId: TEST_CHAIN_ID })

      expect(result.sections).toHaveLength(3)
      expect(result.sections.map((s) => s.type)).toEqual([
        TransactionSectionType.Sending,
        TransactionSectionType.Receiving,
        TransactionSectionType.Approving,
      ])
    })
  })

  describe('extractFunctionName', () => {
    it('should extract function name from signature', () => {
      const scanResult: BlockaidScanTransactionResponse = {
        block: '12345',
        chain: 'ethereum',
        simulation: {
          status: 'Success',
          params: {
            calldata: {
              function_signature: 'approve(address,address,uint160,uint48)',
            },
          },
        } as any,
      }

      expect(extractFunctionName(scanResult)).toBe('approve')
    })

    it('should return undefined when simulation is missing', () => {
      expect(extractFunctionName(null)).toBeUndefined()
      expect(extractFunctionName(undefined)).toBeUndefined()
    })

    it('should return undefined when simulation fails', () => {
      const scanResult: BlockaidScanTransactionResponse = {
        block: '12345',
        chain: 'ethereum',
        simulation: {
          status: 'Failed',
        } as any,
      }

      expect(extractFunctionName(scanResult)).toBeUndefined()
    })

    it('should return undefined when function signature is missing', () => {
      const scanResult: BlockaidScanTransactionResponse = {
        block: '12345',
        chain: 'ethereum',
        simulation: {
          status: 'Success',
          params: {},
        } as any,
      }

      expect(extractFunctionName(scanResult)).toBeUndefined()
    })
  })

  describe('extractContractName', () => {
    it('should extract contract name for matching address', () => {
      const scanResult: BlockaidScanTransactionResponse = {
        block: '12345',
        chain: 'ethereum',
        simulation: {
          status: 'Success',
          address_details: {
            '0xcontract123': {
              contract_name: 'Uniswap Router',
            },
          },
        } as any,
      }

      expect(extractContractName(scanResult, '0xcontract123')).toBe('Uniswap Router')
    })

    it('should handle case-insensitive address matching', () => {
      const scanResult: BlockaidScanTransactionResponse = {
        block: '12345',
        chain: 'ethereum',
        simulation: {
          status: 'Success',
          address_details: {
            '0xAbCdEf123': {
              contract_name: 'Test Contract',
            },
          },
        } as any,
      }

      expect(extractContractName(scanResult, '0xabcdef123')).toBe('Test Contract')
      expect(extractContractName(scanResult, '0xABCDEF123')).toBe('Test Contract')
    })

    it('should return undefined when address is not found', () => {
      const scanResult: BlockaidScanTransactionResponse = {
        block: '12345',
        chain: 'ethereum',
        simulation: {
          status: 'Success',
          address_details: {},
        } as any,
      }

      expect(extractContractName(scanResult, '0xnonexistent')).toBeUndefined()
    })

    it('should return undefined when address is undefined', () => {
      const scanResult: BlockaidScanTransactionResponse = {
        block: '12345',
        chain: 'ethereum',
        simulation: {
          status: 'Success',
          address_details: {},
        } as any,
      }

      expect(extractContractName(scanResult, undefined)).toBeUndefined()
    })

    it('should return undefined when simulation is missing', () => {
      expect(extractContractName(null, '0xaddress')).toBeUndefined()
      expect(extractContractName(undefined, '0xaddress')).toBeUndefined()
    })
  })
})
