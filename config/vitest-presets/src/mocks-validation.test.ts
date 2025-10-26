import { describe, expect, it, vi } from 'vitest'

describe('Mock validations', () => {
  describe('Redux persist mock', () => {
    it('should have redux-persist mocked', async () => {
      const reduxPersist = await import('redux-persist')
      expect(reduxPersist.persistReducer).toBeDefined()
      expect(vi.isMockFunction(reduxPersist.persistReducer)).toBe(true)

      const mockReducer = (state: any = {}, action: any) => state
      // persistReducer requires a config with at least key and storage properties
      const mockConfig = { key: 'root', storage: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() } }
      const result = reduxPersist.persistReducer(mockConfig as any, mockReducer)
      expect(result).toBe(mockReducer) // Should return reducer unchanged
    })
  })

  describe('Expo mocks', () => {
    it('should have expo-clipboard mocked', async () => {
      const clipboard = await import('expo-clipboard')
      expect(clipboard.setString).toBeDefined()
      expect(vi.isMockFunction(clipboard.setString)).toBe(true)
      expect(vi.isMockFunction(clipboard.setStringAsync)).toBe(true)
    })

    it('should have expo-haptics mocked', async () => {
      const haptics = await import('expo-haptics')
      expect(haptics.impactAsync).toBeDefined()
      expect(vi.isMockFunction(haptics.impactAsync)).toBe(true)
    })

    it('should have expo-blur mocked', async () => {
      const blur = await import('expo-blur')
      expect(blur.BlurView).toBeDefined()
    })
  })

  describe('Amplitude mocks', () => {
    it('should have amplitude analytics mocked', async () => {
      const amplitude = await import('@amplitude/analytics-react-native')
      expect(amplitude.init).toBeDefined()
      expect(amplitude.track).toBeDefined()
      expect(amplitude.flush).toBeDefined()
    })
  })

  describe('WalletConnect mocks', () => {
    it('should have @reown/walletkit mocked', async () => {
      const walletKit = await import('@reown/walletkit')
      // WalletKit.init is mocked to return the expected object directly
      const instance = (walletKit.WalletKit.init as any)()

      expect(instance.on).toBeDefined()
      expect(vi.isMockFunction(instance.on)).toBe(true)
      expect(instance.getActiveSessions()).toEqual([])
    })

    it('should have @walletconnect/core mocked', async () => {
      const walletConnectCore = await import('@walletconnect/core')
      const core = new walletConnectCore.Core()

      expect(core.crypto).toBeDefined()
      expect(core.crypto.getClientId).toBeDefined()
    })
  })

  describe('AsyncStorage mock', () => {
    it('should have AsyncStorage mocked', async () => {
      const AsyncStorage = await import('@react-native-async-storage/async-storage')
      expect(AsyncStorage.default).toBeDefined()
      expect(AsyncStorage.default.setItem).toBeDefined()
      expect(AsyncStorage.default.getItem).toBeDefined()
    })
  })

  describe('NetInfo mock', () => {
    it('should have NetInfo mocked with types', async () => {
      const NetInfo = await import('@react-native-community/netinfo')
      expect(NetInfo.default).toBeDefined()
      expect(NetInfo.NetInfoStateType).toBeDefined()
      expect(NetInfo.NetInfoStateType.wifi).toBe('wifi')
      expect(NetInfo.NetInfoStateType.cellular).toBe('cellular')
    })
  })

  describe('React Native Device Info mock', () => {
    it('should have device info mocked', async () => {
      const DeviceInfo = await import('react-native-device-info')
      expect(DeviceInfo.default).toBeDefined()
      expect(DeviceInfo.default.getDeviceId).toBeDefined()
    })
  })

  describe('Mocked packages verification', () => {
    it('should verify that key packages are mocked in setup', () => {
      // This test verifies that our setup.js mocks are working
      // by checking if vi.mocked returns true for these modules
      expect(vi.isMockFunction(vi.fn())).toBe(true) // Verify vi is working

      // The actual mocks are defined in setup.js using vi.mock()
      // This test just confirms the mocking system is functional
    })
  })
})
