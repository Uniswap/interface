import { SupportedLocale } from 'constants/locales';
import { SerializedPair, SerializedToken } from './actions';
export interface UserState {
    lastUpdateVersionTimestamp?: number;
    matchesDarkMode: boolean;
    userDarkMode: boolean | null;
    userLocale: SupportedLocale | null;
    userExpertMode: boolean;
    userClientSideRouter: boolean;
    userHideClosedPositions: boolean;
    userSlippageTolerance: number | 'auto';
    userSlippageToleranceHasBeenMigratedToAuto: boolean;
    userDeadline: number;
    tokens: {
        [chainId: number]: {
            [address: string]: SerializedToken;
        };
    };
    pairs: {
        [chainId: number]: {
            [key: string]: SerializedPair;
        };
    };
    timestamp: number;
    URLWarningVisible: boolean;
    showSurveyPopup: boolean | undefined;
}
export declare const initialState: UserState;
declare const _default: import("redux").Reducer<UserState, import("redux").AnyAction>;
export default _default;
