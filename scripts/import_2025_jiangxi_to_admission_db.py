# -*- coding: utf-8 -*-
import sqlite3
from pathlib import Path
import pandas as pd
DB=Path('D:/\u9ad8\u8003\u5fd7\u613f\u586b\u62a5/projects/data/admission_clean.db')
CSV=Path(r'D:\codex-workspace-cli\eol-gktoudang-downloads\parsed\admission_2025_jiangxi_added.csv')
JX='\u6c5f\u897f'
df=pd.read_csv(CSV,dtype=str,encoding='utf-8-sig').fillna('')
wanted=df[(df['province']==JX) & (df['year'].astype(str)=='2025')].copy()
print('csv rows',len(df),'wanted',len(wanted))
def to_int(v):
    s=str(v).strip()
    if not s: return None
    try: return int(float(s))
    except: return None
rows=[]
for _,r in wanted.iterrows():
    rows.append((r['province'], to_int(r['year']), r.get('category') or None, r.get('batch') or None, r['school_name'], r.get('major_name') or None, to_int(r.get('score')), to_int(r.get('rank')), to_int(r.get('quota')), r.get('source_file') or None))
con=sqlite3.connect(DB); cur=con.cursor()
before=cur.execute('select count(*) from admission').fetchone()[0]
print('before total',before)
print('before target',cur.execute('select province, year, count(*) from admission where year=2025 and province=? group by province, year', (JX,)).fetchall())
check_sql = """
select 1 from admission
where province=? and year=?
  and ifnull(category,'')=ifnull(?,'')
  and ifnull(batch,'')=ifnull(?,'')
  and school_name=?
  and ifnull(major_name,'')=ifnull(?,'')
  and ifnull(score,-1)=ifnull(?,-1)
  and ifnull(rank,-1)=ifnull(?,-1)
  and ifnull(quota,-1)=ifnull(?,-1)
  and ifnull(source_file,'')=ifnull(?,'')
limit 1
"""
insert_sql='insert into admission (province, year, category, batch, school_name, major_name, score, rank, quota, source_file) values (?,?,?,?,?,?,?,?,?,?)'
inserted=0
with con:
    for row in rows:
        if cur.execute(check_sql,row).fetchone():
            continue
        cur.execute(insert_sql,row)
        inserted += 1
after=cur.execute('select count(*) from admission').fetchone()[0]
print('inserted',inserted,'after total',after,'delta',after-before)
print('after target',cur.execute('select province, year, category, count(*) from admission where year=2025 and province=? group by province, year, category order by category', (JX,)).fetchall())
con.close()
