var { localDataDir, join } = window.__TAURI__.path;
var ignoreMissingLibs = false;
async function missingLibs() {
    const appDir = await join(await installationDir(), 'makemeablender');
    document.querySelector("#libs_panel").classList.remove("hidden");
    var libraries = document.querySelectorAll("#libs_panel li");
    for (const library of libraries) {
        if (library.className.includes("cmdcheck_")) {
            var installed = (await execCommand(library.className.trim().replace("cmdcheck_", ""), ["--version"], appDir)).stderr !== "program not found";
            library.innerText = library.innerText.replace("STATUS_PENDING", installed ? "Installed" : "Click to download");
        }
    }

    var optixInstalled = false;
    try {
        if((await __TAURI__.fs.readDir("C:\\ProgramData\\NVIDIA Corporation")).find(x => x.name.toLowerCase().startsWith("optix sdk"))) {
            optixInstalled = true;
        }
    } catch (e) {
        
    }
    document.querySelector("#libs_panel li.libs_optix").innerText = optixInstalled ? "OptiX - Installed" : "OptiX - Click to download";
    await new Promise((res,rej)=>{
        var timer = setInterval(()=>{
            if (ignoreMissingLibs) {
                document.querySelector("#libs_panel").classList.add("hidden");
                clearInterval(timer);
                res();
            }
        }, 250);
    });
}