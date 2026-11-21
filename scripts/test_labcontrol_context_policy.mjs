import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const src = readFileSync("assets/js/lab-control-context-policy.js", "utf8");
const browser = { window: {}, URLSearchParams };
vm.runInNewContext(src, browser);
const p = browser.window.LabControlContextPolicy;
const mode = hash => p.classifyContext(hash).mode;

assert.equal(mode(""), "public");
assert.equal(mode("#lab-return=https%3A%2F%2Flabcontrol.example"), "public");
assert.equal(mode("#lab-access=secret"), "pending-participant");
assert.equal(mode("#lab-demo=session-1"), "demo");
assert.equal(mode("#lab-access=secret&lab-demo=session-1"), "invalid");

const idA = { courseSessionId: "session-1", enrollmentId: "enrollment-a" };
const idB = { courseSessionId: "session-2", enrollmentId: "enrollment-a" };
const idC = { courseSessionId: "session-1", enrollmentId: "enrollment-b" };
const keyA = p.officialProgressKey(idA, "course", "l001");
assert.equal(keyA, "netec:labcontrol:stepProgress:v1:session-1:enrollment-a:course:l001");
assert.notEqual(keyA, p.officialProgressKey(idB, "course", "l001"));
assert.notEqual(keyA, p.officialProgressKey(idC, "course", "l001"));
assert.notEqual(keyA, p.officialProgressKey(idA, "course", "l002"));
assert.equal(p.officialProgressKey(null, "course", "l001"), null);
assert.equal(p.officialProgressKey(
  { courseSessionId: "session-1", enrollmentId: "a:b" }, "course", "l001"
), null);
assert.equal(
  p.officialQueueKey(idA, "course", "l001"),
  "netec:labcontrol:trackingQueue:v1:session-1:enrollment-a:course:l001"
);
assert.ok(!keyA.includes("secret"));
console.log("Contexto #130: 12 aserciones PASS (modo público, demo, oficial pendiente, claves aisladas).");
