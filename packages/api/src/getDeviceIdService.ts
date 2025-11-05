import { createStorageDriver } from '@universe/api/src/storage/createStorageDriver'
import { createDeviceIdService, DeviceIdService } from '@universe/sessions'

const DEVICE_ID_KEY = 'UNISWAP_DEVICE_ID'

function getDeviceIdService(): DeviceIdService {
  const driver = createStorageDriver()

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

export { getDeviceIdService }
