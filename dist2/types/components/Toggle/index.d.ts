import { ReactNode } from 'react';
interface ToggleProps {
    id?: string;
    isActive: boolean;
    toggle: () => void;
    checked?: ReactNode;
    unchecked?: ReactNode;
}
export default function Toggle({ id, isActive, toggle, checked, unchecked, }: ToggleProps): JSX.Element;
export {};
