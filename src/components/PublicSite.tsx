"use client";

import { type ReactNode, FormEvent, useEffect, useMemo, useState } from "react";
import {
  categoryLabels,
  initialStudioData,
  type Language,
  type PortfolioCategory,
  type PortfolioItem,
  type Publication,
  type Service,
  type ServiceGroup,
  type StudioData,
} from "@/data/site";
import { usePublicStudioData } from "@/hooks/usePublicStudioData";
import { text } from "@/lib/i18n";

type PublicPage = "home" | "services" | "portfolio" | "publications";

const categories: Array<PortfolioCategory | "All"> = ["All", "Cover", "Editorial", "Campaign", "Studio", "Fashion"];
const serviceGroups: ServiceGroup[] = ["Personal Styling", "Commercial Styling"];
const languageKey = "ana-styling-language";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const pageHref = (path: string) => `${basePath}${path}`;
const assetSrc = (src: string) => (src.startsWith("/") ? `${basePath}${src}` : src);
const phoneDigits = (value: string) => value.replace(/\D/g, "");
const contactServiceIds = new Set([
  "event-styling",
  "personal-shopping",
  "photoshoot-styling",
  "style-dna-online",
  "travel-capsule",
  "capsule-wardrobe-online",
  "wardrobe-styling",
  "wardrobe-detox",
  "editorial-fashion-styling",
  "lookbook-styling",
  "brand-campaign-styling",
]);
const defaultSubjects: Record<Language, string> = {
  en: "I'd like to book a styling consultation",
  ru: "Я хочу забронировать стилистическую консультацию",
};

const dictionary = {
  en: {
    nav: ["Home", "About", "Services", "Portfolio", "Publications", "Contact"],
    heroRole: "Personal Stylist — Miami",
    heroTitle: "Elevate Your Style",
    workWithAna: "Work with Ana",
    viewPortfolio: "View Portfolio",
    viewAllServices: "View All Services",
    viewAllPublications: "View All Publications",
    about: "About Me",
    services: "Services",
    servicesTitle: "Personal Styling",
    commercialTitle: "Commercial Styling",
    contactAction: "Contact",
    bookAction: "Book",
    portfolio: "Portfolio",
    fullPortfolio: "Portfolio",
    all: "All",
    viewProject: "View",
    publications: "Publications",
    contact: "Contact",
    contactLinks: "Contact links",
    firstName: "First Name",
    lastName: "Last Name",
    serviceField: "Service",
    selectService: "Select a service",
    message: "Message",
    send: "CONTACT VIA WHATSAPP",
    validation: "Please add your first name, last name, select a service, and write a message before opening WhatsApp.",
    previous: "Previous",
    next: "Next",
    back: "Back",
    close: "Close",
    pricingNote: "Please inquire for pricing. Services can be customized.",
    phone: "Phone:",
    email: "Email:",
    location: "Location:",
    rights: "ALL RIGHTS RESERVED.",
    credit: "DESIGN & DEVELOPMENT — W1ZZYDEV",
  },
  ru: {
    nav: ["Главная", "Обо мне", "Услуги", "Портфолио", "Публикации", "Контакты"],
    heroRole: "Персональный стилист — Майами",
    heroTitle: "Ваш стиль",
    workWithAna: "Работать с Ana",
    viewPortfolio: "Смотреть портфолио",
    viewAllServices: "Смотреть все услуги",
    viewAllPublications: "Все публикации",
    about: "Обо мне",
    services: "Услуги",
    servicesTitle: "Персональный стайлинг",
    commercialTitle: "Коммерческий стайлинг",
    contactAction: "Связаться",
    bookAction: "Записаться",
    portfolio: "Портфолио",
    fullPortfolio: "Портфолио",
    all: "Все",
    viewProject: "Смотреть",
    publications: "Публикации",
    contact: "Контакты",
    contactLinks: "Ссылки для связи",
    firstName: "Имя",
    lastName: "Фамилия",
    serviceField: "Услуга",
    selectService: "Выберите услугу",
    message: "Сообщение",
    send: "СВЯЗАТЬСЯ В WHATSAPP",
    validation: "Укажите имя, фамилию, выберите услугу и напишите сообщение перед открытием WhatsApp.",
    previous: "Назад",
    next: "Вперёд",
    back: "Вернуться",
    close: "Закрыть",
    pricingNote: "Стоимость рассчитывается по запросу. Услуги можно адаптировать под задачу.",
    phone: "Телефон:",
    email: "Почта:",
    location: "Локация:",
    rights: "ВСЕ ПРАВА ЗАЩИЩЕНЫ.",
    credit: "ДИЗАЙН И РАЗРАБОТКА — W1ZZYDEV",
  },
} satisfies Record<Language, Record<string, string | string[]>>;

export function PublicSite({ page = "home" }: { page?: PublicPage }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return "en";
    return window.localStorage.getItem(languageKey) === "ru" ? "ru" : "en";
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [category, setCategory] = useState<PortfolioCategory | "All">("All");
  const [showFullPortfolio, setShowFullPortfolio] = useState(page !== "home");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [selectedPublication, setSelectedPublication] = useState<Publication | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", service: "", message: "" });
  const [formNote, setFormNote] = useState("");
  const [year] = useState(() => new Date().getFullYear());
  const { data, isLoading } = usePublicStudioData();
  const t = dictionary[language];
  const nav = t.nav as string[];
  const studioData = data ?? initialStudioData;

  const visibleServices = useMemo(() => studioData.services.filter((service) => service.published).sort((a, b) => a.order - b.order), [studioData.services]);
  const featuredService = visibleServices.find((service) => service.group === "Personal Styling") ?? visibleServices[0];
  const visiblePortfolio = useMemo(
    () =>
      studioData.portfolioItems
        .filter((item) => item.published)
        .filter((item) => category === "All" || item.category === category)
        .sort((a, b) => a.order - b.order),
    [category, studioData.portfolioItems],
  );
  const visiblePublications = useMemo(() => studioData.publications.filter((publication) => publication.published).sort((a, b) => a.order - b.order), [studioData.publications]);
  const galleryImages = useMemo(
    () => visiblePortfolio.flatMap((item) => item.images.filter((image) => !image.hidden).sort((a, b) => a.order - b.order).map((image) => ({ image, item }))),
    [visiblePortfolio],
  );
  const activeLightbox = lightboxIndex !== null ? galleryImages[lightboxIndex] : null;

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (lightboxIndex === null || !galleryImages.length) return;
      if (event.key === "Escape") setLightboxIndex(null);
      if (event.key === "ArrowRight") setLightboxIndex((current) => (current === null ? current : (current + 1) % galleryImages.length));
      if (event.key === "ArrowLeft") setLightboxIndex((current) => (current === null ? current : (current - 1 + galleryImages.length) % galleryImages.length));
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [galleryImages.length, lightboxIndex]);

  function changeLanguage(next: Language) {
    setLanguage(next);
    window.localStorage.setItem(languageKey, next);
  }

  function navHref(index: number) {
    const ids = ["home", "about", "services", "portfolio", "publications", "contact"];
    if (index === 2) return pageHref("/services/");
    if (index === 3) return pageHref("/portfolio/");
    if (index === 4) return pageHref("/publications/");
    return page === "home" ? `#${ids[index]}` : pageHref(`/#${ids[index]}`);
  }

  function selectService(service: Service) {
    setForm((current) => ({ ...current, service: service.id }));
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  }

  function openGalleryFromProject(item: PortfolioItem) {
    const index = galleryImages.findIndex((entry) => entry.item.id === item.id);
    if (index >= 0) setLightboxIndex(index);
  }

  function handleLightboxTouchEnd(position: number) {
    if (touchStart === null || lightboxIndex === null || !galleryImages.length) return;
    const delta = touchStart - position;
    if (Math.abs(delta) > 45) {
      setLightboxIndex((current) => (current === null ? current : delta > 0 ? (current + 1) % galleryImages.length : (current - 1 + galleryImages.length) % galleryImages.length));
    }
    setTouchStart(null);
  }

  function whatsappMessage() {
    const selectedService = visibleServices.find((service) => service.id === form.service);
    const serviceLabel = selectedService ? text(selectedService.title, language) : defaultSubjects[language];

    if (language === "ru") {
      return [
        "Привет, Ana!",
        "",
        `Меня зовут ${[form.firstName, form.lastName].map((value) => value.trim()).filter(Boolean).join(" ")}.`,
        `Меня интересует: ${serviceLabel}`,
        "",
        "Сообщение:",
        form.message,
      ].filter((line) => line !== "").join("\n");
    }

    return [
      "Hi Ana!",
      "",
      `My name is ${[form.firstName, form.lastName].map((value) => value.trim()).filter(Boolean).join(" ")}.`,
      `I'm interested in: ${serviceLabel}`,
      "",
      "Message:",
      form.message,
    ].filter((line) => line !== "").join("\n");
  }

  function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.service || !form.message.trim()) {
      setFormNote(t.validation as string);
      return;
    }
    setFormNote("");
    window.open(`https://wa.me/${phoneDigits(studioData.content.contact.whatsappNumber)}?text=${encodeURIComponent(whatsappMessage())}`, "_blank", "noopener,noreferrer");
  }

  if (!data) {
    return (
      <main className="public-site">
        <SiteHeader changeLanguage={changeLanguage} language={language} menuOpen={menuOpen} nav={nav} navHref={navHref} setMenuOpen={setMenuOpen} />
        <section className="public-loading" aria-busy={isLoading}>
          <p>ANA STYLING</p>
        </section>
      </main>
    );
  }

  return (
    <main className="public-site">
      <SiteHeader nav={nav} navHref={navHref} language={language} changeLanguage={changeLanguage} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      {page === "home" && (
        <>
          <Hero language={language} t={t} data={studioData} />
          <About language={language} t={t} data={studioData} />
          {featuredService && <ServicesPreview labels={t} language={language} service={featuredService} onContact={selectService} />}
          <PortfolioSection
            category={category}
            galleryImages={galleryImages}
            language={language}
            setCategory={setCategory}
            setLightboxIndex={setLightboxIndex}
            setShowFullPortfolio={setShowFullPortfolio}
            showFullPortfolio={showFullPortfolio}
            t={t}
            visiblePortfolio={visiblePortfolio}
            openGalleryFromProject={openGalleryFromProject}
          />
          <PublicationsPreview language={language} publications={visiblePublications.slice(0, 2)} t={t} onOpen={setSelectedPublication} />
        </>
      )}
      {page === "services" && (
        <section id="services" className="fashion-services full-page-section">
          <div className="services-intro reveal">
            <p className="eyebrow">{t.services as string}</p>
            <h2>{t.services as string}</h2>
          </div>
          {serviceGroups.map((group) => (
            <ServiceSection group={group} key={group} language={language} labels={t} onContact={selectService} services={visibleServices.filter((service) => service.group === group)} />
          ))}
        </section>
      )}
      {page === "portfolio" && (
        <PortfolioSection
          category={category}
          galleryImages={galleryImages}
          isFullPage
          language={language}
          setCategory={setCategory}
          setLightboxIndex={setLightboxIndex}
          setShowFullPortfolio={setShowFullPortfolio}
          showFullPortfolio
          t={t}
          visiblePortfolio={visiblePortfolio}
          openGalleryFromProject={openGalleryFromProject}
        />
      )}
      {page === "publications" && (
        <section id="publications" className="publications-section full-page-section">
          <div className="portfolio-title-row reveal">
            <div>
              <p className="eyebrow">{t.publications as string}</p>
              <h2>{t.publications as string}</h2>
            </div>
          </div>
          <div className="publication-grid">
            {visiblePublications.map((publication) => (
              <button key={publication.id} type="button" onClick={() => setSelectedPublication(publication)}>
                <PublicationCover publication={publication} language={language} />
              </button>
            ))}
          </div>
        </section>
      )}
      {page !== "publications" && page !== "portfolio" && <Contact form={form} formNote={formNote} language={language} services={visibleServices} setForm={setForm} submitContact={submitContact} t={t} data={studioData} />}
      <Footer data={studioData} language={language} nav={nav} navHref={navHref} t={t} year={year} />
      <Overlays
        activeLightbox={activeLightbox}
        galleryImagesLength={galleryImages.length}
        language={language}
        selectedPublication={selectedPublication}
        setLightboxIndex={setLightboxIndex}
        setSelectedPublication={setSelectedPublication}
        setTouchStart={setTouchStart}
        t={t}
        touchStart={touchStart}
        onTouchEnd={handleLightboxTouchEnd}
      />
    </main>
  );
}

function SiteHeader({ changeLanguage, language, menuOpen, nav, navHref, setMenuOpen }: { changeLanguage: (language: Language) => void; language: Language; menuOpen: boolean; nav: string[]; navHref: (index: number) => string; setMenuOpen: (value: boolean | ((open: boolean) => boolean)) => void }) {
  return (
    <header className="lux-header" aria-label={language === "en" ? "Main navigation" : "Основная навигация"}>
      <a className="lux-brand" href={navHref(0)} onClick={() => setMenuOpen(false)}>ANA STYLING</a>
      <div className="mobile-top-controls">
        <LanguageSwitcher language={language} onChange={changeLanguage} />
        <button className="menu-button" type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label={language === "en" ? "Toggle menu" : "Открыть меню"}>
          <span />
          <span />
        </button>
      </div>
      <nav className={menuOpen ? "lux-nav open" : "lux-nav"}>
        {nav.map((item, index) => <a key={item} href={navHref(index)} onClick={() => setMenuOpen(false)}>{item}</a>)}
        <LanguageSwitcher language={language} onChange={changeLanguage} />
      </nav>
    </header>
  );
}

function Hero({ data, language, t }: { data: StudioData; language: Language; t: Record<string, string | string[]> }) {
  return (
    <section id="home" className="campaign-hero">
      <div className="hero-cover-word hero-cover-word-back">{t.heroTitle as string}</div>
      <figure className="campaign-image reveal">
        <img loading="eager" src={assetSrc(data.content.homepage.heroImage)} alt={language === "en" ? "Ana Styling hero editorial" : "Главное фото Ana Styling"} />
      </figure>
      <div className="campaign-copy reveal">
        <p className="eyebrow">{t.heroRole as string}</p>
        <p>{text(data.content.homepage.positioning, language)}</p>
        <div className="cta-row">
          <StylistButton href="#contact">{t.workWithAna as string}</StylistButton>
          <a className="text-link" href={pageHref("/portfolio/")}>{t.viewPortfolio as string} →</a>
        </div>
      </div>
    </section>
  );
}

function About({ data, language, t }: { data: StudioData; language: Language; t: Record<string, string | string[]> }) {
  const aboutParagraphs = text(data.content.about.body, language).split("\n\n").filter(Boolean);
  const intro = aboutParagraphs.slice(0, 2).join(" ");
  const bodyParagraphs = aboutParagraphs.slice(2);

  return (
    <section id="about" className="editorial-about">
      <div className="about-statement reveal">
        <p className="eyebrow">{t.about as string}</p>
        <h1>{text(data.content.about.headline, language)}</h1>
      </div>
      <div className="about-photo-stack reveal">
        <img loading="lazy" src={assetSrc("/ana-photos/about-ana.jpg")} alt={language === "en" ? "Portrait of Anastasia" : "Портрет Анастасии"} />
      </div>
      <div className="about-body reveal">
        {intro && <p className="about-intro">{intro}</p>}
        {bodyParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
    </section>
  );
}

function ServicesPreview({ labels, language, onContact, service }: { labels: Record<string, string | string[]>; language: Language; onContact: (service: Service) => void; service: Service }) {
  return (
    <section id="services" className="fashion-services services-preview-section">
      <div className="services-intro reveal">
        <p className="eyebrow">{labels.services as string}</p>
        <h2>{labels.services as string}</h2>
      </div>
      <article className="featured-service reveal">
        <figure><img loading="lazy" src={assetSrc(service.image)} alt="" /></figure>
        <div>
          <span>01</span>
          <h3>{text(service.title, language)}</h3>
          <p>{text(service.description, language)}</p>
          {service.price && <strong>{text(service.price, language)}</strong>}
          <button type="button" onClick={() => onContact(service)}>{labels.bookAction as string} →</button>
        </div>
      </article>
      <a className="section-link" href={pageHref("/services/")}>{labels.viewAllServices as string} →</a>
    </section>
  );
}

function ServiceSection({ group, labels, language, onContact, services }: { group: ServiceGroup; labels: Record<string, string | string[]>; language: Language; onContact: (service: Service) => void; services: Service[] }) {
  if (!services.length) return null;
  const title = group === "Personal Styling" ? labels.servicesTitle : labels.commercialTitle;

  return (
    <section className="service-group" aria-label={title as string}>
      <h3>{title as string}</h3>
      <div className="services-runway">
        {services.map((service, index) => (
          <article className="runway-service reveal" key={service.id}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <figure><img loading="lazy" src={assetSrc(service.image)} alt="" /></figure>
            <div>
              <h4>{text(service.title, language)}</h4>
              <p>{text(service.description, language)}</p>
              {service.price && <strong>{text(service.price, language)}</strong>}
              {service.note && <em>{text(service.note, language)}</em>}
              <button type="button" onClick={() => onContact(service)}>{labels.contactAction as string} →</button>
            </div>
          </article>
        ))}
      </div>
      {group === "Commercial Styling" && <p className="pricing-note">{labels.pricingNote as string}</p>}
    </section>
  );
}

function PortfolioSection(props: {
  category: PortfolioCategory | "All";
  galleryImages: Array<{ image: PortfolioItem["images"][number]; item: PortfolioItem }>;
  isFullPage?: boolean;
  language: Language;
  openGalleryFromProject: (item: PortfolioItem) => void;
  setCategory: (category: PortfolioCategory | "All") => void;
  setLightboxIndex: (index: number) => void;
  setShowFullPortfolio: (value: boolean) => void;
  showFullPortfolio: boolean;
  t: Record<string, string | string[]>;
  visiblePortfolio: PortfolioItem[];
}) {
  return (
    <section id="portfolio" className={props.isFullPage ? "fashion-portfolio full-page-section" : "fashion-portfolio"}>
      <div className="portfolio-title-row reveal">
        <div>
          <p className="eyebrow">{props.t.portfolio as string}</p>
          <h2>{props.t.portfolio as string}</h2>
        </div>
      </div>
      {!props.showFullPortfolio && (
        <div className="portfolio-preview reveal">
          {props.visiblePortfolio.slice(0, 2).map((item) => {
            const cover = getCoverImage(item);
            return cover && <button key={item.id} type="button" onClick={() => props.openGalleryFromProject(item)}><img loading="lazy" src={assetSrc(cover.url)} alt={cover.alt || text(item.title, props.language)} /></button>;
          })}
          <a className="portfolio-open" href={pageHref("/portfolio/")}>{props.t.viewPortfolio as string} →</a>
        </div>
      )}
      {props.showFullPortfolio && (
        <>
          <div className="filters reveal" aria-label={props.language === "en" ? "Portfolio categories" : "Категории портфолио"}>
            {categories.map((item) => (
              <button className={props.category === item ? "active" : ""} key={item} type="button" onClick={() => props.setCategory(item)}>
                {item === "All" ? props.t.all as string : text(categoryLabels[item], props.language)}
              </button>
            ))}
          </div>
          <div className="portfolio-grid safe-editorial-grid">
            {props.galleryImages.map(({ image, item }, index) => (
              <button className="portfolio-tile reveal" key={`${item.id}-${image.id}`} type="button" onClick={() => props.setLightboxIndex(index)}>
                <img loading="lazy" src={assetSrc(image.url)} alt={image.alt || text(item.title, props.language)} />
                <div className="portfolio-overlay">
                  <span>{text(categoryLabels[item.category], props.language)}</span>
                  <h3>{text(item.title, props.language)}</h3>
                  <small>{props.t.viewProject as string} →</small>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function PublicationsPreview({ language, onOpen, publications, t }: { language: Language; onOpen: (publication: Publication) => void; publications: Publication[]; t: Record<string, string | string[]> }) {
  return (
    <section id="publications" className="publications-section">
      <div className="portfolio-title-row reveal">
        <div>
          <p className="eyebrow">{t.publications as string}</p>
          <h2>{t.publications as string}</h2>
        </div>
      </div>
      <div className="publication-preview">
        {publications.map((publication) => (
          <button key={publication.id} type="button" onClick={() => onOpen(publication)}>
            <PublicationCover publication={publication} language={language} />
          </button>
        ))}
        <a className="section-link" href={pageHref("/publications/")}>{t.viewAllPublications as string} →</a>
      </div>
    </section>
  );
}

function Contact({ data, form, formNote, language, services, setForm, submitContact, t }: { data: StudioData; form: { firstName: string; lastName: string; service: string; message: string }; formNote: string; language: Language; services: Service[]; setForm: (form: { firstName: string; lastName: string; service: string; message: string }) => void; submitContact: (event: FormEvent<HTMLFormElement>) => void; t: Record<string, string | string[]> }) {
  const serviceOptions = services.filter((service) => contactServiceIds.has(service.id));

  return (
    <section id="contact" className="fashion-contact">
      <figure className="contact-image reveal">
        <img loading="lazy" src={assetSrc("/ana-photos/about-ana.jpg")} alt={language === "en" ? "Portrait of Anastasia" : "Портрет Анастасии"} />
      </figure>
      <div className="contact-copy reveal">
        <p className="eyebrow">{t.contact as string}</p>
        <h2>{text(data.content.contact.headline, language)}</h2>
        <p>{text(data.content.contact.body, language)}</p>
        <div className="contact-socials" aria-label={t.contactLinks as string}>
          <span>{language === "en" ? "Miami" : "Майами"}</span>
          <SocialLink kind="instagram" href={data.content.contact.instagramUrl} label="@aleynikovaa" />
          <SocialLink kind="whatsapp" href={`https://wa.me/${phoneDigits(data.content.contact.whatsappNumber)}`} label="WhatsApp" />
        </div>
      </div>
      <form className="contact-form reveal" onSubmit={submitContact} noValidate>
        <label>{t.firstName as string}<input autoComplete="given-name" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></label>
        <label>{t.lastName as string}<input autoComplete="family-name" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></label>
        <label>{t.serviceField as string}<select value={form.service} onChange={(event) => setForm({ ...form, service: event.target.value })}><option value="">{t.selectService as string}</option>{serviceOptions.map((service) => <option key={service.id} value={service.id}>{text(service.title, language)}</option>)}</select></label>
        <label>{t.message as string}<textarea rows={5} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} /></label>
        {formNote && <p className="form-note" role="status">{formNote}</p>}
        <StylistButton asButton>{t.send as string}</StylistButton>
      </form>
    </section>
  );
}

function Footer({ data, language, nav, navHref, t, year }: { data: StudioData; language: Language; nav: string[]; navHref: (index: number) => string; t: Record<string, string | string[]>; year: number }) {
  return (
    <footer className="lux-footer">
      <p className="footer-marquee" aria-hidden="true">ANA STYLING</p>
      <div><strong>ANA STYLING</strong><span>MIAMI</span></div>
      <nav>
        <a href={navHref(1)}>{nav[1]}</a>
        <a href={navHref(2)}>{nav[2]}</a>
        <a href={navHref(3)}>{nav[3]}</a>
        <a href={navHref(4)}>{nav[4]}</a>
        <a href={navHref(5)}>{nav[5]}</a>
        <SocialLink kind="instagram" href={data.content.contact.instagramUrl} label="@aleynikovaa" compact />
        <SocialLink kind="whatsapp" href={`https://wa.me/${phoneDigits(data.content.contact.whatsappNumber)}`} label="WhatsApp" compact />
      </nav>
      <div className="footer-contact">
        <span>{t.phone as string} <a href={`tel:+${phoneDigits(data.content.contact.whatsappNumber)}`}>{data.content.contact.whatsappNumber}</a></span>
        <span>{t.email as string} <a href={`mailto:${data.content.contact.email}`}>{data.content.contact.email}</a></span>
        <span>{t.location as string} {language === "en" ? "Miami, Florida" : "Майами, Флорида"}</span>
      </div>
      <small>© {year} ANA STYLING. {t.rights as string}</small>
      <small><a className="developer-credit" href="https://w1zzydev.com" target="_blank" rel="noopener noreferrer">{t.credit as string} →</a></small>
    </footer>
  );
}

function Overlays({ activeLightbox, galleryImagesLength, language, onTouchEnd, selectedPublication, setLightboxIndex, setSelectedPublication, setTouchStart, t }: {
  activeLightbox: { image: PortfolioItem["images"][number]; item: PortfolioItem } | null;
  galleryImagesLength: number;
  language: Language;
  onTouchEnd: (position: number) => void;
  selectedPublication: Publication | null;
  setLightboxIndex: (value: number | null | ((current: number | null) => number | null)) => void;
  setSelectedPublication: (publication: Publication | null) => void;
  setTouchStart: (value: number | null) => void;
  t: Record<string, string | string[]>;
  touchStart: number | null;
}) {
  return (
    <>
      {activeLightbox && (
        <div className="image-lightbox" role="dialog" aria-modal="true" aria-label={text(activeLightbox.item.title, language)} onTouchStart={(event) => setTouchStart(event.changedTouches[0].clientX)} onTouchEnd={(event) => onTouchEnd(event.changedTouches[0].clientX)}>
          <button className="close" type="button" onClick={() => setLightboxIndex(null)}>× {t.close as string}</button>
          <button className="lightbox-nav previous" type="button" aria-label={t.previous as string} onClick={() => setLightboxIndex((current) => (current === null ? current : (current - 1 + galleryImagesLength) % galleryImagesLength))}>←</button>
          <figure>
            <img src={assetSrc(activeLightbox.image.url)} alt={activeLightbox.image.alt || text(activeLightbox.item.title, language)} />
            <figcaption>{text(activeLightbox.item.title, language)}</figcaption>
          </figure>
          <button className="lightbox-nav next" type="button" aria-label={t.next as string} onClick={() => setLightboxIndex((current) => (current === null ? current : (current + 1) % galleryImagesLength))}>→</button>
        </div>
      )}
      {selectedPublication && (
        <div className="image-lightbox" role="dialog" aria-modal="true" aria-label={text(selectedPublication.title, language)}>
          <button className="close" type="button" onClick={() => setSelectedPublication(null)}>× {t.close as string}</button>
          <figure>
            <img src={assetSrc(selectedPublication.image)} alt={text(selectedPublication.title, language)} />
            <figcaption>{text(selectedPublication.title, language)}</figcaption>
          </figure>
        </div>
      )}
    </>
  );
}

function PublicationCover({ language, publication }: { language: Language; publication: Publication }) {
  return (
    <article className="publication-cover">
      <img loading="lazy" src={assetSrc(publication.image)} alt={text(publication.title, language)} />
      <h3>{text(publication.title, language)}</h3>
    </article>
  );
}

function StylistButton(props: { children: ReactNode; href?: string; asButton?: boolean }) {
  if (props.asButton) {
    return <button className="stylist-cta whatsapp-cta" type="submit"><span>{props.children}</span><b aria-hidden="true">→</b></button>;
  }

  return <a className="stylist-cta" href={props.href}><span>{props.children}</span><b aria-hidden="true">→</b></a>;
}

function LanguageSwitcher({ language, onChange }: { language: Language; onChange: (language: Language) => void }) {
  return (
    <div className="language-switcher" aria-label={language === "en" ? "Language switcher" : "Переключатель языка"}>
      {(["en", "ru"] as Language[]).map((item) => (
        <button className={language === item ? "active" : ""} key={item} type="button" onClick={() => onChange(item)}>{item.toUpperCase()}</button>
      ))}
    </div>
  );
}

function SocialLink({ compact, href, kind, label }: { compact?: boolean; href: string; kind: "instagram" | "whatsapp"; label: string }) {
  return (
    <a className={compact ? "social-button compact" : "social-button"} href={href} target="_blank" rel="noreferrer" aria-label={label}>
      {kind === "instagram" ? <InstagramIcon /> : <WhatsAppIcon />}
      <span>{label}</span>
    </a>
  );
}

function InstagramIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect x="4.2" y="4.2" width="15.6" height="15.6" rx="4.3" />
      <circle cx="12" cy="12" r="3.35" />
      <circle cx="16.8" cy="7.2" r="0.75" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5.2 19.1l1-3.55A7.55 7.55 0 1 1 9.4 18.4z" />
      <path d="M9.15 8.25c.18-.42.36-.44.64-.44h.48c.16 0 .38.06.58.48.22.5.72 1.76.78 1.88.06.14.1.3.02.48-.08.16-.14.26-.28.42-.14.16-.3.36-.42.48-.14.14-.28.3-.12.56.16.28.7 1.14 1.5 1.84 1.02.9 1.9 1.18 2.18 1.32.28.14.44.12.6-.08.18-.2.7-.82.88-1.1.18-.28.38-.24.64-.14.28.1 1.72.82 2.02.96.3.16.5.22.58.34.08.12.08.68-.16 1.34-.24.66-1.38 1.26-1.92 1.3-.5.04-1.14.18-3.72-.86-3.14-1.28-5.12-4.48-5.28-4.7-.16-.22-1.26-1.68-1.26-3.2 0-1.54.8-2.28 1.08-2.6.28-.3.6-.38.8-.38z" />
    </svg>
  );
}

function getCoverImage(item: PortfolioItem) {
  const visibleImages = item.images.filter((image) => !image.hidden).sort((a, b) => a.order - b.order);
  return visibleImages.find((image) => image.isCover) ?? visibleImages[0] ?? null;
}
