"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type ItemData = { brand?: string; category?: string; format?: string; image?: string; video?: string };
type Item = { id: string; title: string; status: string; position: number; data: ItemData };
type MediaAsset = { id: string; key: string; filename: string; contentType: string; byteSize: number; createdAt: string; url: string };

const sampleItems: Item[] = [
  { id: "demo-1", title: "The glow-up edit", status: "published", position: 1, data: { brand: "Luminous Skin", category: "Skincare", format: "Aesthetic B-roll", image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=500&q=70" } },
  { id: "demo-2", title: "Sunday reset", status: "draft", position: 2, data: { brand: "Self-care ritual", category: "Lifestyle", format: "Voiceover", image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=500&q=70" } },
];

const nav = ["Overview", "Portfolio", "Case studies", "Brands", "Testimonials", "Inquiries", "Media library", "Site settings"];
const maxUploadBytes = 20 * 1024 * 1024;

function driveFileId(value: string) {
  try {
    const url = new URL(value);
    if (!url.hostname.endsWith("google.com") && !url.hostname.endsWith("googleusercontent.com")) return null;
    return url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] || url.searchParams.get("id");
  } catch { return null; }
}

function driveImageUrl(value: string) {
  const id = driveFileId(value);
  return id ? `https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}` : null;
}

function driveVideoUrl(value: string) {
  const id = driveFileId(value);
  return id ? `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview` : null;
}

function instagramPostUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    const match = url.pathname.match(/^\/(p|reel|tv)\/([^/]+)/);
    return host === "instagram.com" && match ? `https://www.instagram.com/${match[1]}/${match[2]}/` : null;
  } catch { return null; }
}

export default function AdminDashboard({ email, name }: { email: string; name: string }) {
  const [tab, setTab] = useState("Overview");
  const [items, setItems] = useState<Item[]>(sampleItems);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [modal, setModal] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [prefillMedia, setPrefillMedia] = useState<MediaAsset | null>(null);
  const [recentMedia, setRecentMedia] = useState<MediaAsset | null>(null);

  function openNewItem(asset?: MediaAsset) {
    setPrefillMedia(asset ?? null);
    setModal(true);
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch = `${item.title} ${item.data.brand ?? ""} ${item.data.category ?? ""}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (statusFilter === "all" || item.status === statusFilter);
  });

  useEffect(() => {
    fetch("/api/content?type=portfolio")
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => data.records?.length && setItems(data.records))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab !== "Media library") return;
    setMediaLoading(true);
    fetch("/api/media")
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => setMedia(data.assets ?? []))
      .catch(() => setNotice("Media library could not be loaded. Refresh and try again."))
      .finally(() => setMediaLoading(false));
  }, [tab]);

  async function uploadMedia(file: File) {
    if (!file.size) throw new Error("Choose a file first.");
    if (file.size > maxUploadBytes) throw new Error("Each upload must be 20 MB or smaller.");
    const response = await fetch(`/api/media?name=${encodeURIComponent(file.name)}`, {
      method: "POST",
      headers: { "content-type": file.type || "application/octet-stream" },
      body: file,
    });
    const body = await response.json().catch(() => null) as { url?: string; error?: string } | null;
    if (!response.ok || !body?.url) throw new Error(body?.error ?? "Upload failed. Try MP4, WebM, JPG or PNG.");
    return new URL(body.url, window.location.origin).toString();
  }

  async function createItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setNotice("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      let image = String(data.get("image") ?? "").trim();
      let video = String(data.get("video") ?? "").trim();
      const imageSource = String(data.get("imageSource") ?? "url");
      const videoSource = String(data.get("videoSource") ?? "none");
      const imageFile = data.get("imageFile");
      const videoFile = data.get("videoFile");
      if (imageSource === "phone" && imageFile instanceof File && imageFile.size) image = await uploadMedia(imageFile);
      if (imageSource === "drive") image = driveImageUrl(image) ?? "";
      if (videoSource === "none") video = "";
      if (videoSource === "phone" && videoFile instanceof File && videoFile.size) video = await uploadMedia(videoFile);
      if (videoSource === "drive") video = driveVideoUrl(video) ?? "";
      if (videoSource === "instagram") video = instagramPostUrl(video) ?? "";
      if (!image) throw new Error("Add a cover image or choose an image file.");
      if (imageSource === "drive" && !image) throw new Error("Paste a Google Drive file link for the cover image.");
      if (image && imageSource !== "phone") {
        try { new URL(image); } catch { throw new Error("Cover image link must start with https://"); }
      }
      if (video) {
        try { new URL(video); } catch { throw new Error("Video link must start with https://"); }
      }
      if (videoSource === "drive" && !video) throw new Error("Paste a Google Drive file link for the video.");
      if (videoSource === "instagram" && !video) throw new Error("Use a public Instagram post, reel or TV link—not a profile link.");
      const item: Item = {
        id: crypto.randomUUID(),
        title: String(data.get("title") ?? "").trim(),
        status: String(data.get("status") ?? "draft"),
        position: items.length + 1,
        data: {
          brand: String(data.get("brand") ?? "").trim(),
          category: String(data.get("category") ?? "Beauty"),
          format: String(data.get("format") ?? "Product Demo"),
          image,
          ...(video ? { video } : {}),
        },
      };
      const response = await fetch("/api/content", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "portfolio", ...item }) });
      const body = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(body?.error ?? "Could not save this portfolio item.");
      setItems([item, ...items]);
      setModal(false);
      setPrefillMedia(null);
      setRecentMedia(null);
      form.reset();
      setNotice(item.status === "published" ? "Published — it is now live on the website." : "Draft saved. Publish it whenever you are ready.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save this portfolio item.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(item: Item) {
    const status = item.status === "published" ? "unpublished" : "published";
    const response = await fetch(`/api/content/${item.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
    if (response.ok) { setItems(items.map((current) => current.id === item.id ? { ...current, status } : current)); setNotice(status === "published" ? "Published to the portfolio." : "Unpublished from the public portfolio."); }
    else setNotice("Your admin session has expired. Enter your PIN again to continue.");
  }

  async function deleteItem(item: Item) {
    if (!window.confirm(`Remove “${item.title}” from the portfolio?`)) return;
    const response = await fetch(`/api/content/${item.id}`, { method: "DELETE" });
    if (response.ok) {
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setNotice("Removed from the portfolio. The record is kept safely in the database.");
    } else {
      setNotice("Could not remove this item. Your admin session may have expired.");
    }
  }

  async function handleLibraryUpload(file: File) {
    setNotice(`Uploading ${file.name}…`);
    try {
      const url = await uploadMedia(file);
      const asset = { id: crypto.randomUUID(), key: url, filename: file.name, contentType: file.type, byteSize: file.size, createdAt: new Date().toISOString(), url };
      setNotice("Upload complete. Choose what to do next.");
      setRecentMedia(asset);
      setMedia((current) => [asset, ...current]);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Upload failed. Try again.");
    }
  }

  async function copyUrl(url: string) {
    await navigator.clipboard?.writeText(url);
    setNotice("Media URL copied. You can paste it into a portfolio item.");
  }

  async function lockAdmin() {
    await fetch("/api/admin/session", { method: "DELETE" });
    window.location.assign("/");
  }

  return <main className="cms-shell">
    <aside className="cms-side"><Link href="/" className="wordmark">AURA<span>STUDIO</span></Link><span className="cms-label">Creator CMS</span><nav aria-label="CMS navigation">{nav.map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item === "Overview" ? "⌘" : "○"}<span>{item}</span></button>)}</nav><div className="cms-user"><span>{name.slice(0, 1).toUpperCase()}</span><div><b>{name}</b><small>{email}</small></div></div><button className="cms-log-out" onClick={lockAdmin}>Lock admin</button></aside>
    <section className="cms-main"><header className="cms-top"><div><p className="cms-kicker">{tab === "Overview" ? "Good morning" : "Content manager"}</p><h1>{tab === "Overview" ? "Your studio, at a glance." : tab}</h1></div><div className="cms-top-actions"><a href="/" target="_blank" className="cms-ghost">View website ↗</a><button className="cms-primary" onClick={() => openNewItem()}>+ Add portfolio item</button></div></header><button className="cms-mobile-add" onClick={() => openNewItem()}>+ Add portfolio item</button>
      {notice && <div className="cms-notice" role="status"><b>Update</b><span>{notice}</span><button onClick={() => setNotice("")}>×</button></div>}
      {tab === "Overview" ? <><div className="cms-metrics"><Metric value={items.length} label="Portfolio videos" note="Content library"/><Metric value={items.filter((item) => item.status === "published").length} label="Published projects" note="Live on website"/><Metric value="—" label="New inquiries" note="Secure database"/><Metric value={media.length || "—"} label="Media assets" note="Images and videos"/></div><div className="cms-panels"><section className="cms-panel wide"><div className="panel-title"><div><span className="cms-kicker">Portfolio status</span><h2>Recent content</h2></div><button onClick={() => setTab("Portfolio")}>Manage all →</button></div><PortfolioTable items={items.slice(0, 4)} onStatus={updateStatus} onDelete={deleteItem}/></section><section className="cms-panel"><div className="panel-title"><div><span className="cms-kicker">Quick actions</span><h2>Keep moving</h2></div></div><div className="quick-actions"><button onClick={() => openNewItem()}>↗ <span>Add new video</span></button><button onClick={() => setTab("Media library")}>▣ <span>Upload media</span></button><button onClick={() => setTab("Inquiries")}>✦ <span>Review inquiries</span></button><button onClick={() => setTab("Site settings")}>⚙ <span>Update site settings</span></button></div></section></div></> : tab === "Portfolio" ? <section className="cms-panel"><div className="panel-title"><div><span className="cms-kicker">All work</span><h2>Portfolio items</h2></div><button className="cms-primary" onClick={() => openNewItem()}>+ Add item</button></div><div className="cms-filter"><input placeholder="Search title, brand or category…" aria-label="Search portfolio" value={search} onChange={(event) => setSearch(event.target.value)}/><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="unpublished">Unpublished</option></select></div>{loading ? <p className="cms-empty">Loading content…</p> : filteredItems.length ? <PortfolioTable items={filteredItems} onStatus={updateStatus} onDelete={deleteItem}/> : <p className="cms-empty">No matching portfolio items.</p>}</section> : tab === "Media library" ? <MediaLibrary assets={media} recent={recentMedia} loading={mediaLoading} onUpload={handleLibraryUpload} onCopy={copyUrl} onUse={openNewItem}/> : <section className="cms-panel empty-state"><span>✦</span><h2>{tab} is ready for your content.</h2><p>Add portfolio work from the button above. Drafts stay private until you publish them.</p><button className="cms-primary" onClick={() => openNewItem()}>Create content</button></section>}
    </section>
    {modal && <div className="cms-modal" role="dialog" aria-modal="true" aria-label="Add portfolio item"><form key={prefillMedia?.id ?? "new"} onSubmit={createItem}><button type="button" className="cms-close" onClick={() => { setModal(false); setPrefillMedia(null); }}>×</button><span className="cms-kicker">New portfolio item</span><h2>{prefillMedia ? "Now choose how it appears." : "Add a beautiful new moment."}</h2><label>Title<input name="title" required placeholder="e.g. The glow-up edit" /></label><label>Brand<input name="brand" required placeholder="Brand or client" /></label><div className="cms-two"><label>Category<select name="category" defaultValue="Beauty"><option>Beauty</option><option>Skincare</option><option>Fashion</option><option>Lifestyle</option><option>Wellness</option></select></label><label>Format<select name="format" defaultValue="Product Demo"><option>Product Demo</option><option>Unboxing</option><option>Testimonial</option><option>Voiceover</option><option>Aesthetic B-roll</option><option>Try-on</option></select></label></div><label>Cover image source<select name="imageSource" defaultValue={prefillMedia && !prefillMedia.contentType.startsWith("video/") ? "url" : "phone"}><option value="phone">Upload from phone</option><option value="url">Image URL</option><option value="drive">Google Drive link</option></select><input name="image" type="text" defaultValue={prefillMedia && !prefillMedia.contentType.startsWith("video/") ? prefillMedia.url : ""} placeholder="Paste image URL or Drive link" /><input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp,image/avif" /><span className="field-hint">Phone: choose a JPG, PNG, WebP or AVIF file. Drive: set sharing to “Anyone with the link”.</span></label><label>Video source<select name="videoSource" defaultValue={prefillMedia?.contentType.startsWith("video/") ? "url" : "none"}><option value="none">No video</option><option value="phone">Upload from phone</option><option value="url">Direct / YouTube / Vimeo URL</option><option value="drive">Google Drive link</option><option value="instagram">Instagram post or reel URL</option></select><input name="video" type="text" defaultValue={prefillMedia?.contentType.startsWith("video/") ? prefillMedia.url : ""} placeholder="Paste the selected source link" /><input name="videoFile" type="file" accept="video/mp4,video/webm" /><span className="field-hint">Instagram must be a public post/reel/TV link (not a profile or story). Videos up to 20 MB.</span></label><label>Publishing status<select name="status" defaultValue="draft"><option value="draft">Save as draft</option><option value="published">Publish now</option></select></label><button className="cms-primary" disabled={saving} type="submit">{saving ? "Saving…" : "Save portfolio item →"}</button></form></div>}
  </main>;
}

function Metric({ value, label, note }: { value: string | number; label: string; note: string }) { return <article className="cms-metric"><strong>{value}</strong><span>{label}</span><small>{note}</small></article>; }
function PortfolioTable({ items, onStatus, onDelete }: { items: Item[]; onStatus: (item: Item) => void; onDelete: (item: Item) => void }) { return <div className="portfolio-table"><div className="table-row table-head"><span>Item</span><span>Status</span><span>Category</span><span>Actions</span></div>{items.map((item) => <div className="table-row" key={item.id}><span className="table-item">{item.data.image && <img src={item.data.image} alt=""/>}<b>{item.title}<small>{item.data.brand || "Untitled brand"}</small></b></span><span><i className={`status ${item.status}`} />{item.status}</span><span>{item.data.category || "—"}</span><span className="table-actions"><button onClick={() => onStatus(item)}>{item.status === "published" ? "Unpublish" : "Publish"}</button><button className="table-delete" onClick={() => onDelete(item)}>Delete</button></span></div>)}</div>; }
function MediaLibrary({ assets, recent, loading, onUpload, onCopy, onUse }: { assets: MediaAsset[]; recent: MediaAsset | null; loading: boolean; onUpload: (file: File) => void; onCopy: (url: string) => void; onUse: (asset: MediaAsset) => void }) {
  return <section className="cms-panel media-panel"><div><span className="cms-kicker">Optimised storage</span><h2>Media library</h2><p>Upload a cover image or video here. After upload, click <b>Add to portfolio</b> to choose its category and publish it.</p><label className="drop-zone"><input type="file" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm" onChange={(event) => event.target.files?.[0] && onUpload(event.target.files[0])}/><b>Choose image or video</b><span>or drop a file here</span></label>{recent && <div className="media-next-step"><div><b>Upload complete</b><span>{recent.filename}</span></div><button onClick={() => onUse(recent)}>Add to portfolio →</button></div>}</div><div className="media-assets"><div className="panel-title"><div><span className="cms-kicker">Your uploads</span><h2>{assets.length} files</h2></div></div>{loading ? <p className="cms-empty">Loading media…</p> : assets.length ? assets.map((asset) => <div className="media-asset" key={asset.id}><span className="media-asset-icon">{asset.contentType.startsWith("video/") ? "▶" : "▧"}</span><div><b>{asset.filename}</b><small>{formatBytes(asset.byteSize)} · {asset.contentType}</small></div><button onClick={() => onUse(asset)}>Add to portfolio</button><button onClick={() => onCopy(asset.url)}>Copy URL</button></div>) : <p className="cms-empty">Your uploaded files will appear here.</p>}</div></section>;
}
function formatBytes(bytes: number) { if (!bytes) return "—"; if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`; return `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }
