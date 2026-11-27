// Reads a JSON file as it is at a git ref, for the --against checks of
// design-audit and design-lint-ratchet. Returns undefined only when the ref
// exists and does not contain the file (first introduction); any git failure
// (no repository, unknown ref, unreadable object) and invalid JSON throw.
import { spawnSync } from "node:child_process";

export function readJsonAtRef(ref, path) {
  const git = (args) => {
    const r = spawnSync("git", args, { encoding: "utf8" });
    if (r.error) throw new Error(`--against: cannot run git: ${r.error.message}`);
    return r;
  };
  const firstLine = (r) => r.stderr.trim().split("\n")[0];
  const verify = git(["rev-parse", "--verify", `${ref}^{commit}`]);
  if (verify.status !== 0) throw new Error(`--against: git could not resolve "${ref}": ${firstLine(verify)}`);
  const listed = git(["ls-tree", "--name-only", ref, "--", path]);
  if (listed.status !== 0) throw new Error(`--against: git ls-tree ${ref} failed: ${firstLine(listed)}`);
  if (!listed.stdout.trim()) return undefined;
  const show = git(["show", `${ref}:./${path}`]);
  if (show.status !== 0) throw new Error(`--against: git show ${ref}:${path} failed: ${firstLine(show)}`);
  try {
    return JSON.parse(show.stdout);
  } catch (err) {
    throw new Error(`--against: ${ref}:${path} is not valid JSON: ${err.message}`);
  }
}
