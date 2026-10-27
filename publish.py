import base64
import datetime
import json
import os
import sys
import time
import urllib.error
import urllib.request

TOKEN = os.environ.get("GH_TOKEN", "").strip()
OWNER = "johny0717"
REPO = "dafiyu-site"
BRANCH = "main"
SITE = os.path.dirname(os.path.abspath(__file__))
API = "https://api.github.com"

FILES = [
    "index.html", "diary.html", "about.html", "styles.css", "app.js",
    "data.json", "README.md", "serve.ps1", "build_data.py",
    "publish.py", "publish.ps1", "refresh-data.ps1",
    "assets/fatfish-thunder.png",
]
LIVE = "https://johny0717.github.io/dafiyu-site/"


def req(method, path, data=None):
    body = json.dumps(data).encode("utf-8") if data is not None else None
    r = urllib.request.Request(
        API + path, data=body, method=method,
        headers={
            "Authorization": "Bearer " + TOKEN,
            "User-Agent": "dafiyu-publish",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(r, timeout=60) as resp:
            raw = resp.read()
            return resp.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {"raw": raw.decode("utf-8", "ignore")}


def main():
    if not TOKEN:
        print("缺少 GH_TOKEN")
        return 1

    st, repo = req("GET", f"/repos/{OWNER}/{REPO}")
    if st == 404:
        st, repo = req("POST", "/user/repos", {
            "name": REPO, "private": False, "auto_init": True,
            "description": "大肥鱼 · DA FEI YU —— 一条在 B站 冲浪的鲸鱼的个人站",
        })
        print("repo_create", st)
    if st not in (200, 201):
        print("repo_error", st, repo.get("message"))
        return 1

    st, ref = req("GET", f"/repos/{OWNER}/{REPO}/git/ref/heads/{BRANCH}")
    if st != 200:
        print("ref_error", st, ref.get("message"))
        return 1
    head = ref["object"]["sha"]
    st, commit = req("GET", f"/repos/{OWNER}/{REPO}/git/commits/{head}")
    base_tree = commit["tree"]["sha"]

    entries = []
    for rel in FILES:
        p = os.path.join(SITE, rel.replace("/", os.sep))
        if not os.path.exists(p):
            print("skip_missing", rel)
            continue
        data = open(p, "rb").read()
        st, blob = req("POST", f"/repos/{OWNER}/{REPO}/git/blobs", {
            "content": base64.b64encode(data).decode("ascii"),
            "encoding": "base64",
        })
        if st not in (200, 201):
            print("blob_error", rel, st, blob.get("message"))
            return 1
        entries.append({"path": rel, "mode": "100644", "type": "blob", "sha": blob["sha"]})

    st, blob = req("POST", f"/repos/{OWNER}/{REPO}/git/blobs", {
        "content": base64.b64encode(b"").decode("ascii"), "encoding": "base64",
    })
    entries.append({"path": ".nojekyll", "mode": "100644", "type": "blob", "sha": blob["sha"]})

    st, tree = req("POST", f"/repos/{OWNER}/{REPO}/git/trees", {
        "base_tree": base_tree, "tree": entries,
    })
    if st not in (200, 201):
        print("tree_error", st, tree.get("message"))
        return 1

    msg = "update 大肥鱼 site " + datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    st, newcommit = req("POST", f"/repos/{OWNER}/{REPO}/git/commits", {
        "message": msg, "tree": tree["sha"], "parents": [head],
    })
    if st not in (200, 201):
        print("commit_error", st, newcommit.get("message"))
        return 1

    st, _ = req("PATCH", f"/repos/{OWNER}/{REPO}/git/refs/heads/{BRANCH}", {
        "sha": newcommit["sha"], "force": False,
    })
    print("pushed", newcommit["sha"][:10], "ref", st)

    payload = {"source": {"branch": BRANCH, "path": "/"}}
    st, pages = req("GET", f"/repos/{OWNER}/{REPO}/pages")
    if st == 404:
        req("POST", f"/repos/{OWNER}/{REPO}/pages", payload)
    else:
        req("PUT", f"/repos/{OWNER}/{REPO}/pages", payload)

    for i in range(24):
        st, p = req("GET", f"/repos/{OWNER}/{REPO}/pages")
        print("pages", p.get("status"), p.get("html_url"))
        if p.get("status") == "built":
            break
        time.sleep(5)

    print("LIVE", LIVE)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
