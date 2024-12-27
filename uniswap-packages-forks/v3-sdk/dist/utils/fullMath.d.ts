import JSBI from 'jsbi';
export declare abstract class FullMath {
    /**
     * Cannot be constructed.
     */
    private constructor();
    static mulDivRoundingUp(a: JSBI, b: JSBI, denominator: JSBI): JSBI;
}
