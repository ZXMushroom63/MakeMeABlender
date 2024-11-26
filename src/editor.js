function logToConsole(txt) {
    var c = document.querySelector("#console");
    c.innerText += "\n" + txt;
    c.scrollTop = c.scrollHeight;
}
function updateEditor() {
    document.querySelector("#rightcontent").classList.remove("hidden");
    var idx = globalThis.selectedIndex;
    var inst = getInstallations()[idx];
    if (!inst) {
        document.querySelector("#rightcontent").classList.add("hidden");
        return;
    }
    globalThis.__liveInst = inst;
    document.querySelector("#branchselect").value = inst.branch;
    document.querySelector("#inst_id").innerText = inst.name;
    refreshPullRequests(document.querySelector("#branchselect").value, document.querySelector("#prsearch").value);
}
window.addEventListener("load", () => {
    document.querySelector("#rightcontent").classList.add("hidden");
    document.querySelector("#branchselect").addEventListener("input", (e) => {
        var installations = getInstallations();
        var inst = getInstallations()[globalThis.selectedIndex];
        inst.branch = e.target.value;
        installations[globalThis.selectedIndex] = inst;
        storeInstallations(installations);
        rebuildInstallationsList();
        refreshPullRequests(document.querySelector("#branchselect").value, document.querySelector("#prsearch").value);
    });
    document.querySelector("#prsearch").addEventListener("input", (e) => {
        refreshPullRequests(document.querySelector("#branchselect").value, e.target.value);
    });
});
function refreshPullRequests(branch, searchQuery) {
    if (!globalThis.PRs) {
        return;
    }
    var _inst = getInstallations()[globalThis.selectedIndex];
    if (!_inst) {
        return;
    }
    var prcontainer = document.querySelector("#prcontainer");
    prcontainer.innerHTML = "";
    PRs.sort((a, b) => {return _inst.features.includes(b.id) - _inst.features.includes(a.id)});
    PRs.forEach(pr => {
        //on pull step, make sure to only fetch pull requests relevant to current branch
        if (pr.branch !== branch) {
            return;
        } 
        if (!pr.title.toLowerCase().includes(searchQuery.toLowerCase())) {
            return;
        }
        var li = document.createElement("li");
        if (_inst.features.includes(pr.id)) {
            li.classList.add("activated");
        }
        li.innerHTML += `<label>${pr.title}</label><br><span class="badge" title="Pull request ID" onclick="event.stopPropagation();window.open('https://projects.blender.org/blender/blender/pulls/${pr.id}')">#${pr.id}</span>`;
        if (pr.working) {
            li.innerHTML += `<span class="badge" title="All tests passed">✅</span>`;
        }
        if (pr.broken) {
            li.innerHTML += `<span class="badge" title="Some tests failed">❌</span>`;
        }
        if (pr.draft) {
            li.innerHTML += `<span class="badge" title="Pull request is a draft">🚧</span>`;
        }
        if (pr.conflicting > 0) {
            li.innerHTML += `<span class="badge" title="Pull request has ${pr.conflicting} conflicting files and cannot be merged.">🚨${pr.conflicting}</span>`;
        }
        li.addEventListener("click", ()=>{
            var installations = getInstallations();
            var inst = getInstallations()[globalThis.selectedIndex];
            if (inst.features.includes(pr.id)) {
                inst.features.splice(inst.features.indexOf(pr.id), 1);
                li.classList.remove("activated");
            } else {
                inst.features.push(pr.id);
                li.classList.add("activated")
            }
            installations[globalThis.selectedIndex] = inst;
            storeInstallations(installations);
        });
        prcontainer.appendChild(li);
    });
}