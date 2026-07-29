const WHATSAPP_NUMBER = '908503032485';

function closeModal(modal) {
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

function initializeNavigation() {
  const header = document.querySelector('.site-header');
  const menuToggle = document.querySelector('.menu-toggle');

  if (!header || !menuToggle) {
    return;
  }

  menuToggle.addEventListener('click', () => {
    const isOpen = header.classList.toggle('nav-open');
    menuToggle.classList.toggle('open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  document.querySelectorAll('.nav-links a').forEach((link) => {
    link.addEventListener('click', () => {
      header.classList.remove('nav-open');
      menuToggle.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function initializeModals() {
  document.querySelectorAll('[data-open-modal]').forEach((button) => {
    button.addEventListener('click', (event) => {
      const modal = document.getElementById(button.dataset.openModal);

      if (!modal) {
        return;
      }

      event.preventDefault();
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  document.querySelectorAll('.modal-overlay').forEach((modal) => {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeModal(modal);
      }
    });

    const closeButton = modal.querySelector('[data-close-modal]');
    closeButton?.addEventListener('click', () => closeModal(modal));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') {
      return;
    }

    document.querySelectorAll('.modal-overlay.open').forEach(closeModal);
  });
}

function initializeRevealAnimations() {
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    return;
  }

  const revealTargets = document.querySelectorAll(
    '.feature-card, .step-card, .scenario-card'
  );

  if (!revealTargets.length) {
    return;
  }

  document.body.classList.add('anim-ready');

  revealTargets.forEach((element, index) => {
    element.classList.add('reveal');
    element.style.transitionDelay = `${(index % 4) * 90}ms`;
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const element = entry.target;
        element.classList.add('in-view');
        observer.unobserve(element);

        // Remove reveal styles after the animation so hover effects stay responsive.
        window.setTimeout(() => {
          element.classList.remove('reveal', 'in-view');
          element.style.transitionDelay = '';
        }, 1000);
      });
    },
    { threshold: 0.15 }
  );

  revealTargets.forEach((element) => observer.observe(element));
}

function initializeWhatsAppForms() {
  document
    .querySelectorAll('#contact-form, #modal-contact-form')
    .forEach((form) => {
      form.addEventListener('submit', (event) => {
        event.preventDefault();

        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }

        const fullName = form.querySelector('[name="full-name"]').value.trim();
        const phoneNumber = form.querySelector('[name="phone"]').value.trim();
        const message = form.querySelector('[name="message"]').value.trim();
        const messageLines = [
          'Merhaba, VeliGeldi web sitesinden yazıyorum.',
          `Ad Soyad: ${fullName}`,
          phoneNumber ? `Telefon: ${phoneNumber}` : null,
          `Mesaj: ${message}`
        ].filter(Boolean);
        const whatsappUrl =
          `https://wa.me/${WHATSAPP_NUMBER}?text=` +
          encodeURIComponent(messageLines.join('\n'));

        window.open(whatsappUrl, '_blank', 'noopener');

        const successBoxId =
          form.id === 'modal-contact-form'
            ? 'modal-form-success'
            : 'form-success';
        const successBox = document.getElementById(successBoxId);

        if (successBox) {
          successBox.classList.add('show');
          successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        form.reset();
      });
    });
}

function initializeMap() {
  const mapButton = document.getElementById('map-load-btn');

  if (!mapButton) {
    return;
  }

  mapButton.addEventListener('click', () => {
    const mapFrame = document.createElement('iframe');
    mapFrame.src =
      'https://www.google.com/maps?q=Pancarl%C4%B1%2C%20Y%C3%BCksel%20%C4%B0yi%20K%C3%B6%C5%9Fker%20Sk.%20Ahmet%20Ta%C5%9Far%20Apt%20D%3A20%2FB%2C%2027410%20%C5%9Eehitkamil%2FGaziantep&output=embed';
    mapFrame.loading = 'lazy';
    mapFrame.referrerPolicy = 'no-referrer-when-downgrade';
    mapFrame.title = 'VeliGeldi Konum';
    mapButton.replaceWith(mapFrame);
  });
}

function initializeDownloadFeedback() {
  const downloadStatus = document.getElementById('download-status');

  document
    .querySelectorAll('[data-download-unavailable]')
    .forEach((button) => {
      button.addEventListener('click', () => {
        if (downloadStatus) {
          downloadStatus.style.display = 'block';
        }
      });
    });
}

document.addEventListener('DOMContentLoaded', () => {
  initializeNavigation();
  initializeModals();
  initializeRevealAnimations();
  initializeWhatsAppForms();
  initializeMap();
  initializeDownloadFeedback();
});
