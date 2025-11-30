// App: login, navigation, and wiring UI to modules

let currentRole = null; // "admin" or "teacher"

// Simple demo credentials
const CREDENTIALS = {
    admin: { username: "admin", password: "admin123" },
    teacher: { username: "teacher", password: "teacher123" }
};

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initAuth();
    initNavigation();
    initStudentsUI();
    initAttendanceUI();
    initAcademicsUI();
    initFeesUI();
    refreshDashboard();
});

/* THEME TOGGLE */
function initTheme() {
    const themeToggle = document.getElementById("theme-toggle");
    const themeIcon = document.querySelector(".theme-icon");
    const htmlElement = document.documentElement;

    // Load saved theme or default to light
    const savedTheme = localStorage.getItem("sms-theme") || "light";
    htmlElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme, themeIcon);

    themeToggle.addEventListener("click", () => {
        const currentTheme = htmlElement.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";

        htmlElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("sms-theme", newTheme);
        updateThemeIcon(newTheme, themeIcon);
    });
}

function updateThemeIcon(theme, iconElement) {
    iconElement.textContent = theme === "dark" ? "☀️" : "🌙";
}

/* AUTH */
function initAuth() {
    const authScreen = document.getElementById("auth-screen");
    const mainScreen = document.getElementById("main-screen");
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const errorEl = document.getElementById("auth-error");
    const currentRoleLabel = document.getElementById("current-role-label");

    loginBtn.addEventListener("click", () => {
        const role = document.getElementById("role-select").value;
        const user = document.getElementById("username-input").value.trim();
        const pass = document.getElementById("password-input").value.trim();
        const cred = CREDENTIALS[role];

        if (!cred || user !== cred.username || pass !== cred.password) {
            errorEl.textContent = "Invalid credentials.";
            return;
        }
        errorEl.textContent = "";
        currentRole = role;
        currentRoleLabel.textContent = role === "admin" ? "Admin" : "Teacher";
        authScreen.classList.add("hidden");
        mainScreen.classList.remove("hidden");
        logoutBtn.classList.remove("hidden");
        applyRolePermissions();
        refreshDashboard();
        renderStudents();
        renderSubjects();
    });

    logoutBtn.addEventListener("click", () => {
        currentRole = null;
        authScreen.classList.remove("hidden");
        mainScreen.classList.add("hidden");
        logoutBtn.classList.add("hidden");
        currentRoleLabel.textContent = "Guest";
    });
}

function applyRolePermissions() {
    const adminOnlyButtons = document.querySelectorAll(".admin-only");
    const studentFormCard = document.getElementById("student-form-card");
    const studentActionsAdmin = document.getElementById("student-actions-admin");

    if (currentRole === "admin") {
        adminOnlyButtons.forEach(b => b.classList.remove("hidden"));
        studentFormCard.classList.remove("hidden");
        studentActionsAdmin.classList.remove("hidden");
    } else {
        adminOnlyButtons.forEach(b => b.classList.add("hidden"));
        studentFormCard.classList.add("hidden"); // Teachers can view but not add/edit
        studentActionsAdmin.classList.add("hidden");
    }
}

/* NAVIGATION */
function initNavigation() {
    const navButtons = document.querySelectorAll(".nav-link");
    const sections = document.querySelectorAll(".section");

    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            navButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const sectionId = btn.getAttribute("data-section");
            sections.forEach(sec => {
                sec.classList.remove("visible");
            });
            document.getElementById(sectionId).classList.add("visible");
        });
    });
}

/* DASHBOARD */
function refreshDashboard() {
    document.getElementById("stat-total-students").textContent = DB.students.length;
    document.getElementById("stat-avg-gpa").textContent = calculateAverageGPA().toFixed(2);
    document.getElementById("stat-avg-attendance").textContent = calculateAverageAttendance().toFixed(1);
    document.getElementById("stat-total-due").textContent = getTotalOutstandingFees().toFixed(0);
}

/* STUDENTS UI */
function initStudentsUI() {
    const form = document.getElementById("student-form");
    const cancelBtn = document.getElementById("student-form-cancel");
    const addBtn = document.getElementById("btn-add-student");
    const clearBtn = document.getElementById("btn-clear-students");
    const searchInput = document.getElementById("student-search");
    const filterCourse = document.getElementById("student-filter-course");
    const filterSem = document.getElementById("student-filter-semester");

    if (addBtn) {
        addBtn.addEventListener("click", () => {
            clearStudentForm();
            document.getElementById("student-form-title").textContent = "Add Student";
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            if (confirm("Clear all students? This will also affect attendance, marks, and fees data linked by roll.")) {
                clearAllStudents();
                refreshDashboard();
                renderStudents();
            }
        });
    }

    [searchInput, filterCourse, filterSem].forEach(inp => {
        inp.addEventListener("input", renderStudents);
    });

    form.addEventListener("submit", e => {
        e.preventDefault();
        const errorEl = document.getElementById("student-form-error");
        errorEl.textContent = "";
        const id = document.getElementById("student-id").value || crypto.randomUUID();
        const student = {
            id,
            name: document.getElementById("student-name").value.trim(),
            roll: document.getElementById("student-roll").value.trim(),
            course: document.getElementById("student-course").value.trim(),
            semester: document.getElementById("student-semester").value.trim(),
            dob: document.getElementById("student-dob").value,
            gender: document.getElementById("student-gender").value,
            phone: document.getElementById("student-phone").value.trim(),
            email: document.getElementById("student-email").value.trim(),
            parentPhone: document.getElementById("student-parent-phone").value.trim(),
            address: document.getElementById("student-address").value.trim(),
            blood: document.getElementById("student-blood").value.trim()
        };
        if (!student.name || !student.roll) {
            errorEl.textContent = "Name and Roll are required.";
            return;
        }
        try {
            const existing = DB.students.find(s => s.id === id);
            if (existing) {
                updateStudent(id, student);
            } else {
                addStudent(student);
            }
            clearStudentForm();
            renderStudents();
            refreshDashboard();
        } catch (err) {
            errorEl.textContent = err.message;
        }
    });

    cancelBtn.addEventListener("click", () => {
        clearStudentForm();
    });

    renderStudents();
}

function clearStudentForm() {
    document.getElementById("student-id").value = "";
    document.getElementById("student-name").value = "";
    document.getElementById("student-roll").value = "";
    document.getElementById("student-course").value = "";
    document.getElementById("student-semester").value = "";
    document.getElementById("student-dob").value = "";
    document.getElementById("student-gender").value = "";
    document.getElementById("student-phone").value = "";
    document.getElementById("student-email").value = "";
    document.getElementById("student-parent-phone").value = "";
    document.getElementById("student-address").value = "";
    document.getElementById("student-blood").value = "";
    document.getElementById("student-form-error").textContent = "";
}

function renderStudents() {
    const tbody = document.getElementById("students-table-body");
    const emptyEl = document.getElementById("students-empty");
    const search = document.getElementById("student-search").value;
    const course = document.getElementById("student-filter-course").value;
    const sem = document.getElementById("student-filter-semester").value;

    const list = filteredStudents(search, course, sem);
    tbody.innerHTML = "";
    if (list.length === 0) {
        emptyEl.style.display = "block";
        return;
    }
    emptyEl.style.display = "none";

    list.forEach(st => {
        const tr = document.createElement("tr");
        const gpa = calculateGPAForStudent(st.roll);
        tr.innerHTML = `
            <td>${st.roll}</td>
            <td>${st.name}</td>
            <td>${st.course || "-"}</td>
            <td>${st.semester || "-"}</td>
            <td>${gpa.toFixed(1)}</td>
            <td>
                ${currentRole === "admin"
                ? `<button class="btn btn-secondary small" data-edit="${st.id}">Edit</button>
                       <button class="btn btn-danger small" data-del="${st.id}">Del</button>`
                : `<span class="muted small">View only</span>`}
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (currentRole === "admin") {
        tbody.querySelectorAll("[data-edit]").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-edit");
                const st = DB.students.find(s => s.id === id);
                if (!st) return;
                document.getElementById("student-form-title").textContent = "Edit Student";
                document.getElementById("student-id").value = st.id;
                document.getElementById("student-name").value = st.name;
                document.getElementById("student-roll").value = st.roll;
                document.getElementById("student-course").value = st.course || "";
                document.getElementById("student-semester").value = st.semester || "";
                document.getElementById("student-dob").value = st.dob || "";
                document.getElementById("student-gender").value = st.gender || "";
                document.getElementById("student-phone").value = st.phone || "";
                document.getElementById("student-email").value = st.email || "";
                document.getElementById("student-parent-phone").value = st.parentPhone || "";
                document.getElementById("student-address").value = st.address || "";
                document.getElementById("student-blood").value = st.blood || "";
            });
        });

        tbody.querySelectorAll("[data-del]").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-del");
                if (confirm("Delete this student?")) {
                    deleteStudentById(id);
                    renderStudents();
                    refreshDashboard();
                }
            });
        });
    }
}

/* ATTENDANCE UI */
function initAttendanceUI() {
    const loadBtn = document.getElementById("att-load-students");
    const saveBtn = document.getElementById("att-save");
    const listWrapper = document.getElementById("att-list-wrapper");
    const listContainer = document.getElementById("att-students-list");
    const statusEl = document.getElementById("att-status");
    const summaryBtn = document.getElementById("att-show-summary");
    const summaryRollInput = document.getElementById("att-summary-roll");
    const summaryBox = document.getElementById("att-summary-result");

    loadBtn.addEventListener("click", () => {
        statusEl.textContent = "";
        const date = document.getElementById("att-date").value;
        const course = document.getElementById("att-course-filter").value.trim();
        const sem = document.getElementById("att-semester-filter").value.trim();
        if (!date) {
            alert("Select a date first.");
            return;
        }
        const list = getAttendanceRecordsForFilter(course, sem);
        listContainer.innerHTML = "";
        if (list.length === 0) {
            listContainer.innerHTML = "<p class='empty-text'>No students match this filter.</p>";
            listWrapper.classList.remove("hidden");
            return;
        }
        list.forEach(st => {
            const row = document.createElement("div");
            row.className = "att-row";
            row.innerHTML = `
                <span>${st.roll} - ${st.name}</span>
                <span>
                    <label class="small"><input type="radio" name="att-${st.roll}" value="present" checked> P</label>
                    <label class="small"><input type="radio" name="att-${st.roll}" value="absent"> A</label>
                </span>
            `;
            listContainer.appendChild(row);
        });
        listWrapper.classList.remove("hidden");
    });

    saveBtn.addEventListener("click", () => {
        const date = document.getElementById("att-date").value;
        if (!date) return;
        const course = document.getElementById("att-course-filter").value.trim();
        const sem = document.getElementById("att-semester-filter").value.trim();
        const list = getAttendanceRecordsForFilter(course, sem);
        const records = list.map(st => {
            const radios = document.querySelectorAll(`input[name="att-${st.roll}"]`);
            let status = "present";
            radios.forEach(r => {
                if (r.checked) status = r.value;
            });
            return { roll: st.roll, status };
        });
        markAttendanceForDate(date, records);
        statusEl.textContent = "Attendance saved for " + date;
        refreshDashboard();
    });

    summaryBtn.addEventListener("click", () => {
        const roll = summaryRollInput.value.trim();
        if (!roll) return;
        const st = DB.students.find(s => s.roll === roll);
        if (!st) {
            summaryBox.innerHTML = `<span class="error-text">No student found with this roll.</span>`;
            return;
        }
        const s = getAttendanceSummary(roll);
        summaryBox.innerHTML = `
            <div><strong>${st.name}</strong> (${st.roll})</div>
            <div>Total classes: ${s.total}</div>
            <div>Present: ${s.present}</div>
            <div>Attendance: ${s.percent.toFixed(1)}%</div>
        `;
    });
}

/* ACADEMICS UI */
function initAcademicsUI() {
    const subjForm = document.getElementById("subject-form");
    const marksLoadBtn = document.getElementById("marks-load");
    const marksWrapper = document.getElementById("marks-wrapper");
    const marksInputsBox = document.getElementById("marks-inputs");
    const marksSaveBtn = document.getElementById("marks-save");
    const marksSummaryBox = document.getElementById("marks-summary");

    subjForm.addEventListener("submit", e => {
        e.preventDefault();
        const subj = {
            course: document.getElementById("sub-course").value.trim(),
            semester: document.getElementById("sub-semester").value.trim(),
            name: document.getElementById("sub-name").value.trim(),
            maxMarks: parseFloat(document.getElementById("sub-max").value)
        };
        if (!subj.course || !subj.semester || !subj.name || !subj.maxMarks) return;
        addSubject(subj);
        subjForm.reset();
        renderSubjects();
    });

    marksLoadBtn.addEventListener("click", () => {
        const roll = document.getElementById("marks-roll").value.trim();
        const course = document.getElementById("marks-course").value.trim();
        const sem = document.getElementById("marks-semester").value.trim();
        const st = DB.students.find(s => s.roll === roll);
        marksSummaryBox.innerHTML = "";
        if (!st) {
            marksInputsBox.innerHTML = `<span class="error-text">No student found with this roll.</span>`;
            marksWrapper.classList.remove("hidden");
            return;
        }
        const subs = listSubjects(course || st.course || "", sem || st.semester || "");
        if (subs.length === 0) {
            marksInputsBox.innerHTML = `<span class="empty-text">No subjects found for this course/semester.</span>`;
            marksWrapper.classList.remove("hidden");
            return;
        }
        marksInputsBox.innerHTML = `<p class="small">Entering marks for <strong>${st.name}</strong> (${st.roll})</p>`;
        subs.forEach(sub => {
            const existing = DB.marks.find(m => m.roll === roll && m.subjectId === sub.id);
            const val = existing ? existing.obtained : "";
            const div = document.createElement("div");
            div.className = "form-group";
            div.innerHTML = `
                <label>${sub.name} (Max ${sub.maxMarks})</label>
                <input type="number" min="0" max="${sub.maxMarks}" step="0.1"
                    data-subject-id="${sub.id}" value="${val}">
            `;
            marksInputsBox.appendChild(div);
        });
        marksWrapper.classList.remove("hidden");
    });

    marksSaveBtn.addEventListener("click", () => {
        const roll = document.getElementById("marks-roll").value.trim();
        const st = DB.students.find(s => s.roll === roll);
        if (!st) return;
        const inputs = marksInputsBox.querySelectorAll("input[data-subject-id]");
        const subjectMarks = [];
        inputs.forEach(inp => {
            const obtained = parseFloat(inp.value);
            if (Number.isNaN(obtained)) return;
            subjectMarks.push({
                subjectId: inp.getAttribute("data-subject-id"),
                obtained
            });
        });
        saveMarksForStudent(roll, subjectMarks);
        const gpa = calculateGPAForStudent(roll);
        marksSummaryBox.innerHTML = `
            <div><strong>${st.name}</strong> (${st.roll})</div>
            <div>GPA: ${gpa.toFixed(2)}</div>
        `;
        refreshDashboard();
        renderStudents();
    });
}

function renderSubjects() {
    const tbody = document.getElementById("subjects-table-body");
    const emptyEl = document.getElementById("subjects-empty");
    tbody.innerHTML = "";
    if (DB.subjects.length === 0) {
        emptyEl.style.display = "block";
        return;
    }
    emptyEl.style.display = "none";
    DB.subjects.forEach(s => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${s.course}</td>
            <td>${s.semester}</td>
            <td>${s.name}</td>
            <td>${s.maxMarks}</td>
        `;
        tbody.appendChild(tr);
    });
}

/* FEES UI */
function initFeesUI() {
    const setTotalBtn = document.getElementById("fee-set-total");
    const addPaymentBtn = document.getElementById("fee-add-payment");
    const statusEl = document.getElementById("fee-status");
    const showInfoBtn = document.getElementById("fee-show-info");
    const infoBox = document.getElementById("fee-info-box");

    setTotalBtn.addEventListener("click", () => {
        statusEl.textContent = "";
        const roll = document.getElementById("fee-roll").value.trim();
        const total = parseFloat(document.getElementById("fee-total").value);
        if (!roll || Number.isNaN(total)) return;
        setTotalFee(roll, total);
        statusEl.textContent = "Total fee updated.";
        refreshDashboard();
    });

    addPaymentBtn.addEventListener("click", () => {
        statusEl.textContent = "";
        const roll = document.getElementById("fee-roll").value.trim();
        const amt = parseFloat(document.getElementById("fee-payment-amount").value);
        if (!roll || Number.isNaN(amt)) return;
        addFeePayment(roll, amt);
        statusEl.textContent = "Payment added.";
        refreshDashboard();
    });

    showInfoBtn.addEventListener("click", () => {
        const roll = document.getElementById("fee-info-roll").value.trim();
        if (!roll) return;
        const info = getFeeInfo(roll);
        const st = DB.students.find(s => s.roll === roll);
        const name = st ? st.name : "Unknown student";
        const rows = info.payments
            .map(p => `<li>${p.date}: ${p.amount}</li>`)
            .join("");
        infoBox.innerHTML = `
            <div><strong>${name}</strong> (${info.roll})</div>
            <div>Total: ${info.total}</div>
            <div>Paid: ${info.paid}</div>
            <div>Due: ${info.due}</div>
            <div>Payments:</div>
            <ul class="small">${rows || "<li>No payments yet.</li>"}</ul>
        `;
    });

    // Settings -> reset system
    document.getElementById("btn-reset-system").addEventListener("click", () => {
        if (!confirm("This will delete all local data (students, attendance, marks, fees). Continue?")) return;
        resetDB();
        renderStudents();
        renderSubjects();
        refreshDashboard();
        alert("All data reset (only on this browser).");
    });
}
