from pathlib import Path
import re
import sqlite3
import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
PDF_DIR = Path(r'D:\codex-workspace-cli\eol-gktoudang-downloads') / '江西艺体'
DB = ROOT / 'data' / 'admission_clean.db'

TARGETS = [
    ('江西省2024年普通高校招生本科投档情况统计表(艺术类).pdf', 2024, 'art'),
    ('江西_2025_艺术本科_艺术类_艺术类本科投档线.pdf', 2025, 'art'),
    ('江西省2024年普通高校招生本科投档情况统计表(体育类).pdf', 2024, 'sports'),
    ('江西省2025年普通高校招生本科投档情况统计表(体育类).pdf', 2025, 'sports'),
]

NOISE_WORDS = ['江西省教育考试院']

def clean(value):
    if value is None:
        return ''
    text = str(value).replace('\n', '').replace('\r', '').strip()
    for word in NOISE_WORDS:
        text = text.replace(word, '')
    return text.strip()

def clean_name(value):
    text = clean(value)
    return re.sub(r'^[省教育考试院]+(?=.+(?:大学|学院|学校|中心))', '', text).strip()

def clean_group_name(value):
    text = clean(value)
    return re.sub(r'^[江西省教育考试院]+(?=第?[A-Z0-9]+组)', '', text).strip()

def clean_group_code(value):
    text = clean(value)
    return re.sub(r'^[江西省教育考试院]+(?=[A-Z][0-9]{2})', '', text).strip()

def clean_int(value):
    text = clean(value)
    m = re.search(r'\d+', text)
    return int(m.group(0)) if m else None

def clean_float(value):
    text = clean(value)
    m = re.search(r'\d+(?:\.\d+)?', text)
    return float(m.group(0)) if m else None

def normalize_category(candidate_type, value):
    if candidate_type == 'sports':
        return '体育类'
    text = clean(value)
    for noise in ['江西省教育考试院', '江西省', '教育', '考试', '院', '省', '考', '试', '育', '西', '江']:
        text = text.replace(noise, '')
    text = text.replace('教', '').replace('试', '').replace('考', '').strip()
    for name in ['美术与设计类', '音乐类', '舞蹈类', '书法类', '播音与主持类', '表(导)演类', '戏剧影视导演类', '服装表演类']:
        if name in text:
            return name
    return text or '艺术类'

def iter_rows(pdf_path, year, candidate_type):
    with pdfplumber.open(str(pdf_path)) as pdf:
        for page in pdf.pages:
            for table in page.extract_tables() or []:
                for row in table[1:]:
                    if not row or len(row) < 7:
                        continue
                    if candidate_type == 'art':
                        seq = clean_int(row[0])
                        if not seq:
                            continue
                        category = normalize_category(candidate_type, row[1])
                        school_code = clean(row[2])
                        school_name = clean_name(row[3])
                        group_code = clean_group_code(row[4])
                        group_name = clean_group_name(row[5])
                        line = clean_float(row[6])
                        rank = clean_int(row[7] if len(row) > 7 else None)
                    else:
                        seq = clean_int(row[0])
                        if not seq:
                            continue
                        category = '体育类'
                        school_code = clean(row[1])
                        school_name = clean_name(row[2])
                        group_code = clean_group_code(row[3])
                        group_name = clean_group_name(row[4])
                        line = clean_float(row[5])
                        rank = clean_int(row[6] if len(row) > 6 else None)
                    if not school_name or not group_code or line is None:
                        continue
                    yield (year, candidate_type, category, school_code, school_name, group_code, group_name, line, rank, pdf_path.name)

def main():
    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    cur.execute('''
    create table if not exists art_sports_admission (
      id integer primary key autoincrement,
      province text not null,
      year integer not null,
      batch text not null,
      candidate_type text not null,
      category text not null,
      school_code text,
      school_name text not null,
      group_code text not null,
      group_name text,
      filing_score real not null,
      filing_rank integer,
      source_file text,
      unique(province, year, batch, candidate_type, category, school_code, school_name, group_code)
    )
    ''')
    cur.execute('create index if not exists idx_art_sports_lookup on art_sports_admission(province, candidate_type, category, year, filing_score, filing_rank)')
    cur.execute("delete from art_sports_admission where province = '江西'")
    total = 0
    for filename, year, candidate_type in TARGETS:
        pdf = PDF_DIR / filename
        if not pdf.exists():
            raise FileNotFoundError(pdf)
        count = 0
        for row in iter_rows(pdf, year, candidate_type):
            cur.execute('''
              insert into art_sports_admission
              (province, year, batch, candidate_type, category, school_code, school_name, group_code, group_name, filing_score, filing_rank, source_file)
              values ('江西', ?, '本科批', ?, ?, ?, ?, ?, ?, ?, ?, ?)
              on conflict(province, year, batch, candidate_type, category, school_code, school_name, group_code)
              do update set group_name=excluded.group_name, filing_score=excluded.filing_score, filing_rank=excluded.filing_rank, source_file=excluded.source_file
            ''', row)
            count += 1
        print(filename, count)
        total += count
    conn.commit()
    print('total', total)
    for item in cur.execute('select year, candidate_type, category, count(*) from art_sports_admission group by year, candidate_type, category order by year, candidate_type, category'):
        print(item)
    conn.close()

if __name__ == '__main__':
    main()

