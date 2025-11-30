// academics.js - Subject and marks management

/**
 * Add a new subject for a specific course and semester
 * @param {Object} subject - Subject object {course, semester, name, maxMarks}
 */
function addSubject(subject) {
    const newSubject = {
        id: crypto.randomUUID(),
        course: subject.course,
        semester: subject.semester,
        name: subject.name,
        maxMarks: subject.maxMarks
    };
    DB.subjects.push(newSubject);
    saveDB();
}

/**
 * Get list of subjects filtered by course and semester
 * @param {string} course - Course name to filter
 * @param {string} semester - Semester to filter
 * @returns {Array} Filtered array of subjects
 */
function listSubjects(course, semester) {
    return DB.subjects.filter(subject => {
        const matchesCourse = !course ||
            subject.course.toLowerCase().includes(course.toLowerCase());
        const matchesSemester = !semester ||
            subject.semester.toLowerCase().includes(semester.toLowerCase());
        return matchesCourse && matchesSemester;
    });
}

/**
 * Save or update marks for a student
 * @param {string} roll - Student's roll number
 * @param {Array} subjectMarks - Array of {subjectId, obtained} objects
 */
function saveMarksForStudent(roll, subjectMarks) {
    // First, remove existing marks for this student
    // (to handle updates cleanly)
    const subjectIds = subjectMarks.map(sm => sm.subjectId);
    DB.marks = DB.marks.filter(m =>
        !(m.roll === roll && subjectIds.includes(m.subjectId))
    );

    // Add the new marks
    subjectMarks.forEach(sm => {
        DB.marks.push({
            roll: roll,
            subjectId: sm.subjectId,
            obtained: sm.obtained
        });
    });

    saveDB();
}
