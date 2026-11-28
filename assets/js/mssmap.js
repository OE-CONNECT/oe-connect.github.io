const CSV_URL = 'assets/data/mss.csv';
let allManuscripts = [];
let map, markersLayer;
let filterCity = '';

function getManuscriptGroupKey(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const match = raw.match(/^\d+/);
  return match ? match[0] : raw;
}

function countUniqueManuscriptsByType(list) {
  const counts = {
    manuscript: new Set(),
    fragment: new Set()
  };

  list.forEach(m => {
    const type = (m['Fragment or full'] || '').trim();
    const key = getManuscriptGroupKey(m['OE-CONNECT ID']);
    if (!key) return;

    if (type === 'Full MS') counts.manuscript.add(key);
    else if (type === 'Fragment') counts.fragment.add(key);
  });

  return {
    manuscript: counts.manuscript.size,
    fragment: counts.fragment.size
  };
}

// ---------- Load data ----------
Papa.parse(CSV_URL, {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: function (results) {
    allManuscripts = results.data
      .filter(row => row['OE-CONNECT ID'])
      .sort((a, b) => parseInt(a['OE-CONNECT ID']) - parseInt(b['OE-CONNECT ID']));

    // Small delay so the navbar has time to load
    setTimeout(() => {
      populateFilterOptions();
      initMap();
      render();
    }, 500);
  },
  error: function (err) {
    document.getElementById('msContainer').innerHTML = '<p>Could not load mss.csv</p>';
    console.error(err);
  }
});

// ---------- Filters ----------
document.getElementById('filterDigitized').addEventListener('change', render);
document.getElementById('filterFull').addEventListener('change', render);
document.getElementById('filterFragment').addEventListener('change', render);
document.getElementById('filterCountry').addEventListener('change', render);

function populateFilterOptions() {
  const countries = [...new Set(allManuscripts.map(m => m.Country).filter(Boolean))].sort();
  fillSelect('filterCountry', countries);
}

function fillSelect(id, values) {
  const select = document.getElementById(id);
  values.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    select.appendChild(opt);
  });
}

function getFiltered() {
  const onlyDigitized = document.getElementById('filterDigitized').checked;
  const showFull = document.getElementById('filterFull').checked;
  const showFragment = document.getElementById('filterFragment').checked;
  const country = document.getElementById('filterCountry').value;

  return allManuscripts.filter(m => {
    if (
      onlyDigitized &&
      !(m.URL_DIGITAL || '').trim() &&
      !(m['IIIF Manifest'] || '').trim()
    ) return false;

    const type = (m['Fragment or full'] || '').trim();
    if (type === 'Full MS' && !showFull) return false;
    if (type === 'Fragment' && !showFragment) return false;
    if (country && m.Country !== country) return false;
    if (filterCity && m.City !== filterCity) return false;
    return true;
  });
}

// ---------- Render list + map ----------
function render() {
  const filtered = getFiltered();
  updateResultsTitle(filtered);
  updateFilterBadges();
  renderCards(filtered);
  updateMap(filtered);
}

function updateResultsTitle(filtered) {
  const counts = countUniqueManuscriptsByType(filtered);
  document.getElementById('resultsTitle').textContent =
    `Showing ${counts.manuscript} manuscripts and ${counts.fragment} fragments`;
}

function updateFilterBadges() {
  const country = document.getElementById('filterCountry').value;
  const countryBadge = document.getElementById('countryFilterBadge');
  const cityBadge = document.getElementById('cityFilterBadge');

  if (country) {
    countryBadge.classList.add('active');
    document.getElementById('countryFilterName').textContent = country;
  } else {
    countryBadge.classList.remove('active');
  }

  if (filterCity) {
    cityBadge.classList.add('active');
    document.getElementById('cityFilterName').textContent = filterCity;
  } else {
    cityBadge.classList.remove('active');
  }
}

function renderCards(list) {
  const container = document.getElementById('msContainer');
  if (list.length === 0) {
    container.innerHTML = '<p>No manuscripts match the current filters.</p>';
    return;
  }

  let html = '';
  list.forEach(m => {
    const id = m['OE-CONNECT ID'] || '';
    const type = (m['Fragment or full'] || '').trim();
    const icon = type === 'Fragment'
      ? 'assets/images/icon.fragment.png'
      : 'assets/images/icon.ms.png';

    const iiifManifest = (m['IIIF Manifest'] || '').trim();
    const digital = iiifManifest
      ? `<p><a class="inline-container" href="msviewer.html?${new URLSearchParams({
          ms: m['OE-CONNECT ID']
        })}" target="_blank" rel="noopener"><strong>→ View full digital facsimile</strong>${
          m['LinkDownDate']
            ? ` </a><span class="link-down">(Link down since ${m['LinkDownDate']})</span>`
            : '<img src="assets/images/logo.bibliography.png" class="inline-icon" alt=""></a>'
        }</p>`
      : m.URL_DIGITAL
        ? `<p><a class="inline-container" href="${m.URL_DIGITAL}" target="_blank" rel="noopener"><strong>Link to full digital facsimile</strong>${
            m['LinkDownDate']
              ? ` </a><span class="link-down">(Link down since ${m['LinkDownDate']})</span>`
              : '</a>'
          }</p>`
        : `<p><em>No full digital facsimile available</em></p>`;

    const secondary = [];
    if (m['Ker ID'] && m.URL_Searobend) {
      secondary.push(`<a href="${m.URL_Searobend}" target="_blank" rel="noopener">${m['Ker ID']}</a>`);
    }
    if (m.URL_GN) {
      const gnId = m.URL_GN.split('/').pop();
      secondary.push(`<a href="${m.URL_GN}" target="_blank" rel="noopener">Electronic Gneuss-Lapidge ${gnId}</a>`);
    }
    if (m.URL_ASMMF) {
      secondary.push(`<a href="${m.URL_ASMMF}" target="_blank" rel="noopener">ASMMF${m['ASMMF ID'] ? ` ${m['ASMMF ID']}` : ''}</a>`);
    }
    if (m['Studer-Joho']) {
      secondary.push(`<a href="https://glossenwiki.phil.uni-augsburg.de/wiki/images/StuderAEGG.pdf" target="_blank" rel="noopener">Studer-Joho ${m['Studer-Joho']}</a>`);
    }
    if (m.OEiS) {
      secondary.push(`<a href="https://doi.org/10.24894/978-3-7965-5205-2" target="_blank" rel="noopener"><i>OEiS</i> ${m.OEiS}</a>`);
    }
    if (iiifManifest) {
      secondary.push(`<a href="${m['IIIF Manifest']}" target="_blank" rel="noopener">IIIF Manifest</a>`);
    }
    if (iiifManifest && m.URL_DIGITAL) {
      secondary.push(`<a href="${m.URL_DIGITAL}" target="_blank" rel="noopener">Link to alternative portal</a>`);
    }

    html += `
      <div class="ms-card">
        <div class="ms-left">
          <h3 class="ms-id">${id}</h3>
          <img src="${icon}" alt="${type}" class="ms-icon">
        </div>
        <div class="ms-right">
          <h3>${m.SHELFMARK || 'Untitled'}</h3>
          <p>${m['OE contents'] || ''}</p>
          ${digital}
          ${secondary.length ? `<div class="ms-links-secondary">${secondary.join(' · ')}</div>` : ''}
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

// ---------- Leaflet map ----------
function initMap() {
  map = L.map('map', {
    center: [50.5, 10],
    zoom: 4,
    maxBounds: [[30, -15], [72, 40]]
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);

  const fullscreenControl = L.control({ position: 'topright' });

  fullscreenControl.onAdd = function () {
    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-fullscreen');
    const button = L.DomUtil.create('button', '', container);

    button.type = 'button';
    button.setAttribute('aria-pressed', 'false');

    function updateButton() {
      const isFullscreen = document.fullscreenElement === map.getContainer();
      button.textContent = isFullscreen ? 'Exit fullscreen' : 'Fullscreen';
      button.setAttribute('aria-pressed', String(isFullscreen));
    }

    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.on(button, 'click', async function () {
      const mapElement = map.getContainer();
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        } else {
          await mapElement.requestFullscreen();
        }
      } catch (error) {
        console.error('Could not toggle map fullscreen:', error);
      }
    });

    document.addEventListener('fullscreenchange', function () {
      updateButton();
      setTimeout(() => map.invalidateSize(), 100);
    });

    updateButton();
    return container;
  };

  fullscreenControl.addTo(map);

  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 100);
}

function updateMap(list) {
  markersLayer.clearLayers();

  const groups = {};
  list.forEach(m => {
    if (!m.latitude || !m.longitude || !m.City) return;

    const type = (m['Fragment or full'] || '').trim();
    const baseKey = getManuscriptGroupKey(m['OE-CONNECT ID']);
    const cityKey = m.City + '|' + (m.Country || '');

    if (!groups[cityKey]) {
      groups[cityKey] = {
        city: m.City,
        country: m.Country || '',
        lat: parseFloat(m.latitude),
        lng: parseFloat(m.longitude),
        full: new Set(),
        fragment: new Set()
      };
    }

    if (type === 'Full MS' && baseKey) groups[cityKey].full.add(baseKey);
    else if (type === 'Fragment' && baseKey) groups[cityKey].fragment.add(baseKey);
  });

  Object.values(groups).forEach(g => {
    const fullCount = g.full.size;
    const fragmentCount = g.fragment.size;
    const total = fullCount + fragmentCount;

    let color;
    if (total <= 2) color = '#1A3A6E';
    else if (total <= 6) color = '#8B1A1A';
    else color = '#D4AF37';

    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        background:${color};
        color:#F5E8C7;
        width:28px;height:28px;
        border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        font-weight:bold;font-size:13px;
        border:2px solid #F5E8C7;
        box-shadow:0 1px 4px rgba(0,0,0,0.4);
      ">${total}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const marker = L.marker([g.lat, g.lng], {
      icon,
      zIndexOffset: total * 1000
    }).addTo(markersLayer);

    let popup = `<strong>${g.city}${g.country ? ', ' + g.country : ''}</strong><br>`;
    if (fullCount > 0) popup += `Number of full manuscripts: ${fullCount}<br>`;
    if (fragmentCount > 0) popup += `Number of fragments: ${fragmentCount}<br>`;
    popup += `<a class="popup-filter-btn" onclick="filterByCity('${g.city.replace(/'/g, "\\'")}')">Use location as filter</a>`;

    marker.bindPopup(popup);
  });

  // Zoom behaviour
  const country = document.getElementById('filterCountry').value;
  const layers = markersLayer.getLayers();

  if (country && layers.length > 0) {
    if (layers.length === 1) {
      map.setView(layers[0].getLatLng(), 8);
    } else {
      const group = L.featureGroup(layers);
      map.fitBounds(group.getBounds().pad(0.25));
    }
  } else if (!country) {
    map.setView([50.5, 10], 4);
  }
}

function filterByCity(cityName) {
  filterCity = cityName;
  document.getElementById('filterCountry').value = '';
  render();
}

function clearCityFilter() {
  filterCity = '';
  render();
}

function clearCountryFilter() {
  document.getElementById('filterCountry').value = '';
  render();
}

// Expose functions used by onclick attributes
window.filterByCity = filterByCity;
window.clearCityFilter = clearCityFilter;
window.clearCountryFilter = clearCountryFilter;