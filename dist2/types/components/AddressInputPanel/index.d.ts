import { ReactNode } from 'react';
export default function AddressInputPanel({ id, className, label, placeholder, value, onChange, }: {
    id?: string;
    className?: string;
    label?: ReactNode;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
}): JSX.Element;
