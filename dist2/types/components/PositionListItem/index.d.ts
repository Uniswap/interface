/// <reference types="react" />
import { Price, Token } from '@uniswap/sdk-core';
import { Position } from '@uniswap/v3-sdk';
import { PositionDetails } from 'types/position';
interface PositionListItemProps {
    positionDetails: PositionDetails;
}
export declare function getPriceOrderingFromPositionForUI(position?: Position): {
    priceLower?: Price<Token, Token>;
    priceUpper?: Price<Token, Token>;
    quote?: Token;
    base?: Token;
};
export default function PositionListItem({ positionDetails }: PositionListItemProps): JSX.Element;
export {};
