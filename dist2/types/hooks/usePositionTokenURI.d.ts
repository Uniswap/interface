import { BigNumber } from '@ethersproject/bignumber';
import JSBI from 'jsbi';
declare type TokenId = number | JSBI | BigNumber;
declare type UsePositionTokenURIResult = {
    valid: true;
    loading: false;
    result: {
        name: string;
        description: string;
        image: string;
    };
} | {
    valid: false;
    loading: false;
} | {
    valid: true;
    loading: true;
};
export declare function usePositionTokenURI(tokenId: TokenId | undefined): UsePositionTokenURIResult;
export {};
