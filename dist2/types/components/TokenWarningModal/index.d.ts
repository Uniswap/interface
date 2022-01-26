/// <reference types="react" />
import { Token } from '@uniswap/sdk-core';
export default function TokenWarningModal({ isOpen, tokens, onConfirm, onDismiss, }: {
    isOpen: boolean;
    tokens: Token[];
    onConfirm: () => void;
    onDismiss: () => void;
}): JSX.Element;
