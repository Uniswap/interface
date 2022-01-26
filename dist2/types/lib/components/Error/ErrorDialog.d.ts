import { Icon } from 'lib/icons';
import { Color } from 'lib/theme';
import { ReactNode } from 'react';
interface StatusHeaderProps {
    icon: Icon;
    iconColor?: Color;
    iconSize?: number;
    children: ReactNode;
}
export declare function StatusHeader({ icon: Icon, iconColor, iconSize, children }: StatusHeaderProps): JSX.Element;
interface ErrorDialogProps {
    header?: ReactNode;
    error: Error;
    action: ReactNode;
    onAction: () => void;
}
export default function ErrorDialog({ header, error, action, onAction }: ErrorDialogProps): JSX.Element;
export {};
