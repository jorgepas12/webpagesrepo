/*
 * #130 — Handoff oficial antes de inicializar progreso/tracking.
 * Publico: no se lee ni escribe en el espacio de LabControl.
 * Demo: se conserva el modulo existente del instructor.
 */
(function () {
  "use strict";
  const policy = window.LabControlContextPolicy;
  const root = document.querySelector("article.lab");
  const nav = window.LabControlDemo;
  const mode = policy?.classifyContext(window.location.hash) ?? { mode: "public" };
  const state = { mode: mode.mode === "demo" ? "demo" : mode.mode === "public" ? "public" : "pending",
    identity: null, token: null, returnUrl: null, labs: [] };
  const accessKey = "netec:participantAccessToken";
  const returnKey = "netec:labControlReturnUrl";

  function validReturn(value, apiUrl) {
    if (!value || !apiUrl) return null;
    try {
      const target = new URL(value);
      const origin = new URL(apiUrl).origin;
      return target.protocol === "https:" && target.origin === origin &&
        target.pathname === "/participant" && !target.username &&
        !target.password && !target.hash ? target.toString() : null;
    } catch { return null; }
  }

  async function activate() {
    if (!root || !policy) return;
    if (state.mode === "public" || state.mode === "demo") return;
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const token = fragment.get("lab-access");
    // Nunca confiar en tokens de una pagina publica anterior.
    if (mode.mode !== "pending-participant" || !token) {
      state.mode = "denied";
      return;
    }
    const apiUrl = root.dataset.trackingApi;
    const course = root.dataset.courseId;
    const lab = root.dataset.labId;
    const identity = await policy.validateLabAccess(fetch.bind(window), apiUrl, token, course, lab);
    if (!identity) {
      state.mode = "denied";
      return;
    }
    state.mode = "participant";
    state.identity = identity;
    state.token = token;
    state.returnUrl = validReturn(fragment.get("lab-return"), apiUrl);
    sessionStorage.setItem(accessKey, token);
    if (state.returnUrl) sessionStorage.setItem(returnKey, state.returnUrl);
    // Se elimina el token de la barra, permaneciendo solamente en memoria y
    // sessionStorage hasta la salida. El modo publico ignora ambos.
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  const ready = activate().catch(() => { state.mode = "denied"; });
  function progressKey(course, lab) {
    return state.mode === "participant"
      ? policy.officialProgressKey(state.identity, course, lab) : null;
  }
  function queueKey(course, lab) {
    return state.mode === "participant"
      ? policy.officialQueueKey(state.identity, course, lab) : null;
  }
  function showDenied() {
    if (document.getElementById("labcontrol-official-denied")) return;
    const message = document.createElement("div");
    message.id = "labcontrol-official-denied";
    message.setAttribute("role", "alert");
    message.textContent = "No se pudo validar el acceso de LabControl a este laboratorio. Regresa a la sesion y abre el Lab nuevamente.";
    message.style.cssText = "padding:12px;border:2px solid #b91c1c;color:#991b1b;background:#fff1f2;margin:12px 0";
    root.prepend(message);
  }
  window.LabControlContext = Object.freeze({
    ready, get mode() { return state.mode; },
    progressKey, queueKey, showDenied,
    get token() { return state.mode === "participant" ? state.token : null; },
    get returnUrl() { return state.mode === "participant" ? state.returnUrl : null; },
    get identity() { return state.mode === "participant" ? state.identity : null; }
  });
})();
