import invariant from 'tiny-invariant';
/**
 * A currency is any fungible financial instrument, including Ether, all ERC20 tokens, and other chain-native currencies
 */
export class BaseCurrency {
    /**
     * Constructs an instance of the base class `BaseCurrency`.
     * @param chainId the chain ID on which this currency resides
     * @param decimals decimals of the currency
     * @param symbol symbol of the currency
     * @param name of the currency
     */
    constructor(chainId, decimals, symbol, name) {
        invariant(Number.isSafeInteger(chainId), 'CHAIN_ID');
        invariant(decimals >= 0 && decimals < 255 && Number.isInteger(decimals), 'DECIMALS');
        this.chainId = chainId;
        this.decimals = decimals;
        this.symbol = symbol;
        this.name = name;
    }
}
//# sourceMappingURL=baseCurrency.js.map