import { Theme } from 'lib/theme';
declare const Column: import("styled-components").StyledComponent<"div", import("../theme/theme").ComputedTheme, {
    align?: string | undefined;
    color?: keyof import("lib/theme").Colors | undefined;
    justify?: string | undefined;
    gap?: number | undefined;
    padded?: true | undefined;
    flex?: true | undefined;
    grow?: true | undefined;
    theme: Theme;
    css?: import("styled-components").FlattenInterpolation<import("styled-components").ThemedStyledProps<object, import("../theme/theme").ComputedTheme>> | undefined;
}, never>;
export default Column;
