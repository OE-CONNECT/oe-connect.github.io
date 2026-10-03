/* === NAVBAR INSERTION === */
const loadSection = async (placeholderId, url, onLoaded) => {
  const placeholder = document.getElementById(placeholderId);
  if (!placeholder) return;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);

    const html = await response.text();
    placeholder.innerHTML = html;

    if (onLoaded) {
      onLoaded(placeholder);
    }
  } catch (error) {
    console.error(`Failed to load ${placeholderId}:`, error);
  }
};

const applyNavbarOffset = () => {
  const nav = document.querySelector('.main-nav');
  if (!nav) return;

  const navHeight = nav.offsetHeight || 120;
  document.documentElement.style.setProperty('--site-body-top-padding', `${navHeight + 12}px`);
  document.body.classList.add('navbar-loaded');
};

loadSection('navbar-placeholder', 'assets/sections/navbar.html', applyNavbarOffset);

/* === FOOTER INSERTION === */
loadSection('footer-placeholder', 'assets/sections/footer.html');
