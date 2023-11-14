import { isDevelopmentEnv, isProductionEnv, isStagingEnv, isTestEnv } from './env'

describe('env', () => {
  const ENV = process.env
  afterEach(() => {
    process.env = ENV
  })

  function setEnv(env: Record<string, unknown>) {
    process.env = {
      PUBLIC_URL: 'http://example.com',
      NODE_ENV: 'development',
      ...env,
    }
  }

  it('isDevelopmentEnv is true if NODE_ENV=development', () => {
    setEnv({ NODE_ENV: 'development' })
    expect(isDevelopmentEnv()).toBe(true)
  })

  it('isTestEnv is true if NODE_ENV=test', () => {
    setEnv({ NODE_ENV: 'test' })
    expect(isTestEnv()).toBe(true)
  })

  it('isStagingEnv is true REACT_APP_STAGING=1', () => {
    setEnv({ REACT_APP_STAGING: 1 })
    expect(isStagingEnv()).toBe(true)
  })

  describe('isProductionEnv', () => {
    it('is true if NODE_ENV=production', () => {
      setEnv({ NODE_ENV: 'production' })
      expect(isProductionEnv()).toBe(true)
    })

    it('is false if NODE_ENV=production and REACT_APP_STAGING=1', () => {
      setEnv({ NODE_ENV: 'production', REACT_APP_STAGING: 1 })
      expect(isProductionEnv()).toBe(false)
    })
  })
})
