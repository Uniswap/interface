import type { DeviceIdService } from '@universe/sessions/src/device-id/types'

function createDeviceIdService(ctx: {
  getDeviceId: () => Promise<string>
  setDeviceId: (deviceId: string) => Promise<void>
  removeDeviceId: () => Promise<void>
}): DeviceIdService {
  const getDeviceId = ctx.getDeviceId
  const setDeviceId = ctx.setDeviceId
  const removeDeviceId = ctx.removeDeviceId

  return {
    getDeviceId,
    setDeviceId,
    removeDeviceId,
  }
}

export { createDeviceIdService }
