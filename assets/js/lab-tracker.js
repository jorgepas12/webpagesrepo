/* =========================================================
   assets/js/lab-tracker.js

   Sincronización de progreso entre Jekyll y LabControl.

   Responsabilidades:
   - Mantener lab-progress.js como experiencia local-first.
   - Detectar cambios reales de progreso en los pasos.
   - Enviar cambios al API de LabControl.
   - Mantener una cola offline en localStorage.
   - Reintentar la cola cuando regresa la conectividad.
   - Recuperar progreso existente desde LabControl.
   - Utilizar accessToken solamente en sessionStorage.
   - Nunca almacenar refreshToken.
   ========================================================= */

(function () {
  "use strict";

  const ACCESS_TOKEN_KEY =
    "netec:participantAccessToken";

  const QUEUE_PREFIX =
    "netec:trackingQueue:";

  const LOCAL_PROGRESS_PREFIX =
    "netec:stepProgress:";

  const QUEUE_VERSION = 1;

  let syncingFromServer = false;
  let flushingQueue = false;

  /* ---------------------------------------------------------
     Utilidades
     --------------------------------------------------------- */

  function safeParse(
    value,
    fallback
  ) {
    try {
      return JSON.parse(
        value
      );
    } catch (error) {
      return fallback;
    }
  }

  function getLabRoot() {
    return document.querySelector(
      "article.lab"
    );
  }

  function isTrackingEnabled(
    root
  ) {
    return (
      root &&
      root.dataset.tracking ===
        "true"
    );
  }

  function getCourseId(
    root
  ) {
    return (
      root?.dataset.courseId ||
      null
    );
  }

  function getLabId(
    root
  ) {
    return (
      root?.dataset.labId ||
      null
    );
  }

  function getApiBaseUrl(
    root
  ) {
    const value =
      root?.dataset.trackingApi;

    if (!value) {
      return null;
    }

    return value.replace(
      /\/+$/,
      ""
    );
  }

  function getSteps(
    root
  ) {
    return Array.from(
      root.querySelectorAll(
        ".step-label[data-step-id][data-task-id]"
      )
    );
  }

  function getStepId(
    step
  ) {
    return (
      step.dataset.stepId ||
      null
    );
  }

  function getTaskId(
    step
  ) {
    return (
      step.dataset.taskId ||
      null
    );
  }

  function getAccessToken() {
    return sessionStorage.getItem(
      ACCESS_TOKEN_KEY
    );
  }

  function setAccessToken(
    token
  ) {
    if (!token) {
      return;
    }

    sessionStorage.setItem(
      ACCESS_TOKEN_KEY,
      token
    );
  }

  function removeAccessToken() {
    sessionStorage.removeItem(
      ACCESS_TOKEN_KEY
    );
  }

  /* ---------------------------------------------------------
     Capturar access token desde URL fragment
     --------------------------------------------------------- */

  function captureAccessTokenFromHash() {
    const hash =
      window.location.hash;

    if (
      !hash ||
      !hash.startsWith(
        "#lab-access="
      )
    ) {
      return;
    }

    const encodedToken =
      hash.substring(
        "#lab-access=".length
      );

    if (!encodedToken) {
      return;
    }

    let token;

    try {
      token =
        decodeURIComponent(
          encodedToken
        );
    } catch (error) {
      return;
    }

    if (!token) {
      return;
    }

    setAccessToken(
      token
    );

    /*
     * Eliminar inmediatamente el token
     * de la barra de direcciones.
     */
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`
    );
  }

  /* ---------------------------------------------------------
     Cola offline
     --------------------------------------------------------- */

  function getQueueKey(
    courseId,
    labId
  ) {
    return (
      `${QUEUE_PREFIX}` +
      `${courseId}:${labId}`
    );
  }

  function createEmptyQueue() {
    return {
      version:
        QUEUE_VERSION,
      items:
        [],
      updatedAt:
        null
    };
  }

  function loadQueue(
    courseId,
    labId
  ) {
    const stored =
      localStorage.getItem(
        getQueueKey(
          courseId,
          labId
        )
      );

    if (!stored) {
      return createEmptyQueue();
    }

    const parsed =
      safeParse(
        stored,
        createEmptyQueue()
      );

    if (
      !Array.isArray(
        parsed.items
      )
    ) {
      parsed.items = [];
    }

    return parsed;
  }

  function saveQueue(
    courseId,
    labId,
    queue
  ) {
    queue.version =
      QUEUE_VERSION;

    queue.updatedAt =
      Date.now();

    localStorage.setItem(
      getQueueKey(
        courseId,
        labId
      ),
      JSON.stringify(
        queue
      )
    );
  }

  function enqueueChange(
    courseId,
    labId,
    taskId,
    stepId,
    isCompleted
  ) {
    const queue =
      loadQueue(
        courseId,
        labId
      );

    /*
     * Si ya existe un cambio pendiente para
     * el mismo step, conservamos solamente
     * su estado más reciente.
     */
    queue.items =
      queue.items.filter(
        item =>
          !(
            item.taskId ===
              taskId &&
            item.stepId ===
              stepId
          )
      );

    queue.items.push({
      taskId,
      stepId,
      isCompleted,
      queuedAt:
        Date.now()
    });

    saveQueue(
      courseId,
      labId,
      queue
    );
  }

  /* ---------------------------------------------------------
     Estado local utilizado por lab-progress.js
     --------------------------------------------------------- */

  function getLocalProgressKey(
    labId
  ) {
    return (
      `${LOCAL_PROGRESS_PREFIX}` +
      labId
    );
  }

  function saveLocalProgress(
    labId,
    completed
  ) {
    localStorage.setItem(
      getLocalProgressKey(
        labId
      ),
      JSON.stringify({
        version:
          1,
        completed:
          Array.from(
            new Set(
              completed
            )
          ),
        updatedAt:
          Date.now()
      })
    );
  }

  /* ---------------------------------------------------------
     API
     --------------------------------------------------------- */

  async function apiRequest(
    root,
    path,
    options = {}
  ) {
    const apiBaseUrl =
      getApiBaseUrl(
        root
      );

    const accessToken =
      getAccessToken();

    if (
      !apiBaseUrl ||
      !accessToken
    ) {
      return {
        available:
          false,
        response:
          null
      };
    }

    const headers = {
      ...(options.headers || {}),
      Authorization:
        `Bearer ${accessToken}`
    };

    if (
      options.body !==
      undefined
    ) {
      headers[
        "Content-Type"
      ] =
        "application/json";
    }

    let response;

    try {
      response =
        await fetch(
          `${apiBaseUrl}${path}`,
          {
            ...options,
            headers
          }
        );
    } catch (error) {
      return {
        available:
          false,
        response:
          null
      };
    }

    if (
      response.status ===
      401
    ) {
      removeAccessToken();

      return {
        available:
          false,
        unauthorized:
          true,
        response
      };
    }

    return {
      available:
        true,
      response
    };
  }

  async function sendStep(
    root,
    item
  ) {
    const courseId =
      getCourseId(
        root
      );

    const labId =
      getLabId(
        root
      );

    if (
      !courseId ||
      !labId
    ) {
      return false;
    }

    const result =
      await apiRequest(
        root,
        "/tracking/step",
        {
          method:
            "PATCH",
          body:
            JSON.stringify({
              courseTrackingId:
                courseId,
              labTrackingId:
                labId,
              taskId:
                item.taskId,
              stepId:
                item.stepId,
              isCompleted:
                item.isCompleted
            })
        }
      );

    if (
      !result.available ||
      !result.response
    ) {
      return false;
    }

    return result.response.ok;
  }

  /* ---------------------------------------------------------
     Vaciar cola offline
     --------------------------------------------------------- */

  async function flushQueue(
    root
  ) {
    if (
      flushingQueue ||
      !navigator.onLine
    ) {
      return;
    }

    const courseId =
      getCourseId(
        root
      );

    const labId =
      getLabId(
        root
      );

    if (
      !courseId ||
      !labId ||
      !getAccessToken()
    ) {
      return;
    }

    const queue =
      loadQueue(
        courseId,
        labId
      );

    if (
      queue.items.length ===
      0
    ) {
      return;
    }

    flushingQueue =
      true;

    try {
      const remaining =
        [];

      for (
        let index = 0;
        index <
        queue.items.length;
        index += 1
      ) {
        const item =
          queue.items[index];

        const sent =
          await sendStep(
            root,
            item
          );

        if (!sent) {
          remaining.push(
            ...queue.items.slice(
              index
            )
          );

          break;
        }
      }

      queue.items =
        remaining;

      saveQueue(
        courseId,
        labId,
        queue
      );
    } finally {
      flushingQueue =
        false;
    }
  }

  /* ---------------------------------------------------------
     Aplicar estado visual recibido del servidor
     --------------------------------------------------------- */

  function paintStep(
    step,
    completed
  ) {
    const li =
      step.closest(
        "li"
      );

    step.classList.toggle(
      "step-label-completed",
      completed
    );

    step.setAttribute(
      "aria-pressed",
      completed
        ? "true"
        : "false"
    );

    step.setAttribute(
      "title",
      completed
        ? "Marcar este paso como pendiente"
        : "Marcar este paso como completado"
    );

    if (li) {
      li.classList.toggle(
        "step-completed",
        completed
      );

      li.classList.remove(
        "step-current",
        "step-pending"
      );
    }
  }

  function updatePanel(
    steps,
    completedIds
  ) {
    const panel =
      document.querySelector(
        ".lab-progress"
      );

    if (!panel) {
      return;
    }

    const total =
      steps.length;

    const completedCount =
      steps.filter(
        step =>
          completedIds.includes(
            getStepId(
              step
            )
          )
      ).length;

    const percent =
      total === 0
        ? 0
        : Math.round(
            (
              completedCount /
              total
            ) *
              100
          );

    const completedEl =
      panel.querySelector(
        "[data-progress-completed]"
      );

    const totalEl =
      panel.querySelector(
        "[data-progress-total]"
      );

    const percentEl =
      panel.querySelector(
        "[data-progress-percent]"
      );

    const fillEl =
      panel.querySelector(
        "[data-progress-fill]"
      );

    const progressBar =
      panel.querySelector(
        ".lab-progress-bar"
      );

    const continueBtn =
      panel.querySelector(
        "[data-progress-continue]"
      );

    if (completedEl) {
      completedEl.textContent =
        String(
          completedCount
        );
    }

    if (totalEl) {
      totalEl.textContent =
        String(
          total
        );
    }

    if (percentEl) {
      percentEl.textContent =
        `${percent}%`;
    }

    if (fillEl) {
      if (
        window.matchMedia(
          "(min-width: 1181px)"
        ).matches
      ) {
        fillEl.style.width =
          "100%";

        fillEl.style.height =
          `${percent}%`;
      } else {
        fillEl.style.height =
          "100%";

        fillEl.style.width =
          `${percent}%`;
      }
    }

    if (progressBar) {
      progressBar.setAttribute(
        "aria-valuenow",
        String(
          percent
        )
      );
    }

    if (continueBtn) {
      if (
        total > 0 &&
        completedCount ===
          total
      ) {
        continueBtn.textContent =
          "✓";

        continueBtn.disabled =
          true;

        continueBtn.title =
          "Práctica completada";

        continueBtn.setAttribute(
          "aria-label",
          "Práctica completada"
        );
      } else {
        continueBtn.textContent =
          "→";

        continueBtn.disabled =
          false;

        continueBtn.title =
          "Continuar";

        continueBtn.setAttribute(
          "aria-label",
          "Continuar al siguiente paso pendiente"
        );
      }
    }

    panel.classList.toggle(
      "is-complete",
      total > 0 &&
        completedCount ===
          total
    );

    let firstPendingFound =
      false;

    steps.forEach(
      step => {
        const stepId =
          getStepId(
            step
          );

        const li =
          step.closest(
            "li"
          );

        if (
          !stepId ||
          !li
        ) {
          return;
        }

        li.classList.remove(
          "step-completed",
          "step-current",
          "step-pending"
        );

        if (
          completedIds.includes(
            stepId
          )
        ) {
          li.classList.add(
            "step-completed"
          );

          return;
        }

        if (
          !firstPendingFound
        ) {
          li.classList.add(
            "step-current"
          );

          firstPendingFound =
            true;

          return;
        }

        li.classList.add(
          "step-pending"
        );
      }
    );
  }

  function applyServerState(
    root,
    steps,
    serverLab
  ) {
    if (!serverLab) {
      return;
    }

    const completedIds =
      serverLab.steps
        .filter(
          item =>
            item.isCompleted
        )
        .map(
          item =>
            item.stepId
        );

    syncingFromServer =
      true;

    try {
      steps.forEach(
        step => {
          const stepId =
            getStepId(
              step
            );

          if (!stepId) {
            return;
          }

          paintStep(
            step,
            completedIds.includes(
              stepId
            )
          );
        }
      );

      saveLocalProgress(
        getLabId(
          root
        ),
        completedIds
      );

      updatePanel(
        steps,
        completedIds
      );
    } finally {
      window.setTimeout(
        () => {
          syncingFromServer =
            false;
        },
        0
      );
    }
  }

  /* ---------------------------------------------------------
     Recuperar progreso desde LabControl
     --------------------------------------------------------- */

  async function pullServerProgress(
    root,
    steps
  ) {
    const result =
      await apiRequest(
        root,
        "/tracking/progress"
      );

    if (
      !result.available ||
      !result.response ||
      !result.response.ok
    ) {
      return;
    }

    let payload;

    try {
      payload =
        await result.response.json();
    } catch (error) {
      return;
    }

    if (
      !Array.isArray(
        payload.labs
      )
    ) {
      return;
    }

    const labId =
      getLabId(
        root
      );

    const serverLab =
      payload.labs.find(
        lab =>
          lab.labTrackingId ===
          labId
      );

    if (!serverLab) {
      return;
    }

    applyServerState(
      root,
      steps,
      serverLab
    );
  }

  /* ---------------------------------------------------------
     Observar cambios realizados por lab-progress.js
     --------------------------------------------------------- */

  function observeProgressChanges(
    root,
    steps
  ) {
    const observer =
      new MutationObserver(
        mutations => {
          if (
            syncingFromServer
          ) {
            return;
          }

          mutations.forEach(
            mutation => {
              if (
                mutation.type !==
                  "attributes" ||
                mutation.attributeName !==
                  "aria-pressed"
              ) {
                return;
              }

              const step =
                mutation.target;

              const currentValue =
                step.getAttribute(
                  "aria-pressed"
                );

              /*
               * lab-progress.js puede volver a establecer
               * aria-pressed con el mismo valor cuando
               * actualiza varios pasos secuencialmente.
               *
               * Esos cambios no representan un cambio
               * real de progreso y no deben reenviarse.
               */
              if (
                mutation.oldValue ===
                currentValue
              ) {
                return;
              }

              const taskId =
                getTaskId(
                  step
                );

              const stepId =
                getStepId(
                  step
                );

              if (
                !taskId ||
                !stepId
              ) {
                return;
              }

              const isCompleted =
                currentValue ===
                "true";

              const courseId =
                getCourseId(
                  root
                );

              const labId =
                getLabId(
                  root
                );

              if (
                !courseId ||
                !labId
              ) {
                return;
              }

              enqueueChange(
                courseId,
                labId,
                taskId,
                stepId,
                isCompleted
              );
            }
          );

          void flushQueue(
            root
          );
        }
      );

    steps.forEach(
      step => {
        observer.observe(
          step,
          {
            attributes:
              true,
            attributeOldValue:
              true,
            attributeFilter: [
              "aria-pressed"
            ]
          }
        );
      }
    );
  }

  /* ---------------------------------------------------------
     Inicialización
     --------------------------------------------------------- */

  async function initLabTracker() {
    const root =
      getLabRoot();

    if (
      !root ||
      !isTrackingEnabled(
        root
      )
    ) {
      return;
    }

    const courseId =
      getCourseId(
        root
      );

    const labId =
      getLabId(
        root
      );

    const apiBaseUrl =
      getApiBaseUrl(
        root
      );

    if (
      !courseId ||
      !labId
    ) {
      console.warn(
        "Lab tracking is enabled but course_id or lab_id is missing."
      );

      return;
    }

    const steps =
      getSteps(
        root
      );

    if (
      steps.length ===
      0
    ) {
      return;
    }

    captureAccessTokenFromHash();

    observeProgressChanges(
      root,
      steps
    );

    /*
     * Sin API configurado, el laboratorio
     * continúa funcionando solamente con
     * lab-progress.js y localStorage.
     */
    if (!apiBaseUrl) {
      return;
    }

    if (
      !getAccessToken()
    ) {
      return;
    }

    /*
     * Primero enviamos cambios locales que
     * hubieran quedado pendientes.
     */
    await flushQueue(
      root
    );

    /*
     * Después recuperamos el estado confirmado
     * por LabControl.
     */
    await pullServerProgress(
      root,
      steps
    );

    window.addEventListener(
      "online",
      () => {
        void flushQueue(
          root
        );
      }
    );

    /*
     * Cuando la pestaña vuelve a estar visible,
     * volvemos a intentar la cola pendiente.
     */
    document.addEventListener(
      "visibilitychange",
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          void flushQueue(
            root
          );
        }
      }
    );
  }

  /* ---------------------------------------------------------
     Inicio
     --------------------------------------------------------- */

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        void initLabTracker();
      }
    );
  } else {
    void initLabTracker();
  }
})();