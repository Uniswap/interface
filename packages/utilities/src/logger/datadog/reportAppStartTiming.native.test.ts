import { DdRum, RumActionType } from '@datadog/mobile-react-native'
import { reportAppStartTiming } from 'utilities/src/logger/datadog/reportAppStartTiming.native'

vi.mock('@datadog/mobile-react-native', () => ({
  DdRum: { addAction: vi.fn(), addTiming: vi.fn() },
  RumActionType: { CUSTOM: 'CUSTOM' },
}))
vi.mock('react-native-device-info', () => ({
  default: { getVersion: () => '1.86', getSystemName: () => 'iOS', getModel: () => 'iPhone16,1' },
}))

// The app_start_tti RUM metrics and monitor in packages/datadog-cloud filter on this exact shape.
describe(reportAppStartTiming, () => {
  it('emits the app_start_tti custom action with the attributes the RUM metrics read', async () => {
    await reportAppStartTiming({ ttiMillis: 1200, jsBootTimeMillis: 900 })

    expect(DdRum.addAction).toHaveBeenCalledWith(
      RumActionType.CUSTOM,
      'app_start_tti',
      expect.objectContaining({ loading_time: 1200, js_boot_time_ms: 900 }),
    )
    expect(DdRum.addTiming).toHaveBeenCalledWith('app_start_tti')
  })
})
