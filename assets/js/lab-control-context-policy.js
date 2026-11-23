/*
 * #130 — Evaluador de contexto para Jekyll público, LabControl y demo.
 * Se carga antes de lab-progress.js: el acceso oficial requiere validación
 * de matrícula y Lab disponible; el modo público permanece independiente.
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
    // Marcador sin credenciales para navegación oficial y recarga. El servidor
    // vuelve a validar token de sessionStorage y disponibilidad del Lab.
    if (params.get("lab-lc") === "1") return { mode: "pending-participant", resume: true };
    // Ni lab-return ni un token residual de sessionStorage habilitan el modo oficial.
    return { mode: "public" };
  }

  async function validateParticipantContext(fetchImpl, apiBaseUrl, token, expectedTrackingId) {
    if (typeof fetchImpl !== "function" ||
        typeof apiBaseUrl !== "string" ||
        !/^https:\/\/[^?#]+$/i.test(apiBaseUrl) ||
        typeof token !== "string" || !token ||
        typeof expectedTrackingId !== "string" || !expectedTrackingId) {
      return null;
    }
    try {
      const response = await fetchImpl(
        apiBaseUrl.replace(/\/$/, "") + "/participant-access/me",
        { method: "GET", headers: { Authorization: "Bearer " + token } }
      );
      if (!response || !response.ok) return null;
      const payload = await response.json();
      const identity = payload?.participantAccess;
      if (!identity ||
          identity.courseTrackingId !== expectedTrackingId ||
          typeof identity.courseSessionId !== "string" ||
          typeof identity.enrollmentId !== "string") return null;
      // Do not return, log or persist the bearer token.
      return {
        courseSessionId: identity.courseSessionId,
        enrollmentId: identity.enrollmentId
      };
    } catch {
      return null;
    }
  }

  async function validateLabAccess(fetchImpl, apiBaseUrl, token, trackingId, labTrackingId) {
    const identity = await validateParticipantContext(
      fetchImpl, apiBaseUrl, token, trackingId
    );
    if (!identity || typeof labTrackingId !== "string" || !labTrackingId) return null;
    try {
      const response = await fetchImpl(
        apiBaseUrl.replace(/\/$/, "") + "/tracking/progress",
        { method: "GET", headers: { Authorization: "Bearer " + token } }
      );
      if (!response?.ok) return null;
      const payload = await response.json();
      if (payload?.enrollment?.id !== identity.enrollmentId ||
          payload?.courseSession?.id !== identity.courseSessionId ||
          payload?.course?.trackingId !== trackingId ||
          !Array.isArray(payload.labs)) return null;
      const lab = payload.labs.find(item => item.labTrackingId === labTrackingId);
      if (!lab || lab.availabilityStatus !== "AVAILABLE" ||
          lab.individuallyBlocked || typeof lab.launchUrl !== "string" ||
          !lab.launchUrl) return null;
      return identity;
    } catch {
      return null;
    }
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
    validateParticipantContext,
    validateLabAccess,
    officialProgressKey,
    officialQueueKey
  });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LabControlContextPolicy = api;
})(typeof window === "undefined" ? {} : window);
