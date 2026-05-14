// Pulse — dashboard interactivity
// Renders the metrics table and DAU chart from PULSE_DATA.

(function () {
  const data = window.PULSE_DATA;
  if (!data) return;

  // ---------------- Table render ----------------
  const tbody = document.getElementById("metricsTableBody");
  if (tbody) {
    const formatNum = (n) => n.toLocaleString("en-US");
    const formatCurrency = (n) =>
      "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const formatDate = (iso) => {
      const d = new Date(iso + "T00:00:00");
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    // Newest first in the table
    const rows = data.daily.slice().reverse();

    tbody.innerHTML = rows
      .map((r, i) => {
        return `
          <tr class="hover:bg-gray-50">
            <td class="px-6 py-3 text-gray-900 font-medium">${formatDate(r.date)}</td>
            <td class="px-6 py-3 text-right tabular-nums">${formatNum(r.users)}</td>
            <td class="px-6 py-3 text-right tabular-nums">${formatNum(r.sessions)}</td>
            <td class="px-6 py-3 text-right tabular-nums">${r.conversion.toFixed(1)}%</td>
            <td class="px-6 py-3 text-right tabular-nums">${formatCurrency(r.revenue)}</td>
            <td class="px-6 py-3 text-right">
              <button
                class="export-row text-xs text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-md px-2.5 py-1 inline-flex items-center gap-1.5 bg-white"
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

    // Single-row export -- creates a one-row CSV. This is the v1 the coding
    // agent will later replace with a bulk "Export all" button at the top.
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

    new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "This period",
            data: current,
            borderColor: "#4f46e5",
            backgroundColor: "rgba(79, 70, 229, 0.08)",
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
            borderColor: "#d1d5db",
            backgroundColor: "transparent",
            borderWidth: 2,
            borderDash: [4, 4],
            tension: 0.35,
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: "#9ca3af"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(17, 24, 39, 0.95)",
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
              color: "#9ca3af",
              font: { size: 11 },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 8
            }
          },
          y: {
            grid: { color: "#f3f4f6" },
            border: { display: false },
            ticks: {
              color: "#9ca3af",
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
