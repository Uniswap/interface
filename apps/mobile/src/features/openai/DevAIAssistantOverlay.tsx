import { useEffect, useState } from 'react'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

/**
 * Dynamically imported AIAssistantOverlay to allow for dev testing without
 * adding the openai package in production.
 */
export function DevAIAssistantOverlay(): JSX.Element | null {
  const openAIAssistantEnabled = useFeatureFlag(FeatureFlags.OpenAIAssistant)
  const [Component, setComponent] = useState<React.FC | null>(null)

  const enabled = __DEV__ && openAIAssistantEnabled

  useEffect(() => {
    if (enabled) {
      const getComponent = async (): Promise<void> => {
        const { AIAssistantOverlay } = await import('src/features/openai/AIAssistantOverlay')
        setComponent((): React.FC => AIAssistantOverlay)
      }
      getComponent().catch(() => {})
    }
  }, [enabled])

  if (!enabled) {
    return null
  }

  return Component ? <Component /> : null
}
