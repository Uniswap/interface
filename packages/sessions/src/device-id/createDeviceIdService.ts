import type { QueryClient } from '@tanstack/react-query'
import type { DeviceIdService } from '@universe/sessions/src/device-id/types'
import { uniqueIdQuery } from 'utilities/src/device/uniqueIdQuery'

function createDeviceIdService(ctx: { queryClient: QueryClient }): DeviceIdService {
  async function getDeviceId(): Promise<string> {
    const data = await ctx.queryClient.ensureQueryData(uniqueIdQuery())
    return data
  }

  return {
    getDeviceId,
  }
}

export { createDeviceIdService }
