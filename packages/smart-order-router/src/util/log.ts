/* eslint-disable */

import Logger from 'bunyan';

class NullLogger implements Logger {
  private ERROR_MESSAGE =
    'NullLogger does not support. Instantiate a valid logger using "setGlobalLogger"';
  addStream(_stream: Logger.Stream): void {
    throw new Error(this.ERROR_MESSAGE);
  }
  addSerializers(_serializers: Logger.Serializers): void {
    throw new Error(this.ERROR_MESSAGE);
  }
  child(_options: Object, _simple?: boolean): Logger {
    return this;
  }
  reopenFileStreams(): void {
    throw new Error(this.ERROR_MESSAGE);
  }
  level(): number;
  level(value: Logger.LogLevel): void;
  level(_value?: any): number | void {
    return;
  }
  levels(): number[];
  levels(name: string | number): number;
  levels(name: string | number, value: Logger.LogLevel): void;
  levels(_name?: any, _value?: any): number | void | number[] {
    return;
  }
  fields: any;
  src = true;
  trace(): boolean;
  trace(error: Error, ...params: any[]): void;
  trace(obj: Object, ...params: any[]): void;
  trace(format: any, ...params: any[]): void;
  trace(..._rest: any): boolean | void {
    return true;
  }
  debug(): boolean;
  debug(error: Error, ...params: any[]): void;
  debug(obj: Object, ...params: any[]): void;
  debug(format: any, ...params: any[]): void;
  debug(..._rest: any): boolean | void {
    return true;
  }
  info(): boolean;
  info(error: Error, ...params: any[]): void;
  info(obj: Object, ...params: any[]): void;
  info(format: any, ...params: any[]): void;
  info(..._rest: any): boolean | void {
    return true;
  }
  warn(): boolean;
  warn(error: Error, ...params: any[]): void;
  warn(obj: Object, ...params: any[]): void;
  warn(format: any, ...params: any[]): void;
  warn(..._rest: any): boolean | void {
    return true;
  }
  error(): boolean;
  error(error: Error, ...params: any[]): void;
  error(obj: Object, ...params: any[]): void;
  error(format: any, ...params: any[]): void;
  error(..._rest: any): boolean | void {
    return true;
  }
  fatal(): boolean;
  fatal(error: Error, ...params: any[]): void;
  fatal(obj: Object, ...params: any[]): void;
  fatal(format: any, ...params: any[]): void;
  fatal(..._rest: any): boolean | void {
    return true;
  }
  addListener(
    _event: string | symbol,
    _listener: (...args: any[]) => void
  ): this {
    throw new Error(this.ERROR_MESSAGE);
  }
  on(_event: string | symbol, _listener: (...args: any[]) => void): this {
    throw new Error(this.ERROR_MESSAGE);
  }
  once(_event: string | symbol, _listener: (...args: any[]) => void): this {
    throw new Error(this.ERROR_MESSAGE);
  }
  removeListener(
    _event: string | symbol,
    _listener: (...args: any[]) => void
  ): this {
    throw new Error(this.ERROR_MESSAGE);
  }
  off(_event: string | symbol, _listener: (...args: any[]) => void): this {
    throw new Error(this.ERROR_MESSAGE);
  }
  removeAllListeners(_event?: string | symbol): this {
    throw new Error(this.ERROR_MESSAGE);
  }
  setMaxListeners(_n: number): this {
    throw new Error(this.ERROR_MESSAGE);
  }
  getMaxListeners(): number {
    throw new Error(this.ERROR_MESSAGE);
  }
  listeners(_event: string | symbol): Function[] {
    throw new Error(this.ERROR_MESSAGE);
  }
  rawListeners(_event: string | symbol): Function[] {
    throw new Error(this.ERROR_MESSAGE);
  }
  emit(_event: string | symbol, ..._args: any[]): boolean {
    throw new Error(this.ERROR_MESSAGE);
  }
  listenerCount(_event: string | symbol): number {
    throw new Error(this.ERROR_MESSAGE);
  }
  prependListener(
    _event: string | symbol,
    _listener: (...args: any[]) => void
  ): this {
    throw new Error(this.ERROR_MESSAGE);
  }
  prependOnceListener(
    _event: string | symbol,
    _listener: (...args: any[]) => void
  ): this {
    throw new Error(this.ERROR_MESSAGE);
  }
  eventNames(): (string | symbol)[] {
    throw new Error(this.ERROR_MESSAGE);
  }
}

export let log: Logger = new NullLogger();

export const setGlobalLogger = (_log: Logger) => {
  log = _log;
};
