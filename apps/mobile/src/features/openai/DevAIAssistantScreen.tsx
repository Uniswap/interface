import { useEffect, useState } from 'react'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

/**
 * Dynamically imported AIAssistantScreen to allow for dev testing without
 * adding the openai package in production.
 */
export function DevAIAssistantScreen(): JSX.Element | null {
  const openAIAssistantEnabled = useFeatureFlag(FeatureFlags.OpenAIAssistant)
  const [Component, setComponent] = useState<React.FC | null>(null)

  const enabled = __DEV__ && openAIAssistantEnabled

  useEffect(() => {
    if (enabled) {
      const getComponent = async (): Promise<void> => {
        const { AIAssistantScreen } = await import('src/features/openai/AIAssistantScreen')
        setComponent((): React.FC => AIAssistantScreen)
      }
      getComponent().catch(() => {})
    }
  }, [enabled])

  if (!openAIAssistantEnabled) {
    return null
  }

  return Component ? <Component /> : null
}
