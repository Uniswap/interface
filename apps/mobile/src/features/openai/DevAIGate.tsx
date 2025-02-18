import { PropsWithChildren, ReactNode, useEffect, useState } from 'react'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

/**
 * Note: It seems like the RN bundler can only compile code within
 * the same file to determine if a package should be bundled or not.
 */
import { INCLUDE_PROTOTYPE_FEATURES } from 'react-native-dotenv'
const enabledInEnv = INCLUDE_PROTOTYPE_FEATURES === 'true' || process.env.INCLUDE_PROTOTYPE_FEATURES === 'true'

/**
 * Dynamically imported AIAssistantOverlay to allow for dev testing without
 * adding the openai package in production.
 */
export function DevAIAssistantOverlay(): JSX.Element | null {
  const openAIAssistantEnabled = useFeatureFlag(FeatureFlags.OpenAIAssistant)
  const [Component, setComponent] = useState<React.FC | null>(null)

  const enabled = enabledInEnv && openAIAssistantEnabled

  useEffect(() => {
    if (enabled) {
      const getComponent = async (): Promise<void> => {
        const { AIAssistantOverlay } = await import('src/features/openai/AIAssistantOverlay')
        setComponent((): React.FC => AIAssistantOverlay)
      }
      getComponent().catch(() => {})
    }
  }, [enabled])

  return enabled ? Component ? <Component /> : null : null
}

type ProviderComponentType = ({ children }: { children: ReactNode }) => JSX.Element

/**
 * Dynamically imported OpenAIProvider to allow for dev testing without
 * adding the openai package in production.
 */
export const DevOpenAIProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const openAIAssistantEnabled = useFeatureFlag(FeatureFlags.OpenAIAssistant)
  const [OpenAIProvider, setOpenAIProvider] = useState<ProviderComponentType>()

  const enabled = enabledInEnv && openAIAssistantEnabled

  useEffect(() => {
    if (enabled) {
      const getComponent = async (): Promise<void> => {
        const { OpenAIContextProvider } = await import('src/features/openai/OpenAIContext')
        setOpenAIProvider((): ProviderComponentType => OpenAIContextProvider)
      }
      getComponent().catch(() => {})
    }
  }, [enabled])

  return OpenAIProvider && enabled ? <OpenAIProvider>{children}</OpenAIProvider> : <>{children}</>
}

/**
 * Dynamically imported AIAssistantScreen to allow for dev testing without
 * adding the openai package in production.
 */
export function DevAIAssistantScreen(): JSX.Element | null {
  const openAIAssistantEnabled = useFeatureFlag(FeatureFlags.OpenAIAssistant)
  const [Component, setComponent] = useState<React.FC | null>(null)
  const enabled = enabledInEnv && openAIAssistantEnabled

  useEffect(() => {
    if (enabled) {
      const getComponent = async (): Promise<void> => {
        const { AIAssistantScreen } = await import('src/features/openai/AIAssistantScreen')
        setComponent((): React.FC => AIAssistantScreen)
      }
      getComponent().catch(() => {})
    }
  }, [enabled])

  return enabled ? Component ? <Component /> : null : null
}
