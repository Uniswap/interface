import { createDeviceIdService, DeviceIdService } from '@universe/sessions'
import { getStorageDriver } from './storage/getStorageDriver'

const DEVICE_ID_KEY = 'UNISWAP_DEVICE_ID'

function provideDeviceIdService(): DeviceIdService {
  const driver = getStorageDriver()

  const service = createDeviceIdService({
    getDeviceId: async () => {
      const deviceId = await driver.get(DEVICE_ID_KEY)
      return deviceId || ''
    },
    setDeviceId: async (deviceId: string) => {
      await driver.set(DEVICE_ID_KEY, deviceId)
    },
    removeDeviceId: async () => {
      await driver.remove(DEVICE_ID_KEY)
    },
  })

  return service
}

export { provideDeviceIdService }
