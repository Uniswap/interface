import { ReactNode } from 'react';
interface VoteModalProps {
    isOpen: boolean;
    onDismiss: () => void;
    title: ReactNode;
}
export default function DelegateModal({ isOpen, onDismiss, title }: VoteModalProps): JSX.Element;
export {};
