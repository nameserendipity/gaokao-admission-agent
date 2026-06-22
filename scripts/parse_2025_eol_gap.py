# -*- coding: utf-8 -*-
import re,csv
from pathlib import Path
from io import StringIO
import pdfplumber, pandas as pd
ROOT=Path('D:/\u9ad8\u8003\u5fd7\u613f\u586b\u62a5/projects')
RAW=ROOT/'data'/'raw-admissions'/'2025'
OUT=ROOT/'data'/'raw-admissions'/'parsed'; OUT.mkdir(parents=True,exist_ok=True)
CSV=OUT/'admission_2025_eol_gap_added.csv'
FIELDS=['province','year','category','batch','school_name','major_name','score','rank','quota','source_file','article_title','article_url','file_path']
BJ='\u5317\u4eac'; SH='\u4e0a\u6d77'; JS='\u6c5f\u82cf'; CQ='\u91cd\u5e86'; HN='\u6d77\u5357'
WM=set('\u6c5f\u897f\u7701\u6559\u80b2\u8003\u8bd5\u9662\u4e0a\u6d77\u5e02')
def clean(s):
    if s is None: return ''
    parts=str(s).replace('\r','\n').split('\n'); kept=[]
    for p in parts:
        p=p.strip().replace('\u3000',' ').replace('\xa0',' ')
        if not p: continue
        if len(p)<=3 and all(ch in WM for ch in p): continue
        kept.append(p)
    return re.sub(r'\s+',' ',''.join(kept)).strip()
def num(s):
    s=clean(s).replace(',','').replace('，','')
    if '580分及以上' in s: return '580'
    m=re.search(r'\d+',s)
    return m.group(0) if m else ''
def split_school_group(text):
    t=clean(text)
    m=re.match(r'(.+?)(\d{2,3})专业组(.*)',t)
    if m: return m.group(1), (m.group(2)+'专业组'+m.group(3))
    m=re.match(r'(.+?)\((\d{2,3})\)',t)
    if m: return m.group(1), m.group(2)
    return t,''
records=[]
# Beijing
for p in (RAW/BJ).glob('*.pdf'):
    with pdfplumber.open(p) as pdf:
        for page in pdf.pages:
            for table in page.extract_tables() or []:
                for row in table[1:]:
                    row=list(row)+['']*12
                    school=clean(row[2]); group=clean(row[3]); req=clean(row[4]); score=num(row[5])
                    if not school or not score or '院校' in school: continue
                    records.append(dict(province=BJ,year='2025',category='综合',batch='本科批',school_name=school,major_name=(group+' '+req).strip(),score=score,rank='',quota='',source_file=p.name,article_title='2025年北京市高招本科普通批录取投档线',article_url='',file_path=str(p)))
# Shanghai
for p in (RAW/SH).glob('*.pdf'):
    with pdfplumber.open(p) as pdf:
        for page in pdf.pages:
            for table in page.extract_tables() or []:
                for row in table[2:]:
                    row=list(row)+['']*10
                    code=clean(row[0]); name=clean(row[1]); score=num(row[2])
                    if not code or not name or not score: continue
                    school,grp=split_school_group(name)
                    records.append(dict(province=SH,year='2025',category='综合',batch='本科批',school_name=school,major_name=(code+' '+grp).strip(),score=score,rank='',quota='',source_file=p.name,article_title='上海2025年本科普通批次投档分数线',article_url='',file_path=str(p)))
# Jiangsu
for p in (RAW/JS).glob('*.pdf'):
    cat='历史类' if '历史' in p.name else '物理类'
    with pdfplumber.open(p) as pdf:
        for page in pdf.pages:
            for table in page.extract_tables() or []:
                for row in table[3:]:
                    row=list(row)+['']*9
                    code=num(row[0]); text=clean(row[1]); score=num(row[2])
                    if not code or not text or not score: continue
                    school,grp=split_school_group(text)
                    records.append(dict(province=JS,year='2025',category=cat,batch='本科批',school_name=school,major_name=(code+' '+grp).strip(),score=score,rank='',quota='',source_file=p.name,article_title='江苏2025年普通本科批次投档线',article_url='',file_path=str(p)))
# Hainan source html table
for p in (RAW/HN).glob('*source.html'):
    try: tables=pd.read_html(p)
    except Exception: tables=[]
    for df in tables:
        df=df.astype(str)
        for _,r in df.iloc[1:].iterrows():
            vals=[clean(x) for x in r.tolist()]
            if len(vals)<5: continue
            cat,code,name,req,score=vals[:5]; score=num(score)
            if not name or not score: continue
            school,grp=split_school_group(name)
            records.append(dict(province=HN,year='2025',category=cat or '普通类',batch='本科批第二次征集',school_name=school,major_name=(code+' '+grp+' '+req).strip(),score=score,rank='',quota='',source_file=p.name,article_title='海南2025年本科普通批第二次征集投档线',article_url='',file_path=str(p)))
seen=set(); out=[]
for r in records:
    try:
        sc=int(r['score'])
        if sc<100 or sc>750: continue
    except: continue
    key=tuple(r[k] for k in ['province','year','category','batch','school_name','major_name','score','rank','source_file'])
    if key not in seen:
        seen.add(key); out.append(r)
records=out
with CSV.open('w',newline='',encoding='utf-8-sig') as f:
    w=csv.DictWriter(f,fieldnames=FIELDS); w.writeheader(); w.writerows(records)
from collections import Counter
print('records',len(records),CSV)
print(Counter((r['province'],r['category']) for r in records))
for r in records[:15]: print(r)
