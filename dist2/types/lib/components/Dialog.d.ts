import 'wicg-inert';
import { Color } from 'lib/theme';
import { ReactElement, ReactNode } from 'react';
declare global {
    interface HTMLElement {
        inert?: boolean;
    }
}
interface ProviderProps {
    value: HTMLElement | null;
    children: ReactNode;
}
export declare function Provider({ value, children }: ProviderProps): JSX.Element;
interface HeaderProps {
    title?: ReactElement;
    ruled?: boolean;
    children?: ReactNode;
}
export declare function Header({ title, children, ruled }: HeaderProps): JSX.Element;
export declare const Modal: import("styled-components").StyledComponent<"div", import("../theme/theme").ComputedTheme, {
    color: Color;
}, never>;
interface DialogProps {
    color: Color;
    children: ReactNode;
    onClose?: () => void;
}
export default function Dialog({ color, children, onClose }: DialogProps): import("react").ReactPortal | null;
export {};
