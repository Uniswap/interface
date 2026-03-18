import { Config } from '@universe/config/src/config-types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export function getConfig(): Config {
  throw new PlatformSplitStubError('Use the correct getConfig for your platform')
}
