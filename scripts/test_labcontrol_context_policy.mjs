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

const validResponse = {
  ok: true,
  async json() {
    return { participantAccess: {
      courseTrackingId: "ckapriv",
      courseSessionId: "session-cka",
      enrollmentId: "enrollment-test"
    } };
  }
};
const requests = [];
const accepted = await p.validateParticipantContext(
  async (url, options) => {
    requests.push({ url, options });
    return validResponse;
  },
  "https://labcontrol.example/api",
  "token-privado",
  "ckapriv"
);
assert.equal(accepted.courseSessionId, "session-cka");
assert.equal(accepted.enrollmentId, "enrollment-test");
assert.equal(requests[0].url, "https://labcontrol.example/api/participant-access/me");
assert.equal(requests[0].options.headers.Authorization, "Bearer token-privado");
assert.ok(!JSON.stringify(accepted).includes("token-privado"));

assert.equal(
  await p.validateParticipantContext(async () => validResponse,
    "https://labcontrol.example/api", "token-privado", "otrocurso"),
  null, "La identidad debe corresponder al curso abierto"
);
assert.equal(
  await p.validateParticipantContext(async () => ({ ok: false, status: 401 }),
    "https://labcontrol.example/api", "token-expirado", "ckapriv"),
  null, "Una sesión expirada no activa progreso oficial"
);
assert.equal(
  await p.validateParticipantContext(async () => { throw new Error("offline"); },
    "https://labcontrol.example/api", "token-privado", "ckapriv"),
  null, "Sin confirmación de API no se habilita un contexto oficial"
);
assert.equal(
  await p.validateParticipantContext(async () => validResponse,
    "http://labcontrol.example/api", "token-privado", "ckapriv"),
  null, "No enviar tokens por HTTP"
);
assert.equal(
  await p.validateParticipantContext(async () => validResponse,
    "https://labcontrol.example/api", "", "ckapriv"),
  null, "No autenticar sin token"
);


const progressPayload = {
  enrollment: { id: "enrollment-test" },
  courseSession: { id: "session-cka" },
  course: { trackingId: "ckapriv" },
  labs: [
    { labTrackingId: "l001", availabilityStatus: "AVAILABLE",
      individuallyBlocked: false, launchUrl: "https://labs.example/cka/lab1" },
    { labTrackingId: "l002", availabilityStatus: "AVAILABLE",
      individuallyBlocked: true, launchUrl: null },
    { labTrackingId: "l003", availabilityStatus: "LOCKED",
      individuallyBlocked: false, launchUrl: null }
  ]
};
const accessFetch = async url => {
  if (url.endsWith("/participant-access/me")) return validResponse;
  if (url.endsWith("/tracking/progress")) return {
    ok: true, json: async () => progressPayload
  };
  throw new Error("Ruta no permitida");
};
assert.equal(
  (await p.validateLabAccess(accessFetch, "https://labcontrol.example/api",
    "token-privado", "ckapriv", "l001")).enrollmentId,
  "enrollment-test"
);
assert.equal(
  await p.validateLabAccess(accessFetch, "https://labcontrol.example/api",
    "token-privado", "ckapriv", "l002"),
  null, "Un Lab individualmente bloqueado no habilita el modo oficial"
);
assert.equal(
  await p.validateLabAccess(accessFetch, "https://labcontrol.example/api",
    "token-privado", "ckapriv", "l003"),
  null, "Un Lab globalmente bloqueado no habilita el modo oficial"
);
assert.equal(
  await p.validateLabAccess(accessFetch, "https://labcontrol.example/api",
    "token-privado", "ckapriv", "l404"),
  null, "Un Lab no presente en la sesión no habilita el modo oficial"
);
assert.equal(
  await p.validateLabAccess(async url => {
    if (url.endsWith("/participant-access/me")) return validResponse;
    return {ok: false, status: 403};
  }, "https://labcontrol.example/api", "token-privado", "ckapriv", "l001"),
  null, "El rechazo 403 de tracking mantiene denegado el acceso"
);

console.log("Contexto #130: aserciones PASS (modo público, demo, oficial pendiente, claves aisladas).");
