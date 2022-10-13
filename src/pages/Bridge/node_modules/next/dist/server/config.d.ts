import { NextConfigComplete } from './config-shared';
export { DomainLocale, NextConfig, normalizeConfig } from './config-shared';
export declare function setHttpAgentOptions(options: NextConfigComplete['httpAgentOptions']): void;
export default function loadConfig(phase: string, dir: string, customConfig?: object | null): Promise<NextConfigComplete>;
