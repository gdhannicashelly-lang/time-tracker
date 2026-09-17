/* =========================================================
   TIME TRACKER
   LOCAL AUTHENTICATION VERSION
========================================================= */


/* =========================================================
   STORAGE KEYS
========================================================= */

const STORAGE = {

    USERS:
        "timeTrackerUsers",

    SESSION:
        "timeTrackerCurrentUser",

    TASKS:
        "timeTrackerTasks",

    ATTENDANCE:
        "timeTrackerAttendance",

    THEME:
        "timeTrackerTheme"
};


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser = null;


let timerState = {

    taskId: null,

    workSeconds: 0,

    breakSeconds: 0,

    workStartedAt: null,

    breakStartedAt: null,

    timerRunning: false,

    timerPaused: false,

    breakRunning: false,

    interval: null
};


/* =========================================================
   DOM HELPER
========================================================= */

const $ = id =>
    document.getElementById(id);


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "success"
) {

    const container =
        $("toastContainer");

    if (!container) {

        alert(message);

        return;
    }

    const toast =
        document.createElement("div");

    toast.className =
        `toast ${type}`;

    toast.textContent =
        message;

    container.appendChild(
        toast
    );

    setTimeout(
        () => toast.remove(),
        4000
    );
}


/* =========================================================
   SIMPLE PASSWORD HASH
========================================================= */

async function hashPassword(password) {

    const encoder =
        new TextEncoder();

    const data =
        encoder.encode(password);

    const hashBuffer =
        await crypto.subtle.digest(
            "SHA-256",
            data
        );

    const hashArray =
        Array.from(
            new Uint8Array(
                hashBuffer
            )
        );

    return hashArray
        .map(
            byte =>
                byte
                    .toString(16)
                    .padStart(2, "0")
        )
        .join("");
}


/* =========================================================
   USER STORAGE
========================================================= */

function getUsers() {

    try {

        return JSON.parse(
            localStorage.getItem(
                STORAGE.USERS
            )
        ) || [];

    } catch (error) {

        console.error(
            "Could not load users:",
            error
        );

        return [];
    }
}


function saveUsers(users) {

    localStorage.setItem(
        STORAGE.USERS,
        JSON.stringify(users)
    );
}


/* =========================================================
   SESSION
========================================================= */

function saveSession(user) {

    localStorage.setItem(
        STORAGE.SESSION,
        JSON.stringify({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
        })
    );
}


function loadSession() {

    try {

        return JSON.parse(
            localStorage.getItem(
                STORAGE.SESSION
            )
        );

    } catch {

        return null;
    }
}


function clearSession() {

    localStorage.removeItem(
        STORAGE.SESSION
    );
}


/* =========================================================
   USER-SPECIFIC STORAGE KEY
========================================================= */

function getUserStorageKey(
    baseKey
) {

    if (!currentUser) {

        return baseKey;
    }

    return `${baseKey}_${currentUser.id}`;
}


/* =========================================================
   DATE / TIME
========================================================= */

function formatTime(
    dateValue
) {

    if (!dateValue) {

        return "--:--";
    }

    const date =
        new Date(dateValue);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "--:--";
    }

    return date.toLocaleTimeString(
        [],
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );
}


function formatDate(
    dateValue
) {

    if (!dateValue) {

        return "";
    }

    const date =
        new Date(dateValue);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";
    }

    return date.toLocaleDateString(
        [],
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}


function getDateKey(
    date = new Date()
) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/* =========================================================
   DURATION
========================================================= */

function formatDuration(
    totalSeconds
) {

    totalSeconds =
        Math.max(
            0,
            Math.floor(
                Number(
                    totalSeconds
                ) || 0
            )
        );

    const hours =
        Math.floor(
            totalSeconds / 3600
        );

    const minutes =
        Math.floor(
            (
                totalSeconds % 3600
            ) / 60
        );

    return `${hours} hrs ${String(minutes).padStart(2, "0")} min`;
}


function formatTimer(
    totalSeconds
) {

    totalSeconds =
        Math.max(
            0,
            Math.floor(
                Number(
                    totalSeconds
                ) || 0
            )
        );

    const hours =
        Math.floor(
            totalSeconds / 3600
        );

    const minutes =
        Math.floor(
            (
                totalSeconds % 3600
            ) / 60
        );

    const seconds =
        totalSeconds % 60;

    return [
        String(hours).padStart(2, "0"),
        String(minutes).padStart(2, "0"),
        String(seconds).padStart(2, "0")
    ].join(":");
}


/* =========================================================
   ATTENDANCE
========================================================= */

function getAttendance() {

    if (!currentUser) {

        return {
            date: getDateKey(),
            timeIn: null,
            timeOut: null,
            totalBreakSeconds: 0
        };
    }

    try {

        return JSON.parse(
            localStorage.getItem(
                getUserStorageKey(
                    STORAGE.ATTENDANCE
                )
            )
        ) || {

            date: getDateKey(),

            timeIn: null,

            timeOut: null,

            totalBreakSeconds: 0
        };

    } catch {

        return {

            date: getDateKey(),

            timeIn: null,

            timeOut: null,

            totalBreakSeconds: 0
        };
    }
}


function saveAttendance(
    attendance
) {

    if (!currentUser) {

        return;
    }

    localStorage.setItem(

        getUserStorageKey(
            STORAGE.ATTENDANCE
        ),

        JSON.stringify(
            attendance
        )
    );
}


function ensureTodayAttendance() {

    let attendance =
        getAttendance();

    const today =
        getDateKey();

    if (
        attendance.date !==
        today
    ) {

        attendance = {

            date: today,

            timeIn: null,

            timeOut: null,

            totalBreakSeconds: 0
        };

        saveAttendance(
            attendance
        );
    }

    return attendance;
}


/* =========================================================
   ATTENDANCE CALCULATION
========================================================= */

function getWorkedSeconds(
    attendance
) {

    if (
        !attendance ||
        !attendance.timeIn ||
        !attendance.timeOut
    ) {

        return 0;
    }

    const start =
        new Date(
            attendance.timeIn
        ).getTime();

    const end =
        new Date(
            attendance.timeOut
        ).getTime();

    if (
        Number.isNaN(start) ||
        Number.isNaN(end) ||
        end <= start
    ) {

        return 0;
    }

    const elapsed =
        Math.floor(
            (end - start) /
            1000
        );

    const breaks =
        Number(
            attendance.totalBreakSeconds
        ) || 0;

    return Math.max(
        0,
        elapsed - breaks
    );
}


/* =========================================================
   TIME IN
========================================================= */

function timeIn() {

    if (!currentUser) {

        showToast(
            "Please log in first.",
            "error"
        );

        return;
    }

    const attendance =
        ensureTodayAttendance();

    if (attendance.timeIn) {

        showToast(
            "You have already timed in today.",
            "warning"
        );

        return;
    }

    attendance.timeIn =
        new Date().toISOString();

    attendance.timeOut =
        null;

    attendance.totalBreakSeconds =
        0;

    saveAttendance(
        attendance
    );

    updateAttendanceDisplay();

    updateDashboard();

    showToast(
        `Time In recorded at ${formatTime(
            attendance.timeIn
        )}.`,
        "success"
    );
}


/* =========================================================
   TIME OUT
========================================================= */

function timeOut() {

    if (!currentUser) {

        showToast(
            "Please log in first.",
            "error"
        );

        return;
    }

    const attendance =
        ensureTodayAttendance();

    if (!attendance.timeIn) {

        showToast(
            "Please Time In before Time Out.",
            "warning"
        );

        return;
    }

    if (attendance.timeOut) {

        showToast(
            "You have already timed out today.",
            "warning"
        );

        return;
    }

    attendance.timeOut =
        new Date().toISOString();

    saveAttendance(
        attendance
    );

    updateAttendanceDisplay();

    updateDashboard();

    showToast(
        `Time Out recorded at ${formatTime(
            attendance.timeOut
        )}.`,
        "success"
    );
}


/* =========================================================
   ATTENDANCE DISPLAY
========================================================= */

function updateAttendanceDisplay() {

    if (!currentUser) {

        return;
    }

    const attendance =
        ensureTodayAttendance();

    if ($("attendanceDate")) {

        $("attendanceDate").textContent =
            new Date().toLocaleDateString(
                [],
                {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                }
            );
    }

    if ($("timeInDisplay")) {

        $("timeInDisplay").textContent =
            formatTime(
                attendance.timeIn
            );
    }

    if ($("timeOutDisplay")) {

        $("timeOutDisplay").textContent =
            formatTime(
                attendance.timeOut
            );
    }


    /*
       IMPORTANT:

       Attendance does NOT run live.

       Before Time Out:
       Total Worked = 0

       After Time Out:
       Total Worked =
       Time Out - Time In - Break
    */

    if ($("totalWorkedDisplay")) {

        $("totalWorkedDisplay").textContent =
            formatDuration(
                getWorkedSeconds(
                    attendance
                )
            );
    }


    if ($("timeInBtn")) {

        $("timeInBtn").disabled =
            Boolean(
                attendance.timeIn
            );
    }


    if ($("timeOutBtn")) {

        $("timeOutBtn").disabled =
            !attendance.timeIn ||
            Boolean(
                attendance.timeOut
            );
    }


    if ($("attendanceStatus")) {

        if (!attendance.timeIn) {

            $("attendanceStatus").textContent =
                "Not started";

            $("attendanceStatus").className =
                "status-badge ready";

        } else if (
            !attendance.timeOut
        ) {

            $("attendanceStatus").textContent =
                "Currently working";

            $("attendanceStatus").className =
                "status-badge working";

        } else {

            $("attendanceStatus").textContent =
                "Completed";

            $("attendanceStatus").className =
                "status-badge completed";
        }
    }

    updateDashboardStatus(
        attendance
    );
}


/* =========================================================
   DASHBOARD STATUS
========================================================= */

function updateDashboardStatus(
    attendance
) {

    if (!$("dashboardStatus")) {

        return;
    }

    if (!attendance.timeIn) {

        $("dashboardStatus").textContent =
            "Ready";

    } else if (
        !attendance.timeOut
    ) {

        $("dashboardStatus").textContent =
            "Working";

    } else {

        $("dashboardStatus").textContent =
            "Completed";
    }
}


/* =========================================================
   AUTHENTICATION
========================================================= */

async function register() {

    const firstName =
        $("registerFirstName")
            ?.value
            .trim();

    const lastName =
        $("registerLastName")
            ?.value
            .trim();

    const email =
        $("registerEmail")
            ?.value
            .trim()
            .toLowerCase();

    const password =
        $("registerPassword")
            ?.value || "";


    if (
        !firstName ||
        !lastName ||
        !email ||
        !password
    ) {

        showToast(
            "Please fill in all fields.",
            "error"
        );

        return;
    }


    if (password.length < 6) {

        showToast(
            "Password must be at least 6 characters.",
            "error"
        );

        return;
    }


    const users =
        getUsers();

    const existingUser =
        users.find(
            user =>
                user.email === email
        );

    if (existingUser) {

        showToast(
            "This email is already registered. Please log in.",
            "error"
        );

        return;
    }


    const button =
        $("registerForm")
            ?.querySelector(
                'button[type="submit"]'
            );

    if (button) {

        button.disabled = true;

        button.textContent =
            "Creating Account...";
    }


    try {

        const passwordHash =
            await hashPassword(
                password
            );


        const user = {

            id:
                `user_${Date.now()}_${Math.random()
                    .toString(36)
                    .slice(2, 10)}`,

            firstName,

            lastName,

            email,

            passwordHash,

            createdAt:
                new Date().toISOString()
        };


        users.push(user);

        saveUsers(users);


        /*
           Automatically sign in
           after registration.
        */

        currentUser = {

            id: user.id,

            firstName:
                user.firstName,

            lastName:
                user.lastName,

            email:
                user.email
        };


        saveSession(
            currentUser
        );


        $("registerForm")
            ?.reset();


        showAppScreen();


        showToast(
            "Account created successfully!",
            "success"
        );

    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        showToast(
            "Could not create the account. Please try again.",
            "error"
        );

    } finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                "Create Account";
        }
    }
}


/* =========================================================
   LOGIN
========================================================= */

async function login() {

    const email =
        $("loginEmail")
            ?.value
            .trim()
            .toLowerCase();

    const password =
        $("loginPassword")
            ?.value || "";


    if (!email || !password) {

        showToast(
            "Please enter your email and password.",
            "error"
        );

        return;
    }


    const button =
        $("loginForm")
            ?.querySelector(
                'button[type="submit"]'
            );

    if (button) {

        button.disabled = true;

        button.textContent =
            "Logging in...";
    }


    try {

        const users =
            getUsers();

        const user =
            users.find(
                item =>
                    item.email ===
                    email
            );


        if (!user) {

            showToast(
                "Incorrect email or password.",
                "error"
            );

            return;
        }


        const passwordHash =
            await hashPassword(
                password
            );


        if (
            passwordHash !==
            user.passwordHash
        ) {

            showToast(
                "Incorrect email or password.",
                "error"
            );

            return;
        }


        currentUser = {

            id: user.id,

            firstName:
                user.firstName,

            lastName:
                user.lastName,

            email:
                user.email
        };


        saveSession(
            currentUser
        );


        $("loginForm")
            ?.reset();


        showAppScreen();


        showToast(
            "Login successful!",
            "success"
        );

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        showToast(
            "Could not log in. Please try again.",
            "error"
        );

    } finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                "Login";
        }
    }
}


/* =========================================================
   FORGOT PASSWORD
========================================================= */

async function forgotPassword() {

    const email =
        $("loginEmail")
            ?.value
            .trim()
            .toLowerCase();


    if (!email) {

        showToast(
            "Enter your email address first.",
            "warning"
        );

        $("loginEmail")
            ?.focus();

        return;
    }


    const users =
        getUsers();

    const user =
        users.find(
            item =>
                item.email === email
        );


    if (!user) {

        showToast(
            "No account was found with that email.",
            "error"
        );

        return;
    }


    /*
       Because this is a local application,
       there is no email server.

       We therefore provide a local
       password reset flow.
    */

    const newPassword =
        prompt(
            "Enter your new password (minimum 6 characters):"
        );


    if (newPassword === null) {

        return;
    }


    if (newPassword.length < 6) {

        showToast(
            "Password must be at least 6 characters.",
            "error"
        );

        return;
    }


    user.passwordHash =
        await hashPassword(
            newPassword
        );

    saveUsers(users);


    showToast(
        "Password changed successfully. You can now log in.",
        "success"
    );
}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    stopTimerInterval();

    resetTimerState();

    currentUser =
        null;

    clearSession();

    showAuthScreen();

    showLogin();

    showToast(
        "You have been logged out.",
        "success"
    );
}


/* =========================================================
   DELETE ACCOUNT
========================================================= */

function deleteAccount() {

    if (!currentUser) {

        return;
    }


    const confirmed =
        confirm(
            "Are you sure you want to permanently delete your account?\n\n" +
            "All tasks and attendance data for this account will also be deleted."
        );


    if (!confirmed) {

        return;
    }


    const userId =
        currentUser.id;


    let users =
        getUsers();


    users =
        users.filter(
            user =>
                user.id !== userId
        );


    saveUsers(
        users
    );


    localStorage.removeItem(
        `${STORAGE.TASKS}_${userId}`
    );

    localStorage.removeItem(
        `${STORAGE.ATTENDANCE}_${userId}`
    );


    stopTimerInterval();

    resetTimerState();

    currentUser =
        null;

    clearSession();

    showAuthScreen();

    showLogin();

    showToast(
        "Account deleted successfully.",
        "success"
    );
}


/* =========================================================
   SHOW AUTH SCREENS
========================================================= */

function showLogin() {

    $("loginView")
        ?.classList
        .remove("hidden");

    $("registerView")
        ?.classList
        .add("hidden");
}


function showRegister() {

    $("loginView")
        ?.classList
        .add("hidden");

    $("registerView")
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


function showAppScreen() {

    $("authScreen")
        ?.classList
        .add("hidden");

    $("appScreen")
        ?.classList
        .remove("hidden");

    updateUserInformation();

    showSection(
        "dashboard"
    );

    renderAll();
}


/* =========================================================
   USER INFORMATION
========================================================= */

function updateUserInformation() {

    if (!currentUser) {

        return;
    }


    const fullName =
        `${currentUser.firstName} ${currentUser.lastName}`
            .trim();


    if ($("sidebarUserName")) {

        $("sidebarUserName").textContent =
            fullName;
    }


    if ($("sidebarUserEmail")) {

        $("sidebarUserEmail").textContent =
            currentUser.email;
    }


    if ($("settingsUserName")) {

        $("settingsUserName").textContent =
            fullName;
    }


    if ($("settingsUserEmail")) {

        $("settingsUserEmail").textContent =
            currentUser.email;
    }


    const initial =
        currentUser.firstName
            ?.charAt(0)
            .toUpperCase() ||
        "U";


    if ($("userAvatar")) {

        $("userAvatar").textContent =
            initial;
    }


    if ($("settingsUserAvatar")) {

        $("settingsUserAvatar").textContent =
            initial;
    }
}


/* =========================================================
   TASK STORAGE
========================================================= */

function getTasks() {

    if (!currentUser) {

        return [];
    }

    try {

        return JSON.parse(
            localStorage.getItem(
                getUserStorageKey(
                    STORAGE.TASKS
                )
            )
        ) || [];

    } catch {

        return [];
    }
}


function saveTasks(
    tasks
) {

    if (!currentUser) {

        return;
    }

    localStorage.setItem(

        getUserStorageKey(
            STORAGE.TASKS
        ),

        JSON.stringify(
            tasks
        )
    );
}


/* =========================================================
   TIMER RESET
========================================================= */

function resetTimerState() {

    stopTimerInterval();

    timerState = {

        taskId: null,

        workSeconds: 0,

        breakSeconds: 0,

        workStartedAt: null,

        breakStartedAt: null,

        timerRunning: false,

        timerPaused: false,

        breakRunning: false,

        interval: null
    };

    updateTimerDisplay();

    updateTimerButtons();
}


/* =========================================================
   TIMER INTERVAL
========================================================= */

function stopTimerInterval() {

    if (
        timerState.interval
    ) {

        clearInterval(
            timerState.interval
        );

        timerState.interval =
            null;
    }
}


function startTimerInterval() {

    stopTimerInterval();

    timerState.interval =
        setInterval(
            updateTimerDisplay,
            250
        );
}


/* =========================================================
   TIMER WORK ACCUMULATION
========================================================= */

function accumulateCurrentWork() {

    if (
        !timerState.timerRunning ||
        timerState.breakRunning ||
        !timerState.workStartedAt
    ) {

        return;
    }


    const now =
        Date.now();


    const elapsed =
        (
            now -
            timerState.workStartedAt
        ) / 1000;


    timerState.workSeconds +=
        Math.max(
            0,
            elapsed
        );


    timerState.workStartedAt =
        now;
}


function accumulateCurrentBreak() {

    if (
        !timerState.breakRunning ||
        !timerState.breakStartedAt
    ) {

        return;
    }


    const now =
        Date.now();


    const elapsed =
        (
            now -
            timerState.breakStartedAt
        ) / 1000;


    timerState.breakSeconds +=
        Math.max(
            0,
            elapsed
        );


    timerState.breakStartedAt =
        now;
}


/* =========================================================
   START / RESUME TIMER
========================================================= */

function startTaskTimer() {

    if (timerState.timerRunning) {

        return;
    }


    const taskId =
        $("editingTaskId")
            ?.value;


    if (!taskId) {

        showToast(
            "Save the task first before starting the timer.",
            "warning"
        );

        return;
    }


    timerState.taskId =
        taskId;


    if (
        timerState.breakRunning
    ) {

        accumulateCurrentBreak();

        timerState.breakRunning =
            false;

        timerState.breakStartedAt =
            null;
    }


    timerState.workStartedAt =
        Date.now();


    timerState.timerRunning =
        true;


    timerState.timerPaused =
        false;


    if ($("timerStatus")) {

        $("timerStatus").textContent =
            "Running";
    }


    startTimerInterval();

    updateTimerDisplay();

    updateTimerButtons();
}


/* =========================================================
   PAUSE
========================================================= */

function pauseTaskTimer() {

    if (
        !timerState.timerRunning ||
        timerState.breakRunning
    ) {

        return;
    }


    accumulateCurrentWork();


    timerState.timerRunning =
        false;


    timerState.timerPaused =
        true;


    timerState.workStartedAt =
        null;


    stopTimerInterval();


    if ($("timerStatus")) {

        $("timerStatus").textContent =
            "Paused";
    }


    updateTimerDisplay();

    updateTimerButtons();
}


/* =========================================================
   BREAK
========================================================= */

function toggleBreak() {

    if (!timerState.timerRunning) {

        return;
    }


    if (
        !timerState.breakRunning
    ) {

        /*
           START BREAK
        */

        accumulateCurrentWork();

        timerState.workStartedAt =
            null;

        timerState.breakRunning =
            true;

        timerState.breakStartedAt =
            Date.now();


        if ($("timerStatus")) {

            $("timerStatus").textContent =
                "On Break";
        }

    } else {

        /*
           END BREAK
        */

        accumulateCurrentBreak();

        timerState.breakRunning =
            false;

        timerState.breakStartedAt =
            null;

        timerState.workStartedAt =
            Date.now();


        if ($("timerStatus")) {

            $("timerStatus").textContent =
                "Running";
        }
    }


    updateTimerDisplay();

    updateTimerButtons();
}


/* =========================================================
   STOP TIMER
========================================================= */

function stopTaskTimer() {

    if (
        !timerState.timerRunning &&
        !timerState.breakRunning
    ) {

        return;
    }


    if (
        timerState.breakRunning
    ) {

        accumulateCurrentBreak();

        timerState.breakRunning =
            false;

        timerState.breakStartedAt =
            null;

    } else {

        accumulateCurrentWork();
    }


    timerState.timerRunning =
        false;

    timerState.timerPaused =
        false;

    timerState.workStartedAt =
        null;


    stopTimerInterval();


    const totalSeconds =
        Math.floor(
            timerState.workSeconds
        );


    const hours =
        Math.floor(
            totalSeconds / 3600
        );


    const minutes =
        Math.floor(
            (
                totalSeconds % 3600
            ) / 60
        );


    if ($("timeHours")) {

        $("timeHours").value =
            hours;
    }


    if ($("timeMinutes")) {

        $("timeMinutes").value =
            minutes;
    }


    if ($("timerStatus")) {

        $("timerStatus").textContent =
            "Stopped";
    }


    updateTimerDisplay();

    updateTimerButtons();
}


/* =========================================================
   TIMER DISPLAY
========================================================= */

function getCurrentDisplayedWorkSeconds() {

    let seconds =
        Number(
            timerState.workSeconds
        ) || 0;


    if (
        timerState.timerRunning &&
        !timerState.breakRunning &&
        timerState.workStartedAt
    ) {

        seconds +=
            (
                Date.now() -
                timerState.workStartedAt
            ) / 1000;
    }


    return Math.max(
        0,
        Math.floor(seconds)
    );
}


function updateTimerDisplay() {

    if (!$("liveTimerDisplay")) {

        return;
    }


    $("liveTimerDisplay").textContent =
        formatTimer(
            getCurrentDisplayedWorkSeconds()
        );
}


/* =========================================================
   TIMER BUTTONS
========================================================= */

function updateTimerButtons() {

    const running =
        timerState.timerRunning;

    const onBreak =
        timerState.breakRunning;


    if ($("startTimerBtn")) {

        $("startTimerBtn").disabled =
            running;

        $("startTimerBtn").textContent =
            timerState.timerPaused
                ? "▶ Resume"
                : "▶ Start";
    }


    if ($("pauseTimerBtn")) {

        $("pauseTimerBtn").disabled =
            !running ||
            onBreak;
    }


    if ($("stopTimerBtn")) {

        $("stopTimerBtn").disabled =
            !running &&
            !onBreak;
    }


    if ($("breakBtn")) {

        $("breakBtn").disabled =
            !running;

        $("breakBtn").textContent =
            onBreak
                ? "▶ End Break"
                : "☕ Break";
    }
}


/* =========================================================
   NEW TASK
========================================================= */

function openNewTaskModal() {

    resetTimerState();


    if ($("taskModalTitle")) {

        $("taskModalTitle").textContent =
            "New Task";
    }


    if ($("editingTaskId")) {

        $("editingTaskId").value =
            "";
    }


    if ($("taskTitle")) {

        $("taskTitle").value =
            "";
    }


    if ($("taskDescription")) {

        $("taskDescription").value =
            "";
    }


    if ($("taskCategory")) {

        $("taskCategory").value =
            "SEO";
    }

 if ($("taskCategory")) {

        $("taskCategory").value =
            "Services+Location Pages";
    }
    
 if ($("taskCategory")) {

        $("taskCategory").value =
            "Location Pages";
    }
     if ($("taskCategory")) {

        $("taskCategory").value =
            "Services Pages";
    }

     if ($("taskCategory")) {

        $("taskCategory").value =
            "Blog";
    }
    if ($("timeHours")) {

        $("timeHours").value =
            0;
    }


    if ($("timeMinutes")) {

        $("timeMinutes").value =
            0;
    }


    if ($("timerStatus")) {

        $("timerStatus").textContent =
            "Ready";
    }


    $("taskModal")
        ?.classList
        .remove("hidden");
}


/* =========================================================
   EDIT TASK
========================================================= */

function editTask(
    taskId
) {

    const tasks =
        getTasks();


    const task =
        tasks.find(
            item =>
                item.id === taskId
        );


    if (!task) {

        return;
    }


    resetTimerState();


    if ($("taskModalTitle")) {

        $("taskModalTitle").textContent =
            "Edit Task";
    }


    if ($("editingTaskId")) {

        $("editingTaskId").value =
            task.id;
    }


    if ($("taskTitle")) {

        $("taskTitle").value =
            task.title || "";
    }


    if ($("taskDescription")) {

        $("taskDescription").value =
            task.description || "";
    }


    if ($("taskCategory")) {

        $("taskCategory").value =
            task.category ||
            "Other";
    }


    const totalSeconds =
        Number(
            task.timeSeconds
        ) || 0;


    if ($("timeHours")) {

        $("timeHours").value =
            Math.floor(
                totalSeconds / 3600
            );
    }


    if ($("timeMinutes")) {

        $("timeMinutes").value =
            Math.floor(
                (
                    totalSeconds % 3600
                ) / 60
            );
    }


    if ($("timerStatus")) {

        $("timerStatus").textContent =
            "Ready";
    }


    $("taskModal")
        ?.classList
        .remove("hidden");
}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeTaskModal() {

    if (
        timerState.timerRunning ||
        timerState.breakRunning
    ) {

        const confirmed =
            confirm(
                "The task timer is still running. Closing will stop the timer. Continue?"
            );


        if (!confirmed) {

            return;
        }


        stopTaskTimer();
    }


    resetTimerState();


    $("taskModal")
        ?.classList
        .add("hidden");
}


/* =========================================================
   SAVE TASK
========================================================= */

function saveTask(
    event
) {

    event.preventDefault();


    if (!currentUser) {

        showToast(
            "Please log in first.",
            "error"
        );

        return;
    }


    if (
        timerState.breakRunning
    ) {

        accumulateCurrentBreak();

        timerState.breakRunning =
            false;

        timerState.breakStartedAt =
            null;
    }


    if (
        timerState.timerRunning
    ) {

        accumulateCurrentWork();

        timerState.timerRunning =
            false;

        timerState.workStartedAt =
            null;
    }


    stopTimerInterval();


    const id =
        $("editingTaskId")
            ?.value ||
        `task_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 9)}`;


    const title =
        $("taskTitle")
            ?.value
            .trim() ||
        "";


    const description =
        $("taskDescription")
            ?.value
            .trim() ||
        "";


    const category =
        $("taskCategory")
            ?.value ||
        "Other";


    if (!title) {

        showToast(
            "Please enter a task title.",
            "error"
        );

        return;
    }


    let timeSeconds =
        Math.floor(
            timerState.workSeconds
        );


    /*
       If timer wasn't used,
       use manual time.
    */

    if (
        timeSeconds <= 0
    ) {

        const hours =
            Math.max(
                0,
                Number(
                    $("timeHours")
                        ?.value
                ) || 0
            );


        const minutes =
            Math.max(
                0,
                Number(
                    $("timeMinutes")
                        ?.value
                ) || 0
            );


        timeSeconds =
            (
                hours * 3600
            ) +
            (
                minutes * 60
            );
    }


    const tasks =
        getTasks();


    const existingIndex =
        tasks.findIndex(
            task =>
                task.id === id
        );


    if (
        existingIndex >= 0
    ) {

        const oldTask =
            tasks[
                existingIndex
            ];


        tasks[
            existingIndex
        ] = {

            ...oldTask,

            title,

            description,

            category,

            timeSeconds,

            updatedAt:
                new Date()
                    .toISOString()
        };

    } else {

        tasks.unshift({

            id,

            title,

            description,

            category,

            completed: false,

            timeSeconds,

            createdAt:
                new Date()
                    .toISOString(),

            updatedAt:
                new Date()
                    .toISOString()
        });
    }


    saveTasks(
        tasks
    );


    resetTimerState();


    $("taskModal")
        ?.classList
        .add("hidden");


    renderAll();


    showToast(

        existingIndex >= 0
            ? "Task updated successfully."
            : "Task created successfully.",

        "success"
    );
}


/* =========================================================
   COMPLETE TASK
========================================================= */

function toggleTaskComplete(
    taskId
) {

    const tasks =
        getTasks();


    const task =
        tasks.find(
            item =>
                item.id === taskId
        );


    if (!task) {

        return;
    }


    task.completed =
        !task.completed;


    task.updatedAt =
        new Date()
            .toISOString();


    saveTasks(
        tasks
    );


    renderAll();


    showToast(

        task.completed
            ? "Task marked as completed."
            : "Task marked as pending.",

        "success"
    );
}


/* =========================================================
   DELETE TASK
========================================================= */

function deleteTask(
    taskId
) {

    const tasks =
        getTasks();


    const task =
        tasks.find(
            item =>
                item.id === taskId
        );


    if (!task) {

        return;
    }


    const confirmed =
        confirm(
            `Delete "${task.title}"?`
        );


    if (!confirmed) {

        return;
    }


    const filtered =
        tasks.filter(
            item =>
                item.id !== taskId
        );


    saveTasks(
        filtered
    );


    renderAll();


    showToast(
        "Task deleted.",
        "success"
    );
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );
}


/* =========================================================
   TASK HTML
========================================================= */

function createTaskHTML(
    task
) {

    const time =
        formatDuration(
            task.timeSeconds
        );


    const completedClass =
        task.completed
            ? "completed-task"
            : "";


    const status =
        task.completed
            ? "Completed"
            : "Pending";


    return `

        <div class="task-card ${completedClass}">

            <div class="task-main">

                <div class="task-title">
                    ${escapeHTML(
                        task.title
                    )}
                </div>


                ${
                    task.description
                        ? `
                            <p class="task-description">
                                ${escapeHTML(
                                    task.description
                                )}
                            </p>
                        `
                        : ""
                }


                <div class="task-meta">

                    <span class="task-tag">
                        ${escapeHTML(
                            task.category ||
                            "Other"
                        )}
                    </span>


                    <span class="task-tag">
                        ⏱ ${time}
                    </span>


                    <span class="task-tag">
                        ${status}
                    </span>


                    <span class="task-tag">
                        ${formatDate(
                            task.createdAt
                        )}
                    </span>

                </div>

            </div>


            <div class="task-actions">

                <button
                    type="button"
                    class="task-action-btn"
                    onclick="toggleTaskComplete('${task.id}')"
                    title="${
                        task.completed
                            ? "Mark pending"
                            : "Complete task"
                    }"
                >
                    ${
                        task.completed
                            ? "↩"
                            : "✓"
                    }
                </button>


                <button
                    type="button"
                    class="task-action-btn"
                    onclick="editTask('${task.id}')"
                    title="Edit task"
                >
                    ✏
                </button>


                <button
                    type="button"
                    class="task-action-btn delete"
                    onclick="deleteTask('${task.id}')"
                    title="Delete task"
                >
                    🗑
                </button>

            </div>

        </div>
    `;
}


/* =========================================================
   RENDER TASKS
========================================================= */

function renderTasks() {

    const container =
        $("tasksList");


    if (!container) {

        return;
    }


    let tasks =
        getTasks();


    const filter =
        $("taskFilter")
            ?.value ||
        "all";


    const search =
        $("taskSearch")
            ?.value
            .trim()
            .toLowerCase() ||
        "";


    if (
        filter === "today"
    ) {

        const today =
            getDateKey();


        tasks =
            tasks.filter(
                task =>
                    getDateKey(
                        new Date(
                            task.createdAt
                        )
                    ) === today
            );
    }


    if (
        filter === "pending"
    ) {

        tasks =
            tasks.filter(
                task =>
                    !task.completed
            );
    }


    if (
        filter === "completed"
    ) {

        tasks =
            tasks.filter(
                task =>
                    task.completed
            );
    }


    if (search) {

        tasks =
            tasks.filter(
                task => {

                    const text =
                        `${task.title} ${task.description} ${task.category}`
                            .toLowerCase();


                    return text.includes(
                        search
                    );
                }
            );
    }


    if (!tasks.length) {

        container.innerHTML = `

            <div class="empty-state">

                <div>
                    📝
                </div>

                <h3>
                    No matching tasks
                </h3>

                <p>
                    Try creating a new task or changing your filters.
                </p>

            </div>
        `;

        return;
    }


    container.innerHTML =
        tasks
            .map(
                createTaskHTML
            )
            .join("");
}


/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {

    const tasks =
        getTasks();


    const today =
        getDateKey();


    const todayTasks =
        tasks.filter(
            task =>
                getDateKey(
                    new Date(
                        task.createdAt
                    )
                ) === today
        );


    const completed =
        tasks.filter(
            task =>
                task.completed
        );


    const todaySeconds =
        todayTasks.reduce(
            (
                sum,
                task
            ) =>
                sum +
                (
                    Number(
                        task.timeSeconds
                    ) || 0
                ),
            0
        );


    if ($("todayTasksCount")) {

        $("todayTasksCount").textContent =
            todayTasks.length;
    }


    if ($("completedTasksCount")) {

        $("completedTasksCount").textContent =
            completed.length;
    }


    if ($("todayTaskTime")) {

        $("todayTaskTime").textContent =
            formatDuration(
                todaySeconds
            );
    }


    const dashboardList =
        $("dashboardTasksList");


    if (!dashboardList) {

        return;
    }


    const recent =
        tasks.slice(
            0,
            5
        );


    if (!recent.length) {

        dashboardList.innerHTML = `

            <div class="empty-state">

                <div>
                    📝
                </div>

                <h3>
                    No tasks yet
                </h3>

                <p>
                    Create your first task to get started.
                </p>

            </div>
        `;

        return;
    }


    dashboardList.innerHTML =
        recent
            .map(
                createTaskHTML
            )
            .join("");
}


function updateDashboard() {

    renderDashboard();
}


/* =========================================================
   REPORTS
========================================================= */

function renderReports() {

    const tasks =
        getTasks();


    const completed =
        tasks.filter(
            task =>
                task.completed
        );


    const totalSeconds =
        tasks.reduce(
            (
                sum,
                task
            ) =>
                sum +
                (
                    Number(
                        task.timeSeconds
                    ) || 0
                ),
            0
        );


    if ($("reportTotalTasks")) {

        $("reportTotalTasks").textContent =
            tasks.length;
    }


    if ($("reportCompletedTasks")) {

        $("reportCompletedTasks").textContent =
            completed.length;
    }


    if ($("reportTotalTime")) {

        $("reportTotalTime").textContent =
            formatDuration(
                totalSeconds
            );
    }


    const tbody =
        $("reportsTableBody");


    if (!tbody) {

        return;
    }


    if (!tasks.length) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    style="text-align:center;"
                >
                    No task data available.
                </td>

            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        tasks
            .map(
                task => `

                    <tr>

                        <td>
                            ${escapeHTML(
                                task.title
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                task.category ||
                                "Other"
                            )}
                        </td>

                        <td>
                            ${
                                task.completed
                                    ? "Completed"
                                    : "Pending"
                            }
                        </td>

                        <td>
                            ${formatDuration(
                                task.timeSeconds
                            )}
                        </td>

                        <td>
                            ${formatDate(
                                task.createdAt
                            )}
                        </td>

                    </tr>
                `
            )
            .join("");
}


/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {

    if (!currentUser) {

        return;
    }


    updateUserInformation();

    updateAttendanceDisplay();

    renderDashboard();

    renderTasks();

    renderReports();
}


/* =========================================================
   NAVIGATION
========================================================= */

function showSection(
    sectionName
) {

    document
        .querySelectorAll(
            ".page-section"
        )
        .forEach(
            section =>
                section.classList.remove(
                    "active"
                )
        );


    const section =
        $(`${sectionName}Section`);


    if (section) {

        section.classList.add(
            "active"
        );
    }


    document
        .querySelectorAll(
            ".nav-btn"
        )
        .forEach(
            button => {

                button.classList.toggle(

                    "active",

                    button.dataset.section ===
                    sectionName
                );
            }
        );


    const titles = {

        dashboard: {

            title:
                "Dashboard",

            subtitle:
                "Track your work and attendance"
        },

        tasks: {

            title:
                "Tasks",

            subtitle:
                "Manage and track your work"
        },

        reports: {

            title:
                "Reports",

            subtitle:
                "Review your work activity"
        },

        settings: {

            title:
                "Settings",

            subtitle:
                "Manage your account and preferences"
        }
    };


    const info =
        titles[
            sectionName
        ];


    if (info) {

        if ($("pageTitle")) {

            $("pageTitle").textContent =
                info.title;
        }


        if ($("pageSubtitle")) {

            $("pageSubtitle").textContent =
                info.subtitle;
        }
    }


    if (
        sectionName ===
        "dashboard"
    ) {

        renderDashboard();
    }


    if (
        sectionName ===
        "tasks"
    ) {

        renderTasks();
    }


    if (
        sectionName ===
        "reports"
    ) {

        renderReports();
    }
}


/* =========================================================
   THEME
========================================================= */

function applyTheme(
    theme
) {

    const normalized =
        theme === "dark"
            ? "dark"
            : "light";


    document.body.classList.toggle(

        "dark",

        normalized ===
        "dark"
    );


    localStorage.setItem(
        STORAGE.THEME,
        normalized
    );


    updateThemeButtons();
}


function toggleTheme() {

    const isDark =
        document.body.classList.contains(
            "dark"
        );


    applyTheme(
        isDark
            ? "light"
            : "dark"
    );
}


function updateThemeButtons() {

    const isDark =
        document.body.classList.contains(
            "dark"
        );


    if ($("themeToggleBtn")) {

        $("themeToggleBtn").textContent =
            isDark
                ? "☀️"
                : "🌙";

        $("themeToggleBtn").title =
            isDark
                ? "Switch to light mode"
                : "Switch to dark mode";
    }


    if ($("settingsThemeBtn")) {

        $("settingsThemeBtn").textContent =
            isDark
                ? "Switch to Light Mode"
                : "Switch to Dark Mode";
    }
}


function initializeTheme() {

    const saved =
        localStorage.getItem(
            STORAGE.THEME
        );


    if (
        saved === "dark" ||
        saved === "light"
    ) {

        applyTheme(
            saved
        );

        return;
    }


    const prefersDark =
        window.matchMedia &&
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches;


    applyTheme(
        prefersDark
            ? "dark"
            : "light"
    );
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function initializeEventListeners() {


    /* LOGIN */

    $("loginForm")
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                login();
            }
        );


    /* REGISTER */

    $("registerForm")
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                register();
            }
        );


    /* AUTH SWITCH */

    $("showRegisterBtn")
        ?.addEventListener(
            "click",
            showRegister
        );


    $("showLoginBtn")
        ?.addEventListener(
            "click",
            showLogin
        );


    /* FORGOT PASSWORD */

    $("forgotPasswordBtn")
        ?.addEventListener(
            "click",
            forgotPassword
        );


    /* LOGOUT */

    $("logoutBtn")
        ?.addEventListener(
            "click",
            logout
        );


    /* NAVIGATION */

    document
        .querySelectorAll(
            ".nav-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () =>
                        showSection(
                            button.dataset.section
                        )
                );
            }
        );


    /* ATTENDANCE */

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


    /* VIEW ALL */

    $("viewAllTasksBtn")
        ?.addEventListener(
            "click",
            () =>
                showSection(
                    "tasks"
                )
        );


    /* NEW TASK */

    $("newTaskBtn")
        ?.addEventListener(
            "click",
            openNewTaskModal
        );


    /* TASK FORM */

    $("taskForm")
        ?.addEventListener(
            "submit",
            saveTask
        );


    /* CLOSE MODAL */

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


    /* TIMER */

    $("startTimerBtn")
        ?.addEventListener(
            "click",
            startTaskTimer
        );


    $("pauseTimerBtn")
        ?.addEventListener(
            "click",
            pauseTaskTimer
        );


    $("stopTimerBtn")
        ?.addEventListener(
            "click",
            stopTaskTimer
        );


    $("breakBtn")
        ?.addEventListener(
            "click",
            toggleBreak
        );


    /* SEARCH */

    $("taskSearch")
        ?.addEventListener(
            "input",
            renderTasks
        );


    /* FILTER */

    $("taskFilter")
        ?.addEventListener(
            "change",
            renderTasks
        );


    /* THEME */

    $("themeToggleBtn")
        ?.addEventListener(
            "click",
            toggleTheme
        );


    $("settingsThemeBtn")
        ?.addEventListener(
            "click",
            toggleTheme
        );


    /* DELETE ACCOUNT */

    $("deleteAccountBtn")
        ?.addEventListener(
            "click",
            deleteAccount
        );


    /* MODAL BACKDROP */

    $("taskModal")
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    $("taskModal")
                ) {

                    closeTaskModal();
                }
            }
        );


    /* ESCAPE */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape" &&
                !$("taskModal")
                    ?.classList
                    .contains("hidden")
            ) {

                closeTaskModal();
            }
        }
    );
}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeTheme();

        initializeEventListeners();


        /*
           Restore previous session.
        */

        const session =
            loadSession();


        if (session) {

            currentUser =
                session;

            showAppScreen();

        } else {

            showAuthScreen();

            showLogin();
        }
    }
);


/* =========================================================
   WINDOW FUNCTIONS
========================================================= */

window.login =
    login;

window.register =
    register;

window.logout =
    logout;

window.forgotPassword =
    forgotPassword;

window.deleteAccount =
    deleteAccount;

window.showLogin =
    showLogin;

window.showRegister =
    showRegister;

window.showSection =
    showSection;

window.timeIn =
    timeIn;

window.timeOut =
    timeOut;

window.toggleTheme =
    toggleTheme;

window.openNewTaskModal =
    openNewTaskModal;

window.editTask =
    editTask;

window.deleteTask =
    deleteTask;

window.toggleTaskComplete =
    toggleTaskComplete;

window.startTaskTimer =
    startTaskTimer;

window.pauseTaskTimer =
    pauseTaskTimer;

window.stopTaskTimer =
    stopTaskTimer;

window.toggleBreak =
    toggleBreak;

window.closeTaskModal =
    closeTaskModal;