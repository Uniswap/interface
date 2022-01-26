/// <reference types="react" />
import { ScaleLinear } from 'd3';
export declare const Brush: ({ id, xScale, interactive, brushLabelValue, brushExtent, setBrushExtent, innerWidth, innerHeight, westHandleColor, eastHandleColor, }: {
    id: string;
    xScale: ScaleLinear<number, number>;
    interactive: boolean;
    brushLabelValue: (d: 'w' | 'e', x: number) => string;
    brushExtent: [number, number];
    setBrushExtent: (extent: [number, number], mode: string | undefined) => void;
    innerWidth: number;
    innerHeight: number;
    westHandleColor: string;
    eastHandleColor: string;
}) => JSX.Element;
