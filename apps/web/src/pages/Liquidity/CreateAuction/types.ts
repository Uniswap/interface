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

interface CreateAuctionState {
  step: CreateAuctionStep
  tokenMode: TokenMode
}

export const DEFAULT_CREATE_AUCTION_STATE: CreateAuctionState = {
  step: CreateAuctionStep.ADD_TOKEN_INFO,
  tokenMode: TokenMode.CREATE_NEW,
}

// eslint-disable-next-line import/no-unused-modules -- exports used in upstack PR
export interface CreateAuctionStoreActions {
  setStep: (step: CreateAuctionStep) => void
  goToNextStep: () => void
  goToPreviousStep: () => void
  setTokenMode: (mode: TokenMode) => void
  reset: () => void
}

export interface CreateAuctionStoreState extends CreateAuctionState {
  actions: CreateAuctionStoreActions
}
