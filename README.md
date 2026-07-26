# djoaniel-site

The portfolio of Djoaniel Hernandez. Target domain: **djoaniel.com** (root, no subfolder).

Static HTML, no build step, no dependencies. Deployed on Vercel from GitHub —
any push to `main` ships.

> Superseded 2026-07-26: this repo previously held a redirect placeholder pointing at
> `djoaniel.framer.website`. The redirect is gone; the real build is here. The remote
> is behind the local, not ahead of it.

## Structure

```
index.html                    the console — viewport-locked, no page scroll
assets/eishiki-v3.css         the design system (paper/ink/blue, hairlines, zero radius)
assets/eishiki-v3.js          interaction for the case studies
work/no-value.html            case study — null-value standard, private wealth
work/tessa.html               case study — conversational career coach
work/sarisari-snaps.html      case study — configurator, own product
work/accessibility-lab.html   the playable WCAG 2.2 AA audit lab
type-lock.html                evidence for the 24px Instrument Serif floor
vercel.json                   cleanUrls
```

The homepage carries its own CSS inline — it's a single self-contained document and
does not load `eishiki-v3.css`. The case studies do. **These two are not yet
reconciled.**

## Deploy

```bash
git add -A
git commit -m "…"
git push
```

Vercel builds on push. `cleanUrls` is on, so `/work/no-value` resolves as well as
`/work/no-value.html` — internal links use the `.html` form and there is no
`canonical`, so both URLs currently serve the same page.

## Known open items

Full backlog in `../docs/AUDIT-2026-07-25.md`. The ones that cost a first impression:

- **Cards 04–06 on the homepage are `href="#"`** — Rudy Project, Altared State and Brady/Emedco have no destinations. Two of them say "Awaiting content" out loud.
- **The case studies still link to `../index.html#work` / `#about` / `#archive`** — those anchors no longer exist on the console homepage. Dead links in every case-study header.
- **The case studies still load Instrument Sans**, which the type lock removes from the system entirely.
- **No LinkedIn, no CV, no OG tags, no favicon.** One `mailto:` is the entire contact surface.
- **`accessibility-lab.html` is linked from nowhere.** It's the most differentiating piece in the folder.

## The rules this site is built against

`../NORTH-STAR.md` is the spine — purpose, thesis, the locked type scale and palette,
the height budget, and the launch gate. Read it before making a structural change.

Two that get broken by accident:

- **Instrument Serif never renders below 24px.** Under that, titles swap to Radio Canada 700.
- **Page scroll breaks the console.** Pane-internal scroll is fine; the frame stays at `100dvh`.
- **Blue is bound to one meaning: *read this.*** It is not a hover colour. That refactor is not done — blue still carries interaction state in `eishiki-v3.css`.
