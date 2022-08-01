import { useFeatureFlagContext } from './provider'

enum Phase0Variant {
  Control = 'Control',
  Enabled = 'Enabled',
}

export function useFeatureFlagsLoaded(): boolean {
  return useFeatureFlagContext().isLoaded
}

export function usePhase0Flag(): Phase0Variant {
  const phase0Variant = useFeatureFlagContext().flags['phase0']
  switch (phase0Variant) {
    case 'enabled':
      return Phase0Variant.Enabled
    default:
      return Phase0Variant.Control
  }
}
