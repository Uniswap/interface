export interface AppStartTimingArgs {
  ttiMillis: number
  jsBootTimeMillis: number
  nativeBootTimeMillis?: number
}

// App-start TTI is a mobile cold-start signal; no-op on web.
export async function reportAppStartTiming(_args: AppStartTimingArgs): Promise<void> {}
