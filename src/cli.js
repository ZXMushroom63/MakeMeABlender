function gitpull() {
    const { _localDataDir, _join } = window.__TAURI__.path;
    const { _Command } = window.__TAURI__.shell;
    var instance = getInstallations()[globalThis.selectedIndex];
    var pullrequests = PRs.filter(x => {
        return instance.features.includes(x.id) && instance.branch === x.branch;
    }).flatMap(x => x.id);
    var branch = instance.branch;
}
window.addEventListener("load", ()=>{
    document.querySelector("#gitpull").addEventListener("click", gitpull);
});