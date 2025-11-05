/**
 * Device ID provider interface
 * Platform-specific implementations handle device identification
 */
interface DeviceIdService {
  getDeviceId(): Promise<string | null>
  setDeviceId(deviceId: string): Promise<void>
  removeDeviceId(): Promise<void>
}

export type { DeviceIdService }
