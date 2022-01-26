/// <reference types="react" />
import { ButtonProps as ButtonPropsOriginal } from 'rebass/styled-components';
declare type ButtonProps = Omit<ButtonPropsOriginal, 'css'>;
export declare const BaseButton: import("styled-components").StyledComponent<import("react").FunctionComponent<ButtonPropsOriginal>, import("styled-components").DefaultTheme, {
    padding?: string | undefined;
    width?: string | undefined;
    $borderRadius?: string | undefined;
    altDisabledStyle?: boolean | undefined;
} & ButtonProps, never>;
export declare const ButtonPrimary: import("styled-components").StyledComponent<import("react").FunctionComponent<ButtonPropsOriginal>, import("styled-components").DefaultTheme, {
    padding?: string | undefined;
    width?: string | undefined;
    $borderRadius?: string | undefined;
    altDisabledStyle?: boolean | undefined;
} & ButtonProps, never>;
export declare const ButtonLight: import("styled-components").StyledComponent<import("react").FunctionComponent<ButtonPropsOriginal>, import("styled-components").DefaultTheme, {
    padding?: string | undefined;
    width?: string | undefined;
    $borderRadius?: string | undefined;
    altDisabledStyle?: boolean | undefined;
} & ButtonProps, never>;
export declare const ButtonGray: import("styled-components").StyledComponent<import("react").FunctionComponent<ButtonPropsOriginal>, import("styled-components").DefaultTheme, {
    padding?: string | undefined;
    width?: string | undefined;
    $borderRadius?: string | undefined;
    altDisabledStyle?: boolean | undefined;
} & ButtonProps, never>;
export declare const ButtonSecondary: import("styled-components").StyledComponent<import("react").FunctionComponent<ButtonPropsOriginal>, import("styled-components").DefaultTheme, {
    padding?: string | undefined;
    width?: string | undefined;
    $borderRadius?: string | undefined;
    altDisabledStyle?: boolean | undefined;
} & ButtonProps, never>;
export declare const ButtonOutlined: import("styled-components").StyledComponent<import("react").FunctionComponent<ButtonPropsOriginal>, import("styled-components").DefaultTheme, {
    padding?: string | undefined;
    width?: string | undefined;
    $borderRadius?: string | undefined;
    altDisabledStyle?: boolean | undefined;
} & ButtonProps, never>;
export declare const ButtonYellow: import("styled-components").StyledComponent<import("react").FunctionComponent<ButtonPropsOriginal>, import("styled-components").DefaultTheme, {
    padding?: string | undefined;
    width?: string | undefined;
    $borderRadius?: string | undefined;
    altDisabledStyle?: boolean | undefined;
} & ButtonProps, never>;
export declare const ButtonEmpty: import("styled-components").StyledComponent<import("react").FunctionComponent<ButtonPropsOriginal>, import("styled-components").DefaultTheme, {
    padding?: string | undefined;
    width?: string | undefined;
    $borderRadius?: string | undefined;
    altDisabledStyle?: boolean | undefined;
} & ButtonProps, never>;
export declare const ButtonText: import("styled-components").StyledComponent<import("react").FunctionComponent<ButtonPropsOriginal>, import("styled-components").DefaultTheme, {
    padding?: string | undefined;
    width?: string | undefined;
    $borderRadius?: string | undefined;
    altDisabledStyle?: boolean | undefined;
} & ButtonProps, never>;
export declare function ButtonConfirmed({ confirmed, altDisabledStyle, ...rest }: {
    confirmed?: boolean;
    altDisabledStyle?: boolean;
} & ButtonProps): JSX.Element;
export declare function ButtonError({ error, ...rest }: {
    error?: boolean;
} & ButtonProps): JSX.Element;
export declare function ButtonDropdown({ disabled, children, ...rest }: {
    disabled?: boolean;
} & ButtonProps): JSX.Element;
export declare function ButtonDropdownLight({ disabled, children, ...rest }: {
    disabled?: boolean;
} & ButtonProps): JSX.Element;
export declare function ButtonRadioChecked({ active, children, ...rest }: {
    active?: boolean;
} & ButtonProps): JSX.Element;
export {};
