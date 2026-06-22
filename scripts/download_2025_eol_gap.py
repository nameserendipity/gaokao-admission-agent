# -*- coding: utf-8 -*-
import requests,re,html,csv,hashlib,json
from pathlib import Path
from urllib.parse import urljoin, urlparse
ROOT=Path('D:/\u9ad8\u8003\u5fd7\u613f\u586b\u62a5/projects')
RAW=ROOT/'data'/'raw-admissions'/'2025'
RAW.mkdir(parents=True,exist_ok=True)
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36'
pages=[
 ('北京','本科批','综合','2025年北京市高招本科普通批录取投档线','https://gaokao.eol.cn/bei_jing/dongtai/202507/t20250722_2682390.shtml'),
 ('上海','本科批','综合','上海2025年本科普通批次投档分数线','https://gaokao.eol.cn/shang_hai/dongtai/202507/t20250721_2682239.shtml'),
 ('重庆','本科批','物理/历史','2025年重庆市本科批平行志愿','https://gaokao.eol.cn/chong_qing/dongtai/202507/t20250721_2682307.shtml'),
 ('江苏','本科批','历史','江苏2025年普通本科批次投档线（历史类）','https://gaokao.eol.cn/jiang_su/dongtai/202507/t20250722_2682472.shtml'),
 ('江苏','本科批','物理','江苏2025年普通本科批次投档线（物理类）','https://gaokao.eol.cn/jiang_su/dongtai/202507/t20250722_2682481.shtml'),
 ('广东','本科批','普通类','广东省2025年普通高考本科批次正式投档','https://gaokao.eol.cn/guang_dong/dongtai/202507/t20250721_2682272.shtml'),
 ('辽宁','本科批','普通类','2025年辽宁普通本科批各院校投档分数线','https://gaokao.eol.cn/liao_ning/dongtai/202507/t20250721_2682144.shtml'),
 ('内蒙古','本科批','普通类','内蒙古2025年普通高考本科批第一次投档最高分最低分','https://gaokao.eol.cn/nei_meng/dongtai/202507/t20250722_2682494.shtml'),
 ('海南','本科批','普通类','2025年海南本科普通批第二次征集投档线','https://gaokao.eol.cn/hai_nan/dongtai/202507/t20250729_2683603.shtml'),
]
def safe(s):
    return re.sub(r'[\\/:*?"<>|\r\n\t]+','_',s).strip()[:150]
def fetch(url,referer=None):
    return requests.get(url,headers={'User-Agent':UA,'Referer':referer or 'https://gaokao.eol.cn/'},timeout=60)
rows=[]
seen=set()
for prov,batch,cat,title,page in pages:
    pdir=RAW/prov; pdir.mkdir(exist_ok=True)
    r=fetch(page); text=r.content.decode('utf-8','ignore')
    src=pdir/(safe(f'{prov}_{title}_source')+'.html'); src.write_bytes(r.content)
    rows.append(dict(province=prov,year='2025',batch=batch,category=cat,title=title,page_url=page,url=page,path=str(src),ext='html',kind='source',status='downloaded',bytes=src.stat().st_size))
    urls=[]
    for m in re.finditer(r'href=["\']([^"\']+)["\']',text,re.I):
        u=urljoin(page,html.unescape(m.group(1)))
        if re.search(r'\.(pdf|xls|xlsx|doc|docx)(?:\?|$)',u,re.I) or ('nm.zsks.cn' in u and 'tdzgzdf.html' in u):
            urls.append(u)
    # for hainan source table, source is enough
    for u in urls:
        if u in seen: continue
        seen.add(u)
        try:
            rr=fetch(u,page)
            ext=Path(urlparse(u).path).suffix.lower().lstrip('.') or 'html'
            name=safe(f'{prov}_{title}__{Path(urlparse(u).path).name or "official"}')
            if not name.lower().endswith('.'+ext): name += '.'+ext
            out=pdir/name; out.write_bytes(rr.content)
            rows.append(dict(province=prov,year='2025',batch=batch,category=cat,title=title,page_url=page,url=u,path=str(out),ext=ext,kind='attachment',status='downloaded',bytes=out.stat().st_size))
            print('downloaded',prov,u,out.stat().st_size)
        except Exception as e:
            rows.append(dict(province=prov,year='2025',batch=batch,category=cat,title=title,page_url=page,url=u,path='',ext='',kind='attachment',status='error:'+repr(e),bytes=0))
            print('ERR',prov,u,e)
manifest=RAW/'manifest_2025_eol_gap.csv'
with manifest.open('w',newline='',encoding='utf-8-sig') as f:
    w=csv.DictWriter(f,fieldnames=['province','year','batch','category','title','page_url','url','path','ext','kind','status','bytes']); w.writeheader(); w.writerows(rows)
print('manifest',manifest,'rows',len(rows))
