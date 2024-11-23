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
        features: []
    });
    storeInstallations(installations);
}