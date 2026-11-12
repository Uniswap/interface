import { isDevEnv } from '@universe/environment'
import type { StoreApi, UseBoundStore } from 'zustand'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type SwapFormWarningStoreState = {
  isTokenWarningModalVisible: boolean
  isBridgingWarningModalVisible: boolean
  isMaxNativeTransferModalVisible: boolean
  isViewOnlyModalVisible: boolean
  isBridgedAssetModalVisible: boolean
  isVerifyIdentityModalVisible: boolean
  isBlockedAddressModalVisible: boolean
  /**
   * The address the press-time screen refused, captured when the modal opens so the
   * modal keeps naming it. Reading the active address at render instead would retitle
   * an open modal after a wallet switch.
   */
  blockedAddress: string | undefined
  actions: {
    handleShowTokenWarningModal: () => void
    handleHideTokenWarningModal: () => void
    handleShowBridgingWarningModal: () => void
    handleHideBridgingWarningModal: () => void
    handleShowMaxNativeTransferModal: () => void
    handleHideMaxNativeTransferModal: () => void
    handleShowBridgedAssetModal: () => void
    handleHideBridgedAssetModal: () => void
    handleShowViewOnlyModal: () => void
    handleHideViewOnlyModal: () => void
    handleShowVerifyIdentityModal: () => void
    handleHideVerifyIdentityModal: () => void
    handleShowBlockedAddressModal: (address?: string) => void
    handleHideBlockedAddressModal: () => void
  }
}

export type SwapFormWarningStore = UseBoundStore<StoreApi<SwapFormWarningStoreState>>

export const createSwapFormWarningStore = (): SwapFormWarningStore =>
  create<SwapFormWarningStoreState>()(
    devtools(
      (set) => ({
        isTokenWarningModalVisible: false,
        isBridgingWarningModalVisible: false,
        isMaxNativeTransferModalVisible: false,
        isViewOnlyModalVisible: false,
        isBridgedAssetModalVisible: false,
        isVerifyIdentityModalVisible: false,
        isBlockedAddressModalVisible: false,
        blockedAddress: undefined,
        actions: {
          handleShowTokenWarningModal: (): void => set({ isTokenWarningModalVisible: true }),
          handleHideTokenWarningModal: (): void => set({ isTokenWarningModalVisible: false }),
          handleShowBridgingWarningModal: (): void => set({ isBridgingWarningModalVisible: true }),
          handleHideBridgingWarningModal: (): void => set({ isBridgingWarningModalVisible: false }),
          handleShowMaxNativeTransferModal: (): void => set({ isMaxNativeTransferModalVisible: true }),
          handleHideMaxNativeTransferModal: (): void => set({ isMaxNativeTransferModalVisible: false }),
          handleShowViewOnlyModal: (): void => set({ isViewOnlyModalVisible: true }),
          handleHideViewOnlyModal: (): void => set({ isViewOnlyModalVisible: false }),
          handleShowBridgedAssetModal: (): void => set({ isBridgedAssetModalVisible: true }),
          handleHideBridgedAssetModal: (): void => set({ isBridgedAssetModalVisible: false }),
          handleShowVerifyIdentityModal: (): void => set({ isVerifyIdentityModalVisible: true }),
          handleHideVerifyIdentityModal: (): void => set({ isVerifyIdentityModalVisible: false }),
          handleShowBlockedAddressModal: (address?: string): void =>
            set({ isBlockedAddressModalVisible: true, blockedAddress: address }),
          handleHideBlockedAddressModal: (): void =>
            set({ isBlockedAddressModalVisible: false, blockedAddress: undefined }),
        },
      }),
      {
        name: 'useSwapFormWarningStore',
        enabled: isDevEnv(),
        trace: true,
        traceLimit: 25,
      },
    ),
  )
