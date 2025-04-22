import { useApolloClient } from '@apollo/client'
import OpenAI from 'openai'
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking } from 'react-native'
import { useDispatch } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { openModal } from 'src/features/modals/modalSlice'
import { ASSISTANT_ID, openai } from 'src/features/openai/assistant'
import { FunctionName, PossibleFunctionArgs } from 'src/features/openai/functions'
import { WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import {
  SearchTokensDocument,
  TokenDetailsScreenDocument,
  TopTokensDocument,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { AssetType, CurrencyAsset } from 'uniswap/src/entities/assets'
import { DEFAULT_NATIVE_ADDRESS } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel, toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { usePortfolioBalances, useTokenBalancesGroupedByVisibility } from 'uniswap/src/features/dataApi/balances'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { CurrencyField } from 'uniswap/src/types/currency'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { getUniqueId } from 'utilities/src/device/getUniqueId'
import { logger } from 'utilities/src/logger/logger'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { AppearanceSettingType, setSelectedAppearanceSettings } from 'wallet/src/features/appearance/slice'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccountAddress, useSignerAccounts } from 'wallet/src/features/wallet/hooks'

export type OpenAIContextState = {
  isOpen: boolean
  isLoading: boolean
  messages: Message[]
  open: () => void
  close: () => void
  sendMessage: (message: string) => void
}

const initialState: OpenAIContextState = {
  isOpen: false,
  isLoading: false,
  messages: [],
  open: () => {},
  close: () => {},
  sendMessage: () => {},
}

export const OpenAIContext = createContext<OpenAIContextState>(initialState)

export type Button = {
  functionName: FunctionName
  text: string
}
export type Message = {
  text: string
  role: 'user' | 'assistant'
  buttons: Button[]
}

async function handleRunStatus(
  threadId: string,
  run: OpenAI.Beta.Threads.Runs.Run,
  processMessages: () => void,
  toolsMap: Record<FunctionName, (args: PossibleFunctionArgs) => Promise<unknown>>,
): Promise<void> {
  if (run.status === 'completed') {
    processMessages()
  } else if (run.status === 'requires_action') {
    await handleRequiresAction(threadId, run, processMessages, toolsMap)
  } else {
    logger.debug('OpenAIContext.tsx', 'handleRunStatus', `Run did not complete: ${run.id}`)
  }
}

async function handleRequiresAction(
  threadId: string,
  run: OpenAI.Beta.Threads.Runs.Run,
  processMessages: () => void,
  toolsMap: Record<FunctionName, (args: object) => Promise<unknown>>,
): Promise<void> {
  const toolOutputsPromises: Promise<OpenAI.Beta.Threads.Runs.RunSubmitToolOutputsParams.ToolOutput>[] =
    run.required_action?.submit_tool_outputs.tool_calls.map(async (tool) => {
      const toolFunction = toolsMap[tool.function.name as FunctionName]
      if (toolFunction) {
        const args = JSON.parse(tool.function.arguments)
        const output = JSON.stringify(await toolFunction(args))
        return {
          tool_call_id: tool.id,
          output,
        }
      }

      return {}
    }) ?? []

  const toolOutputs = await Promise.all(toolOutputsPromises)

  // Submit all tool outputs at once after collecting them in a list
  if (toolOutputs.length > 0) {
    run = await openai.beta.threads.runs.submitToolOutputsAndPoll(threadId, run.id, {
      tool_outputs: toolOutputs,
    })
  }

  // Check status after submitting tool outputs
  return handleRunStatus(threadId, run, processMessages, toolsMap)
}

export function OpenAIContextProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const featureEnabled = useFeatureFlag(FeatureFlags.OpenAIAssistant)

  return featureEnabled ? <_OpenAIContextProvider>{children}</_OpenAIContextProvider> : <>{children}</>
}

function _OpenAIContextProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mainThread, setMainThread] = useState<OpenAI.Beta.Threads.Thread>()
  const [messages, setMessages] = useState<Message[]>([])
  const { navigateToSwapFlow, navigateToSend } = useWalletNavigation()
  const dispatch = useDispatch()
  const { t } = useTranslation()

  // Temporarily hard-coding swap warning for testing purposes, need to be replaced with hook
  const [swapSwarning, _setSwapWarning] = useState({
    type: WarningLabel.InsufficientGasFunds,
    severity: WarningSeverity.Medium,
    action: WarningAction.DisableSubmit,
    title: t('swap.warning.insufficientGas.title', {
      currencySymbol: 'ETH',
    }),
  })

  const activeAddress = useActiveAccountAddress() || undefined
  const { gqlChains } = useEnabledChains()

  const signerAccount = useSignerAccounts()[0]
  // We sync backup state across all accounts under the same mnemonic, so can check status with any account.
  const hasCloudBackup = signerAccount?.backups?.includes(BackupType.Cloud)
  const apollo = useApolloClient()

  const { data: balancesById } = usePortfolioBalances({
    address: activeAddress,
    fetchPolicy: 'cache-and-network',
  })
  const { shownTokens } = useTokenBalancesGroupedByVisibility({
    balancesById,
  })

  const toolsMap: Record<FunctionName, (args: PossibleFunctionArgs) => Promise<unknown>> = useMemo(() => {
    return {
      [FunctionName.BackupCloud]: async (): Promise<object> => {
        navigate(MobileScreens.SettingsStack, {
          screen: hasCloudBackup
            ? MobileScreens.SettingsCloudBackupStatus
            : MobileScreens.SettingsCloudBackupPasswordCreate,
          params: { address: signerAccount?.address ?? '' },
        })
        return { success: true }
      },
      [FunctionName.BackupManual]: async (): Promise<object> => {
        navigate(MobileScreens.SettingsStack, {
          screen: MobileScreens.SettingsViewSeedPhrase,
          params: { address: signerAccount?.address ?? '', walletNeedsRestore: false },
        })
        return { success: true }
      },
      [FunctionName.GetTopTokens]: async (args): Promise<object> => {
        const { chain, sortBy, pageSize } = args
        const { data } = await apollo.query({
          query: TopTokensDocument,
          variables: { chain, topTokensOrderBy: sortBy, pageSize },
        })

        return { data }
      },
      [FunctionName.GetTokenDetails]: async (args): Promise<object> => {
        const { chain, address } = args
        const { data } = await apollo.query({
          query: TokenDetailsScreenDocument,
          variables: { chain, address },
        })
        return { data }
      },
      [FunctionName.GetWalletPortfolioBalances]: async (): Promise<object> => {
        shownTokens?.forEach((balance) => {
          const chainId = toSupportedChainId(balance.currencyInfo.currency.chainId)
          return {
            ...balance.currencyInfo.currency,
            chainName: chainId ? getChainLabel(chainId) : 'unknown',
          }
        })

        return { data: shownTokens }
      },
      [FunctionName.GetSwapWarning]: async (): Promise<object> => {
        return { data: swapSwarning }
      },
      [FunctionName.SettingChangeAppearance]: async (args): Promise<object> => {
        const { appearanceSettingType } = args

        dispatch(setSelectedAppearanceSettings(appearanceSettingType as AppearanceSettingType))
        return { success: true }
      },
      [FunctionName.SearchTokens]: async (args): Promise<object> => {
        const { text, chain } = args
        const { data } = await apollo.query({
          query: SearchTokensDocument,
          variables: { searchQuery: text, chains: chain ? [chain] : gqlChains },
        })
        return { data }
      },
      [FunctionName.SearchRecipients]: async (): Promise<object> => {
        // Should be using getOnChainEnsFetch but needs work, temporarily using hayden
        return {
          data: [{ address: '0x50EC05ADe8280758E2077fcBC08D878D4aef79C3', name: 'hayden.eth' }],
        }
      },
      [FunctionName.StartSwap]: async (args): Promise<object> => {
        const { chainId, inputTokenAddress, outputTokenAddress, outputTokenAmount, isSwappingAll } = args
        let { inputTokenAmount } = args

        if (!chainId || !inputTokenAmount || !inputTokenAddress || !outputTokenAddress) {
          return { error: 'Missing required parameters' }
        }

        const inputAsset = {
          address: inputTokenAddress,
          chainId,
          type: AssetType.Currency,
        } satisfies CurrencyAsset
        const outputAsset = {
          address: outputTokenAddress,
          chainId,
          type: AssetType.Currency,
        } satisfies CurrencyAsset

        if (isSwappingAll) {
          if (inputTokenAddress === DEFAULT_NATIVE_ADDRESS) {
            inputTokenAmount -= chainId === UniverseChainId.Mainnet ? 0.005 : 0.001
            inputTokenAmount = Math.max(inputTokenAmount, 0)
          }
        } else {
          inputTokenAmount = Math.max(inputTokenAmount - 0.00001, 0)
        }

        setTimeout(() => {
          navigateToSwapFlow({
            initialState: {
              exactCurrencyField: inputTokenAmount ? CurrencyField.INPUT : CurrencyField.OUTPUT,
              exactAmountToken: inputTokenAmount?.toString() ?? outputTokenAmount?.toString() ?? '',
              [CurrencyField.INPUT]: inputAsset,
              [CurrencyField.OUTPUT]: outputAsset,
            },
          })
        }, 8000)

        return { success: true }
      },
      [FunctionName.StartSend]: async (args): Promise<object> => {
        const { chainId, inputTokenAddress, inputTokenUSD, recipientAddress, isSwappingAll } = args
        let { inputTokenAmount } = args
        if (!inputTokenAddress || !chainId || !recipientAddress) {
          return { error: 'Missing required parameters' }
        }

        const inputAsset = {
          address: inputTokenAddress,
          chainId,
          type: AssetType.Currency,
        } satisfies CurrencyAsset

        if (isSwappingAll && inputTokenAmount !== undefined) {
          if (inputTokenAddress === DEFAULT_NATIVE_ADDRESS) {
            inputTokenAmount -= chainId === UniverseChainId.Mainnet ? 0.005 : 0.001
            inputTokenAmount = Math.max(inputTokenAmount, 0)
          }
        }

        navigateToSend({
          initialState: {
            exactCurrencyField: CurrencyField.INPUT,
            exactAmountToken: inputTokenAmount?.toString() ?? '',
            exactAmountFiat: inputTokenUSD?.toString() ?? '',
            recipient: recipientAddress,
            [CurrencyField.INPUT]: inputAsset,
            [CurrencyField.OUTPUT]: null,
          },
        })
        return { success: true }
      },
      [FunctionName.NavigateToFiatOnramp]: async (): Promise<object> => {
        dispatch(
          openModal({
            name: ModalName.FiatOnRampAggregator,
          }),
        )
        return { success: true }
      },
    }
  }, [
    apollo,
    dispatch,
    hasCloudBackup,
    navigateToSend,
    navigateToSwapFlow,
    shownTokens,
    signerAccount?.address,
    swapSwarning,
    gqlChains,
  ])

  const processMessages = useCallback(async () => {
    if (!mainThread) {
      return
    }

    setIsLoading(false)

    const messageResponse = await openai.beta.threads.messages.list(mainThread?.id)
    const newMessages = messageResponse.data
      .map((messageData): Message => {
        const text = messageData.content.reduce((acc, curr) => {
          if (curr.type === 'text') {
            try {
              return acc + JSON.parse(curr.text.value).message
            } catch {
              return acc + curr.text.value
            }
          }
          return acc
        }, '')

        const buttons = messageData.content.reduce<Button[]>((acc, curr) => {
          if (curr.type === 'text') {
            try {
              const localButtons = (JSON.parse(curr.text.value).buttons as Button[]) ?? []
              acc.push(...localButtons)
            } catch {
              // noop
            }
          }
          return acc
        }, [])

        return {
          text,
          buttons,
          role: messageData.role,
        }
      })
      .reverse()
    setMessages(newMessages)
  }, [mainThread])

  useEffect(() => {
    async function setup(): Promise<void> {
      const uniqueId = await getUniqueId()
      const thread = await openai.beta.threads.create({
        metadata: { userId: uniqueId, username: 'ggeri' },
      })
      setMainThread(thread)
    }

    setup().catch((error) =>
      logger.debug('OpenAIContext.tsx', 'useEffect', `Failed into initiate main thread due to: ${error}`),
    )
  }, [])

  const sendMessage = useCallback(
    async (message: string) => {
      if (!mainThread) {
        return
      }

      setIsLoading(true)
      await openai.beta.threads.messages.create(mainThread?.id, {
        role: 'user',
        content: message,
      })
      const run = await openai.beta.threads.runs.createAndPoll(mainThread?.id, {
        assistant_id: ASSISTANT_ID,
      })
      await handleRunStatus(mainThread?.id, run, processMessages, toolsMap)
    },
    [mainThread, processMessages, toolsMap],
  )

  useEffect(() => {
    if (mainThread) {
      // Attempted siri integration , not currently working
      const listener = Linking.addEventListener('url', (event) => {
        if (event.url.startsWith('uniswap://openai')) {
          const capturedPhrase = decodeURI(event.url.split('uniswap://openai?capturedPhrase=')[1] ?? '')
          capturedPhrase &&
            sendMessage(capturedPhrase).catch((e) =>
              logger.error(e, { tags: { file: 'OpenAIContext', function: 'siriListener' } }),
            )
        }
      })
      return listener.remove
    }
    return undefined
  }, [mainThread, sendMessage])

  const value = {
    isOpen,
    isLoading,
    messages,
    open: (): void => {
      setIsOpen(true)
    },
    close: (): void => {
      setIsOpen(false)
    },
    sendMessage,
  }

  return <OpenAIContext.Provider value={value}>{children}</OpenAIContext.Provider>
}
