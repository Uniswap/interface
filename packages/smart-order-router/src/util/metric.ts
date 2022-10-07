import Logger from 'bunyan';

import { log } from './log';

export enum MetricLoggerUnit {
  Seconds = 'Seconds',
  Microseconds = 'Microseconds',
  Milliseconds = 'Milliseconds',
  Bytes = 'Bytes',
  Kilobytes = 'Kilobytes',
  Megabytes = 'Megabytes',
  Gigabytes = 'Gigabytes',
  Terabytes = 'Terabytes',
  Bits = 'Bits',
  Kilobits = 'Kilobits',
  Megabits = 'Megabits',
  Gigabits = 'Gigabits',
  Terabits = 'Terabits',
  Percent = 'Percent',
  Count = 'Count',
  BytesPerSecond = 'Bytes/Second',
  KilobytesPerSecond = 'Kilobytes/Second',
  MegabytesPerSecond = 'Megabytes/Second',
  GigabytesPerSecond = 'Gigabytes/Second',
  TerabytesPerSecond = 'Terabytes/Second',
  BitsPerSecond = 'Bits/Second',
  KilobitsPerSecond = 'Kilobits/Second',
  MegabitsPerSecond = 'Megabits/Second',
  GigabitsPerSecond = 'Gigabits/Second',
  TerabitsPerSecond = 'Terabits/Second',
  CountPerSecond = 'Count/Second',
  None = 'None',
}

export abstract class IMetric {
  abstract putDimensions(dimensions: Record<string, string>): void;
  abstract putMetric(key: string, value: number, unit?: MetricLoggerUnit): void;
}

interface MetricContext {
  chainId: number;
  networkName: string;
}

export class MetricLogger extends IMetric {
  private log: Logger;

  constructor(context?: MetricContext) {
    super();
    this.log = log.child(context || {});
  }

  public putDimensions(dimensions: Record<string, string>): void {
    this.log = this.log.child(dimensions);
  }

  public putMetric(key: string, value: number, unit?: MetricLoggerUnit): void {
    this.log.info(
      { key, value, unit },
      `[Metric]: ${key}: ${value} | ${unit ? unit : ''}`
    );
  }
}

export let metric: IMetric = new MetricLogger();

export const setGlobalMetric = (_metric: IMetric) => {
  metric = _metric;
};
