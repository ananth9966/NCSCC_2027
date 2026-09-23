function loadPartial(url, targetId) {
  return fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(url + ' returned ' + response.status);
      }
      return response.text();
    })
    .then(html => {
      const target = document.getElementById(targetId);
      if (target) {
        target.innerHTML = html;
      }
      return target;
    })
    .catch(error => {
      console.error('Could not load ' + url, error);
      return null;
    });
}

// '/register', '/register.html' and '/' all reduce to a single comparable key,
// so the active link still resolves on hosts that serve extensionless URLs.
function pageKey(path) {
  const file = path.split('/').pop() || 'index.html';
  return file.replace(/\.html$/i, '').toLowerCase() || 'index';
}

function markActiveLink(nav) {
  const currentPage = pageKey(window.location.pathname);

  nav.querySelectorAll('a[href]').forEach(link => {
    if (pageKey(link.getAttribute('href')) !== currentPage) return;

    link.classList.add('active');

    // A match inside the menu should also highlight the parent nav item.
    const dropdown = link.closest('.nav-dropdown');
    if (dropdown) {
      dropdown.classList.add('active');
    }
  });
}

function setupDropdowns(nav) {
  const dropdowns = Array.from(nav.querySelectorAll('.nav-dropdown'));
  if (!dropdowns.length) return function () {};

  function close(dropdown) {
    dropdown.classList.remove('open');

    const button = dropdown.querySelector('.nav-dropdown-button');
    if (button) {
      button.setAttribute('aria-expanded', 'false');
    }
  }

  function closeAll() {
    dropdowns.forEach(close);
  }

  dropdowns.forEach(dropdown => {
    const button = dropdown.querySelector('.nav-dropdown-button');
    if (!button) return;

    button.addEventListener('click', event => {
      const shouldOpen = !dropdown.classList.contains('open');

      // Keep the document handler below from closing what we just opened.
      event.stopPropagation();

      closeAll();
      dropdown.classList.toggle('open', shouldOpen);
      button.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
    });
  });

  document.addEventListener('click', event => {
    if (!(event.target instanceof Element) || !event.target.closest('.nav-dropdown')) {
      closeAll();
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;

    const openDropdown = dropdowns.find(d => d.classList.contains('open'));
    if (!openDropdown) return;

    close(openDropdown);

    const button = openDropdown.querySelector('.nav-dropdown-button');
    if (button) {
      button.focus();
    }
  });

  return closeAll;
}

function setupNav(header, logo, nav, toggle, closeDropdowns) {
  let isCollapsed = null;

  function checkNavFit() {
    // Measure the nav laid out horizontally, not as a stacked menu.
    header.classList.remove('mobile-nav');

    const availableWidth = header.offsetWidth - logo.offsetWidth - 90;
    const collapsed = nav.scrollWidth > availableWidth;

    header.classList.toggle('mobile-nav', collapsed);

    // Only tear down an open menu when the layout mode actually flips. iOS
    // fires resize whenever the address bar collapses mid-scroll.
    if (collapsed !== isCollapsed) {
      isCollapsed = collapsed;
      nav.classList.remove('active');
      closeDropdowns();

      if (toggle) {
        toggle.setAttribute('aria-expanded', 'false');
      }
    }
  }

  if (toggle) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('active');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

      if (!isOpen) {
        closeDropdowns();
      }
    });
  }

  let pending = null;
  window.addEventListener('resize', () => {
    if (pending) cancelAnimationFrame(pending);
    pending = requestAnimationFrame(checkNavFit);
  });

  checkNavFit();
}

loadPartial('header.html', 'header').then(container => {
  if (!container) return;

  const header = container.querySelector('.site-header');
  const logo = container.querySelector('.logo');
  const nav = container.querySelector('#siteNav');
  const toggle = container.querySelector('#menuToggle');

  if (!header || !logo || !nav) return;

  markActiveLink(nav);
  setupNav(header, logo, nav, toggle, setupDropdowns(nav));
});

loadPartial('footer.html', 'footer');
