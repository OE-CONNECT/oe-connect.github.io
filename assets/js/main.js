/* === NAVBAR INSERTION === */
const navbarElement = document.getElementById('navbar-placeholder');
if (navbarElement) {
  fetch('assets/sections/navbar.html')
    .then(response => response.text())
    .then(data => {
      navbarElement.innerHTML = data;
    })
    .catch(error => {
      console.error('Failed to load navbar:', error);
    });
}

/* === FOOTER INSERTION === */
const footerElement = document.getElementById('footer-placeholder');
if (footerElement) {
  fetch('assets/sections/footer.html')
    .then(response => response.text())
    .then(data => {
      footerElement.innerHTML = data;
    })
    .catch(error => {
      console.error('Failed to load footer:', error);
    });
}
