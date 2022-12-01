import {
  DeletePackageVersionsCommand,
  ListPackageVersionsCommand,
} from "@aws-sdk/client-codeartifact";
import { Config } from "./types";

export function listVersionsCmd(config: Config): ListPackageVersionsCommand {
  return new ListPackageVersionsCommand(baseCmdInput(config));
}

export function deleteVersionsCmd(
  config: Config,
  versions: string[]
): DeletePackageVersionsCommand {
  return new DeletePackageVersionsCommand({
    ...baseCmdInput(config),
    versions: versions,
  });
}

function baseCmdInput(config: Config) {
  const { registry, format, packageName, namespace } = config;
  const { domain, owner, repository } = registry;

  return {
    domain,
    domainOwner: owner,
    repository,
    format,
    package: packageName,
    namespace,
  };
}
