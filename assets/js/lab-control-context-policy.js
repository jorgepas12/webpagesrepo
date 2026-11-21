/*
 * #130 — Evaluador puro de contexto para el futuro runtime Jekyll.
 * Todavía NO se carga en _layouts/default.html: no altera la experiencia
 * pública ni la sincronización vigente hasta completar el handoff seguro.
 */
(function (root) {
  "use strict";

  function classifyContext(fragment) {
    const hash = typeof fragment === "string"
      ? fragment.replace(/^#/, "") : "";
    const params = new URLSearchParams(hash);
    const access = params.get("lab-access");
    const demo = params.get("lab-demo");

    // Dos señales contradictorias no deben activar ningún modo privilegiado.
    if (access && demo) return { mode: "invalid", reason: "conflicting-context" };
    if (demo) return { mode: "demo", sessionId: demo };
    if (access) return { mode: "pending-participant" };
    // Ni lab-return ni un token residual de sessionStorage habilitan el modo oficial.
    return { mode: "public" };
  }

  function officialProgressKey(identity, courseId, labId) {
    const { courseSessionId, enrollmentId } = identity || {};
    if (![courseSessionId, enrollmentId, courseId, labId].every(
      value => typeof value === "string" && /^[a-zA-Z0-9_-]+$/.test(value)
    )) return null;
    return [
      "netec:labcontrol:stepProgress:v1",
      courseSessionId,
      enrollmentId,
      courseId,
      labId
    ].join(":");
  }

  function officialQueueKey(identity, courseId, labId) {
    const progressKey = officialProgressKey(identity, courseId, labId);
    return progressKey && progressKey.replace(
      "netec:labcontrol:stepProgress:v1:",
      "netec:labcontrol:trackingQueue:v1:"
    );
  }

  const api = Object.freeze({
    classifyContext,
    officialProgressKey,
    officialQueueKey
  });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LabControlContextPolicy = api;
})(typeof window === "undefined" ? {} : window);
