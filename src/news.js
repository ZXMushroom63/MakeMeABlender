function newsRead(preserveUi) {
    if (!preserveUi) {
        document.querySelector("#news").innerText = "News";
    }
    localStorage.setItem("last_news_read", Date.now());
}
window.enableCORSFetch(true);

async function updateNews() {
    var lastReadDate = parseInt(localStorage.getItem("last_news_read"));
    var parser = new DOMParser();
    var data = await (await fetch("https://projects.blender.org/blender/blender.rss")).text();
    var page = parser.parseFromString(data, "text/xml");
    var items = page.querySelectorAll("rss channel item");
    var outputPanel = document.querySelector("#news_content");
    outputPanel.innerHTML = "";
    var unreadCount = 0;
    items.forEach(item => {
        var url = item.querySelector("link").textContent;
        if (!(  (url.includes("/pulls/") && !url.includes("issuecomment"))  ||  (url.includes("/commit/") && !url.includes("issuecomment") )  )) {
            return;
        }
        var isPr = (url.includes("/pulls/") && !url.includes("issuecomment"));
        var titleText = "";
        if (isPr) {
            let desc = item.querySelector("description").textContent.replace(/^([0-9]+\#)/, "");
            titleText = item.querySelector("author").textContent + " made pull request: " + desc.substring(0, desc.length - 2);
        } else {
            titleText = item.querySelector("author").textContent + " pushed commit: " + item.querySelector("title").textContent;
        }
        var outFeedItem = document.createElement("li");
        var pubTime = (new Date(item.querySelector("pubDate").textContent)).getTime();
        var deltaTime = Date.now() - pubTime;
        var minutes = deltaTime / 1000 / 60;
        var timeBadge = document.createElement("span");
        timeBadge.classList.add("badge");
        timeBadge.innerText = (minutes > 1.49) ? `${Math.round(minutes)} minutes ago.` : ((minutes > 0) ? `${Math.round(minutes)} minute ago.` : "Just now.");
        
        var title = document.createElement("a");
        title.innerText = titleText;
        title.addEventListener("click", ()=>{
            window.open(url);
        });

        if (lastReadDate < pubTime) {
            unreadCount++;
            try {
                __TAURI__.notification.sendNotification(title.innerText);
                newsRead(true);
            } catch(e) {
                
            }
        }

        outFeedItem.appendChild(title);
        outFeedItem.appendChild(document.createElement("br"));
        outFeedItem.appendChild(timeBadge);
        outputPanel.appendChild(outFeedItem);
    });
    if (unreadCount > 0) {
        document.querySelector("#news").innerText = `News (${unreadCount})`;
    } else {
        document.querySelector("#news").innerText = "News";
    }
}
async function newsUpdateLoop() {
    try {
        await updateNews();
    } catch (error) {
        
    }
    setTimeout(newsUpdateLoop, settings.newsUpdateInterval*1000);
}
if (settings.backgroundNews) {
    newsUpdateLoop();
} else {
    updateNews();
}
window.addEventListener("load", ()=>{
    document.querySelector("#news").addEventListener("click", ()=>{
        document.querySelector("#news_panel").classList.remove("hidden");
    });
});