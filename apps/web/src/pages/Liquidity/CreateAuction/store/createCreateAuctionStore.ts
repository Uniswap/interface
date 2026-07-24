import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { isDevEnv } from '@universe/environment'
import type { FeeData } from 'uniswap/src/features/positions/types'
import type { StoreApi, UseBoundStore } from 'zustand'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { zeroAddress } from '~/chains'
import { stripZeroPercentCustomPriceRangeEntries } from '~/pages/Liquidity/CreateAuction/customPriceRanges'
import { applyNewTokenTotalSupply } from '~/pages/Liquidity/CreateAuction/store/applyNewTokenTotalSupply'
import {
  buildAuctionAmountsFromLiquidityPreview,
  getPostAuctionLiquidityAmountFromAllocation,
  normalizePostAuctionLiquidityAllocation,
  updateCommittedPostAuctionLiquidity,
} from '~/pages/Liquidity/CreateAuction/store/postAuctionLiquidityAllocationState'
import { rebaseAuctionTokenAmounts } from '~/pages/Liquidity/CreateAuction/store/rebaseAuctionTokenAmounts'
import { revokeCreateNewTokenBlobPreviewIfNeeded } from '~/pages/Liquidity/CreateAuction/store/revokeCreateNewTokenBlobPreviewIfNeeded'
import {
  type CustomPriceRangePreset,
  CreateAuctionStep,
  type CreateAuctionStoreState,
  DEFAULT_CREATE_AUCTION_STATE,
  DEFAULT_EXISTING_TOKEN_AUCTION_SUPPLY_PERCENT,
  DEFAULT_EXISTING_TOKEN_FORM,
  DEFAULT_POST_AUCTION_LIQUIDITY_PERCENT,
  MAX_POST_AUCTION_LIQUIDITY_TIERS,
  NEW_TOKEN_DECIMALS,
  PostAuctionLiquidityAllocationType,
  PriceRangeStrategy,
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

export type CreateAuctionStore = UseBoundStore<StoreApi<CreateAuctionStoreState>>

export const createCreateAuctionStore = (): CreateAuctionStore =>
  create<CreateAuctionStoreState>()(
    devtools(
      (set) => ({
        ...DEFAULT_CREATE_AUCTION_STATE,

        actions: {
          setStep: (step) => {
            set({ step })
          },
          setQuickLaunch: (quickLaunch) => set({ quickLaunch }),
          goToNextStep: () => {
            set((state) => {
              const nextStep = Math.min(state.step + 1, CreateAuctionStep.REVIEW_LAUNCH) as CreateAuctionStep

              if (
                state.step === CreateAuctionStep.CUSTOMIZE_POOL &&
                state.customizePool.priceRangeStrategy === PriceRangeStrategy.CUSTOM_RANGE
              ) {
                const nextRanges = stripZeroPercentCustomPriceRangeEntries(state.customizePool.customPriceRanges)
                if (nextRanges !== state.customizePool.customPriceRanges) {
                  return {
                    step: nextStep,
                    customizePool: {
                      ...state.customizePool,
                      customPriceRanges: nextRanges,
                    },
                  }
                }
              }

              return { step: nextStep }
            })
          },
          goToPreviousStep: () => {
            set((state) => ({
              step: Math.max(state.step - 1, CreateAuctionStep.ADD_TOKEN_INFO) as CreateAuctionStep,
            }))
          },
          setTokenMode: (mode) => {
            set((state) => {
              revokeCreateNewTokenBlobPreviewIfNeeded(state.tokenForm)
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
          addPostAuctionLiquidityTier: (options) => {
            set((state) => {
              const { committed, postAuctionLiquidityAllocation } = state.configureAuction
              if (postAuctionLiquidityAllocation.type !== PostAuctionLiquidityAllocationType.TIERED) {
                return {}
              }
              if (postAuctionLiquidityAllocation.tiers.length >= MAX_POST_AUCTION_LIQUIDITY_TIERS) {
                return {}
              }

              const { tiers } = postAuctionLiquidityAllocation
              const newBoundedTier = createNextBoundedTier(tiers, options)
              const unboundedTier = tiers.find(isUnboundedTier)
              const boundedTiers = tiers.filter((t) => !isUnboundedTier(t))

              const nextAllocation = normalizePostAuctionLiquidityAllocation({
                ...postAuctionLiquidityAllocation,
                tiers: [...boundedTiers, newBoundedTier, ...(unboundedTier ? [unboundedTier] : [])],
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
          setNewTokenTotalSupply: (totalSupply) => set(applyNewTokenTotalSupply(totalSupply)),
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
                  floorPriceInput: undefined,
                  committed: updateCommittedPostAuctionLiquidity(committed, postAuctionLiquidityAllocation),
                },
              }
            })
          },
          setFloorPrice: (floorPrice, input) => {
            set((state) => {
              const { committed, postAuctionLiquidityAllocation } = state.configureAuction
              const floorPriceInput = input && input.rawValue.trim() !== '' ? { ...input, floorPrice } : undefined
              if (
                state.configureAuction.floorPrice === floorPrice &&
                state.configureAuction.floorPriceInput?.floorPrice === floorPriceInput?.floorPrice &&
                state.configureAuction.floorPriceInput?.rawValue === floorPriceInput?.rawValue &&
                state.configureAuction.floorPriceInput?.denomination === floorPriceInput?.denomination &&
                state.configureAuction.floorPriceInput?.inputCurrency === floorPriceInput?.inputCurrency
              ) {
                return {}
              }
              return {
                configureAuction: {
                  ...state.configureAuction,
                  floorPrice,
                  floorPriceInput,
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
            set((state) => {
              const { customizePool } = state
              const hasFeeClaim = feesRecipientAddress.trim().length > 0
              return {
                customizePool: {
                  ...customizePool,
                  feesRecipientAddress,
                  sendFeesEnabled: hasFeeClaim,
                  ...(hasFeeClaim ? { buybackAndBurnEnabled: false } : {}),
                },
              }
            })
          },
          setBuybackAndBurnEnabled: (buybackAndBurnEnabled: boolean) => {
            // Buyback and fee-forwarding are mutually exclusive (proto oneof); clear the other side's state.
            set((state) => ({
              customizePool: {
                ...state.customizePool,
                buybackAndBurnEnabled,
                ...(buybackAndBurnEnabled ? { feesRecipientAddress: '', sendFeesEnabled: false } : {}),
              },
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
              const auctionSupplyPercent =
                tokenForm.mode === TokenMode.EXISTING ? DEFAULT_EXISTING_TOKEN_AUCTION_SUPPLY_PERCENT : undefined
              const committedBase = isSameSupply
                ? rebaseAuctionTokenAmounts(existingCommitted, totalSupply.currency)
                : buildAuctionAmountsFromLiquidityPreview(totalSupply, { previewPercent, auctionSupplyPercent })
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
            set((state) => {
              revokeCreateNewTokenBlobPreviewIfNeeded(state.tokenForm)
              return DEFAULT_CREATE_AUCTION_STATE
            })
          },
        },
      }),
      { name: 'createAuctionStore', enabled: isDevEnv() },
    ),
  )
