import { PlatformSplitStubError } from 'utilities/src/errors'

export interface AppStartTimingArgs {
  ttiMillis: number
  jsBootTimeMillis: number
  nativeBootTimeMillis?: number
}

export async function reportAppStartTiming(_args: AppStartTimingArgs): Promise<void> {
  throw new PlatformSplitStubError('reportAppStartTiming')
}
