// Pulse — dashboard interactivity
// Renders the metrics table and DAU chart from PULSE_DATA, and wires up
// the per-row CSV export, bulk export (CSV / PDF / PNG), and print flow.

(function () {
  const data = window.PULSE_DATA;
  if (!data) return;

  // Module-scoped chart instance so the PNG / PDF exporters can reach it.
  let dauChart = null;

  // ---------------- Formatters ----------------
  const formatNum = (n) => Number(n).toLocaleString("en-US");
  const formatCurrency = (n) =>
    "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const formatDate = (iso) => {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
  const todayStamp = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // ---------------- Table render ----------------
  const tbody = document.getElementById("metricsTableBody");
  if (tbody) {
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
            <td class="px-6 py-3 text-right no-print actions-col">
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

    // Single-row export — one-row CSV for that day.
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

  // ---------------- Helpers ----------------
  function downloadCsv(content, filename) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    triggerDownload(blob, filename);
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ---------------- Bulk exporters ----------------
  function exportAllCsv() {
    const header = "Date,Active Users,Sessions,Conversion %,Revenue\n";
    // Oldest-first in the CSV so it imports naturally into spreadsheets.
    const body = data.daily
      .map((r) => `${r.date},${r.users},${r.sessions},${r.conversion},${r.revenue}`)
      .join("\n");
    downloadCsv(header + body + "\n", `pulse-metrics-${todayStamp()}.csv`);
  }

  function exportChartPng() {
    if (!dauChart) return;
    try {
      const dataUrl = dauChart.toBase64Image("image/png", 1);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `pulse-dau-${todayStamp()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("PNG export failed", err);
      alert("Could not export chart as PNG.");
    }
  }

  async function exportDashboardPdf() {
    const target = document.querySelector("main");
    if (!target) return;
    if (!window.html2canvas || !window.jspdf) {
      alert("PDF export libraries failed to load.");
      return;
    }
    const button = document.querySelector('[data-export-action="pdf"]');
    const originalLabel = button ? button.innerHTML : null;
    if (button) {
      button.disabled = true;
      button.innerHTML =
        '<span class="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 w-10">PDF</span>Generating…';
    }
    try {
      const isDark = document.documentElement.classList.contains("dark");
      const canvas = await window.html2canvas(target, {
        backgroundColor: isDark ? "#030712" : "#f9fafb",
        scale: 2,
        useCORS: true,
        logging: false
      });
      const imgData = canvas.toDataURL("image/png");
      const { jsPDF } = window.jspdf;
      // Pick orientation that best fits the captured aspect ratio.
      const orientation = canvas.width >= canvas.height ? "landscape" : "portrait";
      const pdf = new jsPDF({ orientation, unit: "pt", format: "letter" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 24;
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;
      const ratio = Math.min(usableWidth / canvas.width, usableHeight / canvas.height);
      const renderWidth = canvas.width * ratio;
      const renderHeight = canvas.height * ratio;
      const x = (pageWidth - renderWidth) / 2;
      const y = margin;
      pdf.addImage(imgData, "PNG", x, y, renderWidth, renderHeight);
      pdf.save(`pulse-dashboard-${todayStamp()}.pdf`);
    } catch (err) {
      console.error("PDF export failed", err);
      alert("Could not generate PDF. See console for details.");
    } finally {
      if (button && originalLabel !== null) {
        button.disabled = false;
        button.innerHTML = originalLabel;
      }
    }
  }

  // ---------------- Export menu wiring ----------------
  const menuRoot = document.getElementById("exportMenuRoot");
  const menuButton = document.getElementById("exportMenuButton");
  const menu = document.getElementById("exportMenu");

  function closeMenu() {
    if (!menu || !menuButton) return;
    menu.classList.add("hidden");
    menuButton.setAttribute("aria-expanded", "false");
  }
  function toggleMenu() {
    if (!menu || !menuButton) return;
    const open = !menu.classList.contains("hidden");
    if (open) {
      closeMenu();
    } else {
      menu.classList.remove("hidden");
      menuButton.setAttribute("aria-expanded", "true");
    }
  }

  if (menuButton && menu) {
    menuButton.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMenu();
    });
    document.addEventListener("click", (e) => {
      if (menuRoot && !menuRoot.contains(e.target)) closeMenu();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
    menu.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-export-action]");
      if (!btn) return;
      closeMenu();
      const action = btn.dataset.exportAction;
      if (action === "csv") exportAllCsv();
      else if (action === "pdf") exportDashboardPdf();
      else if (action === "png") exportChartPng();
      else if (action === "print") window.print();
    });
  }

  const chartPngButton = document.getElementById("chartPngButton");
  if (chartPngButton) chartPngButton.addEventListener("click", exportChartPng);

  const exportAllCsvButton = document.getElementById("exportAllCsvButton");
  if (exportAllCsvButton) exportAllCsvButton.addEventListener("click", exportAllCsv);

  // ---------------- Chart render ----------------
  const canvas = document.getElementById("dauChart");
  if (canvas && window.Chart) {
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
        // Solid background for PNG / PDF exports so transparency doesn't bleed through.
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
})();
