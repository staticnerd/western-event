import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const router = useRouter();
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showPw, setShowPw] = useState(false);

  const doLogin = async () => {
    if (!u.trim() || !p) { setErr('Please enter username and password.'); return; }
    setErr(''); setLoading(true);
    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      });
      const d = await r.json();
      if (r.ok && d.ok) {
        router.push('/admin');
      } else {
        setAttempts(a => a + 1);
        setErr(d.error || 'Invalid credentials.');
        setP('');
      }
    } catch { setErr('Connection error. Please try again.'); }
    setLoading(false);
  };

  const inp = {
    width:'100%', padding:'.73rem .9rem',
    background:'rgba(255,255,255,.05)',
    border:'1.5px solid rgba(255,255,255,.08)',
    color:'#fff', borderRadius:9, fontSize:'.9rem',
    fontFamily:"'Outfit',system-ui,sans-serif",
    transition:'border-color .2s', outline:'none',
  };

  return (
    <>
      <Head>
        <title>WSE Admin — Sign In</title>
        <meta name="robots" content="noindex,nofollow" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Outfit',system-ui,sans-serif;background:#0F0A09;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1.5rem;
          background-image:radial-gradient(ellipse at 65% 35%,rgba(200,85,106,.1) 0%,transparent 60%),radial-gradient(ellipse at 20% 80%,rgba(212,168,83,.06) 0%,transparent 50%)}
        @keyframes pop{from{opacity:0;transform:scale(.93) translateY(14px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
        input::placeholder{color:#8A7E7B}
        input:focus{border-color:#C8556A !important; background:rgba(255,255,255,.08) !important}
      `}</style>

      <div style={{width:'100%',maxWidth:390,background:'#1C1310',border:'1px solid rgba(255,255,255,.08)',borderRadius:18,padding:'2.6rem 2.2rem',boxShadow:'0 32px 80px rgba(0,0,0,.55)',animation:'pop .45s ease both'}}>
        <div style={{textAlign:'center',marginBottom:'2rem'}}>
          <div style={{width:58,height:58,background:'linear-gradient(135deg,#C8556A,#9E3A4F)',borderRadius:'50%',display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:'.9rem',boxShadow:'0 0 36px rgba(200,85,106,.28)',fontSize:'1.6rem'}}>🌸</div>
          <h1 style={{fontSize:'1.08rem',fontWeight:600,color:'#fff',marginBottom:'.18rem'}}>Western Sydney Events</h1>
          <p style={{fontSize:'.72rem',color:'#8A7E7B',letterSpacing:'.08em',textTransform:'uppercase'}}>Admin Control Panel</p>
        </div>

        <div style={{textAlign:'center',marginBottom:'1.6rem'}}>
          <span style={{display:'inline-flex',alignItems:'center',gap:'.4rem',background:'rgba(200,85,106,.1)',border:'1px solid rgba(200,85,106,.2)',color:'#C8556A',fontSize:'.63rem',letterSpacing:'.14em',textTransform:'uppercase',padding:'.2rem .75rem',borderRadius:100}}>🔐 Authorised Access Only</span>
        </div>

        {err && (
          <div style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.22)',color:'#FCA5A5',fontSize:'.79rem',padding:'.6rem .9rem',borderRadius:8,marginBottom:'1rem',display:'flex',alignItems:'center',gap:'.5rem'}}>
            ⚠ {err}
          </div>
        )}
        {attempts >= 3 && (
          <div style={{background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.2)',color:'#FCD34D',fontSize:'.75rem',padding:'.5rem .9rem',borderRadius:8,marginBottom:'.8rem'}}>
            ⚠ {attempts} failed attempt{attempts>1?'s':''}. After 10 attempts your IP will be blocked for 15 minutes.
          </div>
        )}

        <div style={{marginBottom:'1rem'}}>
          <label style={{display:'block',fontSize:'.68rem',letterSpacing:'.12em',textTransform:'uppercase',color:'#8A7E7B',marginBottom:'.38rem',fontWeight:500}}>Username</label>
          <input type="text" value={u} onChange={e=>setU(e.target.value)} onKeyDown={e=>e.key==='Enter'&&document.getElementById('pw-field').focus()} placeholder="Enter username" autoComplete="username" autoFocus style={inp}/>
        </div>

        <div style={{marginBottom:'1.2rem'}}>
          <label style={{display:'block',fontSize:'.68rem',letterSpacing:'.12em',textTransform:'uppercase',color:'#8A7E7B',marginBottom:'.38rem',fontWeight:500}}>Password</label>
          <div style={{position:'relative'}}>
            <input id="pw-field" type={showPw?'text':'password'} value={p} onChange={e=>setP(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doLogin()} placeholder="Enter password" autoComplete="current-password"
              style={{...inp,paddingRight:'2.6rem'}}/>
            <button onClick={()=>setShowPw(!showPw)} style={{position:'absolute',right:'.75rem',top:'50%',transform:'translateY(-50%)',color:'#8A7E7B',cursor:'pointer',background:'none',border:'none',padding:0,lineHeight:1,fontSize:'.95rem'}}>
              {showPw?'🙈':'👁'}
            </button>
          </div>
        </div>

        <button onClick={doLogin} disabled={loading}
          style={{width:'100%',padding:'.84rem',background:loading?'rgba(200,85,106,.5)':'#C8556A',color:'#fff',fontSize:'.9rem',fontWeight:600,borderRadius:9,border:'none',cursor:loading?'not-allowed':'pointer',fontFamily:"'Outfit',system-ui,sans-serif",display:'flex',alignItems:'center',justifyContent:'center',gap:'.5rem',transition:'background .25s'}}>
          {loading
            ? <><div style={{width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .6s linear infinite'}}/>Signing in…</>
            : 'Sign In →'}
        </button>

        <p style={{textAlign:'center',marginTop:'1.6rem',fontSize:'.7rem',color:'rgba(255,255,255,.15)',lineHeight:1.7}}>
          This panel is for authorised administrators only.<br/>Unauthorised access is prohibited.
        </p>
      </div>
    </>
  );
}
