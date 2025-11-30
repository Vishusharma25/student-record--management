// students.js - Student management CRUD operations

/**
 * Add a new student to the database
 * @param {Object} student - Student object with all required fields
 * @throws {Error} If student with same roll number already exists
 */
function addStudent(student) {
    // Check if a student with the same roll already exists
    const existing = DB.students.find(s => s.roll === student.roll);
    if (existing) {
        throw new Error(`A student with roll number "${student.roll}" already exists.`);
    }
    DB.students.push(student);
    saveDB();
}

/**
 * Update an existing student's information
 * @param {string} id - The unique ID of the student
 * @param {Object} updatedData - Updated student data
 * @throws {Error} If roll number conflicts with another student
 */
function updateStudent(id, updatedData) {
    const idx = DB.students.findIndex(s => s.id === id);
    if (idx === -1) {
        throw new Error("Student not found.");
    }

    // Check if the new roll conflicts with another student
    const conflict = DB.students.find(s => s.roll === updatedData.roll && s.id !== id);
    if (conflict) {
        throw new Error(`Roll number "${updatedData.roll}" is already assigned to another student.`);
    }

    DB.students[idx] = updatedData;
    saveDB();
}

/**
 * Delete a student by their unique ID
 * @param {string} id - The unique ID of the student to delete
 */
function deleteStudentById(id) {
    DB.students = DB.students.filter(s => s.id !== id);
    saveDB();
}

/**
 * Clear all students from the database
 * WARNING: This is a destructive operation
 */
function clearAllStudents() {
    DB.students = [];
    saveDB();
}

/**
 * Get filtered list of students based on search criteria
 * @param {string} searchTerm - Search by name or roll number
 * @param {string} courseFilter - Filter by course
 * @param {string} semesterFilter - Filter by semester
 * @returns {Array} Filtered array of students
 */
function filteredStudents(searchTerm, courseFilter, semesterFilter) {
    return DB.students.filter(student => {
        // Search filter: matches name or roll
        const matchesSearch = !searchTerm ||
            student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.roll.toLowerCase().includes(searchTerm.toLowerCase());

        // Course filter
        const matchesCourse = !courseFilter ||
            (student.course || "").toLowerCase().includes(courseFilter.toLowerCase());

        // Semester filter
        const matchesSemester = !semesterFilter ||
            (student.semester || "").toLowerCase().includes(semesterFilter.toLowerCase());

        return matchesSearch && matchesCourse && matchesSemester;
    });
}
