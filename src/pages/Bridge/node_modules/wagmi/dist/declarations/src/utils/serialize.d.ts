declare type StandardReplacer = (key: string, value: any) => any;
declare type CircularReplacer = (key: string, value: any, referenceKey: string) => any;
/**
 * @function stringify
 *
 * @description
 * stringifier that handles circular values
 * Forked from https://github.com/planttheidea/fast-stringify
 *
 * @param value to stringify
 * @param [replacer] a custom replacer function for handling standard values
 * @param [indent] the number of spaces to indent the output by
 * @param [circularReplacer] a custom replacer function for handling circular values
 * @returns the stringified output
 */
export declare function serialize(value: any, replacer?: StandardReplacer | null | undefined, indent?: number | null | undefined, circularReplacer?: CircularReplacer | null | undefined): string;
export {};
