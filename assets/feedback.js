// Pulse — floating feedback widget
// Submissions go to the Customer Feedback table in the Cloud Coding Agent Demo
// Airtable base. The form itself is an Airtable Form view (created in the
// Airtable UI), embedded here as an iframe.
//
// SETUP: replace AIRTABLE_FORM_URL with the shareable form URL from Airtable.
// Until then, the widget shows a placeholder state.

(function () {
  const AIRTABLE_FORM_URL = "REPLACE_WITH_AIRTABLE_FORM_URL";
  const isConfigured =
    AIRTABLE_FORM_URL &&
    AIRTABLE_FORM_URL !== "REPLACE_WITH_AIRTABLE_FORM_URL" &&
    AIRTABLE_FORM_URL.startsWith("https://airtable.com/");

  // ---------------- Markup ----------------
  const fab = document.createElement("button");
  fab.id = "pulse-feedback-fab";
  fab.setAttribute("aria-label", "Open feedback form");
  fab.className =
    "fixed bottom-6 right-6 z-40 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-600/30 px-5 py-3 text-sm font-medium flex items-center gap-2 transition-transform hover:-translate-y-0.5";
  fab.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    Feedback
  `;

  const overlay = document.createElement("div");
  overlay.id = "pulse-feedback-overlay";
  overlay.className =
    "fixed inset-0 z-50 hidden items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4";
  overlay.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
      <div class="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 flex-shrink-0">
        <div>
          <h2 class="text-sm font-semibold text-gray-900">Send Pulse feedback</h2>
          <p class="text-xs text-gray-500 mt-0.5">Your note goes straight to our product team.</p>
        </div>
        <button id="pulse-feedback-close" aria-label="Close" class="text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md p-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
          </svg>
        </button>
      </div>
      <div id="pulse-feedback-body" class="flex-1 overflow-hidden bg-gray-50">
        ${
          isConfigured
            ? `<iframe
                 src="${AIRTABLE_FORM_URL}"
                 class="w-full h-full border-0"
                 style="min-height: 600px;"
                 title="Pulse feedback form"
                 loading="lazy"></iframe>`
            : `<div class="p-8 text-center">
                 <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 text-yellow-700 mb-4">
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6">
                     <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
                   </svg>
                 </div>
                 <p class="text-sm font-semibold text-gray-900">Feedback form not configured yet</p>
                 <p class="text-xs text-gray-600 mt-2 max-w-md mx-auto">
                   The Airtable form URL hasn't been set in <code class="text-xs px-1.5 py-0.5 bg-gray-100 rounded">assets/feedback.js</code>.
                   See the README for the 60-second setup.
                 </p>
               </div>`
        }
      </div>
    </div>
  `;

  // ---------------- Wire up ----------------
  document.body.appendChild(fab);
  document.body.appendChild(overlay);

  const open = () => {
    overlay.classList.remove("hidden");
    overlay.classList.add("flex");
    document.body.style.overflow = "hidden";
  };
  const close = () => {
    overlay.classList.add("hidden");
    overlay.classList.remove("flex");
    document.body.style.overflow = "";
  };

  fab.addEventListener("click", open);
  document.getElementById("pulse-feedback-close").addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.classList.contains("hidden")) close();
  });
})();
