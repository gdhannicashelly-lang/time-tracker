/* =========================================================
   VARIABLES
========================================================= */

:root {

    --primary: #2563eb;
    --primary-dark: #1d4ed8;

    --success: #16a34a;
    --danger: #dc2626;
    --warning: #d97706;

    --bg: #f5f7fb;
    --surface: #ffffff;
    --surface-2: #f8fafc;

    --text: #172033;
    --muted: #64748b;

    --border: #e2e8f0;

    --sidebar: #111827;
    --sidebar-text: #d1d5db;
    --sidebar-muted: #94a3b8;

    --shadow:
        0 10px 30px rgba(15, 23, 42, 0.08);

    --radius: 14px;

}


body.dark {

    --bg: #0f172a;
    --surface: #111827;
    --surface-2: #1e293b;

    --text: #f8fafc;
    --muted: #94a3b8;

    --border: #334155;

}


/* =========================================================
   RESET
========================================================= */

* {
    box-sizing: border-box;
}

html {
    scroll-behavior: smooth;
}

body {

    margin: 0;

    font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

    background: var(--bg);
    color: var(--text);

}

button,
input,
textarea,
select {
    font: inherit;
}

button {
    cursor: pointer;
}

button:disabled {
    cursor: not-allowed;
    opacity: .55;
}

.hidden {
    display: none !important;
}


/* =========================================================
   AUTH
========================================================= */

.auth-screen {

    min-height: 100vh;

    display: flex;
    align-items: center;
    justify-content: center;

    padding: 24px;

    background:
        radial-gradient(
            circle at top left,
            rgba(37, 99, 235, .18),
            transparent 35%
        ),
        var(--bg);

}

.auth-card {

    width: 100%;
    max-width: 480px;

    padding: 36px;

    background: var(--surface);

    border:
        1px solid var(--border);

    border-radius: 20px;

    box-shadow: var(--shadow);

}

.auth-logo {

    display: flex;
    align-items: center;
    gap: 14px;

    margin-bottom: 32px;

}

.logo-icon {

    width: 48px;
    height: 48px;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 12px;

    background: var(--primary);

    color: white;

    font-size: 24px;

}

.auth-logo h1 {

    margin: 0;

    font-size: 24px;

}

.auth-logo p {

    margin: 4px 0 0;

    color: var(--muted);

    font-size: 13px;

}

.auth-card h2 {

    margin: 0 0 8px;

}

.auth-description {

    color: var(--muted);

    margin:
        0
        0
        24px;

}


/* =========================================================
   FORMS
========================================================= */

.form-group {

    display: flex;
    flex-direction: column;

    gap: 7px;

}

.form-group label {

    font-size: 13px;

    font-weight: 700;

}

.form-group input,
.form-group select,
.form-group textarea {

    width: 100%;

    padding: 11px 13px;

    border:
        1px solid var(--border);

    border-radius: 9px;

    outline: none;

    background: var(--surface);

    color: var(--text);

    transition:
        border .2s,
        box-shadow .2s;

}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {

    border-color: var(--primary);

    box-shadow:
        0 0 0 3px
        rgba(37, 99, 235, .12);

}

.form-row {

    display: grid;

    grid-template-columns:
        repeat(2, minmax(0, 1fr));

    gap: 16px;

}

.form-group {
    margin-bottom: 17px;
}


/* =========================================================
   BUTTONS
========================================================= */

.primary-btn,
.secondary-btn,
.success-btn,
.danger-btn {

    border: 0;

    border-radius: 9px;

    padding:
        10px
        15px;

    font-weight: 700;

    transition:
        transform .15s,
        opacity .15s,
        background .15s;

}

.primary-btn {

    background: var(--primary);
    color: white;

}

.primary-btn:hover {
    background: var(--primary-dark);
}

.secondary-btn {

    background: var(--surface-2);
    color: var(--text);

    border:
        1px solid var(--border);

}

.success-btn {

    background: var(--success);
    color: white;

}

.danger-btn {

    background: var(--danger);
    color: white;

}

.full-width {
    width: 100%;
}

.text-btn {

    background: transparent;
    border: 0;

    color: var(--primary);

    font-weight: 700;

    padding: 5px;

}

.auth-links {

    display: flex;

    justify-content: space-between;

    gap: 10px;

    margin-top: 20px;

}

.close-btn {

    width: 36px;
    height: 36px;

    border: 0;

    border-radius: 50%;

    background: var(--surface-2);

    color: var(--text);

    font-size: 24px;

}


/* =========================================================
   APP LAYOUT
========================================================= */

.app-screen {

    min-height: 100vh;

    display: flex;

}

.sidebar {

    width: 260px;

    min-height: 100vh;

    position: fixed;

    left: 0;
    top: 0;
    bottom: 0;

    display: flex;
    flex-direction: column;

    background: var(--sidebar);

    color: var(--sidebar-text);

    padding: 20px;

    z-index: 50;

}

.sidebar-brand {

    display: flex;
    align-items: center;
    gap: 12px;

    margin-bottom: 25px;

}

.sidebar-brand strong {

    display: block;

    color: white;

}

.sidebar-brand small {

    display: block;

    color: var(--sidebar-muted);

    margin-top: 3px;

}


.sidebar-user {

    display: flex;

    gap: 11px;

    align-items: center;

    padding:
        13px;

    border-radius: 12px;

    background:
        rgba(255,255,255,.06);

    margin-bottom: 20px;

}

.avatar,
.large-avatar {

    display: flex;
    align-items: center;
    justify-content: center;

    flex-shrink: 0;

    border-radius: 50%;

    background: var(--primary);

    color: white;

    font-weight: 800;

}

.avatar {

    width: 42px;
    height: 42px;

}

.large-avatar {

    width: 70px;
    height: 70px;

    font-size: 24px;

}

.sidebar-user-info {

    min-width: 0;

}

.sidebar-user-info strong {

    display: block;

    color: white;

    white-space: nowrap;

    overflow: hidden;

    text-overflow: ellipsis;

}

.sidebar-user-info span:not(.user-role) {

    display: block;

    color: var(--sidebar-muted);

    font-size: 11px;

    white-space: nowrap;

    overflow: hidden;

    text-overflow: ellipsis;

}

.user-role {

    display: inline-block;

    margin-top: 5px;

    padding:
        3px
        8px;

    border-radius: 999px;

    background:
        rgba(37, 99, 235, .25);

    color: #93c5fd;

    font-size: 10px;

    font-weight: 800;

}


/* =========================================================
   NAV
========================================================= */

.sidebar-nav {

    display: flex;
    flex-direction: column;

    gap: 5px;

}

.nav-btn {

    width: 100%;

    display: flex;
    align-items: center;

    gap: 11px;

    padding:
        11px
        13px;

    border: 0;

    border-radius: 9px;

    background: transparent;

    color: var(--sidebar-text);

    text-align: left;

    font-weight: 600;

}

.nav-btn:hover {

    background:
        rgba(255,255,255,.06);

}

.nav-btn.active {

    background: var(--primary);

    color: white;

}

.sidebar-bottom {

    margin-top: auto;

    display: flex;
    flex-direction: column;

    gap: 5px;

}

.sidebar-action {

    width: 100%;

    border: 0;

    background: transparent;

    color: var(--sidebar-text);

    text-align: left;

    padding: 11px 13px;

    border-radius: 9px;

}

.sidebar-action:hover {

    background:
        rgba(255,255,255,.06);

}

.sidebar-action.logout {

    color: #fca5a5;

}


/* =========================================================
   MAIN
========================================================= */

.main-content {

    width: calc(100% - 260px);

    margin-left: 260px;

    padding: 30px;

}

.mobile-header {

    display: none;

}

.page-section {
    display: none;
}

.page-section.active {
    display: block;
}

.section-heading {

    display: flex;

    align-items: flex-start;

    justify-content: space-between;

    gap: 20px;

    margin-bottom: 25px;

}

.section-heading h2 {

    margin:
        0
        5px;

    font-size: 28px;

}

.section-heading p {

    margin: 0;

    color: var(--muted);

}

.current-date {

    color: var(--muted);

    font-size: 13px;

}


/* =========================================================
   ATTENDANCE
========================================================= */

.attendance-card {

    display: flex;

    justify-content: space-between;

    align-items: center;

    gap: 20px;

    padding: 24px;

    margin-bottom: 22px;

    background:
        linear-gradient(
            135deg,
            var(--primary),
            #4f46e5
        );

    color: white;

    border-radius: var(--radius);

    box-shadow: var(--shadow);

}

.card-label {

    display: block;

    opacity: .8;

    font-size: 13px;

}

.attendance-status {

    display: block;

    margin-top: 5px;

    font-size: 24px;

}

.attendance-times {

    margin-top: 9px;

    font-size: 13px;

    opacity: .85;

}

.attendance-actions {

    display: flex;

    gap: 10px;

}


/* =========================================================
   STATS
========================================================= */

.stats-grid {

    display: grid;

    grid-template-columns:
        repeat(4, minmax(0, 1fr));

    gap: 16px;

    margin-bottom: 22px;

}

.stat-card {

    display: flex;

    align-items: center;

    gap: 13px;

    padding: 20px;

    background: var(--surface);

    border:
        1px solid var(--border);

    border-radius: var(--radius);

    box-shadow:
        0 5px 20px
        rgba(15,23,42,.04);

}

.stat-icon {

    width: 43px;
    height: 43px;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 11px;

    background:
        rgba(37,99,235,.10);

}

.stat-card span {

    display: block;

    color: var(--muted);

    font-size: 12px;

}

.stat-card strong {

    display: block;

    margin-top: 4px;

    font-size: 19px;

}


/* =========================================================
   CARDS
========================================================= */

.content-card {

    background: var(--surface);

    border:
        1px solid var(--border);

    border-radius: var(--radius);

    padding: 22px;

    margin-bottom: 22px;

    box-shadow:
        0 5px 20px
        rgba(15,23,42,.04);

}

.content-card h2 {

    margin-top: 0;

}

.card-heading {

    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 15px;

    margin-bottom: 18px;

}

.card-heading h2 {

    margin:
        0
        4px;

    font-size: 18px;

}

.card-heading p {

    margin: 0;

    color: var(--muted);

    font-size: 13px;

}


/* =========================================================
   FILTERS
========================================================= */

.filter-bar {

    display: grid;

    grid-template-columns:
        repeat(3, minmax(0, 1fr));

    gap: 15px;

    margin-bottom: 20px;

}


/* =========================================================
   TABLES
========================================================= */

.table-wrapper {

    width: 100%;

    overflow-x: auto;

}

table {

    width: 100%;

    border-collapse: collapse;

    min-width: 700px;

}

.wide-table {

    min-width: 1600px;

}

th {

    padding:
        12px
        10px;

    background: var(--surface-2);

    color: var(--muted);

    text-align: left;

    font-size: 11px;

    text-transform: uppercase;

    letter-spacing: .04em;

    white-space: nowrap;

}

td {

    padding:
        13px
        10px;

    border-top:
        1px solid var(--border);

    font-size: 13px;

    vertical-align: top;

}

tr:hover td {

    background:
        rgba(37,99,235,.025);

}

.table-link {

    color: var(--primary);

    text-decoration: none;

    font-weight: 600;

}

.table-link:hover {

    text-decoration: underline;

}

.table-actions {

    display: flex;

    gap: 6px;

}

.table-actions button {

    border: 0;

    border-radius: 7px;

    padding: 6px 9px;

    background: var(--surface-2);

    color: var(--text);

}

.table-actions .danger {

    color: var(--danger);

}


/* =========================================================
   EMPTY
========================================================= */

.empty-state {

    padding: 35px 20px;

    text-align: center;

    color: var(--muted);

}


/* =========================================================
   RECENT LIST
========================================================= */

.recent-list {

    display: flex;

    flex-direction: column;

}

.recent-item {

    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 15px;

    padding:
        13px
        0;

    border-bottom:
        1px solid var(--border);

}

.recent-item:last-child {
    border-bottom: 0;
}

.recent-item strong {

    display: block;

}

.recent-item span {

    color: var(--muted);

    font-size: 12px;

}


/* =========================================================
   MODAL
========================================================= */

.modal {

    position: fixed;

    inset: 0;

    z-index: 100;

    display: flex;

    align-items: center;

    justify-content: center;

    padding: 20px;

    background:
        rgba(15,23,42,.65);

}

.modal-card {

    width: 100%;

    max-width: 650px;

    max-height: 92vh;

    overflow-y: auto;

    background: var(--surface);

    border-radius: 16px;

    padding: 25px;

    box-shadow:
        0 25px 80px
        rgba(0,0,0,.25);

}

.large-modal {

    max-width: 800px;

}

.modal-header {

    display: flex;

    justify-content: space-between;

    gap: 15px;

    margin-bottom: 22px;

}

.modal-header h2 {

    margin:
        0
        5px;

}

.modal-header p {

    margin: 0;

    color: var(--muted);

}

.modal-actions {

    display: flex;

    justify-content: flex-end;

    gap: 10px;

    margin-top: 20px;

}


/* =========================================================
   TIMER
========================================================= */

.timer-box {

    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 15px;

    padding: 15px;

    border-radius: 10px;

    background: var(--surface-2);

    border:
        1px solid var(--border);

}

.timer-box span {

    display: block;

    color: var(--muted);

    font-size: 12px;

}

.timer-box strong {

    display: block;

    margin-top: 4px;

    font-size: 20px;

    font-variant-numeric: tabular-nums;

}


/* =========================================================
   SETTINGS
========================================================= */

.settings-profile {

    display: flex;

    align-items: center;

    gap: 18px;

}

.settings-profile h3 {

    margin:
        0
        5px;

}

.settings-profile p {

    margin:
        0
        10px;

    color: var(--muted);

}

.setting-row {

    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 20px;

    padding: 10px 0;

}

.setting-row p {

    margin:
        5px
        0
        0;

    color: var(--muted);

    font-size: 13px;

}


/* =========================================================
   ROLE BADGES
========================================================= */

.role-badge {

    display: inline-flex;

    align-items: center;

    padding:
        5px
        9px;

    border-radius: 999px;

    font-size: 11px;

    font-weight: 800;

}

.role-badge.employee {

    background: #dbeafe;
    color: #1d4ed8;

}

.role-badge.manager {

    background: #fef3c7;
    color: #92400e;

}

.role-badge.admin {

    background: #ede9fe;
    color: #6d28d9;

}


/* =========================================================
   SUMMARY
========================================================= */

.summary-grid {

    display: grid;

    grid-template-columns:
        repeat(3, minmax(0, 1fr));

    gap: 15px;

}

.summary-box {

    padding: 17px;

    border-radius: 10px;

    background: var(--surface-2);

}

.summary-box span {

    display: block;

    color: var(--muted);

    font-size: 12px;

}

.summary-box strong {

    display: block;

    margin-top: 5px;

    font-size: 22px;

}


/* =========================================================
   TOAST
========================================================= */

.toast-container {

    position: fixed;

    right: 20px;
    bottom: 20px;

    z-index: 300;

    display: flex;

    flex-direction: column;

    gap: 10px;

}

.toast {

    min-width: 280px;

    max-width: 380px;

    padding:
        13px
        16px;

    border-radius: 10px;

    background: #111827;

    color: white;

    box-shadow:
        0 10px 30px
        rgba(0,0,0,.2);

    animation:
        toastIn .2s ease;

}

.toast.success {
    border-left: 4px solid var(--success);
}

.toast.error {
    border-left: 4px solid var(--danger);
}

.toast.info {
    border-left: 4px solid var(--primary);
}

@keyframes toastIn {

    from {
        transform: translateY(10px);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }

}


/* =========================================================
   RESPONSIVE
========================================================= */

@media (max-width: 1100px) {

    .stats-grid {

        grid-template-columns:
            repeat(2, minmax(0, 1fr));

    }

}

@media (max-width: 850px) {

    .sidebar {

        transform:
            translateX(-100%);

        transition:
            transform .2s;

    }

    .sidebar.mobile-open {

        transform:
            translateX(0);

    }

    .main-content {

        width: 100%;

        margin-left: 0;

        padding: 20px;

    }

    .mobile-header {

        display: flex;

        align-items: center;

        justify-content: space-between;

        margin-bottom: 20px;

    }

    .mobile-brand {

        font-weight: 800;

    }

    .icon-btn {

        border: 0;

        background: var(--surface);

        color: var(--text);

        border:
            1px solid var(--border);

        border-radius: 8px;

        padding: 8px 11px;

    }

}

@media (max-width: 650px) {

    .auth-card {

        padding: 25px;

    }

    .form-row {

        grid-template-columns: 1fr;

    }

    .filter-bar {

        grid-template-columns: 1fr;

    }

    .stats-grid {

        grid-template-columns: 1fr;

    }

    .attendance-card {

        align-items: flex-start;

        flex-direction: column;

    }

    .attendance-actions {

        width: 100%;

    }

    .attendance-actions button {

        flex: 1;

    }

    .section-heading {

        flex-direction: column;

    }

    .summary-grid {

        grid-template-columns: 1fr;

    }

    .setting-row {

        align-items: flex-start;

        flex-direction: column;

    }

}


/* =========================================================
   DARK MODE OVERRIDES
========================================================= */

body.dark .role-badge.employee {

    background: rgba(59,130,246,.15);

    color: #93c5fd;

}

body.dark .role-badge.manager {

    background: rgba(245,158,11,.15);

    color: #fbbf24;

}

body.dark .role-badge.admin {

    background: rgba(139,92,246,.15);

    color: #c4b5fd;

}
