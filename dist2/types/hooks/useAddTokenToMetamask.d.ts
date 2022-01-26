import { Currency } from '@uniswap/sdk-core';
export default function useAddTokenToMetamask(currencyToAdd: Currency | undefined): {
    addToken: () => void;
    success: boolean | undefined;
};
