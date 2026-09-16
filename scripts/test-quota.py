"""Execute the exact production reservation SQL against SQLite, without network calls."""
import pathlib, re, sqlite3
root=pathlib.Path(__file__).resolve().parents[1]
sql=re.search(r'RESERVE_JOB_SQL\s*=\s*`(.*?)`', (root/'lib/quota.ts').read_text(), re.S).group(1)
c=sqlite3.connect(':memory:')
for file in sorted((root/'drizzle').glob('*.sql')): c.executescript(file.read_text())
c.execute("INSERT INTO investigations VALUES ('i','u','t','{}',1,'now')")
def reserve(job,owner='u',inv='i',revision=1,ul=2,gl=3):
    return c.execute(sql,(job,owner,inv,revision,'2026-09-16','now',owner,'2026-09-16',ul,'2026-09-16',gl,inv,inv,owner,revision)).fetchone()
assert reserve('one')
assert reserve('concurrent') is None
assert c.execute('SELECT COUNT(*) FROM inference_jobs').fetchone()[0]==1
c.execute("UPDATE inference_jobs SET status='completed'")
assert reserve('two')
c.execute("UPDATE inference_jobs SET status='completed'")
for x in range(30): assert reserve('blocked'+str(x)) is None
assert c.execute('SELECT COUNT(*) FROM inference_jobs').fetchone()[0]==2
assert reserve('stale',revision=0,ul=10) is None
assert reserve('missing',inv='missing',ul=10) is None
assert reserve('otherowner',owner='v',ul=10) is None
assert reserve('three',ul=10)
c.execute("UPDATE inference_jobs SET status='completed'")
assert reserve('globalblocked',ul=10) is None
print('PASS: atomic user/global quota, concurrent job lock, stale revision, missing investigation and ownership checks')
