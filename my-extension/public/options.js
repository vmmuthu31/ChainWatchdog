function saveOptions() {
  const apiKey = document.getElementById("apiKey").value;
  chrome.storage.local.set({ covalentApiKey: apiKey }, () => {
    const status = document.getElementById("status");
    status.classList.add("visible");

    setTimeout(() => {
      status.classList.remove("visible");
    }, 2000);
  });
}

function restoreOptions() {
  chrome.storage.local.get("covalentApiKey", (result) => {
    if (result.covalentApiKey) {
      document.getElementById("apiKey").value = result.covalentApiKey;
    }
  });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save").addEventListener("click", saveOptions);
