import { Color } from 'lib/theme';
import { FunctionComponent, SVGProps } from 'react';
import { Icon as FeatherIcon } from 'react-feather';
declare type SVGIcon = FunctionComponent<SVGProps<SVGSVGElement>>;
declare function icon(Icon: FeatherIcon | SVGIcon): import("styled-components").StyledComponent<FeatherIcon | SVGIcon, import("../theme/theme").ComputedTheme, {
    color?: keyof import("lib/theme").Colors | undefined;
}, never>;
export declare type Icon = ReturnType<typeof icon>;
export declare const largeIconCss: import("styled-components").FlattenInterpolation<import("styled-components").ThemedStyledProps<{
    iconSize: number;
}, import("../theme/theme").ComputedTheme>>;
interface LargeIconProps {
    icon: Icon;
    color?: Color;
    size?: number;
    className?: string;
}
export declare function LargeIcon({ icon: Icon, color, size, className }: LargeIconProps): JSX.Element;
export declare const AlertTriangle: import("styled-components").StyledComponent<FeatherIcon | SVGIcon, import("../theme/theme").ComputedTheme, {
    color?: keyof import("lib/theme").Colors | undefined;
}, never>;
export declare const ArrowDown: import("styled-components").StyledComponent<FeatherIcon | SVGIcon, import("../theme/theme").ComputedTheme, {
    color?: keyof import("lib/theme").Colors | undefined;
}, never>;
export declare const ArrowRight: import("styled-components").StyledComponent<FeatherIcon | SVGIcon, import("../theme/theme").ComputedTheme, {
    color?: keyof import("lib/theme").Colors | undefined;
}, never>;
export declare const ArrowUp: import("styled-components").StyledComponent<FeatherIcon | SVGIcon, import("../theme/theme").ComputedTheme, {
    color?: keyof import("lib/theme").Colors | undefined;
}, never>;
export declare const CheckCircle: import("styled-components").StyledComponent<FeatherIcon | SVGIcon, import("../theme/theme").ComputedTheme, {
    color?: keyof import("lib/theme").Colors | undefined;
}, never>;
export declare const ChevronDown: import("styled-components").StyledComponent<FeatherIcon | SVGIcon, import("../theme/theme").ComputedTheme, {
    color?: keyof import("lib/theme").Colors | undefined;
}, never>;
export declare const Clock: import("styled-components").StyledComponent<FeatherIcon | SVGIcon, import("../theme/theme").ComputedTheme, {
    color?: keyof import("lib/theme").Colors | undefined;
}, never>;
export declare const CreditCard: import("styled-components").StyledComponent<FeatherIcon | SVGIcon, import("../theme/theme").ComputedTheme, {
    color?: keyof import("lib/theme").Colors | undefined;
}, never>;
export declare const HelpCircle: import("styled-components").StyledComponent<FeatherIcon | SVGIcon, import("../theme/theme").ComputedTheme, {
    color?: keyof import("lib/theme").Colors | undefined;
}, never>;
export declare const Info: import("styled-components").StyledComponent<FeatherIcon | SVGIcon, import("../theme/theme").ComputedTheme, {
    color?: keyof import("lib/theme").Colors | undefined;
}, never>;
export declare const Link: import("styled-components").StyledComponent<FeatherIcon | SVGIcon, import("../theme/theme").ComputedTheme, {
    color?: keyof import("lib/theme").Colors | undefined;
}, never>;
export declare const Settings: import("styled-components").StyledComponent<FeatherIcon | SVGIcon, import("../theme/theme").ComputedTheme, {
    color?: keyof import("lib/theme").Colors | undefined;
}, never>;
export declare const Slash: import("styled-components").StyledComponent<FeatherIcon | SVGIcon, import("../theme/theme").ComputedTheme, {
    color?: keyof import("lib/theme").Colors | undefined;
}, never>;
export declare const Trash2: import("styled-components").StyledComponent<FeatherIcon | SVGIcon, import("../theme/theme").ComputedTheme, {
    color?: keyof import("lib/theme").Colors | undefined;
}, never>;
export declare const X: import("styled-components").StyledComponent<FeatherIcon | SVGIcon, import("../theme/theme").ComputedTheme, {
    color?: keyof import("lib/theme").Colors | undefined;
}, never>;
export declare const Check: import("styled-components").StyledComponent<FeatherIcon | SVGIcon, import("../theme/theme").ComputedTheme, {
    color?: keyof import("lib/theme").Colors | undefined;
}, never>;
export declare const Expando: import("styled-components").StyledComponent<FeatherIcon | SVGIcon, import("../theme/theme").ComputedTheme, {
    color?: keyof import("lib/theme").Colors | undefined;
} & {
    open: boolean;
}, never>;
export declare const Logo: import("styled-components").StyledComponent<FeatherIcon | SVGIcon, import("../theme/theme").ComputedTheme, {
    color?: keyof import("lib/theme").Colors | undefined;
}, never>;
export declare const Spinner: import("styled-components").StyledComponent<FeatherIcon | SVGIcon, import("../theme/theme").ComputedTheme, {
    color?: keyof import("lib/theme").Colors | undefined;
} & {
    color?: keyof import("lib/theme").Colors | undefined;
}, never>;
export {};
