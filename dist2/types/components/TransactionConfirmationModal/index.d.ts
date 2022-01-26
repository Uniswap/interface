import { Currency } from '@uniswap/sdk-core';
import { ReactNode } from 'react';
export declare function ConfirmationModalContent({ title, bottomContent, onDismiss, topContent, }: {
    title: ReactNode;
    onDismiss: () => void;
    topContent: () => ReactNode;
    bottomContent?: () => ReactNode | undefined;
}): JSX.Element;
export declare function TransactionErrorContent({ message, onDismiss }: {
    message: ReactNode;
    onDismiss: () => void;
}): JSX.Element;
interface ConfirmationModalProps {
    isOpen: boolean;
    onDismiss: () => void;
    hash: string | undefined;
    content: () => ReactNode;
    attemptingTxn: boolean;
    pendingText: ReactNode;
    currencyToAdd?: Currency | undefined;
}
export default function TransactionConfirmationModal({ isOpen, onDismiss, attemptingTxn, hash, pendingText, content, currencyToAdd, }: ConfirmationModalProps): JSX.Element | null;
export {};
