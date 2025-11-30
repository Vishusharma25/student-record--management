// Basic in-browser data model using localStorage
const STORAGE_KEY = "sms-data-v1";

const defaultData = {
    students: [],      // list of student objects
    attendance: [],    // {date, roll, status}
    subjects: [],      // {id, course, semester, name, maxMarks}
    marks: [],         // {roll, subjectId, obtained}
    fees: []           // {roll, total, payments:[{amount, date}]}
};

let DB = loadDB();

function loadDB() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultData);
    try {
        const parsed = JSON.parse(raw);
        return Object.assign(structuredClone(defaultData), parsed);
    } catch {
        return structuredClone(defaultData);
    }
}

function saveDB() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DB));
}

function resetDB() {
    DB = structuredClone(defaultData);
    saveDB();
}

// Helper: find or create fee record for roll
function getOrCreateFeeRecord(roll) {
    let rec = DB.fees.find(f => f.roll === roll);
    if (!rec) {
        rec = { roll, total: 0, payments: [] };
        DB.fees.push(rec);
    }
    return rec;
}

// GPA calculation (simple: 10 * obtained/ max)
function calculateGPAForStudent(roll) {
    const studentMarks = DB.marks.filter(m => m.roll === roll);
    if (studentMarks.length === 0) return 0;
    let totalGpa = 0;
    let count = 0;
    studentMarks.forEach(m => {
        const subj = DB.subjects.find(s => s.id === m.subjectId);
        if (!subj || subj.maxMarks <= 0) return;
        const ratio = m.obtained / subj.maxMarks;
        const gpa = Math.min(10, Math.max(0, ratio * 10));
        totalGpa += gpa;
        count++;
    });
    if (count === 0) return 0;
    return totalGpa / count;
}

// Average GPA for dashboard
function calculateAverageGPA() {
    if (DB.students.length === 0) return 0;
    let sum = 0;
    let counted = 0;
    DB.students.forEach(st => {
        const g = calculateGPAForStudent(st.roll);
        if (g > 0) {
            sum += g;
            counted++;
        }
    });
    return counted === 0 ? 0 : sum / counted;
}

// Attendance percentage per student
function getAttendanceSummary(roll) {
    const records = DB.attendance.filter(a => a.roll === roll);
    if (records.length === 0) {
        return { total: 0, present: 0, percent: 0 };
    }
    const present = records.filter(r => r.status === "present").length;
    const percent = (present / records.length) * 100;
    return { total: records.length, present, percent };
}

function calculateAverageAttendance() {
    if (DB.students.length === 0) return 0;
    let sum = 0;
    let counted = 0;
    DB.students.forEach(st => {
        const s = getAttendanceSummary(st.roll);
        if (s.total > 0) {
            sum += s.percent;
            counted++;
        }
    });
    return counted === 0 ? 0 : sum / counted;
}

function getTotalOutstandingFees() {
    return DB.fees.reduce((acc, f) => {
        const paid = f.payments.reduce((s, p) => s + p.amount, 0);
        return acc + Math.max(0, (f.total || 0) - paid);
    }, 0);
}
