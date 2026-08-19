# djoaniel.com

The portfolio of Djoaniel Hernandez. He finds the rule nobody wrote down, then
builds it so it outlasts him.

Static HTML, one hand-authored stylesheet, no build step and no framework. The site is
itself the strongest work sample: read the source. Deployed on Vercel; every push to
`main` ships.

## Structure

```
index.html                    the console — viewport-locked, no page scroll
about.html                    the through-line and the track record
colophon.html                 how this site is built — type, palette, access
assets/eishiki-v3.css         the design system (paper/ink/blue, hairlines, zero radius)
assets/eishiki-v3.js          interaction for the case studies
work/no-value.html            case study — null-value standard, private wealth
work/tessa.html               case study — conversational career coach
work/sarisari-snaps.html      case study — physical product, parametric system
work/sarisari-studio.html     case study — True Size configurator & storefront
work/unhappy-path.html        case study — component & state library, activewear retail
work/accessibility-lab.html   the playable WCAG 2.2 AA audit lab
type-lock.html                the Instrument Serif floor test and full scale
```

## The rules it's built against

- **Instrument Serif never renders below 24px.** Under that, titles swap to Radio
  Canada 700 — the serif's hairlines fall under one device pixel and grey into mush.
- **The page never scrolls.** It's a console, not a document: content changes inside
  panes, the frame stays at `100dvh`. Pane-internal scroll is fine.
- **Colour behaves like livery.** Paper is the airframe; ink is structure; blue means *read this* or *current*; orange means the operator is live, working, or armed; red is an exception; sage is resolved. A button is not orange merely because it is clickable.

More on all of it — including the type lock and the accessibility pass — on the
[colophon](https://www.djoaniel.com/colophon).

## Deploy

Vercel builds on push to `main`. `cleanUrls` is on, so `/work/no-value` resolves
as well as `/work/no-value.html`.

**Never `git add -A` here.** This folder is mounted through a bridge that rewrites
line endings, so `git status` reports thousands of changed lines that do not exist.
Check the real diff, then stage named files:

```bash
git diff --ignore-cr-at-eol --stat   # empty output means nothing changed
git add the/file/you/edited
git commit -m "…"
git push origin main
```

[PUSH.md](PUSH.md) has the rest, including the `.gitattributes` fix that ends the
phantom diff.

---

© 2026 Djoaniel Hernandez. The code is public so you can read it; the writing, the work,
and the design system are not licensed for reuse. Client work shown here is recreated
from scratch in this system — no client assets, no confidential figures.
