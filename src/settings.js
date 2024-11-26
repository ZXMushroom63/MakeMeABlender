var settings = {};
function updateSettings(s) {
    s.backgroundNews = (localStorage.getItem("background_news") === "true" ? true : false) || false;
    s.newsUpdateInterval = Math.max(120, parseInt(localStorage.getItem("news_update_interval")) || 240);
    s.sendNotifications = (localStorage.getItem("notifications") === "true" ? true : false) || false;
}
updateSettings(settings);

window.addEventListener("load", ()=>{
    document.querySelector("#settings").addEventListener("click", ()=>{
        document.querySelector("#settings_panel").classList.remove("hidden");
    });
    document.querySelector("#newsUpdateInterval").value = settings.newsUpdateInterval;
    document.querySelector("#sendNotifications").checked = settings.sendNotifications;
    document.querySelector("#backgroundNews").checked = settings.backgroundNews;

    document.querySelector("#newsUpdateInterval").addEventListener("input", ()=>{
        localStorage.setItem("news_update_interval", document.querySelector("#newsUpdateInterval").value);
        updateSettings();
    });

    document.querySelector("#sendNotifications").addEventListener("input", ()=>{
        localStorage.setItem("notifications", document.querySelector("#sendNotifications").checked);
        updateSettings();
    });

    document.querySelector("#backgroundNews").addEventListener("input", ()=>{
        localStorage.setItem("background_news", document.querySelector("#backgroundNews").checked);
        updateSettings();
    });
});