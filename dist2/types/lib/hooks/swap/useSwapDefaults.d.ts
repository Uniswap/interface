import { DefaultAddress } from 'lib/components/Swap';
interface UseSwapDefaultsArgs {
    defaultInputAddress?: DefaultAddress;
    defaultInputAmount?: string;
    defaultOutputAddress?: DefaultAddress;
    defaultOutputAmount?: string;
}
export default function useSwapDefaults({ defaultInputAddress, defaultInputAmount, defaultOutputAddress, defaultOutputAmount, }: UseSwapDefaultsArgs): void;
export {};
