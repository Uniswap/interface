import { type Currency, CurrencyAmount, Percent, Token } from '@uniswap/sdk-core'
import { isDevEnv } from 'utilities/src/environment/env'
import type { StoreApi, UseBoundStore } from 'zustand'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { zeroAddress } from '~/chains/utilities'
import {
  buildAuctionAmountsFromLiquidityPreview,
  getPostAuctionLiquidityAmountFromAllocation,
  normalizePostAuctionLiquidityAllocation,
  updateCommittedPostAuctionLiquidity,
} from '~/pages/Liquidity/CreateAuction/store/postAuctionLiquidityAllocationState'
import {
  type AuctionTokenAmounts,
  CreateAuctionStep,
  type CreateAuctionStoreState,
  DEFAULT_CREATE_AUCTION_STATE,
  DEFAULT_EXISTING_TOKEN_FORM,
  MAX_POST_AUCTION_LIQUIDITY_TIERS,
  NEW_TOKEN_DECIMALS,
  PostAuctionLiquidityAllocationType,
  type PriceRangeStrategy,
  type TokenFormState,
  TokenMode,
} from '~/pages/Liquidity/CreateAuction/types'
import {
  createNextBoundedTier,
  createSinglePostAuctionLiquidityAllocation,
  createTieredPostAuctionLiquidityAllocation,
  getDefaultPostAuctionLiquidityPercent,
  getPostAuctionLiquidityPreviewPercent,
  getRecommendedStrategy,
  isUnboundedTier,
} from '~/pages/Liquidity/CreateAuction/utils'
import type { FeeData } from '~/types/liquidity'

// 100% of sold tokens seed LP (sale-side leg); an equal amount is reserved from the deposit. Deposit splits ½ sold / ½ reserve.
export const BOOTSTRAP_POST_LIQUIDITY_PERCENT = new Percent(100, 100)
// 50% of sold tokens seed LP; the other ½ of sold is fundraise; reserved leg = ⅓ of deposit (e.g. 100M deposit → ~33.33M each bucket at 50%).
export const FUNDRAISE_POST_LIQUIDITY_PERCENT = new Percent(50, 100)

/**
 * Re-wrap existing committed amounts with a new token, preserving raw values.
 * Used when only the token metadata (name/symbol) changed but the supply didn't.
 */
function rebaseAmounts(committed: AuctionTokenAmounts, newToken: Currency): AuctionTokenAmounts {
  return {
    totalSupply: CurrencyAmount.fromRawAmount(newToken, committed.totalSupply.quotient),
    auctionSupplyAmount: CurrencyAmount.fromRawAmount(newToken, committed.auctionSupplyAmount.quotient),
    postAuctionLiquidityAmount: CurrencyAmount.fromRawAmount(newToken, committed.postAuctionLiquidityAmount.quotient),
  }
}

export type CreateAuctionStore = UseBoundStore<StoreApi<CreateAuctionStoreState>>

export const createCreateAuctionStore = (): CreateAuctionStore =>
  create<CreateAuctionStoreState>()(
    devtools(
      (set) => ({
        step: DEFAULT_CREATE_AUCTION_STATE.step,
        tokenForm: DEFAULT_CREATE_AUCTION_STATE.tokenForm,
        tokenColor: DEFAULT_CREATE_AUCTION_STATE.tokenColor,
        configureAuction: DEFAULT_CREATE_AUCTION_STATE.configureAuction,
        customizePool: DEFAULT_CREATE_AUCTION_STATE.customizePool,
        xVerification: DEFAULT_CREATE_AUCTION_STATE.xVerification,

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
          setTokenMode: (mode) => {
            set(() => {
              if (mode === TokenMode.CREATE_NEW) {
                return { tokenForm: DEFAULT_CREATE_AUCTION_STATE.tokenForm }
              }
              return { tokenForm: DEFAULT_EXISTING_TOKEN_FORM }
            })
          },
          updateCreateNewTokenField: (key, value) => {
            set((state) => {
              if (state.tokenForm.mode !== TokenMode.CREATE_NEW) {
                return {}
              }
              return { tokenForm: { ...state.tokenForm, [key]: value } }
            })
          },
          updateExistingTokenField: (key, value) => {
            set((state) => {
              if (state.tokenForm.mode !== TokenMode.EXISTING) {
                return {}
              }
              return { tokenForm: { ...state.tokenForm, [key]: value } }
            })
          },
          setTokenForm: (tokenForm: TokenFormState) => {
            set({ tokenForm })
          },
          setXVerification: (value) => {
            set({ xVerification: value })
          },
          setAuctionType: (activeAuctionType) => {
            set((state) => {
              const { committed, postAuctionLiquidityAllocation } = state.configureAuction
              const nextAllocation =
                postAuctionLiquidityAllocation.type === PostAuctionLiquidityAllocationType.SINGLE
                  ? createSinglePostAuctionLiquidityAllocation(getDefaultPostAuctionLiquidityPercent(activeAuctionType))
                  : postAuctionLiquidityAllocation

              return {
                configureAuction: {
                  ...state.configureAuction,
                  activeAuctionType,
                  postAuctionLiquidityAllocation: nextAllocation,
                  committed: updateCommittedPostAuctionLiquidity(committed, nextAllocation),
                },
                customizePool: {
                  ...state.customizePool,
                  priceRangeStrategy: getRecommendedStrategy(activeAuctionType),
                },
              }
            })
          },
          setPostAuctionLiquidityAllocationType: (type) => {
            set((state) => {
              const { committed, postAuctionLiquidityAllocation } = state.configureAuction
              const previewPercent = getPostAuctionLiquidityPreviewPercent(postAuctionLiquidityAllocation)
              const nextAllocation =
                type === PostAuctionLiquidityAllocationType.SINGLE
                  ? createSinglePostAuctionLiquidityAllocation(previewPercent)
                  : postAuctionLiquidityAllocation.type === PostAuctionLiquidityAllocationType.TIERED
                    ? postAuctionLiquidityAllocation
                    : createTieredPostAuctionLiquidityAllocation(previewPercent)

              return {
                configureAuction: {
                  ...state.configureAuction,
                  postAuctionLiquidityAllocation: nextAllocation,
                  committed: updateCommittedPostAuctionLiquidity(committed, nextAllocation),
                },
              }
            })
          },
          setSinglePostAuctionLiquidityPercent: (percent) => {
            set((state) => {
              const nextAllocation = createSinglePostAuctionLiquidityAllocation(percent)
              return {
                configureAuction: {
                  ...state.configureAuction,
                  postAuctionLiquidityAllocation: nextAllocation,
                  committed: updateCommittedPostAuctionLiquidity(state.configureAuction.committed, nextAllocation),
                },
              }
            })
          },
          addPostAuctionLiquidityTier: () => {
            set((state) => {
              const { committed, postAuctionLiquidityAllocation } = state.configureAuction
              if (postAuctionLiquidityAllocation.type !== PostAuctionLiquidityAllocationType.TIERED) {
                return {}
              }
              if (postAuctionLiquidityAllocation.tiers.length >= MAX_POST_AUCTION_LIQUIDITY_TIERS) {
                return {}
              }

              const { tiers } = postAuctionLiquidityAllocation
              const newBoundedTier = createNextBoundedTier(tiers)
              const unboundedTier = tiers.find(isUnboundedTier)
              const boundedTiers = tiers.filter((t) => !isUnboundedTier(t))

              const nextAllocation = {
                ...postAuctionLiquidityAllocation,
                tiers: [...boundedTiers, newBoundedTier, ...(unboundedTier ? [unboundedTier] : [])],
              }

              return {
                configureAuction: {
                  ...state.configureAuction,
                  postAuctionLiquidityAllocation: nextAllocation,
                  committed: updateCommittedPostAuctionLiquidity(committed, nextAllocation),
                },
              }
            })
          },
          updatePostAuctionLiquidityTier: (tierId, config) => {
            set((state) => {
              const { committed, postAuctionLiquidityAllocation } = state.configureAuction
              if (postAuctionLiquidityAllocation.type !== PostAuctionLiquidityAllocationType.TIERED) {
                return {}
              }

              const nextAllocation = normalizePostAuctionLiquidityAllocation({
                ...postAuctionLiquidityAllocation,
                tiers: postAuctionLiquidityAllocation.tiers.map((tier) =>
                  tier.id !== tierId
                    ? tier
                    : {
                        ...tier,
                        raiseMilestone: config.raiseMilestone ?? tier.raiseMilestone,
                        percent: config.percent !== undefined ? config.percent : tier.percent,
                      },
                ),
              })

              return {
                configureAuction: {
                  ...state.configureAuction,
                  postAuctionLiquidityAllocation: nextAllocation,
                  committed: updateCommittedPostAuctionLiquidity(committed, nextAllocation),
                },
              }
            })
          },
          removePostAuctionLiquidityTier: (tierId) => {
            set((state) => {
              const { committed, postAuctionLiquidityAllocation } = state.configureAuction
              if (postAuctionLiquidityAllocation.type !== PostAuctionLiquidityAllocationType.TIERED) {
                return {}
              }

              const tier = postAuctionLiquidityAllocation.tiers.find((t) => t.id === tierId)
              if (!tier || isUnboundedTier(tier)) {
                return {}
              }

              const nextAllocation = {
                ...postAuctionLiquidityAllocation,
                tiers: postAuctionLiquidityAllocation.tiers.filter((t) => t.id !== tierId),
              }

              return {
                configureAuction: {
                  ...state.configureAuction,
                  postAuctionLiquidityAllocation: nextAllocation,
                  committed: updateCommittedPostAuctionLiquidity(committed, nextAllocation),
                },
              }
            })
          },
          setAuctionConfig: (config) => {
            set((state) => {
              const { committed, postAuctionLiquidityAllocation } = state.configureAuction
              if (!committed) {
                return {}
              }

              const nextAuctionSupply = config.auctionSupplyAmount
              return {
                configureAuction: {
                  ...state.configureAuction,
                  committed: {
                    ...committed,
                    auctionSupplyAmount: nextAuctionSupply,
                    postAuctionLiquidityAmount: getPostAuctionLiquidityAmountFromAllocation(
                      nextAuctionSupply,
                      postAuctionLiquidityAllocation,
                    ),
                  },
                },
              }
            })
          },
          setStartTime: (startTime) => {
            set((state) => ({
              configureAuction: { ...state.configureAuction, startTime },
            }))
          },
          setMaxDurationDays: (maxDurationDays) => {
            set((state) => ({
              configureAuction: { ...state.configureAuction, maxDurationDays },
            }))
          },
          setRaiseCurrency: (raiseCurrency) => {
            set((state) => {
              const { committed, postAuctionLiquidityAllocation } = state.configureAuction
              if (state.configureAuction.raiseCurrency === raiseCurrency) {
                return {}
              }
              return {
                configureAuction: {
                  ...state.configureAuction,
                  raiseCurrency,
                  floorPrice: '',
                  committed: updateCommittedPostAuctionLiquidity(committed, postAuctionLiquidityAllocation),
                },
              }
            })
          },
          setFloorPrice: (floorPrice) => {
            set((state) => {
              const { committed, postAuctionLiquidityAllocation } = state.configureAuction
              return {
                configureAuction: {
                  ...state.configureAuction,
                  floorPrice,
                  committed: updateCommittedPostAuctionLiquidity(committed, postAuctionLiquidityAllocation),
                },
              }
            })
          },
          setKycValidationHookAddress: (kycValidationHookAddress) => {
            set((state) => ({ configureAuction: { ...state.configureAuction, kycValidationHookAddress } }))
          },
          setFee: (fee: FeeData) => {
            set((state) => ({
              customizePool: { ...state.customizePool, fee },
            }))
          },
          setPriceRangeStrategy: (priceRangeStrategy: PriceRangeStrategy) => {
            set((state) => ({
              customizePool: { ...state.customizePool, priceRangeStrategy },
            }))
          },
          setPoolOwner: (poolOwner: string) => {
            set((state) => ({
              customizePool: { ...state.customizePool, poolOwner },
            }))
          },
          setTimeLockEnabled: (timeLockEnabled: boolean) => {
            set((state) => ({
              customizePool: { ...state.customizePool, timeLockEnabled },
            }))
          },
          setTimeLockDurationDays: (timeLockDurationDays: number) => {
            set((state) => ({
              customizePool: { ...state.customizePool, timeLockDurationDays },
            }))
          },
          setSendFeesEnabled: (sendFeesEnabled: boolean) => {
            set((state) => ({
              customizePool: { ...state.customizePool, sendFeesEnabled },
            }))
          },
          setFeesRecipientAddress: (feesRecipientAddress: string) => {
            set((state) => ({
              customizePool: { ...state.customizePool, feesRecipientAddress },
            }))
          },
          setBuybackAndBurnEnabled: (buybackAndBurnEnabled: boolean) => {
            set((state) => ({
              customizePool: { ...state.customizePool, buybackAndBurnEnabled },
            }))
          },
          commitTokenFormAndAdvance: () => {
            set((state) => {
              const { tokenForm } = state
              let totalSupply

              if (tokenForm.mode === TokenMode.CREATE_NEW) {
                const { network, symbol, name, totalSupply: formSupply } = tokenForm
                const token = new Token(network, zeroAddress, NEW_TOKEN_DECIMALS, symbol, name)
                totalSupply = CurrencyAmount.fromRawAmount(token, formSupply.quotient)
              } else {
                totalSupply = tokenForm.totalSupply
              }

              if (!totalSupply) {
                return {}
              }

              const {
                activeAuctionType,
                committed: existingCommitted,
                postAuctionLiquidityAllocation,
              } = state.configureAuction
              const isSameSupply =
                existingCommitted !== undefined &&
                existingCommitted.totalSupply.currency.equals(totalSupply.currency) &&
                existingCommitted.totalSupply.equalTo(totalSupply)
              const previewPercent = existingCommitted
                ? getPostAuctionLiquidityPreviewPercent(postAuctionLiquidityAllocation)
                : getDefaultPostAuctionLiquidityPercent(activeAuctionType)
              const nextAllocation = existingCommitted
                ? postAuctionLiquidityAllocation
                : createSinglePostAuctionLiquidityAllocation(previewPercent)
              const committedBase = isSameSupply
                ? rebaseAmounts(existingCommitted, totalSupply.currency)
                : buildAuctionAmountsFromLiquidityPreview(totalSupply, previewPercent)
              const committed = updateCommittedPostAuctionLiquidity(committedBase, nextAllocation)

              return {
                configureAuction: {
                  ...state.configureAuction,
                  committed,
                  postAuctionLiquidityAllocation: nextAllocation,
                },
                step: Math.min(state.step + 1, CreateAuctionStep.REVIEW_LAUNCH) as CreateAuctionStep,
              }
            })
          },
          setTokenColor: (tokenColor) => {
            set({ tokenColor })
          },
          reset: () => {
            set({
              step: DEFAULT_CREATE_AUCTION_STATE.step,
              tokenForm: DEFAULT_CREATE_AUCTION_STATE.tokenForm,
              tokenColor: DEFAULT_CREATE_AUCTION_STATE.tokenColor,
              configureAuction: DEFAULT_CREATE_AUCTION_STATE.configureAuction,
              customizePool: DEFAULT_CREATE_AUCTION_STATE.customizePool,
              xVerification: DEFAULT_CREATE_AUCTION_STATE.xVerification,
            })
          },
        },
      }),
      {
        name: 'createAuctionStore',
        enabled: isDevEnv(),
      },
    ),
  )
