import fs from 'fs';

const projectId = 'sltpublicschool';
const students = JSON.parse(fs.readFileSync('students_master_2026_27.json', 'utf8'));

// Classes definitions
const STANDARD_CLASSES = [
    { id: 'prekg_a', className: 'Pre-KG', section: 'A', teacherName: 'Ms. Soumya K.', academicYear: '2026-27' },
    { id: 'lkg_a', className: 'LKG', section: 'A', teacherName: 'Ms. Sunitha R.', academicYear: '2026-27' },
    { id: 'ukg_a', className: 'UKG', section: 'A', teacherName: 'Ms. Rekha Patil', academicYear: '2026-27' },
    { id: 'c1_a', className: 'Class 1', section: 'A', teacherName: 'Mr. Anand Kumar', academicYear: '2026-27' },
    { id: 'c2_a', className: 'Class 2', section: 'A', teacherName: 'Ms. Pooja Deshmukh', academicYear: '2026-27' },
    { id: 'c3_a', className: 'Class 3', section: 'A', teacherName: 'Mr. Ramesh N.', academicYear: '2026-27' },
    { id: 'c4_a', className: 'Class 4', section: 'A', teacherName: 'Ms. Deepa Sharma', academicYear: '2026-27' },
    { id: 'c5_a', className: 'Class 5', section: 'A', teacherName: 'Mr. Basavaraj G.', academicYear: '2026-27' },
    { id: 'c6_a', className: 'Class 6', section: 'A', teacherName: 'Ms. Meenakshi S.', academicYear: '2026-27' },
    { id: 'c7_a', className: 'Class 7', section: 'A', teacherName: 'Mr. Vijay Kulkarni', academicYear: '2026-27' },
    { id: 'c8_a', className: 'Class 8', section: 'A', teacherName: 'Ms. Kavitha Reddy', academicYear: '2026-27' },
    { id: 'c9_a', className: 'Class 9', section: 'A', teacherName: 'Mr. Sharanappa T.', academicYear: '2026-27' },
    { id: 'c10_a', className: 'Class 10', section: 'A', teacherName: 'Dr. Suresh Joshi', academicYear: '2026-27' }
];

function toFirestoreFields(obj) {
    const fields = {};
    for (const [k, v] of Object.entries(obj)) {
        if (typeof v === 'string') {
            fields[k] = { stringValue: v };
        } else if (typeof v === 'number') {
            if (Number.isInteger(v)) {
                fields[k] = { integerValue: v.toString() };
            } else {
                fields[k] = { doubleValue: v };
            }
        } else if (typeof v === 'boolean') {
            fields[k] = { booleanValue: v };
        } else if (Array.isArray(v)) {
            fields[k] = {
                arrayValue: {
                    values: v.map(item => typeof item === 'string' ? { stringValue: item } : { mapValue: { fields: toFirestoreFields(item) } })
                }
            };
        } else if (v && typeof v === 'object') {
            fields[k] = { mapValue: { fields: toFirestoreFields(v) } };
        } else if (v === null) {
            fields[k] = { nullValue: null };
        }
    }
    return fields;
}

async function uploadClasses() {
    console.log("=== Uploading Classes to Firestore ===");
    for (const cls of STANDARD_CLASSES) {
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/classes/${cls.id}`;
        const body = JSON.stringify({ fields: toFirestoreFields(cls) });
        try {
            const res = await fetch(url, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body
            });
            if (res.ok) {
                console.log(`✅ Class ${cls.className}-${cls.section} synced.`);
            } else {
                const err = await res.text();
                console.error(`❌ Error class ${cls.id}:`, err);
            }
        } catch (e) {
            console.error(`❌ Network error ${cls.id}:`, e.message);
        }
    }
}

async function uploadStudents() {
    console.log(`\n=== Uploading ${students.length} Official Students to Firestore ===`);
    let count = 0;
    
    // Batch in chunks of 20
    const chunkSize = 20;
    for (let i = 0; i < students.length; i += chunkSize) {
        const chunk = students.slice(i, i + chunkSize);
        await Promise.all(chunk.map(async (stu) => {
            const docId = stu.rollNumber;
            const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/students/${docId}`;
            const body = JSON.stringify({ fields: toFirestoreFields(stu) });
            try {
                const res = await fetch(url, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body
                });
                if (res.ok) {
                    count++;
                } else {
                    const err = await res.text();
                    console.error(`❌ Error student ${docId}:`, err);
                }
            } catch (e) {
                console.error(`❌ Network error student ${docId}:`, e.message);
            }
        }));
        console.log(`Progress: ${Math.min(i + chunkSize, students.length)} / ${students.length} students uploaded.`);
    }
    console.log(`\n🎉 Upload Complete! Total students in Firestore: ${count} / ${students.length}`);
}

async function main() {
    await uploadClasses();
    await uploadStudents();
}

main();
