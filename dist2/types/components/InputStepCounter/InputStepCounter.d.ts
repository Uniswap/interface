import { FeeAmount } from '@uniswap/v3-sdk';
import { ReactNode } from 'react';
interface StepCounterProps {
    value: string;
    onUserInput: (value: string) => void;
    decrement: () => string;
    increment: () => string;
    decrementDisabled?: boolean;
    incrementDisabled?: boolean;
    feeAmount?: FeeAmount;
    label?: string;
    width?: string;
    locked?: boolean;
    title: ReactNode;
    tokenA: string | undefined;
    tokenB: string | undefined;
}
declare const StepCounter: ({ value, decrement, increment, decrementDisabled, incrementDisabled, width, locked, onUserInput, title, tokenA, tokenB, }: StepCounterProps) => JSX.Element;
export default StepCounter;
