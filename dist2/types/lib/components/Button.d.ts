import { Icon } from 'lib/icons';
import { ComponentProps } from 'react';
export declare const BaseButton: import("styled-components").StyledComponent<"button", import("../theme/theme").ComputedTheme, {}, never>;
declare const _default: import("styled-components").StyledComponent<"button", import("../theme/theme").ComputedTheme, {
    color?: keyof import("lib/theme").Colors | undefined;
}, never>;
export default _default;
export declare const TextButton: import("styled-components").StyledComponent<"button", import("../theme/theme").ComputedTheme, {
    color?: keyof import("lib/theme").Colors | undefined;
}, never>;
interface IconButtonProps {
    icon: Icon;
    iconProps?: ComponentProps<Icon>;
}
export declare function IconButton({ icon: Icon, iconProps, ...props }: IconButtonProps & ComponentProps<typeof BaseButton>): JSX.Element;
