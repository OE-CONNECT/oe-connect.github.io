const CSV_URL = 'assets/data/projects.csv';
let allProjects = [];

Papa.parse(CSV_URL, {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: function (results) {
    allProjects = results.data.filter(row => {
      const title = row.Title && row.Title.trim();
      const approved = String(row.APPROVED || row.Approved || row.approved || '').trim().toUpperCase();
      return title && approved === 'TRUE';
    });
    populateFilterOptions();
    render();
  },
  error: function (err) {
    document.getElementById('projectsContainer').innerHTML = '<p>Could not load projects.csv</p>';
    console.error(err);
  }
});

document.getElementById('filterCountry').addEventListener('change', render);
document.getElementById('filterInstitution').addEventListener('change', render);
document.getElementById('searchBox').addEventListener('input', render);

function populateFilterOptions() {
  const countrySet = new Set();
  const institutionSet = new Set();

  allProjects.forEach(p => {
    if (p.Countries) {
      p.Countries.split(';').forEach(c => {
        const cleaned = c.trim();
        if (cleaned) countrySet.add(cleaned);
      });
    }
    if (p.Institutions) {
      p.Institutions.split(';').forEach(i => {
        const cleaned = i.trim();
        if (cleaned) institutionSet.add(cleaned);
      });
    }
  });

  fillSelect('filterCountry', [...countrySet].sort());
  fillSelect('filterInstitution', [...institutionSet].sort());
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
  const country = document.getElementById('filterCountry').value;
  const institution = document.getElementById('filterInstitution').value;
  const search = document.getElementById('searchBox').value.toLowerCase().trim();

  return allProjects.filter(p => {
    if (country) {
      const countries = (p.Countries || '').split(';').map(c => c.trim());
      if (!countries.includes(country)) return false;
    }

    if (institution) {
      const institutions = (p.Institutions || '').split(';').map(i => i.trim());
      if (!institutions.includes(institution)) return false;
    }

    if (search) {
      const searchable = [
        p.Title, p.Description, p.Institutions, p.Countries,
        p.Funding, p.StartYear, p.EndYear
      ].join(' ').toLowerCase();

      if (!searchable.includes(search)) return false;
    }

    return true;
  });
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function render() {
  const filtered = getFiltered();
  updateBadges();

  const ongoing = shuffle(filtered.filter(p => (p.Status || '').toLowerCase() === 'ongoing'));
  const finished = shuffle(filtered.filter(p => (p.Status || '').toLowerCase() === 'finished'));

  let html = '';

  html += `<h2 class="group-heading">Ongoing Research Projects (${ongoing.length})</h2>`;
  html += ongoing.length === 0
    ? '<p>No ongoing projects match the current filters.</p>'
    : ongoing.map(renderCard).join('');

  html += `<h2 class="group-heading">Finished Research Projects (${finished.length})</h2>`;
  html += finished.length === 0
    ? '<p>No finished projects match the current filters.</p>'
    : finished.map(renderCard).join('');

  document.getElementById('projectsContainer').innerHTML = html;
}

function updateBadges() {
  const country = document.getElementById('filterCountry').value;
  const institution = document.getElementById('filterInstitution').value;
  const search = document.getElementById('searchBox').value.trim();

  const countryBadge = document.getElementById('countryBadge');
  if (country) {
    countryBadge.classList.add('active');
    document.getElementById('countryBadgeText').textContent = country;
  } else {
    countryBadge.classList.remove('active');
  }

  const institutionBadge = document.getElementById('institutionBadge');
  if (institution) {
    institutionBadge.classList.add('active');
    document.getElementById('institutionBadgeText').textContent = institution;
  } else {
    institutionBadge.classList.remove('active');
  }

  const searchBadge = document.getElementById('searchBadge');
  if (search) {
    searchBadge.classList.add('active');
    document.getElementById('searchBadgeText').textContent = search;
  } else {
    searchBadge.classList.remove('active');
  }
}

function clearCountry() {
  document.getElementById('filterCountry').value = '';
  render();
}

function clearInstitution() {
  document.getElementById('filterInstitution').value = '';
  render();
}

function clearSearch() {
  document.getElementById('searchBox').value = '';
  render();
}

window.clearCountry = clearCountry;
window.clearInstitution = clearInstitution;
window.clearSearch = clearSearch;

function renderCard(p) {
  const logoSrc = (p.Logo && p.Logo.trim())
    ? p.Logo
    : 'assets/images/icon.project.png';

  let titleText = p.Title || 'Untitled project';
  if (p.StartYear && p.EndYear) {
    titleText += ` (${p.StartYear}–${p.EndYear})`;
  } else if (p.StartYear) {
    titleText += ` (${p.StartYear}–)`;
  }

  const institutions = (p.Institutions || '')
    .split(';')
    .map(i => i.trim())
    .filter(Boolean)
    .join(' • ');

  const websiteLink = p.Website
    ? `<p class="project-website"><a href="${p.Website}" target="_blank" rel="noopener">Link to project website</a></p>`
    : '';

  return `
    <div class="project-card">
      <div class="project-left">
        <img src="${logoSrc}" alt="Project logo" class="project-logo"
             onerror="this.src='assets/images/icon.project.png'">
      </div>
      <div class="project-right">
        <h3>${titleText}</h3>
        <p>${p.Description || ''}</p>
        ${p.Funding ? `<p><strong>Funded by:</strong> ${
          p.Funding.split(';').map(f => f.trim()).filter(Boolean).join(' • ')
        }</p>` : ''}
        ${institutions ? `<p><strong>Institutions:</strong> ${institutions}</p>` : ''}
        ${websiteLink}
      </div>
    </div>
  `;
}