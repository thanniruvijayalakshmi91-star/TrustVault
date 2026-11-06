const authSection = document.getElementById("auth");
const dashboard = document.getElementById("dashboard");
const notice = document.getElementById("notice");
const searchInput = document.getElementById("searchDocuments");
const categoryFilter = document.getElementById("categoryFilter");
const fromDate = document.getElementById("fromDate");
const toDate = document.getElementById("toDate");
let currentUser = null;
let searchTimer = null;

function message(text, error = false) {
  notice.textContent = text;
  notice.className = error ? "notice error" : "notice";
}
async function api(url, options = {}) {
  const response = await fetch(url, { credentials: "same-origin", ...options });
  const data = (response.headers.get("content-type") || "").includes("application/json")
    ? await response.json() : null;
  if (!response.ok) throw new Error(data?.message || "Request failed.");
  return data;
}
function formValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}

document.getElementById("loginForm").addEventListener("submit", async event => {
  event.preventDefault();
  try {
    await api("/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formValues(event.target))
    });
    event.target.reset();
    await loadApp();
    message("Logged in successfully.");
  } catch (error) { message(error.message, true); }
});
document.getElementById("registerForm").addEventListener("submit", async event => {
  event.preventDefault();
  try {
    await api("/api/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formValues(event.target))
    });
    event.target.reset();
    await loadApp();
    message("Account created successfully.");
  } catch (error) { message(error.message, true); }
});
document.getElementById("logout").addEventListener("click", async () => {
  try {
    await api("/api/auth/logout", { method: "POST" });
    showAuth();
    message("Logged out.");
  } catch (error) { message(error.message, true); }
});
document.getElementById("refresh").addEventListener("click", loadDocuments);
for (const filter of [searchInput, categoryFilter, fromDate, toDate]) filter.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadDocuments, 250);
});
document.getElementById("uploadForm").addEventListener("submit", async event => {
  event.preventDefault();
  try {
    await api("/api/documents/upload", { method: "POST", body: new FormData(event.target) });
    event.target.reset();
    await loadDocuments();
    message("Document uploaded.");
  } catch (error) { message(error.message, true); }
});

function showAuth() {
  authSection.hidden = false;
  dashboard.hidden = true;
  document.getElementById("account").textContent = "";
}
function makeButton(label, className, handler) {
  const button = document.createElement("button");
  button.textContent = label;
  if (className) button.className = className;
  button.addEventListener("click", handler);
  return button;
}
async function loadApp() {
  try {
    const result = await api("/api/auth/me");
    currentUser = result.user;
    authSection.hidden = true;
    dashboard.hidden = false;
    document.getElementById("account").textContent = currentUser.name + " · " + currentUser.role;
    document.getElementById("welcome").textContent = "Hello, " + currentUser.name;
    document.getElementById("adminPanel").hidden = currentUser.role !== "admin";
    document.querySelector(".upload-panel").hidden = currentUser.role === "viewer";
    await loadDocuments();
    if (currentUser.role === "admin") await loadAdmin();
  } catch (_) { showAuth(); }
}
async function loadDocuments() {
  try {
    const query = new URLSearchParams({q: searchInput.value.trim(), category: categoryFilter.value.trim(), from: fromDate.value, to: toDate.value});
    const result = await api("/api/documents?" + query.toString());
    const list = document.getElementById("documentList");
    list.replaceChildren();
    if (!result.documents.length) {
      list.textContent = query ? "No matching documents found." : "No documents yet. Upload your first file above.";
      return;
    }
    for (const documentInfo of result.documents) {
      const card = document.createElement("article");
      card.className = "doc-card";
      const heading = document.createElement("h4");
      heading.textContent = "📄 " + documentInfo.original_name;
      const meta = document.createElement("p");
      meta.className = "doc-meta";
      meta.textContent = "Owner: " + documentInfo.owner_name + " · Category: " + (documentInfo.category || "Uncategorized") + " · " +
        Math.max(1, Math.round(Number(documentInfo.file_size) / 1024)) + " KB · " +
        documentInfo.permission + " access";
      const actions = document.createElement("div");
      actions.className = "actions";
      actions.append(makeButton("Download", "", () => downloadDocument(documentInfo.id)));
      card.append(heading, meta, actions);
      if (currentUser.role !== "viewer" && !documentInfo.is_owner && documentInfo.permission === "edit") {
        const replaceForm = document.createElement("form");
        replaceForm.className = "share-form";
        const replacement = document.createElement("input");
        replacement.type = "file";
        replacement.required = true;
        replacement.setAttribute("aria-label", "Choose replacement document");
        const replaceButton = makeButton("Save edit", "", null);
        replaceForm.append(replacement, replaceButton);
        replaceForm.addEventListener("submit", async event => {
          event.preventDefault();
          if (!replacement.files[0]) return;
          const body = new FormData();
          body.append("document", replacement.files[0]);
          try {
            await api("/api/documents/" + documentInfo.id + "/replace", { method: "POST", body });
            await loadDocuments();
            message("Document updated.");
          } catch (error) { message(error.message, true); }
        });
        card.append(replaceForm);
      }

      if (documentInfo.is_owner) {
        actions.append(makeButton("Delete", "outline", async () => {
          if (!confirm("Delete this document permanently?")) return;
          try {
            await api("/api/documents/" + documentInfo.id, { method: "DELETE" });
            await loadDocuments();
            message("Document deleted.");
          } catch (error) { message(error.message, true); }
        }));
        const shareForm = document.createElement("form");
        shareForm.className = "share-form";
        const email = document.createElement("input");
        email.type = "email";
        email.placeholder = "Registered user's email";
        email.required = true;
        const permission = document.createElement("select");
        for (const value of ["read", "edit"]) {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = value === "read" ? "Read" : "Edit";
          permission.append(option);
        }
        shareForm.append(email, permission, makeButton("Share", "", null));
        shareForm.addEventListener("submit", async event => {
          event.preventDefault();
          try {
            await api("/api/documents/" + documentInfo.id + "/share", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: email.value, permission: permission.value })
            });
            shareForm.reset();
            await loadShares(documentInfo.id, card);
            message("Access granted.");
          } catch (error) { message(error.message, true); }
        });
        const shares = document.createElement("div");
        shares.className = "shares-list";
        card.append(shareForm, shares);
        loadShares(documentInfo.id, card);
      }
      list.append(card);
    }
  } catch (error) { message(error.message, true); }
}
async function loadShares(documentId, card) {
  const container = card.querySelector(".shares-list");
  if (!container) return;
  try {
    const result = await api("/api/documents/" + documentId + "/shares");
    container.replaceChildren();
    if (!result.shares.length) {
      const empty = document.createElement("p");
      empty.className = "doc-meta";
      empty.textContent = "Not shared with anyone yet.";
      container.append(empty);
      return;
    }
    const title = document.createElement("p");
    title.className = "doc-meta";
    title.textContent = "People with access:";
    container.append(title);
    for (const share of result.shares) {
      const row = document.createElement("div");
      row.className = "share-row";
      const label = document.createElement("span");
      label.textContent = share.name + " (" + share.email + ") · " + share.permission;
      row.append(label, makeButton("Revoke", "outline", async () => {
        if (!confirm("Revoke this user's access?")) return;
        try {
          await api("/api/documents/" + documentId + "/share/" + share.user_id, { method: "DELETE" });
          await loadShares(documentId, card);
          message("Access revoked.");
        } catch (error) { message(error.message, true); }
      }));
      container.append(row);
    }
  } catch (error) { message(error.message, true); }
}
async function downloadDocument(id) {
  try {
    const response = await fetch("/api/documents/" + id + "/download", { credentials: "same-origin" });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Download failed.");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "document";
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) { message(error.message, true); }
}
async function loadAdmin() {
  try {
    const data = await api("/api/admin/stats");
    const stats = document.getElementById("stats");
    stats.replaceChildren();
    for (const [label, value] of [["Users", data.users], ["Documents", data.documents], ["Shares", data.shares]]) {
      const item = document.createElement("div");
      item.className = "stat";
      const number = document.createElement("strong");
      number.textContent = value;
      item.append(number, document.createTextNode(label));
      stats.append(item);
    }
    const activity = document.getElementById("activity");
    activity.replaceChildren();
    if (!data.recentActivity.length) activity.textContent = "No activity yet.";
    for (const item of data.recentActivity) {
      const row = document.createElement("div");
      row.className = "activity-row";
      row.textContent = new Date(item.created_at).toLocaleString() + " · " + item.action + " · " + (item.details || "");
      activity.append(row);
    }
  } catch (error) { message(error.message, true); }
}
loadApp();
