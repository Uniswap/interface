import { Theme } from 'lib/theme';
import { ReactNode } from 'react';
declare const Row: import("styled-components").StyledComponent<"div", import("../theme/theme").ComputedTheme, {
    color?: keyof import("lib/theme").Colors | undefined;
    align?: string | undefined;
    justify?: string | undefined;
    pad?: number | undefined;
    gap?: number | undefined;
    flex?: true | undefined;
    grow?: true | "first" | "last" | undefined;
    children?: ReactNode;
    theme: Theme;
}, never>;
export default Row;
