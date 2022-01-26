import React from 'react';
export declare const Input: React.NamedExoticComponent<{
    value: string | number;
    onUserInput: (input: string) => void;
    error?: boolean | undefined;
    fontSize?: string | undefined;
    align?: "left" | "right" | undefined;
    prependSymbol?: string | undefined;
} & Omit<React.HTMLProps<HTMLInputElement>, "ref" | "onChange" | "as">>;
export default Input;
