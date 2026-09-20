"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type PortfolioItem = {
  id: string;
  title: string;
  brand: string;
  category: string;
  format: string;
  image: string;
  video?: string;
  tint: string;
};

const starterWork: PortfolioItem[] = [
  { id: "glow", title: "The glow-up edit", brand: "Sample brief · skincare", category: "Skincare", format: "Aesthetic B-roll", image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=900&q=85", tint: "rose" },
  { id: "ritual", title: "Sunday reset", brand: "Concept · self-care", category: "Lifestyle", format: "Voiceover", image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=85", tint: "lilac" },
  { id: "unboxed", title: "The unboxing feeling", brand: "Sample brief · beauty", category: "Beauty", format: "Unboxing", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=85", tint: "coral" },
  { id: "morning", title: "Morning, made easy", brand: "Concept · wellness", category: "Wellness", format: "Product Demo", image: "https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=900&q=85", tint: "cream" },
  { id: "soft", title: "Soft tailoring", brand: "Concept · fashion", category: "Fashion", format: "Try-on", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85", tint: "plum" },
  { id: "matcha", title: "A little ritual", brand: "Sample brief · lifestyle", category: "Lifestyle", format: "Testimonial", image: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=900&q=85", tint: "sage" },
];

const filters = ["All", "Beauty", "Skincare", "Fashion", "Lifestyle", "Wellness", "Product Demo", "Unboxing", "Testimonial", "Voiceover", "Aesthetic B-roll"];

const faq = [
  ["What kinds of brands do you work with?", "I partner with beauty, skincare, fashion, wellness and considered consumer brands that value clear, human storytelling."],
  ["What is a typical turnaround?", "Most single-content projects are delivered within 3–5 business days once the brief and product arrive. Timelines are confirmed before booking."],
  ["Can you create content for paid ads?", "Yes. Concepts can be structured for organic, paid, whitelisted and multi-platform use. Usage is scoped separately so rights are clear."],
  ["Do you provide concepts and scripts?", "Absolutely. Every project begins with a focused creative direction, hook options and a shot plan tailored to the campaign goal."],
];

const services = [
  ["01", "UGC video creation", "Natural, polished short-form that makes the product feel like part of the conversation."],
  ["02", "Paid social creative", "Concept-led assets designed to earn attention in the first second and guide action."],
  ["03", "Product storytelling", "Demonstrations, unboxings and routines that turn product details into a feeling."],
  ["04", "Monthly content", "A flexible creative rhythm for brands that need fresh, on-brand ideas every month."],
];

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <span className={diagonal ? "arrow diagonal" : "arrow"} aria-hidden="true">→</span>;
}

function embedVideoUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return `https://www.youtube.com/embed/${url.pathname.slice(1).split("/")[0]}`;
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = url.searchParams.get("v") || url.pathname.match(/\/(?:shorts|embed)\/([^/]+)/)?.[1];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = url.pathname.match(/\/(?:video\/)?(\d+)/)?.[1];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    if (host === "drive.google.com") {
      const id = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] || url.searchParams.get("id");
      return id ? `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview` : null;
    }
    if (host === "instagram.com") {
      const match = url.pathname.match(/^\/(p|reel|tv)\/([^/]+)/);
      return match ? `https://www.instagram.com/${match[1]}/${match[2]}/embed` : null;
    }
  } catch { return null; }
  return null;
}

function PortfolioMedia({ item }: { item: PortfolioItem }) {
  if (!item.video) return <div className="modal-media"><img src={item.image} alt={`${item.brand} project preview`} /><span className="modal-play">▶</span></div>;
  const embed = embedVideoUrl(item.video);
  if (embed) return <div className="modal-media modal-video-embed"><iframe src={embed} title={`${item.title} video`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>;
  return <div className="modal-media"><video controls playsInline preload="metadata" poster={item.image}><source src={item.video} /></video></div>;
}

export default function Home() {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<PortfolioItem | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [work, setWork] = useState(starterWork);

  useEffect(() => {
    document.body.classList.add("aura-site");
    fetch("/api/content?type=portfolio&status=published")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        const records = (data as { records?: Array<{ id: string; title: string; data?: Partial<PortfolioItem> }> } | null)?.records;
        if (!records?.length) return;
        const remote: PortfolioItem[] = records.map((record, index) => ({
          id: record.id,
          title: record.title,
          brand: record.data?.brand || "Studio project",
          category: record.data?.category || "Beauty",
          format: record.data?.format || "Product Demo",
          image: record.data?.image || starterWork[index % starterWork.length].image,
          tint: record.data?.tint || starterWork[index % starterWork.length].tint,
          ...(record.data?.video ? { video: record.data.video } : {}),
        }));
        setWork(remote);
      })
      .catch(() => undefined);
    return () => document.body.classList.remove("aura-site");
  }, []);

  useEffect(() => {
    const dismissMenu = () => setMenuOpen(false);
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismissMenu();
    };
    const dismissOnDesktop = () => {
      if (window.innerWidth > 760) dismissMenu();
    };

    window.addEventListener("hashchange", dismissMenu);
    window.addEventListener("scroll", dismissMenu, { passive: true });
    window.addEventListener("keydown", dismissOnEscape);
    window.addEventListener("resize", dismissOnDesktop);
    return () => {
      window.removeEventListener("hashchange", dismissMenu);
      window.removeEventListener("scroll", dismissMenu);
      window.removeEventListener("keydown", dismissOnEscape);
      window.removeEventListener("resize", dismissOnDesktop);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const motionTargets = Array.from(document.querySelectorAll<HTMLElement>(
      ".hero-copy, .hero-art, .section-head, .work-card, .about-art, .about-copy, .results-header, .case-study, .service-card, .package-callout, .process-heading, .process-list, .testimonial, .kit-card, .feed-grid a, .faq-list, .contact-copy, .inquiry-form"
    ));
    motionTargets.forEach((element, index) => {
      element.classList.add("motion-reveal");
      element.style.setProperty("--motion-delay", `${Math.min(index * 35, 280)}ms`);
    });
    body.classList.add("motion-ready");

    const observer = "IntersectionObserver" in window
      ? new IntersectionObserver((entries) => entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer?.unobserve(entry.target);
          }
        }), { threshold: 0.12, rootMargin: "0px 0px -7%" })
      : null;
    if (observer) motionTargets.forEach((element) => observer.observe(element));
    else motionTargets.forEach((element) => element.classList.add("is-visible"));

    const onPointerMove = (event: PointerEvent) => {
      if (!window.matchMedia("(pointer:fine)").matches) return;
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      root.style.setProperty("--pointer-x", x.toFixed(3));
      root.style.setProperty("--pointer-y", y.toFixed(3));
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      observer?.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      body.classList.remove("motion-ready");
      root.style.removeProperty("--pointer-x");
      root.style.removeProperty("--pointer-y");
    };
  }, []);

  const visibleWork = useMemo(() => filter === "All" ? work : work.filter((item) => item.category === filter || item.format === filter), [filter, work]);

  async function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setSent(false);
    setFormError("");
    try {
      const response = await fetch("/api/inquiries", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) });
      const body = await response.json().catch(() => null) as { accepted?: boolean; emailSent?: boolean; error?: string } | null;
      if (!response.ok || !body?.accepted) throw new Error(body?.error || "We could not send that inquiry. Please try again.");
      setEmailSent(Boolean(body.emailSent));
      setSent(true);
      event.currentTarget.reset();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "We could not send that inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main id="content">
      <a className="skip-link" href="#content">Skip to content</a>
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      {menuOpen && <button type="button" className="nav-scrim" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)} />}
      <header className="nav-wrap">
        <nav className="nav" aria-label="Main navigation">
          <a href="#top" className="wordmark" aria-label="Aura Studio home">AURA<span>STUDIO</span></a>
          <button className="nav-toggle" aria-expanded={menuOpen} aria-controls="main-links" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? "Close" : "Menu"}</button>
          <div className={menuOpen ? "nav-links is-open" : "nav-links"} id="main-links">
            <a href="#about" onClick={() => setMenuOpen(false)}>About</a><a href="#portfolio" onClick={() => setMenuOpen(false)}>Work</a><a href="#services" onClick={() => setMenuOpen(false)}>Services</a><a href="#results" onClick={() => setMenuOpen(false)}>Results</a><a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
          </div>
          <a className="button button-small nav-cta" href="#contact">Work with me <Arrow /></a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy reveal">
          <p className="eyebrow">UGC creator · beauty, fashion, wellness &amp; lifestyle</p>
          <h1>Content people<br /><em>stop for.</em></h1>
          <p className="hero-text">Thoughtful short-form video for brands that want to look considered, sound clear and earn attention without shouting for it.</p>
          <div className="hero-actions"><a className="button" href="#portfolio">View my work <Arrow /></a><a className="text-link" href="#contact">Let’s work together <Arrow diagonal /></a></div>
          <div className="hero-proof"><p><strong>Bangladesh-based creative partner.</strong><br />Available for selected collaborations worldwide.</p></div>
        </div>
        <div className="hero-art" aria-label="Creator filming a beauty review">
          <div className="hero-device"><img src="/assets/aura-hero.png" alt="Creator recording a skincare review" /><div className="rec-dot" /><div className="device-caption"><span>UGC / 01</span><b>Beauty in motion</b></div></div>
          <span className="scroll-note">SELECTED WORK <i /></span>
        </div>
      </section>

      <section className="stats-section section-pad" aria-label="Studio principles"><div className="stat-grid"><div><strong>Native</strong><p>social-first storytelling</p></div><div><strong>Intentional</strong><p>creative direction, always</p></div><div><strong>Polished</strong><p>edit-ready delivery</p></div><div><strong>BD<span>↗</span></strong><p>available worldwide</p></div></div></section>

      <section className="marquee-section" aria-label="Collaboration styles"><p>Beauty &nbsp; · &nbsp; Skincare &nbsp; · &nbsp; Fashion &nbsp; · &nbsp; Wellness &nbsp; · &nbsp; Lifestyle &nbsp; · &nbsp; Beauty &nbsp; · &nbsp; Skincare &nbsp; · &nbsp; Fashion &nbsp; · &nbsp; Wellness &nbsp; · &nbsp; Lifestyle</p></section>

      <section className="portfolio section-pad" id="portfolio"><div className="section-head"><div><p className="eyebrow">Selected work</p><h2>Built for the <em>scroll.</em><br />Made to <span>stay.</span></h2></div><p>A living edit of organic-feeling content, created with commercial intention.</p></div>
        <div className="filter-row" role="tablist" aria-label="Portfolio filters">{filters.map((item) => <button key={item} role="tab" aria-selected={filter === item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div>
        <div className="work-grid">{visibleWork.map((item, index) => <button className={`work-card work-${index % 6}`} key={item.id} onClick={() => setSelected(item)} aria-label={`Watch ${item.title}, ${item.brand}`}><img src={item.image} alt="" /><span className={`wash ${item.tint}`} /><span className="play">▶</span><span className="work-meta"><small>{item.brand} · {item.format}</small><b>{item.title}</b></span></button>)}</div>
        <a className="outline-button" href="#contact">Request the full portfolio <Arrow /></a>
      </section>

      <section className="about section-pad" id="about"><div className="about-art"><div className="about-frame"><img src="https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=900&q=85" alt="Editorial creator portrait" /></div><span className="hand-note">kind, clear<br />and always<br /><em>intentional.</em></span><span className="about-star">✦</span></div><div className="about-copy"><p className="eyebrow">The person behind the point of view</p><h2>Your brand deserves content people actually <em>want</em> to watch.</h2><p>I’m Shadia — a Bangladesh-based creator with an eye for the nuance that turns a product mention into a moment. I make content that feels native to the feed, considered in the details and easy to believe in.</p><div className="pills"><span>Beauty rituals</span><span>Everyday luxury</span><span>Product education</span><span>Paid social</span></div><a href="#contact" className="text-link">Get to know my process <Arrow diagonal /></a></div></section>

      <section className="results section-pad" id="results"><div className="results-header"><p className="eyebrow">Proof, not promises</p><h2>Pretty is just the<br /><em>beginning.</em></h2><p>Each sample case study shows how Shadia turns a product detail into an easy-to-watch story. Confirmed client metrics can be added privately through the Creator CMS.</p></div><div className="case-study"><div className="case-visual"><span className="sample-label">ILLUSTRATIVE CONCEPT</span><div className="chart"><i /><i /><i /><i /><i /><i /><i /><i /></div><p>Story-led product demo<br /><b>+42%</b> sample completion lift</p></div><div className="case-copy"><span className="case-tag">Skincare · Product demo</span><h3>From ingredient list to a reason to care.</h3><p><b>The brief</b> — Translate product texture and active ingredients into a moment viewers could picture in their own routine.</p><p><b>The direction</b> — A close, tactile routine with a natural voiceover and an opening hook grounded in a familiar skincare frustration.</p><div className="case-tags"><span>Hook development</span><span>Voiceover</span><span>9:16 edit</span></div><a className="text-link" href="#contact">Discuss a case study <Arrow diagonal /></a></div></div></section>

      <section className="services section-pad" id="services"><div className="section-head"><div><p className="eyebrow">Ways we can work together</p><h2>Creative that earns its <em>place</em> in the feed.</h2></div><a className="text-link desktop-only" href="#contact">Explore services <Arrow diagonal /></a></div><div className="service-grid">{services.map(([number, title, description]) => <article className="service-card" key={title}><span>{number}</span><h3>{title}</h3><p>{description}</p><Arrow diagonal /></article>)}</div><div className="package-callout"><div><span className="eyebrow">Monthly content partnerships</span><h3>A beautiful system<br />for staying <em>fresh.</em></h3></div><p>For teams who need a steady stream of compelling creative, without starting from scratch every month.</p><a className="button button-light" href="#contact">Get a custom quote <Arrow /></a></div></section>

      <section className="process section-pad"><div className="process-heading"><p className="eyebrow">A smooth process</p><h2>Clear from<br /><em>first hello</em> to final file.</h2></div><ol className="process-list"><li><b>01</b><span>Inquiry</span><p>Goals, deliverables and fit.</p></li><li><b>02</b><span>Creative direction</span><p>Hooks, concept and shot plan.</p></li><li><b>03</b><span>Production</span><p>Thoughtful filming and editing.</p></li><li><b>04</b><span>Delivery</span><p>Polished files in 3–5 business days.</p></li></ol></section>

      <section className="testimonial section-pad"><div className="quote-mark">“</div><blockquote>“Shadia made our product feel instantly easy to understand — warm, clean and ready to stop the scroll.”</blockquote><div className="quote-by"><span>Sample client feedback</span><b>Beauty campaign · UGC concept</b></div><div className="quote-progress"><i /><i /><i /></div></section>

      <section className="media-kit section-pad"><div className="kit-card"><div><p className="eyebrow">The media kit</p><h2>Everything your team needs, in one <em>beautiful</em> place.</h2><p>Audience details, collaboration formats and a clear way to get in touch — prepared for beauty, fashion, wellness and lifestyle brands.</p><a className="button" href="#contact">Request media kit <Arrow /></a></div><aside><span>CREATOR<br />PROFILE</span><b>SHADIA<span>°</span></b><small>Beauty · Fashion · Wellness<br />Bangladesh / available worldwide</small><i>✦</i></aside></div></section>

      <section className="social-feed section-pad"><div className="section-head"><div><p className="eyebrow">From the studio</p><h2>Follow the<br /><em>creative process.</em></h2></div><p>Behind-the-scenes frames, campaign ideas and everyday beauty rituals from Shadia in Bangladesh.</p></div><div className="feed-grid"><a href="https://www.instagram.com/rayat66210?stkn=eW51Z2E5c3lrYnRq" target="_blank" rel="noreferrer"><span className="feed-number">01</span><b>Behind the camera</b><small>Instagram · @rayat66210</small></a><a href="https://www.tiktok.com/@raha_creates" target="_blank" rel="noreferrer"><span className="feed-number">02</span><b>New campaign energy</b><small>TikTok · @raha_creates</small></a><a href="#contact"><span className="feed-number">03</span><b>The little details</b><small>Process notes</small></a></div><div className="social-actions"><a className="outline-button" href="https://www.instagram.com/rayat66210?stkn=eW51Z2E5c3lrYnRq" target="_blank" rel="noreferrer">Instagram <Arrow diagonal /></a><a className="outline-button" href="https://www.tiktok.com/@raha_creates" target="_blank" rel="noreferrer">TikTok <Arrow diagonal /></a></div></section>

      <section className="faq section-pad" id="faq"><div className="section-head"><div><p className="eyebrow">Good to know</p><h2>Your questions,<br /><em>answered.</em></h2></div><p>Need something not covered here? I’m happy to talk through the details before we build a brief.</p></div><div className="faq-list">{faq.map(([question, answer], index) => <article key={question} className={openFaq === index ? "faq-item open" : "faq-item"}><button onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index}><span>{question}</span><b>{openFaq === index ? "−" : "+"}</b></button><div><p>{answer}</p></div></article>)}</div></section>

      <section className="contact section-pad" id="contact"><div className="contact-glow" /><div className="contact-copy"><p className="eyebrow">Start a project</p><h2>Let’s create something worth <em>stopping</em> for.</h2><p>Share a little about what’s on your mind. Shadia usually replies within one business day.</p><a href="mailto:shadia.creates@gmail.com" className="text-link">shadia.creates@gmail.com <Arrow diagonal /></a><p className="contact-location">Bangladesh · 3–5 business day delivery</p></div><form className="inquiry-form" onSubmit={submitInquiry}>{sent && <div className="form-success" role="status"><b>Received beautifully.</b><span>{emailSent ? "Your inquiry was emailed to Shadia." : "Your inquiry is saved securely in the admin inbox."}</span></div>}{formError && <div className="form-error" role="alert">{formError}</div>}<label>Name<input name="name" required placeholder="Your name" /></label><label>Brand or company<input name="brand" required placeholder="Brand name" /></label><label>Email<input type="email" name="email" required placeholder="you@brand.com" /></label><label>Project type<select name="projectType" defaultValue=""><option value="" disabled>Select one</option><option>UGC video creation</option><option>Paid social creative</option><option>Product demo or unboxing</option><option>Monthly content</option><option>Something else</option></select></label><label className="form-wide">Tell me about the project<textarea name="message" required placeholder="Goals, timing, deliverables and anything helpful…" rows={4} /></label><button className="button form-wide" type="submit" disabled={submitting}>{submitting ? "Sending…" : "Send collaboration inquiry"} <Arrow /></button><p className="form-note">By sending, you agree that Shadia Creates can respond to your inquiry.</p></form></section>

      <footer><a href="#top" className="wordmark">AURA<span>STUDIO</span></a><p>Creator-led content for brands with something worth sharing.</p><div><a href="#portfolio">Work</a><a href="#services">Services</a><a href="#contact">Contact</a><a href="/admin">Creator login</a></div><small>© {new Date().getFullYear()} Shadia Noor Mou. Built with intention.</small></footer>

      {selected && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`${selected.title} portfolio preview`} onMouseDown={() => setSelected(null)}><div className="work-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" aria-label="Close preview" onClick={() => setSelected(null)}>×</button><PortfolioMedia item={selected}/><div className="modal-copy"><p className="eyebrow">{selected.brand} · {selected.format}</p><h3>{selected.title}</h3><p>{selected.video ? "Watch the full portfolio video." : "Add a video link through the Creator CMS to make this preview playable."}</p><a href="#contact" className="button" onClick={() => setSelected(null)}>Start a similar project <Arrow /></a></div></div></div>}
    </main>
  );
}
