import { ReactNode } from 'react';
import { PopoverProps } from '../Popover';
export declare const TooltipContainer: import("styled-components").StyledComponent<"div", import("styled-components").DefaultTheme, {}, never>;
interface TooltipProps extends Omit<PopoverProps, 'content'> {
    text: ReactNode;
}
interface TooltipContentProps extends Omit<PopoverProps, 'content'> {
    content: ReactNode;
    onOpen?: () => void;
    wrap?: boolean;
    disableHover?: boolean;
}
export default function Tooltip({ text, ...rest }: TooltipProps): JSX.Element;
export declare function MouseoverTooltip({ children, ...rest }: Omit<TooltipProps, 'show'>): JSX.Element;
export declare function MouseoverTooltipContent({ content, children, onOpen: openCallback, disableHover, ...rest }: Omit<TooltipContentProps, 'show'>): JSX.Element;
export {};
