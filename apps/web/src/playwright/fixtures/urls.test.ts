/* eslint-disable no-relative-import-paths/no-relative-import-paths -- Vitest confuses this 'playwright' folder with the library */
import { FeatureFlags } from '@universe/gating'
import { describe, expect, it } from 'vitest'
import { createTestUrlBuilder } from './urls'

describe('createTestUrlBuilder', () => {
  describe('basic URL building', () => {
    it('should create URL with baseUrl only', () => {
      const buildUrl = createTestUrlBuilder({ basePath: 'https://uniswap.org' })
      const url = buildUrl({})
      expect(url).toBe('https://uniswap.org/')
    })

    it('should append subpath to baseUrl', () => {
      const buildUrl = createTestUrlBuilder({ basePath: 'https://uniswap.org' })
      const url = buildUrl({ subPath: '/swap' })
      expect(url).toBe('https://uniswap.org/swap')
    })

    it('should handle baseUrl with existing path', () => {
      const buildUrl = createTestUrlBuilder({ basePath: 'https://uniswap.org/app' })
      const url = buildUrl({ subPath: '/swap' })
      expect(url).toBe('https://uniswap.org/app/swap')
    })

    it('should handle relative baseUrl with root path', () => {
      const buildUrl = createTestUrlBuilder({ basePath: '/' })
      const url = buildUrl({ subPath: '/swap' })
      expect(url).toContain('/swap')
    })

    it('should handle relative baseUrl with subpath', () => {
      const buildUrl = createTestUrlBuilder({ basePath: '/test' })
      const url = buildUrl({ subPath: '/test/pool' })
      expect(url).toContain('/test/pool')
    })

    it('should add query params to relative baseUrl', () => {
      const buildUrl = createTestUrlBuilder({ basePath: '/' })
      const url = buildUrl({ queryParams: { chain: 'mainnet' } })
      expect(url).toBe('/?chain=mainnet')
    })

    it('should add feature flags to relative baseUrl', () => {
      const buildUrl = createTestUrlBuilder({ basePath: '/test' })
      const url = buildUrl({ featureFlags: { [FeatureFlags.AATestWeb]: true } })
      expect(url).toContain('featureFlagOverride=')
      expect(url).toContain('aatest_web')
    })
  })

  describe('query parameters', () => {
    it('should add single query parameter', () => {
      const buildUrl = createTestUrlBuilder({ basePath: 'https://uniswap.org' })
      const url = buildUrl({ queryParams: { foo: 'bar' } })
      expect(url).toBe('https://uniswap.org/?foo=bar')
    })

    it('should add multiple query parameters', () => {
      const buildUrl = createTestUrlBuilder({ basePath: 'https://uniswap.org' })
      const url = buildUrl({ queryParams: { foo: 'bar', baz: 'qux' } })
      expect(url).toContain('foo=bar')
      expect(url).toContain('baz=qux')
    })

    it('should use default query parameters', () => {
      const buildUrl = createTestUrlBuilder({
        basePath: 'https://uniswap.org',
        defaultQueryParams: { defaultKey: 'defaultValue' },
      })
      const url = buildUrl({})
      expect(url).toBe('https://uniswap.org/?defaultKey=defaultValue')
    })

    it('should merge default and custom query parameters', () => {
      const buildUrl = createTestUrlBuilder({
        basePath: 'https://uniswap.org',
        defaultQueryParams: { default: 'value' },
      })
      const url = buildUrl({ queryParams: { custom: 'param' } })
      expect(url).toContain('default=value')
      expect(url).toContain('custom=param')
    })

    it('should override default query parameters with custom ones', () => {
      const buildUrl = createTestUrlBuilder({
        basePath: 'https://uniswap.org',
        defaultQueryParams: { key: 'default' },
      })
      const url = buildUrl({ queryParams: { key: 'override' } })
      expect(url).toBe('https://uniswap.org/?key=override')
      expect(url).not.toContain('key=default')
    })
  })

  describe('feature flags', () => {
    it('should add enabled feature flag', () => {
      const buildUrl = createTestUrlBuilder({ basePath: 'https://uniswap.org' })
      const url = buildUrl({ featureFlags: { [FeatureFlags.AATestWeb]: true } })
      expect(url).toBe('https://uniswap.org/?featureFlagOverride=aatest_web')
    })

    it('should add disabled feature flag', () => {
      const buildUrl = createTestUrlBuilder({ basePath: 'https://uniswap.org' })
      const url = buildUrl({ featureFlags: { [FeatureFlags.AATestWeb]: false } })
      expect(url).toBe('https://uniswap.org/?featureFlagOverrideOff=aatest_web')
    })

    it('should add multiple enabled feature flags', () => {
      const buildUrl = createTestUrlBuilder({ basePath: 'https://uniswap.org' })
      const url = buildUrl({
        featureFlags: { [FeatureFlags.AATestWeb]: true, [FeatureFlags.PortfolioPage]: true },
      })
      expect(url).toContain('featureFlagOverride=')
      expect(url).toContain('aatest_web')
      expect(url).toContain('portfolio_page')
    })

    it('should add multiple disabled feature flags', () => {
      const buildUrl = createTestUrlBuilder({ basePath: 'https://uniswap.org' })
      const url = buildUrl({
        featureFlags: { [FeatureFlags.AATestWeb]: false, [FeatureFlags.PortfolioPage]: false },
      })
      expect(url).toContain('featureFlagOverrideOff=')
      expect(url).toContain('aatest_web')
      expect(url).toContain('portfolio_page')
    })

    it('should separate enabled and disabled feature flags', () => {
      const buildUrl = createTestUrlBuilder({ basePath: 'https://uniswap.org' })
      const url = buildUrl({ featureFlags: { [FeatureFlags.AATestWeb]: true, [FeatureFlags.PortfolioPage]: false } })

      expect(url).toContain('featureFlagOverride=aatest_web')
      expect(url).toContain('featureFlagOverrideOff=portfolio_page')
    })

    it('should use default feature flags', () => {
      const buildUrl = createTestUrlBuilder({
        basePath: 'https://uniswap.org',
        defaultFeatureFlags: { [FeatureFlags.AATestWeb]: true },
      })
      const url = buildUrl({})
      expect(url).toBe('https://uniswap.org/?featureFlagOverride=aatest_web')
    })

    it('should merge default and custom feature flags', () => {
      const buildUrl = createTestUrlBuilder({
        basePath: 'https://uniswap.org',
        defaultFeatureFlags: { [FeatureFlags.AATestWeb]: true },
      })
      const url = buildUrl({ featureFlags: { [FeatureFlags.PortfolioPage]: true } })
      expect(url).toContain('featureFlagOverride=')
      expect(url).toContain('aatest_web')
      expect(url).toContain('portfolio_page')
    })

    it('should override default feature flags with custom ones', () => {
      const buildUrl = createTestUrlBuilder({
        basePath: 'https://uniswap.org',
        defaultFeatureFlags: { [FeatureFlags.PortfolioPage]: true },
      })
      const url = buildUrl({ featureFlags: { [FeatureFlags.PortfolioPage]: false } })
      expect(url).toBe('https://uniswap.org/?featureFlagOverrideOff=portfolio_page')
      expect(url).not.toContain('featureFlagOverride=')
    })
  })

  describe('combined parameters', () => {
    it('should combine subpath, query params, and feature flags', () => {
      const buildUrl = createTestUrlBuilder({ basePath: 'https://uniswap.org' })
      const url = buildUrl({
        subPath: '/swap',
        queryParams: { chain: 'mainnet' },
        featureFlags: { [FeatureFlags.AATestWeb]: true, [FeatureFlags.PortfolioPage]: false },
      })
      expect(url).toContain('/swap')
      expect(url).toContain('chain=mainnet')
      expect(url).toContain('featureFlagOverride=aatest_web')
      expect(url).toContain('featureFlagOverrideOff=portfolio_page')
    })

    it('should combine relative baseUrl with all options', () => {
      const buildUrl = createTestUrlBuilder({
        basePath: '/test',
        defaultQueryParams: { env: 'test' },
        defaultFeatureFlags: { [FeatureFlags.AATestWeb]: true },
      })
      const url = buildUrl({
        subPath: '/swap',
        queryParams: { token: 'ETH' },
        featureFlags: { [FeatureFlags.PortfolioPage]: false },
      })
      expect(url).toContain('/test/swap')
      expect(url).toContain('env=test')
      expect(url).toContain('token=ETH')
      expect(url).toContain('featureFlagOverride=aatest_web')
      expect(url).toContain('featureFlagOverrideOff=portfolio_page')
    })
  })

  describe('edge cases', () => {
    it('should handle empty subpath string', () => {
      const buildUrl = createTestUrlBuilder({ basePath: 'https://uniswap.org' })
      const url = buildUrl({ subPath: '' })
      expect(url).toBe('https://uniswap.org/')
    })

    it('should handle subpath without leading slash', () => {
      const buildUrl = createTestUrlBuilder({ basePath: 'https://uniswap.org' })
      const url = buildUrl({ subPath: 'swap' })
      expect(url).toBe('https://uniswap.org/swap')
    })

    it('should handle empty query params object', () => {
      const buildUrl = createTestUrlBuilder({ basePath: 'https://uniswap.org' })
      const url = buildUrl({ queryParams: {} })
      expect(url).toBe('https://uniswap.org/')
    })

    it('should handle empty feature flags object', () => {
      const buildUrl = createTestUrlBuilder({ basePath: 'https://uniswap.org' })
      const url = buildUrl({ featureFlags: {} })
      expect(url).toBe('https://uniswap.org/')
    })

    it('should handle special characters in query params', () => {
      const buildUrl = createTestUrlBuilder({ basePath: 'https://uniswap.org' })
      const url = buildUrl({ queryParams: { key: 'value with spaces' } })
      expect(url).toBe('https://uniswap.org/?key=value+with+spaces')
    })
  })
})
