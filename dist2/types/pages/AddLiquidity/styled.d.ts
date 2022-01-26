/// <reference types="react" />
import CurrencyInputPanel from 'components/CurrencyInputPanel';
export declare const PageWrapper: import("styled-components").StyledComponent<"main", import("styled-components").DefaultTheme, {
    margin?: string | undefined;
    maxWidth?: string | undefined;
} & {
    wide: boolean;
}, never>;
export declare const Wrapper: import("styled-components").StyledComponent<"div", import("styled-components").DefaultTheme, {}, never>;
export declare const ScrollablePage: import("styled-components").StyledComponent<"div", import("styled-components").DefaultTheme, {}, never>;
export declare const DynamicSection: import("styled-components").StyledComponent<"div", import("styled-components").DefaultTheme, {
    gap?: string | undefined;
    justify?: "end" | "space-between" | "stretch" | "center" | "flex-end" | "flex-start" | "start" | undefined;
} & {
    disabled?: boolean | undefined;
}, never>;
export declare const CurrencyDropdown: import("styled-components").StyledComponent<typeof CurrencyInputPanel, import("styled-components").DefaultTheme, {}, never>;
export declare const StyledInput: import("styled-components").StyledComponent<import("react").NamedExoticComponent<{
    value: string | number;
    onUserInput: (input: string) => void;
    error?: boolean | undefined;
    fontSize?: string | undefined;
    align?: "left" | "right" | undefined;
    prependSymbol?: string | undefined;
} & Omit<import("react").HTMLProps<HTMLInputElement>, "ref" | "onChange" | "as">>, import("styled-components").DefaultTheme, {}, never>;
export declare const ResponsiveTwoColumns: import("styled-components").StyledComponent<"div", import("styled-components").DefaultTheme, {
    wide: boolean;
}, never>;
export declare const RightContainer: import("styled-components").StyledComponent<"div", import("styled-components").DefaultTheme, {
    gap?: string | undefined;
    justify?: "end" | "space-between" | "stretch" | "center" | "flex-end" | "flex-start" | "start" | undefined;
}, never>;
export declare const StackedContainer: import("styled-components").StyledComponent<"div", import("styled-components").DefaultTheme, {}, never>;
export declare const StackedItem: import("styled-components").StyledComponent<"div", import("styled-components").DefaultTheme, {
    zIndex?: number | undefined;
}, never>;
export declare const MediumOnly: import("styled-components").StyledComponent<"div", import("styled-components").DefaultTheme, {}, never>;
export declare const HideMedium: import("styled-components").StyledComponent<"div", import("styled-components").DefaultTheme, {}, never>;
