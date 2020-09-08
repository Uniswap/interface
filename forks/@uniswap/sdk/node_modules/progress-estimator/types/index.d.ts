import { Chalk } from 'chalk';

export interface Spinner {
  interval: number;
  frames: string[];
}

export interface ChalkTheme extends Chalk {
  asciiCompleted: Chalk;
  asciiInProgress: Chalk;
  estimate: Chalk;
  estimateExceeded: Chalk;
  label: Chalk;
  percentage: Chalk;
  progressBackground: Chalk;
  progressForeground: Chalk;
}

export interface Configuration {
  spinner?: Spinner;
  storagePath?: string;
  theme?: ChalkTheme;
}

export interface ProgressEstimator {
  <T>(promise: Promise<T>, label: string, estimatedDuration?: number): Promise<
    T
  >;
  configure(options: Configuration): void;
  logProgress: ProgressEstimator;
}

export declare const configure: (options: Configuration) => void;
export declare const logProgress: ProgressEstimator;

declare const progressEstimator: ProgressEstimator;
export default progressEstimator;
