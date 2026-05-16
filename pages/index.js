import Head from 'next/head';
import { useState, useEffect, useCallback } from 'react';

const CATS = {
  birthday:   { name:'Birthday Decor',                    desc:'Milestone celebrations for all ages',          tag:'Birthdays',   img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=70' },
  babyshower: { name:'Baby Shower',                       desc:'Beautiful setups welcoming your little one',   tag:'Baby',        img:'https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=600&q=70' },
  inhouse:    { name:'In House Decoration',               desc:'Transform your home into the perfect venue',   tag:'Home',        img:'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&q=70' },
  kids:       { name:'Kids Theme Decor',                  desc:'Magical themes that kids absolutely love',     tag:'Kids',        img:'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&q=70' },
  haldi:      { name:'Haldi, Mehndi & Sangeet',           desc:'Vibrant traditional ceremony decorations',     tag:'Traditions',  img:'https://images.unsplash.com/photo-1604017011826-d3b4c23f8914?w=600&q=70' },
  mandap:     { name:'Wedding Mandap',                    desc:'Sacred and breathtaking mandap setups',        tag:'Weddings',    img:'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=70' },
  reception:  { name:'Wedding Reception / Anniversary',   desc:'Grand receptions and anniversary celebrations',tag:'Weddings',    img:'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&q=70' },
  corporate:  { name:'Corporate Events / Business Opening',desc:'Professional event setups for businesses',   tag:'Corporate',   img:'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=70' },
};

const WA_SVG = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="28" height="28">
    <path fill="#fff" d="M24 4C13 4 4 13 4 24c0 3.6 1 7 2.7 9.9L4 44l10.4-2.7C17.2 43 20.5 44 24 44c11 0 20-9 20-20S35 4 24 4z"/>
    <path fill="#25D366" d="M24 6.4C14.3 6.4 6.4 14.3 6.4 24c0 3.4 1 6.6 2.6 9.3l.4.7-1.7 6.3 6.5-1.7.7.4C17.4 40.6 20.6 41.6 24 41.6c9.7 0 17.6-7.9 17.6-17.6S33.7 6.4 24 6.4z"/>
    <path fill="#fff" fillRule="evenodd" d="M18.2 15.2c-.4-.9-.8-.9-1.2-.9h-1c-.4 0-.9.1-1.4.7-.5.5-1.8 1.7-1.8 4.2s1.8 4.9 2.1 5.2c.3.3 3.5 5.6 8.6 7.7 4.3 1.7 5.1 1.4 6 1.3.9-.1 2.9-1.2 3.3-2.3.4-1.1.4-2.1.3-2.3-.1-.2-.4-.3-.9-.6-.4-.2-2.9-1.4-3.3-1.6-.4-.2-.7-.2-1 .2-.3.4-1.2 1.6-1.4 1.9-.3.3-.5.3-1 .1s-2-.7-3.7-2.3c-1.4-1.2-2.3-2.7-2.6-3.2-.3-.4 0-.7.2-.9l.7-.8c.2-.3.3-.5.4-.8.1-.3 0-.6-.1-.9l-1.3-3.7z"/>
  </svg>
);

export default function Home() {
  const [page, setPage] = useState('home');
  const [curCat, setCurCat] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [galleryError, setGalleryError] = useState('');
  const [sortOrder, setSortOrder] = useState('new');
  const [lbOpen, setLbOpen] = useState(false);
  const [lbIdx, setLbIdx] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [toast, setToast] = useState('');
  const [cName, setCName] = useState(''); const [cEmail, setCEmail] = useState('');
  const [cPhone, setCPhone] = useState(''); const [cMsg, setCMsg] = useState('');
  const [cFile, setCFile] = useState('');
  const [featuredVideos, setFeaturedVideos]   = useState([]);
  const [activeVideo,    setActiveVideo]      = useState(null); // youtubeId currently playing in lightbox
  const [slideIdx,       setSlideIdx]         = useState(0);   // current slide in featured slideshow
  const [slidePlaying,   setSlidePlaying]     = useState(false);// is iframe showing in slide
  const [recentPhotos,   setRecentPhotos]     = useState([]);
  const [catVideos,      setCatVideos]        = useState([]); // videos for current gallery category

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  // fetch YouTube videos on load
  useEffect(() => {
    // Featured videos for home slideshow
    fetch('/api/videos?featured=true&limit=8')
      .then(r => r.json())
      .then(d => { setFeaturedVideos(d.videos || []); })
      .catch(() => {});
    // Latest photos across all categories
    fetch('/api/recent-photos')
      .then(r => r.json())
      .then(d => setRecentPhotos(d.photos || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (!lbOpen) return;
      if (e.key === 'ArrowLeft') navLB(-1);
      if (e.key === 'ArrowRight') navLB(1);
      if (e.key === 'Escape') setLbOpen(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [lbOpen, lbIdx, items]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }, []);

  const openCat = useCallback(async (slug, order = 'new') => {
    setCurCat(slug);
    setPage('gallery');
    setLoading(true);
    setItems([]);
    setCatVideos([]);
    setActiveVideo(null);
    setSlidePlaying(false);
    setDrawerOpen(false);
    window.scrollTo(0, 0);
    // Fetch category videos in parallel
    fetch(`/api/videos?category=${slug}&limit=6`)
      .then(r => r.json())
      .then(d => setCatVideos(d.videos || []))
      .catch(() => setCatVideos([]));

    try {
      const r = await fetch(`/api/gallery/${slug}`);
      const d = await r.json();
      let arr = d.items || [];
      arr = arr.sort((a, b) => order === 'new'
        ? new Date(b.date) - new Date(a.date)
        : new Date(a.date) - new Date(b.date));
      setItems(arr);
    } catch { showToast('Failed to load gallery.'); }
    setLoading(false);
  }, [showToast]);

  const navLB = useCallback((dir) => {
    setLbIdx(i => (i + dir + items.length) % items.length);
  }, [items.length]);

  const sendEnq = () => {
    if (!cName.trim() || !cEmail.trim()) { showToast('Please enter your name and email.'); return; }
    showToast('✅ Enquiry sent! We\'ll contact you within 24 hours.');
    setCName(''); setCEmail(''); setCPhone(''); setCMsg(''); setCFile('');
  };

  const cat = curCat ? CATS[curCat] : null;
  const lbItem = items[lbIdx];

  const s = {
    nav: { position:'fixed',top:0,left:0,right:0,zIndex:300,background:'rgba(255,255,255,.97)',borderBottom:'1px solid var(--cream)',backdropFilter:'blur(12px)',transition:'box-shadow .3s',boxShadow:scrolled?'0 4px 30px rgba(0,0,0,.1)':'none' },
    navWrap: { maxWidth:1300,margin:'0 auto',padding:'0 1.5rem',display:'flex',alignItems:'center',height:62 },
    logoMark: { width:35,height:35,borderRadius:'50%',background:'var(--rose)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontFamily:'var(--fd)',fontSize:'1.05rem',fontWeight:600,flexShrink:0 },
    navLink: { display:'flex',alignItems:'center',height:62,padding:'0 .65rem',fontSize:'.72rem',fontWeight:500,color:'var(--gray)',whiteSpace:'nowrap',borderBottom:'2px solid transparent',transition:'color .2s,border-color .2s',cursor:'pointer' },
    navLinkOn: { color:'var(--rose)',borderBottomColor:'var(--rose)' },
    navCall: { flexShrink:0,marginLeft:'.8rem',display:'flex',alignItems:'center',gap:'.3rem',background:'var(--rose)',color:'#fff',padding:'.42rem 1rem',borderRadius:100,fontSize:'.77rem',fontWeight:500,whiteSpace:'nowrap',transition:'background .2s',textDecoration:'none' },
    burger: { display:'none',flexDirection:'column',gap:4,padding:8,cursor:'pointer',marginLeft:'.4rem' },
    hero: { marginTop:62,minHeight:'80vh',display:'flex',alignItems:'center',position:'relative',overflow:'hidden',background:'var(--dark)' },
    heroContent: { position:'relative',zIndex:2,maxWidth:1300,margin:'0 auto',padding:'5.5rem 1.5rem 4.5rem',width:'100%' },
    btnRose: { display:'inline-flex',alignItems:'center',gap:'.35rem',padding:'.78rem 1.9rem',background:'var(--rose)',color:'#fff',fontSize:'.79rem',fontWeight:500,borderRadius:100,transition:'all .25s',cursor:'pointer',border:'none',fontFamily:'var(--fb)' },
    btnGhost: { display:'inline-flex',alignItems:'center',gap:'.35rem',padding:'.78rem 1.9rem',border:'1px solid rgba(255,255,255,.3)',color:'rgba(255,255,255,.8)',fontSize:'.79rem',fontWeight:500,borderRadius:100,transition:'all .25s',cursor:'pointer',background:'none',fontFamily:'var(--fb)' },
    catsGrid: { display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1.1rem' },
    catCard: { position:'relative',overflow:'hidden',borderRadius:10,cursor:'pointer',aspectRatio:'4/3',background:'var(--cream)',boxShadow:'var(--sh)',transition:'transform .35s,box-shadow .35s' },
    photoGrid: { display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8 },
    photoCell: { position:'relative',aspectRatio:'1/1',overflow:'hidden',borderRadius:7,background:'var(--cream)',cursor:'pointer' },
    skel: { borderRadius:7,background:'var(--cream)',animation:'shimmer 1.4s infinite',aspectRatio:'1/1' },
    wa: { position:'fixed',bottom:'1.4rem',right:'1.4rem',zIndex:200,width:54,height:54,background:'#25D366',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 20px rgba(37,211,102,.45)',textDecoration:'none',transition:'transform .25s',animation:'waPulse 2.5s ease-in-out infinite' },
  };

  return (
    <>
      <Head>
        <title>Western Sydney Events — Event Decoration & Planning</title>
        <meta name="description" content="Premium event decorations for birthdays, baby showers, weddings, corporate events across Western Sydney. Call 0450 044 942." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        @media(max-width:768px){
          .nav-links,.nav-call{display:none!important}
          .burger{display:flex!important}
          .cats-grid{grid-template-columns:repeat(2,1fr)!important;gap:.75rem!important}
          .recent-grid{grid-template-columns:repeat(2,1fr)!important;gap:7px!important}
          .slide-layout{grid-template-columns:1fr!important}
          .vid-playlist{max-height:260px!important;flex-direction:row!important;overflow-x:auto!important;overflow-y:hidden!important;padding-bottom:6px!important}
          .vid-playlist>div{min-width:200px!important}
          .photo-grid{grid-template-columns:repeat(2,1fr)!important;gap:7px!important}
          .ch-grid{grid-template-columns:1fr!important}
          .frow{grid-template-columns:1fr!important}
          .ft-in>*:not(:first-child){display:none!important}
        }
        @media(max-width:480px){
          .hero-btns{flex-direction:column!important}
          .photo-grid{gap:5px!important}
        }
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes waPulse{0%,100%{box-shadow:0 4px 20px rgba(37,211,102,.45),0 0 0 0 rgba(37,211,102,.4)}60%{box-shadow:0 4px 20px rgba(37,211,102,.45),0 0 0 10px rgba(37,211,102,0)}}
        @keyframes fup{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes tick{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .cat-card:hover{transform:translateY(-5px)!important;box-shadow:0 16px 48px rgba(0,0,0,.14)!important}
        .cat-card:hover img{transform:scale(1.07)!important}
        .cat-card:hover .cat-arrow{opacity:1!important;transform:scale(1)!important}
        .photo-cell:hover img,.photo-cell:hover video{transform:scale(1.07)!important}
        .photo-cell:hover .photo-ov{opacity:1!important}
        .ch:hover{background:rgba(200,85,106,.15)!important;border-color:rgba(200,85,106,.3)!important}
        .drawer-link:hover{background:var(--rose-lt)!important;color:var(--rose)!important}
        .toast{position:fixed;bottom:1.8rem;left:50%;transform:translateX(-50%) translateY(8px);background:var(--dark);color:#fff;padding:.5rem 1.1rem;border-radius:100px;font-size:.79rem;opacity:0;transition:all .3s;z-index:900;white-space:nowrap;border-left:3px solid var(--rose);pointer-events:none}
        .toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
        .lb-overlay{position:fixed;inset:0;background:rgba(0,0,0,.97);z-index:800;display:flex;flex-direction:column;align-items:center;justify-content:center}
        .lb-img{max-width:92vw;max-height:85vh;object-fit:contain;border-radius:4px;display:block}
        .lb-vid{max-width:92vw;max-height:85vh;border-radius:4px;display:block}
        .lb-nav{position:fixed;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.2);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.1rem;cursor:pointer;background:rgba(0,0,0,.3);transition:all .2s}
        .lb-nav:hover{background:var(--rose);border-color:var(--rose)}
      `}</style>

      {/* NAV */}
      <nav style={s.nav}>
        <div style={s.navWrap}>
          <div style={{display:'flex',alignItems:'center',gap:'.6rem',cursor:'pointer',flexShrink:0,marginRight:'1.2rem'}} onClick={() => setPage('home')}>
            <div style={s.logoMark}>W</div>
            <div>
              <div style={{fontFamily:'var(--fd)',fontSize:'.97rem',fontWeight:600,color:'var(--dark)',lineHeight:1.2}}>Western Sydney Events</div>
              <div style={{fontSize:'.59rem',letterSpacing:'.13em',textTransform:'uppercase',color:'var(--gray)'}}>Event Decoration Specialists</div>
            </div>
          </div>
          <ul className="nav-links" style={{display:'flex',alignItems:'center',listStyle:'none',flex:1,overflowX:'auto',scrollbarWidth:'none'}}>
            {[['home','Home'],['birthday','Birthday Decor'],['babyshower','Baby Shower'],['inhouse','In House'],['kids','Kids Theme'],['haldi','Haldi & Mehndi'],['mandap','Wedding Mandap'],['reception','Wedding Reception'],['corporate','Corporate']].map(([slug,label]) => (
              <li key={slug}><a style={{...s.navLink,...((page==='home'&&slug==='home')||(page==='gallery'&&curCat===slug)?s.navLinkOn:{})}} onClick={() => slug==='home'?setPage('home'):openCat(slug)}>{label}</a></li>
            ))}
          </ul>
          <a href="tel:0450044942" style={s.navCall} className="nav-call">📞 0450 044 942</a>
          <div className="burger" style={s.burger} onClick={() => setDrawerOpen(!drawerOpen)}>
            {[0,1,2].map(i => <span key={i} style={{display:'block',width:21,height:1.5,background:'var(--dark)',borderRadius:2}}/>)}
          </div>
        </div>
      </nav>

      {/* MOBILE DRAWER */}
      {drawerOpen && (
        <div style={{display:'block',position:'fixed',top:62,left:0,right:0,background:'#fff',borderBottom:'1px solid var(--cream)',zIndex:299,padding:'.7rem',boxShadow:'0 8px 30px rgba(0,0,0,.1)'}}>
          {[['home','🏠 Home'],['birthday','🎂 Birthday Decor'],['babyshower','🍼 Baby Shower'],['inhouse','🏡 In House Decoration'],['kids','🦄 Kids Theme Decor'],['haldi','🌸 Haldi, Mehndi & Sangeet'],['mandap','💍 Wedding Mandap'],['reception','💒 Wedding Reception'],['corporate','🏢 Corporate Events']].map(([slug,label]) => (
            <a key={slug} className="drawer-link" style={{display:'flex',alignItems:'center',gap:'.5rem',padding:'.62rem .85rem',fontSize:'.87rem',fontWeight:500,color:'var(--gray)',borderRadius:8,transition:'all .2s',cursor:'pointer'}} onClick={() => slug==='home'?setPage('home'):openCat(slug)}>
              {label}
            </a>
          ))}
          <a href="https://wa.me/61450044942" style={{marginTop:'.5rem',display:'flex',alignItems:'center',justifyContent:'center',gap:'.5rem',background:'#25D366',color:'#fff',padding:'.72rem',borderRadius:8,fontSize:'.87rem',fontWeight:500,textDecoration:'none'}}>
            {WA_SVG} WhatsApp Us
          </a>
        </div>
      )}

      {/* HOME PAGE */}
      {page === 'home' && (
        <div>
          {/* Hero */}
          <section style={s.hero}>
            <div style={{position:'absolute',inset:0,background:'url(https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1600&q=65) center/cover',opacity:.22,transform:'scale(1.04)',animation:'hpan 20s ease-in-out infinite alternate'}}/>
            <div style={{position:'absolute',inset:0,background:'linear-gradient(110deg,rgba(24,16,14,.92) 0%,rgba(24,16,14,.5) 55%,rgba(200,85,106,.1) 100%)'}}/>
            <div style={s.heroContent}>
              <div style={{display:'flex',alignItems:'center',gap:'.7rem',marginBottom:'1.3rem',animation:'fup .9s .1s both'}}>
                <span style={{display:'block',width:30,height:1,background:'var(--gold)'}}/>
                <span style={{fontSize:'.65rem',letterSpacing:'.26em',textTransform:'uppercase',color:'var(--gold)',fontWeight:400}}>Western Sydney's Premier Event Decorators</span>
              </div>
              <h1 style={{fontFamily:'var(--fd)',fontSize:'clamp(2.8rem,7vw,6rem)',fontWeight:400,color:'#fff',lineHeight:.96,marginBottom:'1.3rem',animation:'fup .9s .22s both'}}>
                Add <em style={{fontStyle:'italic',color:'var(--gold)',opacity:.9}}>Glamour</em><br/>to Your Every<br/>Event
              </h1>
              <p style={{maxWidth:440,fontSize:'.98rem',color:'rgba(255,255,255,.55)',fontWeight:300,lineHeight:1.8,marginBottom:'2.2rem',animation:'fup .9s .34s both'}}>
                Customised & fixed themes for all occasions, crafted with love across Western Sydney.
              </p>
              <div className="hero-btns" style={{display:'flex',gap:'.9rem',flexWrap:'wrap',animation:'fup .9s .46s both'}}>
                <button style={s.btnRose} onClick={() => document.getElementById('contact')?.scrollIntoView({behavior:'smooth'})}>📋 Get a Quote</button>
                <button style={s.btnGhost} onClick={() => openCat('birthday')}>🖼 View Gallery</button>
              </div>
              <div style={{display:'flex',gap:'2.2rem',marginTop:'3.5rem',flexWrap:'wrap',animation:'fup .9s .58s both'}}>
                {[['500+','Events Done'],['8+','Years Experience'],['100%','Happy Clients']].map(([n,l]) => (
                  <div key={n}><div style={{fontFamily:'var(--fd)',fontSize:'2rem',fontWeight:400,color:'#fff',lineHeight:1}}>{n}</div><div style={{fontSize:'.63rem',letterSpacing:'.14em',textTransform:'uppercase',color:'rgba(255,255,255,.38)',marginTop:'.1rem'}}>{l}</div></div>
                ))}
              </div>
            </div>
          </section>

          {/* Ticker */}
          <div style={{background:'var(--rose)',padding:'.68rem 0',overflow:'hidden'}}>
            <div style={{display:'flex',gap:'2.5rem',whiteSpace:'nowrap',animation:'tick 26s linear infinite'}}>
              {['Birthday Decor','Baby Shower','Wedding Mandap','In House Decoration','Kids Theme','Haldi & Mehndi','Corporate Events','Wedding Reception','Birthday Decor','Baby Shower','Wedding Mandap','In House Decoration','Kids Theme','Haldi & Mehndi','Corporate Events','Wedding Reception'].map((t,i) => (
                <span key={i} style={{fontSize:'.67rem',fontWeight:500,letterSpacing:'.2em',textTransform:'uppercase',color:'rgba(255,255,255,.9)',display:'flex',alignItems:'center',gap:'1.2rem'}}>
                  {t}<span style={{fontSize:'.43rem',opacity:.7}}>✦</span>
                </span>
              ))}
            </div>
          </div>

          {/* Recent Work — latest uploaded photos */}
          {recentPhotos.length > 0 && (
            <div style={{background:'var(--off)',padding:'3.5rem 1.5rem 0'}}>
              <div style={{maxWidth:1300,margin:'0 auto'}}>
                <div style={{textAlign:'center',marginBottom:'2.2rem'}}>
                  <span style={{fontSize:'.65rem',letterSpacing:'.24em',textTransform:'uppercase',color:'var(--rose)',fontWeight:500,display:'block',marginBottom:'.5rem'}}>Fresh From Our Studio</span>
                  <h2 style={{fontFamily:'var(--fd)',fontSize:'clamp(1.7rem,3.5vw,2.5rem)',fontWeight:400,color:'var(--dark)',marginBottom:'.45rem'}}>Recent Work</h2>
                  <span style={{display:'block',width:42,height:2,background:'var(--gold)',margin:'.8rem auto 0'}}/>
                  <p style={{color:'var(--gray)',fontSize:'.88rem',fontWeight:300,marginTop:'.45rem'}}>Our latest event decorations — updated as we complete new events</p>
                </div>

                {/* Uniform grid — 4 cols desktop, 2 mobile — square cells */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}} className="recent-grid">
                  {recentPhotos.map((photo, i) => (
                    <div key={photo.id}
                      onClick={() => openCat(photo.category)}
                      title={`View all ${CATS[photo.category]?.name || photo.category}`}
                      style={{
                        position:'relative',aspectRatio:'1/1',overflow:'hidden',
                        borderRadius:10,background:'var(--cream)',cursor:'pointer',
                        boxShadow:'var(--sh)',transition:'transform .35s,box-shadow .35s',
                      }}
                      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow='0 16px 40px rgba(0,0,0,.13)'}}
                      onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='var(--sh)'}}
                    >
                      <img
                        src={photo.thumb || photo.src}
                        alt={photo.cap || (CATS[photo.category]?.name + ' decoration')}
                        loading="lazy"
                        style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',objectPosition:'center',transition:'transform .5s'}}
                      />
                      {/* hover overlay */}
                      <div style={{
                        position:'absolute',inset:0,borderRadius:10,
                        background:'linear-gradient(to top,rgba(24,16,14,.82) 0%,rgba(24,16,14,.05) 50%,transparent 100%)',
                        opacity:0,transition:'opacity .3s',display:'flex',alignItems:'flex-end',padding:'1rem',
                      }}
                        onMouseEnter={e=>e.currentTarget.style.opacity='1'}
                        onMouseLeave={e=>e.currentTarget.style.opacity='0'}
                      >
                        <div>
                          <div style={{fontFamily:'var(--fd)',color:'#fff',fontSize:'.95rem',fontWeight:600,lineHeight:1.3}}>
                            {CATS[photo.category]?.name || photo.category}
                          </div>
                          {photo.cap && photo.cap !== 'Event photo' && (
                            <div style={{fontSize:'.7rem',color:'rgba(255,255,255,.6)',marginTop:'.15rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>
                              {photo.cap}
                            </div>
                          )}
                          <div style={{fontSize:'.65rem',color:'var(--rose)',marginTop:'.3rem',letterSpacing:'.08em',display:'flex',alignItems:'center',gap:'.3rem'}}>
                            View gallery →
                          </div>
                        </div>
                      </div>

                      {/* "New" badge on the very first photo */}
                      {i === 0 && (
                        <div style={{position:'absolute',top:'.6rem',left:'.6rem',background:'var(--rose)',color:'#fff',fontSize:'.6rem',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',padding:'.2rem .55rem',borderRadius:100}}>
                          New
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{textAlign:'center',marginTop:'1.8rem',paddingBottom:'.5rem'}}>
                  <button
                    onClick={() => openCat('birthday')}
                    style={{display:'inline-flex',alignItems:'center',gap:'.4rem',padding:'.65rem 1.8rem',border:'1.5px solid var(--rose)',color:'var(--rose)',borderRadius:100,fontSize:'.78rem',fontWeight:500,cursor:'pointer',background:'none',fontFamily:'var(--fb)',transition:'all .25s'}}
                    onMouseEnter={e=>{e.currentTarget.style.background='var(--rose)';e.currentTarget.style.color='#fff'}}
                    onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='var(--rose)'}}
                  >
                    View Full Gallery →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Categories */}
          <div style={{maxWidth:1300,margin:'0 auto',padding:'4rem 1.5rem 3rem'}}>
            <div style={{textAlign:'center',marginBottom:'2.8rem'}}>
              <span style={{fontSize:'.65rem',letterSpacing:'.24em',textTransform:'uppercase',color:'var(--rose)',fontWeight:500,display:'block',marginBottom:'.5rem'}}>Browse by Category</span>
              <h2 style={{fontFamily:'var(--fd)',fontSize:'clamp(1.7rem,3.5vw,2.5rem)',fontWeight:400,color:'var(--dark)',marginBottom:'.45rem'}}>Our Event Categories</h2>
              <span style={{display:'block',width:42,height:2,background:'var(--gold)',margin:'.8rem auto 0'}}/>
              <p style={{color:'var(--gray)',fontSize:'.88rem',fontWeight:300,marginTop:'.45rem'}}>Tap any category to view our full photo & video gallery</p>
            </div>
            <div className="cats-grid" style={s.catsGrid}>
              {Object.entries(CATS).map(([slug, cat]) => (
                <div key={slug} className="cat-card" style={s.catCard} onClick={() => openCat(slug)}>
                  <div style={{position:'absolute',inset:0,overflow:'hidden'}}>
                    <img src={cat.img} alt={cat.name} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',objectPosition:'center',transition:'transform .5s'}} loading="lazy"/>
                  </div>
                  <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(24,16,14,.82) 0%,rgba(24,16,14,.08) 55%,transparent 100%)'}}/>
                  <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'1.3rem 1.1rem 1rem',display:'flex',alignItems:'flex-end',justifyContent:'space-between'}}>
                    <div>
                      <h3 style={{fontFamily:'var(--fd)',color:'#fff',fontSize:'1.07rem',fontWeight:600,lineHeight:1.25}}>{cat.name}</h3>
                      <small style={{color:'rgba(255,255,255,.52)',fontSize:'.67rem',display:'block',marginTop:'.12rem'}}>{cat.tag}</small>
                    </div>
                    <div className="cat-arrow" style={{width:29,height:29,borderRadius:'50%',background:'var(--rose)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.83rem',flexShrink:0,marginLeft:'.5rem',opacity:0,transform:'scale(.6)',transition:'all .3s'}}>→</div>
                  </div>
                </div>
              ))}
              <div style={{borderRadius:10,background:'var(--rose-lt)',border:'1.5px dashed var(--rose)',padding:'2rem',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',gap:'.75rem',aspectRatio:'4/3',boxShadow:'var(--sh)'}}>
                <div style={{fontSize:'2.1rem'}}>✉️</div>
                <h3 style={{fontFamily:'var(--fd)',fontSize:'1.08rem',color:'var(--dark)'}}>Custom Theme?</h3>
                <p style={{fontSize:'.8rem',color:'var(--gray)',fontWeight:300,lineHeight:1.6}}>Tell us your vision — we'll bring it to life.</p>
                <button style={{padding:'.48rem 1.1rem',background:'var(--rose)',color:'#fff',fontSize:'.74rem',fontWeight:500,borderRadius:100,border:'none',cursor:'pointer',fontFamily:'var(--fb)'}} onClick={() => document.getElementById('contact')?.scrollIntoView({behavior:'smooth'})}>Get a Free Quote</button>
              </div>
            </div>
          </div>




          {/* ══════════════════════════════════════
              FEATURED VIDEO SLIDESHOW
              Shows only when admin marks videos as Featured
          ══════════════════════════════════════ */}
          {featuredVideos.length > 0 && (
            <div style={{background:'var(--dark)',padding:'4.5rem 1.5rem 5rem',position:'relative',overflow:'hidden'}}>
              {/* subtle bg texture */}
              <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(circle at 20% 50%,rgba(200,85,106,.08) 0%,transparent 50%),radial-gradient(circle at 80% 50%,rgba(212,168,83,.06) 0%,transparent 50%)',pointerEvents:'none'}}/>

              <div style={{maxWidth:1300,margin:'0 auto',position:'relative',zIndex:1}}>
                {/* Section Header */}
                <div style={{textAlign:'center',marginBottom:'3rem'}}>
                  <span style={{fontSize:'.65rem',letterSpacing:'.24em',textTransform:'uppercase',color:'var(--rose)',fontWeight:500,display:'block',marginBottom:'.5rem'}}>Watch Us Work</span>
                  <h2 style={{fontFamily:'var(--fd)',fontSize:'clamp(1.8rem,3.5vw,2.8rem)',fontWeight:400,color:'#fff',marginBottom:'.45rem'}}>Featured Videos</h2>
                  <span style={{display:'block',width:42,height:2,background:'var(--gold)',margin:'.8rem auto 0'}}/>
                  <p style={{color:'rgba(255,255,255,.42)',fontSize:'.88rem',fontWeight:300,marginTop:'.45rem'}}>Behind the scenes and event highlights</p>
                </div>

                {/* ── MAIN SLIDE AREA ── */}
                <div style={{display:'grid',gridTemplateColumns:'1fr minmax(0,320px)',gap:'1.5rem',alignItems:'start'}} className="slide-layout">

                  {/* Left: big player */}
                  <div style={{borderRadius:14,overflow:'hidden',background:'#000',position:'relative',boxShadow:'0 24px 80px rgba(0,0,0,.6)'}}>
                    {/* 16:9 aspect ratio wrapper */}
                    <div style={{position:'relative',paddingBottom:'56.25%',background:'#000'}}>

                      {slidePlaying ? (
                        /* ── IFRAME PLAYER — autoplay when user clicks play ── */
                        <iframe
                          key={featuredVideos[slideIdx]?.youtubeId}
                          src={`https://www.youtube.com/embed/${featuredVideos[slideIdx]?.youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`}
                          title={featuredVideos[slideIdx]?.title || 'Event video'}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          style={{position:'absolute',inset:0,width:'100%',height:'100%',border:'none'}}
                        />
                      ) : (
                        /* ── THUMBNAIL POSTER — click to play ── */
                        <div style={{position:'absolute',inset:0,cursor:'pointer'}} onClick={() => setSlidePlaying(true)}>
                          {/* Thumbnail image with fallback chain: maxres → hq → mq */}
                          <img
                            src={featuredVideos[slideIdx]?.thumbUrl}
                            alt={featuredVideos[slideIdx]?.title || 'Video thumbnail'}
                            onError={e => {
                              if (e.target.src.includes('maxresdefault')) {
                                e.target.src = e.target.src.replace('maxresdefault','hqdefault');
                              } else if (e.target.src.includes('hqdefault')) {
                                e.target.src = e.target.src.replace('hqdefault','mqdefault');
                              }
                            }}
                            style={{width:'100%',height:'100%',objectFit:'cover',display:'block',position:'absolute',inset:0}}
                          />

                          {/* Gradient overlay */}
                          <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,.7) 0%,rgba(0,0,0,.1) 40%,transparent 70%)'}}/>

                          {/* ── Play button ── */}
                          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <div
                              style={{width:80,height:80,borderRadius:'50%',background:'rgba(200,85,106,.9)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 32px rgba(200,85,106,.6)',transition:'transform .25s,box-shadow .25s'}}
                              onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.1)';e.currentTarget.style.boxShadow='0 8px 48px rgba(200,85,106,.8)'}}
                              onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow='0 4px 32px rgba(200,85,106,.6)'}}
                            >
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                            </div>
                          </div>

                          {/* Bottom info overlay */}
                          <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'1.5rem 1.8rem'}}>
                            {featuredVideos[slideIdx]?.title && (
                              <h3 style={{fontFamily:'var(--fd)',color:'#fff',fontSize:'clamp(1rem,2.5vw,1.5rem)',fontWeight:400,lineHeight:1.3,marginBottom:'.4rem'}}>
                                {featuredVideos[slideIdx].title}
                              </h3>
                            )}
                            {featuredVideos[slideIdx]?.description && (
                              <p style={{color:'rgba(255,255,255,.6)',fontSize:'.82rem',fontWeight:300,lineHeight:1.6,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                                {featuredVideos[slideIdx].description}
                              </p>
                            )}
                            <div style={{display:'flex',alignItems:'center',gap:'1rem',marginTop:'.8rem'}}>
                              <span style={{fontSize:'.7rem',color:'var(--rose)',fontWeight:500,display:'flex',alignItems:'center',gap:'.3rem'}}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                Click to play
                              </span>
                              <a href={featuredVideos[slideIdx]?.watchUrl} target="_blank" rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                style={{fontSize:'.7rem',color:'rgba(255,255,255,.45)',display:'flex',alignItems:'center',gap:'.3rem',textDecoration:'none',transition:'color .2s'}}
                                onMouseEnter={e=>e.currentTarget.style.color='rgba(255,255,255,.8)'}
                                onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,.45)'}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="#FF0000"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8z"/><path d="M9.6 15.6V8.4l6.3 3.6-6.3 3.6z" fill="white"/></svg>
                                Watch on YouTube
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ── Slide navigation dots + arrows (BELOW player) ── */}
                    {featuredVideos.length > 1 && (
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'.8rem 1.2rem',background:'rgba(0,0,0,.6)',backdropFilter:'blur(8px)'}}>
                        {/* Prev */}
                        <button
                          onClick={() => { setSlidePlaying(false); setSlideIdx(i => (i - 1 + featuredVideos.length) % featuredVideos.length); }}
                          style={{width:34,height:34,borderRadius:'50%',border:'1px solid rgba(255,255,255,.2)',background:'rgba(255,255,255,.08)',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1rem',transition:'all .2s',fontFamily:'inherit'}}
                          onMouseEnter={e=>{e.currentTarget.style.background='var(--rose)';e.currentTarget.style.borderColor='var(--rose)'}}
                          onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,.08)';e.currentTarget.style.borderColor='rgba(255,255,255,.2)'}}
                        >‹</button>

                        {/* Dots */}
                        <div style={{display:'flex',gap:6,alignItems:'center'}}>
                          {featuredVideos.map((_,i) => (
                            <button key={i}
                              onClick={() => { setSlidePlaying(false); setSlideIdx(i); }}
                              style={{width:slideIdx===i?22:7,height:7,borderRadius:slideIdx===i?4:50,background:slideIdx===i?'var(--rose)':'rgba(255,255,255,.3)',border:'none',cursor:'pointer',transition:'all .3s',padding:0}}
                            />
                          ))}
                        </div>

                        {/* Next */}
                        <button
                          onClick={() => { setSlidePlaying(false); setSlideIdx(i => (i + 1) % featuredVideos.length); }}
                          style={{width:34,height:34,borderRadius:'50%',border:'1px solid rgba(255,255,255,.2)',background:'rgba(255,255,255,.08)',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1rem',transition:'all .2s',fontFamily:'inherit'}}
                          onMouseEnter={e=>{e.currentTarget.style.background='var(--rose)';e.currentTarget.style.borderColor='var(--rose)'}}
                          onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,.08)';e.currentTarget.style.borderColor='rgba(255,255,255,.2)'}}
                        >›</button>
                      </div>
                    )}
                  </div>

                  {/* Right: video playlist */}
                  <div style={{display:'flex',flexDirection:'column',gap:'.7rem',maxHeight:480,overflowY:'auto',paddingRight:4}} className="vid-playlist">
                    {featuredVideos.map((v, i) => (
                      <div key={v.id}
                        onClick={() => { setSlidePlaying(false); setSlideIdx(i); }}
                        style={{
                          display:'flex',gap:'.75rem',alignItems:'center',
                          padding:'.75rem',borderRadius:10,cursor:'pointer',
                          background:i===slideIdx?'rgba(200,85,106,.15)':'rgba(255,255,255,.04)',
                          border:`1px solid ${i===slideIdx?'rgba(200,85,106,.4)':'rgba(255,255,255,.07)'}`,
                          transition:'all .22s',flexShrink:0,
                        }}
                        onMouseEnter={e=>{ if(i!==slideIdx){ e.currentTarget.style.background='rgba(255,255,255,.08)'; }}}
                        onMouseLeave={e=>{ if(i!==slideIdx){ e.currentTarget.style.background='rgba(255,255,255,.04)'; }}}
                      >
                        {/* Mini thumbnail */}
                        <div style={{width:80,aspectRatio:'16/9',borderRadius:6,overflow:'hidden',flexShrink:0,position:'relative',background:'#000'}}>
                          <img
                            src={v.thumbUrl}
                            alt={v.title||'video'}
                            onError={e=>{ if(e.target.src.includes('maxresdefault')) e.target.src=e.target.src.replace('maxresdefault','hqdefault'); }}
                            style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}
                          />
                          {/* play icon overlay */}
                          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <div style={{width:22,height:22,borderRadius:'50%',background:i===slideIdx?'var(--rose)':'rgba(255,255,255,.7)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                              <svg width="9" height="9" viewBox="0 0 24 24" fill={i===slideIdx?'white':'#333'}><path d="M8 5v14l11-7z"/></svg>
                            </div>
                          </div>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:'.82rem',fontWeight:500,color:i===slideIdx?'#fff':'rgba(255,255,255,.7)',lineHeight:1.35,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>
                            {v.title || 'Event Video'}
                          </div>
                          {v.description && (
                            <div style={{fontSize:'.7rem',color:'rgba(255,255,255,.35)',marginTop:'.2rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                              {v.description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contact */}
          <div id="contact" style={{background:'var(--dark)',padding:'4.5rem 1.5rem'}}>
            <div style={{maxWidth:700,margin:'0 auto'}}>
              <span style={{fontSize:'.65rem',letterSpacing:'.24em',textTransform:'uppercase',color:'var(--rose)',fontWeight:500,display:'block',textAlign:'center',marginBottom:'.5rem'}}>Get In Touch</span>
              <h2 style={{fontFamily:'var(--fd)',color:'#fff',fontSize:'clamp(1.5rem,3vw,2rem)',fontWeight:400,marginBottom:'.35rem',textAlign:'center'}}>Enquire About Your Event</h2>
              <p style={{color:'rgba(255,255,255,.42)',textAlign:'center',fontSize:'.87rem',fontWeight:300,marginBottom:'2rem'}}>Fill the form below or reach out directly.</p>
              <div className="ch-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.75rem',marginBottom:'1.8rem'}}>
                {[['📞','Call Us','0450 044 942','tel:0450044942'],['✉️','Email','wsevents.info@gmail.com','mailto:wsevents.info@gmail.com'],['','WhatsApp','Message anytime','https://wa.me/61450044942'],['👍','Facebook','@westernsydneyevent','https://facebook.com/westernsydneyevent']].map(([ic,h,t,href]) => (
                  <a key={href} href={href} className="ch" style={{display:'flex',alignItems:'center',gap:'.75rem',padding:'.85rem .95rem',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',borderRadius:10,transition:'all .22s',textDecoration:'none'}}>
                    <div style={{width:33,height:33,borderRadius:'50%',flexShrink:0,background:'rgba(200,85,106,.18)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.92rem'}}>
                      {ic === '' ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20" height="20"><path fill="#fff" d="M24 4C13 4 4 13 4 24c0 3.6 1 7 2.7 9.9L4 44l10.4-2.7C17.2 43 20.5 44 24 44c11 0 20-9 20-20S35 4 24 4z"/><path fill="#25D366" d="M24 6.4C14.3 6.4 6.4 14.3 6.4 24c0 3.4 1 6.6 2.6 9.3l.4.7-1.7 6.3 6.5-1.7.7.4C17.4 40.6 20.6 41.6 24 41.6c9.7 0 17.6-7.9 17.6-17.6S33.7 6.4 24 6.4z"/><path fill="#fff" fillRule="evenodd" d="M18.2 15.2c-.4-.9-.8-.9-1.2-.9h-1c-.4 0-.9.1-1.4.7-.5.5-1.8 1.7-1.8 4.2s1.8 4.9 2.1 5.2c.3.3 3.5 5.6 8.6 7.7 4.3 1.7 5.1 1.4 6 1.3.9-.1 2.9-1.2 3.3-2.3.4-1.1.4-2.1.3-2.3-.1-.2-.4-.3-.9-.6-.4-.2-2.9-1.4-3.3-1.6-.4-.2-.7-.2-1 .2-.3.4-1.2 1.6-1.4 1.9-.3.3-.5.3-1 .1s-2-.7-3.7-2.3c-1.4-1.2-2.3-2.7-2.6-3.2-.3-.4 0-.7.2-.9l.7-.8c.2-.3.3-.5.4-.8.1-.3 0-.6-.1-.9l-1.3-3.7z"/></svg> : ic}
                    </div>
                    <div>
                      <h4 style={{fontSize:'.65rem',letterSpacing:'.09em',textTransform:'uppercase',color:'var(--rose)',marginBottom:'.1rem'}}>{h}</h4>
                      <p style={{fontSize:'.84rem',color:'rgba(255,255,255,.62)',margin:0}}>{t}</p>
                    </div>
                  </a>
                ))}
              </div>
              <div style={{background:'#fff',borderRadius:13,padding:'1.8rem'}}>
                <div className="frow" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.9rem',marginBottom:'.85rem'}}>
                  <div><label style={{display:'block',fontSize:'.67rem',letterSpacing:'.11em',textTransform:'uppercase',color:'var(--gray)',marginBottom:'.33rem',fontWeight:500}}>Your Name</label><input value={cName} onChange={e=>setCName(e.target.value)} type="text" placeholder="Full name" style={{width:'100%',padding:'.67rem .88rem',border:'1.5px solid var(--cream)',background:'var(--off)',fontFamily:'var(--fb)',fontSize:'.87rem',color:'var(--dark)',borderRadius:8,outline:'none'}}/></div>
                  <div><label style={{display:'block',fontSize:'.67rem',letterSpacing:'.11em',textTransform:'uppercase',color:'var(--gray)',marginBottom:'.33rem',fontWeight:500}}>Email</label><input value={cEmail} onChange={e=>setCEmail(e.target.value)} type="email" placeholder="your@email.com" style={{width:'100%',padding:'.67rem .88rem',border:'1.5px solid var(--cream)',background:'var(--off)',fontFamily:'var(--fb)',fontSize:'.87rem',color:'var(--dark)',borderRadius:8,outline:'none'}}/></div>
                </div>
                <div style={{marginBottom:'.85rem'}}><label style={{display:'block',fontSize:'.67rem',letterSpacing:'.11em',textTransform:'uppercase',color:'var(--gray)',marginBottom:'.33rem',fontWeight:500}}>Phone</label><input value={cPhone} onChange={e=>setCPhone(e.target.value)} type="tel" placeholder="04XX XXX XXX" style={{width:'100%',padding:'.67rem .88rem',border:'1.5px solid var(--cream)',background:'var(--off)',fontFamily:'var(--fb)',fontSize:'.87rem',color:'var(--dark)',borderRadius:8,outline:'none'}}/></div>
                <div style={{marginBottom:'.85rem'}}><label style={{display:'block',fontSize:'.67rem',letterSpacing:'.11em',textTransform:'uppercase',color:'var(--gray)',marginBottom:'.33rem',fontWeight:500}}>Message</label><textarea value={cMsg} onChange={e=>setCMsg(e.target.value)} placeholder="Event date, type, theme ideas..." rows={3} style={{width:'100%',padding:'.67rem .88rem',border:'1.5px solid var(--cream)',background:'var(--off)',fontFamily:'var(--fb)',fontSize:'.87rem',color:'var(--dark)',borderRadius:8,outline:'none',resize:'vertical'}}/></div>
                <div style={{display:'flex',alignItems:'center',gap:'.75rem',marginBottom:'.85rem'}}>
                  <label style={{display:'inline-flex',alignItems:'center',gap:'.4rem',padding:'.52rem .95rem',border:'1.5px dashed var(--rose)',borderRadius:8,color:'var(--rose)',fontSize:'.79rem',cursor:'pointer',background:'var(--off)',fontFamily:'var(--fb)'}}>
                    📎 Upload ref pic
                    <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>setCFile(e.target.files[0]?.name||'')}/>
                  </label>
                  <span style={{fontSize:'.77rem',color:'var(--gray-lt)'}}>{cFile||'No file chosen'}</span>
                </div>
                <button onClick={sendEnq} style={{width:'100%',padding:'.82rem',background:'var(--rose)',color:'#fff',fontSize:'.87rem',fontWeight:500,borderRadius:8,border:'none',cursor:'pointer',fontFamily:'var(--fb)'}}>Submit Enquiry →</button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer style={{background:'var(--mid)',borderTop:'1px solid rgba(255,255,255,.05)',padding:'2.8rem 1.5rem 2rem'}}>
            <div className="ft-in" style={{maxWidth:1300,margin:'0 auto',display:'grid',gridTemplateColumns:'1.4fr 1fr 1fr',gap:'2.8rem'}}>
              <div>
                <div style={{fontFamily:'var(--fd)',fontSize:'1.2rem',color:'#fff',marginBottom:'.55rem'}}>Western Sydney <span style={{color:'var(--rose)'}}>Events</span></div>
                <p style={{fontSize:'.79rem',color:'rgba(255,255,255,.32)',fontWeight:300,lineHeight:1.75,maxWidth:250}}>Leading Event Management group offering the best decoration services across Western Sydney. Call: 0450 044 942</p>
              </div>
              <div>
                <h4 style={{fontSize:'.63rem',letterSpacing:'.19em',textTransform:'uppercase',color:'var(--rose)',marginBottom:'.85rem',fontWeight:500}}>Our Services</h4>
                <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:'.42rem'}}>
                  {Object.entries(CATS).map(([slug,cat]) => <li key={slug}><a onClick={() => openCat(slug)} style={{fontSize:'.79rem',color:'rgba(255,255,255,.32)',cursor:'pointer',transition:'color .2s'}}>{cat.name}</a></li>)}
                </ul>
              </div>
              <div>
                <h4 style={{fontSize:'.63rem',letterSpacing:'.19em',textTransform:'uppercase',color:'var(--rose)',marginBottom:'.85rem',fontWeight:500}}>Contact Us</h4>
                <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:'.42rem'}}>
                  {[['📞 0450 044 942','tel:0450044942'],['✉️ wsevents.info@gmail.com','mailto:wsevents.info@gmail.com'],['👍 Facebook Page','https://facebook.com/westernsydneyevent'],['WhatsApp Us','https://wa.me/61450044942']].map(([t,h]) => <li key={h}><a href={h} style={{fontSize:'.79rem',color:'rgba(255,255,255,.32)',transition:'color .2s',textDecoration:'none'}}>{t}</a></li>)}
                </ul>
              </div>
            </div>
            <div style={{maxWidth:1300,margin:'1.8rem auto 0',paddingTop:'1.4rem',borderTop:'1px solid rgba(255,255,255,.05)',display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:'.4rem',fontSize:'.71rem',color:'rgba(255,255,255,.22)'}}>
              <span>© 2025 Western Sydney Events. All rights reserved.</span>
              <span>Western Sydney, NSW, Australia</span>
            </div>
          </footer>
        </div>
      )}

      {/* GALLERY PAGE */}
      {page === 'gallery' && cat && (
        <div style={{marginTop:62}}>
          <div style={{background:'var(--dark)',padding:'2.6rem 1.5rem 2rem',textAlign:'center',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',inset:0,opacity:.13,background:'url(https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=50) center/cover'}}/>
            <div style={{position:'relative',zIndex:1}}>
              <div style={{display:'inline-flex',alignItems:'center',background:'rgba(200,85,106,.2)',color:'#F9D0D9',border:'1px solid rgba(200,85,106,.3)',fontSize:'.63rem',letterSpacing:'.2em',textTransform:'uppercase',padding:'.2rem .75rem',borderRadius:100,marginBottom:'.65rem'}}>{cat.tag}</div>
              <h1 style={{fontFamily:'var(--fd)',color:'#fff',fontSize:'clamp(1.8rem,5vw,3rem)',fontWeight:400,marginBottom:'.28rem'}}>{cat.name}</h1>
              <p style={{color:'rgba(255,255,255,.42)',fontSize:'.87rem',fontWeight:300}}>{cat.desc}</p>
            </div>
          </div>
          <div style={{background:'#fff',borderBottom:'1px solid var(--cream)',padding:'.6rem 1.5rem',display:'flex',alignItems:'center',gap:'.45rem',fontSize:'.74rem',color:'var(--gray)',flexWrap:'wrap'}}>
            <a onClick={() => setPage('home')} style={{color:'var(--rose)',cursor:'pointer'}}>Home</a>
            <span>›</span><span>{cat.name}</span>
            <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:'.55rem'}}>
              <span style={{color:'var(--gray)'}}>{items.length} item{items.length!==1?'s':''}</span>
              <select onChange={e=>{setSortOrder(e.target.value);openCat(curCat,e.target.value)}} value={sortOrder} style={{padding:'.28rem .55rem',border:'1px solid var(--cream)',borderRadius:6,fontFamily:'var(--fb)',fontSize:'.74rem',color:'var(--dark)',background:'#fff',cursor:'pointer'}}>
                <option value="new">Newest first</option>
                <option value="old">Oldest first</option>
              </select>
            </div>
          </div>
          <div style={{maxWidth:1300,margin:'0 auto',padding:'1.8rem 1.5rem 5rem'}}>
            {loading ? (
              <div className="photo-grid" style={s.photoGrid}>
                {Array(8).fill(0).map((_,i) => <div key={i} style={{...s.skel,backgroundImage:'linear-gradient(90deg,var(--cream) 25%,#ede5e0 50%,var(--cream) 75%)',backgroundSize:'200% 100%'}}/>)}
              </div>
            ) : galleryError ? (
              <div style={{textAlign:'center',padding:'5rem 1.5rem',color:'var(--gray)'}}>
                <div style={{fontSize:'2.8rem',marginBottom:'.9rem'}}>⚠️</div>
                <h3 style={{fontFamily:'var(--fd)',fontSize:'1.25rem',color:'var(--mid)',marginBottom:'.5rem'}}>Gallery failed to load</h3>
                <p style={{fontSize:'.84rem',fontWeight:300,marginBottom:'1rem',maxWidth:440,margin:'0 auto .8rem'}}>{galleryError}</p>
                <p style={{fontSize:'.78rem',color:'var(--gray-lt)',maxWidth:440,margin:'0 auto',lineHeight:1.7}}>
                  If you just deployed: make sure <strong style={{color:'var(--dark)'}}>MONGODB_URI</strong> is set in your Vercel environment variables and you have redeployed after adding it.
                </p>
                <button onClick={() => openCat(curCat)} style={{marginTop:'1.2rem',padding:'.6rem 1.5rem',background:'var(--rose)',color:'#fff',border:'none',borderRadius:100,fontSize:'.8rem',cursor:'pointer',fontFamily:'var(--fb)'}}>Try Again</button>
              </div>
            ) : items.length === 0 ? (
              <div style={{textAlign:'center',padding:'5rem 1.5rem',color:'var(--gray)'}}>
                <div style={{fontSize:'2.8rem',opacity:.3,marginBottom:'.9rem'}}>📷</div>
                <h3 style={{fontFamily:'var(--fd)',fontSize:'1.25rem',color:'var(--mid)',marginBottom:'.35rem'}}>No photos yet</h3>
                <p style={{fontSize:'.84rem',fontWeight:300}}>Check back soon — photos are being added.</p>
              </div>
            ) : (
              <div className="photo-grid" style={s.photoGrid}>
                {items.map((item, i) => (
                  <div key={item.id} className="photo-cell" style={s.photoCell} onClick={() => { setLbIdx(i); setLbOpen(true); }}>
                    <div style={{position:'absolute',inset:0,overflow:'hidden'}}>
                      {item.type === 'video'
                        ? <video src={item.src} muted loop playsInline preload="metadata" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',transition:'transform .45s'}} onMouseEnter={e=>e.target.play()} onMouseLeave={e=>{e.target.pause();e.target.currentTime=0}}/>
                        : <img src={item.thumb||item.src} alt={item.cap||cat.name} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',objectPosition:'center',transition:'transform .45s'}} loading="lazy"/>
                      }
                    </div>
                    <div className="photo-ov" style={{position:'absolute',inset:0,borderRadius:7,background:'rgba(24,16,14,.48)',opacity:0,transition:'opacity .28s',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <div style={{width:38,height:38,borderRadius:'50%',background:'rgba(255,255,255,.14)',border:'1px solid rgba(255,255,255,.3)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'.9rem',backdropFilter:'blur(4px)'}}>⊕</div>
                    </div>
                    {item.type==='video' && <div style={{position:'absolute',top:'.45rem',left:'.45rem',background:'rgba(0,0,0,.58)',color:'#fff',fontSize:'.6rem',letterSpacing:'.07em',textTransform:'uppercase',padding:'.18rem .45rem',borderRadius:4}}>▶ Video</div>}
                  </div>
                ))}
              </div>
            )}

            {/* ── Category Videos ── */}
            {catVideos.length > 0 && (
              <div style={{marginTop:'3rem',paddingTop:'2.5rem',borderTop:'1px solid var(--cream)'}}>
                <div style={{marginBottom:'1.6rem'}}>
                  <span style={{fontSize:'.65rem',letterSpacing:'.22em',textTransform:'uppercase',color:'var(--rose)',fontWeight:500,display:'block',marginBottom:'.3rem'}}>Video Highlights</span>
                  <h3 style={{fontFamily:'var(--fd)',fontSize:'clamp(1.4rem,3vw,2rem)',fontWeight:400,color:'var(--dark)'}}>Related Videos</h3>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,300px),1fr))',gap:'1.2rem'}}>
                  {catVideos.map(v => (
                    <div key={v.id} style={{borderRadius:10,overflow:'hidden',background:'var(--dark)',boxShadow:'var(--sh)',transition:'transform .3s'}}>
                      <div style={{position:'relative',paddingBottom:'56.25%',background:'#000'}}>
                        {activeVideo===v.youtubeId ? (
                          <iframe
                            src={`https://www.youtube.com/embed/${v.youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                            title={v.title||'Event video'}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{position:'absolute',inset:0,width:'100%',height:'100%',border:'none'}}
                          />
                        ) : (
                          <div style={{position:'absolute',inset:0,cursor:'pointer'}} onClick={()=>setActiveVideo(v.youtubeId)}>
                            <img
                              src={v.thumbUrl}
                              alt={v.title||'video'}
                              onError={e=>{if(e.target.src.includes('maxresdefault'))e.target.src=e.target.src.replace('maxresdefault','hqdefault')}}
                              style={{width:'100%',height:'100%',objectFit:'cover',display:'block',position:'absolute',inset:0}}
                            />
                            <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                              <div style={{width:52,height:52,borderRadius:'50%',background:'rgba(200,85,106,.9)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 20px rgba(200,85,106,.5)'}}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div style={{padding:'.9rem 1rem 1rem'}}>
                        {v.title && <div style={{fontFamily:'var(--fd)',color:'#fff',fontSize:'.95rem',fontWeight:400,marginBottom:'.25rem',lineHeight:1.35}}>{v.title}</div>}
                        {v.description && <div style={{fontSize:'.75rem',color:'rgba(255,255,255,.45)',lineHeight:1.6,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{v.description}</div>}
                        <a href={v.watchUrl} target="_blank" rel="noopener noreferrer"
                          style={{display:'inline-flex',alignItems:'center',gap:'.3rem',marginTop:'.6rem',fontSize:'.7rem',color:'var(--rose)',textDecoration:'none'}}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="#FF0000"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8z"/><path d="M9.6 15.6V8.4l6.3 3.6-6.3 3.6z" fill="white"/></svg>
                          Watch on YouTube
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LIGHTBOX */}
      {lbOpen && lbItem && (
        <div className="lb-overlay" onClick={() => setLbOpen(false)}>
          <button style={{position:'fixed',top:'1rem',right:'1rem',width:40,height:40,borderRadius:'50%',border:'1px solid rgba(255,255,255,.25)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1rem',cursor:'pointer',background:'rgba(0,0,0,.3)',zIndex:1}} onClick={() => setLbOpen(false)}>✕</button>
          <button className="lb-nav" style={{left:'1rem'}} onClick={e=>{e.stopPropagation();navLB(-1)}}>‹</button>
          <div onClick={e=>e.stopPropagation()}>
            {lbItem.type==='video'
              ? <video className="lb-vid" src={lbItem.src} controls autoPlay/>
              : <img className="lb-img" src={lbItem.src} alt={lbItem.cap||''}/>
            }
          </div>
          <button className="lb-nav" style={{right:'1rem'}} onClick={e=>{e.stopPropagation();navLB(1)}}>›</button>
          <div style={{position:'fixed',bottom:'1rem',left:'50%',transform:'translateX(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:'.28rem'}}>
            <div style={{background:'rgba(0,0,0,.5)',color:'rgba(255,255,255,.55)',fontSize:'.73rem',padding:'.23rem .75rem',borderRadius:100,backdropFilter:'blur(4px)'}}>{lbIdx+1} / {items.length}</div>
            {lbItem.cap && <div style={{color:'rgba(255,255,255,.45)',fontSize:'.76rem',maxWidth:320,textAlign:'center'}}>{lbItem.cap}</div>}
          </div>
        </div>
      )}

      {/* WhatsApp float */}
      <a href="https://wa.me/61450044942" style={s.wa} aria-label="Chat on WhatsApp">{WA_SVG}</a>

      {/* Toast */}
      <div className={`toast${toast?' show':''}`}>{toast}</div>

      <style>{`@keyframes hpan{from{transform:scale(1.04) translate(-1%,0)}to{transform:scale(1.04) translate(1%,-1%)}}`}</style>
    </>
  );
}
