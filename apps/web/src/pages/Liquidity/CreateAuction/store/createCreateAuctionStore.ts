import type { StoreApi, UseBoundStore } from 'zustand'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import {
  CreateAuctionStep,
  type CreateAuctionStoreState,
  DEFAULT_CREATE_AUCTION_STATE,
  TokenMode,
} from '~/pages/Liquidity/CreateAuction/types'

export type CreateAuctionStore = UseBoundStore<StoreApi<CreateAuctionStoreState>>

export const createCreateAuctionStore = (): CreateAuctionStore =>
  create<CreateAuctionStoreState>()(
    devtools(
      (set) => ({
        step: DEFAULT_CREATE_AUCTION_STATE.step,
        tokenMode: DEFAULT_CREATE_AUCTION_STATE.tokenMode,

        actions: {
          setStep: (step) => {
            set({ step })
          },
          goToNextStep: () => {
            set((state) => ({
              step: Math.min(state.step + 1, CreateAuctionStep.REVIEW_LAUNCH) as CreateAuctionStep,
            }))
          },
          goToPreviousStep: () => {
            set((state) => ({
              step: Math.max(state.step - 1, CreateAuctionStep.ADD_TOKEN_INFO) as CreateAuctionStep,
            }))
          },
          setTokenMode: (mode: TokenMode) => {
            set({ tokenMode: mode })
          },
          reset: () => {
            set({
              step: DEFAULT_CREATE_AUCTION_STATE.step,
              tokenMode: DEFAULT_CREATE_AUCTION_STATE.tokenMode,
            })
          },
        },
      }),
      {
        name: 'createAuctionStore',
        enabled: process.env.NODE_ENV === 'development',
      },
    ),
  )
