import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  PoolDataReportOption,
  PortfolioDataReportOption,
  submitPoolDataReport,
  submitPortfolioDataReport,
  submitTokenDataReport,
  submitTokenIssueReport,
  submitTokenWarningDataReport,
  TokenDataReportOption,
  TokenReportOption,
} from 'uniswap/src/features/reporting/reports'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { Mock } from 'vitest'

vi.mock('uniswap/src/features/telemetry/send')

const mockSendAnalyticsEvent = sendAnalyticsEvent as Mock

describe('report submission analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('submitTokenIssueReport', () => {
    it('sends text when Other option has text in map', () => {
      const reportTexts = new Map<TokenReportOption, string>([[TokenReportOption.Other, 'this token is suspicious']])

      submitTokenIssueReport({
        source: 'token-details',
        chainId: UniverseChainId.Mainnet,
        tokenAddress: '0x123',
        reportOptions: [TokenReportOption.Spam, TokenReportOption.Other],
        reportTexts,
      })

      expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(
        UniswapEventName.SpamReportSubmitted,
        expect.objectContaining({
          spam_token: true,
          something_else: true,
          text: 'this token is suspicious',
          is_multichain_asset: false,
        }),
      )
    })

    it('sends undefined text when Other is not in reportTexts map', () => {
      submitTokenIssueReport({
        source: 'portfolio',
        chainId: UniverseChainId.Mainnet,
        tokenAddress: '0x123',
        reportOptions: [TokenReportOption.Spam],
        reportTexts: new Map(),
      })

      expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(
        UniswapEventName.SpamReportSubmitted,
        expect.objectContaining({
          spam_token: true,
          something_else: false,
          text: undefined,
          is_multichain_asset: false,
        }),
      )
    })

    it('sends is_multichain_asset when true', () => {
      submitTokenIssueReport({
        source: 'token-details',
        chainId: UniverseChainId.Mainnet,
        tokenAddress: '0x123',
        reportOptions: [TokenReportOption.Spam],
        reportTexts: new Map(),
        isMultichainAsset: true,
      })

      expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(
        UniswapEventName.SpamReportSubmitted,
        expect.objectContaining({
          is_multichain_asset: true,
        }),
      )
    })
  })

  describe('submitTokenDataReport', () => {
    it('sends text when Other option has text in map', () => {
      const reportTexts = new Map<TokenDataReportOption, string>([[TokenDataReportOption.Other, 'chart looks off']])

      submitTokenDataReport({
        chainId: UniverseChainId.Mainnet,
        tokenAddress: '0x456',
        reportOptions: [TokenDataReportOption.Other],
        reportTexts,
      })

      expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(
        UniswapEventName.DataReportSubmitted,
        expect.objectContaining({
          type: 'data',
          something_else: true,
          text: 'chart looks off',
          report_multichain_asset: false,
        }),
      )
    })

    it('sends performance_text when only Performance is selected by itself', () => {
      const reportTexts = new Map<TokenDataReportOption, string>([
        [TokenDataReportOption.Performance, 'avg cost is wrong'],
      ])

      submitTokenDataReport({
        chainId: UniverseChainId.Mainnet,
        tokenAddress: '0x456',
        reportOptions: [TokenDataReportOption.Performance],
        reportTexts,
      })

      expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(
        UniswapEventName.DataReportSubmitted,
        expect.objectContaining({
          type: 'data',
          performance: true,
          performance_text: 'avg cost is wrong',
          something_else: false,
          text: undefined,
          report_multichain_asset: false,
        }),
      )
    })

    it('sends both performance_text and text when both options have text', () => {
      const reportTexts = new Map<TokenDataReportOption, string>([
        [TokenDataReportOption.Performance, 'PnL is wrong'],
        [TokenDataReportOption.Other, 'chart looks off'],
      ])

      submitTokenDataReport({
        chainId: UniverseChainId.Mainnet,
        tokenAddress: '0x456',
        reportOptions: [TokenDataReportOption.Performance, TokenDataReportOption.Other],
        reportTexts,
      })

      expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(
        UniswapEventName.DataReportSubmitted,
        expect.objectContaining({
          type: 'data',
          performance: true,
          performance_text: 'PnL is wrong',
          something_else: true,
          text: 'chart looks off',
          report_multichain_asset: false,
        }),
      )
    })

    it('sends undefined for text fields when options have no text entries', () => {
      submitTokenDataReport({
        chainId: UniverseChainId.Mainnet,
        tokenAddress: '0x456',
        reportOptions: [TokenDataReportOption.Price],
        reportTexts: new Map(),
      })

      expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(
        UniswapEventName.DataReportSubmitted,
        expect.objectContaining({
          price: true,
          performance_text: undefined,
          text: undefined,
          report_multichain_asset: false,
        }),
      )
    })

    it('sends report_multichain_asset when true', () => {
      submitTokenDataReport({
        chainId: UniverseChainId.Mainnet,
        tokenAddress: '0x456',
        reportOptions: [TokenDataReportOption.Price],
        reportTexts: new Map(),
        reportMultichainAsset: true,
      })

      expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(
        UniswapEventName.DataReportSubmitted,
        expect.objectContaining({
          type: 'data',
          report_multichain_asset: true,
        }),
      )
    })
  })

  describe('submitTokenWarningDataReport', () => {
    it('sends report_multichain_asset false by default', () => {
      submitTokenWarningDataReport({
        chainId: UniverseChainId.Mainnet,
        tokenAddress: '0x789',
        tokenName: 'Test',
        reportText: 'warning seems wrong',
      })

      expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(
        UniswapEventName.DataReportSubmitted,
        expect.objectContaining({
          type: 'token_warning',
          text: 'warning seems wrong',
          report_multichain_asset: false,
        }),
      )
    })

    it('sends report_multichain_asset when true', () => {
      submitTokenWarningDataReport({
        chainId: UniverseChainId.Mainnet,
        tokenAddress: '0x789',
        reportText: 'warning seems wrong',
        reportMultichainAsset: true,
      })

      expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(
        UniswapEventName.DataReportSubmitted,
        expect.objectContaining({
          type: 'token_warning',
          report_multichain_asset: true,
        }),
      )
    })
  })

  describe('submitPoolDataReport', () => {
    const mockCurrency = {
      isNative: false,
      address: '0xabc',
      chainId: UniverseChainId.Mainnet,
    }

    it('sends text for Other option', () => {
      const reportTexts = new Map<PoolDataReportOption, string>([[PoolDataReportOption.Other, 'pool data is wrong']])

      submitPoolDataReport({
        poolId: 'pool-1',
        chainId: UniverseChainId.Mainnet,
        version: 3 as never,
        token0: mockCurrency as never,
        token1: mockCurrency as never,
        reportOptions: [PoolDataReportOption.Volume, PoolDataReportOption.Other],
        reportTexts,
      })

      expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(
        UniswapEventName.DataReportSubmitted,
        expect.objectContaining({
          type: 'pool',
          volume: true,
          something_else: true,
          text: 'pool data is wrong',
        }),
      )
    })

    it('sends undefined text when Other is not selected', () => {
      submitPoolDataReport({
        poolId: 'pool-2',
        chainId: UniverseChainId.Mainnet,
        version: 3 as never,
        token0: mockCurrency as never,
        token1: mockCurrency as never,
        reportOptions: [PoolDataReportOption.Volume],
        reportTexts: new Map(),
      })

      expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(
        UniswapEventName.DataReportSubmitted,
        expect.objectContaining({
          type: 'pool',
          volume: true,
          something_else: false,
          text: undefined,
        }),
      )
    })
  })

  describe('submitPortfolioDataReport', () => {
    it('sends performance and text when both options selected with text', () => {
      const reportTexts = new Map<PortfolioDataReportOption, string>([
        [PortfolioDataReportOption.Performance, 'balance is wrong'],
        [PortfolioDataReportOption.Other, 'something else is off'],
      ])

      submitPortfolioDataReport({
        reportOptions: [PortfolioDataReportOption.Performance, PortfolioDataReportOption.Other],
        reportTexts,
      })

      expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(
        UniswapEventName.DataReportSubmitted,
        expect.objectContaining({
          type: 'portfolio',
          performance: true,
          performance_text: 'balance is wrong',
          something_else: true,
          text: 'something else is off',
        }),
      )
    })

    it('sends only other when performance is not selected', () => {
      const reportTexts = new Map<PortfolioDataReportOption, string>([
        [PortfolioDataReportOption.Other, 'something seems off'],
      ])

      submitPortfolioDataReport({
        reportOptions: [PortfolioDataReportOption.Other],
        reportTexts,
      })

      expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(
        UniswapEventName.DataReportSubmitted,
        expect.objectContaining({
          type: 'portfolio',
          performance: false,
          performance_text: undefined,
          something_else: true,
          text: 'something seems off',
        }),
      )
    })

    it('sends undefined text when no text entries exist', () => {
      submitPortfolioDataReport({
        reportOptions: [PortfolioDataReportOption.Performance],
        reportTexts: new Map(),
      })

      expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(
        UniswapEventName.DataReportSubmitted,
        expect.objectContaining({
          type: 'portfolio',
          performance: true,
          performance_text: undefined,
          something_else: false,
          text: undefined,
        }),
      )
    })
  })
})
