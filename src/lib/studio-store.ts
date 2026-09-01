import { initialStudioData, type PortfolioItem, type Publication, type Service, type StudioData } from "@/data/site";
import { localized } from "@/lib/i18n";

export const STUDIO_STORAGE_KEY = "ana-styling-studio-data";
const STUDIO_STORAGE_VERSION_KEY = "ana-styling-studio-data-version";
const STUDIO_STORAGE_VERSION = "2026-09-02-preserve-admin-edits-v1";
const LEGACY_DEFAULT_SERVICE_IDS = new Set(["styling-consultation", "wardrobe-edit", "event-dressing", "editorial-direction"]);
const LEGACY_PORTFOLIO_CATEGORY_IDS = new Set(["Personal Styling", "Events", "Closet Edit"]);
const LEGACY_PUBLICATION_IDS = new Set(["publication-placeholder-1", "publication-placeholder-2", "publication-placeholder-3"]);

export function loadStudioData(): StudioData {
  if (typeof window === "undefined") {
    return initialStudioData;
  }

  const saved = window.localStorage.getItem(STUDIO_STORAGE_KEY);

  if (!saved) {
    return initialStudioData;
  }

  try {
    const parsed = JSON.parse(saved) as Partial<StudioData>;
    const hasLegacyServices = parsed.services?.some((service) => LEGACY_DEFAULT_SERVICE_IDS.has(service.id ?? "")) ?? false;
    const hasLegacyPortfolio = parsed.portfolioItems?.some((item) => LEGACY_PORTFOLIO_CATEGORY_IDS.has(item.category ?? "") || item.images?.some((image) => image.url?.includes("images.unsplash.com"))) ?? false;
    const hasLegacyPublications = parsed.publications?.some((publication) => LEGACY_PUBLICATION_IDS.has(publication.id ?? "") || publication.image?.includes("images.unsplash.com")) ?? false;
    const refreshDefaultCopy = hasLegacyServices || hasLegacyPortfolio;
    const data = normalizeStudioData(hasLegacyPublications ? { ...parsed, publications: initialStudioData.publications } : parsed, refreshDefaultCopy);

    if (refreshDefaultCopy || hasLegacyPublications) {
      window.localStorage.setItem(STUDIO_STORAGE_KEY, JSON.stringify(data));
    }

    window.localStorage.setItem(STUDIO_STORAGE_VERSION_KEY, STUDIO_STORAGE_VERSION);

    return data;
  } catch {
    return initialStudioData;
  }
}

export function saveStudioData(data: StudioData) {
  try {
    window.localStorage.setItem(STUDIO_STORAGE_KEY, JSON.stringify(data));
    window.localStorage.setItem(STUDIO_STORAGE_VERSION_KEY, STUDIO_STORAGE_VERSION);
    window.dispatchEvent(new CustomEvent<StudioData>("studio-data-change", { detail: data }));
    return true;
  } catch (error) {
    console.error("Ana Styling could not save studio data.", error);
    return false;
  }
}

function normalizeStudioData(value: Partial<StudioData>, refreshDefaultCopy = false): StudioData {
  return {
    ...initialStudioData,
    ...value,
    siteCopy: { ...initialStudioData.siteCopy, ...value.siteCopy },
    content: refreshDefaultCopy ? initialStudioData.content : {
      homepage: {
        positioning: localized(value.content?.homepage?.positioning ?? initialStudioData.content.homepage.positioning),
        heroNote: localized(value.content?.homepage?.heroNote ?? initialStudioData.content.homepage.heroNote),
        heroImage: value.content?.homepage?.heroImage ?? initialStudioData.content.homepage.heroImage,
      },
      about: {
        headline: localized(value.content?.about?.headline ?? initialStudioData.content.about.headline),
        body: localized(value.content?.about?.body ?? initialStudioData.content.about.body),
        note: localized(value.content?.about?.note ?? initialStudioData.content.about.note),
      },
      contact: {
        headline: localized(value.content?.contact?.headline ?? initialStudioData.content.contact.headline),
        body: localized(value.content?.contact?.body ?? initialStudioData.content.contact.body),
      },
    },
    services: mergeServices(value.services, refreshDefaultCopy),
    portfolioItems: refreshDefaultCopy ? initialStudioData.portfolioItems : mergePortfolioItems(value.portfolioItems),
    publications: mergePublications(value.publications, refreshDefaultCopy),
  };
}

function mergeServices(savedServices?: Partial<Service>[], refreshDefaultCopy = false) {
  const normalizedDefaults = initialStudioData.services.map((fallback, index) => {
    const saved = savedServices?.find((service) => service.id === fallback.id);
    return normalizeService(saved ?? fallback, index, refreshDefaultCopy);
  });
  const customServices = (savedServices ?? []).filter((service) => !initialStudioData.services.some((fallback) => fallback.id === service.id) && !LEGACY_DEFAULT_SERVICE_IDS.has(service.id ?? ""));

  return [...normalizedDefaults, ...customServices.map((service, index) => normalizeService(service, normalizedDefaults.length + index))].map((service, index) => ({ ...service, order: service.order || index + 1 }));
}

function mergePublications(savedPublications?: Partial<Publication>[], refreshDefaultCopy = false) {
  if (savedPublications && !refreshDefaultCopy) {
    return savedPublications.map((publication, index) => normalizePublication(publication, index)).map((publication, index) => ({ ...publication, order: index + 1 }));
  }

  const normalizedDefaults = initialStudioData.publications.map((fallback, index) => {
    const saved = savedPublications?.find((publication) => publication.id === fallback.id);
    return normalizePublication(saved ?? fallback, index, refreshDefaultCopy);
  });
  const customPublications = (savedPublications ?? []).filter((publication) => !initialStudioData.publications.some((fallback) => fallback.id === publication.id));

  return [...normalizedDefaults, ...customPublications.map((publication, index) => normalizePublication(publication, normalizedDefaults.length + index))].map((publication, index) => ({ ...publication, order: publication.order || index + 1 }));
}

function mergePortfolioItems(savedItems?: Partial<PortfolioItem>[], refreshDefaultCopy = false) {
  if (savedItems && !refreshDefaultCopy) {
    return savedItems.map((item, index) => normalizePortfolioItem(item, index)).map((item, index) => ({ ...item, order: index + 1 }));
  }

  const normalizedDefaults = initialStudioData.portfolioItems.map((fallback, index) => {
    const saved = savedItems?.find((item) => item.id === fallback.id);
    return normalizePortfolioItem(saved ?? fallback, index, refreshDefaultCopy);
  });
  const customItems = (savedItems ?? []).filter((item) => !initialStudioData.portfolioItems.some((fallback) => fallback.id === item.id));

  return [...normalizedDefaults, ...customItems.map((item, index) => normalizePortfolioItem(item, normalizedDefaults.length + index))].map((item, index) => ({ ...item, order: item.order || index + 1 }));
}

function normalizeService(service: Partial<Service>, index: number, refreshDefaultCopy = false): Service {
  const fallback = initialStudioData.services[index] ?? initialStudioData.services[0];
  const copySource = refreshDefaultCopy && service.id === fallback.id ? fallback : service;

  return {
    ...fallback,
    ...service,
    title: localized(copySource.title ?? fallback.title),
    eyebrow: localized(copySource.eyebrow ?? fallback.eyebrow),
    description: localized(copySource.description ?? fallback.description),
    deliverables: (copySource.deliverables ?? fallback.deliverables).map(localized),
    group: service.group ?? fallback.group,
    price: copySource.price || fallback.price ? localized(copySource.price ?? fallback.price ?? "") : undefined,
    note: copySource.note || fallback.note ? localized(copySource.note ?? fallback.note ?? "") : undefined,
  };
}

function normalizePortfolioItem(item: Partial<PortfolioItem>, index: number, refreshDefaultCopy = false): PortfolioItem {
  const fallback = initialStudioData.portfolioItems[index] ?? initialStudioData.portfolioItems[0];
  const copySource = refreshDefaultCopy && item.id === fallback.id ? fallback : item;

  return {
    ...fallback,
    ...item,
    title: localized(copySource.title ?? fallback.title),
    description: localized(copySource.description ?? fallback.description),
    images: item.images ?? fallback.images,
  };
}

function normalizePublication(publication: Partial<Publication>, index: number, refreshDefaultCopy = false): Publication {
  const fallback = initialStudioData.publications[index] ?? initialStudioData.publications[0];
  const copySource = refreshDefaultCopy && publication.id === fallback.id ? fallback : publication;

  return {
    ...fallback,
    ...publication,
    title: localized(copySource.title ?? fallback.title),
  };
}
