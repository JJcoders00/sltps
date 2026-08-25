import zipfile
import xml.etree.ElementTree as ET
import json
import os
import re
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

xlsx_path = "studen-data-2026-27.xlsx"

def parse_complete_student_data(path):
    with zipfile.ZipFile(path, 'r') as z:
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            for si in tree.findall('ns:si', ns):
                t = si.find('ns:t', ns)
                if t is not None and t.text:
                    shared_strings.append(t.text)
                else:
                    text_parts = [r.find('ns:t', ns).text for r in si.findall('ns:r', ns) if r.find('ns:t', ns) is not None and r.find('ns:t', ns).text]
                    shared_strings.append("".join(text_parts))
        
        tree = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
        ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        
        rows = []
        for row in tree.findall('.//ns:row', ns):
            cells = {}
            for c in row.findall('ns:c', ns):
                c_ref = c.attrib.get('r')
                col_letter = re.sub(r'[0-9]', '', c_ref)
                c_type = c.attrib.get('t')
                v = c.find('ns:v', ns)
                val = v.text if v is not None else None
                
                if c_type == 's' and val is not None:
                    val = shared_strings[int(val)]
                elif c_type == 'inlineStr':
                    is_elem = c.find('ns:is/ns:t', ns)
                    if is_elem is not None:
                        val = is_elem.text
                cells[col_letter] = val
            rows.append(cells)

    # Headers at Row 3:
    # A: Class, B: Section, C: Name, D: Gender, E: Student PEN, F: Father Name, G: Mother Name, H: Social Category, I: Minority Group, J: Total Fees
    students = []
    
    roman_to_class = {
        'I': 'Class 1', 'II': 'Class 2', 'III': 'Class 3', 'IV': 'Class 4',
        'V': 'Class 5', 'VI': 'Class 6', 'VII': 'Class 7', 'VIII': 'Class 8',
        'IX': 'Class 9', 'X': 'Class 10', 'XI': 'Class 11', 'XII': 'Class 12',
        'LKG': 'LKG', 'UKG': 'UKG', 'PRE-KG': 'Pre-KG', 'NURSERY': 'Pre-KG'
    }

    roll_counter = 1
    for r in rows[3:]:
        raw_class = r.get('A', '').strip() if r.get('A') else ''
        if not raw_class or raw_class.lower() == 'class':
            continue
        
        section = r.get('B', 'A').strip() if r.get('B') else 'A'
        name = r.get('C', '').strip() if r.get('C') else ''
        if not name:
            continue
        
        gender = r.get('D', 'Male').strip() if r.get('D') else 'Male'
        pen_raw = r.get('E', '').strip() if r.get('E') else ''
        father = r.get('F', '').strip() if r.get('F') else ''
        mother = r.get('G', '').strip() if r.get('G') else ''
        social_cat = r.get('H', 'General').strip() if r.get('H') else 'General'
        minority = r.get('I', 'NA').strip() if r.get('I') else 'NA'
        fees_raw = r.get('J', '25000').strip() if r.get('J') else '25000'
        
        try:
            fee_total = int(float(fees_raw))
        except:
            fee_total = 25000

        std_class = roman_to_class.get(raw_class.upper(), f"Class {raw_class}")
        roll_num = f"SLT-2026-{roll_counter:03d}"
        roll_counter += 1

        # Use PEN if valid, else use roll_num as PEN
        pen = pen_raw if (pen_raw and pen_raw.upper() != 'NA') else roll_num
        parent_display = father if father and father != 'NA' else (mother if mother and mother != 'NA' else 'Parent')

        student_obj = {
            "rollNumber": roll_num,
            "pen": pen,
            "name": name.title(),
            "className": std_class,
            "section": section,
            "gender": gender,
            "fatherName": father if father != 'NA' else '',
            "motherName": mother if mother != 'NA' else '',
            "parentName": parent_display.title(),
            "socialCategory": social_cat if social_cat != 'NA' else 'General',
            "minorityGroup": minority if minority != 'NA' else 'None',
            "parentPhone": "9888877777",
            "parentEmail": f"{pen}@parent.sltps.com",
            "studentEmail": f"{pen}@sltps.com",
            "address": "Bodhivruksha Campus, Gurumitkal, Yadgir",
            "feeTotal": fee_total,
            "feePaid": fee_total,
            "feePending": 0,
            "attendancePercentage": 96,
            "totalDays": 48,
            "totalPresent": 46,
            "lastAbsent": "None"
        }
        students.append(student_obj)

    print(f"Extracted {len(students)} students with PEN, Class, Division, Father/Mother, Social Category, Minority, Fees.")
    
    with open("students_master_2026_27.json", "w", encoding="utf-8") as f:
        json.dump(students, f, indent=2)

    print("Saved to students_master_2026_27.json")

parse_complete_student_data(xlsx_path)
