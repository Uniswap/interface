import { PropsWithChildren, ReactNode, useEffect, useState } from 'react'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

type ProviderComponentType = ({ children }: { children: ReactNode }) => JSX.Element

/**
 * Dynamically imported OpenAIProvider to allow for dev testing without
 * adding the openai package in production.
 */
export const DevOpenAIProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const openAIAssistantEnabled = useFeatureFlag(FeatureFlags.OpenAIAssistant)
  const [OpenAIProvider, setOpenAIProvider] = useState<ProviderComponentType>()

  const enabled = __DEV__ && openAIAssistantEnabled

  useEffect(() => {
    if (enabled) {
      const getComponent = async (): Promise<void> => {
        const { OpenAIContextProvider } = await import('src/features/openai/OpenAIContext')
        setOpenAIProvider((): ProviderComponentType => OpenAIContextProvider)
      }
      getComponent().catch(() => {})
    }
  }, [enabled])

  if (!OpenAIProvider) {
    return <>{children}</>
  }

  return <OpenAIProvider>{children}</OpenAIProvider>
}
