import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

export enum CreateAuctionStep {
  ADD_TOKEN_INFO = 0,
  CONFIGURE_AUCTION = 1,
  CUSTOMIZE_POOL = 2,
  REVIEW_LAUNCH = 3,
}

export enum TokenMode {
  CREATE_NEW = 'create_new',
  EXISTING = 'existing',
}

export type CreateNewTokenFields = {
  name: string
  symbol: string
  description: string
  imageUrl: string
  network: UniverseChainId
  xProfile: string
}

export type ExistingTokenFields = {
  existingTokenCurrencyInfo: CurrencyInfo | undefined
  description: string
  xProfile: string
}

export type TokenFormState = {
  mode: TokenMode
  createNew: CreateNewTokenFields
  existing: ExistingTokenFields
}

interface CreateAuctionState {
  step: CreateAuctionStep
  tokenForm: TokenFormState
}

export const DEFAULT_CREATE_AUCTION_STATE: CreateAuctionState = {
  step: CreateAuctionStep.ADD_TOKEN_INFO,
  tokenForm: {
    mode: TokenMode.CREATE_NEW,
    createNew: {
      name: '',
      symbol: '',
      description: '',
      imageUrl: '',
      network: UniverseChainId.Unichain,
      xProfile: '',
    },
    existing: {
      existingTokenCurrencyInfo: undefined,
      description: '',
      xProfile: '',
    },
  },
}

interface CreateAuctionStoreActions {
  setStep: (step: CreateAuctionStep) => void
  goToNextStep: () => void
  goToPreviousStep: () => void
  setTokenMode: (mode: TokenMode) => void
  updateCreateNewField: <K extends keyof CreateNewTokenFields>(key: K, value: CreateNewTokenFields[K]) => void
  updateExistingField: <K extends keyof ExistingTokenFields>(key: K, value: ExistingTokenFields[K]) => void
  setTokenForm: (form: TokenFormState) => void
  commitTokenFormAndAdvance: () => void
  reset: () => void
}

export interface CreateAuctionStoreState extends CreateAuctionState {
  actions: CreateAuctionStoreActions
}
