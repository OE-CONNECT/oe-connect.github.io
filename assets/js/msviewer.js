import Tify from 'https://cdn.jsdelivr.net/npm/tify@0.36.2/dist/tify.js';

const params = new URLSearchParams(window.location.search);
const msId = params.get('ms');
const titleElement = document.getElementById('manuscript-title');

// Fallback values
let manifest = 'https://digitalcollections.universiteitleiden.nl/iiif_manifest/item:4167709/manifest';
let title = 'Leiden, Leiden University Libraries, VLQ 106';

async function loadManuscript() {
  if (!msId) {
    // No ?ms= parameter → use the fallback
    initViewer(manifest, title);
    return;
  }

  titleElement.textContent = 'Loading facsimile…';

  try {
    const response = await fetch('assets/data/mss.csv');
    const csvText = await response.text();

    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const row = results.data.find(r =>
          r['OE-CONNECT ID']?.trim().toUpperCase() === msId.trim().toUpperCase()
        );

        if (row) {
          title = row['SHELFMARK']?.trim() || title;
          manifest = row['IIIF Manifest']?.trim() || manifest;
          initViewer(manifest, title);
        } else {
          titleElement.textContent = `Manuscript “${msId}” not found`;
          console.warn('No matching OE-CONNECT ID found:', msId);
        }
      },
      error: (err) => {
        console.error('CSV parsing error:', err);
        titleElement.textContent = 'Error loading manuscript list';
      }
    });
  } catch (err) {
    console.error('Failed to load CSV:', err);
    titleElement.textContent = 'Error loading manuscript list';
  }
}

function initViewer(manifestUrl, manuscriptTitle) {
  document.getElementById('manuscript-title').textContent = 'Viewing ' + manuscriptTitle;

  new Tify({
    container: '#tify',
    manifestUrl: manifestUrl,
    urlQueryKey: 'tify',
    urlQueryParams: ['pages', 'pan', 'zoom']
  });
}

loadManuscript();