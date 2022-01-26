import { ReactNode } from 'react';
import { AnyStyledComponent } from 'styled-components';
export declare const optionCss: (selected: boolean) => import("styled-components").FlattenInterpolation<import("styled-components").ThemeProps<import("../../../theme/theme").ComputedTheme>>;
export declare function value(Value: AnyStyledComponent): import("styled-components").StyledComponent<any, import("../../../theme/theme").ComputedTheme, any, any>;
interface LabelProps {
    name: ReactNode;
    tooltip?: ReactNode;
}
export declare function Label({ name, tooltip }: LabelProps): JSX.Element;
export {};
