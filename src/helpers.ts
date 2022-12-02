import { Config, Format, Inputs, Registry, VersionSelector } from "./types";

export function parseInputs(): Inputs {
  return {
    arn: process.env.INPUT_ARN ?? "",
    format: process.env.INPUT_FORMAT ?? "",
    packageName: process.env.INPUT_PACKAGE ?? "",
    namespace: process.env.INPUT_NAMESPACE ?? "",
    versions: process.env.INPUT_VERSIONS ?? "",
    prerelease: process.env.INPUT_PRERELEASE ?? "",
    match: process.env.INPUT_MATCH ?? "",
    dryRun: process.env.INPUT_DRYRUN ?? "",
  };
}

export function validateInputs(inputs: Inputs): Config {
  if (inputs.arn == "") {
    throw "ARN must be specified";
  }

  if (inputs.packageName == "") {
    throw "Package name must be specified";
  }

  const registry = decomposeARN(inputs.arn);
  const format = validateFormat(inputs.format);
  const packageName = inputs.packageName;
  const namespace = inputs.namespace != "" ? inputs.namespace : undefined;
  const versions = inputs.versions.split(/[,\s]/);
  const prerelease =
    inputs.prerelease != ""
      ? buildPrereleaseRegexp(inputs.prerelease)
      : undefined;
  const match = inputs.match != "" ? new RegExp(inputs.match) : undefined;

  const dryRun = inputs.dryRun != "" && inputs.dryRun != "false";

  return {
    registry,
    format,
    packageName,
    namespace,
    dryRun,
    filter: {
      versions,
      prerelease,
      match,
    },
  };
}

export function decomposeARN(arn: string): Registry {
  const [_arn, _aws, service, region, owner, repository] = arn.split(":");
  const [resourceType, domain, name] = repository?.split("/") ?? [];

  if (_arn.toLowerCase() != "arn" || _aws.toLowerCase() != "aws") {
    throw "This is not an AWS ARN Code";
  }

  if (service.toLowerCase() != "codeartifact") {
    throw "This is not a Codeartifact ARN";
  }

  if (resourceType.toLowerCase() != "repository") {
    throw "This ARN do not relate to a codeartifact repository";
  }

  return {
    region,
    owner,
    domain,
    repository: name,
  };
}

export function validateFormat(format: string): Format {
  switch (format) {
    case "npm":
      return "npm";
    case "pypi":
      return "pypi";
    default:
      throw "Bad format";
  }
}

export function buildPrereleaseRegexp(prerelease: string): RegExp {
  return new RegExp(`^(?:[0-9]+\.){2}[0-9]+-${prerelease}`);
}

export function filterVersions(
  list: string[],
  filter: VersionSelector
): [string[], string[][]] {
  const versions: string[] = [];
  const logs: string[][] = [];

  list.forEach((version) => {
    if (filter.versions.includes(version)) {
      versions.push(version);
      logs.push([
        version,
        "exact match",
        "[" + filter.versions.join(" | ") + "]",
      ]);
      return;
    }

    if (filter.prerelease?.test(version)) {
      versions.push(version);
      logs.push([
        version,
        "match prerelease pattern",
        filter.prerelease?.toString(),
      ]);
      return;
    }

    if (filter.match?.test(version)) {
      versions.push(version);
      logs.push([version, "match regexp", filter.match?.toString()]);
    }
  });

  return [versions, logs];
}
