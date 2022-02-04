import { device } from 'detox'

beforeAll(async () => {
  await device.installApp()
  await device.launchApp({
    newInstance: false,
    permissions: { faceid: 'YES' },
  })
})
