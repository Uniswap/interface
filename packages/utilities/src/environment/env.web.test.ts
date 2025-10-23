import { isBetaEnv, isDevEnv, isPlaywrightEnv, isProdEnv, isTestEnv } from 'utilities/src/environment/env.web'

const UserAgentMock = jest.requireMock('utilities/src/platform')
jest.mock('utilities/src/platform', () => ({
  ...jest.requireActual('utilities/src/platform'),
}))

describe('env', () => {
  beforeEach(() => {
    UserAgentMock.isWebApp = false
    process.env = {}
  })

  describe('isTestEnv', () => {
    it('should return true', () => {
      process.env.NODE_ENV = 'test'
      expect(isTestEnv()).toBe(true)
    })
  })

  describe('isPlaywrightEnv', () => {
    it('should return false', () => {
      expect(isPlaywrightEnv()).toBe(false)
    })

    it('should return true', () => {
      window.__playwright__binding__ = {}
      expect(isPlaywrightEnv()).toBe(true)
    })
  })

  describe('isDevEnv', () => {
    it('should return false', () => {
      expect(isDevEnv()).toBe(false)
    })

    it('should return true', () => {
      UserAgentMock.isWebApp = true
      process.env.NODE_ENV = 'development'
      expect(isDevEnv()).toBe(true)
    })
  })

  describe('isBetaEnv', () => {
    it('should return false', () => {
      expect(isBetaEnv()).toBe(false)
    })

    it('should return true', () => {
      UserAgentMock.isWebApp = true
      process.env.REACT_APP_STAGING = 'true'
      expect(isBetaEnv()).toBe(true)
    })
  })

  describe('isProdEnv', () => {
    it('should return false', () => {
      expect(isProdEnv()).toBe(false)
    })

    it('should return true', () => {
      UserAgentMock.isWebApp = true
      process.env.NODE_ENV = 'production'
      expect(isProdEnv()).toBe(true)
    })
  })
})
