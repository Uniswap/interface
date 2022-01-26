import React from 'react';
export declare const TextInput: ({ className, value, onUserInput, placeholder, fontSize, }: {
    className?: string | undefined;
    value: string;
    onUserInput: (value: string) => void;
    placeholder: string;
    fontSize: string;
}) => JSX.Element;
export declare const ResizingTextArea: React.MemoExoticComponent<({ className, value, onUserInput, placeholder, fontSize, }: {
    className?: string | undefined;
    value: string;
    onUserInput: (value: string) => void;
    placeholder: string;
    fontSize: string;
}) => JSX.Element>;
