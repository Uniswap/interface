import { CurrencyAmount } from './currencyAmount';
import { Token } from '../token';
import { BigintIsh } from '../../constants';
export declare class TokenAmount extends CurrencyAmount {
    readonly token: Token;
    constructor(token: Token, amount: BigintIsh);
    add(other: TokenAmount): TokenAmount;
    subtract(other: TokenAmount): TokenAmount;
}
