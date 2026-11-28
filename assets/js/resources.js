    const CSV_URL = 'assets/data/resources.csv';
    let allResources = [];

    // Desired Category order
    const categoryOrder = [
      "Learning & Teaching",
      "Reference Works",
      "Primary Sources",
      "Research Tools & Technical Resources",
      "Public Engagement",
      "Communities",
      "Other"
    ];

    // Logo mapping
    const logoMap = {
      "Audio Recording": "logo.audio.png",
      "Bibliography": "logo.bibliography.png",
      "Blog": "logo.blog.png",
      "Catalogue": "logo.bibliography.png",
      "Database": "logo.database.png",
      "Dictionary": "logo.dictionary.png",
      "Digital Edition": "logo.diged.png",
      "E-Book": "logo.ebook.png",
      "Font": "logo.font.png",
      "Glossary": "logo.dictionary.png",
      "Grammar Exercises": "logo.exercises.png",
      "Grammar Explanation": "logo.grammar.png",
      "Journal": "logo.journal.png",
      "Manuscript Collection": "logo.mss.png",
      "Online Course": "logo.course.png",
      "Society": "logo.society.png",
      "Software": "logo.software.png",
      "Teaching Materials": "logo.teaching.png",
      "Text Corpus": "logo.corpus.png",
      "Thesaurus": "logo.thesaurus.png",
      "Translation": "logo.translation.png",
      "Translation Exercises": "logo.exercises.png",
      "Video": "logo.video.png",
      "Vocabulary Exercises": "logo.exercises.png",
      "YouTube Channel": "logo.youtube.png",
      "Other": "logo.other.png"
    };

    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        allResources = results.data.filter(r =>
          r.Title &&
          r.Title.trim() !== '' &&
          String(r.APPROVED || '').trim().toUpperCase() === 'TRUE'
        );
        populateFilterOptions();
        render();
      },
      error: function(err) {
        document.getElementById('resourcesContainer').innerHTML = '<p>Could not load resources.csv</p>'; 
        console.error(err);
      }
    });

    // Event listeners
    ['filterCategory', 'filterType', 'filterLevel'].forEach(id => {
      document.getElementById(id).addEventListener('change', render);
    });
    document.getElementById('searchBox').addEventListener('input', render);

    function populateFilterOptions() {
      const categories = new Set();
      const types = new Set();

      allResources.forEach(r => {
        if (r.Category) {
          r.Category.split(';').forEach(c => {
            const cleaned = c.trim();
            if (cleaned) categories.add(cleaned);
          });
        }
        if (r.Type) {
          r.Type.split(';').forEach(t => {
            const cleaned = t.trim();
            if (cleaned) types.add(cleaned);
          });
        }
      });

      fillSelect('filterCategory', [...categories].sort());
      fillSelect('filterType', [...types].sort());
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
      const category = document.getElementById('filterCategory').value;
      const type = document.getElementById('filterType').value;
      const level = document.getElementById('filterLevel').value;
      const search = document.getElementById('searchBox').value.toLowerCase().trim();

      return allResources.filter(r => {
        if (category) {
          const cats = (r.Category || '').split(';').map(c => c.trim());
          if (!cats.includes(category)) return false;
        }
        if (type) {
          const types = (r.Type || '').split(';').map(t => t.trim());
          if (!types.includes(type)) return false;
        }
        if (level) {
          const levels = (r.Level || '').split(';').map(l => l.trim());
          if (!levels.includes(level)) return false;
        }
        if (search) {
          const text = [
            r.Title,
            r.Description,
            r.Category,
            r.Type,
            r.Level,
            r.Tags
          ].join(' ').toLowerCase();
          if (!text.includes(search)) return false;
        }
        return true;
      });
    }

    // Fisher-Yates shuffle
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
      updateResultsTitle(filtered);
      updateBadges();

      // Group by Category
      const groups = {};
      filtered.forEach(r => {
        const cat = (r.Category || 'Other').split(';')[0].trim() || 'Other';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(r);
      });

      let html = '';
      let hasContent = false;

      // Render in the exact order requested
      categoryOrder.forEach(cat => {
        if (groups[cat] && groups[cat].length > 0) {
          hasContent = true;
          const items = shuffle(groups[cat]);
          html += `<h2 class="group-heading">${cat} (${items.length})</h2>`;
          items.forEach(r => html += renderCard(r));
        }
      });

      // Catch any unexpected categories
      Object.keys(groups).forEach(cat => {
        if (!categoryOrder.includes(cat) && groups[cat].length > 0) {
          hasContent = true;
          const items = shuffle(groups[cat]);
          html += `<h2 class="group-heading">${cat} (${items.length})</h2>`;
          items.forEach(r => html += renderCard(r));
        }
      });

      if (!hasContent) {
        html = '<p>No resources match the current filters.</p>';
      }

      document.getElementById('resourcesContainer').innerHTML = html;
    }

    function updateResultsTitle(filtered) {
      document.getElementById('resultsTitle').textContent =
        `Showing ${filtered.length} online Old English resources`;
    }

    function updateBadges() {
      const mapping = [
        { id: 'filterCategory', badge: 'categoryBadge', text: 'categoryBadgeText' },
        { id: 'filterType', badge: 'typeBadge', text: 'typeBadgeText' },
        { id: 'filterLevel', badge: 'levelBadge', text: 'levelBadgeText' },
        { id: 'searchBox', badge: 'searchBadge', text: 'searchBadgeText' }
      ];

      mapping.forEach(m => {
        const value = document.getElementById(m.id).value.trim();
        const badge = document.getElementById(m.badge);
        if (value) {
          badge.classList.add('active');
          document.getElementById(m.text).textContent = value;
        } else {
          badge.classList.remove('active');
        }
      });
    }

    function clearFilter(id) {
      document.getElementById(id).value = '';
      render();
    }

    function getLogo(typeString) {
      if (!typeString) return 'assets/images/logo.other.png';

      const types = typeString.split(';').map(t => t.trim()).filter(Boolean);
      if (types.length === 0) return 'assets/images/logo.other.png';

      // Randomly pick one of the types for the logo
      const chosen = types[Math.floor(Math.random() * types.length)];
      const filename = logoMap[chosen] || 'logo.other.png';
      return `assets/images/${filename}`;
    }

    function formatMulti(value) {
      if (!value) return '';
      return value.split(';')
        .map(v => v.trim())
        .filter(Boolean)
        .join(' • ');
    }

    function renderCard(r) {
      const logo = getLogo(r.Type);
      const typeText = formatMulti(r.Type);
      const levelText = formatMulti(r.Level);

      let metaLine = '';
      if (typeText || levelText) {
        const parts = [];
        if (typeText) parts.push(typeText);
        if (levelText) parts.push('Level: ' + levelText);
        metaLine = parts.join(' || ');
      }

      return `
        <div class="resource-card">
          <div class="resource-left">
            <img src="${logo}" alt="" class="resource-logo" onerror="this.src='assets/images/logo.other.png'">
          </div>
          <div class="resource-right">
            <h3>${r.Title || 'Untitled'}</h3>
            <div class="resource-description">${r.Description || ''}</div>
            <p class="resource-link">
              <a href="${r.URL}" target="_blank" rel="noopener">→ Go to online resource</a>
            </p>
            ${metaLine ? `<p class="resource-meta">${metaLine}</p>` : ''}
          </div>
        </div>
      `;
    }