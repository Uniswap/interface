import { ReactNode } from 'react';
import { ComputedTheme } from './theme';
export declare function getDynamicTheme(theme: ComputedTheme, color: string): ComputedTheme;
interface DynamicThemeProviderProps {
    color?: string;
    children: ReactNode;
}
export declare function DynamicThemeProvider({ color, children }: DynamicThemeProviderProps): JSX.Element;
export {};
