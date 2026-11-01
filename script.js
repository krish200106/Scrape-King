
let rawThreatData = [];
let sevChartInstance = null;
let srcChartInstance = null;
let activeSourceChip = "ALL";

document.addEventListener("DOMContentLoaded", () => {
  fetchThreats();
});

async function fetchThreats() {
  setLoadingState(true);
  try {
    const res = await fetch("/api/threats");
    const json = await res.json();
    rawThreatData = json.threats || [];
    populateSourceFilters(rawThreatData);
    updateDashboard(rawThreatData);
  } catch (err) {
    console.error("ScrapeKing Fetch failure:", err);
  } finally {
    setLoadingState(false);
  }
}

async function runScraper() {
  const btn = document.getElementById("scrapeBtn");
  const icon = document.getElementById("refreshIcon");

  btn.disabled = true;
  icon.classList.add("fa-spin");
  setLoadingState(true);

  try {
    const res = await fetch("/api/scrape", { method: "POST" });
    const json = await res.json();
    rawThreatData = json.threats || [];
    populateSourceFilters(rawThreatData);
    updateDashboard(rawThreatData);
  } catch (err) {
    alert("ScrapeKing feed ingestion failed. Check server console.");
  } finally {
    btn.disabled = false;
    icon.classList.remove("fa-spin");
    setLoadingState(false);
  }
}

function setLoadingState(isLoading) {
  const notice = document.getElementById("loadingNotice");
  if (!notice) return;
  if (isLoading) {
    notice.classList.remove("hidden");
  } else {
    notice.classList.add("hidden");
  }
}

function updateDashboard(items) {
  // Metric counts
  document.getElementById("totalCount").innerText = items.length;
  document.getElementById("critCount").innerText = items.filter(t => t.severity === "CRITICAL").length;
  document.getElementById("highCount").innerText = items.filter(t => t.severity === "HIGH").length;

  const sourcesElem = document.getElementById("sourcesCount");
  if (sourcesElem) {
    const uniqueSources = new Set(rawThreatData.map(t => t.source)).size;
    sourcesElem.innerText = uniqueSources || 9;
  }

  const cveTotal = items.reduce((acc, cur) => acc + (cur.cves ? cur.cves.length : 0), 0);
  document.getElementById("cveCount").innerText = cveTotal;
  document.getElementById("feedCountBadge").innerText = items.length;

  renderFeed(items);
  renderAllCharts(items);
}

function renderFeed(items) {
  const container = document.getElementById("threatList");
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 0; color: #64748b;">
        <i class="fa-solid fa-radar" style="font-size: 36px; margin-bottom: 12px; color: #f59e0b;"></i>
        <p style="font-size: 15px; font-weight: 500;">No threat intelligence matched your active filters.</p>
        <p style="font-size: 12px; margin-top: 4px;">Try resetting search terms or selecting 'All Severities'.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => `
    <article class="threat-row ${item.severity}">
      <div class="card-top">
        <span class="source-tag" style="color: ${item.source_color || '#cbd5e1'};">
          <i class="fa-solid ${item.source_icon || 'fa-satellite-dish'}"></i> ${item.source}
        </span>
        <span class="badge ${item.severity}">${item.severity}</span>
      </div>

      <div class="threat-title">
        <a href="${item.link}" target="_blank" rel="noopener noreferrer" title="Read source report">
          ${item.title} <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </a>
      </div>

      <p class="threat-desc">${item.summary}</p>

      <div class="threat-footer">
        <div class="cve-container">
          ${item.cves && item.cves.length > 0
            ? item.cves.map(cve => `<span class="cve-chip"><i class="fa-solid fa-bug" style="font-size:9px;margin-right:3px;"></i>${cve}</span>`).join("")
            : '<span style="font-size: 11px; color: #475569;">No CVE detected</span>'
          }
        </div>
        <span class="timestamp"><i class="fa-regular fa-clock"></i> ${item.published}</span>
      </div>
    </article>
  `).join("");
}

function filterThreats() {
  const query = document.getElementById("searchBox").value.trim().toLowerCase();
  const selectedSeverity = document.getElementById("severityFilter").value;
  const selectedSource = document.getElementById("sourceFilter").value;

  const filtered = rawThreatData.filter(item => {
    const matchesQuery =
      item.title.toLowerCase().includes(query) ||
      item.summary.toLowerCase().includes(query) ||
      (item.cves && item.cves.some(c => c.toLowerCase().includes(query)));

    const matchesSev = (selectedSeverity === "ALL") || (item.severity === selectedSeverity);
    const matchesSrc = (selectedSource === "ALL") || (item.source === selectedSource);

    return matchesQuery && matchesSev && matchesSrc;
  });

  updateDashboard(filtered);
}

function populateSourceFilters(items) {
  const select = document.getElementById("sourceFilter");
  const chipsContainer = document.getElementById("sourceChipsList");
  if (!select) return;

  const sources = [...new Set(items.map(t => t.source))];

  // 1. Populate Dropdown
  const currentVal = select.value;
  select.innerHTML = `<option value="ALL">All Sources (${sources.length} Total)</option>`;
  sources.forEach(src => {
    const opt = document.createElement("option");
    opt.value = src;
    opt.innerText = src;
    select.appendChild(opt);
  });
  if (sources.includes(currentVal)) {
    select.value = currentVal;
  }

  // 2. Populate Quick-Filter Chips
  if (chipsContainer) {
    chipsContainer.innerHTML = "";

    // "All" Chip
    const allChip = document.createElement("button");
    allChip.className = `source-chip ${activeSourceChip === "ALL" ? "active" : ""}`;
    allChip.innerHTML = `<i class="fa-solid fa-layer-group"></i> All <span class="chip-count">${items.length}</span>`;
    allChip.onclick = () => selectSourceChip("ALL");
    chipsContainer.appendChild(allChip);

    // Individual Source Chips
    sources.forEach(src => {
      const count = items.filter(t => t.source === src).length;
      const sampleItem = items.find(t => t.source === src);
      const icon = sampleItem ? sampleItem.source_icon : "fa-satellite-dish";
      const chip = document.createElement("button");
      chip.className = `source-chip ${activeSourceChip === src ? "active" : ""}`;
      chip.innerHTML = `<i class="fa-solid ${icon}"></i> ${src} <span class="chip-count">${count}</span>`;
      chip.onclick = () => selectSourceChip(src);
      chipsContainer.appendChild(chip);
    });
  }
}

function selectSourceChip(src) {
  activeSourceChip = src;
  const select = document.getElementById("sourceFilter");
  if (select) {
    select.value = src;
  }

  // Update chip active classes
  const chips = document.querySelectorAll(".source-chip");
  chips.forEach(chip => {
    if (chip.innerText.includes(src) || (src === "ALL" && chip.innerText.includes("All"))) {
      chip.classList.add("active");
    } else {
      chip.classList.remove("active");
    }
  });

  filterThreats();
}

// Chart Renderers
function renderAllCharts(items) {
  if (typeof Chart === 'undefined') {
    console.warn("Chart.js is still loading...");
    return;
  }

  const chartFont = { family: 'Inter', size: 11 };

  // 1. Severity Doughnut Chart
  const sevCanvas = document.getElementById('severityChart');
  if (sevCanvas) {
    const counts = {
      CRITICAL: items.filter(t => t.severity === "CRITICAL").length,
      HIGH: items.filter(t => t.severity === "HIGH").length,
      MEDIUM: items.filter(t => t.severity === "MEDIUM").length,
      LOW: items.filter(t => t.severity === "LOW").length,
    };

    if (sevChartInstance) {
      sevChartInstance.data.datasets[0].data = [counts.CRITICAL, counts.HIGH, counts.MEDIUM, counts.LOW];
      sevChartInstance.update();
    } else {
      sevChartInstance = new Chart(sevCanvas.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['Critical', 'High', 'Medium', 'Low'],
          datasets: [{
            data: [counts.CRITICAL, counts.HIGH, counts.MEDIUM, counts.LOW],
            backgroundColor: ['#ef4444', '#f97316', '#eab308', '#10b981'],
            borderWidth: 0,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: { color: '#94a3b8', font: chartFont, padding: 12 }
            }
          },
          cutout: '70%'
        }
      });
    }
  }

  // 2. Stacked Horizontal/Vertical Bar Chart (Breakdown by 9 Sources)
  const srcCanvas = document.getElementById('sourceChart');
  if (srcCanvas) {
    const sources = [...new Set(items.map(t => t.source))];
    const critData = [];
    const highData = [];
    const medData = [];
    const lowData = [];

    sources.forEach(src => {
      const srcItems = items.filter(t => t.source === src);
      critData.push(srcItems.filter(t => t.severity === "CRITICAL").length);
      highData.push(srcItems.filter(t => t.severity === "HIGH").length);
      medData.push(srcItems.filter(t => t.severity === "MEDIUM").length);
      lowData.push(srcItems.filter(t => t.severity === "LOW").length);
    });

    if (srcChartInstance) {
      srcChartInstance.data.labels = sources;
      srcChartInstance.data.datasets[0].data = critData;
      srcChartInstance.data.datasets[1].data = highData;
      srcChartInstance.data.datasets[2].data = medData;
      srcChartInstance.data.datasets[3].data = lowData;
      srcChartInstance.update();
    } else {
      srcChartInstance = new Chart(srcCanvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels: sources,
          datasets: [
            { label: 'Critical', data: critData, backgroundColor: '#ef4444', borderRadius: 2 },
            { label: 'High', data: highData, backgroundColor: '#f97316', borderRadius: 2 },
            { label: 'Medium', data: medData, backgroundColor: '#eab308', borderRadius: 2 },
            { label: 'Low', data: lowData, backgroundColor: '#10b981', borderRadius: 2 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: { color: '#94a3b8', font: chartFont, boxWidth: 10, padding: 8 }
            },
            tooltip: { mode: 'index', intersect: false }
          },
          scales: {
            x: {
              stacked: true,
              ticks: {
                color: '#94a3b8',
                font: { family: 'Inter', size: 10 },
                maxRotation: 25,
                minRotation: 0,
                autoSkip: false
              },
              grid: { display: false }
            },
            y: {
              stacked: true,
              beginAtZero: true,
              title: {
                display: true,
                text: 'Intel Items',
                color: '#64748b',
                font: chartFont
              },
              ticks: { color: '#64748b', font: chartFont, stepSize: 2 },
              grid: { color: 'rgba(255, 255, 255, 0.06)' }
            }
          }
        }
      });
    }
  }
}

// Data Export Functionality
function exportData(format) {
  if (!rawThreatData.length) {
    alert("No ScrapeKing threat intelligence available to export.");
    return;
  }

  let blob, filename;

  if (format === 'json') {
    blob = new Blob([JSON.stringify(rawThreatData, null, 2)], { type: "application/json" });
    filename = `scrapeking_intel_${Date.now()}.json`;
  } else if (format === 'csv') {
    const headers = ["Source", "Title", "Severity", "CVEs", "Published", "Link"];
    const rows = rawThreatData.map(t => [
      `"${(t.source || '').replace(/"/g, '""')}"`,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${t.severity}"`,
      `"${(t.cves || []).join("; ")}"`,
      `"${t.published}"`,
      `"${t.link}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    filename = `scrapeking_intel_${Date.now()}.csv`;
  }

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
