import Head from 'next/head';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';

const CATS = {
  birthday:   'Birthday Decor',
  babyshower: 'Baby Shower',
  inhouse:    'In House Decoration',
  kids:       'Kids Theme Decor',
  haldi:      'Haldi, Mehndi & Sangeet',
  mandap:     'Wedding Mandap',
  reception:  'Wedding Reception / Anniversary',
  corporate:  'Corporate Events / Business Opening',
};

const CAT_OPTS = Object.entries(CATS);

// ── colours ─────────────────────────────
const C = {
  rose:'#C8556A', roseDk:'#9E3A4F', roseG:'rgba(200,85,106,.25)',
  gold:'#D4A853',
  dark:'#0F0A09', panel:'#191210', card:'#211612',
  border:'rgba(255,255,255,.07)',
  gray:'#8A7E7B', grayLt:'#C4B8B5',
  green:'#22C55E', greenBg:'rgba(34,197,94,.1)',
  amber:'#F59E0B', amberBg:'rgba(245,158,11,.1)',
  blue:'#3B82F6',  blueBg:'rgba(59,130,246,.1)',
  red:'#EF4444',   redBg:'rgba(239,68,68,.1)',
};

// ── small reusable style helpers ─────────
const card  = { background:C.card, border:`1px solid ${C.border}`, borderRadius:10 };
const label = { display:'block', fontSize:'.67rem', letterSpacing:'.11em', textTransform:'uppercase', color:C.gray, marginBottom:'.35rem', fontWeight:500 };
const inp   = { width:'100%', padding:'.65rem .85rem', background:'rgba(255,255,255,.05)', border:`1.5px solid ${C.border}`, color:'#fff', borderRadius:8, fontSize:'.87rem', outline:'none', fontFamily:"'Outfit',system-ui,sans-serif", transition:'border-color .2s', appearance:'none' };

export default function Admin() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState('dash');

  // dashboard
  const [summary, setSummary] = useState({});
  const [recent, setRecent] = useState([]);

  // upload
  const [upCat, setUpCat] = useState('');
  const [upCap, setUpCap] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [upState, setUpState] = useState('idle'); // idle | uploading | done | error
  const [upProg, setUpProg] = useState(0);
  const [upMsg, setUpMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  // manage
  const [mgItems, setMgItems] = useState([]);
  const [mgLoading, setMgLoading] = useState(false);
  const [mgCat, setMgCat] = useState('all');
  const [mgType, setMgType] = useState('all');
  const [mgQ, setMgQ] = useState('');
  const [selected, setSelected] = useState(new Set());

  // edit modal
  const [editItem, setEditItem] = useState(null);
  const [editCap, setEditCap] = useState('');
  const [editCat, setEditCat] = useState('');

  // videos
  const [ytVideos, setYtVideos] = useState([]);
  const [ytUrl, setYtUrl] = useState('');
  const [ytTitle, setYtTitle] = useState('');
  const [ytDesc, setYtDesc] = useState('');
  const [ytLoading, setYtLoading] = useState(false);
  const [ytAdding, setYtAdding] = useState(false);
  const [ytErr, setYtErr] = useState('');
  const [ytOk, setYtOk] = useState('');

  const [pwCur, setPwCur] = useState('');
  // connection test
  const [connTest, setConnTest] = useState(null);
  const [connTesting, setConnTesting] = useState(false);
  const [pwNew, setPwNew] = useState('');
  const [pwCon, setPwCon] = useState('');
  const [pwResult, setPwResult] = useState(null);
  const [pwHash, setPwHash] = useState('');

  // toast
  const [toast, setToast] = useState({ msg:'', type:'' });

  const showToast = useCallback((msg, type='') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg:'', type:'' }), 3500);
  }, []);

  // ── auth check on load ─────────────────
  useEffect(() => {
    fetch('/api/admin/check')
      .then(r => { if (!r.ok) throw new Error('unauth'); setReady(true); })
      .catch(() => router.replace('/admin/login'));
  }, [router]);

  // ── dashboard data ─────────────────────
  const loadDash = useCallback(async () => {
    try {
      const [sumR, medR] = await Promise.all([
        fetch('/api/gallery-summary').then(r => r.json()).catch(() => ({})),
        fetch('/api/admin/media?limit=12').then(r => r.json()).catch(() => ({ items:[] })),
      ]);
      setSummary(sumR);
      setRecent((medR.items || []).slice(0,10));
    } catch {}
  }, []);

  useEffect(() => { if (ready && tab === 'dash') loadDash(); }, [ready, tab, loadDash]);

  // load videos when tab opens
  const loadVideos = useCallback(async () => {
    setYtLoading(true);
    try {
      const d = await fetch('/api/admin/videos?activeOnly=false&limit=20').then(r=>r.json());
      setYtVideos(d.videos || []);
    } catch {}
    setYtLoading(false);
  }, []);
  useEffect(() => { if (ready && tab === 'videos') loadVideos(); }, [ready, tab, loadVideos]);

  // ── manage data ────────────────────────
  const loadManage = useCallback(async () => {
    setMgLoading(true);
    try {
      const url = `/api/admin/media${mgCat!=='all'?`?category=${mgCat}`:''}`;
      const d = await fetch(url).then(r => r.json());
      setMgItems(d.items || []);
    } catch { showToast('Failed to load media', 'err'); }
    setMgLoading(false);
  }, [mgCat, showToast]);

  useEffect(() => { if (ready && tab === 'manage') loadManage(); }, [ready, tab, mgCat, loadManage]);

  // ── upload helpers ─────────────────────
  const addFiles = useCallback((fList) => {
    const arr = Array.from(fList);
    setFiles(prev => [...prev, ...arr]);
    arr.forEach(f => {
      if (f.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => setPreviews(prev => [...prev, { name: f.name, src: e.target.result, isVid: false }]);
        reader.readAsDataURL(f);
      } else {
        setPreviews(prev => [...prev, { name: f.name, src: '', isVid: true }]);
      }
    });
  }, []);

  const removeFile = useCallback((idx) => {
    setFiles(prev => prev.filter((_,i) => i !== idx));
    setPreviews(prev => prev.filter((_,i) => i !== idx));
  }, []);

  const resetUpload = () => {
    setFiles([]); setPreviews([]); setUpState('idle');
    setUpProg(0); setUpMsg(''); setUpCap('');
  };

  const doUpload = async () => {
    if (!upCat) { showToast('Please select a category', 'warn'); return; }
    if (!files.length) { showToast('Please add some files', 'warn'); return; }
    setUpState('uploading'); setUpProg(0);

    const total = files.length;
    let done = 0;
    let uploaded = 0;
    const errs = [];

    // ── STEP 1: Get a signed upload signature from our server ──
    // This is a tiny JSON request — no file bytes, no size limit issues
    let sigData;
    try {
      const sigRes = await fetch('/api/admin/sign-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: upCat }),
      });
      if (!sigRes.ok) {
        const e = await sigRes.json();
        showToast('Auth error: ' + (e.error || 'Could not get upload signature'), 'err');
        setUpState('idle');
        return;
      }
      sigData = await sigRes.json();
    } catch (e) {
      showToast('Network error getting signature: ' + e.message, 'err');
      setUpState('idle');
      return;
    }

    // ── STEP 2: Upload each file DIRECTLY to Cloudinary from browser ──
    // Files go straight to Cloudinary — never touch Vercel — no size limit!
    for (const file of files) {
      setUpMsg(`Uploading ${done + 1} of ${total}: ${file.name}…`);

      const fd = new FormData();
      fd.append('file',      file);
      fd.append('api_key',   sigData.apiKey);
      fd.append('timestamp', String(sigData.timestamp));
      fd.append('signature', sigData.signature);
      fd.append('folder',    sigData.folder);
      // Note: NO transformation here — must match exactly what was signed

      try {
        // Upload directly to Cloudinary's upload endpoint
        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
          { method: 'POST', body: fd }
        );

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok || uploadData.error) {
          errs.push(`${file.name}: ${uploadData.error?.message || 'Cloudinary upload failed'}`);
          done++;
          setUpProg(Math.round((done / total) * 100));
          continue;
        }

        // ── STEP 3: Tell our server to save the result to MongoDB ──
        // Just tiny JSON — no file bytes
        const confirmRes = await fetch('/api/admin/confirm-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            publicId:  uploadData.public_id,
            secureUrl: uploadData.secure_url,
            category:  upCat,
            caption:   upCap.trim() || file.name.replace(/\.[^/.]+$/, ''),
          }),
        });

        if (confirmRes.ok) {
          uploaded++;
        } else {
          const ce = await confirmRes.json();
          errs.push(`${file.name}: saved to Cloudinary but DB error: ${ce.error}`);
        }

      } catch (e) {
        errs.push(`${file.name}: ${e.message}`);
      }

      done++;
      setUpProg(Math.round((done / total) * 100));
    }

    // ── Done ──
    if (errs.length) {
      console.error('[upload errors]', errs);
    }

    if (uploaded === 0) {
      setUpState('idle');
      setUpMsg('');
      const firstErr = errs[0] || 'Unknown error';
      showToast('Upload failed: ' + firstErr, 'err');
    } else {
      setUpState('done');
      setUpMsg(`${uploaded} photo${uploaded!==1?'s':''} uploaded to "${CATS[upCat]}" — now live on the website!`);
      showToast(`✅ ${uploaded} photo${uploaded!==1?'s':''} uploaded!`, 'ok');
      loadDash();
    }
  };

  // ── manage actions ─────────────────────
  const filtered = mgItems.filter(i => {
    if (mgType !== 'all' && i.type !== mgType) return false;
    if (mgQ && !(i.cap||'').toLowerCase().includes(mgQ.toLowerCase())) return false;
    return true;
  });

  const toggleSel = (id) => setSelected(prev => {
    const s = new Set(prev);
    s.has(id) ? s.delete(id) : s.add(id);
    return s;
  });

  const deleteOne = async (id) => {
    if (!confirm('Delete this item permanently?')) return;
    await fetch('/api/admin/media', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) });
    showToast('Deleted', 'ok');
    loadManage(); loadDash();
  };

  const bulkDelete = async () => {
    const ids = [...selected];
    if (!ids.length || !confirm(`Delete ${ids.length} items permanently?`)) return;
    await fetch('/api/admin/bulk-delete', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ids }) });
    setSelected(new Set());
    showToast(`${ids.length} items deleted`, 'ok');
    loadManage(); loadDash();
  };

  const openEdit = (item) => {
    setEditItem(item);
    setEditCap(item.cap || '');
    setEditCat(item.category);
  };

  const saveEdit = async () => {
    await fetch('/api/admin/media', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: editItem._id, caption: editCap, category: editCat }) });
    setEditItem(null);
    showToast('Saved', 'ok');
    loadManage();
  };

  // ── change password ────────────────────
  const changePassword = async () => {
    setPwResult(null); setPwHash('');
    if (pwNew !== pwCon) { setPwResult({ ok:false, msg:'Passwords do not match.' }); return; }
    if (pwNew.length < 8) { setPwResult({ ok:false, msg:'Password must be at least 8 characters.' }); return; }
    try {
      const r = await fetch('/api/admin/change-password', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ currentPassword: pwCur, newPassword: pwNew }) });
      const d = await r.json();
      if (r.ok) {
        setPwResult({ ok:true, msg:'New password hash generated.' });
        setPwHash(d.newHash);
        setPwCur(''); setPwNew(''); setPwCon('');
      } else {
        setPwResult({ ok:false, msg: d.error || 'Failed.' });
      }
    } catch { setPwResult({ ok:false, msg:'Connection error.' }); }
  };

  const logout = async () => {
    await fetch('/api/admin/logout', { method:'POST' });
    router.push('/admin/login');
  };

  if (!ready) return (
    <div style={{background:'#0F0A09',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:36,height:36,border:'3px solid rgba(200,85,106,.3)',borderTopColor:'#C8556A',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const totalMedia = Object.values(summary).reduce((a,b)=>a+b,0);
  const maxCat = Math.max(...Object.values(summary), 1);

  return (
    <>
      <Head>
        <title>WSE Admin Panel</title>
        <meta name="robots" content="noindex,nofollow" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Outfit',system-ui,sans-serif;background:${C.dark};color:#E8E0DE;overflow-x:hidden;min-height:100vh}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fup{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:${C.panel}}::-webkit-scrollbar-thumb{background:${C.rose};border-radius:3px}
        input::placeholder,textarea::placeholder{color:${C.gray}}
        input:focus,select:focus,textarea:focus{border-color:${C.rose} !important;background:rgba(255,255,255,.08) !important}
        .mgc:hover{transform:translateY(-2px)}
        .mgc:hover .mgov,.mgc.sel .mgov{opacity:1 !important}
        .sb-link:hover{background:rgba(255,255,255,.05);color:#fff !important}
        .sb-link.on{background:rgba(200,85,106,.14);color:${C.rose} !important}
        .qc:hover{border-color:${C.rose} !important;color:${C.rose} !important}
        @media(max-width:900px){.sidebar{display:none!important}}
      `}</style>

      <div style={{display:'flex',minHeight:'100vh'}}>

        {/* ── SIDEBAR ── */}
        <aside className="sidebar" style={{width:218,flexShrink:0,background:C.panel,borderRight:`1px solid ${C.border}`,display:'flex',flexDirection:'column',position:'sticky',top:0,height:'100vh',overflowY:'auto'}}>
          <div style={{padding:'1.2rem 1rem .85rem',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',gap:'.6rem'}}>
            <div style={{width:30,height:30,background:C.rose,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.95rem',flexShrink:0}}>W</div>
            <div>
              <div style={{fontSize:'.79rem',fontWeight:600,color:'#fff',lineHeight:1.3}}>WSE Admin</div>
              <div style={{fontSize:'.6rem',color:C.gray}}>Control Panel</div>
            </div>
          </div>

          <div style={{padding:'.8rem .85rem .25rem',fontSize:'.58rem',letterSpacing:'.18em',textTransform:'uppercase',color:C.gray,fontWeight:600}}>Main</div>
          {[['dash','📊','Dashboard'],['upload','⬆','Upload Media'],['manage','🗂','Manage Gallery'],['videos','▶','YouTube Videos'],['settings','⚙','Settings']].map(([id,ic,lbl]) => (
            <div key={id} style={{padding:'0 .55rem'}}>
              <a className={`sb-link${tab===id?' on':''}`} onClick={()=>setTab(id)} style={{display:'flex',alignItems:'center',gap:'.6rem',padding:'.56rem .7rem',fontSize:'.79rem',fontWeight:500,color:C.gray,borderRadius:7,cursor:'pointer',transition:'all .18s'}}>
                <span style={{width:17,textAlign:'center',fontSize:'.88rem'}}>{ic}</span>{lbl}
              </a>
            </div>
          ))}

          <div style={{padding:'.8rem .85rem .25rem',fontSize:'.58rem',letterSpacing:'.18em',textTransform:'uppercase',color:C.gray,fontWeight:600,marginTop:'.4rem'}}>Categories</div>
          {CAT_OPTS.map(([slug, name]) => (
            <div key={slug} style={{padding:'0 .55rem'}}>
              <a className="sb-link" onClick={()=>{ setUpCat(slug); setTab('upload'); }} style={{display:'flex',alignItems:'center',gap:'.6rem',padding:'.5rem .7rem',fontSize:'.77rem',fontWeight:500,color:C.gray,borderRadius:7,cursor:'pointer',transition:'all .18s'}}>
                <span style={{width:17,textAlign:'center',fontSize:'.82rem'}}>📂</span>
                <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{name.split(' / ')[0]}</span>
                {summary[slug]>0 && <span style={{background:C.rose,color:'#fff',fontSize:'.58rem',fontWeight:700,padding:'.1rem .38rem',borderRadius:100,flexShrink:0}}>{summary[slug]}</span>}
              </a>
            </div>
          ))}

          <div style={{marginTop:'auto',padding:'.85rem .9rem',borderTop:`1px solid ${C.border}`}}>
            <div style={{display:'flex',alignItems:'center',gap:'.6rem',marginBottom:'.65rem'}}>
              <div style={{width:26,height:26,borderRadius:'50%',background:C.rose,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.72rem',fontWeight:700,color:'#fff',flexShrink:0}}>A</div>
              <div>
                <div style={{fontSize:'.77rem',fontWeight:500,color:'#fff'}}>Administrator</div>
                <div style={{fontSize:'.61rem',color:C.gray}}>Full Access</div>
              </div>
            </div>
            <button onClick={logout} style={{width:'100%',padding:'.5rem',background:C.redBg,border:`1px solid rgba(239,68,68,.18)`,color:'#FCA5A5',fontSize:'.74rem',fontWeight:500,borderRadius:7,cursor:'pointer',transition:'all .2s',fontFamily:"'Outfit',system-ui"}}>🚪 Sign Out</button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0}}>
          {/* topbar */}
          <div style={{background:C.panel,borderBottom:`1px solid ${C.border}`,padding:'0 1.8rem',height:55,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100,flexShrink:0}}>
            <div>
              <h2 style={{fontSize:'.97rem',fontWeight:600,color:'#fff'}}>{{dash:'Dashboard',upload:'Upload Media',manage:'Manage Gallery',videos:'YouTube Videos',settings:'Settings'}[tab]}</h2>
              <p style={{fontSize:'.68rem',color:C.gray}}>{{dash:'Overview of your gallery',upload:'Add photos &amp; videos',manage:'View, edit and delete media',videos:'Add &amp; manage YouTube video embeds',settings:'Password &amp; system info'}[tab]}</p>
            </div>
            <a href="/" target="_blank" style={{display:'flex',alignItems:'center',gap:'.3rem',padding:'.38rem .85rem',background:'rgba(255,255,255,.05)',border:`1px solid ${C.border}`,color:C.grayLt,fontSize:'.72rem',fontWeight:500,borderRadius:7,transition:'all .2s',textDecoration:'none',cursor:'pointer'}}>🌐 View Website</a>
          </div>

          <div style={{padding:'1.8rem',flex:1,overflowY:'auto'}}>

            {/* ════ DASHBOARD ════ */}
            {tab === 'dash' && (
              <div style={{animation:'fup .4s ease'}}>
                {/* stats */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'.9rem',marginBottom:'1.6rem'}}>
                  {[['Total Media',totalMedia,'🖼','rgba(200,85,106,.14)','Photos & videos'],['Photos',Object.values(summary).reduce((a,b)=>a+b,0),'📷',C.blueBg,'Uploaded images'],['Videos',0,'🎬',C.amberBg,'Video clips'],['Categories',8,'📂',C.greenBg,'Gallery sections']].map(([l,n,ic,bg,sub])=>(
                    <div key={l} style={{...card,padding:'1.1rem 1.3rem'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'.65rem'}}>
                        <div style={{fontSize:'.65rem',letterSpacing:'.12em',textTransform:'uppercase',color:C.gray,fontWeight:500}}>{l}</div>
                        <div style={{width:32,height:32,borderRadius:7,background:bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.95rem'}}>{ic}</div>
                      </div>
                      <div style={{fontSize:'1.9rem',fontWeight:700,color:'#fff',lineHeight:1,marginBottom:'.18rem'}}>{n}</div>
                      <div style={{fontSize:'.7rem',color:C.gray}}>{sub}</div>
                    </div>
                  ))}
                </div>

                <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr',gap:'1.3rem'}}>
                  {/* recent */}
                  <div style={{...card,padding:'1.3rem'}}>
                    <h3 style={{fontSize:'.8rem',fontWeight:600,color:'#fff',marginBottom:'1rem'}}>Recent Uploads</h3>
                    <div style={{overflowX:'auto'}}>
                      <table style={{width:'100%',borderCollapse:'collapse'}}>
                        <thead><tr>{['Preview','Caption','Category','Date'].map(h=><th key={h} style={{fontSize:'.6rem',letterSpacing:'.12em',textTransform:'uppercase',color:C.gray,padding:'.45rem .55rem',textAlign:'left',borderBottom:`1px solid ${C.border}`}}>{h}</th>)}</tr></thead>
                        <tbody>
                          {recent.length===0
                            ? <tr><td colSpan={4} style={{textAlign:'center',padding:'2rem',color:C.gray,fontSize:'.8rem'}}>No uploads yet</td></tr>
                            : recent.map(i=>(
                              <tr key={i._id}>
                                <td style={{padding:'.65rem .55rem',borderBottom:`1px solid rgba(255,255,255,.025)`}}>
                                  {i.type==='video'
                                    ? <div style={{width:38,height:38,borderRadius:6,background:C.amberBg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem'}}>🎬</div>
                                    : <img src={i.thumb||i.url} alt="" style={{width:38,height:38,borderRadius:6,objectFit:'cover',display:'block'}}/>
                                  }
                                </td>
                                <td style={{padding:'.65rem .55rem',borderBottom:`1px solid rgba(255,255,255,.025)`}}>
                                  <div style={{fontSize:'.8rem',color:'#E8E0DE',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{i.cap||'No caption'}</div>
                                </td>
                                <td style={{padding:'.65rem .55rem',borderBottom:`1px solid rgba(255,255,255,.025)`}}>
                                  <span style={{display:'inline-block',padding:'.13rem .5rem',borderRadius:100,fontSize:'.63rem',fontWeight:500,background:'rgba(200,85,106,.14)',color:C.rose}}>{CATS[i.category]?.split(' / ')[0]}</span>
                                </td>
                                <td style={{padding:'.65rem .55rem',borderBottom:`1px solid rgba(255,255,255,.025)`,fontSize:'.72rem',color:C.gray}}>{i.createdAt?.split('T')[0]}</td>
                              </tr>
                            ))
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* category bars */}
                  <div style={{...card,padding:'1.3rem'}}>
                    <h3 style={{fontSize:'.8rem',fontWeight:600,color:'#fff',marginBottom:'1.1rem'}}>Media by Category</h3>
                    <div style={{display:'flex',flexDirection:'column',gap:'.8rem'}}>
                      {CAT_OPTS.map(([slug,name])=>{
                        const n=summary[slug]||0;
                        const pct=Math.round((n/maxCat)*100);
                        return (
                          <div key={slug} style={{cursor:'pointer'}} onClick={()=>{setUpCat(slug);setTab('upload')}}>
                            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'.25rem'}}>
                              <span style={{fontSize:'.76rem',color:'#E8E0DE',fontWeight:500}}>{name.split(' / ')[0]}</span>
                              <span style={{fontSize:'.7rem',color:C.gray}}>{n}</span>
                            </div>
                            <div style={{background:'rgba(255,255,255,.06)',borderRadius:100,height:5,overflow:'hidden'}}>
                              <div style={{height:'100%',background:`linear-gradient(90deg,${C.rose},${C.gold})`,borderRadius:100,width:`${pct}%`,transition:'width .6s ease'}}/>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ════ UPLOAD ════ */}
            {tab === 'upload' && (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.3rem',alignItems:'start',animation:'fup .4s ease'}}>
                <div style={{...card,padding:'1.5rem'}}>
                  <h3 style={{fontSize:'.88rem',fontWeight:600,color:'#fff',marginBottom:'1.2rem',paddingBottom:'.7rem',borderBottom:`1px solid ${C.border}`}}>📤 Upload Photos & Videos</h3>

                  <div style={{marginBottom:'1rem'}}>
                    <label style={label}>Category *</label>
                    <select value={upCat} onChange={e=>setUpCat(e.target.value)} style={inp} disabled={upState==='uploading'}>
                      <option value="">— Select category —</option>
                      {CAT_OPTS.map(([s,n])=><option key={s} value={s}>{n}</option>)}
                    </select>
                  </div>

                  <div style={{marginBottom:'1rem'}}>
                    <label style={label}>Caption (optional)</label>
                    <input type="text" value={upCap} onChange={e=>setUpCap(e.target.value)} placeholder="e.g. Princess theme — Parramatta 2025" style={inp} disabled={upState==='uploading'}/>
                  </div>

                  {/* drop zone */}
                  {upState !== 'done' && (
                    <div
                      onDragOver={e=>{e.preventDefault();setDragOver(true)}}
                      onDragLeave={()=>setDragOver(false)}
                      onDrop={e=>{e.preventDefault();setDragOver(false);addFiles(e.dataTransfer.files)}}
                      onClick={()=>fileRef.current?.click()}
                      style={{border:`2px dashed ${dragOver?C.rose:'rgba(200,85,106,.3)'}`,borderRadius:10,padding:'2rem 1.5rem',textAlign:'center',cursor:'pointer',background:dragOver?'rgba(200,85,106,.08)':'rgba(200,85,106,.03)',transition:'all .22s',marginBottom:'1rem'}}
                    >
                      <input ref={fileRef} type="file" multiple accept="image/*,video/*" style={{display:'none'}} onChange={e=>addFiles(e.target.files)}/>
                      <div style={{fontSize:'2rem',marginBottom:'.5rem'}}>📁</div>
                      <h4 style={{fontSize:'.88rem',fontWeight:600,color:'#fff',marginBottom:'.25rem'}}>Drop files here or click to browse</h4>
                      <p style={{fontSize:'.77rem',color:C.gray,lineHeight:1.6}}>Photos: JPG, PNG, WEBP, GIF<br/>Videos: MP4, MOV, WEBM</p>
                      <small style={{fontSize:'.68rem',color:'rgba(255,255,255,.2)',display:'block',marginTop:'.35rem'}}>Max 20 files · Photos up to 20MB · Videos up to 200MB</small>
                    </div>
                  )}

                  {/* previews */}
                  {previews.length > 0 && upState !== 'done' && (
                    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:'.8rem'}}>
                      {previews.map((pv,i) => (
                        <div key={i} style={{aspectRatio:'1',borderRadius:7,overflow:'hidden',position:'relative',background:C.panel}}>
                          {pv.isVid
                            ? <div style={{position:'absolute',inset:0,background:C.amberBg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.6rem'}}>🎬</div>
                            : <img src={pv.src} alt={pv.name} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/>
                          }
                          <button onClick={()=>removeFile(i)} style={{position:'absolute',top:2,right:2,width:18,height:18,borderRadius:'50%',background:'rgba(239,68,68,.88)',color:'#fff',border:'none',cursor:'pointer',fontSize:'.58rem',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Outfit',system-ui"}}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {previews.length > 0 && upState !== 'done' && (
                    <p style={{fontSize:'.72rem',color:C.gray,marginBottom:'.8rem',textAlign:'center'}}>{previews.length} file{previews.length!==1?'s':''} selected</p>
                  )}

                  {/* progress */}
                  {upState === 'uploading' && (
                    <div style={{marginBottom:'.9rem'}}>
                      <div style={{background:'rgba(255,255,255,.07)',borderRadius:100,height:7,overflow:'hidden'}}>
                        <div style={{height:'100%',background:`linear-gradient(90deg,${C.rose},${C.gold})`,borderRadius:100,width:`${upProg}%`,transition:'width .25s ease'}}/>
                      </div>
                      <p style={{fontSize:'.72rem',color:C.gray,marginTop:'.4rem',textAlign:'center'}}>{upMsg}</p>
                    </div>
                  )}

                  {/* success */}
                  {upState === 'done' && (
                    <div style={{textAlign:'center',padding:'1.8rem',background:C.greenBg,border:'1px solid rgba(34,197,94,.2)',borderRadius:9,marginBottom:'.9rem'}}>
                      <div style={{fontSize:'2rem',marginBottom:'.5rem'}}>🎉</div>
                      <h3 style={{fontSize:'.98rem',fontWeight:600,color:C.green,marginBottom:'.25rem'}}>Upload Complete!</h3>
                      <p style={{fontSize:'.8rem',color:'rgba(255,255,255,.45)'}}>{upMsg}</p>
                    </div>
                  )}

                  {upState === 'done'
                    ? <button onClick={resetUpload} style={{width:'100%',padding:'.75rem',background:'rgba(255,255,255,.08)',border:`1px solid ${C.border}`,color:'#E8E0DE',fontSize:'.87rem',fontWeight:500,borderRadius:8,cursor:'pointer',fontFamily:"'Outfit',system-ui"}}>Upload More →</button>
                    : <button onClick={doUpload} disabled={upState==='uploading'||!files.length||!upCat}
                        style={{width:'100%',padding:'.78rem',background:(!files.length||!upCat||upState==='uploading')?'rgba(255,255,255,.09)':C.rose,color:(!files.length||!upCat||upState==='uploading')?C.gray:'#fff',fontSize:'.87rem',fontWeight:600,borderRadius:8,border:'none',cursor:(!files.length||!upCat||upState==='uploading')?'not-allowed':'pointer',fontFamily:"'Outfit',system-ui",display:'flex',alignItems:'center',justifyContent:'center',gap:'.4rem',transition:'all .22s'}}>
                        {upState==='uploading'
                          ? <><div style={{width:14,height:14,border:'2px solid rgba(255,255,255,.25)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .6s linear infinite'}}/>Uploading…</>
                          : '⬆ Upload to Website'}
                      </button>
                  }
                </div>

                {/* tips */}
                <div style={{...card,padding:'1.4rem'}}>
                  <h3 style={{fontSize:'.85rem',fontWeight:600,color:'#fff',marginBottom:'.9rem',paddingBottom:'.7rem',borderBottom:`1px solid ${C.border}`}}>📌 How It Works</h3>
                  {[
                    [C.blueBg,'1️⃣','Select Category','Choose which gallery page the media will appear on.'],
                    [C.amberBg,'2️⃣','Drop Your Files','Any size, any orientation — portrait, landscape or square. Cloudinary auto-processes everything perfectly.'],
                    [C.greenBg,'3️⃣','Upload & Go Live','Files are stored on Cloudinary CDN and appear instantly in the gallery — fast worldwide.'],
                  ].map(([bg,ic,h,p])=>(
                    <div key={h} style={{display:'flex',alignItems:'flex-start',gap:'.65rem',marginBottom:'.85rem'}}>
                      <div style={{width:27,height:27,borderRadius:7,background:bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.88rem',flexShrink:0}}>{ic}</div>
                      <div>
                        <h4 style={{fontSize:'.79rem',fontWeight:600,color:'#E8E0DE',marginBottom:'.18rem'}}>{h}</h4>
                        <p style={{fontSize:'.73rem',color:C.gray,lineHeight:1.6}}>{p}</p>
                      </div>
                    </div>
                  ))}
                  <div style={{height:1,background:C.border,margin:'.9rem 0'}}/>
                  {[
                    ['rgba(200,85,106,.14)','✅','Always Looks Perfect','All photos auto-cropped to uniform squares on the website. No distortion regardless of original size.'],
                    [C.amberBg,'🎬','Videos Supported','Upload MP4 or MOV — plays on hover in gallery with ▶ badge.'],
                    [C.greenBg,'⚡','CDN Delivery','Cloudinary serves images from 200+ global locations. Your website loads fast everywhere.'],
                  ].map(([bg,ic,h,p])=>(
                    <div key={h} style={{display:'flex',alignItems:'flex-start',gap:'.65rem',marginBottom:'.8rem'}}>
                      <div style={{width:27,height:27,borderRadius:7,background:bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.88rem',flexShrink:0}}>{ic}</div>
                      <div>
                        <h4 style={{fontSize:'.79rem',fontWeight:600,color:'#E8E0DE',marginBottom:'.18rem'}}>{h}</h4>
                        <p style={{fontSize:'.73rem',color:C.gray,lineHeight:1.6}}>{p}</p>
                      </div>
                    </div>
                  ))}
                  <div style={{height:1,background:C.border,margin:'.9rem 0'}}/>
                  <div style={{fontSize:'.67rem',letterSpacing:'.12em',textTransform:'uppercase',color:C.gray,fontWeight:600,marginBottom:'.55rem'}}>Quick Upload To</div>
                  {CAT_OPTS.map(([slug,name])=>(
                    <button key={slug} className="qc" onClick={()=>setUpCat(slug)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'.45rem .75rem',background:'rgba(255,255,255,.04)',border:`1px solid ${C.border}`,borderRadius:7,color:C.grayLt,fontSize:'.76rem',cursor:'pointer',transition:'all .18s',width:'100%',marginBottom:4,fontFamily:"'Outfit',system-ui"}}>
                      <span>{name.split(' / ')[0]}</span><span>→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ════ MANAGE ════ */}
            {tab === 'manage' && (
              <div style={{animation:'fup .4s ease'}}>
                <div style={{display:'flex',alignItems:'center',gap:'.7rem',marginBottom:'1.2rem',flexWrap:'wrap'}}>
                  <input className="mg-search" value={mgQ} onChange={e=>setMgQ(e.target.value)} type="text" placeholder="🔍  Search captions…" style={{...inp,flex:1,minWidth:160,background:C.card}}/>
                  <select value={mgCat} onChange={e=>{setMgCat(e.target.value);setSelected(new Set())}} style={{...inp,width:'auto',background:C.card}}>
                    <option value="all">All Categories</option>
                    {CAT_OPTS.map(([s,n])=><option key={s} value={s}>{n}</option>)}
                  </select>
                  <select value={mgType} onChange={e=>setMgType(e.target.value)} style={{...inp,width:'auto',background:C.card}}>
                    <option value="all">All Types</option>
                    <option value="img">Photos</option>
                    <option value="video">Videos</option>
                  </select>
                  {selected.size > 0 && (
                    <button onClick={bulkDelete} style={{padding:'.58rem 1rem',background:C.redBg,border:`1px solid rgba(239,68,68,.22)`,color:'#FCA5A5',fontSize:'.76rem',fontWeight:500,borderRadius:8,cursor:'pointer',display:'flex',alignItems:'center',gap:'.35rem',fontFamily:"'Outfit',system-ui"}}>
                      🗑 Delete Selected ({selected.size})
                    </button>
                  )}
                </div>

                <p style={{fontSize:'.76rem',color:C.gray,marginBottom:'.75rem'}}><strong style={{color:'#fff'}}>{filtered.length}</strong> item{filtered.length!==1?'s':''} found</p>

                {mgLoading ? (
                  <div style={{display:'flex',justifyContent:'center',padding:'3rem'}}><div style={{width:28,height:28,border:`3px solid rgba(200,85,106,.3)`,borderTopColor:C.rose,borderRadius:'50%',animation:'spin .7s linear infinite'}}/></div>
                ) : filtered.length === 0 ? (
                  <div style={{textAlign:'center',padding:'4rem 1.5rem',color:C.gray}}>
                    <div style={{fontSize:'2.5rem',opacity:.25,marginBottom:'.8rem'}}>📷</div>
                    <h3 style={{fontSize:'1.1rem',color:'rgba(255,255,255,.35)',marginBottom:'.35rem'}}>No media found</h3>
                    <p style={{fontSize:'.8rem'}}>Upload photos or videos using the Upload panel.</p>
                  </div>
                ) : (
                  <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:7}}>
                    {filtered.map(item => (
                      <div key={item._id} className={`mgc${selected.has(item._id)?' sel':''}`}
                        style={{aspectRatio:'1',borderRadius:8,overflow:'hidden',position:'relative',background:C.card,cursor:'pointer',border:`2px solid ${selected.has(item._id)?C.rose:'transparent'}`,transition:'border-color .18s,transform .18s'}}
                        onClick={()=>toggleSel(item._id)}
                      >
                        <div style={{position:'absolute',inset:0}}>
                          {item.type==='video'
                            ? <div style={{position:'absolute',inset:0,background:C.amberBg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2rem'}}>🎬</div>
                            : <img src={item.thumb||item.url} alt={item.cap||''} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}} loading="lazy"/>
                          }
                        </div>
                        {item.type==='video' && <div style={{position:'absolute',top:4,left:4,background:'rgba(0,0,0,.65)',color:'#FCD34D',fontSize:'.57rem',padding:'.12rem .38rem',borderRadius:4}}>▶</div>}
                        <div className="mgov" style={{position:'absolute',inset:0,background:'rgba(0,0,0,.52)',opacity:0,transition:'opacity .18s',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'.38rem'}}>
                          <div style={{display:'flex',gap:'.35rem'}}>
                            <button onClick={e=>{e.stopPropagation();openEdit(item)}} style={{width:28,height:28,borderRadius:'50%',border:'1px solid rgba(255,255,255,.22)',background:'rgba(0,0,0,.3)',color:'#fff',cursor:'pointer',fontSize:'.7rem',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .18s',fontFamily:"'Outfit',system-ui"}} title="Edit">✏</button>
                            <button onClick={e=>{e.stopPropagation();deleteOne(item._id)}} style={{width:28,height:28,borderRadius:'50%',border:'1px solid rgba(239,68,68,.4)',background:'rgba(239,68,68,.2)',color:'#FCA5A5',cursor:'pointer',fontSize:'.7rem',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .18s',fontFamily:"'Outfit',system-ui"}} title="Delete">🗑</button>
                          </div>
                          <div style={{fontSize:'.58rem',color:'rgba(255,255,255,.55)',maxWidth:'88%',textAlign:'center',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.cap||'No caption'}</div>
                        </div>
                        {selected.has(item._id) && (
                          <div style={{position:'absolute',top:4,right:4,width:17,height:17,borderRadius:'50%',background:C.rose,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'.58rem'}}>✓</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ════ SETTINGS ════ */}

            {/* ════ YOUTUBE VIDEOS ════ */}
            {tab === 'videos' && (
              <div style={{animation:'fup .4s ease'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.3rem',alignItems:'start',marginBottom:'2rem'}}>

                  {/* ── ADD VIDEO FORM ── */}
                  <div style={{...card,padding:'1.5rem'}}>
                    <h3 style={{fontSize:'.88rem',fontWeight:600,color:'#fff',marginBottom:'1.2rem',paddingBottom:'.7rem',borderBottom:`1px solid ${C.border}`}}>▶ Add YouTube Video</h3>

                    {ytErr && <div style={{background:C.redBg,border:`1px solid rgba(239,68,68,.2)`,color:'#FCA5A5',fontSize:'.79rem',padding:'.6rem .9rem',borderRadius:8,marginBottom:'1rem'}}>⚠ {ytErr}</div>}
                    {ytOk  && <div style={{background:C.greenBg,border:`1px solid rgba(34,197,94,.2)`,color:C.green,fontSize:'.79rem',padding:'.6rem .9rem',borderRadius:8,marginBottom:'1rem'}}>✅ {ytOk}</div>}

                    <div style={{marginBottom:'1rem'}}>
                      <label style={label}>YouTube URL *</label>
                      <input type="url" value={ytUrl} onChange={e=>setYtUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..." style={inp}/>
                      <p style={{fontSize:'.7rem',color:C.gray,marginTop:'.35rem'}}>Supports youtube.com/watch, youtu.be, Shorts, and embed links</p>
                    </div>

                    <div style={{marginBottom:'1rem'}}>
                      <label style={label}>Video Title (optional)</label>
                      <input type="text" value={ytTitle} onChange={e=>setYtTitle(e.target.value)}
                        placeholder="e.g. Priya's Wedding Reception Highlights" style={inp}/>
                    </div>

                    <div style={{marginBottom:'1.2rem'}}>
                      <label style={label}>Short Description (optional)</label>
                      <textarea value={ytDesc} onChange={e=>setYtDesc(e.target.value)} rows={2}
                        placeholder="e.g. Grand reception at Parramatta — April 2025"
                        style={{...inp,resize:'vertical',minHeight:70}}/>
                    </div>

                    <button
                      disabled={ytAdding || !ytUrl.trim()}
                      onClick={async () => {
                        setYtErr(''); setYtOk(''); setYtAdding(true);
                        try {
                          const r = await fetch('/api/admin/videos', {
                            method:'POST',
                            headers:{'Content-Type':'application/json'},
                            body: JSON.stringify({ youtubeUrl:ytUrl, title:ytTitle, description:ytDesc })
                          });
                          const d = await r.json();
                          if (r.ok) {
                            setYtOk('Video added! It will appear in the Latest Videos section on the website.');
                            setYtUrl(''); setYtTitle(''); setYtDesc('');
                            loadVideos();
                          } else { setYtErr(d.error || 'Failed to add video.'); }
                        } catch { setYtErr('Connection error. Try again.'); }
                        setYtAdding(false);
                      }}
                      style={{width:'100%',padding:'.78rem',background:(!ytUrl.trim()||ytAdding)?'rgba(255,255,255,.09)':C.rose,color:(!ytUrl.trim()||ytAdding)?C.gray:'#fff',fontSize:'.87rem',fontWeight:600,borderRadius:8,border:'none',cursor:(!ytUrl.trim()||ytAdding)?'not-allowed':'pointer',fontFamily:"'Outfit',system-ui",display:'flex',alignItems:'center',justifyContent:'center',gap:'.4rem',transition:'all .22s'}}>
                      {ytAdding ? <><div style={{width:14,height:14,border:`2px solid rgba(255,255,255,.25)`,borderTopColor:'#fff',borderRadius:'50%',animation:'spin .6s linear infinite'}}/> Adding…</> : '+ Add Video to Website'}
                    </button>
                  </div>

                  {/* ── TIPS ── */}
                  <div style={{...card,padding:'1.4rem'}}>
                    <h3 style={{fontSize:'.85rem',fontWeight:600,color:'#fff',marginBottom:'.9rem',paddingBottom:'.7rem',borderBottom:`1px solid ${C.border}`}}>📌 How Videos Work</h3>
                    {[
                      [C.blueBg,'1️⃣','Upload to YouTube First','Upload your event video to your YouTube channel. Set it to Public or Unlisted (Unlisted = only people with the link can see it, won\'t appear in search).'],
                      [C.amberBg,'2️⃣','Copy the Link','From YouTube, copy the video link from your browser address bar.'],
                      [C.greenBg,'3️⃣','Paste & Add Here','Paste the link above, add a title and click Add. It instantly appears on your website.'],
                      ['rgba(200,85,106,.14)','✅','No Size Limit','Because videos are hosted on YouTube, there\'s no file size limit. Upload full HD videos freely.'],
                      [C.greenBg,'🆓','100% Free','YouTube hosting is completely free. No Cloudinary credits used for videos.'],
                      [C.amberBg,'📱','Works on All Devices','YouTube embeds are fully responsive — looks perfect on mobile, tablet and desktop.'],
                    ].map(([bg,ic,h,p])=>(
                      <div key={h} style={{display:'flex',alignItems:'flex-start',gap:'.65rem',marginBottom:'.8rem'}}>
                        <div style={{width:27,height:27,borderRadius:7,background:bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.88rem',flexShrink:0}}>{ic}</div>
                        <div><h4 style={{fontSize:'.79rem',fontWeight:600,color:'#E8E0DE',marginBottom:'.15rem'}}>{h}</h4><p style={{fontSize:'.72rem',color:C.gray,lineHeight:1.6}}>{p}</p></div>
                      </div>
                    ))}
                    <div style={{marginTop:'.5rem',padding:'.8rem',background:'rgba(59,130,246,.07)',border:`1px solid rgba(59,130,246,.15)`,borderRadius:8}}>
                      <p style={{fontSize:'.75rem',color:'#93C5FD',lineHeight:1.65}}>💡 <strong>Tip:</strong> The website shows your latest <strong>3–4 videos</strong> automatically. Add as many as you like — only the most recent active ones show. Toggle any video off using the Hide button below.</p>
                    </div>
                  </div>
                </div>

                {/* ── VIDEO LIST ── */}
                <div style={{...card,padding:'1.4rem'}}>
                  <h3 style={{fontSize:'.88rem',fontWeight:600,color:'#fff',marginBottom:'1.2rem',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    Your Videos
                    <span style={{fontSize:'.72rem',color:C.gray,fontWeight:400}}>{ytVideos.length} total · {ytVideos.filter(v=>v.active).length} showing on site</span>
                  </h3>
                  {ytLoading ? (
                    <div style={{display:'flex',justifyContent:'center',padding:'3rem'}}>
                      <div style={{width:28,height:28,border:`3px solid rgba(200,85,106,.3)`,borderTopColor:C.rose,borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
                    </div>
                  ) : ytVideos.length === 0 ? (
                    <div style={{textAlign:'center',padding:'3rem',color:C.gray}}>
                      <div style={{fontSize:'2.5rem',opacity:.25,marginBottom:'.8rem'}}>▶</div>
                      <h3 style={{fontSize:'1.05rem',color:'rgba(255,255,255,.35)',marginBottom:'.35rem'}}>No videos yet</h3>
                      <p style={{fontSize:'.8rem'}}>Add your first YouTube video using the form above.</p>
                    </div>
                  ) : (
                    <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                      {ytVideos.map((v, idx) => (
                        <div key={v._id} style={{display:'flex',gap:'1rem',alignItems:'flex-start',padding:'1rem',background:'rgba(255,255,255,.03)',borderRadius:9,border:`1px solid ${v.active?'rgba(200,85,106,.2)':C.border}`}}>
                          {/* thumbnail */}
                          <div style={{width:120,flexShrink:0,borderRadius:7,overflow:'hidden',aspectRatio:'16/9',background:'#000',position:'relative'}}>
                            <img src={`https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`} alt={v.title||'video'} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                            {!v.active && <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.68rem',color:'rgba(255,255,255,.5)',letterSpacing:'.1em',textTransform:'uppercase'}}>Hidden</div>}
                          </div>
                          {/* info */}
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:'flex',alignItems:'center',gap:'.6rem',marginBottom:'.3rem',flexWrap:'wrap'}}>
                              <span style={{fontSize:'.85rem',fontWeight:600,color:'#E8E0DE',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:280}}>{v.title || 'Untitled video'}</span>
                              <span style={{display:'inline-block',padding:'.12rem .5rem',borderRadius:100,fontSize:'.62rem',fontWeight:600,background:v.active?C.greenBg:'rgba(255,255,255,.06)',color:v.active?C.green:C.gray,border:`1px solid ${v.active?'rgba(34,197,94,.25)':C.border}`,whiteSpace:'nowrap'}}>{v.active ? '● Showing on site' : '○ Hidden'}</span>
                            </div>
                            {v.description && <p style={{fontSize:'.78rem',color:C.gray,lineHeight:1.55,marginBottom:'.4rem',overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{v.description}</p>}
                            <a href={`https://www.youtube.com/watch?v=${v.youtubeId}`} target="_blank" rel="noopener noreferrer"
                              style={{fontSize:'.7rem',color:C.rose,textDecoration:'none',display:'inline-flex',alignItems:'center',gap:'.25rem'}}>
                              youtu.be/{v.youtubeId} ↗
                            </a>
                          </div>
                          {/* actions */}
                          <div style={{display:'flex',flexDirection:'column',gap:'.45rem',flexShrink:0}}>
                            <button
                              onClick={async ()=>{
                                await fetch('/api/admin/videos',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:v._id,active:!v.active})});
                                loadVideos(); showToast(v.active?'Video hidden':'Video now showing on site','ok');
                              }}
                              style={{padding:'.42rem .85rem',background:v.active?'rgba(245,158,11,.1)':'rgba(34,197,94,.1)',border:`1px solid ${v.active?'rgba(245,158,11,.25)':'rgba(34,197,94,.25)'}`,color:v.active?C.amber:C.green,fontSize:'.72rem',fontWeight:500,borderRadius:7,cursor:'pointer',fontFamily:"'Outfit',system-ui",whiteSpace:'nowrap'}}>
                              {v.active ? 'Hide' : 'Show'}
                            </button>
                            <button
                              onClick={async ()=>{
                                if(!confirm('Remove this video from the website?'))return;
                                await fetch('/api/admin/videos',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:v._id})});
                                loadVideos(); showToast('Video removed','ok');
                              }}
                              style={{padding:'.42rem .85rem',background:C.redBg,border:`1px solid rgba(239,68,68,.22)`,color:'#FCA5A5',fontSize:'.72rem',fontWeight:500,borderRadius:7,cursor:'pointer',fontFamily:"'Outfit',system-ui"}}>
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === 'settings' && (
              <div style={{animation:'fup .4s ease'}}>
                {/* change password */}
                <div style={{...card,padding:'1.5rem',maxWidth:480,marginBottom:'1.3rem'}}>
                  <h3 style={{fontSize:'.88rem',fontWeight:600,color:'#fff',marginBottom:'1.1rem',paddingBottom:'.7rem',borderBottom:`1px solid ${C.border}`}}>🔐 Change Password</h3>
                  {pwResult && (
                    <div style={{background:pwResult.ok?C.greenBg:C.redBg,border:`1px solid ${pwResult.ok?'rgba(34,197,94,.2)':'rgba(239,68,68,.2)'}`,color:pwResult.ok?C.green:'#FCA5A5',fontSize:'.8rem',padding:'.55rem .9rem',borderRadius:7,marginBottom:'.9rem'}}>
                      {pwResult.ok ? '✅ ' : '⚠ '}{pwResult.msg}
                    </div>
                  )}
                  {pwHash && (
                    <div style={{background:'rgba(59,130,246,.08)',border:`1px solid rgba(59,130,246,.2)`,borderRadius:8,padding:'1rem',marginBottom:'.9rem'}}>
                      <p style={{fontSize:'.73rem',color:'#93C5FD',marginBottom:'.5rem',fontWeight:500}}>📋 Copy this hash into Vercel Dashboard → Environment Variables → ADMIN_PASSWORD_HASH, then redeploy:</p>
                      <code style={{display:'block',fontSize:'.7rem',color:'#E8E0DE',wordBreak:'break-all',background:'rgba(0,0,0,.3)',padding:'.6rem',borderRadius:6}}>{pwHash}</code>
                    </div>
                  )}
                  {[['Current Password',pwCur,setPwCur],['New Password (min 8 chars)',pwNew,setPwNew],['Confirm New Password',pwCon,setPwCon]].map(([lbl,val,fn])=>(
                    <div key={lbl} style={{marginBottom:'.9rem'}}>
                      <label style={label}>{lbl}</label>
                      <input type="password" value={val} onChange={e=>fn(e.target.value)} placeholder="••••••••" style={inp}/>
                    </div>
                  ))}
                  <button onClick={changePassword} style={{padding:'.7rem 1.5rem',background:C.rose,color:'#fff',fontSize:'.83rem',fontWeight:600,borderRadius:8,border:'none',cursor:'pointer',fontFamily:"'Outfit',system-ui",transition:'all .22s'}}>Update Password</button>
                </div>

                {/* connection test */}
                <div style={{...card,padding:'1.5rem',maxWidth:480,marginBottom:'1.3rem'}}>
                  <h3 style={{fontSize:'.88rem',fontWeight:600,color:'#fff',marginBottom:'1.1rem',paddingBottom:'.7rem',borderBottom:`1px solid ${C.border}`}}>🔌 Connection Test</h3>
                  <p style={{fontSize:'.8rem',color:C.gray,marginBottom:'1rem',lineHeight:1.65}}>Test that MongoDB, Cloudinary and your environment variables are all configured correctly. Run this if uploads aren't working.</p>
                  <button
                    disabled={connTesting}
                    onClick={async () => {
                      setConnTesting(true); setConnTest(null);
                      try {
                        const r = await fetch('/api/admin/test-connection');
                        const d = await r.json();
                        setConnTest(d);
                      } catch(e) { setConnTest({ allOk:false, networkError: e.message }); }
                      setConnTesting(false);
                    }}
                    style={{padding:'.68rem 1.4rem',background:connTesting?'rgba(255,255,255,.09)':C.blue,color:connTesting?C.gray:'#fff',fontSize:'.83rem',fontWeight:600,borderRadius:8,border:'none',cursor:connTesting?'not-allowed':'pointer',fontFamily:"'Outfit',system-ui",display:'flex',alignItems:'center',gap:'.4rem',marginBottom:'1rem',transition:'all .22s'}}>
                    {connTesting ? <><div style={{width:14,height:14,border:'2px solid rgba(255,255,255,.25)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .6s linear infinite'}}/>Testing…</> : '▶ Run Connection Test'}
                  </button>
                  {connTest && (
                    <div style={{display:'flex',flexDirection:'column',gap:'.5rem'}}>
                      {/* overall result */}
                      <div style={{padding:'.75rem 1rem',borderRadius:8,background:connTest.allOk?C.greenBg:C.redBg,border:`1px solid ${connTest.allOk?'rgba(34,197,94,.25)':'rgba(239,68,68,.25)'}`,marginBottom:'.5rem'}}>
                        <span style={{fontSize:'.85rem',fontWeight:600,color:connTest.allOk?C.green:'#FCA5A5'}}>
                          {connTest.allOk ? '✅ All systems working — uploads should work fine.' : '❌ Problems found — see details below.'}
                        </span>
                      </div>
                      {/* env vars */}
                      {connTest.envVars && (
                        <div>
                          <div style={{fontSize:'.68rem',letterSpacing:'.1em',textTransform:'uppercase',color:C.gray,marginBottom:'.4rem',fontWeight:600}}>Environment Variables</div>
                          {Object.entries(connTest.envVars).map(([k,v]) => (
                            <div key={k} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'.35rem 0',borderBottom:`1px solid ${C.border}`,fontSize:'.79rem'}}>
                              <code style={{color:C.grayLt,fontSize:'.75rem'}}>{k}</code>
                              <span style={{color:v?C.green:'#FCA5A5',fontWeight:600,fontSize:'.75rem'}}>{v?'✅ Set':'❌ Missing'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* mongodb */}
                      {connTest.mongodb && (
                        <div style={{padding:'.65rem .9rem',borderRadius:7,background:connTest.mongodb.ok?'rgba(34,197,94,.07)':'rgba(239,68,68,.07)',border:`1px solid ${connTest.mongodb.ok?'rgba(34,197,94,.2)':'rgba(239,68,68,.2)'}`}}>
                          <div style={{fontSize:'.75rem',fontWeight:600,color:connTest.mongodb.ok?C.green:'#FCA5A5',marginBottom:'.2rem'}}>MongoDB Atlas {connTest.mongodb.ok?'✅':'❌'}</div>
                          <div style={{fontSize:'.72rem',color:C.gray}}>{connTest.mongodb.message}</div>
                        </div>
                      )}
                      {/* cloudinary */}
                      {connTest.cloudinary && (
                        <div style={{padding:'.65rem .9rem',borderRadius:7,background:connTest.cloudinary.ok?'rgba(34,197,94,.07)':'rgba(239,68,68,.07)',border:`1px solid ${connTest.cloudinary.ok?'rgba(34,197,94,.2)':'rgba(239,68,68,.2)'}`}}>
                          <div style={{fontSize:'.75rem',fontWeight:600,color:connTest.cloudinary.ok?C.green:'#FCA5A5',marginBottom:'.2rem'}}>Cloudinary {connTest.cloudinary.ok?'✅':'❌'}</div>
                          <div style={{fontSize:'.72rem',color:C.gray}}>{connTest.cloudinary.message}{connTest.cloudinary.cloudName ? ` (${connTest.cloudinary.cloudName})` : ''}</div>
                        </div>
                      )}
                      {!connTest.allOk && (
                        <div style={{padding:'.75rem',background:'rgba(59,130,246,.07)',border:'1px solid rgba(59,130,246,.2)',borderRadius:8,fontSize:'.75rem',color:'#93C5FD',lineHeight:1.7}}>
                          💡 <strong>Fix:</strong> Go to Vercel Dashboard → Your Project → Settings → Environment Variables. Add any missing variables, then click <strong>Redeploy</strong>.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* system info */}
                <div style={{...card,padding:'1.5rem',maxWidth:480}}>
                  <h3 style={{fontSize:'.88rem',fontWeight:600,color:'#fff',marginBottom:'1.1rem',paddingBottom:'.7rem',borderBottom:`1px solid ${C.border}`}}>ℹ️ System Info</h3>
                  {[
                    ['Hosting','Vercel (Serverless)',C.green],
                    ['Database','MongoDB Atlas (Free tier)',C.green],
                    ['Media Storage','Cloudinary CDN (Free tier)',C.green],
                    ['Authentication','iron-session encrypted cookie',C.green],
                    ['Password Hashing','bcrypt (cost factor 12)',C.green],
                    ['Rate Limiting','10 login attempts / 15 min / IP',C.green],
                    ['Cookie Security','httpOnly + sameSite=strict',C.green],
                    ['Session Expiry','4 hours',C.green],
                  ].map(([k,v,c])=>(
                    <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:'.8rem',padding:'.5rem 0',borderBottom:`1px solid ${C.border}`}}>
                      <span style={{color:C.gray}}>{k}</span>
                      <span style={{color:c,fontSize:'.78rem'}}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── EDIT MODAL ── */}
      {editItem && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.72)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem',backdropFilter:'blur(3px)'}}>
          <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:13,width:'100%',maxWidth:400,overflow:'hidden',boxShadow:'0 24px 80px rgba(0,0,0,.5)'}}>
            <div style={{padding:'1.2rem 1.4rem',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <h2 style={{fontSize:'.93rem',fontWeight:600,color:'#fff'}}>Edit Media</h2>
              <button onClick={()=>setEditItem(null)} style={{width:29,height:29,borderRadius:'50%',background:'rgba(255,255,255,.06)',border:'none',color:C.gray,cursor:'pointer',fontFamily:"'Outfit',system-ui",fontSize:'.88rem'}}>✕</button>
            </div>
            <div style={{padding:'1.3rem'}}>
              <div style={{aspectRatio:'16/9',borderRadius:8,overflow:'hidden',marginBottom:'1.1rem',background:C.card}}>
                {editItem.type==='video'
                  ? <div style={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'3rem',background:C.amberBg}}>🎬</div>
                  : <img src={editItem.thumb||editItem.url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                }
              </div>
              <div style={{marginBottom:'1rem'}}>
                <label style={label}>Caption</label>
                <input type="text" value={editCap} onChange={e=>setEditCap(e.target.value)} placeholder="Enter caption…" style={inp}/>
              </div>
              <div>
                <label style={label}>Move to Category</label>
                <select value={editCat} onChange={e=>setEditCat(e.target.value)} style={inp}>
                  {CAT_OPTS.map(([s,n])=><option key={s} value={s}>{n}</option>)}
                </select>
              </div>
            </div>
            <div style={{padding:'.9rem 1.4rem',borderTop:`1px solid ${C.border}`,display:'flex',gap:'.65rem',justifyContent:'flex-end'}}>
              <button onClick={()=>setEditItem(null)} style={{padding:'.58rem 1.1rem',background:'rgba(255,255,255,.06)',border:`1px solid ${C.border}`,color:C.grayLt,fontSize:'.78rem',borderRadius:7,cursor:'pointer',fontFamily:"'Outfit',system-ui"}}>Cancel</button>
              <button onClick={saveEdit} style={{padding:'.58rem 1.25rem',background:C.rose,color:'#fff',fontSize:'.78rem',fontWeight:500,borderRadius:7,border:'none',cursor:'pointer',fontFamily:"'Outfit',system-ui"}}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast.msg && (
        <div style={{position:'fixed',bottom:'1.4rem',right:'1.4rem',zIndex:999,background:C.panel,border:`1px solid ${C.border}`,color:'#E8E0DE',padding:'.6rem 1.1rem',borderRadius:10,fontSize:'.79rem',fontWeight:500,boxShadow:'0 8px 30px rgba(0,0,0,.4)',borderLeft:`3px solid ${toast.type==='ok'?C.green:toast.type==='warn'?C.amber:C.rose}`,display:'flex',alignItems:'center',gap:'.45rem',animation:'fup .28s ease'}}>
          {toast.msg}
        </div>
      )}
    </>
  );
}
