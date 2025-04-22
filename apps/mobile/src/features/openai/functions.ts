import OpenAI from 'openai'
import { AppearanceSettingType } from 'wallet/src/features/appearance/slice'

export enum FunctionName {
  BackupCloud = 'backupCloud',
  BackupManual = 'backupManual',
  GetTopTokens = 'getTopTokens',
  GetTokenDetails = 'getTokenDetails',
  GetWalletPortfolioBalances = 'getWalletPortfolioBalances',
  GetSwapWarning = 'getSwapWarning',
  StartSend = 'startSend',
  StartSwap = 'startSwap',
  SearchTokens = 'searchTokens',
  SearchRecipients = 'searchRecipients',
  SettingChangeAppearance = 'settingChangeAppearance',
  NavigateToFiatOnramp = 'navigateToFiatOnramp',
}

export type PossibleFunctionArgs = {
  address?: string
  chain?: string
  chainId?: number
  pageSize?: number
  sortBy?: string
  text?: string

  inputTokenAddress?: string
  inputTokenAmount?: number
  inputTokenUSD?: number
  outputTokenAddress?: string
  outputTokenAmount?: number
  isSwappingAll?: boolean
  recipientAddress?: string

  appearanceSettingType?: string
}

export const tools: OpenAI.Beta.Assistants.AssistantTool[] = [
  {
    type: 'function',
    function: {
      name: FunctionName.BackupCloud,
      description:
        'Takes the user to a screen where they can back up their recovery phrase to the iCloud or Google Drive, encrypted by a password that the user will input.',
    },
  },
  {
    type: 'function',
    function: {
      name: FunctionName.BackupManual,
      description:
        "Takes the user to a screen with the user's recovery phrase that allows the user to write it down or copy it to be saved elsewhere",
    },
  },
  {
    type: 'function',
    function: {
      name: FunctionName.GetTopTokens,
      parameters: {
        type: 'object',
        properties: {
          chain: {
            type: 'string',
            description:
              'An enum string for the ethereum chain to search on. The possible values are ARBITRUM, ETHEREUM, OPTIMISM, POLYGON, BNB, BASE, BLAST. It should be defaulted to ETHEREUM.',
          },
          sortBy: {
            type: 'string',
            description:
              'An enum string for the field to sort by, descending. The possible values are TOTAL_VALUE_LOCKED, MARKET_CAP, VOLUME, POPULARITY.',
          },
          pageSize: {
            type: 'number',
            description: 'The number of results that should be returned.',
          },
        },
        required: ['chain', 'sortBy', 'pageSize'],
      },
      description: 'Retrieves a sorted list of tokens for a specific chain',
    },
  },
  {
    type: 'function',
    function: {
      name: FunctionName.GetTokenDetails,
      parameters: {
        type: 'object',
        properties: {
          chain: {
            type: 'string',
            description:
              'An enum string for the ethereum chain to search on. The possible values are ARBITRUM, ETHEREUM, OPTIMISM, POLYGON, BNB, BASE, BLAST.  It should be defaulted to ETHEREUM.',
          },
          address: {
            type: 'string',
            description: 'The hexadecimal string representing the contract address for the specific token',
          },
        },
        required: ['chain', 'address'],
      },
      description: 'Fetches details for a specific token on a specific chain',
    },
  },
  {
    type: 'function',
    function: {
      name: FunctionName.GetWalletPortfolioBalances,
      description:
        'Retrieves the portfolio balances of tokens for the user. Each balance is grouped by token for a specific chain.',
    },
  },
  {
    type: 'function',
    function: {
      name: FunctionName.GetSwapWarning,
      description: 'Returns the current warning message for the swap the user is trying to make, if there is one.',
    },
  },
  {
    type: 'function',
    function: {
      name: FunctionName.SearchTokens,
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The text to search for in the token name or symbol',
          },
          chain: {
            type: 'string',
            description:
              'An enum string for the ethereum chain to search on. The possible values are ARBITRUM, ETHEREUM, OPTIMISM, POLYGON, BNB, BASE, BLAST.  If no value is passed, it will search on all chains.',
          },
        },
        required: ['text'],
      },
      description: 'Searches for tokens based on the text provided',
    },
  },
  {
    type: 'function',
    function: {
      name: FunctionName.SearchRecipients,
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The text to search for in the user wallet address or username',
          },
        },
        required: ['text'],
      },
      description:
        'Searches for recipient wallet addresses to send tokens to, can search for ENS username or Unitag username. It will return the recipient wallet address and username if available.',
    },
  },
  {
    type: 'function',
    function: {
      name: FunctionName.SettingChangeAppearance,
      parameters: {
        type: 'object',
        properties: {
          setting: {
            appearanceSettingType: 'string',
            description: `The setting value for controlling dark mode. Possible values are: ${Object.values(
              AppearanceSettingType,
            ).join(', ')}`,
          },
        },
        description: 'Changes the appearance of the app to the specified theme e.g. dark mode or light mode',
      },
    },
  },
  {
    type: 'function',
    function: {
      name: FunctionName.StartSwap,
      parameters: {
        type: 'object',
        properties: {
          chainId: {
            type: 'number',
            description:
              'The hexadecimal string representing the chain address to swap the tokens on, converted to a number. These are the chain ids based on name: ArbitrumOne = 42161, Base = 8453, Optimism = 10, Polygon = 137, Blast = 81457, Bnb = 56.',
          },
          inputTokenAddress: {
            type: 'string',
            description:
              'The hexadecimal string representing the contract address for the specific input token the user would like to swap.',
          },
          outputTokenAddress: {
            type: 'string',
            description:
              'The hexadecimal string representing the contract address for the specific output token the user would like to swap for.',
          },
          inputTokenAmount: {
            type: 'number',
            description: 'The amount of input token the user would like to swap for the output token.',
          },
          outputTokenAmount: {
            type: 'number',
            description: 'The amount of output token the user would like to receive for the input token.',
          },
          isSwappingAll: {
            type: 'boolean',
            description:
              'A boolean value that indicates if the user is swapping all of their owned input token. This is purely a helper flag and the inputTokenAmount variable is still needed.',
          },
        },
        required: ['chainId'],
      },
      description:
        'Navigates the user to a screen where they can swap one token for another on a specific chain on the Uniswap exchange protocol. At least one of inputTokenAddress or outputTokenAddress should be filled out, and both could be filled out.  At least one of inputTokenAmount or outputTokenAmount should be provided, but both cannot be. Token amounts should be limited to a max of 10 significant digits, rounded. When swapping a certain percentage or ratio of the user’s input token, check their wallet portfolo for the amount.',
    },
  },
  {
    type: 'function',
    function: {
      name: FunctionName.StartSend,
      parameters: {
        type: 'object',
        properties: {
          chainId: {
            type: 'number',
            description:
              'The hexadecimal string representing the chain address to send the tokens, converted to a number. These are the chain ids based on name: ArbitrumOne = 42161, Base = 8453, Optimism = 10, Polygon = 137, Blast = 81457, Bnb = 56.',
          },
          inputTokenAddress: {
            type: 'string',
            description:
              'The hexadecimal string representing the contract address for the specific input token the user would like to send to the recipient.',
          },
          recipientAddress: {
            type: 'string',
            description: 'The hexadecimal string representing the wallet address for the recipient',
          },
          inputTokenAmount: {
            type: 'number',
            description: 'The amount of input token the user would like to send to the recipient.',
          },
          inputTokenUSD: {
            type: 'number',
            description:
              'The equivalent amount in USD of input token the user would like to send to the recipient. Can be used in place of inputTokenAmount',
          },
          isSwappingAll: {
            type: 'boolean',
            description: 'A boolean value that indicates if the user is swapping all of their owned input token',
          },
        },
        required: ['chainId', 'inputTokenAddress', 'recipientAddress', 'inputTokenAmount'],
      },
      description: 'Navigates the user to a screen where the user can send tokens to another wallet address',
    },
  },
  {
    type: 'function',
    function: {
      name: FunctionName.NavigateToFiatOnramp,
      description:
        'Navigates the user to a screen where they can buy crypto with fiat. This is helpful when the user does not have any crypto in their wallet or needs more for gas fees.',
    },
  },
]
