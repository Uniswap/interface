import type { RenderOpts } from './render';
declare function postProcessHTML(pathname: string, content: string, renderOpts: RenderOpts, { inAmpMode, hybridAmp }: {
    inAmpMode: boolean;
    hybridAmp: boolean;
}): Promise<string>;
export { postProcessHTML };
