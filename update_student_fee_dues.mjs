import fs from 'fs';

const projectId = 'sltpublicschool';
const students = JSON.parse(fs.readFileSync('students_master_2026_27.json', 'utf8'));

// Update all students so feePaid is 0 and feePending is feeTotal
students.forEach(s => {
    const total = s.feeTotal || 25000;
    s.feeTotal = total;
    s.feePaid = 0;
    s.feePending = total;
});

fs.writeFileSync('students_master_2026_27.json', JSON.stringify(students, null, 2));

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

async function uploadStudent(stu) {
    const docId = stu.rollNumber;
    const fields = toFirestoreFields(stu);
    const fieldMasks = Object.keys(stu).map(k => `updateMask.fieldPaths=${k}`).join('&');
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/students/${docId}?${fieldMasks}`;
    
    const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
    });
    
    return res.ok;
}

async function main() {
    console.log("=== Updating all 263 students with feePending = feeTotal and feePaid = 0 ===");
    let success = 0;
    const chunkSize = 25;
    for (let i = 0; i < students.length; i += chunkSize) {
        const chunk = students.slice(i, i + chunkSize);
        await Promise.all(chunk.map(async (stu) => {
            const ok = await uploadStudent(stu);
            if (ok) success++;
        }));
        console.log(`Progress: ${Math.min(i + chunkSize, students.length)} / ${students.length}`);
    }
    console.log(`Done! Synced ${success} students.`);
}

main();
