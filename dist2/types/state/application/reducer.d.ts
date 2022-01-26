import { SupportedChainId } from '../../constants/chains';
export declare type PopupContent = {
    txn: {
        hash: string;
    };
} | {
    failedSwitchNetwork: SupportedChainId;
};
export declare enum ApplicationModal {
    WALLET = 0,
    SETTINGS = 1,
    SELF_CLAIM = 2,
    ADDRESS_CLAIM = 3,
    CLAIM_POPUP = 4,
    MENU = 5,
    DELEGATE = 6,
    VOTE = 7,
    POOL_OVERVIEW_OPTIONS = 8,
    NETWORK_SELECTOR = 9,
    PRIVACY_POLICY = 10
}
declare type PopupList = Array<{
    key: string;
    show: boolean;
    content: PopupContent;
    removeAfterMs: number | null;
}>;
export interface ApplicationState {
    readonly chainId: number | null;
    readonly openModal: ApplicationModal | null;
    readonly popupList: PopupList;
}
export declare const updateChainId: import("@reduxjs/toolkit").ActionCreatorWithPayload<any, string>, setOpenModal: import("@reduxjs/toolkit").ActionCreatorWithPayload<any, string>, addPopup: import("@reduxjs/toolkit").ActionCreatorWithPayload<any, string>, removePopup: import("@reduxjs/toolkit").ActionCreatorWithPayload<any, string>;
declare const _default: import("redux").Reducer<ApplicationState, import("redux").AnyAction>;
export default _default;
