const invoke = window.__TAURI__.core.invoke;
window.__TAURI__.event.listen("stdout", (data)=>{
    logToConsole(data.payload.message);
});
async function execCommand(command, args, cd) {
    var decoder = new TextDecoder("utf-8")
    const result = await invoke('run_command', { command: command, args: args, dir: cd});
    return {
        status: result.status,
        stdout: decoder.decode(new Uint8Array(result.stdout)),
        stderr: decoder.decode(new Uint8Array(result.stderr))
    };
}

const repoUrl = "https://projects.blender.org/blender/blender.git";
function checkSSL() {
    return !document.querySelector("#ssl").checked;
}
async function gitpull() {
    var instance = getInstallations()[globalThis.selectedIndex];
    var pullrequests = PRs.filter(x => {
        return instance.features.includes(x.id) && instance.branch === x.branch;
    }).flatMap(x => x.id);
    var branch = instance.branch;
    var folder = instance.name;

    var { localDataDir, join } = window.__TAURI__.path;

    setLoadInfo("Clearing cache...");
    document.documentElement.classList.add("loading")
    logToConsole("Deleting previous pull...");
    const appDir = await join(await localDataDir(), 'makemeablender', instance.name);
    try {
        await window.__TAURI__.fs.remove(appDir, { recursive: true });
    } catch (error) {
        
    }
    const totalDir = await join(await localDataDir(), 'makemeablender');
    logToConsole("Deleted previous pull.");
    logToConsole("Preparing to clone...");
    setLoadInfo("Cloning repository...");
    var ssl = checkSSL() ? [] : ["-c", "http.sslVerify=false"];
    const cloneCommand = await execCommand('git', ssl.concat(['clone', '--branch', branch, '--depth=1', '--recurse-submodules', repoUrl, folder]), totalDir);
    await execCommand('cmd', ssl.concat(['/C', '.\\build_files\\windows\\lib_update.cmd']), appDir);
    setLoadInfo("Pulling features...");
    for (const prNumber of pullrequests) {
        logToConsole("Fetching #" + prNumber + "...");
        const fetchCommand = await execCommand('git', ssl.concat(['fetch', '--allow-unrelated-histories', '--depth=1', 'origin', `pull/${prNumber}/head:pr-${prNumber}`]), appDir);
        logToConsole("Merging #" + prNumber + "...");
        const mergeCommand = await execCommand('git', ssl.concat(['merge', '--allow-unrelated-histories', `pr-${prNumber}`]), appDir);
    }
    logToConsole("Pull complete!");
    document.documentElement.classList.remove("loading");
}
async function makebuild() {
    setLoadInfo("Running make.bat...");
    document.documentElement.classList.add("loading")
    logToConsole("Running make.bat");
    var instance = getInstallations()[globalThis.selectedIndex];
    var folder = instance.name;

    var { localDataDir, join } = window.__TAURI__.path;
    var { Command } = window.__TAURI__.shell;

    const appDir = await join(await localDataDir(), 'makemeablender', instance.name);
    const buildCommand = await execCommand('cmd', ['/C', 'start', 'cmd.exe', '.', '/C', 'make.bat'], appDir);
    if (buildCommand.stdout > 0) {
        logToConsole(buildCommand.stdout);
    } else {
        logToConsole(buildCommand.stderr);
        logToConsole("Have you pulled the repo yet?");
    }
    document.documentElement.classList.remove("loading");
}
window.addEventListener("load", () => {
    document.querySelector("#gitpull").addEventListener("click", gitpull);
    document.querySelector("#makebuild").addEventListener("click", makebuild);
});