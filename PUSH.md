# PUSH — getting this on djoaniel.com

The repo is ready. It is on `main`, it has 6 commits, and `origin` is already set to
`https://github.com/thundergodj/djoaniel-site.git`. Nothing is left to configure.

**This has to run in your own terminal.** The Cowork sandbox is blocked from reaching
GitHub (HTTP 403 through the proxy), so the network step is yours.

**The push is a force-push.** The GitHub repo currently holds the old redirect
placeholder, which is *older* than what's here — the local copy is ahead, not behind.
A normal `git push` will be rejected as non-fast-forward. Do not "clone fresh to fix
it"; that would overwrite the real site with the redirect stub.

---

## Run this

Open PowerShell and paste:

```powershell
cd "$env:USERPROFILE\Claude\Projects\OVERDRIVE The Portfolio of Djoaniel Hernandez\djoaniel-site"

# the sandbox mount can't delete files, so it may have left stale git locks behind
Remove-Item -Force -ErrorAction SilentlyContinue .git\index.lock, .git\HEAD.lock, .git\objects\maintenance.lock
Get-ChildItem .git\objects -Recurse -Filter "tmp_obj_*" | Remove-Item -Force -ErrorAction SilentlyContinue

git status
git log --oneline -6
git remote -v
```

If `git status` is clean and the log shows `Add the unhappy-path case study` at the
top, you're good:

```powershell
git push --force origin main
```

Vercel is watching `main` on this repo and djoaniel.com already resolves to that
Vercel project, so **the push is the launch.** No DNS change, no Vercel change.

---

## Before you push — one thing to know

The homepage footer links to `about.html` and `colophon.html`. **Neither file exists.**
The moment this is live, two links from your front door 404.

Three ways to handle it, in order of how they read to someone hiring you:

1. **Write the two pages first, then push.** Best outcome. Colophon is fast — it's the
   type lock and the system, and you already have `type-lock.html` as the evidence.
2. **Push now with the two links removed.** A site with no About is a choice; a site
   with a broken About is a mistake. This is the safe ship.
3. **Push as-is.** Only if you're pushing to have a backup and not telling anyone yet.

---

## Verify after the push

```powershell
curl.exe -sI https://djoaniel.com | Select-String "HTTP|location"
curl.exe -sI https://www.djoaniel.com/work/no-value | Select-String "HTTP"
```

Expect a 308 from apex → www, then 200 on the case study. Then open
https://www.djoaniel.com in an actual browser at 1× on a Windows laptop — that's the
audience the type lock is calibrated for.

## If the push is rejected

- `Updates were rejected` → you dropped the `--force`.
- `Authentication failed` → GitHub wants a Personal Access Token, not your password.
  `gh auth login` if you have the GitHub CLI, otherwise create a classic PAT with
  `repo` scope and use it as the password.
- `Another git process seems to be running` → the stale-lock cleanup above didn't run.

## Rolling back

The placeholder's last commit is still in the GitHub repo's reflog for ~90 days, and
Vercel keeps every prior deployment. Fastest undo is Vercel → Deployments → the old
one → **Promote to Production**. You do not need git for that.
