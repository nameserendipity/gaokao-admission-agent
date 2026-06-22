# -*- coding: utf-8 -*-
import os, re, csv, json
from pathlib import Path
import pdfplumber
ROOT=Path(r'D:\codex-workspace-cli\eol-gktoudang-downloads')
OUT=ROOT/'parsed'
PDF=Path(os.environ['JX_PDF'])
CSV=OUT/'admission_2025_jiangxi_added.csv'
REVIEW=OUT/'admission_2025_jiangxi_review.json'
FIELDS=['province','year','category','batch','school_name','major_name','score','rank','quota','source_file','article_title','article_url','file_path']
WATERMARK_CHARS=set('江西省教育考试院')

def clean(s):
    if s is None: return ''
    parts=str(s).replace('\r','\n').split('\n')
    kept=[]
    for part in parts:
        p=part.strip().replace('\u3000',' ').replace('\xa0',' ')
        if not p: continue
        # Drop watermark fragments only when the whole line is just 1-3 watermark chars.
        if len(p) <= 3 and all(ch in WATERMARK_CHARS for ch in p):
            continue
        kept.append(p)
    s=''.join(kept)
    s=re.sub(r'\s+',' ',s).strip()
    return s

def digits(s):
    s=clean(s)
    m=re.search(r'\d+',s.replace(',','').replace('，',''))
    return m.group(0) if m else ''

records=[]; review=[]
with pdfplumber.open(str(PDF)) as pdf:
    for pi,page in enumerate(pdf.pages,1):
        tables=page.extract_tables() or []
        if not tables:
            review.append({'page':pi,'reason':'no_tables'}); continue
        for ti,table in enumerate(tables):
            if not table or len(table)<2: continue
            for ri,row in enumerate(table[1:],1):
                row=list(row)+['']*8
                seq=digits(row[0]); cat=clean(row[1]); school_code=digits(row[2]); school=clean(row[3]); group_code=digits(row[4]); group_name=clean(row[5]); score=digits(row[6]); rank=digits(row[7])
                if not seq and not school and not score: continue
                if not school or not score:
                    review.append({'page':pi,'table':ti,'row':ri,'reason':'missing_school_or_score','raw':row}); continue
                if '历史' in cat: cat='历史类'
                elif '物理' in cat: cat='物理类'
                elif '三校' in cat: cat='三校生类'
                major=(f'{group_code} {group_name}'.strip())
                records.append({'province':'江西','year':'2025','category':cat,'batch':'本科批','school_name':school,'major_name':major,'score':score,'rank':rank,'quota':'','source_file':PDF.name,'article_title':'江西省2025年普通高校招生本科投档情况统计表(历史类、物理类、三校生类)','article_url':'','file_path':str(PDF)})
seen=set(); out=[]
for r in records:
    key=(r['province'],r['year'],r['category'],r['batch'],r['school_name'],r['major_name'],r['score'],r['rank'],r['source_file'])
    if key not in seen:
        seen.add(key); out.append(r)
records=out
with CSV.open('w',newline='',encoding='utf-8-sig') as f:
    w=csv.DictWriter(f,fieldnames=FIELDS); w.writeheader(); w.writerows(records)
# sanity checks
bad=[r for r in records if '北京体大学' in r['school_name'] or '师范大学' not in r['school_name'] and r['school_name']=='北京师范大学']
REVIEW.write_text(json.dumps({'records':len(records),'review_count':len(review),'review_sample':review[:50],'bad_sample':bad[:10]},ensure_ascii=False,indent=2),encoding='utf-8')
print('records',len(records),'review',len(review),'csv',CSV)
from collections import Counter
print(Counter(r['category'] for r in records))
print('samples')
for r in records[:10]: print(r)
print('contains 北京体育大学', any(r['school_name']=='北京体育大学' for r in records), 'bad 北京体大学', any(r['school_name']=='北京体大学' for r in records))
