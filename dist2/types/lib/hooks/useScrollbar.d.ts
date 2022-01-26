interface ScrollbarOptions {
    padded?: boolean;
}
export default function useScrollbar(element: HTMLElement | null, { padded }?: ScrollbarOptions): import("styled-components").FlattenInterpolation<import("styled-components").ThemeProps<import("../theme/theme").ComputedTheme>>;
export {};
