import zipfile
import xml.etree.ElementTree as ET
import json
import os

xlsx_path = "studen-data-2026-27.xlsx"

def inspect_xlsx(path):
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return

    with zipfile.ZipFile(path, 'r') as z:
        print("Files in archive:", z.namelist())
        
        # Read shared strings
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            # namespace
            ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            for si in tree.findall('ns:si', ns):
                t = si.find('ns:t', ns)
                if t is not None and t.text:
                    shared_strings.append(t.text)
                else:
                    # check for formatted text runs <r><t>
                    text_parts = [r.find('ns:t', ns).text for r in si.findall('ns:r', ns) if r.find('ns:t', ns) is not None and r.find('ns:t', ns).text]
                    shared_strings.append("".join(text_parts))
        
        print(f"Loaded {len(shared_strings)} shared strings.")
        
        # Read sheet1
        sheet_files = [f for f in z.namelist() if f.startswith('xl/worksheets/sheet') and f.endswith('.xml')]
        for sheet_file in sheet_files:
            print(f"\n--- Reading {sheet_file} ---")
            tree = ET.fromstring(z.read(sheet_file))
            ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            
            rows_data = []
            for row in tree.findall('.//ns:row', ns):
                row_idx = row.attrib.get('r')
                cells = []
                for c in row.findall('ns:c', ns):
                    c_ref = c.attrib.get('r')
                    c_type = c.attrib.get('t')
                    v = c.find('ns:v', ns)
                    val = v.text if v is not None else None
                    
                    if c_type == 's' and val is not None:
                        val = shared_strings[int(val)]
                    elif c_type == 'inlineStr':
                        is_elem = c.find('ns:is/ns:t', ns)
                        if is_elem is not None:
                            val = is_elem.text
                    cells.append((c_ref, val))
                rows_data.append((row_idx, cells))
            
            print(f"Total rows in sheet: {len(rows_data)}")
            print("First 15 rows preview:")
            for r_idx, cells in rows_data[:15]:
                print(f"Row {r_idx}: {[v for r, v in cells]}")

inspect_xlsx(xlsx_path)
