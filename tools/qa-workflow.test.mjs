import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import YAML from "yaml";

const workflow = YAML.parse(readFileSync(new URL("../.github/workflows/qa.yml", import.meta.url), "utf8"));

test("qa workflow runs weekly and on demand, besides pull requests and pushes to main", () => {
  assert.ok("pull_request" in workflow.on);
  assert.deepEqual(workflow.on.push, { branches: ["main"] });
  assert.ok("workflow_dispatch" in workflow.on);
  assert.equal(workflow.on.schedule.length, 1);
  assert.match(workflow.on.schedule[0].cron, /^\d{1,2} 0 \* \* 1$/);
});

test("design-contract runs lint, unit tests and the audit on every event, with --against only for PR/push", () => {
  const steps = workflow.jobs["design-contract"].steps;
  const runs = steps.filter((s) => s.run).map((s) => ({ if: s.if ?? "always", run: s.run }));
  for (const script of ["design:lint", "test:design", "design:audit"]) {
    // A step without `if` runs on every event; otherwise it must name both.
    const plain = runs.find(
      (s) => s.run.includes(`npm run ${script}`) && (s.if === "always" || (/'schedule'/.test(s.if) && /'workflow_dispatch'/.test(s.if))),
    );
    assert.ok(plain, `no step runs ${script} on schedule and workflow_dispatch`);
    assert.doesNotMatch(plain.run, /--against/);
  }
  const prLint = runs.find((s) => s.if.includes("pull_request") && s.run.includes("design:lint"));
  const prAudit = runs.find((s) => s.if.includes("pull_request") && s.run.includes("design:audit"));
  assert.match(prLint.run, /--against "origin\/\$BASE_REF"/);
  assert.match(prAudit.run, /--against "origin\/\$BASE_REF"/);
  const pushLint = runs.find((s) => s.if.includes("'push'") && s.run.includes("design:lint"));
  const pushAudit = runs.find((s) => s.if.includes("'push'") && s.run.includes("design:audit"));
  assert.match(pushLint.run, /--against "\$BEFORE"/);
  assert.match(pushAudit.run, /--against "\$BEFORE"/);
});

test("browser and lighthouse jobs only run for pull requests and pushes", () => {
  for (const job of ["browser-contract", "lighthouse-mobile"]) {
    assert.equal(workflow.jobs[job].if, "github.event_name == 'pull_request' || github.event_name == 'push'");
  }
});
