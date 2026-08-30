"use client";

import { ChangeEvent, useMemo, useState } from "react";
import Link from "next/link";
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

type View = "Dashboard" | "Portfolio" | "Editor" | "Services" | "Publications" | "Site Text";
type ConfirmAction = { title: string; body: string; action: () => void } | null;

const categories: PortfolioCategory[] = ["Personal Styling", "Editorial", "Events", "Closet Edit"];
const imageSizes: PortfolioImageSize[] = ["Small", "Medium", "Large"];
const serviceGroups: ServiceGroup[] = ["Personal Styling", "Commercial Styling"];
const placeholderImage = "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=600&q=80";
const adminLanguages: Language[] = ["en", "ru"];
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const pageHref = (path: string) => `${basePath}${path}`;

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function AdminApp() {
  const { data, updateData } = useStudioData();
  const [active, setActive] = useState<View>("Dashboard");
  const [editingId, setEditingId] = useState<string | null>(data.portfolioItems[0]?.id ?? null);
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
  const publications = useMemo(() => [...data.publications].sort((a, b) => a.order - b.order), [data.publications]);

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

  function setPublications(nextPublications: Publication[]) {
    updateData((current) => ({ ...current, publications: nextPublications.map((publication, index) => ({ ...publication, order: index + 1 })) }));
  }

  function updatePublication(id: string, patch: Partial<Publication>) {
    updateData((current) => ({
      ...current,
      publications: current.publications.map((publication) => (publication.id === id ? { ...publication, ...patch } : publication)),
    }));
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

  function openEditor(id: string) {
    setEditingId(id);
    setMode("Edit");
    setActive("Editor");
  }

  function addItem() {
    const id = createId("portfolio");
    const nextItem: PortfolioItem = {
      id,
      title: { en: "Untitled Portfolio Item", ru: "Новая работа" },
      category: "Personal Styling",
      description: { en: "", ru: "" },
      images: [],
      order: data.portfolioItems.length + 1,
      published: false,
      featured: false,
    };

    updateData((current) => ({ ...current, portfolioItems: [...current.portfolioItems, nextItem] }));
    openEditor(id);
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
    setActive("Publications");
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
      body: "This will remove the work from the studio list.",
      action: () => {
        updateData((current) => ({ ...current, portfolioItems: current.portfolioItems.filter((item) => item.id !== id) }));
        setEditingId(null);
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

  function handlePublicationDrag(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return;
    const oldIndex = publications.findIndex((publication) => publication.id === event.active.id);
    const newIndex = publications.findIndex((publication) => publication.id === event.over?.id);
    setPublications(arrayMove(publications, oldIndex, newIndex));
  }

  function addImages(id: string, event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    const item = data.portfolioItems.find((portfolioItem) => portfolioItem.id === id);
    const start = item?.images.length ?? 0;
    const previews = files.map((file, index): PortfolioImage => ({
      id: createId(`${id}-photo-${index + 1}`),
      url: URL.createObjectURL(file),
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

  function replaceImage(itemId: string, imageId: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    updateImage(itemId, imageId, { url: URL.createObjectURL(file), alt: file.name, hidden: false });
    event.target.value = "";
  }

  function replacePublicationImage(id: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    updatePublication(id, { image: URL.createObjectURL(file) });
    event.target.value = "";
  }

  function deleteImage(itemId: string, image: PortfolioImage) {
    setConfirm({
      title: "Delete this photo?",
      body: "You can undo this right after deleting.",
      action: () => {
        const item = data.portfolioItems.find((portfolioItem) => portfolioItem.id === itemId);
        if (!item) return;
        setUndoPhoto({ itemId, image });
        updateItem(itemId, { images: item.images.filter((photo) => photo.id !== image.id).map((photo, index) => ({ ...photo, order: index + 1 })) });
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
        {(["Dashboard", "Portfolio", "Services", "Publications", "Site Text"] as View[]).map((item) => (
          <button className={active === item ? "active" : ""} key={item} type="button" onClick={() => setActive(item)}>
            {item}
          </button>
        ))}
        <button type="button" onClick={addItem}>Add new work</button>
        <Link href={pageHref("/")}>View website</Link>
      </aside>

      <section className="admin-content">
        {active === "Dashboard" && (
          <div className="admin-view">
            <div className="admin-hero">
              <div><p className="eyebrow">Dashboard</p><h2>Your portfolio, ready for clients.</h2></div>
              <button className="button primary" type="button" onClick={addItem}>Add new work</button>
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
              <div><p className="eyebrow">Portfolio Manager</p><h2>Arrange and publish work</h2></div>
              <button className="button primary" type="button" onClick={addItem}>Add Portfolio Item</button>
            </div>
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

        {active === "Services" && (
          <div className="admin-view">
            <div className="admin-heading"><div><p className="eyebrow">Services</p><h2>Edit your offers</h2></div></div>
            <div className="admin-list">
              {[...data.services].sort((a, b) => a.order - b.order).map((service) => (
                <article className="service-edit" key={service.id}>
                  <img src={service.image} alt="" />
                  <div>
                    <LanguageTabs language={contentLanguage} onChange={setContentLanguage} />
                    <label>Service name {contentLanguage.toUpperCase()}<input value={text(service.title, contentLanguage)} onChange={(event) => updateLocalizedService(service.id, "title", contentLanguage, event.target.value)} /></label>
                    <label>Description {contentLanguage.toUpperCase()}<textarea value={text(service.description, contentLanguage)} rows={3} onChange={(event) => updateLocalizedService(service.id, "description", contentLanguage, event.target.value)} /></label>
                    <label>Group<select value={service.group} onChange={(event) => updateService(service.id, { group: event.target.value as ServiceGroup })}>{serviceGroups.map((group) => <option key={group}>{group}</option>)}</select></label>
                    <label>Price / note<input value={service.price ? text(service.price, contentLanguage) : ""} onChange={(event) => updateService(service.id, { price: { ...localized(service.price ?? ""), [contentLanguage]: event.target.value } })} /></label>
                    <label className="toggle"><input checked={service.published} type="checkbox" onChange={(event) => updateService(service.id, { published: event.target.checked })} /> Show on website</label>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {active === "Publications" && (
          <div className="admin-view">
            <div className="admin-heading">
              <div><p className="eyebrow">Publications</p><h2>Manage covers</h2></div>
              <button className="button primary" type="button" onClick={addPublication}>Add Publication</button>
            </div>
            <LanguageTabs language={contentLanguage} onChange={setContentLanguage} />
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePublicationDrag}>
              <SortableContext items={publications.map((publication) => publication.id)} strategy={verticalListSortingStrategy}>
                <div className="admin-list">
                  {publications.map((publication) => (
                    <SortablePublicationRow
                      contentLanguage={contentLanguage}
                      key={publication.id}
                      publication={publication}
                      onDelete={() => updateData((current) => ({ ...current, publications: current.publications.filter((item) => item.id !== publication.id) }))}
                      onReplace={(event) => replacePublicationImage(publication.id, event)}
                      onTitle={(value) => updateLocalizedPublication(publication.id, contentLanguage, value)}
                      onToggle={() => updatePublication(publication.id, { published: !publication.published })}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        {active === "Site Text" && (
          <div className="admin-view">
            <div className="admin-heading"><div><p className="eyebrow">Website Text</p><h2>Edit the main pages</h2></div></div>
            <div className="content-editor-grid">
              <section className="editor-form editor-panel">
                <h3>Homepage</h3>
                <LanguageTabs language={contentLanguage} onChange={setContentLanguage} />
                <label>Main message {contentLanguage.toUpperCase()}<textarea rows={4} value={text(data.content.homepage.positioning, contentLanguage)} onChange={(event) => updateContentField("homepage", "positioning", contentLanguage, event.target.value)} /></label>
                <label>Small hero note {contentLanguage.toUpperCase()}<input value={text(data.content.homepage.heroNote, contentLanguage)} onChange={(event) => updateContentField("homepage", "heroNote", contentLanguage, event.target.value)} /></label>
              </section>
              <section className="editor-form editor-panel">
                <h3>About</h3>
                <LanguageTabs language={contentLanguage} onChange={setContentLanguage} />
                <label>Headline {contentLanguage.toUpperCase()}<input value={text(data.content.about.headline, contentLanguage)} onChange={(event) => updateContentField("about", "headline", contentLanguage, event.target.value)} /></label>
                <label>Story {contentLanguage.toUpperCase()}<textarea rows={5} value={text(data.content.about.body, contentLanguage)} onChange={(event) => updateContentField("about", "body", contentLanguage, event.target.value)} /></label>
                <label>Supporting note {contentLanguage.toUpperCase()}<textarea rows={3} value={text(data.content.about.note, contentLanguage)} onChange={(event) => updateContentField("about", "note", contentLanguage, event.target.value)} /></label>
              </section>
              <section className="editor-form editor-panel">
                <h3>Contact</h3>
                <LanguageTabs language={contentLanguage} onChange={setContentLanguage} />
                <label>Headline {contentLanguage.toUpperCase()}<input value={text(data.content.contact.headline, contentLanguage)} onChange={(event) => updateContentField("contact", "headline", contentLanguage, event.target.value)} /></label>
                <label>Short text {contentLanguage.toUpperCase()}<textarea rows={4} value={text(data.content.contact.body, contentLanguage)} onChange={(event) => updateContentField("contact", "body", contentLanguage, event.target.value)} /></label>
              </section>
            </div>
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
      <img src={cover?.url ?? placeholderImage} alt="" />
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
      <img src={cover?.url ?? placeholderImage} alt="" />
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
      <img src={props.image.url} alt="" />
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
        {images.map((image) => <img className={`preview-${image.size.toLowerCase()}`} key={image.id} src={image.url} alt="" />)}
      </div>
    </section>
  );
}

function SortablePublicationRow(props: {
  contentLanguage: Language;
  publication: Publication;
  onDelete: () => void;
  onReplace: (event: ChangeEvent<HTMLInputElement>) => void;
  onTitle: (value: string) => void;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.publication.id });

  return (
    <article className={`service-edit ${isDragging ? "dragging" : ""}`} ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <img src={props.publication.image} alt="" />
      <div>
        <button className="drag-handle" type="button" {...attributes} {...listeners} aria-label={`Reorder ${text(props.publication.title, "en")}`}>Drag</button>
        <label>Publication title {props.contentLanguage.toUpperCase()}<input value={text(props.publication.title, props.contentLanguage)} onChange={(event) => props.onTitle(event.target.value)} /></label>
        <label>Image<input type="file" accept="image/*" onChange={props.onReplace} /></label>
        <div className="admin-card-actions">
          <button type="button" onClick={props.onToggle}>{props.publication.published ? "Hide" : "Publish"}</button>
          <button type="button" onClick={props.onDelete}>Delete</button>
        </div>
      </div>
    </article>
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
