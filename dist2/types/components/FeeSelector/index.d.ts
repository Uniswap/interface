/// <reference types="react" />
import { Currency } from '@uniswap/sdk-core';
import { FeeAmount } from '@uniswap/v3-sdk';
export default function FeeSelector({ disabled, feeAmount, handleFeePoolSelect, currencyA, currencyB, }: {
    disabled?: boolean;
    feeAmount?: FeeAmount;
    handleFeePoolSelect: (feeAmount: FeeAmount) => void;
    currencyA?: Currency | undefined;
    currencyB?: Currency | undefined;
}): JSX.Element;
