"use client";

import { ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  type Language,
  type LocalizedString,
  type PortfolioCategory,
  type PortfolioImage,
  type PortfolioImageSize,
  type PortfolioItem,
  type Publication,
  type Service,
  type ServiceGroup,
} from "@/data/site";
import { useStudioData } from "@/hooks/useStudioData";
import { localized, text } from "@/lib/i18n";
import { getAdminSession, isCurrentUserStudioAdmin, isSupabaseConfigured, signInAdmin, signOutAdmin, uploadStudioImage } from "@/lib/supabase-studio";

type View = "Dashboard" | "Home" | "About" | "Services" | "Service Editor" | "Portfolio" | "Editor" | "Publications" | "Publication Editor" | "Contact";
type ConfirmAction = { title: string; body: string; action: () => void } | null;

const categories: PortfolioCategory[] = ["Cover", "Editorial", "Campaign", "Studio", "Fashion"];
const imageSizes: PortfolioImageSize[] = ["Small", "Medium", "Large"];
const serviceGroups: ServiceGroup[] = ["Personal Styling", "Commercial Styling"];
const placeholderImage = "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=600&q=80";
const adminLanguages: Language[] = ["en", "ru"];
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const pageHref = (path: string) => `${basePath}${path}`;
const assetSrc = (src: string) => (src.startsWith("/") ? `${basePath}${src}` : src);
const ADMIN_SESSION_KEY = "ana-styling-admin-session";

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function fileToDataUrl(file: File) {
  if (!file.type.startsWith("image/")) {
    return readFileAsDataUrl(file);
  }

  const sourceUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.src = sourceUrl;
    await image.decode();

    const maxSide = 1200;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      return readFileAsDataUrl(file);
    }

    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.78);
  } catch {
    return readFileAsDataUrl(file);
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

async function fileToStudioUrl(file: File, folder: string) {
  if (isSupabaseConfigured) {
    const remoteUrl = await uploadStudioImage(file, folder);
    if (remoteUrl) return remoteUrl;
  }

  return fileToDataUrl(file);
}

function AdminLogin({ onUnlock }: { onUnlock: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isSupabaseConfigured) {
      setError("Supabase is not configured yet.");
      return;
    }

    const result = await signInAdmin(email.trim(), password);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    window.sessionStorage.setItem(ADMIN_SESSION_KEY, "unlocked");
    setError("");
    onUnlock();
  }

  return (
    <main className="admin-login-shell">
      <form className="admin-login-card" onSubmit={submitPassword}>
        <p className="eyebrow">ANA STYLING</p>
        <h1>Private Studio</h1>
        <p>Sign in to manage portfolio, services, publications, and site text.</p>
        <label>
          Email
          <input autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          Password
          <input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error && <p className="admin-login-error" role="alert">{error}</p>}
        <button className="button primary" type="submit">Enter Studio</button>
        <a href={pageHref("/")}>Back to website</a>
      </form>
    </main>
  );
}

export function AdminApp() {
  const [isUnlocked, setIsUnlocked] = useState(() => (typeof window === "undefined" || isSupabaseConfigured ? false : window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "unlocked"));
  const { data, hasUnsavedChanges, retrySave, saveChanges, saveError, saveStatus, updateData } = useStudioData();
  const [active, setActive] = useState<View>("Dashboard");
  const [editingId, setEditingId] = useState<string | null>(data.portfolioItems[0]?.id ?? null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(data.services[0]?.id ?? null);
  const [editingPublicationId, setEditingPublicationId] = useState<string | null>(data.publications[0]?.id ?? null);
  const [selectedPhoto, setSelectedPhoto] = useState<{ itemId: string; imageId: string } | null>(null);
  const [mode, setMode] = useState<"Edit" | "Preview">("Edit");
  const [contentLanguage, setContentLanguage] = useState<Language>("en");
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [undoPhoto, setUndoPhoto] = useState<{ itemId: string; image: PortfolioImage } | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const items = useMemo(() => [...data.portfolioItems].sort((a, b) => a.order - b.order), [data.portfolioItems]);
  const editingItem = useMemo(() => data.portfolioItems.find((item) => item.id === editingId) ?? null, [data.portfolioItems, editingId]);
  const editingService = useMemo(() => data.services.find((service) => service.id === editingServiceId) ?? null, [data.services, editingServiceId]);
  const editingPublication = useMemo(() => data.publications.find((publication) => publication.id === editingPublicationId) ?? null, [data.publications, editingPublicationId]);
  const publications = useMemo(() => [...data.publications].sort((a, b) => a.order - b.order), [data.publications]);
  const services = useMemo(() => [...data.services].sort((a, b) => a.order - b.order), [data.services]);
  const portfolioPhotos = useMemo(
    () => items.flatMap((item) => [...item.images].sort((a, b) => a.order - b.order).map((image) => ({ item, image }))),
    [items],
  );
  const selectedPhotoData = useMemo(
    () => portfolioPhotos.find(({ item, image }) => item.id === selectedPhoto?.itemId && image.id === selectedPhoto?.imageId) ?? null,
    [portfolioPhotos, selectedPhoto],
  );

  useEffect(() => {
    let isMounted = true;

    async function unlockFromSupabaseSession() {
      if (!isSupabaseConfigured) return;
      const session = await getAdminSession();
      const isAdmin = session ? await isCurrentUserStudioAdmin() : false;

      if (session && isAdmin && isMounted) {
        window.sessionStorage.setItem(ADMIN_SESSION_KEY, "unlocked");
        setIsUnlocked(true);
      }
    }

    unlockFromSupabaseSession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isUnlocked) {
    return <AdminLogin onUnlock={() => setIsUnlocked(true)} />;
  }

  function navigateTo(view: View) {
    if (hasUnsavedChanges && !window.confirm("You have unsaved changes. Save before leaving?")) return;
    setActive(view);
  }

  function setItems(nextItems: PortfolioItem[]) {
    updateData((current) => ({ ...current, portfolioItems: nextItems.map((item, index) => ({ ...item, order: index + 1 })) }));
  }

  function updateItem(id: string, patch: Partial<PortfolioItem>) {
    updateData((current) => ({
      ...current,
      portfolioItems: current.portfolioItems.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  }

  function updateService(id: string, patch: Partial<Service>) {
    updateData((current) => ({
      ...current,
      services: current.services.map((service) => (service.id === id ? { ...service, ...patch } : service)),
    }));
  }

  function setServices(nextServices: Service[]) {
    updateData((current) => ({ ...current, services: nextServices.map((service, index) => ({ ...service, order: index + 1 })) }));
  }

  function setPublications(nextPublications: Publication[]) {
    updateData((current) => ({ ...current, publications: nextPublications.map((publication, index) => ({ ...publication, order: index + 1 })) }));
  }

  function updatePublication(id: string, patch: Partial<Publication>) {
    updateData((current) => ({
      ...current,
      publications: current.publications.map((publication) => (publication.id === id ? { ...publication, ...patch } : publication)),
    }));
  }

  function moveService(id: string, direction: -1 | 1) {
    const oldIndex = services.findIndex((service) => service.id === id);
    const newIndex = oldIndex + direction;
    if (oldIndex < 0 || newIndex < 0 || newIndex >= services.length) return;
    setServices(arrayMove(services, oldIndex, newIndex));
  }

  function movePublication(id: string, direction: -1 | 1) {
    const oldIndex = publications.findIndex((publication) => publication.id === id);
    const newIndex = oldIndex + direction;
    if (oldIndex < 0 || newIndex < 0 || newIndex >= publications.length) return;
    setPublications(arrayMove(publications, oldIndex, newIndex));
  }

  function movePhoto(itemId: string, imageId: string, direction: -1 | 1) {
    const item = data.portfolioItems.find((portfolioItem) => portfolioItem.id === itemId);
    if (!item) return;
    const sortedImages = [...item.images].sort((a, b) => a.order - b.order);
    const oldIndex = sortedImages.findIndex((image) => image.id === imageId);
    const newIndex = oldIndex + direction;
    if (oldIndex < 0 || newIndex < 0 || newIndex >= sortedImages.length) return;
    updateItem(itemId, { images: arrayMove(sortedImages, oldIndex, newIndex).map((image, index) => ({ ...image, order: index + 1 })) });
  }

  function addService() {
    const id = createId("service");
    updateData((current) => ({
      ...current,
      services: [
        ...current.services,
        {
          id,
          title: { en: "New Service", ru: "Новая услуга" },
          eyebrow: { en: "Personal Styling", ru: "Персональный стайлинг" },
          description: { en: "", ru: "" },
          deliverables: [],
          group: "Personal Styling",
          price: { en: "", ru: "" },
          image: placeholderImage,
          order: current.services.length + 1,
          published: false,
        },
      ],
    }));
    setEditingServiceId(id);
    setActive("Service Editor");
  }

  function duplicateService(service: Service) {
    const id = createId("service");
    updateData((current) => ({
      ...current,
      services: [...current.services, { ...service, id, title: { en: `${text(service.title, "en")} Copy`, ru: `${text(service.title, "ru")} копия` }, order: current.services.length + 1, published: false }],
    }));
  }

  function deleteService(id: string) {
    setConfirm({
      title: "Delete this service?",
      body: "This removes the service from the studio and website.",
      action: () => {
        updateData((current) => ({ ...current, services: current.services.filter((service) => service.id !== id).map((service, index) => ({ ...service, order: index + 1 })) }));
        setEditingServiceId(null);
        setActive("Services");
      },
    });
  }

  function updateLocalizedItem(id: string, field: "title" | "description", language: Language, value: string) {
    const item = data.portfolioItems.find((portfolioItem) => portfolioItem.id === id);
    if (!item) return;
    updateItem(id, { [field]: { ...localized(item[field]), [language]: value } });
  }

  function updateLocalizedService(id: string, field: "title" | "description", language: Language, value: string) {
    const service = data.services.find((serviceItem) => serviceItem.id === id);
    if (!service) return;
    updateService(id, { [field]: { ...localized(service[field]), [language]: value } });
  }

  function updateLocalizedPublication(id: string, language: Language, value: string) {
    const publication = data.publications.find((publicationItem) => publicationItem.id === id);
    if (!publication) return;
    updatePublication(id, { title: { ...localized(publication.title), [language]: value } });
  }

  function updateContentField(section: "homepage" | "about" | "contact", field: string, language: Language, value: string) {
    updateData((current) => ({
      ...current,
      content: {
        ...current.content,
        [section]: {
          ...current.content[section],
          [field]: { ...localized(current.content[section][field as keyof typeof current.content[typeof section]] as LocalizedString), [language]: value },
        },
      },
    }));
  }

  function updateContactSetting(field: "whatsappNumber" | "instagramUrl" | "email", value: string) {
    updateData((current) => ({
      ...current,
      content: {
        ...current.content,
        contact: {
          ...current.content.contact,
          [field]: value,
        },
      },
    }));
  }

  async function replaceHeroImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = await fileToStudioUrl(file, "hero");

    updateData((current) => ({
      ...current,
      content: {
        ...current.content,
        homepage: {
          ...current.content.homepage,
          heroImage: url,
        },
      },
    }));
    event.target.value = "";
  }

  function openEditor(id: string) {
    setEditingId(id);
    setMode("Edit");
    setActive("Editor");
  }

  function openServiceEditor(id: string) {
    setEditingServiceId(id);
    setActive("Service Editor");
  }

  function openPublicationEditor(id: string) {
    setEditingPublicationId(id);
    setActive("Publication Editor");
  }

  function addItem() {
    const id = createId("portfolio");
    const nextItem: PortfolioItem = {
      id,
      title: { en: "Untitled Portfolio Item", ru: "Новая работа" },
      category: "Editorial",
      description: { en: "", ru: "" },
      images: [],
      order: data.portfolioItems.length + 1,
      published: false,
      featured: false,
    };

    updateData((current) => ({ ...current, portfolioItems: [...current.portfolioItems, nextItem] }));
    setEditingId(id);
    setMode("Edit");
    setActive("Editor");
  }

  function addPublication() {
    const id = createId("publication");
    updateData((current) => ({
      ...current,
      publications: [
        ...current.publications,
        {
          id,
          title: { en: "Publication Cover", ru: "Обложка публикации" },
          image: placeholderImage,
          order: current.publications.length + 1,
          published: false,
        },
      ],
    }));
    setEditingPublicationId(id);
    setActive("Publication Editor");
  }

  async function addPortfolioPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const id = createId("portfolio");
    const urls = await Promise.all(files.map((file) => fileToStudioUrl(file, `portfolio/${id}`)));
    const images = files.map((file, index): PortfolioImage => ({
      id: createId(`${id}-photo-${index + 1}`),
      url: urls[index],
      alt: file.name,
      order: index + 1,
      isCover: index === 0,
      hidden: false,
      size: index === 0 ? "Large" : "Medium",
    }));

    updateData((current) => ({
      ...current,
      portfolioItems: [
        ...current.portfolioItems,
        {
          id,
          title: { en: "New Portfolio Work", ru: "Новая работа" },
          category: "Editorial",
          description: { en: "", ru: "" },
          images,
          order: current.portfolioItems.length + 1,
          published: true,
          featured: false,
        },
      ],
    }));
    setEditingId(id);
    setActive("Editor");
    event.target.value = "";
  }

  function duplicateItem(item: PortfolioItem) {
    const id = createId("portfolio");
    const copy: PortfolioItem = {
      ...item,
      id,
      title: { ...localized(item.title), en: `${text(item.title, "en")} Copy`, ru: `${text(item.title, "ru")} копия` },
      published: false,
      order: data.portfolioItems.length + 1,
      images: item.images.map((image, index) => ({ ...image, id: `${id}-image-${index + 1}` })),
    };

    updateData((current) => ({ ...current, portfolioItems: [...current.portfolioItems, copy] }));
  }

  function deleteItem(id: string) {
    setConfirm({
      title: "Delete this portfolio item?",
      body: "This will remove the work from the studio and from the website.",
      action: () => {
        updateData((current) => {
          const nextItems = current.portfolioItems.filter((item) => item.id !== id).map((item, index) => ({ ...item, order: index + 1 }));
          setEditingId(nextItems[0]?.id ?? null);
          setActive("Portfolio");
          return { ...current, portfolioItems: nextItems };
        });
      },
    });
  }

  function handleItemDrag(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return;
    const oldIndex = items.findIndex((item) => item.id === event.active.id);
    const newIndex = items.findIndex((item) => item.id === event.over?.id);
    setItems(arrayMove(items, oldIndex, newIndex));
  }

  function handlePhotoDrag(event: DragEndEvent) {
    if (!editingItem || !event.over || event.active.id === event.over.id) return;
    const sortedImages = [...editingItem.images].sort((a, b) => a.order - b.order);
    const oldIndex = sortedImages.findIndex((image) => image.id === event.active.id);
    const newIndex = sortedImages.findIndex((image) => image.id === event.over?.id);
    updateItem(editingItem.id, { images: arrayMove(sortedImages, oldIndex, newIndex).map((image, index) => ({ ...image, order: index + 1 })) });
  }

  async function addImages(id: string, event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    const item = data.portfolioItems.find((portfolioItem) => portfolioItem.id === id);
    const start = item?.images.length ?? 0;
    const urls = await Promise.all(files.map((file) => fileToStudioUrl(file, `portfolio/${id}`)));
    const previews = files.map((file, index): PortfolioImage => ({
      id: createId(`${id}-photo-${index + 1}`),
      url: urls[index],
      alt: file.name,
      order: start + index + 1,
      isCover: start === 0 && index === 0,
      hidden: false,
      size: index === 0 ? "Large" : "Medium",
    }));

    updateItem(id, { images: [...(item?.images ?? []), ...previews] });
    event.target.value = "";
  }

  function updateImage(itemId: string, imageId: string, patch: Partial<PortfolioImage>) {
    const item = data.portfolioItems.find((portfolioItem) => portfolioItem.id === itemId);
    if (!item) return;
    updateItem(itemId, { images: item.images.map((image) => (image.id === imageId ? { ...image, ...patch } : image)) });
  }

  function chooseCover(itemId: string, imageId: string) {
    const item = data.portfolioItems.find((portfolioItem) => portfolioItem.id === itemId);
    if (!item) return;
    updateItem(itemId, { images: item.images.map((image) => ({ ...image, isCover: image.id === imageId, hidden: image.id === imageId ? false : image.hidden })) });
  }

  async function replaceImage(itemId: string, imageId: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    updateImage(itemId, imageId, { url: await fileToStudioUrl(file, `portfolio/${itemId}`), alt: file.name, hidden: false });
    event.target.value = "";
  }

  async function replacePublicationImage(id: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    updatePublication(id, { image: await fileToStudioUrl(file, "publications") });
    event.target.value = "";
  }

  async function replaceServiceImage(id: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    updateService(id, { image: await fileToStudioUrl(file, `services/${id}`) });
    event.target.value = "";
  }

  function deleteImage(itemId: string, image: PortfolioImage) {
    setConfirm({
      title: "Delete this photo?",
      body: "You can undo this right after deleting.",
      action: () => {
        const item = data.portfolioItems.find((portfolioItem) => portfolioItem.id === itemId);
        if (!item) return;
        const remainingPhotos = item.images.filter((photo) => photo.id !== image.id).map((photo, index) => ({ ...photo, order: index + 1 }));
        const needsCover = image.isCover && remainingPhotos.length > 0 && !remainingPhotos.some((photo) => photo.isCover);
        setUndoPhoto({ itemId, image });
        setSelectedPhoto(null);
        updateItem(itemId, { images: needsCover ? remainingPhotos.map((photo, index) => ({ ...photo, isCover: index === 0 })) : remainingPhotos });
      },
    });
  }

  function deletePublication(id: string) {
    setConfirm({
      title: "Delete this publication?",
      body: "This will remove the publication cover from the studio and from the website.",
      action: () => {
        updateData((current) => ({ ...current, publications: current.publications.filter((item) => item.id !== id).map((item, index) => ({ ...item, order: index + 1 })) }));
      },
    });
  }

  function restoreDeletedPhoto() {
    if (!undoPhoto) return;
    const item = data.portfolioItems.find((portfolioItem) => portfolioItem.id === undoPhoto.itemId);
    if (!item) return;
    updateItem(undoPhoto.itemId, { images: [...item.images, { ...undoPhoto.image, order: item.images.length + 1 }] });
    setUndoPhoto(null);
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <p className="eyebrow">ANA STYLING</p>
          <h1>Studio</h1>
        </div>
        {(["Dashboard", "Home", "About", "Services", "Portfolio", "Publications", "Contact"] as View[]).map((item) => (
          <button className={active === item ? "active" : ""} key={item} type="button" onClick={() => navigateTo(item)}>
            {item}
          </button>
        ))}
        <button type="button" onClick={addItem}>Add new work</button>
        <a href={pageHref("/")}>View website</a>
        <button type="button" onClick={async () => {
          await signOutAdmin();
          window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
          setIsUnlocked(false);
        }}>Lock studio</button>
      </aside>

      <section className="admin-content">
        <div className={`admin-save-status ${saveStatus}`}>
          <span>{saveStatus === "dirty" ? "Unsaved changes" : saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : saveStatus === "error" ? saveError || "Couldn’t save — Retry" : "Ready"}</span>
          {saveStatus === "error" && <button type="button" onClick={retrySave}>Retry</button>}
          <a href={pageHref("/")} target="_blank" rel="noreferrer">{saveStatus === "saved" ? "View change" : "Preview website"}</a>
        </div>
        {active === "Dashboard" && (
          <div className="admin-view">
            <div className="admin-hero">
              <div><p className="eyebrow">ANA STYLING</p><h2>What would you like to update?</h2></div>
              <a className="button primary" href={pageHref("/")} target="_blank" rel="noreferrer">Preview website</a>
            </div>
            <div className="cms-section-grid">
              {(["Home", "About", "Services", "Portfolio", "Publications", "Contact"] as View[]).map((section) => (
                <button className="cms-section-card" key={section} type="button" onClick={() => navigateTo(section)}>
                  <span>{section}</span>
                  <small>{section === "Portfolio" ? `${portfolioPhotos.length} photos` : section === "Services" ? `${services.length} services` : section === "Publications" ? `${publications.length} covers` : "Edit section"}</small>
                </button>
              ))}
            </div>
            <div className="metric-grid">
              <article><strong>{items.length}</strong><span>Portfolio pieces</span></article>
              <article><strong>{items.filter((item) => item.published).length}</strong><span>Published</span></article>
              <article><strong>{items.filter((item) => !item.published).length}</strong><span>Drafts</span></article>
              <article><strong>{publications.length}</strong><span>Publications</span></article>
            </div>
            <div className="admin-heading"><div><p className="eyebrow">Recent portfolio</p><h3>Latest stories</h3></div></div>
            <div className="recent-grid">
              {items.slice(0, 4).map((item) => <PortfolioPreviewCard item={item} key={item.id} onEdit={() => openEditor(item.id)} />)}
            </div>
          </div>
        )}

        {active === "Portfolio" && (
          <div className="admin-view">
            <div className="admin-heading">
              <div><p className="eyebrow">Portfolio</p><h2>Tap a photo to manage it</h2></div>
              <label className="button primary upload-button">+ Add photos<input multiple type="file" accept="image/*" onChange={addPortfolioPhotos} /></label>
            </div>
            <div className="photo-app-grid">
              {portfolioPhotos.map(({ item, image }) => (
                <button className={`photo-app-tile ${selectedPhoto?.imageId === image.id ? "active" : ""} ${image.hidden ? "is-hidden" : ""}`} key={`${item.id}-${image.id}`} type="button" onClick={() => setSelectedPhoto({ itemId: item.id, imageId: image.id })}>
                  <img src={assetSrc(image.url)} alt="" />
                  <span>{item.category}</span>
                </button>
              ))}
            </div>
            {selectedPhotoData && (
              <section className="photo-action-panel">
                <img src={assetSrc(selectedPhotoData.image.url)} alt="" />
                <div>
                  <strong>{text(selectedPhotoData.item.title, contentLanguage)}</strong>
                  <label>Category<select value={selectedPhotoData.item.category} onChange={(event) => updateItem(selectedPhotoData.item.id, { category: event.target.value as PortfolioCategory })}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label>Size<select value={selectedPhotoData.image.size} onChange={(event) => updateImage(selectedPhotoData.item.id, selectedPhotoData.image.id, { size: event.target.value as PortfolioImageSize })}>{imageSizes.map((size) => <option key={size}>{size}</option>)}</select></label>
                </div>
                <div className="admin-card-actions">
                  <label>Replace<input type="file" accept="image/*" onChange={(event) => replaceImage(selectedPhotoData.item.id, selectedPhotoData.image.id, event)} /></label>
                  <button type="button" onClick={() => updateImage(selectedPhotoData.item.id, selectedPhotoData.image.id, { hidden: !selectedPhotoData.image.hidden })}>{selectedPhotoData.image.hidden ? "Publish" : "Hide"}</button>
                  <button type="button" onClick={() => chooseCover(selectedPhotoData.item.id, selectedPhotoData.image.id)}>Cover</button>
                  <button type="button" onClick={() => movePhoto(selectedPhotoData.item.id, selectedPhotoData.image.id, -1)}>Move up</button>
                  <button type="button" onClick={() => movePhoto(selectedPhotoData.item.id, selectedPhotoData.image.id, 1)}>Move down</button>
                  <button type="button" onClick={() => openEditor(selectedPhotoData.item.id)}>Edit work</button>
                  <button type="button" onClick={() => deleteImage(selectedPhotoData.item.id, selectedPhotoData.image)}>Delete</button>
                </div>
              </section>
            )}
            <details className="portfolio-story-list">
              <summary>Manage portfolio stories</summary>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDrag}>
                <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                  <div className="portfolio-manager">
                    {items.map((item) => (
                      <SortablePortfolioRow
                        item={item}
                        key={item.id}
                        onDelete={() => deleteItem(item.id)}
                        onDuplicate={() => duplicateItem(item)}
                        onEdit={() => openEditor(item.id)}
                        onTogglePublish={() => updateItem(item.id, { published: !item.published })}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </details>
          </div>
        )}

        {active === "Editor" && editingItem && (
          <div className="admin-view">
            <div className="admin-heading">
              <div><p className="eyebrow">Work Editor</p><h2>{text(editingItem.title, contentLanguage)}</h2></div>
              <div className="segmented"><button className={mode === "Edit" ? "active" : ""} type="button" onClick={() => setMode("Edit")}>Edit</button><button className={mode === "Preview" ? "active" : ""} type="button" onClick={() => setMode("Preview")}>Preview</button></div>
            </div>

            {mode === "Edit" ? (
              <div className="editor-grid">
                <section className="editor-form editor-panel">
                  <div className="editor-step"><span>1</span><div><h3>Upload photos</h3><p>Add a full story first, then choose the cover and sizes.</p></div></div>
                  <label className="upload-zone">+ Add photos<input multiple type="file" accept="image/*" onChange={(event) => addImages(editingItem.id, event)} /><span>Select several images from your phone or computer</span></label>
                  <div className="editor-step"><span>2</span><div><h3>Describe the work</h3></div></div>
                  <LanguageTabs language={contentLanguage} onChange={setContentLanguage} />
                  <label>Title {contentLanguage.toUpperCase()}<input value={text(editingItem.title, contentLanguage)} onChange={(event) => updateLocalizedItem(editingItem.id, "title", contentLanguage, event.target.value)} /></label>
                  <label>Description {contentLanguage.toUpperCase()}<textarea rows={6} value={text(editingItem.description, contentLanguage)} onChange={(event) => updateLocalizedItem(editingItem.id, "description", contentLanguage, event.target.value)} /></label>
                  <label>Category<select value={editingItem.category} onChange={(event) => updateItem(editingItem.id, { category: event.target.value as PortfolioCategory })}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <div className="editor-actions">
                    <button className="button" type="button" onClick={() => updateItem(editingItem.id, { published: false })}>Save draft</button>
                    <button className="button primary" type="button" onClick={() => updateItem(editingItem.id, { published: true })}>Publish</button>
                    <a className="button" href={pageHref("/#portfolio")} target="_blank" rel="noreferrer">View on website</a>
                  </div>
                </section>

                <section className="editor-panel">
                  <div className="editor-step"><span>3</span><div><h3>Arrange photos</h3><p>Drag photos into the order you want. Choose one cover image for the website.</p></div></div>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePhotoDrag}>
                    <SortableContext items={editingItem.images.map((image) => image.id)} strategy={rectSortingStrategy}>
                      <div className="photo-grid">
                        {[...editingItem.images].sort((a, b) => a.order - b.order).map((image) => (
                          <SortablePhotoCard
                            image={image}
                            itemId={editingItem.id}
                            key={image.id}
                            onCover={() => chooseCover(editingItem.id, image.id)}
                            onDelete={() => deleteImage(editingItem.id, image)}
                            onReplace={(event) => replaceImage(editingItem.id, image.id, event)}
                            onUpdate={(patch) => updateImage(editingItem.id, image.id, patch)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                  {undoPhoto && <div className="undo-bar">Photo deleted. <button type="button" onClick={restoreDeletedPhoto}>Undo</button></div>}
                </section>
              </div>
            ) : (
              <PortfolioPreview item={editingItem} />
            )}
          </div>
        )}

        {active === "Editor" && !editingItem && (
          <div className="admin-view">
            <div className="admin-hero">
              <div><p className="eyebrow">Add new work</p><h2>Create a portfolio story</h2><p>Start a new work, upload photos, choose a category, then publish it when it is ready.</p></div>
              <button className="button primary" type="button" onClick={addItem}>Create work</button>
            </div>
          </div>
        )}

        {(["Home", "About", "Contact"] as View[]).includes(active) && (
          <div className="admin-view simple-editor-view">
            <div className="admin-heading">
              <div><p className="eyebrow">{active}</p><h2>{active === "Home" ? "Home text and main photo" : active === "About" ? "About Ana" : "Contact form text"}</h2></div>
              <LanguageTabs language={contentLanguage} onChange={setContentLanguage} />
            </div>
            <section className="editor-form editor-panel compact-panel">
              {active === "Home" && (
                <>
                  <div className="hero-image-admin">
                    <img src={assetSrc(data.content.homepage.heroImage)} alt="" />
                    <label className="upload-zone">Replace main photo<input type="file" accept="image/*" onChange={replaceHeroImage} /><span>First screen photo.</span></label>
                  </div>
                  <label>Main headline<input value={text(data.content.homepage.heroNote, contentLanguage)} onChange={(event) => updateContentField("homepage", "heroNote", contentLanguage, event.target.value)} /></label>
                  <label>Small text<textarea rows={4} value={text(data.content.homepage.positioning, contentLanguage)} onChange={(event) => updateContentField("homepage", "positioning", contentLanguage, event.target.value)} /></label>
                </>
              )}
              {active === "About" && (
                <>
                  <label>Main headline<input value={text(data.content.about.headline, contentLanguage)} onChange={(event) => updateContentField("about", "headline", contentLanguage, event.target.value)} /></label>
                  <label>About text<textarea rows={12} value={text(data.content.about.body, contentLanguage)} onChange={(event) => updateContentField("about", "body", contentLanguage, event.target.value)} /></label>
                  <label>Small text<textarea rows={4} value={text(data.content.about.note, contentLanguage)} onChange={(event) => updateContentField("about", "note", contentLanguage, event.target.value)} /></label>
                </>
              )}
              {active === "Contact" && (
                <>
                  <label>WhatsApp number<input value={data.content.contact.whatsappNumber} onChange={(event) => updateContactSetting("whatsappNumber", event.target.value)} /></label>
                  <label>Instagram<input value={data.content.contact.instagramUrl} onChange={(event) => updateContactSetting("instagramUrl", event.target.value)} /></label>
                  <label>Email<input value={data.content.contact.email} onChange={(event) => updateContactSetting("email", event.target.value)} /></label>
                  <label>Main headline<input value={text(data.content.contact.headline, contentLanguage)} onChange={(event) => updateContentField("contact", "headline", contentLanguage, event.target.value)} /></label>
                  <label>Contact text<textarea rows={5} value={text(data.content.contact.body, contentLanguage)} onChange={(event) => updateContentField("contact", "body", contentLanguage, event.target.value)} /></label>
                </>
              )}
            </section>
          </div>
        )}

        {active === "Services" && (
          <div className="admin-view">
            <div className="admin-heading"><div><p className="eyebrow">Services</p><h2>Choose a service to edit</h2></div><button className="button primary" type="button" onClick={addService}>Add service</button></div>
            <div className="cms-card-grid">
              {services.map((service) => (
                <article className="cms-item-card" key={service.id}>
                  <img src={assetSrc(service.image)} alt="" />
                  <div>
                    <strong>{text(service.title, contentLanguage)}</strong>
                    <span>{service.price ? text(service.price, contentLanguage) : "No price"}</span>
                    <small>{service.published ? "Visible on website" : "Hidden"}</small>
                  </div>
                  <div className="admin-card-actions">
                    <button type="button" onClick={() => openServiceEditor(service.id)}>Edit</button>
                    <button type="button" onClick={() => moveService(service.id, -1)}>Move up</button>
                    <button type="button" onClick={() => moveService(service.id, 1)}>Move down</button>
                    <button type="button" onClick={() => duplicateService(service)}>Duplicate</button>
                    <button type="button" onClick={() => deleteService(service.id)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {active === "Service Editor" && editingService && (
          <div className="admin-view simple-editor-view">
            <div className="admin-heading"><div><p className="eyebrow">Service</p><h2>{text(editingService.title, contentLanguage)}</h2></div><LanguageTabs language={contentLanguage} onChange={setContentLanguage} /></div>
            <section className="editor-form editor-panel compact-panel">
              <div className="service-image-editor"><img src={assetSrc(editingService.image)} alt="" /><label className="image-replace-button">Replace image<input type="file" accept="image/*" onChange={(event) => replaceServiceImage(editingService.id, event)} /></label></div>
              <label>Name<input value={text(editingService.title, contentLanguage)} onChange={(event) => updateLocalizedService(editingService.id, "title", contentLanguage, event.target.value)} /></label>
              <label>Description<textarea value={text(editingService.description, contentLanguage)} rows={5} onChange={(event) => updateLocalizedService(editingService.id, "description", contentLanguage, event.target.value)} /></label>
              <label>Price<input value={editingService.price ? text(editingService.price, contentLanguage) : ""} onChange={(event) => updateService(editingService.id, { price: { ...localized(editingService.price ?? ""), [contentLanguage]: event.target.value } })} /></label>
              <label>Category<select value={editingService.group} onChange={(event) => updateService(editingService.id, { group: event.target.value as ServiceGroup })}>{serviceGroups.map((group) => <option key={group}>{group}</option>)}</select></label>
              <label className="toggle"><input checked={editingService.published} type="checkbox" onChange={(event) => updateService(editingService.id, { published: event.target.checked })} /> Visible on website</label>
              <div className="editor-actions"><button className="button" type="button" onClick={() => navigateTo("Services")}>Back</button></div>
            </section>
          </div>
        )}

        {active === "Publications" && (
          <div className="admin-view">
            <div className="admin-heading">
              <div><p className="eyebrow">Publications</p><h2>Magazine covers</h2></div>
              <button className="button primary" type="button" onClick={addPublication}>Add Publication</button>
            </div>
            <LanguageTabs language={contentLanguage} onChange={setContentLanguage} />
            <div className="cms-card-grid publication-cms-grid">
              {publications.map((publication) => (
                <article className="cms-item-card publication-cms-card" key={publication.id}>
                  <img src={assetSrc(publication.image)} alt="" />
                  <div><strong>{text(publication.title, contentLanguage)}</strong><small>{publication.published ? "Visible on website" : "Hidden"}</small></div>
                  <div className="admin-card-actions">
                    <button type="button" onClick={() => openPublicationEditor(publication.id)}>Edit</button>
                    <button type="button" onClick={() => movePublication(publication.id, -1)}>Move up</button>
                    <button type="button" onClick={() => movePublication(publication.id, 1)}>Move down</button>
                    <button type="button" onClick={() => updatePublication(publication.id, { published: !publication.published })}>{publication.published ? "Hide" : "Publish"}</button>
                    <button type="button" onClick={() => deletePublication(publication.id)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {active === "Publication Editor" && editingPublication && (
          <div className="admin-view simple-editor-view">
            <div className="admin-heading"><div><p className="eyebrow">Publication</p><h2>{text(editingPublication.title, contentLanguage)}</h2></div><LanguageTabs language={contentLanguage} onChange={setContentLanguage} /></div>
            <section className="editor-form editor-panel compact-panel">
              <div className="service-image-editor publication-image-editor"><img src={assetSrc(editingPublication.image)} alt="" /><label className="image-replace-button">Replace image<input type="file" accept="image/*" onChange={(event) => replacePublicationImage(editingPublication.id, event)} /></label></div>
              <label>Title<input value={text(editingPublication.title, contentLanguage)} onChange={(event) => updateLocalizedPublication(editingPublication.id, contentLanguage, event.target.value)} /></label>
              <label className="toggle"><input checked={editingPublication.published} type="checkbox" onChange={(event) => updatePublication(editingPublication.id, { published: event.target.checked })} /> Visible on website</label>
              <div className="editor-actions"><button className="button" type="button" onClick={() => navigateTo("Publications")}>Back</button></div>
            </section>
          </div>
        )}

      </section>

      {confirm && (
        <div className="confirm-modal" role="dialog" aria-modal="true" aria-label={confirm.title}>
          <div className="confirm-panel">
            <h3>{confirm.title}</h3>
            <p>{confirm.body}</p>
            <div><button type="button" onClick={() => setConfirm(null)}>Cancel</button><button type="button" onClick={() => { confirm.action(); setConfirm(null); }}>Delete</button></div>
          </div>
        </div>
      )}

      <div className="admin-sticky-save">
        <button className="button primary" type="button" disabled={!hasUnsavedChanges || saveStatus === "saving"} onClick={() => saveChanges()}>
          {saveStatus === "saving" ? "Saving…" : saveStatus === "error" ? "Retry Save changes" : "Save changes"}
        </button>
      </div>
    </main>
  );
}

function getCover(item: PortfolioItem) {
  const visible = item.images.filter((image) => !image.hidden).sort((a, b) => a.order - b.order);
  return visible.find((image) => image.isCover) ?? visible[0] ?? null;
}

function PortfolioPreviewCard({ item, onEdit }: { item: PortfolioItem; onEdit: () => void }) {
  const cover = getCover(item);

  return (
    <button className="recent-card" type="button" onClick={onEdit}>
      <img src={assetSrc(cover?.url ?? placeholderImage)} alt="" />
      <span className={item.published ? "status live" : "status draft"}>{item.published ? "Published" : "Draft"}</span>
      <strong>{text(item.title, "en")}</strong>
      <small>{item.category} · {item.images.length} photos</small>
    </button>
  );
}

function SortablePortfolioRow(props: {
  item: PortfolioItem;
  onDelete: () => void;
  onDuplicate: () => void;
  onEdit: () => void;
  onTogglePublish: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.item.id });
  const cover = getCover(props.item);

  return (
    <article className={`portfolio-admin-card ${isDragging ? "dragging" : ""}`} ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <button className="drag-handle" type="button" {...attributes} {...listeners} aria-label={`Reorder ${text(props.item.title, "en")}`}>Drag</button>
      <img src={assetSrc(cover?.url ?? placeholderImage)} alt="" />
      <div className="portfolio-admin-main">
        <strong>{text(props.item.title, "en")}</strong>
        <span>{props.item.category}</span>
        <small>{props.item.images.length} photos · order {props.item.order}</small>
      </div>
      <span className={props.item.published ? "status live" : "status draft"}>{props.item.published ? "Published" : "Draft"}</span>
      <div className="admin-card-actions">
        <button type="button" onClick={props.onEdit}>Edit</button>
        <button type="button" onClick={props.onDuplicate}>Duplicate</button>
        <button type="button" onClick={props.onTogglePublish}>{props.item.published ? "Hide" : "Publish"}</button>
        <button type="button" onClick={props.onDelete}>Delete</button>
      </div>
    </article>
  );
}

function SortablePhotoCard(props: {
  image: PortfolioImage;
  itemId: string;
  onCover: () => void;
  onDelete: () => void;
  onReplace: (event: ChangeEvent<HTMLInputElement>) => void;
  onUpdate: (patch: Partial<PortfolioImage>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.image.id });

  return (
    <article className={`photo-card ${props.image.hidden ? "is-hidden" : ""} ${isDragging ? "dragging" : ""}`} ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <button className="photo-drag" type="button" {...attributes} {...listeners} aria-label="Reorder photo">Drag photo</button>
      <img src={assetSrc(props.image.url)} alt="" />
      {props.image.isCover && <span className="cover-badge">Cover</span>}
      <div className="photo-controls">
        <button type="button" onClick={props.onCover}>Set cover</button>
        <button type="button" onClick={() => props.onUpdate({ hidden: !props.image.hidden })}>{props.image.hidden ? "Show" : "Hide"}</button>
        <label>Replace<input type="file" accept="image/*" onChange={props.onReplace} /></label>
        <button type="button" onClick={props.onDelete}>Delete</button>
        <label>Size<select value={props.image.size} onChange={(event) => props.onUpdate({ size: event.target.value as PortfolioImageSize })}>{imageSizes.map((size) => <option key={size}>{size}</option>)}</select></label>
      </div>
    </article>
  );
}

function PortfolioPreview({ item }: { item: PortfolioItem }) {
  const images = item.images.filter((image) => !image.hidden).sort((a, b) => a.order - b.order);

  return (
    <section className="work-preview">
      <div>
        <p className="eyebrow">{item.category}</p>
        <h2>{text(item.title, "en")}</h2>
        <p>{text(item.description, "en") || "Add a description to complete this portfolio story."}</p>
        <span className={item.published ? "status live" : "status draft"}>{item.published ? "Published" : "Draft"}</span>
      </div>
      <div className="preview-masonry">
        {images.map((image) => <img className={`preview-${image.size.toLowerCase()}`} key={image.id} src={assetSrc(image.url)} alt="" />)}
      </div>
    </section>
  );
}

function LanguageTabs({ language, onChange }: { language: Language; onChange: (language: Language) => void }) {
  return (
    <div className="language-tabs" aria-label="Editing language">
      {adminLanguages.map((item) => (
        <button className={language === item ? "active" : ""} key={item} type="button" onClick={() => onChange(item)}>{item.toUpperCase()}</button>
      ))}
    </div>
  );
}
