import type { AppType, DocumentType, NextComponentType } from '../shared/lib/utils';
import type { PageConfig, GetStaticPaths, GetServerSideProps, GetStaticProps } from 'next/types';
import { BuildManifest } from './get-page-files';
export declare type ManifestItem = {
    id: number | string;
    files: string[];
};
export declare type ReactLoadableManifest = {
    [moduleId: string]: ManifestItem;
};
export declare type LoadComponentsReturnType = {
    Component: NextComponentType;
    pageConfig: PageConfig;
    buildManifest: BuildManifest;
    subresourceIntegrityManifest?: Record<string, string>;
    reactLoadableManifest: ReactLoadableManifest;
    serverComponentManifest?: any;
    Document: DocumentType;
    App: AppType;
    getStaticProps?: GetStaticProps;
    getStaticPaths?: GetStaticPaths;
    getServerSideProps?: GetServerSideProps;
    ComponentMod: any;
    isAppPath?: boolean;
    pathname: string;
};
export declare function loadDefaultErrorComponents(distDir: string): Promise<{
    App: any;
    Document: any;
    Component: any;
    pageConfig: {};
    buildManifest: any;
    reactLoadableManifest: {};
    ComponentMod: any;
    pathname: string;
}>;
export declare function loadComponents({ distDir, pathname, serverless, hasServerComponents, isAppPath, }: {
    distDir: string;
    pathname: string;
    serverless: boolean;
    hasServerComponents: boolean;
    isAppPath: boolean;
}): Promise<LoadComponentsReturnType>;
