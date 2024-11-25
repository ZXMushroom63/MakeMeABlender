const { invoke } = window.__TAURI__.core;
const { localDataDir, join } = window.__TAURI__.path;
const { Command } = window.__TAURI__.shell;
const { mkdir } = window.__TAURI__.fs;


const appDir = await join(await localDataDir(), 'makemeablender');
try {
  await mkdir(appDir);
} catch (error) {
  
}
window.enableCORSFetch(true);
var branches = window.branches = (await(await fetch("https://projects.blender.org/blender/blender/branches/list")).json()).results;
document.querySelector("#new").addEventListener("click", () => {
  newInstallation();
});
const branchselect = document.querySelector("#branchselect");
branchselect.innerHTML = "";
branches.forEach(branch => {
  var option = document.createElement("option");
  option.value = branch;
  option.innerText = branch;
  branchselect.appendChild(option);
});
updateEditor();
function extractPRsFromPage(page, outlist, idx) {
  var prs = page.querySelectorAll("#issue-list div.flex-item");
  prs.forEach(elem => {
    try {
      var title = elem.querySelector(".flex-item-main .flex-item-header .flex-item-title a.issue-title");
      var titleText = title.innerText;
      var prpath = (new URL(title.href, "https://projects.blender.org/")).pathname.split("/");
      var id = parseInt(prpath[prpath.length - 1]);
      var conflictingCount = 0;
      var conflicting = elem.querySelector(".flex-item-body .conflicting");
      if (conflicting) {
        conflictingCount = parseInt(conflicting.innerText.replaceAll("conflicting files", "").replaceAll("conflicting file", "") || 0);
      }
      outlist.push({
        id: id,
        title: titleText,
        branch: elem.querySelector(".branch a span.truncated-name").innerText,
        working: elem.querySelector(".flex-item-main .flex-item-header .flex-item-title svg.icon.commit-status.green.octicon-check") ? true : false,
        broken: elem.querySelector(".flex-item-main .flex-item-header .flex-item-title svg.icon.commit-status.red.octicon-x") ? true : false,
        draft: elem.querySelector(".flex-item-icon").querySelector("svg.grey.octicon-git-pull-request-draft") ? true : false,
        conflicting: conflictingCount
      });
    } catch (error) {
      console.error("During PR extraction loop: ", error);
    }
  });
  logToConsole("Extracted " + prs.length + " pull request indexes from page " + idx + ".");
}
async function indexPullRequests() {
  logToConsole("Preparing to index pull requests from projects.blender.org");
  var OUT = [];
  var startingPage = 1;
  var data = (await (await fetch("https://projects.blender.org/blender/blender/pulls?page=1")).text());
  var parser = new DOMParser();
  var page1 = parser.parseFromString(data, "text/html");
  var lastPage = parseInt((new URL(page1.querySelector(".item.navigation .gitea-double-chevron-right").parentElement.href, "https://projects.blender.org/")).searchParams.get("page"));
  logToConsole("Indexing pages " + startingPage + " to " + lastPage);
  extractPRsFromPage(page1, OUT, 1);
  for (let pageIdx = startingPage + 1; pageIdx < lastPage + 1; pageIdx++) {
    var pageData = (await (await fetch("https://projects.blender.org/blender/blender/pulls?page="+pageIdx)).text());
    var page = parser.parseFromString(pageData, "text/html");
    extractPRsFromPage(page, OUT, pageIdx);
  }
  localStorage.setItem("cache_store", JSON.stringify(OUT));
  localStorage.setItem("cache_store_date", Date.now());
  logToConsole("Wrote index to cache.");
  return OUT;
}

var PRs = [];
var last_pr_fetch = localStorage.getItem("cache_store_date");
var elapsedTime = Date.now() - parseInt(last_pr_fetch || 0);
var maxElapsedTime = 240 * 60 * 1000; //240 minutes
if (elapsedTime > maxElapsedTime) {
  setLoadInfo("Indexing pull requests...");
  document.documentElement.classList.add("loading");
  try {
    PRs = await indexPullRequests();
  } catch (error) {
    logToConsole("Failed to fetch pull requests! Using cache.");
    PRs = JSON.parse(localStorage.getItem("cache_store") || "[]");
  }
  document.documentElement.classList.remove("loading");
} else {
  PRs = JSON.parse(localStorage.getItem("cache_store") || "[]");
  logToConsole("Loaded PRs from cache.");
}
globalThis.PRs = PRs;
if (globalThis.__liveInst) {
  refreshPullRequests(globalThis.__liveInst.branch, "");
} else {
  refreshPullRequests("main", "");
}

document.querySelector("#forceindex").addEventListener("click", ()=>{
  localStorage.setItem("cache_store_date", 0);
  location.reload();
});

document.querySelector("#cleanup").addEventListener("click", async ()=>{
  setLoadInfo("Cleaning up application folder...");
  document.documentElement.classList.add("loading");
  var names = getInstallations().map((x)=>{return x.name.toLowerCase()});
  var { localDataDir, join } = window.__TAURI__.path;
  const totalDir = await join(await localDataDir(), 'makemeablender');
  var badFiles = (await __TAURI__.fs.readDir(totalDir)).filter((f) => {
    return !names.includes(f.name.toLowerCase());
  });
  for (let i = 0; i < badFiles.length; i++) {
    const file = badFiles[i];
    const deletePath = await join(await localDataDir(), 'makemeablender', file);
    logToConsole("Deleting " + file + "...");
    await window.__TAURI__.fs.remove(deletePath, { recursive: true });
  }
  document.documentElement.classList.remove("loading");
});