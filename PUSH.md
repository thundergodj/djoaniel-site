# PUSH — getting this on djoaniel.com

The repo is built: branch `main`, 8 commits, `origin` already set to
`https://github.com/thundergodj/djoaniel-site.git`. Nothing left to configure.

Read §1, then run §2.

---

## 1. Which folder is the repo

**`djoaniel-site-v2/` is the repo.** Use it. Ignore the others.

Why there are others: the Cowork sandbox mounts your project folder with writes
allowed but **deletes forbidden**, and git has to delete its own lock files to
commit. That left debris I can't clean from inside the sandbox:

| folder | what it is | do |
|---|---|---|
| `djoaniel-site-v2/` | clean repo, full history, current files | **keep — this is it** |
| `djoaniel-site/` | your working folder; files are identical, `.git` is broken | delete after the swap |
| `djoaniel-site-repo/` | a failed intermediate copy | delete |
| `_tmptest/` | permission-probe debris | delete |

The working files in `djoaniel-site-v2/` are byte-identical to `djoaniel-site/`.
Nothing was lost and nothing was edited behind your back.

Swap and clean up (PowerShell, from the project root):

```powershell
cd "$env:USERPROFILE\Claude\Projects\OVERDRIVE The Portfolio of Djoaniel Hernandez"

Remove-Item -Recurse -Force djoaniel-site, djoaniel-site-repo, _tmptest
Rename-Item djoaniel-site-v2 djoaniel-site
```

## 2. Push

**This has to run in your own terminal.** The sandbox is blocked from reaching GitHub
(HTTP 403 through the proxy), so the network step is yours.

**It's a force-push.** The GitHub repo still holds the old redirect placeholder, which
is *older* than this — a plain `git push` gets rejected as non-fast-forward. Do not
"clone fresh to fix it"; that would overwrite the real site with the redirect stub.

```powershell
cd "$env:USERPROFILE\Claude\Projects\OVERDRIVE The Portfolio of Djoaniel Hernandez\djoaniel-site"

git status          # expect: clean, on main
git log --oneline -8
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

Cards 05 and 06 are still `href="#"` and say "Awaiting content" out loud — a smaller
wound than a 404, but the next one to close.

## 4. Verify after the push

```powershell
curl.exe -sI https://djoaniel.com | Select-String "HTTP|location"
curl.exe -sI https://www.djoaniel.com/work/no-value | Select-String "HTTP"
```

Expect a 308 apex → www, then 200 on the case study. Then open
https://www.djoaniel.com in a real browser at 1x on a Windows laptop — that's the
audience the type lock is calibrated for.

## 5. If it goes wrong

- `Updates were rejected` → you dropped the `--force`.
- `Authentication failed` → GitHub wants a Personal Access Token, not your password.
  `gh auth login` if you have the GitHub CLI, otherwise a classic PAT with `repo` scope,
  used as the password.
- `Another git process seems to be running` → you're in the old folder. Check `pwd`.

**Rolling back:** Vercel keeps every prior deployment. Deployments → the old one →
**Promote to Production**. No git needed. The placeholder commit also stays in GitHub's
reflog for ~90 days.
