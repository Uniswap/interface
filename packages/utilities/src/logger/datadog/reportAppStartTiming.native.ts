import { DdRum, RumActionType } from '@datadog/mobile-react-native'
import DeviceInfo from 'react-native-device-info'
import { DDRumAction, DDRumTiming } from 'utilities/src/logger/datadog/datadogEvents'

export interface AppStartTimingArgs {
  // Cold-start time-to-interactive (native process start -> first interactive screen), in ms.
  ttiMillis: number
  // Native->JS boot latency reported by the performance profiler, in ms.
  jsBootTimeMillis: number
  // Native-only boot time, when the platform exposes it separately from jsBootTimeMillis.
  nativeBootTimeMillis?: number
}

/**
 * Emits a custom, explicitly-named app-start signal we own instead of relying on the Datadog RN
 * SDK's automatic `application_start` action (which stopped emitting after the v2->v3 upgrade).
 *
 * Emits both a CUSTOM RUM action (source for our app-start metrics) and a view-level timing, so
 * the signal is durable across future SDK bumps. Callers must gate on `isDatadogEnabled()`.
 * RUM auto-attaches version/os.name/device.model; we duplicate them here so the action alone is
 * self-describing when queried as a custom metric.
 */
export async function reportAppStartTiming({
  ttiMillis,
  jsBootTimeMillis,
  nativeBootTimeMillis,
}: AppStartTimingArgs): Promise<void> {
  await DdRum.addAction(RumActionType.CUSTOM, DDRumAction.AppStartTti, {
    loading_time: ttiMillis,
    js_boot_time_ms: jsBootTimeMillis,
    ...(nativeBootTimeMillis !== undefined ? { native_boot_time_ms: nativeBootTimeMillis } : {}),
    app_version: DeviceInfo.getVersion(),
    os_name: DeviceInfo.getSystemName(),
    device_model: DeviceInfo.getModel(),
  })
  await DdRum.addTiming(DDRumTiming.AppStartTti)
}
