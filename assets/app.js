// Pulse — dashboard interactivity
// Renders the metrics table and DAU chart from PULSE_DATA.

(function () {
  const data = window.PULSE_DATA;
  if (!data) return;

  // ----------------- Formatters ----------------
  const formatNum = (n) => n.toLocaleString("en-US");
  const formatCurrency = (n) =>
    "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const formatDate = (iso) => {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // ----------------- Column config ----------------
  const COLUMNS = [
    { key: "date",       label: "Date",         align: "left",  cell: (r) => formatDate(r.date),            sortVal: (r) => r.date,        hideable: false },
    { key: "users",      label: "Active Users", align: "right", cell: (r) => formatNum(r.users),            sortVal: (r) => r.users,       hideable: true  },
    { key: "sessions",   label: "Sessions",     align: "right", cell: (r) => formatNum(r.sessions),         sortVal: (r) => r.sessions,    hideable: true  },
    { key: "conversion", label: "Conversion",   align: "right", cell: (r) => r.conversion.toFixed(1) + "%", sortVal: (r) => r.conversion, hideable: true  },
    { key: "revenue",    label: "Revenue",      align: "right", cell: (r) => formatCurrency(r.revenue),    sortVal: (r) => r.revenue,     hideable: true  }
  ];

  // ----------------- Table state ----------------
  const STATE_KEY = "pulse-table-state";
  const DEFAULT_STATE = {
    order:   COLUMNS.map((c) => c.key),
    hidden:  [],
    sortKey: "date",
    sortDir: "desc"
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (!raw) return { ...DEFAULT_STATE };
      const parsed = JSON.parse(raw);
      const validKeys = new Set(COLUMNS.map((c) => c.key));
      const order = (parsed.order || []).filter((k) => validKeys.has(k));
      COLUMNS.forEach((c) => { if (!order.includes(c.key)) order.push(c.key); });
      const hideableKeys = new Set(COLUMNS.filter((c) => c.hideable).map((c) => c.key));
      const hidden = (parsed.hidden || []).filter((k) => hideableKeys.has(k));
      const sortKey = validKeys.has(parsed.sortKey) ? parsed.sortKey : DEFAULT_STATE.sortKey;
      const sortDir = parsed.sortDir === "asc" ? "asc" : "desc";
      return { order, hidden, sortKey, sortDir };
    } catch (e) {
      return { ...DEFAULT_STATE };
    }
  }

  function saveState() {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(tableState)); } catch (e) {}
  }

  let tableState = loadState();

  function getVisibleColumns() {
    const byKey = Object.fromEntries(COLUMNS.map((c) => [c.key, c]));
    return tableState.order
      .filter((k) => !tableState.hidden.includes(k))
      .map((k) => byKey[k]);
  }

  function getSortedRows() {
    const col = COLUMNS.find((c) => c.key === tableState.sortKey) || COLUMNS[0];
    const rows = data.daily.slice();
    rows.sort((a, b) => {
      const av = col.sortVal(a);
      const bv = col.sortVal(b);
      if (av < bv) return tableState.sortDir === "asc" ? -1 : 1;
      if (av > bv) return tableState.sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }

  // ----------------- Table render ----------------
  const thead = document.getElementById("metricsTableHead");
  const tbody = document.getElementById("metricsTableBody");
  const filterInput = document.getElementById("tableFilter");

  function sortArrow(key) {
    if (tableState.sortKey !== key) {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3 inline-block opacity-30"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>`;
    }
    const up = tableState.sortDir === "asc";
    return up
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3 inline-block text-indigo-600 dark:text-indigo-400"><path d="m18 15-6-6-6 6"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3 inline-block text-indigo-600 dark:text-indigo-400"><path d="m6 9 6 6 6-6"/></svg>`;
  }

  function renderHead() {
    if (!thead) return;
    const visible = getVisibleColumns();
    const ths = visible.map((c) => {
      const active = tableState.sortKey === c.key;
      const alignClass = c.align === "right" ? "text-right" : "text-left";
      const activeClass = active ? "text-gray-900 dark:text-white font-semibold" : "font-medium";
      return `<th data-col="${c.key}" draggable="true" class="th-sortable ${alignClass} px-6 py-3 ${activeClass} cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
        <span class="inline-flex items-center gap-1.5">${c.label} ${sortArrow(c.key)}</span>
      </th>`;
    }).join("");
    thead.innerHTML = `<tr>${ths}<th class="text-right px-6 py-3 font-medium w-32">Actions</th></tr>`;
  }

  function renderBody() {
    if (!tbody) return;
    const visible = getVisibleColumns();
    const filterTerm = (filterInput && filterInput.value || "").trim().toLowerCase();
    let rows = getSortedRows();

    if (filterTerm) {
      rows = rows.filter((r) =>
        visible.some((c) => String(c.cell(r)).toLowerCase().includes(filterTerm))
      );
    }

    if (!rows.length) {
      const colspan = visible.length + 1;
      tbody.innerHTML = `<tr><td colspan="${colspan}" class="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No matching rows.</td></tr>`;
      return;
    }

    tbody.innerHTML = rows.map((r) => {
      const cells = visible.map((c) => {
        const alignClass = c.align === "right" ? "text-right tabular-nums" : "";
        const isDate = c.key === "date";
        const textClass = isDate ? "text-gray-900 dark:text-gray-100 font-medium" : "text-gray-700 dark:text-gray-300";
        return `<td class="px-6 py-3 ${alignClass} ${textClass}">${c.cell(r)}</td>`;
      }).join("");
      return `<tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
        ${cells}
        <td class="px-6 py-3 text-right">
          <button class="export-row text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-md px-2.5 py-1 inline-flex items-center gap-1.5 bg-white dark:bg-gray-800"
            data-date="${r.date}" data-users="${r.users}" data-sessions="${r.sessions}" data-conversion="${r.conversion}" data-revenue="${r.revenue}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
            </svg>
            Export
          </button>
        </td>
      </tr>`;
    }).join("");
  }

  function renderTable() {
    renderHead();
    renderBody();
  }

  // Single-row export (event delegation on tbody so it survives renderTable() rebuilds)
  if (tbody) {
    tbody.addEventListener("click", (e) => {
      const btn = e.target.closest(".export-row");
      if (!btn) return;
      const row = {
        date: btn.dataset.date,
        users: btn.dataset.users,
        sessions: btn.dataset.sessions,
        conversion: btn.dataset.conversion,
        revenue: btn.dataset.revenue
      };
      const csv =
        "Date,Active Users,Sessions,Conversion %,Revenue\n" +
        `${row.date},${row.users},${row.sessions},${row.conversion},${row.revenue}\n`;
      downloadCsv(csv, `pulse-${row.date}.csv`);
    });
  }

  function downloadCsv(content, filename) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ----------------- Header interactions: sort + drag-and-drop reorder ----------------
  if (thead) {
    let dragKey = null;

    thead.addEventListener("click", (e) => {
      const th = e.target.closest("th[data-col]");
      if (!th) return;
      const key = th.dataset.col;
      if (tableState.sortKey === key) {
        tableState.sortDir = tableState.sortDir === "asc" ? "desc" : "asc";
      } else {
        tableState.sortKey = key;
        tableState.sortDir = "desc";
      }
      saveState();
      renderTable();
    });

    thead.addEventListener("dragstart", (e) => {
      const th = e.target.closest("th[data-col]");
      if (!th) return;
      dragKey = th.dataset.col;
      e.dataTransfer.effectAllowed = "move";
      try { e.dataTransfer.setData("text/plain", dragKey); } catch (_) {}
      th.classList.add("dragging");
    });

    thead.addEventListener("dragend", (e) => {
      const th = e.target.closest("th[data-col]");
      if (th) th.classList.remove("dragging");
      thead.querySelectorAll("th.drag-over").forEach((el) => el.classList.remove("drag-over"));
      dragKey = null;
    });

    thead.addEventListener("dragover", (e) => {
      const th = e.target.closest("th[data-col]");
      if (!th || !dragKey || th.dataset.col === dragKey) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      thead.querySelectorAll("th.drag-over").forEach((el) => el.classList.remove("drag-over"));
      th.classList.add("drag-over");
    });

    thead.addEventListener("dragleave", (e) => {
      const th = e.target.closest("th[data-col]");
      if (th) th.classList.remove("drag-over");
    });

    thead.addEventListener("drop", (e) => {
      const th = e.target.closest("th[data-col]");
      if (!th || !dragKey) return;
      e.preventDefault();
      const targetKey = th.dataset.col;
      if (targetKey === dragKey) return;
      const order = tableState.order.slice();
      const from = order.indexOf(dragKey);
      const to = order.indexOf(targetKey);
      if (from < 0 || to < 0) return;
      order.splice(from, 1);
      order.splice(to, 0, dragKey);
      tableState.order = order;
      saveState();
      renderTable();
    });
  }

  // ----------------- Columns visibility dropdown ----------------
  const columnsBtn = document.getElementById("columnsBtn");
  const columnsMenu = document.getElementById("columnsMenu");

  function renderColumnsMenu() {
    if (!columnsMenu) return;
    const header = `<p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 px-2 pt-1 pb-2">Visible columns</p>`;
    const items = COLUMNS.map((c) => {
      const checked = !tableState.hidden.includes(c.key);
      const disabled = !c.hideable;
      return `<label class="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}">
        <input type="checkbox" data-col-toggle="${c.key}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""} class="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500" />
        <span class="text-gray-700 dark:text-gray-200">${c.label}</span>
      </label>`;
    }).join("");
    columnsMenu.innerHTML = header + items;
  }

  if (columnsBtn && columnsMenu) {
    columnsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      renderColumnsMenu();
      columnsMenu.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
      if (columnsMenu.classList.contains("hidden")) return;
      if (!columnsMenu.contains(e.target) && e.target !== columnsBtn && !columnsBtn.contains(e.target)) {
        columnsMenu.classList.add("hidden");
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") columnsMenu.classList.add("hidden");
    });

    columnsMenu.addEventListener("change", (e) => {
      const cb = e.target.closest("input[data-col-toggle]");
      if (!cb) return;
      const key = cb.dataset.colToggle;
      const col = COLUMNS.find((c) => c.key === key);
      if (!col || !col.hideable) return;
      if (cb.checked) {
        tableState.hidden = tableState.hidden.filter((k) => k !== key);
      } else {
        if (!tableState.hidden.includes(key)) tableState.hidden.push(key);
      }
      saveState();
      renderTable();
    });
  }

  // ----------------- Filter input ----------------
  if (filterInput) {
    filterInput.addEventListener("input", renderBody);
  }

  // ----------------- Chart render ----------------
  let dauChart = null;

  function renderChart() {
    const canvas = document.getElementById("dauChart");
    if (!canvas || !window.Chart) return;

    const ctx = canvas.getContext("2d");
    const labels = data.daily.map((r) => {
      const d = new Date(r.date + "T00:00:00");
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    });
    const current = data.daily.map((r) => r.users);
    const prior = data.prior;

    const isDark = document.documentElement.classList.contains("dark");
    const gridColor = isDark ? "#1f2937" : "#f3f4f6";
    const tickColor = isDark ? "#6b7280" : "#9ca3af";
    const fillColor = isDark ? "rgba(99, 102, 241, 0.12)" : "rgba(79, 70, 229, 0.08)";
    const priorBorderColor = isDark ? "#4b5563" : "#d1d5db";

    dauChart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "This period",
            data: current,
            borderColor: "#4f46e5",
            backgroundColor: fillColor,
            borderWidth: 2,
            tension: 0.35,
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: "#4f46e5"
          },
          {
            label: "Prior period",
            data: prior,
            borderColor: priorBorderColor,
            backgroundColor: "transparent",
            borderWidth: 2,
            borderDash: [4, 4],
            tension: 0.35,
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: isDark ? "#6b7280" : "#9ca3af"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? "rgba(17, 24, 39, 0.97)" : "rgba(17, 24, 39, 0.95)",
            titleFont: { size: 12, weight: "600" },
            bodyFont: { size: 12 },
            padding: 10,
            displayColors: true,
            callbacks: {
              label: (ctx) =>
                ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString("en-US")} users`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: tickColor, font: { size: 11 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 }
          },
          y: {
            grid: { color: gridColor },
            border: { display: false },
            ticks: {
              color: tickColor,
              font: { size: 11 },
              callback: (v) => v.toLocaleString("en-US")
            }
          }
        },
        interaction: { mode: "index", intersect: false }
      }
    });
  }

  // ----------------- Last-updated timestamp ----------------
  let lastRefreshTime = Date.now();
  let timestampIntervalId = null;

  function updateTimestampText() {
    const el = document.getElementById("lastUpdated");
    if (!el) return;
    const elapsed = Math.floor((Date.now() - lastRefreshTime) / 1000);
    if (elapsed < 30) {
      el.textContent = "Updated just now";
    } else {
      const mins = Math.floor(elapsed / 60);
      el.textContent = mins === 1 ? "Updated 1 min ago" : `Updated ${mins} min ago`;
    }
  }

  function startTimestampUpdater() {
    if (timestampIntervalId !== null) return;
    timestampIntervalId = setInterval(updateTimestampText, 30000);
  }

  // ----------------- Refresh dashboard ----------------
  function refreshDashboard() {
    renderTable();
    if (dauChart) {
      dauChart.data.datasets[0].data = data.daily.map((r) => r.users);
      dauChart.data.datasets[1].data = data.prior;
      dauChart.update();
    }
    lastRefreshTime = Date.now();
    const el = document.getElementById("lastUpdated");
    if (el) el.textContent = "Updated just now";
    const icon = document.getElementById("refreshIcon");
    if (icon) {
      icon.classList.remove("spin");
      void icon.offsetWidth;
      icon.classList.add("spin");
      icon.addEventListener("animationend", () => icon.classList.remove("spin"), { once: true });
    }
  }

  // ----------------- Live mode ----------------
  let liveIntervalId = null;
  const liveDot = document.getElementById("liveDot");

  function setLiveDot(active) {
    if (!liveDot) return;
    if (active) {
      liveDot.classList.remove("bg-gray-300", "dark:bg-gray-600");
      liveDot.classList.add("bg-green-500");
    } else {
      liveDot.classList.remove("bg-green-500");
      liveDot.classList.add("bg-gray-300", "dark:bg-gray-600");
    }
  }

  function startLiveMode() {
    if (liveIntervalId !== null) return;
    liveIntervalId = setInterval(refreshDashboard, 30000);
    setLiveDot(true);
    localStorage.setItem("pulse-live-mode", "on");
  }

  function stopLiveMode() {
    if (liveIntervalId !== null) {
      clearInterval(liveIntervalId);
      liveIntervalId = null;
    }
    setLiveDot(false);
    localStorage.setItem("pulse-live-mode", "off");
  }

  const liveToggle = document.getElementById("liveModeToggle");
  if (liveToggle) {
    liveToggle.addEventListener("change", () => {
      if (liveToggle.checked) startLiveMode(); else stopLiveMode();
    });
    if (localStorage.getItem("pulse-live-mode") === "on") {
      liveToggle.checked = true;
      startLiveMode();
    }
  }

  // ----------------- Refresh button ----------------
  const refreshBtn = document.getElementById("refreshBtn");
  if (refreshBtn) refreshBtn.addEventListener("click", refreshDashboard);

  // ----------------- Initial render ----------------
  renderTable();
  renderChart();
  startTimestampUpdater();
})();
