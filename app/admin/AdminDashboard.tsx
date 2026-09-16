"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type Item = { id: string; title: string; status: string; position: number; data: { brand?: string; category?: string; format?: string; image?: string } };

const sampleItems: Item[] = [
  { id: "demo-1", title: "The glow-up edit", status: "published", position: 1, data: { brand: "Luminous Skin", category: "Skincare", format: "Aesthetic B-roll", image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=500&q=70" } },
  { id: "demo-2", title: "Sunday reset", status: "draft", position: 2, data: { brand: "Self-care ritual", category: "Lifestyle", format: "Voiceover", image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=500&q=70" } },
];

const nav = ["Overview", "Portfolio", "Case studies", "Brands", "Testimonials", "Inquiries", "Media library", "Site settings"];

export default function AdminDashboard({ email, name }: { email: string; name: string }) {
  const [tab, setTab] = useState("Overview");
  const [items, setItems] = useState<Item[]>(sampleItems);
  const [modal, setModal] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/content?type=portfolio")
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => data.records?.length && setItems(data.records))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  async function createItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const item: Item = { id: crypto.randomUUID(), title: String(data.title), status: String(data.status), position: items.length + 1, data: { brand: String(data.brand), category: String(data.category), format: String(data.format), image: String(data.image) || "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=700&q=80" } };
    const response = await fetch("/api/content", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "portfolio", ...item }) });
    if (response.ok) { setItems([item, ...items]); setModal(false); setNotice(item.status === "published" ? "Published — it will appear in the public portfolio on refresh." : "Draft saved safely in your workspace."); }
    else setNotice("Your access is protected. Add your email to ADMIN_EMAILS before publishing from production.");
  }

  async function updateStatus(item: Item) {
    const status = item.status === "published" ? "unpublished" : "published";
    const response = await fetch(`/api/content/${item.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
    if (response.ok) { setItems(items.map((current) => current.id === item.id ? { ...current, status } : current)); setNotice(status === "published" ? "Published to the portfolio." : "Unpublished from the public portfolio."); }
    else setNotice("Publishing requires an approved admin session.");
  }

  async function uploadMedia(file: File) {
    setNotice(`Uploading ${file.name}…`);
    const response = await fetch(`/api/media?name=${encodeURIComponent(file.name)}`, { method: "POST", headers: { "content-type": file.type || "application/octet-stream" }, body: file });
    setNotice(response.ok ? "Uploaded to your media library. Copy the returned URL into a portfolio item." : "Media upload requires an approved admin session.");
  }

  return <main className="cms-shell">
    <aside className="cms-side"><Link href="/" className="wordmark">AURA<span>STUDIO</span></Link><span className="cms-label">Creator CMS</span><nav aria-label="CMS navigation">{nav.map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item === "Overview" ? "⌘" : "○"}<span>{item}</span></button>)}</nav><div className="cms-user"><span>{name.slice(0,1).toUpperCase()}</span><div><b>{name}</b><small>{email}</small></div></div><a className="cms-log-out" href="/signout-with-chatgpt?return_to=/">Sign out</a></aside>
    <section className="cms-main"><header className="cms-top"><div><p className="cms-kicker">{tab === "Overview" ? "Good morning" : "Content manager"}</p><h1>{tab === "Overview" ? "Your studio, at a glance." : tab}</h1></div><div className="cms-top-actions"><a href="/" target="_blank" className="cms-ghost">View website ↗</a><button className="cms-primary" onClick={() => setModal(true)}>+ Add portfolio item</button></div></header>
      {notice && <div className="cms-notice" role="status"><b>Update</b><span>{notice}</span><button onClick={() => setNotice("")}>×</button></div>}
      {tab === "Overview" ? <><div className="cms-metrics"><Metric value={items.length} label="Portfolio videos" note="Content library"/><Metric value={items.filter((item) => item.status === "published").length} label="Published projects" note="Live on website"/><Metric value="—" label="New inquiries" note="Secure database"/><Metric value="—" label="Media assets" note="R2 storage"/></div><div className="cms-panels"><section className="cms-panel wide"><div className="panel-title"><div><span className="cms-kicker">Portfolio status</span><h2>Recent content</h2></div><button onClick={() => setTab("Portfolio")}>Manage all →</button></div><PortfolioTable items={items.slice(0,4)} onStatus={updateStatus}/></section><section className="cms-panel"><div className="panel-title"><div><span className="cms-kicker">Quick actions</span><h2>Keep moving</h2></div></div><div className="quick-actions"><button onClick={() => setModal(true)}>↗ <span>Add new video</span></button><button onClick={() => setTab("Media library")}>▣ <span>Upload media</span></button><button onClick={() => setTab("Inquiries")}>✦ <span>Review inquiries</span></button><button onClick={() => setTab("Site settings")}>⚙ <span>Update site settings</span></button></div></section></div></> : tab === "Portfolio" ? <section className="cms-panel"><div className="panel-title"><div><span className="cms-kicker">All work</span><h2>Portfolio items</h2></div><button className="cms-primary" onClick={() => setModal(true)}>+ Add item</button></div><div className="cms-filter"><input placeholder="Search portfolio…" aria-label="Search portfolio"/><select defaultValue="all"><option value="all">All statuses</option><option>Published</option><option>Draft</option><option>Unpublished</option></select></div>{loading ? <p className="cms-empty">Loading content…</p> : <PortfolioTable items={items} onStatus={updateStatus}/>}</section> : tab === "Media library" ? <section className="cms-panel media-panel"><div><span className="cms-kicker">Optimised storage</span><h2>Media library</h2><p>Upload a cover image, video or press kit. Large media lives in object storage, never in your website code.</p></div><label className="drop-zone"><input type="file" accept="image/*,video/*,application/pdf" onChange={(event) => event.target.files?.[0] && uploadMedia(event.target.files[0])}/><b>Drop a file here</b><span>or choose from your device</span></label></section> : <section className="cms-panel empty-state"><span>✦</span><h2>{tab} is ready for your content.</h2><p>The shared content model supports drafts, publication, ordering and automatic website updates. Add your first record or connect the production admin allowlist to start managing it securely.</p><button className="cms-primary" onClick={() => setModal(true)}>Create content</button></section>}
    </section>
    {modal && <div className="cms-modal" role="dialog" aria-modal="true" aria-label="Add portfolio item"><form onSubmit={createItem}><button type="button" className="cms-close" onClick={() => setModal(false)}>×</button><span className="cms-kicker">New portfolio item</span><h2>Add a beautiful new moment.</h2><label>Title<input name="title" required placeholder="e.g. The glow-up edit" /></label><label>Brand<input name="brand" required placeholder="Brand or client" /></label><div className="cms-two"><label>Category<select name="category" defaultValue="Beauty"><option>Beauty</option><option>Skincare</option><option>Fashion</option><option>Lifestyle</option><option>Wellness</option></select></label><label>Format<select name="format" defaultValue="Product Demo"><option>Product Demo</option><option>Unboxing</option><option>Testimonial</option><option>Voiceover</option><option>Aesthetic B-roll</option></select></label></div><label>Cover image URL<input name="image" type="url" placeholder="https://…" /></label><label>Publishing status<select name="status" defaultValue="draft"><option value="draft">Save as draft</option><option value="published">Publish now</option></select></label><button className="cms-primary" type="submit">Save portfolio item →</button></form></div>}
  </main>;
}

function Metric({ value, label, note }: { value: string | number; label: string; note: string }) { return <article className="cms-metric"><strong>{value}</strong><span>{label}</span><small>{note}</small></article>; }
function PortfolioTable({ items, onStatus }: { items: Item[]; onStatus: (item: Item) => void }) { return <div className="portfolio-table"><div className="table-row table-head"><span>Item</span><span>Status</span><span>Category</span><span /></div>{items.map((item) => <div className="table-row" key={item.id}><span className="table-item">{item.data.image && <img src={item.data.image} alt=""/>}<b>{item.title}<small>{item.data.brand || "Untitled brand"}</small></b></span><span><i className={`status ${item.status}`} />{item.status}</span><span>{item.data.category || "—"}</span><button onClick={() => onStatus(item)}>{item.status === "published" ? "Unpublish" : "Publish"}</button></div>)}</div>; }
