/* =========================================================
   FIREBASE IMPORTS
========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


/* =========================================================
   FIREBASE CONFIGURATION
========================================================= */

/*
   ============================================================
   REPLACE THESE VALUES WITH YOUR FIREBASE WEB APP CONFIG.
   Firebase Console:
   Project Settings > General > Your apps > Web App
   ============================================================
*/

const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

/* =========================================================
   FIREBASE INITIALIZATION
========================================================= */

const app =
    initializeApp(firebaseConfig);

const auth =
    getAuth(app);

const db =
    getFirestore(app);


/* =========================================================
   APPLICATION STATE
========================================================= */

let currentUser = null;

let currentProfile = null;

let currentRole = "employee";

let attendanceToday = null;

let taskTimerInterval = null;

let taskTimerSeconds = 0;

let taskTimerRunning = false;

let mobileMenuOpen = false;


/* =========================================================
   COLLECTIONS
========================================================= */

const USERS =
    "users";

const ATTENDANCE =
    "attendance";

const TASKS =
    "tasks";

const DAILY_REPORTS =
    "dailyReports";


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (id) =>
    document.getElementById(id);


function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   DATE HELPERS
========================================================= */

function pad(number) {

    return String(number)
        .padStart(2, "0");

}


function getDateKey(date = new Date()) {

    return [
        date.getFullYear(),
        pad(date.getMonth() + 1),
        pad(date.getDate())
    ].join("-");

}


function getMonthKey(date = new Date()) {

    return [
        date.getFullYear(),
        pad(date.getMonth() + 1)
    ].join("-");

}


function getTodayDateInput() {

    return getDateKey();

}


function getCurrentMonthInput() {

    return getMonthKey();

}


function formatDate(dateValue) {

    if (!dateValue) {
        return "—";
    }

    const date =
        new Date(`${dateValue}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }

    return date.toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );

}


function formatDateTime(value) {

    if (!value) {
        return "—";
    }

    let date;

    if (
        value &&
        typeof value.toDate === "function"
    ) {

        date = value.toDate();

    } else {

        date = new Date(value);

    }

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleString();

}


/* =========================================================
   TIME HELPERS
========================================================= */

function minutesToText(minutes) {

    minutes =
        Math.max(
            0,
            Number(minutes) || 0
        );

    const hours =
        Math.floor(minutes / 60);

    const mins =
        Math.round(minutes % 60);

    return `${hours} hrs ${pad(mins)} min`;

}


function timeToMinutes(time) {

    if (!time) {
        return 0;
    }

    const parts =
        time.split(":");

    if (parts.length < 2) {
        return 0;
    }

    return (
        Number(parts[0]) * 60 +
        Number(parts[1])
    );

}


function calculateTimeDifference(
    timeIn,
    timeOut
) {

    if (!timeIn || !timeOut) {
        return 0;
    }

    let start =
        timeToMinutes(timeIn);

    let end =
        timeToMinutes(timeOut);

    if (end < start) {
        end += 24 * 60;
    }

    return end - start;

}


function hoursToMinutes(
    hours,
    minutes = 0
) {

    const h =
        Number(hours) || 0;

    const m =
        Number(minutes) || 0;

    return Math.max(
        0,
        Math.round(
            h * 60 + m
        )
    );

}


function taskHoursValue(task) {

    if (
        task.totalMinutes !== undefined
    ) {

        return Number(
            task.totalMinutes
        ) || 0;

    }

    return (
        Number(task.hours) || 0
    ) * 60;

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "info"
) {

    const container =
        $("toastContainer");

    if (!container) {
        return;
    }

    const toast =
        document.createElement("div");

    toast.className =
        `toast ${type}`;

    toast.textContent =
        message;

    container.appendChild(toast);

    setTimeout(() => {

        toast.remove();

    }, 3500);

}


/* =========================================================
   ERROR HANDLING
========================================================= */

function firebaseErrorMessage(error) {

    if (!error) {
        return "An unknown error occurred.";
    }

    const code =
        error.code || "";

    const messages = {

        "auth/invalid-credential":
            "Invalid email or password.",

        "auth/invalid-login-credentials":
            "Invalid email or password.",

        "auth/user-not-found":
            "No account was found with this email.",

        "auth/wrong-password":
            "Incorrect password.",

        "auth/email-already-in-use":
            "This email is already registered.",

        "auth/weak-password":
            "Password must contain at least 6 characters.",

        "auth/invalid-email":
            "Please enter a valid email address.",

        "auth/too-many-requests":
            "Too many attempts. Please try again later.",

        "permission-denied":
            "You do not have permission to perform this action."

    };

    return (
        messages[code] ||
        error.message ||
        "Something went wrong."
    );

}


/* =========================================================
   AUTH SCREEN
========================================================= */

function showLoginForm() {

    $("loginFormContainer")
        ?.classList
        .remove("hidden");

    $("registerFormContainer")
        ?.classList
        .add("hidden");

}


function showRegisterForm() {

    $("loginFormContainer")
        ?.classList
        .add("hidden");

    $("registerFormContainer")
        ?.classList
        .remove("hidden");

}


/* =========================================================
   REGISTER
========================================================= */

async function registerUser(event) {

    event.preventDefault();

    const firstName =
        $("registerFirstName")
            .value
            .trim();

    const lastName =
        $("registerLastName")
            .value
            .trim();

    const email =
        $("registerEmail")
            .value
            .trim()
            .toLowerCase();

    const password =
        $("registerPassword")
            .value;

    const confirmPassword =
        $("registerConfirmPassword")
            .value;

    if (
        password !==
        confirmPassword
    ) {

        showToast(
            "Passwords do not match.",
            "error"
        );

        return;
    }

    try {

        const credential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        await updateProfile(
            credential.user,
            {
                displayName:
                    `${firstName} ${lastName}`
            }
        );

        /*
           New accounts ALWAYS start as employees.
           Admin/Manager roles must be assigned by an admin
           through Firestore.
        */

        await setDoc(
            doc(
                db,
                USERS,
                credential.user.uid
            ),
            {
                uid:
                    credential.user.uid,

                firstName,

                lastName,

                displayName:
                    `${firstName} ${lastName}`,

                email,

                role:
                    "employee",

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()
            }
        );

        showToast(
            "Account created successfully.",
            "success"
        );

    } catch (error) {

        console.error(error);

        showToast(
            firebaseErrorMessage(error),
            "error"
        );

    }

}


/* =========================================================
   LOGIN
========================================================= */

async function loginUser(event) {

    event.preventDefault();

    const email =
        $("loginEmail")
            .value
            .trim()
            .toLowerCase();

    const password =
        $("loginPassword")
            .value;

    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

    } catch (error) {

        console.error(error);

        showToast(
            firebaseErrorMessage(error),
            "error"
        );

    }

}


/* =========================================================
   PASSWORD RESET
========================================================= */

async function resetPassword() {

    const email =
        prompt(
            "Enter your account email:"
        );

    if (!email) {
        return;
    }

    try {

        await sendPasswordResetEmail(
            auth,
            email.trim()
        );

        showToast(
            "Password reset email sent.",
            "success"
        );

    } catch (error) {

        showToast(
            firebaseErrorMessage(error),
            "error"
        );

    }

}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutUser() {

    try {

        await signOut(auth);

    } catch (error) {

        showToast(
            firebaseErrorMessage(error),
            "error"
        );

    }

}


/* =========================================================
   USER PROFILE
========================================================= */

async function loadUserProfile() {

    if (!currentUser) {
        return;
    }

    const reference =
        doc(
            db,
            USERS,
            currentUser.uid
        );

    const snapshot =
        await getDoc(reference);

    if (!snapshot.exists()) {

        await setDoc(
            reference,
            {
                uid:
                    currentUser.uid,

                firstName:
                    currentUser.displayName
                        ?.split(" ")[0] ||
                    "User",

                lastName:
                    currentUser.displayName
                        ?.split(" ")
                        .slice(1)
                        .join(" ") ||
                    "",

                displayName:
                    currentUser.displayName ||
                    "User",

                email:
                    currentUser.email,

                role:
                    "employee",

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()
            },
            {
                merge: true
            }
        );

        currentProfile = {
            uid:
                currentUser.uid,

            displayName:
                currentUser.displayName ||
                "User",

            email:
                currentUser.email,

            role:
                "employee"
        };

    } else {

        currentProfile =
            snapshot.data();

    }

    currentRole =
        currentProfile.role ||
        "employee";

    updateUserInterface();

}


/* =========================================================
   USER UI
========================================================= */

function updateUserInterface() {

    if (!currentProfile) {
        return;
    }

    const displayName =
        currentProfile.displayName ||
        `${currentProfile.firstName || ""} ${currentProfile.lastName || ""}`
            .trim() ||
        "User";

    const email =
        currentProfile.email ||
        currentUser?.email ||
        "";

    const role =
        currentRole;

    const initials =
        displayName
            .split(" ")
            .filter(Boolean)
            .map(word =>
                word[0]
            )
            .join("")
            .slice(0, 2)
            .toUpperCase();

    if ($("sidebarUserName")) {
        $("sidebarUserName")
            .textContent =
            displayName;
    }

    if ($("sidebarUserEmail")) {
        $("sidebarUserEmail")
            .textContent =
            email;
    }

    if ($("sidebarAvatar")) {
        $("sidebarAvatar")
            .textContent =
            initials || "U";
    }

    if ($("sidebarUserRole")) {
        $("sidebarUserRole")
            .textContent =
            roleLabel(role);
    }

    if ($("settingsName")) {
        $("settingsName")
            .textContent =
            displayName;
    }

    if ($("settingsEmail")) {
        $("settingsEmail")
            .textContent =
            email;
    }

    if ($("settingsAvatar")) {
        $("settingsAvatar")
            .textContent =
            initials || "U";
    }

    if ($("settingsRole")) {

        $("settingsRole")
            .textContent =
            roleLabel(role);

        $("settingsRole").className =
            `role-badge ${role}`;

    }

    if ($("managerNavBtn")) {

        $("managerNavBtn")
            .classList.toggle(
                "hidden",
                !isManager()
            );

    }

    if ($("adminNavBtn")) {

        $("adminNavBtn")
            .classList.toggle(
                "hidden",
                !isAdmin()
            );

    }

    if ($("dashboardGreeting")) {

        $("dashboardGreeting")
            .textContent =
            `Welcome back, ${displayName}!`;

    }

}


function roleLabel(role) {

    if (role === "admin") {
        return "Admin";
    }

    if (role === "manager") {
        return "Manager";
    }

    return "Employee";

}


function isManager() {

    return (
        currentRole === "manager" ||
        currentRole === "admin"
    );

}


function isAdmin() {

    return currentRole === "admin";

}


/* =========================================================
   SCREEN CONTROL
========================================================= */

function showAppScreen() {

    $("authScreen")
        ?.classList
        .add("hidden");

    $("appScreen")
        ?.classList
        .remove("hidden");

}


function showAuthScreen() {

    $("authScreen")
        ?.classList
        .remove("hidden");

    $("appScreen")
        ?.classList
        .add("hidden");

}


function showSection(sectionName) {

    if (
        (sectionName === "manager") &&
        !isManager()
    ) {

        showToast(
            "Manager access required.",
            "error"
        );

        return;
    }

    if (
        (sectionName === "admin") &&
        !isAdmin()
    ) {

        showToast(
            "Admin access required.",
            "error"
        );

        return;
    }

    document
        .querySelectorAll(".page-section")
        .forEach(section => {

            section.classList.remove("active");

        });

    const section =
        $(`${sectionName}Section`);

    if (section) {

        section.classList.add("active");

    }

    document
        .querySelectorAll(".nav-btn")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.section ===
                sectionName
            );

        });

    if (
        sectionName === "dashboard"
    ) {

        renderDashboard();

    }

    if (
        sectionName === "tasks"
    ) {

        renderTasks();

    }

    if (
        sectionName === "dailyReports"
    ) {

        renderDailyReports();

    }

    if (
        sectionName === "reports"
    ) {

        renderReports();

    }

    if (
        sectionName === "manager"
    ) {

        renderManagerDashboard();

    }

    if (
        sectionName === "admin"
    ) {

        renderAdminDashboard();

    }

    mobileMenuOpen = false;

    $("sidebar")
        ?.classList
        .remove("mobile-open");

}


/* =========================================================
   THEME
========================================================= */

function initializeTheme() {

    const saved =
        localStorage.getItem(
            "timeTrackerTheme"
        );

    if (saved === "dark") {

        document.body
            .classList
            .add("dark");

    }

    updateThemeButtons();

}


function toggleTheme() {

    document.body
        .classList
        .toggle("dark");

    localStorage.setItem(
        "timeTrackerTheme",
        document.body
            .classList
            .contains("dark")
            ? "dark"
            : "light"
    );

    updateThemeButtons();

}


function updateThemeButtons() {

    const dark =
        document.body
            .classList
            .contains("dark");

    if ($("themeBtn")) {

        $("themeBtn")
            .innerHTML =
            dark
                ? "☀️ <span>Light Mode</span>"
                : "🌙 <span>Dark Mode</span>";

    }

}


/* =========================================================
   ATTENDANCE DOCUMENT
========================================================= */

function attendanceDocumentId(
    userId,
    date
) {

    return `${userId}_${date}`;

}


async function getTodayAttendance() {

    if (!currentUser) {
        return null;
    }

    const date =
        getTodayDateInput();

    const reference =
        doc(
            db,
            ATTENDANCE,
            attendanceDocumentId(
                currentUser.uid,
                date
            )
        );

    const snapshot =
        await getDoc(reference);

    if (!snapshot.exists()) {
        return null;
    }

    return {
        id:
            snapshot.id,

        ...snapshot.data()
    };

}


/* =========================================================
   TIME IN
========================================================= */

async function timeIn() {

    if (!currentUser) {
        return;
    }

    if (attendanceToday?.timeIn) {

        showToast(
            "You are already timed in.",
            "info"
        );

        return;
    }

    const now =
        new Date();

    const date =
        getDateKey(now);

    const time =
        `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const reference =
        doc(
            db,
            ATTENDANCE,
            attendanceDocumentId(
                currentUser.uid,
                date
            )
        );

    try {

        await setDoc(
            reference,
            {
                userId:
                    currentUser.uid,

                userName:
                    currentProfile.displayName,

                userEmail:
                    currentProfile.email,

                date,

                timeIn:
                    time,

                timeOut:
                    null,

                location:
                    "Not specified",

                totalMinutes:
                    0,

                status:
                    "working",

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()
            },
            {
                merge: true
            }
        );

        await loadAttendance();

        showToast(
            `Time In recorded at ${time}.`,
            "success"
        );

        renderDashboard();

    } catch (error) {

        console.error(error);

        showToast(
            firebaseErrorMessage(error),
            "error"
        );

    }

}


/* =========================================================
   TIME OUT
========================================================= */

async function timeOut() {

    if (!currentUser) {
        return;
    }

    if (
        !attendanceToday ||
        !attendanceToday.timeIn
    ) {

        showToast(
            "You must Time In first.",
            "error"
        );

        return;
    }

    if (attendanceToday.timeOut) {

        showToast(
            "You are already timed out.",
            "info"
        );

        return;
    }

    const now =
        new Date();

    const date =
        getDateKey(now);

    const time =
        `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const totalMinutes =
        calculateTimeDifference(
            attendanceToday.timeIn,
            time
        );

    const reference =
        doc(
            db,
            ATTENDANCE,
            attendanceDocumentId(
                currentUser.uid,
                date
            )
        );

    try {

        await updateDoc(
            reference,
            {
                timeOut:
                    time,

                totalMinutes,

                status:
                    "completed",

                updatedAt:
                    serverTimestamp()
            }
        );

        await loadAttendance();

        showToast(
            `Time Out recorded. Total: ${minutesToText(totalMinutes)}.`,
            "success"
        );

        renderDashboard();

    } catch (error) {

        console.error(error);

        showToast(
            firebaseErrorMessage(error),
            "error"
        );

    }

}


/* =========================================================
   LOAD ATTENDANCE
========================================================= */

async function loadAttendance() {

    attendanceToday =
        await getTodayAttendance();

    updateAttendanceUI();

}


function updateAttendanceUI() {

    const status =
        $("attendanceStatus");

    const times =
        $("attendanceTimes");

    const timeInBtn =
        $("timeInBtn");

    const timeOutBtn =
        $("timeOutBtn");

    if (!status) {
        return;
    }

    if (!attendanceToday) {

        status.textContent =
            "Not Timed In";

        times.innerHTML =
            "Time In: —<br>Time Out: —";

        timeInBtn.disabled =
            false;

        timeOutBtn.disabled =
            true;

        return;

    }

    status.textContent =
        attendanceToday.timeOut
            ? "Completed"
            : "Working";

    times.innerHTML =
        `Time In: ${escapeHtml(attendanceToday.timeIn || "—")}
         <br>
         Time Out: ${escapeHtml(attendanceToday.timeOut || "—")}`;

    timeInBtn.disabled =
        Boolean(
            attendanceToday.timeIn
        );

    timeOutBtn.disabled =
        Boolean(
            !attendanceToday.timeIn ||
            attendanceToday.timeOut
        );

}


/* =========================================================
   TASKS
========================================================= */

async function getUserTasks() {

    if (!currentUser) {
        return [];
    }

    const reference =
        collection(db, TASKS);

    const taskQuery =
        query(
            reference,
            where(
                "userId",
                "==",
                currentUser.uid
            )
        );

    const snapshot =
        await getDocs(taskQuery);

    return snapshot.docs
        .map(item => ({
            id:
                item.id,
            ...item.data()
        }))
        .sort(
            (a, b) =>
                String(b.date || "")
                    .localeCompare(
                        String(a.date || "")
                    )
        );

}


async function saveTask(event) {

    event.preventDefault();

    if (!currentUser) {
        return;
    }

    const id =
        $("taskId").value.trim();

    const date =
        $("taskDate").value;

    const set =
        $("taskSet").value;

    const task =
        $("taskType")
            .value
            .trim();

    const taskName =
        $("taskName")
            .value
            .trim();

    const taskLink =
        $("taskLink")
            .value
            .trim();

    const hours =
        Number(
            $("taskHours").value
        ) || 0;

    const minutes =
        Number(
            $("taskMinutes").value
        ) || 0;

    const totalMinutes =
        hoursToMinutes(
            hours,
            minutes
        );

    const notes =
        $("taskNotes")
            .value
            .trim();

    if (!date || !task || !taskName) {

        showToast(
            "Please complete the required fields.",
            "error"
        );

        return;
    }

    const data = {

        userId:
            currentUser.uid,

        userName:
            currentProfile.displayName,

        userEmail:
            currentProfile.email,

        date,

        month:
            date.slice(0, 7),

        set,

        task,

        taskName,

        taskLink,

        totalMinutes,

        totalHours:
            totalMinutes / 60,

        notes,

        updatedAt:
            serverTimestamp()

    };

    try {

        if (id) {

            await updateDoc(
                doc(
                    db,
                    TASKS,
                    id
                ),
                data
            );

        } else {

            const reference =
                doc(
                    collection(
                        db,
                        TASKS
                    )
                );

            await setDoc(
                reference,
                {
                    ...data,

                    createdAt:
                        serverTimestamp()
                }
            );

        }

        closeTaskModal();

        showToast(
            "Task saved successfully.",
            "success"
        );

        renderTasks();

        renderDashboard();

    } catch (error) {

        console.error(error);

        showToast(
            firebaseErrorMessage(error),
            "error"
        );

    }

}


async function deleteTask(id) {

    if (!id) {
        return;
    }

    if (
        !confirm(
            "Delete this task?"
        )
    ) {
        return;
    }

    try {

        await deleteDoc(
            doc(
                db,
                TASKS,
                id
            )
        );

        showToast(
            "Task deleted.",
            "success"
        );

        renderTasks();

        renderDashboard();

    } catch (error) {

        showToast(
            firebaseErrorMessage(error),
            "error"
        );

    }

}


/* =========================================================
   TASK MODAL
========================================================= */

function openTaskModal(task = null) {

    $("taskForm")
        .reset();

    $("taskId").value =
        task?.id || "";

    $("taskDate").value =
        task?.date ||
        getTodayDateInput();

    $("taskSet").value =
        task?.set ||
        "Set 1";

    $("taskType").value =
        task?.task ||
        "";

    $("taskName").value =
        task?.taskName ||
        "";

    $("taskLink").value =
        task?.taskLink ||
        "";

    $("taskHours").value =
        task
            ? Math.floor(
                taskHoursValue(task) / 60
            )
            : 0;

    $("taskMinutes").value =
        task
            ? taskHoursValue(task) % 60
            : 0;

    $("taskNotes").value =
        task?.notes ||
        "";

    $("taskModalTitle")
        .textContent =
        task
            ? "Edit Task"
            : "New Task";

    resetTaskTimer();

    $("taskModal")
        .classList
        .remove("hidden");

}


function closeTaskModal() {

    stopTaskTimer();

    $("taskModal")
        .classList
        .add("hidden");

}


function editTaskFromButton(button) {

    const task =
        JSON.parse(
            decodeURIComponent(
                button.dataset.task
            )
        );

    openTaskModal(task);

}


/* =========================================================
   TASK TIMER
========================================================= */

function resetTaskTimer() {

    stopTaskTimer();

    taskTimerSeconds =
        0;

    updateTaskTimerDisplay();

}


function updateTaskTimerDisplay() {

    const hours =
        Math.floor(
            taskTimerSeconds / 3600
        );

    const minutes =
        Math.floor(
            (taskTimerSeconds % 3600) / 60
        );

    const seconds =
        taskTimerSeconds % 60;

    if ($("taskTimerDisplay")) {

        $("taskTimerDisplay")
            .textContent =
            `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

    }

}


function toggleTaskTimer() {

    if (taskTimerRunning) {

        stopTaskTimer();

    } else {

        startTaskTimer();

    }

}


function startTaskTimer() {

    taskTimerRunning =
        true;

    $("taskTimerBtn")
        .textContent =
        "⏸ Pause Timer";

    taskTimerInterval =
        setInterval(() => {

            taskTimerSeconds++;

            updateTaskTimerDisplay();

        }, 1000);

}


function stopTaskTimer() {

    taskTimerRunning =
        false;

    if (taskTimerInterval) {

        clearInterval(
            taskTimerInterval
        );

        taskTimerInterval =
            null;

    }

    if ($("taskTimerBtn")) {

        $("taskTimerBtn")
            .textContent =
            "▶ Start Timer";

    }

}


/* =========================================================
   RENDER TASKS
========================================================= */

async function renderTasks() {

    const body =
        $("tasksTableBody");

    if (!body) {
        return;
    }

    body.innerHTML =
        `<tr><td colspan="7" class="empty-state">
            Loading tasks...
        </td></tr>`;

    try {

        let tasks =
            await getUserTasks();

        const search =
            $("taskSearch")
                ?.value
                .trim()
                .toLowerCase() ||
            "";

        const month =
            $("taskMonthFilter")
                ?.value ||
            "";

        if (search) {

            tasks =
                tasks.filter(task =>

                    `${task.task} ${task.taskName} ${task.notes}`
                        .toLowerCase()
                        .includes(search)

                );

        }

        if (month) {

            tasks =
                tasks.filter(
                    task =>
                        task.month === month
                );

        }

        if (!tasks.length) {

            body.innerHTML =
                `<tr>
                    <td colspan="7">
                        <div class="empty-state">
                            No tasks found.
                        </div>
                    </td>
                </tr>`;

            return;

        }

        body.innerHTML =
            tasks.map(task => {

                const encoded =
                    encodeURIComponent(
                        JSON.stringify(task)
                    );

                return `
                    <tr>

                        <td>
                            ${escapeHtml(
                                formatDate(task.date)
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                task.set || "—"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                task.task || "—"
                            )}
                        </td>

                        <td>
                            <strong>
                                ${escapeHtml(
                                    task.taskName || "—"
                                )}
                            </strong>
                        </td>

                        <td>
                            ${escapeHtml(
                                minutesToText(
                                    taskHoursValue(task)
                                )
                            )}
                        </td>

                        <td>
                            ${
                                task.taskLink
                                    ? `
                                        <a
                                            class="table-link"
                                            href="${escapeHtml(task.taskLink)}"
                                            target="_blank"
                                            rel="noopener"
                                        >
                                            Open
                                        </a>
                                      `
                                    : "—"
                            }
                        </td>

                        <td>

                            <div class="table-actions">

                                <button
                                    data-task="${encoded}"
                                    onclick="editTaskFromButton(this)"
                                >
                                    Edit
                                </button>

                                <button
                                    class="danger"
                                    onclick="deleteTask('${task.id}')"
                                >
                                    Delete
                                </button>

                            </div>

                        </td>

                    </tr>
                `;

            }).join("");

    } catch (error) {

        console.error(error);

        body.innerHTML =
            `<tr>
                <td colspan="7">
                    <div class="empty-state">
                        Unable to load tasks.
                    </div>
                </td>
            </tr>`;

        showToast(
            firebaseErrorMessage(error),
            "error"
        );

    }

}


/* =========================================================
   DAILY REPORTS
========================================================= */

async function getDailyReports(
    ownOnly = true
) {

    if (!currentUser) {
        return [];
    }

    const reference =
        collection(
            db,
            DAILY_REPORTS
        );

    let snapshot;

    if (ownOnly) {

        const reportQuery =
            query(
                reference,
                where(
                    "userId",
                    "==",
                    currentUser.uid
                )
            );

        snapshot =
            await getDocs(
                reportQuery
            );

    } else {

        snapshot =
            await getDocs(
                reference
            );

    }

    return snapshot.docs
        .map(item => ({
            id:
                item.id,
            ...item.data()
        }))
        .sort(
            (a, b) =>
                String(b.date || "")
                    .localeCompare(
                        String(a.date || "")
                    )
        );

}


function openDailyReport(report = null) {

    $("dailyReportForm")
        .reset();

    $("dailyReportId").value =
        report?.id || "";

    $("dailyReportDate").value =
        report?.date ||
        getTodayDateInput();

    $("dailyReportLocation").value =
        report?.location ||
        "";

    $("dailyReportTimeIn").value =
        report?.timeIn ||
        attendanceToday?.timeIn ||
        "";

    $("dailyReportTimeOut").value =
        report?.timeOut ||
        attendanceToday?.timeOut ||
        "";

    $("dailyReportMonth").value =
        report?.month ||
        getCurrentMonthInput();

    $("dailyReportSet").value =
        report?.set ||
        "Set 1";

    $("dailyReportTask").value =
        report?.task ||
        "";

    $("dailyReportTaskName").value =
        report?.taskName ||
        "";

    $("dailyReportTaskLink").value =
        report?.taskLink ||
        "";

    $("dailyReportHours").value =
        report?.totalHoursText ||
        (
            report?.totalMinutes !== undefined
                ? minutesToText(
                    report.totalMinutes
                )
                : ""
        );

    $("dailyReportNotes").value =
        report?.notes ||
        "";

    $("dailyReportOpsNote").value =
        report?.opsNote ||
        "";

    /*
       Employees can edit their own reports.
       Ops note becomes read-only for employees.
    */

    $("dailyReportOpsNote")
        .disabled =
        !isManager();

    $("dailyReportModal")
        .classList
        .remove("hidden");

}


function closeDailyReport() {

    $("dailyReportModal")
        .classList
        .add("hidden");

}


async function saveDailyReport(event) {

    event.preventDefault();

    if (!currentUser) {
        return;
    }

    const id =
        $("dailyReportId")
            .value
            .trim();

    const date =
        $("dailyReportDate")
            .value;

    const location =
        $("dailyReportLocation")
            .value
            .trim();

    const timeIn =
        $("dailyReportTimeIn")
            .value;

    const timeOut =
        $("dailyReportTimeOut")
            .value;

    const month =
        $("dailyReportMonth")
            .value ||
        date.slice(0, 7);

    const set =
        $("dailyReportSet")
            .value;

    const task =
        $("dailyReportTask")
            .value
            .trim();

    const taskName =
        $("dailyReportTaskName")
            .value
            .trim();

    const taskLink =
        $("dailyReportTaskLink")
            .value
            .trim();

    const totalHoursText =
        $("dailyReportHours")
            .value
            .trim();

    const notes =
        $("dailyReportNotes")
            .value
            .trim();

    const opsNote =
        $("dailyReportOpsNote")
            .value
            .trim();

    const totalMinutes =
        calculateTimeDifference(
            timeIn,
            timeOut
        );

    const data = {

        userId:
            currentUser.uid,

        userName:
            currentProfile.displayName,

        userEmail:
            currentProfile.email,

        date,

        timeIn,

        timeOut,

        location,

        month,

        set,

        task,

        taskName,

        taskLink,

        totalMinutes,

        totalHours:
            totalMinutes / 60,

        totalHoursText:
            totalHoursText ||
            minutesToText(
                totalMinutes
            ),

        notes,

        /*
           Preserve existing ops note when
           an employee edits their report.
        */

        opsNote,

        archived:
            false,

        updatedAt:
            serverTimestamp()

    };

    try {

        if (id) {

            const existing =
                await getDoc(
                    doc(
                        db,
                        DAILY_REPORTS,
                        id
                    )
                );

            if (
                existing.exists() &&
                existing.data().userId !==
                currentUser.uid &&
                !isManager()
            ) {

                showToast(
                    "You cannot edit this report.",
                    "error"
                );

                return;

            }

            await updateDoc(
                doc(
                    db,
                    DAILY_REPORTS,
                    id
                ),
                data
            );

        } else {

            const reference =
                doc(
                    collection(
                        db,
                        DAILY_REPORTS
                    )
                );

            await setDoc(
                reference,
                {
                    ...data,

                    createdAt:
                        serverTimestamp()
                }
            );

        }

        closeDailyReport();

        showToast(
            "Daily report saved.",
            "success"
        );

        renderDailyReports();

        renderDashboard();

    } catch (error) {

        console.error(error);

        showToast(
            firebaseErrorMessage(error),
            "error"
        );

    }

}


/* =========================================================
   EDIT DAILY REPORT
========================================================= */

async function editDailyReport(id) {

    try {

        const snapshot =
            await getDoc(
                doc(
                    db,
                    DAILY_REPORTS,
                    id
                )
            );

        if (!snapshot.exists()) {

            showToast(
                "Report not found.",
                "error"
            );

            return;

        }

        const report = {
            id,
            ...snapshot.data()
        };

        if (
            report.userId !==
            currentUser.uid &&
            !isManager()
        ) {

            showToast(
                "You do not have permission to edit this report.",
                "error"
            );

            return;

        }

        openDailyReport(report);

    } catch (error) {

        showToast(
            firebaseErrorMessage(error),
            "error"
        );

    }

}


/* =========================================================
   ARCHIVE REPORT
========================================================= */

async function toggleReportArchive(
    id,
    archived
) {

    try {

        await updateDoc(
            doc(
                db,
                DAILY_REPORTS,
                id
            ),
            {
                archived:
                    Boolean(archived),

                updatedAt:
                    serverTimestamp()
            }
        );

        showToast(
            archived
                ? "Report archived."
                : "Report restored.",
            "success"
        );

        renderDailyReports();

        if (isManager()) {
            renderManagerDashboard();
        }

        if (isAdmin()) {
            renderAdminDashboard();
        }

    } catch (error) {

        showToast(
            firebaseErrorMessage(error),
            "error"
        );

    }

}


/* =========================================================
   DELETE REPORT
========================================================= */

async function deleteDailyReport(id) {

    if (!isAdmin()) {

        showToast(
            "Only admins can permanently delete reports.",
            "error"
        );

        return;

    }

    if (
        !confirm(
            "Permanently delete this report?"
        )
    ) {
        return;
    }

    try {

        await deleteDoc(
            doc(
                db,
                DAILY_REPORTS,
                id
            )
        );

        showToast(
            "Report deleted.",
            "success"
        );

        renderDailyReports();

        renderAdminDashboard();

    } catch (error) {

        showToast(
            firebaseErrorMessage(error),
            "error"
        );

    }

}


/* =========================================================
   REPORT FILTERS
========================================================= */

function reportMatchesFilters(report) {

    const date =
        $("reportDateFilter")
            ?.value ||
        "";

    const month =
        $("reportMonthFilter")
            ?.value ||
        "";

    const archive =
        $("reportArchiveFilter")
            ?.value ||
        "active";

    if (
        date &&
        report.date !== date
    ) {
        return false;
    }

    if (
        month &&
        report.month !== month
    ) {
        return false;
    }

    if (
        archive === "active" &&
        report.archived
    ) {
        return false;
    }

    if (
        archive === "archived" &&
        !report.archived
    ) {
        return false;
    }

    return true;

}


/* =========================================================
   RENDER DAILY REPORTS
========================================================= */

async function renderDailyReports() {

    const body =
        $("dailyReportsTableBody");

    if (!body) {
        return;
    }

    body.innerHTML =
        `<tr>
            <td colspan="15">
                <div class="empty-state">
                    Loading reports...
                </div>
            </td>
        </tr>`;

    try {

        let reports =
            await getDailyReports(
                true
            );

        reports =
            reports.filter(
                reportMatchesFilters
            );

        if (!reports.length) {

            body.innerHTML =
                `<tr>
                    <td colspan="15">
                        <div class="empty-state">
                            No daily reports found.
                        </div>
                    </td>
                </tr>`;

            return;

        }

        body.innerHTML =
            reports.map(report => {

                return `
                    <tr>

                        <td>
                            ${escapeHtml(
                                formatDate(report.date)
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                report.userName || "—"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                report.timeIn || "—"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                report.timeOut || "—"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                report.location || "—"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                report.month || "—"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                report.set || "—"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                report.task || "—"
                            )}
                        </td>

                        <td>
                            <strong>
                                ${escapeHtml(
                                    report.taskName || "—"
                                )}
                            </strong>
                        </td>

                        <td>
                            ${
                                report.taskLink
                                    ? `
                                        <a
                                            class="table-link"
                                            href="${escapeHtml(report.taskLink)}"
                                            target="_blank"
                                            rel="noopener"
                                        >
                                            Open
                                        </a>
                                      `
                                    : "—"
                            }
                        </td>

                        <td>
                            ${escapeHtml(
                                report.totalHoursText ||
                                minutesToText(
                                    report.totalMinutes
                                )
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                report.notes || "—"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                report.opsNote || "—"
                            )}
                        </td>

                        <td>
                            ${
                                report.archived
                                    ? "Archived"
                                    : "Active"
                            }
                        </td>

                        <td>

                            <div class="table-actions">

                                <button
                                    onclick="editDailyReport('${report.id}')"
                                >
                                    Edit
                                </button>

                                <button
                                    onclick="toggleReportArchive(
                                        '${report.id}',
                                        ${!report.archived}
                                    )"
                                >
                                    ${
                                        report.archived
                                            ? "Restore"
                                            : "Archive"
                                    }
                                </button>

                            </div>

                        </td>

                    </tr>
                `;

            }).join("");

    } catch (error) {

        console.error(error);

        body.innerHTML =
            `<tr>
                <td colspan="15">
                    <div class="empty-state">
                        Unable to load reports.
                    </div>
                </td>
            </tr>`;

        showToast(
            firebaseErrorMessage(error),
            "error"
        );

    }

}


/* =========================================================
   DASHBOARD
========================================================= */

async function renderDashboard() {

    if (!currentUser) {
        return;
    }

    if ($("currentDate")) {

        $("currentDate")
            .textContent =
            new Date()
                .toLocaleDateString(
                    undefined,
                    {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                    }
                );

    }

    await loadAttendance();

    try {

        const tasks =
            await getUserTasks();

        const reports =
            await getDailyReports(
                true
            );

        const today =
            getTodayDateInput();

        const month =
            getCurrentMonthInput();

        const todayTasks =
            tasks.filter(
                task =>
                    task.date === today
            );

        const todayReports =
            reports.filter(
                report =>
                    report.date === today
            );

        const monthTasks =
            tasks.filter(
                task =>
                    task.month === month
            );

        const todayTaskMinutes =
            todayTasks.reduce(
                (
                    total,
                    task
                ) =>
                    total +
                    taskHoursValue(task),
                0
            );

        const monthTaskMinutes =
            monthTasks.reduce(
                (
                    total,
                    task
                ) =>
                    total +
                    taskHoursValue(task),
                0
            );

        $("todayHours")
            .textContent =
            minutesToText(
                attendanceToday?.totalMinutes ||
                todayTaskMinutes
            );

        $("todayTaskCount")
            .textContent =
            todayTasks.length;

        $("todayReportCount")
            .textContent =
            todayReports.length;

        $("monthHours")
            .textContent =
            minutesToText(
                monthTaskMinutes
            );

        renderRecentTasks(
            todayTasks.length
                ? todayTasks
                : tasks.slice(0, 5)
        );

    } catch (error) {

        console.error(error);

    }

}


function renderRecentTasks(tasks) {

    const container =
        $("recentTasks");

    if (!container) {
        return;
    }

    if (!tasks.length) {

        container.innerHTML =
            `<div class="empty-state">
                No tasks recorded yet.
            </div>`;

        return;

    }

    container.innerHTML =
        tasks
            .slice(0, 5)
            .map(task => {

                return `
                    <div class="recent-item">

                        <div>

                            <strong>
                                ${escapeHtml(
                                    task.taskName
                                )}
                            </strong>

                            <span>
                                ${escapeHtml(
                                    task.task
                                )}
                                ·
                                ${escapeHtml(
                                    task.set
                                )}
                                ·
                                ${formatDate(task.date)}
                            </span>

                        </div>

                        <strong>
                            ${minutesToText(
                                taskHoursValue(task)
                            )}
                        </strong>

                    </div>
                `;

            })
            .join("");

}


/* =========================================================
   REPORTS
========================================================= */

async function renderReports() {

    const body =
        $("reportsTableBody");

    if (!body) {
        return;
    }

    try {

        const tasks =
            await getUserTasks();

        const totalMinutes =
            tasks.reduce(
                (
                    total,
                    task
                ) =>
                    total +
                    taskHoursValue(task),
                0
            );

        const month =
            getCurrentMonthInput();

        const monthMinutes =
            tasks
                .filter(
                    task =>
                        task.month === month
                )
                .reduce(
                    (
                        total,
                        task
                    ) =>
                        total +
                        taskHoursValue(task),
                    0
                );

        $("reportSummary")
            .innerHTML = `

                <div class="summary-box">
                    <span>Total Tasks</span>
                    <strong>
                        ${tasks.length}
                    </strong>
                </div>

                <div class="summary-box">
                    <span>Total Hours</span>
                    <strong>
                        ${minutesToText(
                            totalMinutes
                        )}
                    </strong>
                </div>

                <div class="summary-box">
                    <span>This Month</span>
                    <strong>
                        ${minutesToText(
                            monthMinutes
                        )}
                    </strong>
                </div>

            `;

        if (!tasks.length) {

            body.innerHTML =
                `<tr>
                    <td colspan="5">
                        <div class="empty-state">
                            No reports available.
                        </div>
                    </td>
                </tr>`;

            return;

        }

        body.innerHTML =
            tasks.map(task => {

                return `
                    <tr>

                        <td>
                            ${formatDate(
                                task.date
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                task.task
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                task.taskName
                            )}
                        </td>

                        <td>
                            ${minutesToText(
                                taskHoursValue(task)
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                task.notes || "—"
                            )}
                        </td>

                    </tr>
                `;

            }).join("");

    } catch (error) {

        console.error(error);

        showToast(
            firebaseErrorMessage(error),
            "error"
        );

    }

}


/* =========================================================
   GET ALL USERS
   Manager/Admin only
========================================================= */

async function getAllUsers() {

    if (!isManager()) {
        return [];
    }

    const snapshot =
        await getDocs(
            collection(
                db,
                USERS
            )
        );

    return snapshot.docs
        .map(item => ({
            id:
                item.id,
            ...item.data()
        }))
        .sort(
            (a, b) =>
                String(
                    a.displayName || ""
                ).localeCompare(
                    String(
                        b.displayName || ""
                    )
                )
        );

}


/* =========================================================
   GET ALL REPORTS
   Manager/Admin only
========================================================= */

async function getAllReports() {

    if (!isManager()) {
        return [];
    }

    const snapshot =
        await getDocs(
            collection(
                db,
                DAILY_REPORTS
            )
        );

    return snapshot.docs
        .map(item => ({
            id:
                item.id,
            ...item.data()
        }))
        .sort(
            (a, b) =>
                String(b.date || "")
                    .localeCompare(
                        String(a.date || "")
                    )
        );

}


/* =========================================================
   GET ALL TASKS
========================================================= */

async function getAllTasks() {

    if (!isManager()) {
        return [];
    }

    const snapshot =
        await getDocs(
            collection(
                db,
                TASKS
            )
        );

    return snapshot.docs
        .map(item => ({
            id:
                item.id,
            ...item.data()
        }));

}


/* =========================================================
   GET TODAY ATTENDANCE FOR USER
========================================================= */

async function getAttendanceForUser(
    userId,
    date
) {

    const snapshot =
        await getDoc(
            doc(
                db,
                ATTENDANCE,
                attendanceDocumentId(
                    userId,
                    date
                )
            )
        );

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.data();

}


/* =========================================================
   MANAGER DASHBOARD
========================================================= */

async function renderManagerDashboard() {

    if (!isManager()) {
        return;
    }

    try {

        const users =
            await getAllUsers();

        const reports =
            await getAllReports();

        const tasks =
            await getAllTasks();

        const employees =
            users.filter(
                user =>
                    user.role !== "admin"
            );

        const today =
            getTodayDateInput();

        let workingToday = 0;

        let totalMinutes = 0;

        const attendanceMap =
            new Map();

        for (
            const user of employees
        ) {

            const attendance =
                await getAttendanceForUser(
                    user.id,
                    today
                );

            attendanceMap.set(
                user.id,
                attendance
            );

            if (
                attendance &&
                attendance.timeIn &&
                !attendance.timeOut
            ) {

                workingToday++;

            }

            if (attendance) {

                totalMinutes +=
                    Number(
                        attendance.totalMinutes
                    ) || 0;

            }

        }

        $("managerEmployeeCount")
            .textContent =
            employees.length;

        $("managerWorkingCount")
            .textContent =
            workingToday;

        $("managerTaskCount")
            .textContent =
            tasks.length;

        $("managerHours")
            .textContent =
            minutesToText(
                totalMinutes
            );

        renderManagerUsers(
            employees,
            attendanceMap
        );

        renderManagerReports(
            reports.slice(0, 50)
        );

    } catch (error) {

        console.error(error);

        showToast(
            firebaseErrorMessage(error),
            "error"
        );

    }

}


function renderManagerUsers(
    users,
    attendanceMap
) {

    const body =
        $("managerUsersTable");

    if (!body) {
        return;
    }

    if (!users.length) {

        body.innerHTML =
            `<tr>
                <td colspan="5">
                    <div class="empty-state">
                        No employees found.
                    </div>
                </td>
            </tr>`;

        return;

    }

    body.innerHTML =
        users.map(user => {

            const attendance =
                attendanceMap.get(
                    user.id
                );

            const status =
                attendance?.timeIn
                    ? (
                        attendance.timeOut
                            ? "Completed"
                            : "Working"
                    )
                    : "Not Timed In";

            const hours =
                attendance?.totalMinutes || 0;

            return `
                <tr>

                    <td>
                        <strong>
                            ${escapeHtml(
                                user.displayName || "User"
                            )}
                        </strong>
                    </td>

                    <td>
                        ${escapeHtml(
                            user.email
                        )}
                    </td>

                    <td>
                        <span
                            class="role-badge ${user.role || "employee"}"
                        >
                            ${roleLabel(
                                user.role
                            )}
                        </span>
                    </td>

                    <td>
                        ${status}
                    </td>

                    <td>
                        ${minutesToText(hours)}
                    </td>

                </tr>
            `;

        }).join("");

}


function renderManagerReports(
    reports
) {

    const body =
        $("managerReportsTable");

    if (!body) {
        return;
    }

    if (!reports.length) {

        body.innerHTML =
            `<tr>
                <td colspan="7">
                    <div class="empty-state">
                        No reports found.
                    </div>
                </td>
            </tr>`;

        return;

    }

    body.innerHTML =
        reports.map(report => {

            return `
                <tr>

                    <td>
                        ${formatDate(
                            report.date
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            report.userName || "—"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            report.task || "—"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            report.taskName || "—"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            report.totalHoursText ||
                            minutesToText(
                                report.totalMinutes
                            )
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            report.notes || "—"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            report.opsNote || "—"
                        )}
                    </td>

                </tr>
            `;

        }).join("");

}


/* =========================================================
   ADMIN DASHBOARD
========================================================= */

async function renderAdminDashboard() {

    if (!isAdmin()) {
        return;
    }

    try {

        const users =
            await getAllUsers();

        const reports =
            await getAllReports();

        const employees =
            users.filter(
                user =>
                    user.role ===
                    "employee"
            );

        const managers =
            users.filter(
                user =>
                    user.role ===
                    "manager"
            );

        const admins =
            users.filter(
                user =>
                    user.role ===
                    "admin"
            );

        $("adminTotalUsers")
            .textContent =
            users.length;

        $("adminEmployeeCount")
            .textContent =
            employees.length;

        $("adminManagerCount")
            .textContent =
            managers.length;

        $("adminAdminCount")
            .textContent =
            admins.length;

        renderAdminUsers(
            users
        );

        renderAdminReports(
            reports.slice(0, 100)
        );

    } catch (error) {

        console.error(error);

        showToast(
            firebaseErrorMessage(error),
            "error"
        );

    }

}


/* =========================================================
   ADMIN USER TABLE
========================================================= */

function renderAdminUsers(users) {

    const body =
        $("adminUsersTable");

    if (!body) {
        return;
    }

    if (!users.length) {

        body.innerHTML =
            `<tr>
                <td colspan="5">
                    <div class="empty-state">
                        No users found.
                    </div>
                </td>
            </tr>`;

        return;

    }

    body.innerHTML =
        users.map(user => {

            const isCurrent =
                user.id ===
                currentUser.uid;

            return `
                <tr>

                    <td>
                        <strong>
                            ${escapeHtml(
                                user.displayName || "User"
                            )}
                        </strong>
                    </td>

                    <td>
                        ${escapeHtml(
                            user.email
                        )}
                    </td>

                    <td>
                        ${formatDateTime(
                            user.createdAt
                        )}
                    </td>

                    <td>

                        <span
                            class="role-badge ${user.role || "employee"}"
                        >
                            ${roleLabel(
                                user.role
                            )}
                        </span>

                    </td>

                    <td>

                        <select
                            onchange="changeUserRole(
                                '${user.id}',
                                this.value
                            )"
                            ${isCurrent ? "disabled" : ""}
                        >

                            <option
                                value="employee"
                                ${user.role === "employee" ? "selected" : ""}
                            >
                                Employee
                            </option>

                            <option
                                value="manager"
                                ${user.role === "manager" ? "selected" : ""}
                            >
                                Manager
                            </option>

                            <option
                                value="admin"
                                ${user.role === "admin" ? "selected" : ""}
                            >
                                Admin
                            </option>

                        </select>

                    </td>

                </tr>
            `;

        }).join("");

}


/* =========================================================
   ADMIN REPORTS
========================================================= */

function renderAdminReports(
    reports
) {

    const body =
        $("adminReportsTable");

    if (!body) {
        return;
    }

    if (!reports.length) {

        body.innerHTML =
            `<tr>
                <td colspan="8">
                    <div class="empty-state">
                        No reports found.
                    </div>
                </td>
            </tr>`;

        return;

    }

    body.innerHTML =
        reports.map(report => {

            return `
                <tr>

                    <td>
                        ${formatDate(
                            report.date
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            report.userName || "—"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            report.task || "—"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            report.taskName || "—"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            report.totalHoursText ||
                            minutesToText(
                                report.totalMinutes
                            )
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            report.notes || "—"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            report.opsNote || "—"
                        )}
                    </td>

                    <td>
                        ${
                            report.archived
                                ? "Archived"
                                : "Active"
                        }
                    </td>

                </tr>
            `;

        }).join("");

}


/* =========================================================
   CHANGE USER ROLE
========================================================= */

async function changeUserRole(
    userId,
    role
) {

    if (!isAdmin()) {

        showToast(
            "Admin access required.",
            "error"
        );

        return;

    }

    if (
        ![
            "employee",
            "manager",
            "admin"
        ].includes(role)
    ) {

        return;

    }

    if (
        userId ===
        currentUser.uid
    ) {

        showToast(
            "You cannot change your own role here.",
            "error"
        );

        renderAdminDashboard();

        return;

    }

    if (
        !confirm(
            `Change this user's role to ${roleLabel(role)}?`
        )
    ) {

        renderAdminDashboard();

        return;

    }

    try {

        await updateDoc(
            doc(
                db,
                USERS,
                userId
            ),
            {
                role,

                updatedAt:
                    serverTimestamp()
            }
        );

        showToast(
            "User role updated.",
            "success"
        );

        renderAdminDashboard();

    } catch (error) {

        console.error(error);

        showToast(
            firebaseErrorMessage(error),
            "error"
        );

        renderAdminDashboard();

    }

}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function initializeEventListeners() {

    $("loginForm")
        ?.addEventListener(
            "submit",
            loginUser
        );

    $("registerForm")
        ?.addEventListener(
            "submit",
            registerUser
        );

    $("showRegisterBtn")
        ?.addEventListener(
            "click",
            showRegisterForm
        );

    $("showLoginBtn")
        ?.addEventListener(
            "click",
            showLoginForm
        );

    $("forgotPasswordBtn")
        ?.addEventListener(
            "click",
            resetPassword
        );

    $("logoutBtn")
        ?.addEventListener(
            "click",
            logoutUser
        );

    $("themeBtn")
        ?.addEventListener(
            "click",
            toggleTheme
        );

    $("settingsThemeBtn")
        ?.addEventListener(
            "click",
            toggleTheme
        );

    $("timeInBtn")
        ?.addEventListener(
            "click",
            timeIn
        );

    $("timeOutBtn")
        ?.addEventListener(
            "click",
            timeOut
        );

    $("newTaskBtn")
        ?.addEventListener(
            "click",
            () =>
                openTaskModal()
        );

    $("closeTaskModalBtn")
        ?.addEventListener(
            "click",
            closeTaskModal
        );

    $("cancelTaskBtn")
        ?.addEventListener(
            "click",
            closeTaskModal
        );

    $("taskForm")
        ?.addEventListener(
            "submit",
            saveTask
        );

    $("taskTimerBtn")
        ?.addEventListener(
            "click",
            toggleTaskTimer
        );

    $("taskSearch")
        ?.addEventListener(
            "input",
            renderTasks
        );

    $("taskMonthFilter")
        ?.addEventListener(
            "change",
            renderTasks
        );

    $("newDailyReportBtn")
        ?.addEventListener(
            "click",
            () =>
                openDailyReport()
        );

    $("closeDailyReportBtn")
        ?.addEventListener(
            "click",
            closeDailyReport
        );

    $("cancelDailyReportBtn")
        ?.addEventListener(
            "click",
            closeDailyReport
        );

    $("dailyReportForm")
        ?.addEventListener(
            "submit",
            saveDailyReport
        );

    $("reportDateFilter")
        ?.addEventListener(
            "change",
            renderDailyReports
        );

    $("reportMonthFilter")
        ?.addEventListener(
            "change",
            renderDailyReports
        );

    $("reportArchiveFilter")
        ?.addEventListener(
            "change",
            renderDailyReports
        );

    $("mobileMenuBtn")
        ?.addEventListener(
            "click",
            () => {

                mobileMenuOpen =
                    !mobileMenuOpen;

                document
                    .querySelector(".sidebar")
                    ?.classList.toggle(
                        "mobile-open",
                        mobileMenuOpen
                    );

            }
        );


    /*
       Navigation.
    */

    document
        .querySelectorAll(
            "[data-section]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const section =
                        button.dataset.section;

                    showSection(
                        section
                    );

                }
            );

        });

}


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            currentUser =
                null;

            currentProfile =
                null;

            currentRole =
                "employee";

            showAuthScreen();

            return;

        }

        currentUser =
            user;

        try {

            await loadUserProfile();

            showAppScreen();

            await loadAttendance();

            await renderDashboard();

        } catch (error) {

            console.error(error);

            showToast(
                firebaseErrorMessage(error),
                "error"
            );

            /*
               The account may exist in Authentication
               but not have a Firestore profile yet.
            */

        }

    }
);


/* =========================================================
   INITIALIZATION
========================================================= */

initializeTheme();

initializeEventListeners();


/* =========================================================
   GLOBAL FUNCTIONS
   Required by inline table buttons.
========================================================= */

window.showSection =
    showSection;

window.editTaskFromButton =
    editTaskFromButton;

window.deleteTask =
    deleteTask;

window.editDailyReport =
    editDailyReport;

window.toggleReportArchive =
    toggleReportArchive;

window.deleteDailyReport =
    deleteDailyReport;

window.changeUserRole =
    changeUserRole;
