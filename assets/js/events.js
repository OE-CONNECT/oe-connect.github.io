const CSV_URL = 'assets/data/events.csv';
let allEvents = [];

Papa.parse(CSV_URL, {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: function (results) {
    allEvents = results.data;
    renderCountryFilters();
    render();
  },
  error: function (err) {
    document.getElementById('eventsContainer').innerHTML = '<p>Could not load events.csv</p>';
    console.error(err);
  }
});

document.getElementById('formatFilterSelect').addEventListener('change', render);
document.getElementById('countryFilterSelect').addEventListener('change', render);

function getCountry(ev) {
  return (ev.LocationCountry || ev.locationCountry || '').trim();
}

function renderCountryFilters() {
  const countries = [...new Set(allEvents.map(getCountry).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));

  const select = document.getElementById('countryFilterSelect');

  countries.forEach(country => {
    const opt = document.createElement('option');
    opt.value = country;
    opt.textContent = country;
    select.appendChild(opt);
  });
}

function parseChronodate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  return new Date(year, month - 1, day);
}

function sortByChronodate(events) {
  return events.sort((a, b) => {
    const dateA = parseChronodate(a.Chronodate);
    const dateB = parseChronodate(b.Chronodate);
    if (!dateA) return 1;
    if (!dateB) return -1;
    return dateB - dateA; 
  });
}

function render() {
  updateBadges();
  renderEvents();
}

function updateBadges() {
  const activeFormat = document.getElementById('formatFilterSelect').value;
  const country = document.getElementById('countryFilterSelect').value;

  const formatBadge = document.getElementById('formatBadge');
  if (activeFormat) {
    formatBadge.classList.add('active');
    document.getElementById('formatBadgeText').textContent = activeFormat;
  } else {
    formatBadge.classList.remove('active');
  }

  const countryBadge = document.getElementById('countryBadge');
  if (country) {
    countryBadge.classList.add('active');
    document.getElementById('countryBadgeText').textContent = country;
  } else {
    countryBadge.classList.remove('active');
  }
}

function clearFormatFilter() {
  document.getElementById('formatFilterSelect').value = '';
  render();
}

function clearCountryFilter() {
  document.getElementById('countryFilterSelect').value = '';
  render();
}

window.clearFormatFilter = clearFormatFilter;
window.clearCountryFilter = clearCountryFilter;

function renderEvents() {
  const activeFormat = document.getElementById('formatFilterSelect').value;
  const activeCountry = document.getElementById('countryFilterSelect').value;

  const filtered = allEvents.filter(ev => {
    if (ev.APPROVED !== 'TRUE') return false;

    if (activeFormat) {
      const eventFormat = (ev.Format || '').trim();
      if (eventFormat !== 'Hybrid' && eventFormat !== activeFormat) return false;
    }

    const country = getCountry(ev);
    if (activeCountry && country !== activeCountry) return false;

    return true;
  });

  const upcomingEvents = filtered.filter(e => e.Status === 'upcoming');
  const pastEvents = filtered.filter(e => e.Status === 'past');

  const oeUpcoming = sortByChronodate(upcomingEvents.filter(e => e.Group === 'OE-CONNECT'));
  const otherUpcoming = sortByChronodate(upcomingEvents.filter(e => e.Group === 'Other'));
  const oePast = sortByChronodate(pastEvents.filter(e => e.Group === 'OE-CONNECT'));
  const otherPast = sortByChronodate(pastEvents.filter(e => e.Group === 'Other'));

  let html = '';

  html += `<h1 class="status-heading">Upcoming events (${upcomingEvents.length})</h1>`;
  html += `<h2 class="group-heading" style="text-align: center;">OE-CONNECT events</h2>`;
  html += oeUpcoming.length
    ? oeUpcoming.map(renderCard).join('')
    : '<p>No matching OE-CONNECT upcoming events.</p>';

  html += `<h2 class="group-heading" style="text-align: center;">Other Old English events</h2>`;
  html += otherUpcoming.length
    ? otherUpcoming.map(renderCard).join('')
    : '<p>No matching other upcoming events.</p>';

  html += `<h1 class="status-heading">Past events (${pastEvents.length})</h1>`;
  html += `<h2 class="group-heading" style="text-align: center;">OE-CONNECT events</h2>`;
  html += oePast.length
    ? oePast.map(renderCard).join('')
    : '<p>No matching OE-CONNECT past events.</p>';

  html += `<h2 class="group-heading" style="text-align: center;">Other Old English events</h2>`;
  html += otherPast.length
    ? otherPast.map(renderCard).join('')
    : '<p>No matching other past events.</p>';

  document.getElementById('eventsContainer').innerHTML = html;
}

function renderCard(ev) {
  const links = [];
  if (ev.Website) links.push(`<a href="${ev.Website}" target="_blank" rel="noopener">Website</a>`);
  if (ev.CFP) links.push(`<a href="${ev.CFP}" target="_blank" rel="noopener">Call for Papers</a>`);

  const location = [ev.LocationCity, getCountry(ev)].filter(Boolean).join(', ');

  return `
    <div class="event-card">
      <div class="event-left">
        <div class="event-year">${ev.Year || ''}</div>
        <div class="event-date">${ev.Date || ''}</div>
        ${ev.Logo ? `<img src="${ev.Logo}" alt="Logo" class="event-logo" loading="lazy">` : ''}
      </div>
      <div class="event-right">
        <h3>${ev.Name || 'Untitled event'}</h3>
        <p>${ev.Description || ''}</p>
        <div class="event-meta">
          ${ev.Organiser ? `<strong>Organiser:</strong> ${ev.Organiser}<br>` : ''}
          ${location ? `<strong>Location:</strong> ${location}<br>` : ''}
          ${ev.Format ? `<strong>Format:</strong> ${ev.Format}` : ''}
        </div>
        ${links.length ? `<div class="event-links">${links.join(' · ')}</div>` : ''}
      </div>
    </div>
  `;
}