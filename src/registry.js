var { localDataDir, join } = window.__TAURI__.path;
function convertString(input) {
    return input.toLowerCase().replace(/[^a-z0-9]/g, '_');
}
function getInstallations() {
    var data = localStorage.getItem("reg");
    try {
        data = JSON.parse(data);
    } catch (e) {
        return [];
    }
    if (!data || !Array.isArray(data) || typeof data !== "object") {
        return [];
    }
    return data;
}
function storeInstallations(data) {
    localStorage.setItem("reg", JSON.stringify(data));
}
function rebuildInstallationsList() {
    document.querySelector("#rightcontent").classList.add("hidden");
    var installations = getInstallations();
    var list = document.querySelector("#installations");
    list.innerHTML = "";
    installations.forEach((inst, i) => {
        var li = document.createElement("li");
        li.__id = inst.name;
        li.__idx = i;
        //li.classList.add("selected");
        li.innerHTML = `<h4>${inst.name}</h4><code>${inst.branch}</code>&nbsp;&nbsp;&nbsp;&nbsp;`;
        var btn = document.createElement("button");
        btn.innerText = "Delete";
        li.appendChild(btn);
        btn.addEventListener("click", async (e)=>{
            
            
            e.stopPropagation();
            if (window.confirm("Delete blender installation?")) {
                enterCriticalState();
                setLoadInfo("Deleting...");
                var l = getInstallations();
                var deleted = l.splice(li.__idx, 1)[0];
                const appDir = await join(await installationDir(), 'makemeablender', deleted.name);
                try {
                    logToConsole("Deleting " + deleted.name);
                    await window.__TAURI__.fs.remove(appDir, { recursive: true });
                } catch (error) {
                    logToConsole("Failed to delete: " + error.toString());
                    console.error(error);
                }
                storeInstallations(l);
                rebuildInstallationsList();
                exitCriticalState();
            }
        });
        li.addEventListener("click", ()=>{
            if (document.querySelector("li.selected")) {
                document.querySelectorAll("li.selected").forEach(x => {x.classList.remove("selected")});
            }
            li.classList.add("selected");
            globalThis.selectedName = li.__id;
            globalThis.selectedIndex = li.__idx;
            updateEditor();
        });
        if ((globalThis.selectedName === li.__id) || (!globalThis.selectedIndex && li.__idx === 0)) {
            li.classList.add("selected");
            globalThis.selectedName = li.__id;
            globalThis.selectedIndex = li.__idx;
            updateEditor();
        }
        list.appendChild(li);
    });
}
function newInstallation() {
    var installations = getInstallations();
    var n = window.prompt("What do you want to name your new Blender installation?\n(lowercase alphanumeric and underscores only)", "make_me_a_blender");
    if (!n) {
        return;
    }
    const name = convertString(n);
    if (installations.find(x => x.name === name)) {
        return;
    }
    installations.push({
        name: name,
        branch: "main",
        features: []
    });
    storeInstallations(installations);
    rebuildInstallationsList();
}
window.addEventListener("load", rebuildInstallationsList);
function setLoadInfo(x) {
    document.querySelector("#loadermsg").innerText = x;
}