const invoke = window.__TAURI__.core.invoke;
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

async function gitpull() {
    var instance = getInstallations()[globalThis.selectedIndex];
    var pullrequests = PRs.filter(x => {
        return instance.features.includes(x.id) && instance.branch === x.branch;
    }).flatMap(x => x.id);
    var branch = instance.branch;
    var folder = instance.name;

    var { localDataDir, join } = window.__TAURI__.path;
    var { Command } = window.__TAURI__.shell;

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
    
    const cloneCommand = await execCommand('git', ['clone', '--branch', branch, '--depth=1', '--recurse-submodules', repoUrl, folder], totalDir);
    if (cloneCommand.stderr) {
        logToConsole("STDERR: " + cloneCommand.stderr);
    }
    if (cloneCommand.stdout) {
        logToConsole("STDOUT: " + cloneCommand.stdout);
    }
    setLoadInfo("Pulling features...");
    for (const prNumber of pullrequests) {
        logToConsole("Fetching #" + prNumber + "...");
        const fetchCommand = await execCommand('git', ['fetch', '--depth=1', 'origin', `pull/${prNumber}/head:pr-${prNumber}`], appDir);
        logToConsole("Merging #" + prNumber + "...");
        const mergeCommand = await execCommand('git', ['merge', `pr-${prNumber}`], appDir);
    }
    logToConsole("Pull complete!");
    document.documentElement.classList.remove("loading");
}
async function makebuild() {
    var instance = getInstallations()[globalThis.selectedIndex];
    var folder = instance.name;

    var { localDataDir, join } = window.__TAURI__.path;
    var { Command } = window.__TAURI__.shell;

    const appDir = await join(await localDataDir(), 'makemeablender', instance.name);
    const buildCommand = await execCommand('make.bat', [], appDir);
}
window.addEventListener("load", () => {
    document.querySelector("#gitpull").addEventListener("click", gitpull);
    document.querySelector("#makebuild").addEventListener("click", makebuild);
});