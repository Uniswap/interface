import React from 'react';
import type { Query } from 'react-query';
import { Theme } from './theme';
export declare const isServer: boolean;
declare type StyledComponent<T> = T extends 'button' ? React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> : T extends 'input' ? React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> : T extends 'select' ? React.DetailedHTMLProps<React.SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement> : T extends keyof HTMLElementTagNameMap ? React.HTMLAttributes<HTMLElementTagNameMap[T]> : never;
export declare function getQueryStatusColor({ queryState, observerCount, isStale, theme, }: {
    queryState: Query['state'];
    observerCount: number;
    isStale: boolean;
    theme: Theme;
}): "#3f4e60" | "#00ab52" | "#006bff" | "#8c49eb" | "#ffb200";
export declare function getQueryStatusLabel(query: Query): "fetching" | "paused" | "inactive" | "stale" | "fresh";
declare type Styles = React.CSSProperties | ((props: Record<string, any>, theme: Theme) => React.CSSProperties);
export declare function styled<T extends keyof HTMLElementTagNameMap>(type: T, newStyles: Styles, queries?: Record<string, Styles>): React.ForwardRefExoticComponent<React.PropsWithoutRef<StyledComponent<T>> & React.RefAttributes<HTMLElementTagNameMap[T]>>;
export declare function useIsMounted(): () => boolean;
/**
 * Displays a string regardless the type of the data
 * @param {unknown} value Value to be stringified
 */
export declare const displayValue: (value: unknown) => string;
export {};
