import { type Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { isDevEnv } from '@universe/environment'
import type { FeeData } from 'uniswap/src/features/positions/types'
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
  type CustomPriceRangePreset,
  CreateAuctionStep,
  type CreateAuctionStoreState,
  DEFAULT_CREATE_AUCTION_STATE,
  DEFAULT_EXISTING_TOKEN_FORM,
  DEFAULT_POST_AUCTION_LIQUIDITY_PERCENT,
  MAX_POST_AUCTION_LIQUIDITY_TIERS,
  NEW_TOKEN_DECIMALS,
  PostAuctionLiquidityAllocationType,
  type PriceRangeStrategy,
  TimeLockPreset,
  TIMELOCK_PRESET_DURATION_DAYS,
  type TokenFormState,
  TokenMode,
} from '~/pages/Liquidity/CreateAuction/types'
import {
  addCustomPriceRangePreset,
  createNextBoundedTier,
  createSinglePostAuctionLiquidityAllocation,
  createTieredPostAuctionLiquidityAllocation,
  getPostAuctionLiquidityPreviewPercent,
  isUnboundedTier,
  removeCustomPriceRangeEntry,
  updateCustomPriceRangeBounds,
  updateCustomPriceRangeLiquidityPercent,
} from '~/pages/Liquidity/CreateAuction/utils'

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
          setEndTime: (endTime) => {
            set((state) => ({
              configureAuction: { ...state.configureAuction, endTime },
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
              customizePool: {
                ...state.customizePool,
                priceRangeStrategy,
              },
            }))
          },
          addCustomPriceRangePreset: (preset: CustomPriceRangePreset) => {
            set((state) => ({
              customizePool: {
                ...state.customizePool,
                customPriceRanges: addCustomPriceRangePreset(state.customizePool.customPriceRanges, preset),
              },
            }))
          },
          updateCustomPriceRangeLiquidityPercent: (entryId: string, percent: number) => {
            set((state) => ({
              customizePool: {
                ...state.customizePool,
                customPriceRanges: updateCustomPriceRangeLiquidityPercent({
                  entries: state.customizePool.customPriceRanges,
                  entryId,
                  percent,
                }),
              },
            }))
          },
          updateCustomPriceRangeBounds: (entryId, bounds) => {
            set((state) => ({
              customizePool: {
                ...state.customizePool,
                customPriceRanges: updateCustomPriceRangeBounds({
                  entries: state.customizePool.customPriceRanges,
                  entryId,
                  bounds,
                }),
              },
            }))
          },
          removeCustomPriceRange: (entryId: string) => {
            set((state) => ({
              customizePool: {
                ...state.customizePool,
                customPriceRanges: removeCustomPriceRangeEntry(state.customizePool.customPriceRanges, entryId),
              },
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
          setTimeLockPreset: (timeLockPreset: TimeLockPreset) => {
            set((state) => {
              const { customizePool } = state
              if (timeLockPreset === TimeLockPreset.Custom) {
                const permanentDays = TIMELOCK_PRESET_DURATION_DAYS[TimeLockPreset.Permanent]
                const leavingPermanentDuration = customizePool.timeLockDurationDays === permanentDays
                return {
                  customizePool: {
                    ...customizePool,
                    timeLockPreset,
                    ...(leavingPermanentDuration
                      ? {
                          timeLockDurationDays: TIMELOCK_PRESET_DURATION_DAYS[TimeLockPreset.OneYear],
                        }
                      : {}),
                  },
                }
              }
              return {
                customizePool: {
                  ...customizePool,
                  timeLockPreset,
                  timeLockDurationDays: TIMELOCK_PRESET_DURATION_DAYS[timeLockPreset],
                },
              }
            })
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
          setAutocompoundFeesEnabled: (autocompoundFeesEnabled: boolean) => {
            set((state) => ({
              customizePool: { ...state.customizePool, autocompoundFeesEnabled },
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

              const { committed: existingCommitted, postAuctionLiquidityAllocation } = state.configureAuction
              const isSameSupply =
                existingCommitted !== undefined &&
                existingCommitted.totalSupply.currency.equals(totalSupply.currency) &&
                existingCommitted.totalSupply.equalTo(totalSupply)
              const previewPercent = existingCommitted
                ? getPostAuctionLiquidityPreviewPercent(postAuctionLiquidityAllocation)
                : DEFAULT_POST_AUCTION_LIQUIDITY_PERCENT
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
            set(DEFAULT_CREATE_AUCTION_STATE)
          },
        },
      }),
      { name: 'createAuctionStore', enabled: isDevEnv() },
    ),
  )
