import { device } from 'detox'
import { permissions } from './utils/fixtures'

beforeAll(async () => {
  await device.installApp()
  await device.launchApp({
    newInstance: false,
    permissions,
  })
})
