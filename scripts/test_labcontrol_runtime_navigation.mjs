import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const policyScript = readFileSync("assets/js/lab-control-context-policy.js", "utf8");
const contextScript = readFileSync("assets/js/lab-control-context.js", "utf8");
const layout = readFileSync("_layouts/default.html", "utf8");
const orderedScripts = [
  "lab-demo-context.js",
  "lab-control-context-policy.js",
  "lab-control-context.js",
  "lab-progress.js",
  "lab-tracker.js"
];
let last = -1;
for (const file of orderedScripts) {
  const current = layout.indexOf("/assets/js/" + file);
  assert.ok(current > last, file + " debe cargarse despues de " + last);
  last = current;
}

function createBrowser(hash, overrides = {}) {
  const values = new Map();
  const target = {
    href: "https://netec-mx.github.io/CKA-Priv-/lab2/lab2/",
    textContent: "Siguiente ➡",
    parentElement: { classList: { contains: () => false } },
    listeners: {},
    addEventListener(type, cb) { this.listeners[type] = cb; }
  };
  const index = { href: "https://netec-mx.github.io/CKA-Priv-/", textContent: "Lista General", parentElement: {classList: {contains: () => false}} };
  const root = {
    dataset: {
      trackingApi: "https://labcontrol.superwebapp.com/api",
      courseId: "ckapriv", labId: "l001"
    },
    querySelectorAll(selector) {
      if (selector === ".lab-nav a.btn") return [index, target];
      return [];
    },
    prepend() {}
  };
  const location = {
    hash, pathname: "/CKA-Priv-/lab1/lab1/", search: "",
    origin: "https://netec-mx.github.io",
    assigned: null,
    assign(url) { this.assigned = url; }
  };
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
  if (overrides.token) values.set("netec:participantAccessToken", overrides.token);
  if (overrides.returnUrl) values.set("netec:labControlReturnUrl", overrides.returnUrl);
  const window = {
    location, history: { replaceState(_state, _title, url) {
      location.hash = url.includes("#") ? "#" + url.split("#")[1] : "";
    } }
  };
  const document = {
    querySelector: value => value === "article.lab" ? root : null,
    getElementById: () => null,
    createElement: () => ({ setAttribute() {}, style: {} })
  };
  const replies = [];
  async function fetchImpl(url) {
    replies.push(url);
    if (url.endsWith("/participant-access/me")) return {
      ok: !overrides.expired,
      json: async () => ({ participantAccess: {
        courseSessionId: "session-a", enrollmentId: "enroll-a",
        courseTrackingId: "ckapriv"
      } })
    };
    if (url.endsWith("/tracking/progress")) return {
      ok: !overrides.forbidden,
      json: async () => ({
        courseSession: { id: "session-a" },
        enrollment: { id: "enroll-a" },
        course: { trackingId: "ckapriv" },
        labs: [
          { labTrackingId: "l001", availabilityStatus: "AVAILABLE",
            individuallyBlocked: false, launchUrl: "https://netec-mx.github.io/CKA-Priv-/lab1/lab1/" },
          { labTrackingId: "l002", availabilityStatus: overrides.blocked ? "LOCKED" : "AVAILABLE",
            individuallyBlocked: Boolean(overrides.blocked),
            launchUrl: overrides.blocked ? null : "https://netec-mx.github.io/CKA-Priv-/lab2/lab2/" }
        ]
      })
    };
    throw new Error("unexpected route " + url);
  }
  const ctx = vm.createContext({
    window, document, sessionStorage: storage,
    URL, URLSearchParams, fetch: fetchImpl, console
  });
  vm.runInContext(policyScript, ctx);
  vm.runInContext(contextScript, ctx);
  return { root, window, target, index, replies, context: window.LabControlContext };
}

const publicBrowser = createBrowser("");
await publicBrowser.context.ready;
assert.equal(publicBrowser.context.mode, "public");
assert.equal(publicBrowser.replies.length, 0, "Jekyll publico no consulta LabControl");
assert.equal(publicBrowser.index.href, "https://netec-mx.github.io/CKA-Priv-/");
assert.equal(Object.keys(publicBrowser.target.listeners).length, 0);
assert.equal(publicBrowser.target.href, "https://netec-mx.github.io/CKA-Priv-/lab2/lab2/");

const returnUrl = "https://labcontrol.superwebapp.com/participant";
const auth = createBrowser(
  "#lab-access=token-seguro&lab-return=" + encodeURIComponent(returnUrl)
);
await auth.context.ready;
assert.equal(auth.context.mode, "participant");
assert.equal(auth.window.location.hash, "#lab-lc=1");
assert.equal(auth.index.href, returnUrl);
assert.equal(typeof auth.target.listeners.click, "function", "CKA-Priv legacy debe interceptar siguiente");
assert.equal(auth.context.progressKey("ckapriv", "l001"),
  "netec:labcontrol:stepProgress:v1:session-a:enroll-a:ckapriv:l001");
assert.equal(auth.context.queueKey("ckapriv", "l001"),
  "netec:labcontrol:trackingQueue:v1:session-a:enroll-a:ckapriv:l001");
await auth.target.listeners.click({ preventDefault() {} });
assert.equal(auth.window.location.assigned,
  "https://netec-mx.github.io/CKA-Priv-/lab2/lab2/#lab-lc=1");

const resumed = createBrowser("#lab-lc=1", {
  token: "token-seguro", returnUrl
});
await resumed.context.ready;
assert.equal(resumed.context.mode, "participant");

const blocked = createBrowser("#lab-access=token-seguro", { blocked: true });
await blocked.context.ready;
await blocked.target.listeners.click({ preventDefault() {} });
assert.equal(blocked.window.location.assigned, null);

const expired = createBrowser("#lab-access=expired", { expired: true });
await expired.context.ready;
assert.equal(expired.context.mode, "denied");
assert.ok(!expired.window.location.hash.includes("expired"),
  "Un token expirado tampoco debe quedar en la URL");

const demo = createBrowser("#lab-demo=session-instructor");
await demo.context.ready;
assert.equal(demo.context.mode, "demo");
assert.equal(demo.replies.length, 0);
assert.equal(demo.index.href, "https://netec-mx.github.io/CKA-Priv-/");

console.log("PASS runtime #130: publico sin API, oficial aislado, navegacion, recarga, bloqueo, 401, demo.");
