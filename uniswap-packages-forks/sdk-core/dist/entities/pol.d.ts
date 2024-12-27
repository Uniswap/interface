import { BaseCurrency } from './baseCurrency';
/**
 * Represents the currency Pol
 */
export declare class Pol extends BaseCurrency {
    readonly isEther: true;
    readonly isToken: false;
    /**
     * Only called once by this class
     * @protected
     */
    protected constructor();
    /**
     * The only instance of the class `Pol`.
     */
    static readonly POL: Pol;
}
export declare const POL: Pol;
