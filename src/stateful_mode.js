var wakeLock = null;
async function enterCriticalState() {
    document.documentElement.classList.add("loading");
    wakeLock = await navigator.wakeLock.request();
    logToConsole("Wake lock captured.");
    wakeLock.addEventListener("release", ()=>{
        if (logToConsole) {
            logToConsole("Wake lock released.")
        }
    })
}

function exitCriticalState() {
    document.documentElement.classList.remove("loading");
    if (wakeLock) {
        wakeLock.release();
    }
}

window.addEventListener("beforeunload", (e)=>{
    if (document.documentElement.classList.contains("loading")) {
        e.preventDefault();
    }
});