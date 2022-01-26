import { ReactElement, ReactNode } from 'react';
export interface HeaderProps {
    title?: ReactElement;
    logo?: boolean;
    children: ReactNode;
}
export default function Header({ title, logo, children }: HeaderProps): JSX.Element;
