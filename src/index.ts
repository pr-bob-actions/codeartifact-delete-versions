import { CodeartifactClient } from "@aws-sdk/client-codeartifact";
import { appendFileSync } from "fs";
import { deleteVersionsCmd, listVersionsCmd } from "./commands";
import { filterVersions, parseInputs, validateInputs } from "./helpers";

let client: CodeartifactClient;

async function main() {
  const inputs = parseInputs();
  const config = validateInputs(inputs);

  client = new CodeartifactClient({ region: config.registry.region });

  const versionListOutput = await client.send(listVersionsCmd(config));

  if (!versionListOutput.versions) {
    console.warn("No version found");
    return;
  }

  const versionList = versionListOutput.versions
    .map((v) => v.version)
    .filter((v) => v != undefined) as string[];
  console.log(versionList.length, "version(s) found");

  const [versionsToDelete, logs] = filterVersions(versionList, config.filter);
  console.log(versionsToDelete.length, "version(s) match");
  if (versionsToDelete.length > 0) {
    console.log("---");
    logs.forEach((log) => console.log(":::", ...log));
    console.log("---");
  }

  if (config.dryRun) {
    console.log("Dry Run Mode", "No delete");
    return;
  }

  if (versionsToDelete.length == 0) {
    console.log("No version to delete");
    return;
  }

  const deleteOutput = await client.send(
    deleteVersionsCmd(config, versionsToDelete)
  );

  if (deleteOutput.successfulVersions) {
    const deleted = Object.entries(deleteOutput.successfulVersions);
    const deletedVersionList = deleted.map(([v]) => v).join(",");

    outputs("number-of-deleted-versions", deleted.length.toString());
    outputs("deleted-versions", deletedVersionList);

    console.log(deleted.length, "versions deleted:");
    console.log(deletedVersionList);
  }

  if (deleteOutput.failedVersions) {
    if (Object.keys(deleteOutput.failedVersions).length == 0) {
      return;
    }
    console.error("Fail to delete some versions:");
    console.error(deleteOutput.failedVersions);
    throw "";
  }
}

function outputs(name: string, data: string) {
  const file = process.env.GITHUB_OUTPUT ?? "";
  const str = name + "=" + data + "\n";
  appendFileSync(file, str);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    client && client.destroy();
  });
