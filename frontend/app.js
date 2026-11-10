
const API_URL = "http://127.0.0.1:8000";

// Format the meeting analysis date and time
function formatMeetingDateTime(value) {
    if (!value) return "Date and time not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date and time not available";
    }

    return date.toLocaleString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function textValue(v, f = "Not available") {
    if (v === null || v === undefined || v === "") return f;
    return typeof v === "string" || typeof v === "number"
        ? String(v)
        : JSON.stringify(v, null, 2);
}

function fillList(id, items) {
    const el = document.getElementById(id);
    if (!el) return;

    el.replaceChildren();

    if (!Array.isArray(items) || !items.length) {
        const li = document.createElement("li");
        li.textContent = "No items available.";
        el.append(li);
        return;
    }

    items.forEach(x => {
        const li = document.createElement("li");

        li.textContent =
            typeof x === "object" && x !== null
                ? Object.entries(x)
                    .map(([k, v]) => `${k.replaceAll("_", " ")}: ${textValue(v)}`)
                    .join(" | ")
                : String(x);

        el.append(li);
    });
}

let currentMeetingData = null;
let allMeetings = [];

function showMeeting(data) {
    currentMeetingData = data;

    const m = data.minutes || data.meeting_minutes || data;
    const title =
        m.meeting_title ||
        m.title ||
        data.meeting_title ||
        data.title ||
        "Meeting";

    const id = data.meeting_id ?? data.id;
    const createdAt = data.created_at || m.created_at;

    document.getElementById("meetingTitle").textContent =
        textValue(title);

    document.getElementById("resultHeading").textContent = title;

    document.getElementById("resultMeta").textContent =
        `Meeting ID: ${id ?? "N/A"} | Analysed on: ${formatMeetingDateTime(createdAt)}`;

    document.getElementById("summary").textContent =
        textValue(m.summary || data.summary);

    document.getElementById("transcript").textContent =
        textValue(data.transcript || m.transcript);

    fillList("keyPoints", m.key_points || data.key_points);
    fillList("decisions", m.decisions || data.decisions);
    fillList("actionItems", m.action_items || data.action_items);

    document.getElementById("results").classList.remove("hidden");

    document.getElementById("results").scrollIntoView({
        behavior: "smooth"
    });
}

function minutesText(data) {
    const m = data.minutes || data.meeting_minutes || data;

    const title =
        m.meeting_title ||
        m.title ||
        data.title ||
        "Meeting";

    const list = a =>
        Array.isArray(a) && a.length
            ? a.map(x => "- " + (typeof x === "object" ? JSON.stringify(x) : x)).join("\n")
            : "- None recorded";

    return `MEETMIND AI - MEETING MINUTES

Meeting ID: ${data.meeting_id ?? data.id ?? "N/A"}
Meeting Title: ${title}
Analysis Date and Time: ${formatMeetingDateTime(data.created_at || m.created_at)}

MEETING SUMMARY
${m.summary || data.summary || "N/A"}

KEY POINTS
${list(m.key_points || data.key_points)}

DECISIONS
${list(m.decisions || data.decisions)}

ACTION ITEMS
${list(m.action_items || data.action_items)}

FULL TRANSCRIPT
${data.transcript || m.transcript || "N/A"}`;
}

const download = document.getElementById("downloadButton");

if (download) {
    download.addEventListener("click", () => {
        if (!currentMeetingData) return;

        const blob = new Blob(
            [minutesText(currentMeetingData)],
            { type: "text/plain;charset=utf-8" }
        );

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = `MeetMind_Meeting_${currentMeetingData.meeting_id ?? currentMeetingData.id ?? "Minutes"}.txt`;

        a.click();

        URL.revokeObjectURL(url);
    });
}

async function getMeetings() {
    const r = await fetch(`${API_URL}/meetings`);
    const d = await r.json();

    if (!r.ok) {
        throw Error(d.detail || `Request failed (${r.status})`);
    }

    return Array.isArray(d)
        ? d
        : (d.meetings || d.items || d.results || []);
}

function historyItem(meeting, container) {
    const id = meeting.meeting_id ?? meeting.id;

    const title =
        meeting.meeting_title ||
        meeting.title ||
        `Meeting ${id ?? ""}`;

    const item = document.createElement("div");
    item.className = "history-item";

    const left = document.createElement("div");
    const strong = document.createElement("strong");
    const p = document.createElement("p");

    strong.textContent = title;

    p.textContent =
        `Meeting ID: ${id ?? "Unknown"} | Analysed on: ${formatMeetingDateTime(meeting.created_at)}`;

    left.append(strong, p);

    const b = document.createElement("button");

    b.className = "secondary-button";
    b.textContent = "View details";
    b.disabled = id == null;

    b.onclick = () => {
        if (document.getElementById("results")) {
            loadDetails(id);
        } else {
            location.href =
                `meeting-history.html?meeting_id=${encodeURIComponent(id)}`;
        }
    };

    item.append(left, b);
    container.append(item);
}

async function loadDetails(id) {
    const status = document.getElementById("status");

    try {
        const r = await fetch(
            `${API_URL}/meetings/${encodeURIComponent(id)}`
        );

        const d = await r.json();

        if (!r.ok) {
            throw Error(d.detail || `Request failed (${r.status})`);
        }

        showMeeting(d);

        if (status) {
            status.textContent = `Loaded meeting ${id}`;
        }

    } catch (e) {
        if (status) {
            status.textContent = `Could not load meeting: ${e.message}`;
        } else {
            alert(`Could not load meeting: ${e.message}`);
        }
    }
}

async function refreshHistory() {
    const box = document.getElementById("meetingHistory");

    if (!box) return;

    box.innerHTML = '<p class="empty">Loading meeting history...</p>';

    try {
        allMeetings = await getMeetings();
        filterHistory();

    } catch (e) {
        box.textContent =
            `Could not load meeting history: ${e.message}. Check that the backend is running.`;
    }
}

function filterHistory() {
    const box = document.getElementById("meetingHistory");

    if (!box) return;

    const q = (
        document.getElementById("historySearch")?.value || ""
    ).trim().toLowerCase();

    box.replaceChildren();

    const matches = allMeetings.filter(m =>
        String(m.meeting_title || m.title || "")
            .toLowerCase()
            .includes(q) ||
        String(m.meeting_id ?? m.id ?? "")
            .includes(q)
    );

    if (!matches.length) {
        box.innerHTML = '<p class="empty">No matching meetings found.</p>';
        return;
    }

    matches.forEach(m => historyItem(m, box));
}

const form = document.getElementById("meetingForm");

if (form) {
    const input = document.getElementById("audioFile");
    const zone = document.getElementById("dropZone");
    const info = document.getElementById("fileInfo");
    const button = document.getElementById("submitButton");
    const status = document.getElementById("status");

    document.getElementById("chooseFileButton").onclick = () =>
        input.click();

    input.onchange = () => {
        const f = input.files[0];

        info.style.display = f ? "block" : "none";

        info.textContent = f
            ? `Selected: ${f.name} · ${(f.size / 1048576).toFixed(2)} MB`
            : "";
    };

    document.getElementById("clearFileButton").onclick = () => {
        input.value = "";
        info.style.display = "none";
    };

    ["dragenter", "dragover"].forEach(n =>
        zone.addEventListener(n, e => {
            e.preventDefault();
            zone.classList.add("dragover");
        })
    );

    ["dragleave", "drop"].forEach(n =>
        zone.addEventListener(n, e => {
            e.preventDefault();
            zone.classList.remove("dragover");
        })
    );

    zone.addEventListener("drop", e => {
        const f = e.dataTransfer.files[0];

        if (!f) return;

        const dt = new DataTransfer();
        dt.items.add(f);

        input.files = dt.files;
        input.dispatchEvent(new Event("change"));
    });

    form.onsubmit = async e => {
        e.preventDefault();

        const f = input.files[0];

        if (!f) {
            status.textContent = "Please select an audio file.";
            return;
        }

        const fd = new FormData();
        fd.append("file", f);

        button.disabled = true;
        button.textContent = "Processing audio...";

        status.className = "";

        status.textContent =
            "Transcribing and generating meeting minutes. This may take a little while...";

        try {
            const r = await fetch(
                `${API_URL}/process-meeting`,
                {
                    method: "POST",
                    body: fd
                }
            );

            const d = await r.json();

            if (!r.ok) {
                throw Error(d.detail || `Request failed (${r.status})`);
            }

            showMeeting(d);

            status.className = "success";
            status.textContent = "Meeting processed successfully.";

        } catch (err) {
            status.className = "error";

            status.textContent =
                `Error: ${err.message}. Check that the backend is running.`;

        } finally {
            button.disabled = false;
            button.textContent = "✦ Generate meeting minutes";
        }
    };
}

if (document.getElementById("todayLabel")) {
    document.getElementById("todayLabel").textContent =
        new Date().toLocaleDateString(undefined, {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric"
        });
}

if (
    document.getElementById("savedCount") ||
    document.getElementById("recentMeetings")
) {
    getMeetings()
        .then(ms => {
            const c = document.getElementById("savedCount");

            if (c) {
                c.textContent = ms.length;
            }

            const box = document.getElementById("recentMeetings");

            if (box) {
                box.replaceChildren();

                if (!ms.length) {
                    box.innerHTML =
                        '<p class="empty">No meetings saved yet. Create your first meeting.</p>';
                } else {
                    ms.slice(0, 5).forEach(m => historyItem(m, box));
                }
            }
        })
        .catch(e => {
            const box = document.getElementById("recentMeetings");

            if (box) {
                box.textContent =
                    `Could not connect to backend: ${e.message}`;
            }
        });
}

if (document.getElementById("meetingHistory")) {
    document.getElementById("refreshHistoryButton").onclick =
        refreshHistory;

    document.getElementById("historySearch").oninput =
        filterHistory;

    refreshHistory();

    const requestedId =
        new URLSearchParams(location.search).get("meeting_id");

    if (requestedId) {
        loadDetails(requestedId);
    }
}
