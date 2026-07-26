# PUSH — getting this on djoaniel.com

The repo is built and ready: branch `main`, 7 commits, `origin` already set to
`https://github.com/thundergodj/djoaniel-site.git`. Nothing left to configure.

**Read the folder note first, then run the script.**

---

## 1. The folder note

This clean repo lives in **`djoaniel-site-repo/`**, next to the old `djoaniel-site/`.

Why: the Cowork sandbox mounts your Drive in a way that allows writes but forbids
*deletes*, and git needs to delete its own lock files to commit. Working in place left
the old `djoaniel-site/.git` in a broken state that I can't clean from inside the
sandbox. So the repo was rebuilt in a fresh folder where git is healthy.

`djoaniel-site-repo/` has the same 13 files plus full history. Nothing was lost.

Swap them (PowerShell, from the project root):

```powershell
cd "$env:USERPROFILE\Claude\Projects\OVERDRIVE The Portfolio of Djoaniel Hernandez"

Rename-Item djoaniel-site djoaniel-site-OLD
Rename-Item djoaniel-site-repo djoaniel-site
Remove-Item -Recurse -Force djoaniel-site-OLD, _tmptest
```

(`_tmptest` is sandbox debris from the same permission problem — safe to delete.)

Skip the swap if you'd rather; everything below works from whatever the folder is
named. But do delete the old one eventually, or you'll edit the wrong copy.

## 2. Push

**This has to run in your own terminal.** The sandbox is blocked from reaching GitHub
(HTTP 403 through the proxy), so the network step is yours.

**It's a force-push.** The GitHub repo currently holds the old redirect placeholder,
which is *older* than this. A plain `git push` gets rejected as non-fast-forward. Do
not "clone fresh to fix it" — that would overwrite the real site with the redirect stub.

```powershell
cd "$env:USERPROFILE\Claude\Projects\OVERDRIVE The Portfolio of Djoaniel Hernandez\djoaniel-site"

git status          # expect: clean, on main
git log --oneline -7
git remote -v       # expect: origin -> thundergodj/djoaniel-site

git push --force origin main
```

Vercel watches `main` on this repo, and djoaniel.com already resolves to that Vercel
project. **The push is the launch.** No DNS change, no Vercel change.

---

## 3. Before you push — one thing to know

The homepage footer links to `about.html` and `colophon.html`. **Neither file exists.**
The moment this is live, two links from your front door 404.

Three ways to handle it, in order of how they read to someone hiring you:

1. **Write the two pages first, then push.** Best outcome. Colophon is the fast one —
   it's the type lock and the system, and `type-lock.html` is already the evidence.
2. **Push with the two links removed.** A site with no About is a choice; a site with a
   broken About is a mistake. This is the safe ship.
3. **Push as-is.** Only if this is a backup and you're not sending the link to anyone yet.

Cards 05 and 06 are still `href="#"` and say "Awaiting content" out loud — that's a
smaller wound than a 404, but it's the next one to close.

## 4. Verify after the push

```powershell
curl.exe -sI https://djoaniel.com | Select-String "HTTP|location"
curl.exe -sI https://www.djoaniel.com/work/no-value | Select-String "HTTP"
```

Expect a 308 apex → www, then 200 on the case study. Then open
https://www.djoaniel.com in a real browser at 1× on a Windows laptop — that's the
audience the type lock is calibrated for.

## 5. If it goes wrong

- `Updates were rejected` → you dropped the `--force`.
- `Authentication failed` → GitHub wants a Personal Access Token, not your password.
  `gh auth login` if you have the GitHub CLI, otherwise a classic PAT with `repo` scope,
  used as the password.
- `Another git process seems to be running` → you're in the old folder. Check with `pwd`.

**Rolling back:** Vercel keeps every prior deployment. Deployments → the old one →
**Promote to Production**. No git needed. The placeholder commit also stays in GitHub's
reflog for ~90 days.
