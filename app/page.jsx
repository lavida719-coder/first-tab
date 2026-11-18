'use client';

import { useEffect, useRef, useState } from 'react';

const heroSlides = [
  { image: 'snowy-pines', title: '눈 덮인 소나무 숲' },
  { image: 'winter-window', title: '눈 내리는 창가' },
  { image: 'frozen-lake', title: '겨울 호숫가' },
];

function WinterHero({ children }) {
  const [slide, setSlide] = useState(0);
  const [playing, setPlaying] = useState(false);
  const swipeStart = useRef(null);

  useEffect(() => {
    setPlaying(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => setSlide((slide + 1) % heroSlides.length), 5000);
    return () => clearTimeout(timer);
  }, [playing, slide]);

  return (
    <section className="hero" aria-label="겨울 배경과 검색"
      onTouchStart={event => {
        const touch = event.changedTouches[0];
        swipeStart.current = { x: touch.clientX, y: touch.clientY };
      }}
      onTouchCancel={() => { swipeStart.current = null; }}
      onTouchEnd={event => {
        const start = swipeStart.current;
        swipeStart.current = null;
        if (!start) return;
        const touch = event.changedTouches[0];
        const distance = touch.clientX - start.x;
        if (Math.abs(distance) < 45 || Math.abs(distance) <= Math.abs(touch.clientY - start.y)) return;
        setSlide(current => (current + (distance < 0 ? 1 : -1) + heroSlides.length) % heroSlides.length);
      }}>
      <div className="hero-images" aria-hidden="true">
        {heroSlides.map(({ image }, index) => <div key={image}
          className={index === slide ? 'hero-image active' : 'hero-image'}
          style={{ backgroundImage: `url(/images/winter/${image}.webp)` }} />)}
      </div>
      {children}
      <div className="hero-controls" role="group" aria-label="겨울 배경 바꾸기">
        {heroSlides.map(({ image, title }, index) => <button key={image} type="button"
          aria-label={title} aria-pressed={index === slide} onClick={() => setSlide(index)}>
          <span className="hero-dot" aria-hidden="true" />
        </button>)}
        <button className="hero-toggle" type="button" onClick={() => setPlaying(value => !value)}>
          {playing ? '일시정지' : '자동 재생'}
        </button>
      </div>
    </section>
  );
}

const engines = {
  네이버: 'https://search.naver.com/search.naver?query=',
  구글: 'https://www.google.com/search?q=',
  유튜브: 'https://www.youtube.com/results?search_query=',
};
const initialLinks = [
  { id: 'naver', name: '네이버', url: 'https://www.naver.com' },
  { id: 'google', name: '구글', url: 'https://www.google.com' },
  { id: 'youtube', name: '유튜브', url: 'https://www.youtube.com' },
  { id: 'maps', name: '지도', url: 'https://map.naver.com' },
  { id: 'calendar', name: '캘린더', url: 'https://calendar.google.com' },
  { id: 'github', name: 'GitHub', url: 'https://github.com' },
];

function useSaved(key, initialValue) {
  const [value, setValue] = useState(initialValue);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) setValue(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  }, [key]);
  useEffect(() => {
    if (loaded) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
    }
  }, [key, loaded, value]);
  return [value, setValue];
}

export default function Home() {
  const [engine, setEngine] = useSaved('first-tab-engine', '네이버');
  const [links, setLinks] = useSaved('first-tab-links', initialLinks);
  const [tasks, setTasks] = useSaved('first-tab-tasks', []);
  const [now, setNow] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: '', url: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  function saveLink(event) {
    event.preventDefault();
    const name = draft.name.trim();
    const address = draft.url.trim();
    if (!name || !address) return;
    try {
      const url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(address) ? address : 'https://' + address);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error();
      const item = { id: draft.id ?? crypto.randomUUID(), name, url: url.href };
      setLinks(previous => draft.id ? previous.map(link => link.id === draft.id ? item : link) : [...previous, item]);
      setDraft({ name: '', url: '' });
      setError('');
    } catch {
      setError('웹사이트 주소를 확인해 주세요.');
    }
  }

  function moveLink(index, offset) {
    setLinks(previous => {
      const next = [...previous];
      [next[index], next[index + offset]] = [next[index + offset], next[index]];
      return next;
    });
  }

  function addTask(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const title = new FormData(form).get('title').trim();
    if (!title) return;
    setTasks(previous => [...previous, { id: crypto.randomUUID(), title, done: false }]);
    form.reset();
  }

  return (
    <main>
      <header className="brand"><span aria-hidden="true">❄︎</span> 첫 탭</header>
      <div className="dashboard">
        <section className="workspace" aria-label="검색과 바로가기">
          <WinterHero>
            <div className="clock">
              <p>{now?.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}</p>
              <h1>{now?.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) ?? '--:--'}</h1>
            </div>
            <form className="search" role="search" onSubmit={event => {
              event.preventDefault();
              const query = new FormData(event.currentTarget).get('query').trim();
              if (query) window.location.assign(engines[engine] + encodeURIComponent(query));
            }}>
              <select aria-label="검색 엔진" value={engine} onChange={event => setEngine(event.target.value)}>
                {Object.keys(engines).map(name => <option key={name}>{name}</option>)}
              </select>
              <input name="query" type="search" aria-label="검색어" placeholder="무엇을 찾고 있나요?" required />
              <button className="primary">검색</button>
            </form>
          </WinterHero>
          <div className="heading"><h2>바로가기</h2><button onClick={() => {
            setEditing(!editing);
            setDraft({ name: '', url: '' });
            setError('');
          }}>{editing ? '완료' : '편집'}</button></div>
          <ul className="links">
            {links.map((link, index) => <li key={link.id}>
              {editing ? <button className="tile" onClick={() => { setDraft(link); setError(''); }}>
                <span aria-hidden="true">{link.name[0]}</span>{link.name}
              </button> : <a className="tile" href={link.url}>
                <span aria-hidden="true">{link.name[0]}</span>{link.name}
              </a>}
              {editing && <div className="actions">
                <button aria-label={link.name + ' 앞으로 이동'} disabled={index === 0} onClick={() => moveLink(index, -1)}>←</button>
                <button aria-label={link.name + ' 뒤로 이동'} disabled={index === links.length - 1} onClick={() => moveLink(index, 1)}>→</button>
                <button aria-label={link.name + ' 삭제'} onClick={() => {
                  setLinks(previous => previous.filter(item => item.id !== link.id));
                  if (draft.id === link.id) { setDraft({ name: '', url: '' }); setError(''); }
                }}>×</button>
              </div>}
            </li>)}
          </ul>
          {editing && <form className="link-form" onSubmit={saveLink}>
            <label>이름<input required maxLength={30} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} /></label>
            <label>주소<input required placeholder="example.com" value={draft.url} onChange={event => setDraft({ ...draft, url: event.target.value })} /></label>
            <button className="primary">{draft.id ? '저장' : '추가'}</button>
            {draft.id && <button type="button" onClick={() => { setDraft({ name: '', url: '' }); setError(''); }}>취소</button>}
            {error && <p role="alert">{error}</p>}
          </form>}
        </section>
        <aside className="tasks" aria-labelledby="tasks-heading">
          <div className="heading"><h2 id="tasks-heading">오늘 할 일</h2><span>{tasks.filter(task => task.done).length}/{tasks.length}</span></div>
          <form className="task-form" onSubmit={addTask}>
            <input name="title" aria-label="새 할 일" maxLength={100} placeholder="할 일 추가" required />
            <button className="primary" aria-label="할 일 추가">+</button>
          </form>
          {tasks.length === 0 && <p className="empty">아직 등록한 할 일이 없어요.</p>}
          <ul>{tasks.map(task => <li key={task.id}>
            <label><input type="checkbox" checked={task.done} onChange={event => {
              const done = event.target.checked;
              setTasks(previous => previous.map(item => item.id === task.id ? { ...item, done } : item));
            }} /><span>{task.title}</span></label>
            <button aria-label={task.title + ' 삭제'} onClick={() => setTasks(previous => previous.filter(item => item.id !== task.id))}>×</button>
          </li>)}</ul>
        </aside>
      </div>
    </main>
  );
}
