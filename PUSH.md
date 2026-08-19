# PUSH

The site is live. `https://www.djoaniel.com/` serves this tree, Vercel deploys on
every push to `main`, and `origin` is `https://github.com/thundergodj/djoaniel-site.git`.
Nothing to configure. Nothing to force. A plain `git push` is correct.

Last verified in sync: 2026-08-19, HEAD `a733423`, 0 ahead / 0 behind.

---

## 1. Why you run this yourself

Cowork mounts this folder with writes allowed and deletes forbidden. Git cannot
commit without creating and then removing `.git/index.lock`, so the unlink fails
and every `git add` and `git commit` from inside the sandbox fails with it.
Reading the repo works. Writing to it does not.

Claude can edit your files. Claude cannot commit them.

If you see `Another git process seems to be running` right after a Cowork session,
that is a stale lock left behind. `Remove-Item .git\index.lock` and carry on.

---

## 2. The CRLF trap (sandbox only)

**This does not affect you in GitHub Desktop.** Desktop runs Windows git with
`core.autocrlf` on and shows the true set of changes. On 2026-08-19 it showed
exactly the 9 real files.

It affects Claude. The Linux mount rewrites line endings, so `git status` from
the sandbox reports about 5,400 changed lines that are not real: files show as
modified with identical `+` and `-` counts and no content difference. On that
date four extra files (`local-debug.css`, `local-debug.js`, `colophon.html`,
`work/tessa.html`) appeared changed in the sandbox and correctly did not appear
in Desktop.

So: trust Desktop. If you ever work from a plain terminal on this folder, check
the real diff first.

```powershell
git diff --ignore-cr-at-eol --stat
```

Empty output means nothing changed.

### The permanent fix

The repo has no `.gitattributes`. That is the cause. Adding one ends the phantom
diff for the sandbox too, at the cost of one large renormalisation commit. Run it
alone, never mixed with content. Optional, since Desktop already hides the
problem from you.

```powershell
"* text=auto eol=lf" | Out-File -Encoding ascii .gitattributes
git add .gitattributes
git commit -m "Normalise line endings"
git add --renormalize .
git commit -m "Renormalise line endings (no content change)"
git push origin main
```

Safe here. The repo is HTML, CSS, JS and Markdown, none of which care. Skipping
it is also fine. You just keep passing `--ignore-cr-at-eol` forever.

---

## 3. Ship the pending work

Prepared 2026-08-19. Two commits: the fix that belongs on the live site, and the
housekeeping.

```powershell
cd "$env:USERPROFILE\Claude\Projects\OVERDRIVE The Portfolio of Djoaniel Hernandez\djoaniel-site-v2"

git diff --ignore-cr-at-eol --stat     # sanity check, per section 2

# --- commit 1 of 2 ---------------------------------------------------
git add assets/eishiki-v3.css index.html type-lock.html `
        work/unhappy-path.html work/accessibility-lab.html
git commit -m "Give the quiet gray a floor: --text-faint moves to ink-500"
```

Commit 1 body, if you want one. Paste after the subject with a second `-m`:

> `--text-faint` resolved to `--ink-400` (150,149,143). That measures 2.78:1 on
> paper and 3.00:1 on white, under the 4.5:1 body floor and under the 3:1
> non-text floor. It had been patched by hand in five files and the patch never
> held, because the defect was in the token, not the call sites.
>
> `--ink-500` retuned to 112,111,98: 4.69:1 on paper, 5.07:1 on white, 4.81:1 on
> tinted card surfaces. `--ink-400` keeps its job as a non-text value where 3:1
> is the bar. Inverse surfaces re-declare it, since ink-400 measures 6.63:1
> against ink-900 while ink-500 would fail there at 3.92:1.
>
> Accepted cost: faint (4.69) and muted (5.34) now sit one step apart instead of
> two.
>
> Also: the fold label on unhappy-path counter-scales. The stage scales the page;
> the label annotates the page, so it belongs to band pixels. At 82% it rendered
> at 10.3px.
>
> Also: the 1.4.3 note on accessibility-lab still said `--text-faint` *is*
> ink-400 after it was not.

```powershell
# --- commit 2 of 2 ---------------------------------------------------
git add README.md PUSH.md robots.txt .gitignore
git commit -m "Correct the repo docs and the robots rules"
```

Commit 2 body, if you want one:

> README opened with the retired legibility claim while the site's own meta
> description had already moved to "I find the rule nobody wrote down." Its
> Deploy section taught `git add -A`, the exact command that commits the CRLF
> no-op. sarisari-studio was missing from the structure block. The colophon link
> pointed at the `.html` that cleanUrls redirects away.
>
> PUSH.md described the original launch: a force-push, a folder rename that never
> happened, About and Colophon as missing pages.
>
> robots.txt now disallows /type-lock and the /og builder, and explicitly allows
> /og.png so link previews keep resolving. A bare `Disallow: /og` would have
> blocked the share image by prefix.

```powershell
git push origin main
```

---

## 4. Verify

```powershell
git status --short                     # expect: only CRLF phantoms, per section 2
git log --oneline -3

curl.exe -sI https://www.djoaniel.com/ | Select-String "HTTP"
curl.exe -s  https://www.djoaniel.com/robots.txt
```

Expect 200 on the homepage and the new Disallow block in robots.txt.

Give Vercel a minute, then reload and look at the faint grays: card meta,
captions, the signature block. They should sit one shade darker. That is the fix
landing.

---

## 5. If it goes wrong

| symptom | cause | fix |
|---|---|---|
| `Another git process seems to be running` | stale lock from a Cowork session | `Remove-Item .git\index.lock` |
| thousands of changed lines in `git status` | the CRLF mount | section 2 |
| `Updates were rejected` | someone pushed since | `git pull --rebase origin main`, then push. Do not force. The remote is the live site |
| `Authentication failed` | GitHub wants a token | `gh auth login`, or a classic PAT with `repo` scope used as the password |

Rolling back: Vercel keeps every prior deployment. Deployments, pick the last good
one, Promote to Production. No git required, and it beats a revert commit while
the site is public.

---

## 6. Housekeeping done 2026-08-19

Moved to `_to_delete/2026-08-19/` at the project root. **Delete that folder
yourself.** The sandbox cannot.

- `impeccable-deps.zip` and `impeccable-install.zip`, 1.9 MB, open since Aug 11
- `_tmptest/`, 375 KB, permission-probe debris from the July migration
- three dead `.git` directories from `_archive/`, 2.4 MB. The archived copies keep
  their files; they no longer register as nested repos
- a stale `.git/index.lock`

Moved to `_archive/2026-08-14-exploration/`: the thirteen unlinked files from the
Aug 14 session. Three homepage variants and their bench, the DH 1:2026 sketch, the
Break It Yourself deck build, six instrument-panel stages. Out of the repo by
decision, not by accident. Google Analytics was stripped from two of them first,
so nothing there can report to the production property if you open it locally.

They reference `../assets/`, so they will not render from the archive. Copy one
back into the repo root to look at it, and do not commit it.

`djoaniel-site-v2/` is now the only git repository under the project root.

Still local and gitignored: `tmp/` (15 MB of render scratch) and `output/`
(1.8 MB; the CV ships from `assets/`).
