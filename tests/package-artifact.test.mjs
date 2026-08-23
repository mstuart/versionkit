import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

test("npm pack creates an installable runtime-only package", async () => {
  const temporaryDirectory = await mkdtemp(
    join(tmpdir(), "versionkit-package-")
  );

  try {
    const { stdout } = await execFileAsync(
      "npm",
      [
        "pack",
        "--json",
        "--ignore-scripts",
        "--pack-destination",
        temporaryDirectory,
      ],
      { cwd: process.cwd() }
    );
    const [packResult] = JSON.parse(stdout);
    const tarballPath = join(temporaryDirectory, packResult.filename);

    await writeFile(
      join(temporaryDirectory, "package.json"),
      '{"private":true,"type":"module"}\n'
    );
    await execFileAsync(
      "npm",
      ["install", "--ignore-scripts", "--no-audit", "--no-fund", tarballPath],
      { cwd: temporaryDirectory }
    );

    await execFileAsync(
      process.execPath,
      [
        "--input-type=module",
        "--eval",
        "const packageModule = await import('versionkit'); if (typeof packageModule.createVersionRouter !== 'function') throw new Error('missing createVersionRouter export');",
      ],
      { cwd: temporaryDirectory }
    );

    const installedPackageDirectory = join(
      temporaryDirectory,
      "node_modules",
      "versionkit"
    );
    const installedPackage = JSON.parse(
      await readFile(join(installedPackageDirectory, "package.json"), "utf8")
    );

    await Promise.all(
      ["main", "types"].map((field) =>
        access(join(installedPackageDirectory, installedPackage[field]))
      )
    );

    const packedFiles = packResult.files.map(({ path }) => path);
    assert.equal(
      packedFiles.some(
        (path) => path.startsWith("tests/") || path.startsWith("dist/tests/")
      ),
      false,
      "published package should exclude test files"
    );
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true });
  }
});
