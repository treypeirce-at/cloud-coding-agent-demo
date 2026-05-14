(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Dark mode
  // ---------------------------------------------------------------------------
  (function initDarkMode() {
    if (localStorage.getItem('pulse-theme') === 'dark') {
      document.documentElement.classList.add('dark');
    }
    var btn = document.getElementById('darkToggle');
    if (btn) {
      btn.addEventListener('click', function () {
        var isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('pulse-theme', isDark ? 'dark' : 'light');
      });
    }
  })();

  // ---------------------------------------------------------------------------
  // Chart instance (module-scope so we can update it in place)
  // ---------------------------------------------------------------------------
  var dauChart = null;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function fmt(n) {
    return Number(n).toLocaleString();
  }

  function fmtDate(iso) {
    // "2026-05-13" → "May 13"
    var parts = iso.split('-');
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function fmtDateShort(iso) {
    // "2026-05-13" → "May 13" (same, alias for clarity)
    return fmtDate(iso);
  }

  function isDarkMode() {
    return document.documentElement.classList.contains('dark');
  }

  // ---------------------------------------------------------------------------
  // Data filtering
  // ---------------------------------------------------------------------------
  /**
   * Returns { filtered: Array, prior: Array } where prior is sliced to match.
   * rangeKey: "7d" | "15d" | "custom"
   * customStart / customEnd: ISO date strings (only used when rangeKey === "custom")
   */
  function getFilteredData(rangeKey, customStart, customEnd) {
    var all = window.PULSE_DATA.daily;
    var allPrior = window.PULSE_DATA.prior;
    var filtered, prior;

    if (rangeKey === '7d') {
      filtered = all.slice(-7);
      prior = allPrior.slice(-7);
    } else if (rangeKey === 'custom' && customStart && customEnd) {
      filtered = all.filter(function (row) {
        return row.date >= customStart && row.date <= customEnd;
      });
      // align prior to the same length, taking from the tail
      var len = filtered.length;
      prior = allPrior.slice(-len);
    } else {
      // default: "15d" — all entries
      filtered = all.slice();
      prior = allPrior.slice();
    }

    return { filtered: filtered, prior: prior };
  }

  // ---------------------------------------------------------------------------
  // Chart rendering
  // ---------------------------------------------------------------------------
  function renderChart(filteredData, priorData) {
    var labels = filteredData.map(function (d) { return fmtDate(d.date); });
    var users = filteredData.map(function (d) { return d.users; });

    var isDark = isDarkMode();
    var gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    var tickColor = isDark ? '#6b7280' : '#9ca3af';

    if (dauChart) {
      // Update in place — no destroy/recreate flicker
      dauChart.data.labels = labels;
      dauChart.data.datasets[0].data = users;
      dauChart.data.datasets[1].data = priorData;
      dauChart.options.scales.x.grid.color = gridColor;
      dauChart.options.scales.y.grid.color = gridColor;
      dauChart.options.scales.x.ticks.color = tickColor;
      dauChart.options.scales.y.ticks.color = tickColor;
      dauChart.update();
      return;
    }

    var ctx = document.getElementById('dauChart');
    if (!ctx) return;

    dauChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'This period',
            data: users,
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79,70,229,0.08)',
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            tension: 0.3,
            fill: true
          },
          {
            label: 'Prior period',
            data: priorData,
            borderColor: isDark ? '#4b5563' : '#d1d5db',
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 3,
            tension: 0.3,
            borderDash: [4, 3]
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            titleColor: isDark ? '#f9fafb' : '#111827',
            bodyColor: isDark ? '#9ca3af' : '#6b7280',
            borderColor: isDark ? '#374151' : '#e5e7eb',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: function (ctx) {
                return ' ' + ctx.dataset.label + ': ' + fmt(ctx.parsed.y);
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: tickColor, font: { size: 11 } },
            border: { display: false }
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: tickColor, font: { size: 11 }, callback: function (v) { return fmt(v); } },
            border: { display: false }
          }
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Table rendering
  // ---------------------------------------------------------------------------
  function renderTable(filteredData) {
    var tbody = document.getElementById('metricsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    filteredData.forEach(function (row) {
      var tr = document.createElement('tr');
      tr.className = 'hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors';
      tr.dataset.date = row.date;
      tr.dataset.users = row.users;
      tr.dataset.sessions = row.sessions;
      tr.dataset.conversion = row.conversion;
      tr.dataset.revenue = row.revenue;

      tr.innerHTML =
        '<td class="px-6 py-3.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">' + fmtDate(row.date) + '</td>' +
        '<td class="px-6 py-3.5 text-right tabular-nums text-gray-900 dark:text-white">' + fmt(row.users) + '</td>' +
        '<td class="px-6 py-3.5 text-right tabular-nums text-gray-900 dark:text-white">' + fmt(row.sessions) + '</td>' +
        '<td class="px-6 py-3.5 text-right tabular-nums text-gray-900 dark:text-white">' + row.conversion.toFixed(1) + '%</td>' +
        '<td class="px-6 py-3.5 text-right tabular-nums text-gray-900 dark:text-white">$' + fmt(row.revenue) + '</td>' +
        '<td class="px-6 py-3.5 text-right">' +
          '<button class="export-row-btn text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline transition-colors">' +
            'Export CSV' +
          '</button>' +
        '</td>';

      tbody.appendChild(tr);
    });

    // Re-apply any active filter text
    var filterInput = document.getElementById('tableFilter');
    if (filterInput && filterInput.value.trim()) {
      applyTableFilter(filterInput.value.trim());
    }
  }

  // ---------------------------------------------------------------------------
  // Table text filter
  // ---------------------------------------------------------------------------
  function applyTableFilter(query) {
    var tbody = document.getElementById('metricsTableBody');
    if (!tbody) return;
    var q = query.toLowerCase();
    var rows = tbody.querySelectorAll('tr');
    rows.forEach(function (tr) {
      var text = tr.textContent.toLowerCase();
      tr.style.display = text.indexOf(q) !== -1 ? '' : 'none';
    });
  }

  // ---------------------------------------------------------------------------
  // Apply date range — central update function
  // ---------------------------------------------------------------------------
  /**
   * key: "7d" | "15d" | "custom"
   * start / end: ISO strings, only used when key === "custom"
   */
  function applyDateRange(key, start, end) {
    var result = getFilteredData(key, start, end);
    renderChart(result.filtered, result.prior);
    renderTable(result.filtered);

    // Build label for the button and subtitle
    var label;
    var subtitleRange;

    if (key === '7d') {
      label = 'Last 7 days';
      subtitleRange = 'the last 7 days';
    } else if (key === 'custom' && result.filtered.length > 0) {
      var first = result.filtered[0].date;
      var last = result.filtered[result.filtered.length - 1].date;
      label = fmtDateShort(first) + ' – ' + fmtDateShort(last);
      subtitleRange = fmtDateShort(first) + ' – ' + fmtDateShort(last);
    } else {
      label = 'Last 15 days';
      subtitleRange = 'the last 15 days';
    }

    // Update button label
    var btnLabel = document.getElementById('dateRangeBtnLabel');
    if (btnLabel) btnLabel.textContent = label;

    // Update chart subtitle
    var chartSub = document.getElementById('chartSubtitle');
    if (chartSub) chartSub.textContent = label;

    // Update page subtitle
    var pageSub = document.getElementById('pageSubtitle');
    if (pageSub) {
      pageSub.textContent = 'Product metrics for ' + subtitleRange + '. Updated 4 minutes ago.';
    }

    // Persist to localStorage
    var saved = { key: key };
    if (key === 'custom') {
      saved.start = start;
      saved.end = end;
    }
    try {
      localStorage.setItem('pulseRange', JSON.stringify(saved));
    } catch (e) { /* ignore */ }
  }

  // ---------------------------------------------------------------------------
  // Dropdown logic
  // ---------------------------------------------------------------------------
  function initDropdown() {
    var btn = document.getElementById('dateRangeBtn');
    var dropdown = document.getElementById('dateRangeDropdown');
    var customPanel = document.getElementById('customRangePanel');
    var applyBtn = document.getElementById('applyCustomRange');
    var startInput = document.getElementById('customStartDate');
    var endInput = document.getElementById('customEndDate');

    if (!btn || !dropdown) return;

    // Set default min/max on date inputs based on data
    var all = window.PULSE_DATA.daily;
    if (all && all.length && startInput && endInput) {
      var minDate = all[0].date;
      var maxDate = all[all.length - 1].date;
      startInput.min = minDate;
      startInput.max = maxDate;
      endInput.min = minDate;
      endInput.max = maxDate;
      // Pre-fill to the full range
      startInput.value = minDate;
      endInput.value = maxDate;
    }

    function openDropdown() {
      dropdown.classList.remove('hidden');
      btn.setAttribute('aria-expanded', 'true');
    }

    function closeDropdown() {
      dropdown.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
    }

    function toggleDropdown() {
      if (dropdown.classList.contains('hidden')) {
        openDropdown();
      } else {
        closeDropdown();
      }
    }

    // Toggle on button click
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleDropdown();
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!dropdown.classList.contains('hidden') &&
          !dropdown.contains(e.target) &&
          e.target !== btn) {
        closeDropdown();
      }
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !dropdown.classList.contains('hidden')) {
        closeDropdown();
        btn.focus();
      }
    });

    // Preset buttons
    var presets = dropdown.querySelectorAll('.date-range-preset');
    presets.forEach(function (presetBtn) {
      presetBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var range = presetBtn.getAttribute('data-range');

        // Highlight active preset
        presets.forEach(function (p) {
          p.classList.remove('bg-gray-100', 'dark:bg-gray-800', 'text-gray-900', 'dark:text-white', 'font-medium');
        });
        presetBtn.classList.add('bg-gray-100', 'dark:bg-gray-800', 'text-gray-900', 'dark:text-white', 'font-medium');

        if (range === 'custom') {
          if (customPanel) customPanel.classList.remove('hidden');
          // Don't close yet — wait for Apply
        } else {
          if (customPanel) customPanel.classList.add('hidden');
          applyDateRange(range, null, null);
          closeDropdown();
        }
      });
    });

    // Apply custom range
    if (applyBtn) {
      applyBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var s = startInput ? startInput.value : '';
        var en = endInput ? endInput.value : '';
        if (!s || !en) return;
        if (s > en) {
          // Swap silently
          var tmp = s; s = en; en = tmp;
          if (startInput) startInput.value = s;
          if (endInput) endInput.value = en;
        }
        applyDateRange('custom', s, en);
        closeDropdown();
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Per-row CSV export (delegated on tbody)
  // ---------------------------------------------------------------------------
  function initTableExport() {
    var tbody = document.getElementById('metricsTableBody');
    if (!tbody) return;

    tbody.addEventListener('click', function (e) {
      var exportBtn = e.target.closest('.export-row-btn');
      if (!exportBtn) return;

      var tr = exportBtn.closest('tr');
      if (!tr) return;

      var date = tr.dataset.date || '';
      var users = tr.dataset.users || '';
      var sessions = tr.dataset.sessions || '';
      var conversion = tr.dataset.conversion || '';
      var revenue = tr.dataset.revenue || '';

      var csv = 'Date,Active Users,Sessions,Conversion Rate,Revenue\n' +
        [date, users, sessions, conversion + '%', '$' + revenue].join(',') + '\n';

      var blob = new Blob([csv], { type: 'text/csv' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'pulse-' + (date || 'export') + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // ---------------------------------------------------------------------------
  // Table filter input
  // ---------------------------------------------------------------------------
  function initTableFilter() {
    var filterInput = document.getElementById('tableFilter');
    if (!filterInput) return;
    filterInput.addEventListener('input', function () {
      applyTableFilter(filterInput.value.trim());
    });
  }

  // ---------------------------------------------------------------------------
  // Bootstrap
  // ---------------------------------------------------------------------------
  function init() {
    // Restore saved range from localStorage, default to "15d"
    var saved = null;
    try {
      var raw = localStorage.getItem('pulseRange');
      if (raw) saved = JSON.parse(raw);
    } catch (e) { /* ignore */ }

    var key = (saved && saved.key) ? saved.key : '15d';
    var start = (saved && saved.start) ? saved.start : null;
    var end = (saved && saved.end) ? saved.end : null;

    // Highlight the saved/default preset button before dropdown init
    // so the active state is correct when the dropdown first opens.
    // (Done after initDropdown sets up listeners.)

    initDropdown();
    initTableExport();
    initTableFilter();

    // Mark the active preset visually
    var dropdown = document.getElementById('dateRangeDropdown');
    if (dropdown) {
      var activePreset = dropdown.querySelector('[data-range="' + key + '"]');
      if (activePreset) {
        activePreset.classList.add('bg-gray-100', 'dark:bg-gray-800', 'text-gray-900', 'dark:text-white', 'font-medium');
      }
      // If restoring custom range, also pre-fill inputs
      if (key === 'custom' && start && end) {
        var startInput = document.getElementById('customStartDate');
        var endInput = document.getElementById('customEndDate');
        if (startInput) startInput.value = start;
        if (endInput) endInput.value = end;
        var customPanel = document.getElementById('customRangePanel');
        if (customPanel) customPanel.classList.remove('hidden');
      }
    }

    // Initial render
    applyDateRange(key, start, end);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
