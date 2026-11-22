const databaseName = "aditusan-calculation-history";
let database;

function openDatabase() {
  database ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      const records = db.createObjectStore("records", { keyPath: "id", autoIncrement: true });
      records.createIndex("scope", "scope");
      db.createObjectStore("snapshots");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Calculation history storage is blocked."));
  });
  return database;
}

function resultOf(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function changeHistory(scope, update) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["records", "snapshots"], "readwrite");
    transaction.oncomplete = resolve;
    transaction.onabort = () => reject(transaction.error ?? new Error("History storage is unavailable."));
    const records = transaction.objectStore("records");
    const snapshots = transaction.objectStore("snapshots");
    const matches = records.index("scope").getAll(scope);
    matches.onsuccess = () => update(matches.result, records, snapshots);
  });
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const focused = document.activeElement;
    const field = document.createElement("textarea");
    field.value = text;
    field.readOnly = true;
    field.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0";
    document.body.append(field);
    field.select();
    try {
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      field.remove();
      focused?.focus({ preventScroll: true });
    }
  }
}

export function createHistory(id, { restore, limit = 20 }) {
  const panel = document.getElementById(id);
  const list = panel.querySelector(".history-list");
  const empty = panel.querySelector(".history-empty");
  const clear = panel.querySelector(".history-clear");
  const note = panel.querySelector(".history-message");
  const scope = location.pathname.replace(/(?:index|local-preview)\.html$/, "").replace(/\/?$/, "/") + "#" + id;
  let pending = Promise.resolve();
  let temporary = [];

  function render(entries) {
    list.replaceChildren();
    empty.hidden = entries.length > 0;
    clear.disabled = entries.length === 0;
    for (const entry of entries) {
      const row = document.createElement("li");
      const description = document.createElement("span");
      description.textContent = entry.summary;
      const when = document.createElement("small");
      when.className = "history-time";
      when.textContent = new Date(entry.time).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
      description.append(when);

      const actions = document.createElement("div");
      actions.className = "history-actions";
      const restoreButton = document.createElement("button");
      restoreButton.type = "button";
      restoreButton.textContent = "Restore";
      restoreButton.setAttribute("aria-label", "Restore " + entry.summary);
      restoreButton.addEventListener("click", async () => {
        try {
          const snapshot = entry.snapshot ?? await resultOf((await openDatabase()).transaction("snapshots").objectStore("snapshots").get(entry.id));
          if (!snapshot) throw new Error("That calculation was cleared.");
          restore(snapshot);
          note.textContent = "Calculation restored.";
        } catch (error) {
          note.textContent = error.message;
        }
      });

      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.textContent = "Copy";
      copyButton.setAttribute("aria-label", "Copy result for " + entry.summary);
      copyButton.addEventListener("click", async () => {
        note.textContent = await copyText(entry.clipboardText) ? "Copied to clipboard." : "Clipboard access was unavailable.";
      });
      actions.append(restoreButton, copyButton);
      row.append(description, actions);
      list.append(row);
    }
  }

  async function refresh() {
    let entries = [];
    try {
      const db = await openDatabase();
      entries = await resultOf(db.transaction("records").objectStore("records").index("scope").getAll(scope));
    } catch {
      if (!note.textContent) note.textContent = "History is available for this tab only.";
    }
    render([...temporary, ...entries.reverse()].slice(0, limit));
  }

  clear.addEventListener("click", () => {
    pending = pending.then(async () => {
      temporary = [];
      try {
        await changeHistory(scope, (entries, records, snapshots) => {
          for (const entry of entries) {
            records.delete(entry.id);
            snapshots.delete(entry.id);
          }
        });
        note.textContent = "History cleared.";
      } catch {
        note.textContent = "Tab history cleared.";
      }
      await refresh();
    });
  });

  pending = refresh();
  return {
    add(summary, snapshot, clipboardText) {
      const record = { scope, summary, time: Date.now(), bytes: 0, clipboardText };
      pending = pending.then(async () => {
        try {
          await changeHistory(scope, (entries, records, snapshots) => {
            for (const entry of entries.slice(0, Math.max(0, entries.length - limit + 1))) {
              records.delete(entry.id);
              snapshots.delete(entry.id);
            }
            const insert = records.add(record);
            insert.onsuccess = () => snapshots.add(snapshot, insert.result);
          });
          note.textContent = "";
        } catch {
          temporary = [{ ...record, snapshot }, ...temporary].slice(0, limit);
          note.textContent = "History is available for this tab only.";
        }
        await refresh();
      });
    },
  };
}
