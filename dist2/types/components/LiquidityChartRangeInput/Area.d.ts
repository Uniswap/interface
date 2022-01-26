/// <reference types="react" />
import { ScaleLinear } from 'd3';
import { ChartEntry } from './types';
export declare const Area: ({ series, xScale, yScale, xValue, yValue, fill, }: {
    series: ChartEntry[];
    xScale: ScaleLinear<number, number>;
    yScale: ScaleLinear<number, number>;
    xValue: (d: ChartEntry) => number;
    yValue: (d: ChartEntry) => number;
    fill?: string | undefined;
}) => JSX.Element;
