// attendance.js
// Handles marking attendance and calculating stats

function markAttendanceForDate(date, records) {
    // records is an array of objects: [{roll, status}, {roll, status}, ...]
    
    // First, remove any existing records for this specific date and these students
    // to avoid duplicates if we are updating attendance for the same day.
    records.forEach(r => {
        DB.attendance = DB.attendance.filter(
            a => !(a.date === date && a.roll === r.roll)
        );
        // Add the new record
        DB.attendance.push({ date, roll: r.roll, status: r.status });
    });
    saveDB();
}

function getAttendanceRecordsForFilter(course, semester) {
    // Returns a list of students that match the course/semester
    // so we can generate the list of checkboxes for them.
    return DB.students.filter(s => {
        const matchesCourse = !course || (s.course || "").toLowerCase().includes(course.toLowerCase());
        const matchesSem = !semester || (s.semester || "").toLowerCase().includes(semester.toLowerCase());
        return matchesCourse && matchesSem;
    });
}
