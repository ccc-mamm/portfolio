window.PORTFOLIO_READY.then(() => {
  'use strict';
  const data = window.PORTFOLIO;
  if (!data) return;
  const $ = (id) => document.getElementById(id);
  const esc = (text) => String(text ?? '').replace(/[&<>"']/g, (x) => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[x]));
  const safeImage = (path) => typeof path === 'string' && /^(assets\/|\.\/assets\/)[\w\u4e00-\u9fff./() -]+\.(png|jpg|jpeg|webp|gif)$/i.test(path) ? path : '';
  const lineBreaks = (text) => esc(text).replace(/\n/g, '<br>');
  let activeFilter = '全部';
  let previousFocus = null;
  $('navBrand').textContent = data.englishName;
  $('coverName').textContent = data.englishName;
  $('footerName').textContent = data.englishName;
  $('footerLocation').textContent = data.location;
  $('year').textContent = new Date().getFullYear();
  $('tagline').innerHTML = String(data.tagline).split('\n').map((line,i) => `<span class="line ${i ? 'em' : ''}">${esc(line)}</span>`).join('');
  $('intro').textContent = data.intro;
  $('aboutDesc').textContent = data.intro;
  $('stats').innerHTML = data.stats.map(s => `<div class="stat"><strong>${esc(s.value)}</strong><small>${esc(s.label)}</small></div>`).join('');
  $('expertise').innerHTML = data.expertise.map(x=> `<div class="capability"><span class="num">${esc(x.number)}</span><div><h3>${esc(x.title)}</h3><p>${esc(x.desc)}</p></div></div>`).join('');
  $('emailLink').href = `mailto:${encodeURIComponent(data.email)}`;
  if (data.resumeUrl && safeImage(data.resumeUrl) === '') {
    // Only local PDF files are allowed for the resume button.
    if (/^assets\/[\w\u4e00-\u9fff.() -]+\.pdf$/i.test(data.resumeUrl)) {
      $('resumeSlot').innerHTML = `<a class="btn" style="margin-left:10px" href="${esc(data.resumeUrl)}" target="_blank" rel="noopener">查看简历 ↗</a>`;
    }
  }
  document.title = `${data.name} | 个人作品集`;

  const projects = data.projects || [];
  const categories = ['全部', ...new Set(projects.map(p=>p.category))];
  function renderFilters() {
    $('filters').innerHTML = categories.map(cat => `<button type="button" class="filter ${cat===activeFilter?'active':''}" aria-pressed="${cat===activeFilter}" data-filter="${esc(cat)}">${esc(cat)}</button>`).join('');
    $('filters').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{activeFilter=b.dataset.filter; renderFilters();renderProjects();}));
  }
  function imageMarkup(p) {
    const src=safeImage(p.image);
    return `<div class="projectImage ${src?'hasImage':''}" style="--accent:${/^#[0-9a-f]{6}$/i.test(p.accent||'')?p.accent:'#c9d6ce'}">${src?`<img src="${esc(src)}" alt="${esc(p.title)}封面" loading="lazy">`:`<div class="orb"></div><span class="placeholder">${esc(p.number)}</span>`}<span class="coverLabel">${esc(p.category)}</span></div>`;
  }
  function renderProjects() {
    const list=projects.filter(p=>activeFilter==='全部'||p.category===activeFilter);
    $('projectGrid').innerHTML=list.length?list.map(p=>`<button class="projectCard" data-id="${esc(p.id)}" aria-label="查看${esc(p.title)}详情">${imageMarkup(p)}<div class="projectBody"><div class="meta"><span>PROJECT / ${esc(p.number)}</span><span>${esc(p.year)}</span></div><h3>${esc(p.title)}</h3><p>${esc(p.teaser)}</p><div class="tagRow">${(p.tags||[]).map(x=>`<span class="tag">${esc(x)}</span>`).join('')}<span class="projectArrow">↗</span></div></div></button>`).join(''):'<p class="empty">此分类暂时没有项目。</p>';
    $('projectGrid').querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>openProject(btn.dataset.id)));
  }
  function detailRow(label, content) { return `<div class="detailGrid"><h3>${esc(label)}</h3><div>${content}</div></div>`; }
  function openProject(id) {
    const p=projects.find(x=>x.id===id); if(!p)return;
    previousFocus=document.activeElement;
    const src=safeImage(p.image);
    const gallery=(p.gallery||[]).map(safeImage).filter(Boolean);
    $('detailContent').innerHTML=`<div class="eyebrow">PROJECT / ${esc(p.number)} — ${esc(p.category)}</div><h2>${esc(p.title)}</h2><p class="lede">${esc(p.teaser)}</p><div class="detailHero" style="background:${/^#[0-9a-f]{6}$/i.test(p.accent||'')?p.accent:'#c9d6ce'}">${src?`<img src="${esc(src)}" alt="${esc(p.title)}项目主图">`:`<span>${esc(p.number)}</span>`}</div>${detailRow('项目背景',`<p>${lineBreaks(p.overview)}</p>`)}${detailRow('我的职责',`<p>${lineBreaks(p.role)}</p>`)}${detailRow('关键行动',`<ol>${(p.actions||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`)}${detailRow('结果与价值',`<p>${lineBreaks(p.outcome)}</p>`)}${gallery.length?`<h3 style="margin-top:35px">项目图片 · 点击放大</h3><div class="gallery">${gallery.map((img,i)=>`<button type="button" aria-label="放大第${i+1}张图片" data-image="${esc(img)}"><img src="${esc(img)}" loading="lazy" alt="项目作品 ${i+1}"></button>`).join('')}</div>`:''}`;
    $('overlay').classList.add('open'); document.body.classList.add('lock'); $('dialog').scrollTop=0; $('closeModal').focus();
    $('detailContent').querySelectorAll('[data-image]').forEach(el=>el.addEventListener('click',()=>openImage(el.dataset.image)));
  }
  function closeProject(){ if($('lightbox').classList.contains('open')){closeImage();return;} $('overlay').classList.remove('open'); document.body.classList.remove('lock');previousFocus?.focus(); }
  function openImage(src){$('lightboxImage').src=src;$('lightbox').classList.add('open');$('lightbox').focus();}
  function closeImage(){$('lightbox').classList.remove('open');$('lightboxImage').removeAttribute('src');$('closeModal').focus();}
  $('closeModal').addEventListener('click',closeProject);
  $('overlay').addEventListener('click',e=>{if(e.target===$('overlay'))closeProject();});
  $('lightbox').addEventListener('click',closeImage);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if($('lightbox').classList.contains('open'))closeImage();else if($('overlay').classList.contains('open'))closeProject();}});
  $('menuBtn').addEventListener('click',()=>{let open=$('mainNav').classList.toggle('show');$('menuBtn').setAttribute('aria-expanded',String(open));});
  $('mainNav').querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{$('mainNav').classList.remove('show');$('menuBtn').setAttribute('aria-expanded','false');}));
  renderFilters();renderProjects();
})();
