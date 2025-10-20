/**
 * Device ID provider interface
 * Platform-specific implementations handle device identification
 */
interface DeviceIdService {
  /**
   * Get or generate device ID
   * - iOS/Android: System-provided ID
   * - Extension: Generated UUID
   * - Web: Not used (EGW handles)
   */
  getDeviceId(): Promise<string>
}

export type { DeviceIdService }
