import { Field } from './actions';
export declare type FullRange = true;
interface MintState {
    readonly independentField: Field;
    readonly typedValue: string;
    readonly startPriceTypedValue: string;
    readonly leftRangeTypedValue: string | FullRange;
    readonly rightRangeTypedValue: string | FullRange;
}
declare const _default: import("redux").Reducer<MintState, import("redux").AnyAction>;
export default _default;
