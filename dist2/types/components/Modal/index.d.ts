import React from 'react';
interface ModalProps {
    isOpen: boolean;
    onDismiss: () => void;
    minHeight?: number | false;
    maxHeight?: number;
    initialFocusRef?: React.RefObject<any>;
    children?: React.ReactNode;
}
export default function Modal({ isOpen, onDismiss, minHeight, maxHeight, initialFocusRef, children, }: ModalProps): JSX.Element;
export {};
