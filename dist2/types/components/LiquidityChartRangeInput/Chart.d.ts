/// <reference types="react" />
import { ChartEntry, LiquidityChartRangeInputProps } from './types';
export declare const xAccessor: (d: ChartEntry) => number;
export declare const yAccessor: (d: ChartEntry) => number;
export declare function Chart({ id, data: { series, current }, ticksAtLimit, styles, dimensions: { width, height }, margins, interactive, brushDomain, brushLabels, onBrushDomainChange, zoomLevels, }: LiquidityChartRangeInputProps): JSX.Element;
