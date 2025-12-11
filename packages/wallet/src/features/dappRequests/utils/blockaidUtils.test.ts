// Mock chain info to avoid importing chain data with PNG files
jest.mock('uniswap/src/features/chains/chainInfo', () => ({
  getChainInfo: jest.fn((chainId: number) => ({
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
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionRiskLevel, TransactionSectionType } from 'wallet/src/features/dappRequests/types'
import {
  extractContractName,
  extractFunctionName,
  getRiskLevelFromClassification,
  parseApprovals,
  parseReceivingAssets,
  parseSendingAssets,
  parseTransactionSections,
  UNLIMITED_APPROVAL_AMOUNT,
} from 'wallet/src/features/dappRequests/utils/blockaidUtils'

const TEST_CHAIN_ID = UniverseChainId.Mainnet

describe('blockaidUtils', () => {
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

      const result = parseApprovals(exposures, TEST_CHAIN_ID)

      expect(result).toBeNull()
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

      const result = parseApprovals(exposures, TEST_CHAIN_ID)

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

      const result = parseApprovals(exposures, TEST_CHAIN_ID)

      expect(result?.assets[0]?.amount).toBe(UNLIMITED_APPROVAL_AMOUNT)
    })

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

      const result = parseApprovals(exposures, TEST_CHAIN_ID)

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

      const result = parseApprovals(exposures, TEST_CHAIN_ID)

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

      const result = parseApprovals(exposures, TEST_CHAIN_ID)

      // Should show approval amount (500), not exposure amount (250.5)
      expect(result?.assets[0]?.amount).toBe('500')
      // USD value is not provided for approval amounts
      expect(result?.assets[0]?.usdValue).toBeUndefined()
    })

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

      const result = parseApprovals(exposures, TEST_CHAIN_ID)

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

      const result = parseApprovals(exposures, TEST_CHAIN_ID)

      // Should still show approval even without exposure
      expect(result).not.toBeNull()
      expect(result?.assets).toHaveLength(1)
      expect(result?.assets[0]?.amount).toBe('1')
    })

    it('should skip approvals without approval value', () => {
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

      const result = parseApprovals(exposures, TEST_CHAIN_ID)

      expect(result).toBeNull()
    })
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

      const result = parseTransactionSections(maliciousSignature, TEST_CHAIN_ID)

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

      const result = parseTransactionSections(suspiciousSignature, TEST_CHAIN_ID)

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

      const result = parseTransactionSections(benignSignature, TEST_CHAIN_ID)

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

      const result = parseTransactionSections(failedMaliciousTransaction, TEST_CHAIN_ID)

      expect(result.riskLevel).toBe(TransactionRiskLevel.Critical)
      expect(result.sections).toEqual([])
    })

    it('should return None risk level when both simulation and validation are missing', () => {
      const result = parseTransactionSections(null, TEST_CHAIN_ID)

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

      const result = parseTransactionSections(maliciousWithSimulation, TEST_CHAIN_ID)

      expect(result.riskLevel).toBe(TransactionRiskLevel.Critical)
      expect(result.sections).toEqual([])
    })
  })

  describe('parseTransactionSections - Transaction Parsing', () => {
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

      const result = parseTransactionSections(scanResult, TEST_CHAIN_ID)

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

      const result = parseTransactionSections(scanResult, TEST_CHAIN_ID)

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

      const result = parseTransactionSections(scanResult, TEST_CHAIN_ID)

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

      const result = parseTransactionSections(scanResult, TEST_CHAIN_ID)

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

      const result = parseTransactionSections(scanResult, TEST_CHAIN_ID)

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
