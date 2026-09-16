"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type PortfolioItem = {
  id: string;
  title: string;
  brand: string;
  category: string;
  format: string;
  image: string;
  tint: string;
};

const starterWork: PortfolioItem[] = [
  { id: "glow", title: "The glow-up edit", brand: "Luminous Skin", category: "Skincare", format: "Aesthetic B-roll", image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=900&q=85", tint: "rose" },
  { id: "ritual", title: "Sunday reset", brand: "Self-care ritual", category: "Lifestyle", format: "Voiceover", image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=85", tint: "lilac" },
  { id: "unboxed", title: "The unboxing feeling", brand: "Kindly Co.", category: "Beauty", format: "Unboxing", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=85", tint: "coral" },
  { id: "morning", title: "Morning, made easy", brand: "Nourish Daily", category: "Wellness", format: "Product Demo", image: "https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=900&q=85", tint: "cream" },
  { id: "soft", title: "Soft tailoring", brand: "The Edit", category: "Fashion", format: "Try-on", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85", tint: "plum" },
  { id: "matcha", title: "A little ritual", brand: "Sunday Studio", category: "Lifestyle", format: "Testimonial", image: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=900&q=85", tint: "sage" },
];

const filters = ["All", "Beauty", "Skincare", "Fashion", "Lifestyle", "Wellness", "Product Demo", "Unboxing", "Testimonial", "Voiceover", "Aesthetic B-roll"];

const faq = [
  ["What kinds of brands do you work with?", "I partner with beauty, skincare, fashion, wellness and considered consumer brands that value clear, human storytelling."],
  ["What is a typical turnaround?", "Most single-content projects are delivered within 7–10 business days once the brief and product arrive. Timelines are confirmed before booking."],
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

export default function Home() {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<PortfolioItem | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [work, setWork] = useState(starterWork);

  useEffect(() => {
    document.body.classList.add("aura-site");
    fetch("/api/content?type=portfolio&status=published")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!data?.records?.length) return;
        const remote = data.records.map((record: { id: string; title: string; data?: PortfolioItem; }) => ({ ...record.data, id: record.id, title: record.title || record.data?.title }));
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

  const visibleWork = useMemo(() => filter === "All" ? work : work.filter((item) => item.category === filter || item.format === filter), [filter, work]);

  function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    fetch("/api/inquiries", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) }).catch(() => undefined);
    setSent(true);
    event.currentTarget.reset();
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
          <p className="eyebrow">UGC creator · beauty, wellness &amp; lifestyle</p>
          <h1>Content people<br /><em>stop for.</em></h1>
          <p className="hero-text">Thoughtful short-form video for brands that want to look considered, sound clear and earn attention without shouting for it.</p>
          <div className="hero-actions"><a className="button" href="#portfolio">View my work <Arrow /></a><a className="text-link" href="#contact">Let’s work together <Arrow diagonal /></a></div>
          <div className="hero-proof"><p><strong>UK-based creative partner.</strong><br />Available for selected collaborations worldwide.</p></div>
        </div>
        <div className="hero-art" aria-label="Creator filming a beauty review">
          <div className="hero-device"><img src="/assets/aura-hero.png" alt="Creator recording a skincare review" /><div className="rec-dot" /><div className="device-caption"><span>UGC / 01</span><b>Beauty in motion</b></div></div>
          <span className="scroll-note">SELECTED WORK <i /></span>
        </div>
      </section>

      <section className="stats-section section-pad" aria-label="Studio principles"><div className="stat-grid"><div><strong>Native</strong><p>social-first storytelling</p></div><div><strong>Intentional</strong><p>creative direction, always</p></div><div><strong>Polished</strong><p>edit-ready delivery</p></div><div><strong>UK<span>↗</span></strong><p>available worldwide</p></div></div></section>

      <section className="marquee-section" aria-label="Collaboration styles"><p>Beauty &nbsp; · &nbsp; Skincare &nbsp; · &nbsp; Fashion &nbsp; · &nbsp; Wellness &nbsp; · &nbsp; Lifestyle &nbsp; · &nbsp; Beauty &nbsp; · &nbsp; Skincare &nbsp; · &nbsp; Fashion &nbsp; · &nbsp; Wellness &nbsp; · &nbsp; Lifestyle</p></section>

      <section className="portfolio section-pad" id="portfolio"><div className="section-head"><div><p className="eyebrow">Selected work</p><h2>Built for the <em>scroll.</em><br />Made to <span>stay.</span></h2></div><p>A living edit of organic-feeling content, created with commercial intention.</p></div>
        <div className="filter-row" role="tablist" aria-label="Portfolio filters">{filters.map((item) => <button key={item} role="tab" aria-selected={filter === item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div>
        <div className="work-grid">{visibleWork.map((item, index) => <button className={`work-card work-${index % 6}`} key={item.id} onClick={() => setSelected(item)} aria-label={`Watch ${item.title}, ${item.brand}`}><img src={item.image} alt="" /><span className={`wash ${item.tint}`} /><span className="play">▶</span><span className="work-meta"><small>{item.brand} · {item.format}</small><b>{item.title}</b></span></button>)}</div>
        <a className="outline-button" href="#contact">Request the full portfolio <Arrow /></a>
      </section>

      <section className="about section-pad" id="about"><div className="about-art"><div className="about-frame"><img src="https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=900&q=85" alt="Editorial creator portrait" /></div><span className="hand-note">kind, clear<br />and always<br /><em>intentional.</em></span><span className="about-star">✦</span></div><div className="about-copy"><p className="eyebrow">The person behind the point of view</p><h2>Your brand deserves content people actually <em>want</em> to watch.</h2><p>I’m Aura — a UK-based creator with an eye for the nuance that turns a product mention into a moment. I make the kind of content that feels native to the feed, considered in the details and easy to believe in.</p><div className="pills"><span>Beauty rituals</span><span>Everyday luxury</span><span>Product education</span><span>Paid social</span></div><a href="#contact" className="text-link">Get to know my process <Arrow diagonal /></a></div></section>

      <section className="results section-pad" id="results"><div className="results-header"><p className="eyebrow">Proof, not promises</p><h2>Pretty is just the<br /><em>beginning.</em></h2><p>Every case study is designed to make the creative thinking visible. Metrics below are clearly marked sample placeholders until your own reporting is added in the CMS.</p></div><div className="case-study"><div className="case-visual"><span className="sample-label">DEMO METRICS</span><div className="chart"><i /><i /><i /><i /><i /><i /><i /><i /></div><p>Story-led product demo<br /><b>+42%</b> sample completion lift</p></div><div className="case-copy"><span className="case-tag">Skincare · Product demo</span><h3>From ingredient list to a reason to care.</h3><p><b>The brief</b> — Translate product texture and active ingredients into a moment viewers could picture in their own routine.</p><p><b>The direction</b> — A close, tactile routine with a natural voiceover and an opening hook grounded in a familiar skincare frustration.</p><div className="case-tags"><span>Hook development</span><span>Voiceover</span><span>9:16 edit</span></div><a className="text-link" href="#contact">Discuss a case study <Arrow diagonal /></a></div></div></section>

      <section className="services section-pad" id="services"><div className="section-head"><div><p className="eyebrow">Ways we can work together</p><h2>Creative that earns its <em>place</em> in the feed.</h2></div><a className="text-link desktop-only" href="#contact">Explore services <Arrow diagonal /></a></div><div className="service-grid">{services.map(([number, title, description]) => <article className="service-card" key={title}><span>{number}</span><h3>{title}</h3><p>{description}</p><Arrow diagonal /></article>)}</div><div className="package-callout"><div><span className="eyebrow">Monthly content partnerships</span><h3>A beautiful system<br />for staying <em>fresh.</em></h3></div><p>For teams who need a steady stream of compelling creative, without starting from scratch every month.</p><a className="button button-light" href="#contact">Get a custom quote <Arrow /></a></div></section>

      <section className="process section-pad"><div className="process-heading"><p className="eyebrow">A smooth process</p><h2>Clear from<br /><em>first hello</em> to final file.</h2></div><ol className="process-list"><li><b>01</b><span>Inquiry</span><p>Goals, deliverables and fit.</p></li><li><b>02</b><span>Creative direction</span><p>Hooks, concept and shot plan.</p></li><li><b>03</b><span>Production</span><p>Thoughtful filming and editing.</p></li><li><b>04</b><span>Delivery</span><p>Review-ready files, beautifully organised.</p></li></ol></section>

      <section className="testimonial section-pad"><div className="quote-mark">“</div><blockquote>“Aura took a dense brief and made it feel completely <em>human.</em> Every frame was intentional, but none of it felt over-produced.”</blockquote><div className="quote-by"><span>Client quote placeholder</span><b>Beauty brand / paid social</b></div><div className="quote-progress"><i /><i /><i /></div></section>

      <section className="media-kit section-pad"><div className="kit-card"><div><p className="eyebrow">The media kit</p><h2>Everything your team needs, in one <em>beautiful</em> place.</h2><p>Audience details, current platform insights, collaboration formats and a clear way to get in touch — updated from the CMS when your final kit is ready.</p><a className="button" href="#contact">Request media kit <Arrow /></a></div><aside><span>CREATOR<br />PROFILE</span><b>AURA<span>°</span></b><small>Beauty · Lifestyle · Wellness<br />UK / available worldwide</small><i>✦</i></aside></div></section>

      <section className="social-feed section-pad"><div className="section-head"><div><p className="eyebrow">From the studio</p><h2>Follow the<br /><em>creative process.</em></h2></div><p>Fresh campaign frames, behind-the-scenes notes and ideas in motion. Link your channels in the CMS when you are ready to share.</p></div><div className="feed-grid"><a href="#contact"><span className="feed-number">01</span><b>Behind the camera</b><small>Studio note</small></a><a href="#contact"><span className="feed-number">02</span><b>New campaign energy</b><small>Creative direction</small></a><a href="#contact"><span className="feed-number">03</span><b>The little details</b><small>Process</small></a></div><div className="social-actions"><a className="outline-button" href="#contact">Instagram <Arrow diagonal /></a><a className="outline-button" href="#contact">TikTok <Arrow diagonal /></a><a className="outline-button" href="#contact">YouTube <Arrow diagonal /></a></div></section>

      <section className="faq section-pad" id="faq"><div className="section-head"><div><p className="eyebrow">Good to know</p><h2>Your questions,<br /><em>answered.</em></h2></div><p>Need something not covered here? I’m happy to talk through the details before we build a brief.</p></div><div className="faq-list">{faq.map(([question, answer], index) => <article key={question} className={openFaq === index ? "faq-item open" : "faq-item"}><button onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index}><span>{question}</span><b>{openFaq === index ? "−" : "+"}</b></button><div><p>{answer}</p></div></article>)}</div></section>

      <section className="contact section-pad" id="contact"><div className="contact-glow" /><div className="contact-copy"><p className="eyebrow">Start a project</p><h2>Let’s create something worth <em>stopping</em> for.</h2><p>Share a little about what’s on your mind. I’ll come back to you with the right next step.</p><a href="mailto:hello@aurastudio.example" className="text-link">hello@aurastudio.example <Arrow diagonal /></a></div><form className="inquiry-form" onSubmit={submitInquiry}>{sent && <div className="form-success" role="status"><b>Received beautifully.</b><span>Your inquiry is on its way — I’ll be in touch soon.</span></div>}<label>Name<input name="name" required placeholder="Your name" /></label><label>Brand or company<input name="brand" required placeholder="Brand name" /></label><label>Email<input type="email" name="email" required placeholder="you@brand.com" /></label><label>Project type<select name="projectType" defaultValue=""><option value="" disabled>Select one</option><option>UGC video creation</option><option>Paid social creative</option><option>Monthly content</option><option>Something else</option></select></label><label className="form-wide">Tell me about the project<textarea name="message" required placeholder="Goals, timing, deliverables and anything helpful…" rows={4} /></label><button className="button form-wide" type="submit">Send collaboration inquiry <Arrow /></button><p className="form-note">By sending, you agree that Aura Studio can respond to your inquiry.</p></form></section>

      <footer><a href="#top" className="wordmark">AURA<span>°</span></a><p>Creator-led content for brands with something worth sharing.</p><div><a href="#portfolio">Work</a><a href="#services">Services</a><a href="#contact">Contact</a><a href="/admin">Creator login</a></div><small>© {new Date().getFullYear()} Aura Studio. Built with intention.</small></footer>

      {selected && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`${selected.title} portfolio preview`} onMouseDown={() => setSelected(null)}><div className="work-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" aria-label="Close preview" onClick={() => setSelected(null)}>×</button><div className="modal-media"><img src={selected.image} alt={`${selected.brand} project preview`} /><span className="modal-play">▶</span></div><div className="modal-copy"><p className="eyebrow">{selected.brand} · {selected.format}</p><h3>{selected.title}</h3><p>Portfolio preview. Replace with your own hosted video or external URL through the Creator CMS.</p><a href="#contact" className="button" onClick={() => setSelected(null)}>Start a similar project <Arrow /></a></div></div></div>}
    </main>
  );
}
