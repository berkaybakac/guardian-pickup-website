const organizationDescription =
  'VeliGeldi; anaokulu, kreş, etüt ve kurs merkezlerinde öğrenci teslim sürecini daha düzenli, hızlı ve dijital hale getiren bir sistemdir.';

export const site = Object.freeze({
  name: 'VeliGeldi',
  origin: 'https://veligeldi.com',
  locale: 'tr_TR',
  language: 'tr',
  organizationDescription,
  socialImagePath: '/img/veligeldi-logo-mark.png'
});

export const company = Object.freeze({
  phoneDisplay: '0850 303 24 85',
  phoneHref: '+908503032485',
  whatsappNumber: '908503032485',
  email: 'adnan@stabilteknoloji.com',
  instagramUrl: 'https://www.instagram.com/stabilteknoloji/',
  workingHours: 'Hafta içi 09:00 - 18:00',
  address: Object.freeze({
    full:
      'Pancarlı, Yüksel İyi Köşker Sk. Ahmet Taşar Apt D:20/B, 27410 Şehitkamil/Gaziantep',
    street: 'Pancarlı, Yüksel İyi Köşker Sk. Ahmet Taşar Apt D:20/B',
    locality: 'Şehitkamil',
    region: 'Gaziantep',
    postalCode: '27410',
    country: 'TR'
  })
});

export const pages = Object.freeze([
  Object.freeze({
    file: 'index.html',
    route: '/',
    title: 'VeliGeldi | Anaokulu Öğrenci Teslim Sistemi',
    description: organizationDescription,
    sitemapPriority: '1.0',
    activeNavigation: 'home',
    includeModal: true,
    checkProductClaims: true
  }),
  Object.freeze({
    file: 'product.html',
    route: '/urun',
    title: 'Ürün Hakkında | VeliGeldi',
    description:
      'VeliGeldi giriş terminalinin T.C. kimlik numarası, telefon ve kimlik kartı barkoduyla çalışan hızlı bildirim akışını keşfedin.',
    sitemapPriority: '0.8',
    activeNavigation: 'product',
    includeModal: true,
    checkProductClaims: true
  }),
  Object.freeze({
    file: 'pricing.html',
    route: '/fiyatlar',
    title: 'Paketler ve Fiyat | VeliGeldi',
    description:
      'VeliGeldi giriş terminalini, kontörlü ve ömür boyu kullanım seçeneklerini inceleyin; okulunuza özel fiyat teklifi alın.',
    sitemapPriority: '0.8',
    activeNavigation: 'pricing',
    includeModal: true,
    checkProductClaims: true
  }),
  Object.freeze({
    file: 'contact.html',
    route: '/iletisim',
    title: 'İletişim | VeliGeldi',
    description:
      'VeliGeldi ekibiyle iletişime geçin, fiyat teklifi alın veya sorularınızı iletin.',
    sitemapPriority: '0.7',
    activeNavigation: 'contact',
    includeModal: true,
    usePrefixedModalIds: true,
    checkProductClaims: true
  }),
  Object.freeze({
    file: 'privacy.html',
    route: '/gizlilik',
    title: 'Gizlilik Bilgilendirmesi | VeliGeldi',
    description:
      'VeliGeldi web sitesi iletişim formu ve üçüncü taraf hizmetleri hakkında gizlilik bilgilendirmesi.',
    sitemapPriority: '0.3',
    activeNavigation: null,
    includeModal: false,
    checkProductClaims: false
  }),
  Object.freeze({
    file: 'download.html',
    route: '/indir',
    title: 'İndir | VeliGeldi',
    description: 'VeliGeldi uygulama indirme sayfası.',
    robots: 'noindex, nofollow',
    activeNavigation: null,
    includeModal: true,
    useModalHeaderLinks: true,
    checkProductClaims: false
  })
]);

export function getCanonicalUrl(route) {
  return route === '/' ? `${site.origin}/` : `${site.origin}${route}`;
}

export function getMapEmbedUrl() {
  const query = encodeURIComponent(company.address.full);
  return `https://www.google.com/maps?q=${query}&output=embed`;
}
