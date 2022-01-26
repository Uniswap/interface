/// <reference types="react" />
import { Currency } from '@uniswap/sdk-core';
import { ProposalAction } from './ProposalActionSelector';
export declare const ProposalActionDetail: ({ className, proposalAction, currency, amount, toAddress, onCurrencySelect, onAmountInput, onToAddressInput, }: {
    className?: string | undefined;
    proposalAction: ProposalAction;
    currency: Currency | undefined;
    amount: string;
    toAddress: string;
    onCurrencySelect: (currency: Currency) => void;
    onAmountInput: (amount: string) => void;
    onToAddressInput: (address: string) => void;
}) => JSX.Element;
