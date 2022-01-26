/// <reference types="react" />
import { ScaleLinear, ZoomTransform } from 'd3';
import { ZoomLevels } from './types';
export declare const ZoomOverlay: import("styled-components").StyledComponent<"rect", import("styled-components").DefaultTheme, {}, never>;
export default function Zoom({ svg, xScale, setZoom, width, height, resetBrush, showResetButton, zoomLevels, }: {
    svg: SVGElement | null;
    xScale: ScaleLinear<number, number>;
    setZoom: (transform: ZoomTransform) => void;
    width: number;
    height: number;
    resetBrush: () => void;
    showResetButton: boolean;
    zoomLevels: ZoomLevels;
}): JSX.Element;
