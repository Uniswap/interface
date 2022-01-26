import React from 'react';
import { TextProps as TextPropsOriginal } from 'rebass';
import { DefaultTheme } from 'styled-components/macro';
export * from './components';
declare type TextProps = Omit<TextPropsOriginal, 'css'>;
export declare const MEDIA_WIDTHS: {
    upToExtraSmall: number;
    upToSmall: number;
    upToMedium: number;
    upToLarge: number;
};
export declare enum Z_INDEX {
    deprecated_zero = 0,
    deprecated_content = 1,
    dropdown = 1000,
    sticky = 1020,
    fixed = 1030,
    modalBackdrop = 1040,
    offcanvas = 1050,
    modal = 1060,
    popover = 1070,
    tooltip = 1080
}
export default function ThemeProvider({ children }: {
    children: React.ReactNode;
}): JSX.Element;
/**
 * Preset styles of the Rebass Text component
 */
export declare const ThemedText: {
    Main(props: TextProps): JSX.Element;
    Link(props: TextProps): JSX.Element;
    Label(props: TextProps): JSX.Element;
    Black(props: TextProps): JSX.Element;
    White(props: TextProps): JSX.Element;
    Body(props: TextProps): JSX.Element;
    LargeHeader(props: TextProps): JSX.Element;
    MediumHeader(props: TextProps): JSX.Element;
    SubHeader(props: TextProps): JSX.Element;
    Small(props: TextProps): JSX.Element;
    Blue(props: TextProps): JSX.Element;
    Yellow(props: TextProps): JSX.Element;
    DarkGray(props: TextProps): JSX.Element;
    Gray(props: TextProps): JSX.Element;
    Italic(props: TextProps): JSX.Element;
    Error({ error, ...props }: {
        error: boolean;
    } & TextProps): JSX.Element;
};
export declare const ThemedGlobalStyle: import("styled-components").GlobalStyleComponent<{}, DefaultTheme>;
