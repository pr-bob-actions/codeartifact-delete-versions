export type Format = "npm" | "pypi";
export interface Inputs {
  arn: string;
  format: string;
  packageName: string;
  namespace: string;
  versions: string;
  prerelease: string;
  match: string;
  dryRun: string;
}

export interface Registry {
  domain: string;
  owner: string;
  region: string;
  repository: string;
}

export interface VersionSelector {
  versions: string[];
  prerelease?: RegExp;
  match?: RegExp;
}

export interface Config {
  registry: Registry;
  format: Format;
  packageName: string;

  namespace?: string;
  dryRun: boolean;

  filter: VersionSelector;
}
