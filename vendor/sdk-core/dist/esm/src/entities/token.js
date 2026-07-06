import { BigNumber } from '@ethersproject/bignumber';
import invariant from 'tiny-invariant';
import { checkValidAddress, validateAndParseAddress } from '../utils/validateAndParseAddress';
import { BaseCurrency } from './baseCurrency';
/**
 * Represents an ERC20 token with a unique address and some metadata.
 */
export class Token extends BaseCurrency {
    /**
     *
     * @param chainId {@link BaseCurrency#chainId}
     * @param address The contract address on the chain on which this token lives
     * @param decimals {@link BaseCurrency#decimals}
     * @param symbol {@link BaseCurrency#symbol}
     * @param name {@link BaseCurrency#name}
     * @param bypassChecksum If true it only checks for length === 42, startsWith 0x and contains only hex characters
     * @param buyFeeBps Buy fee tax for FOT tokens, in basis points
     * @param sellFeeBps Sell fee tax for FOT tokens, in basis points
     */
    constructor(chainId, address, decimals, symbol, name, bypassChecksum, buyFeeBps, sellFeeBps) {
        super(chainId, decimals, symbol, name);
        this.isNative = false;
        this.isToken = true;
        if (bypassChecksum) {
            this.address = checkValidAddress(address);
        }
        else {
            this.address = validateAndParseAddress(address);
        }
        if (buyFeeBps) {
            invariant(buyFeeBps.gte(BigNumber.from(0)), 'NON-NEGATIVE FOT FEES');
        }
        if (sellFeeBps) {
            invariant(sellFeeBps.gte(BigNumber.from(0)), 'NON-NEGATIVE FOT FEES');
        }
        this.buyFeeBps = buyFeeBps;
        this.sellFeeBps = sellFeeBps;
    }
    /**
     * Returns true if the two tokens are equivalent, i.e. have the same chainId and address.
     * @param other other token to compare
     */
    equals(other) {
        return other.isToken && this.chainId === other.chainId && this.address.toLowerCase() === other.address.toLowerCase();
    }
    /**
     * Returns true if the address of this token sorts before the address of the other token
     * @param other other token to compare
     * @throws if the tokens have the same address
     * @throws if the tokens are on different chains
     */
    sortsBefore(other) {
        invariant(this.chainId === other.chainId, 'CHAIN_IDS');
        invariant(this.address.toLowerCase() !== other.address.toLowerCase(), 'ADDRESSES');
        return this.address.toLowerCase() < other.address.toLowerCase();
    }
    /**
     * Return this token, which does not need to be wrapped
     */
    get wrapped() {
        return this;
    }
}
//# sourceMappingURL=token.js.map