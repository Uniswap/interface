type Options = {
  cwd?: string;
  dot?: boolean;
  absolute?: boolean;
  filesOnly?: boolean;
  flush?: boolean;
};

type FilePath = string;

declare function glob(str: string, opts?: Options): Promise<FilePath[]>;

export = glob;
