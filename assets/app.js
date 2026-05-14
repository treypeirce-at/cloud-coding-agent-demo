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

  // ----------------- Table render ----------------
  const tbody = document.getElementById("metricsTableBody");

  function renderTable() {
    if (!tbody) return;

    // Newest first in the table
    const rows = data.daily.slice().reverse();

    tbody.innerHTML = rows
      .map((r) => {
        return `
          <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
            <td class="px-6 py-3 text-gray-900 dark:text-gray-100 font-medium">${formatDate(r.date)}</td>
            <td class="px-6 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">${formatNum(r.users)}</td>
            <td class="px-6 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">${formatNum(r.sessions)}</td>
            <td class="px-6 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">${r.conversion.toFixed(1)}%</td>
            <td class="px-6 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">${formatCurrency(r.revenue)}</td>
            <td class="px-6 py-3 text-right">
              <button
                class="export-row text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-md px-2.5 py-1 inline-flex items-center gap-1.5 bg-white dark:bg-gray-800"
                data-date="${r.date}"
                data-users="${r.users}"
                data-sessions="${r.sessions}"
                data-conversion="${r.conversion}"
                data-revenue="${r.revenue}"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
                </svg>
                Export
              </button>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  // Single-row export — creates a one-row CSV. This is the v1 the coding
  // agent will later replace with a bulk "Export all" button at the top.
  // Event delegation on tbody so it survives renderTable() rebuilds.
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

    // Pick colors based on current theme
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
            ticks: {
              color: tickColor,
              font: { size: 11 },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 8
            }
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
    const elapsed = Math.floor((Date.now() - lastRefreshTime) / 1000); // seconds
    if (elapsed < 30) {
      el.textContent = "Updated just now";
    } else {
      const mins = Math.floor(elapsed / 60);
      el.textContent = mins === 1 ? "Updated 1 min ago" : `Updated ${mins} min ago`;
    }
  }

  function startTimestampUpdater() {
    if (timestampIntervalId !== null) return; // already running
    timestampIntervalId = setInterval(updateTimestampText, 30000);
  }

  // ----------------- Refresh dashboard ----------------
  function refreshDashboard() {
    // Rebuild table (delegation listener on tbody survives innerHTML rebuild)
    renderTable();

    // Update chart data in place — no re-creation
    if (dauChart) {
      dauChart.data.datasets[0].data = data.daily.map((r) => r.users);
      dauChart.data.datasets[1].data = data.prior;
      dauChart.update();
    }

    // Reset timestamp
    lastRefreshTime = Date.now();
    const el = document.getElementById("lastUpdated");
    if (el) el.textContent = "Updated just now";

    // Spin animation on the refresh icon SVG
    const icon = document.getElementById("refreshIcon");
    if (icon) {
      icon.classList.remove("spin");
      // Force reflow so re-adding the class always re-triggers the animation
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
    if (liveIntervalId !== null) return; // guard against double-start
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
      if (liveToggle.checked) {
        startLiveMode();
      } else {
        stopLiveMode();
      }
    });

    // Restore live mode from localStorage on page load
    if (localStorage.getItem("pulse-live-mode") === "on") {
      liveToggle.checked = true;
      startLiveMode();
    }
  }

  // ----------------- Refresh button ----------------
  const refreshBtn = document.getElementById("refreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", refreshDashboard);
  }

  // ----------------- Initial render ----------------
  renderTable();
  renderChart();
  startTimestampUpdater();
})();
