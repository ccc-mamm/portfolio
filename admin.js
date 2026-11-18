(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const clean = s => String(s ?? '');
  const html = s => clean(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clone = x => JSON.parse(JSON.stringify(x));
  const initial = clone(window.PORTFOLIO || {projects:[]});
  const sessionKey = 'portfolio-github-session-v1';
  const draftKey = 'portfolio-local-draft-v1';
  const fields = ['title','category','year','tags','teaser','overview','role','actions','outcome'];
  const profileFields = ['name','englishName','role','location','email','resumeUrl','tagline','intro','stats','expertise'];
  let state = clone(initial), editorId = null, connected = false, fileMap = new Map(), busy = false, dirty = false;
  let repo = {owner:'',name:'',branch:'main',token:''};
  try { Object.assign(repo, JSON.parse(sessionStorage.getItem(sessionKey)||'{}')); } catch {}
  $('repoOwner').value = repo.owner; $('repoName').value = repo.name; $('repoBranch').value = repo.branch; $('accessToken').value = repo.token || '';
  function alertMsg(msg,warning=false){ const el=$('alert'); el.textContent=msg; el.className='show'+(warning?' warn':''); }
  function log(msg){ $('publishLog').textContent += (msg+'\n'); $('publishLog').scrollTop=$('publishLog').scrollHeight; }
  function markDirty(){ dirty=true; $('draftLabel').textContent='● 有未发布的修改'; }
  function markPublished(){dirty=false; $('draftLabel').textContent='✓ 已同步发布';}
  function setBusy(value){ busy=value; document.querySelectorAll('.btn').forEach(x=>{if(x.id!=='logoutBtn')x.disabled=value;}); }
  function normalized(){
    state.projects.forEach((p,i)=>{ p.number=String(i+1).padStart(2,'0'); if(!p.id)p.id='project-'+crypto.randomUUID(); });
    return state;
  }
  function showTab(name){
    if(name!=='profile' && !$('profileTab').hidden) applyProfile(false);
    if(name!=='projects' && editorId) applyProject(false);
    document.querySelectorAll('.tab').forEach(x=>x.hidden=x.id!==name+'Tab');
    document.querySelectorAll('.side').forEach(x=>x.classList.toggle('active',x.dataset.tab===name));
    const m={projects:['项目管理','管理作品案例、图片和排序。'],profile:['首页资料','修改个人介绍与首页展示信息。'],deploy:['发布与设置','安全连接 GitHub 仓库，并将修改发布到公开网站。']};
    $('pageTitle').textContent=m[name][0];$('pageDesc').textContent=m[name][1];
    if(name==='profile') renderProfile();
  }
  document.querySelectorAll('.side').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
  function picture(src){ if(!src)return '';return /^blob:/.test(src)||/^(?:\.\/)?assets\/[\w\u4e00-\u9fff./() -]+\.(png|jpg|jpeg|webp|gif)$/i.test(src)?src:''; }
  function projectHtml(p,i){
    const src=picture(p.image);
    return `<div class="project-item"><div class="project-thumb">${src?`<img alt="" src="${html(src)}">`:String(i+1).padStart(2,'0')}</div><div class="project-info"><b>${html(p.title||'未命名项目')}</b><p>${html(p.category||'未分类')} · ${html(p.year||'')}　${html(p.teaser||'暂无简介')}</p></div><div class="project-controls"><button class="btn ghost" data-up="${i}" ${i===0?'disabled':''} title="上移">↑</button><button class="btn ghost" data-down="${i}" ${i===state.projects.length-1?'disabled':''} title="下移">↓</button><button class="btn secondary" data-edit="${html(p.id)}">编辑</button></div></div>`;
  }
  function renderProjects(){normalized();$('count').textContent=`${state.projects.length} 个项目`;$('projectsList').innerHTML=state.projects.length?state.projects.map(projectHtml).join(''):'<div class="editor">暂时没有项目，点击右上角创建第一个。</div>';
    $('projectsList').querySelectorAll('[data-edit]').forEach(el=>el.addEventListener('click',()=>openEditor(el.dataset.edit)));
    ['up','down'].forEach(direction=>$('projectsList').querySelectorAll(`[data-${direction}]`).forEach(el=>el.addEventListener('click',()=>{
      if(editorId) applyProject(false);
      let i=Number(el.dataset[direction]),j=i+(direction==='up'?-1:1);
      if(j<0||j>=state.projects.length)return;
      [state.projects[i],state.projects[j]]=[state.projects[j],state.projects[i]];renderProjects();markDirty();
    })));
  }
  function fillEditor(p){
    fields.forEach(k=>{$('f_'+k).value=k==='tags'||k==='actions'?(p[k]||[]).join(k==='tags'?'，':'\n'):(p[k]||'');});
  }
  function setEditorFields(p){
    fields.forEach(k=>{
      let value=$('f_'+k).value.trim();
      if(k==='tags')p[k]=value.split(/[,，、]/).map(v=>v.trim()).filter(Boolean);
      else if(k==='actions')p[k]=value.split(/\r?\n/).map(v=>v.trim()).filter(Boolean);
      else p[k]=value;
    });
  }
  function openEditor(id){
    if(editorId&&editorId!==id) applyProject(false);
    editorId=id;const p=state.projects.find(x=>x.id===id);if(!p)return;
    $('editor').hidden=false;$('editorTitle').textContent=p.title||'新项目';fillEditor(p);renderMedia(p);
    $('editor').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function applyProject(showNotice=true){
    if(!editorId)return;
    let p=state.projects.find(x=>x.id===editorId);if(!p)return;
    setEditorFields(p);renderProjects();markDirty();if(showNotice)alertMsg('项目编辑已保存到当前工作区。点击「发布网站」才会同步到公开网站。');
  }
  $('applyProject').addEventListener('click',()=>applyProject());
  $('closeEditor').addEventListener('click',()=>{applyProject(false);$('editor').hidden=true;editorId=null;});
  $('newProject').addEventListener('click',()=>{
    if(editorId)applyProject(false);
    let p={id:'project-'+crypto.randomUUID(),number:'',title:'新建项目',category:'内容运营',year:String(new Date().getFullYear()),teaser:'',tags:[],image:'',accent:'#BFC8D8',overview:'',role:'',actions:[],outcome:'',gallery:[]};
    state.projects.unshift(p);renderProjects();markDirty();openEditor(p.id);
  });
  $('deleteProject').addEventListener('click',()=>{
    if(!editorId||!confirm('确定删除这个项目？发布后将不再公开展示。此操作不会删除已经上传至 GitHub 的图片文件。'))return;
    state.projects=state.projects.filter(p=>p.id!==editorId);editorId=null;$('editor').hidden=true;renderProjects();markDirty();alertMsg('项目已从工作区移除，发布后生效。');
  });
  const suffix = f => ({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'})[f.type]||'';
  function queueFile(file){
    if(!suffix(file))throw new Error('仅支持 JPG / PNG / WebP / GIF 图片。');
    if(file.size>5*1024*1024)throw new Error('单张图片不能超过 5MB，请压缩后上传。');
    const blob=URL.createObjectURL(file);
    const path='assets/uploads/'+Date.now()+'-'+crypto.randomUUID().slice(0,10)+'.'+suffix(file);
    fileMap.set(blob,{file,path});return blob;
  }
  function renderMedia(p){
    let src=picture(p.image);
    $('coverPreview').innerHTML=src?`<img src="${html(src)}" alt="项目封面预览">`:'<span class="small-muted">尚未上传封面</span>';
    $('galleryList').innerHTML=(p.gallery||[]).map((img,i)=>`<div class="gallery-item"><img alt="图片${i+1}" src="${html(picture(img))}"><button aria-label="移除图片${i+1}" data-remove="${i}">×</button></div>`).join('');
    $('galleryList').querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click',()=>{p.gallery.splice(Number(b.dataset.remove),1);renderMedia(p);markDirty();}));
  }
  $('coverFile').addEventListener('change',e=>{
    const file=e.target.files[0]; if(!file||!editorId)return;
    try{let p=state.projects.find(x=>x.id===editorId);p.image=queueFile(file);renderMedia(p);markDirty();}
    catch(err){alertMsg(err.message,true);}e.target.value='';
  });
  $('galleryFiles').addEventListener('change',e=>{
    if(!editorId)return;
    const p=state.projects.find(x=>x.id===editorId);let failed=[];
    for(const f of e.target.files){try{p.gallery.push(queueFile(f));}catch(err){failed.push(f.name+': '+err.message);}}
    renderMedia(p);markDirty();if(failed.length)alertMsg(failed.join('；'),true);e.target.value='';
  });
  $('removeCover').addEventListener('click',()=>{let p=state.projects.find(x=>x.id===editorId);if(p){p.image='';renderMedia(p);markDirty();}});
  function renderProfile(){
    profileFields.forEach(k=>{
      let val=state[k]??'';
      if(k==='stats')val=(state.stats||[]).map(x=>x.value+' | '+x.label).join('\n');
      if(k==='expertise')val=(state.expertise||[]).map(x=>x.title+' | '+x.desc).join('\n');
      $('p_'+k).value=val;
    });
  }
  function applyProfile(showNotice=true){
    profileFields.forEach(k=>{
      let val=$('p_'+k).value;
      if(k==='stats')state.stats=val.split('\n').filter(x=>x.trim()).map(x=>{const a=x.split('|');return {value:(a[0]||'').trim(),label:a.slice(1).join('|').trim()};});
      else if(k==='expertise')state.expertise=val.split('\n').filter(x=>x.trim()).map((x,i)=>{const a=x.split('|');return {number:String(i+1).padStart(2,'0'),title:(a[0]||'').trim(),desc:a.slice(1).join('|').trim()};});
      else state[k]=val;
    });markDirty();if(showNotice)alertMsg('首页资料已保存到当前工作区。发布后生效。');
  }
  $('applyProfile').addEventListener('click',()=>applyProfile());
  $('profileTab').querySelectorAll('input, textarea').forEach(el=>el.addEventListener('change',()=>markDirty()));
  $('editor').querySelectorAll('input, textarea').forEach(el=>{if(el.type!=='file')el.addEventListener('change',()=>markDirty());});
  const stagedCount=()=>[...fileMap.keys()].filter(key=>state.projects.some(p=>p.image===key||(p.gallery||[]).includes(key))).length;
  function stableState(){
    const d=clone(normalized());
    d.projects.forEach(p=>{if(p.image.startsWith('blob:'))p.image='';p.gallery=p.gallery.filter(x=>!x.startsWith('blob:'));});
    return d;
  }
  function saveDraft(){
    if(editorId)applyProject(false);
    if(!$('profileTab').hidden)applyProfile(false);
    try{localStorage.setItem(draftKey,JSON.stringify(stableState()));alertMsg(stagedCount()?`文字草稿已保存在此浏览器中。另有 ${stagedCount()} 张未发布图片需在当前页面发布，刷新后需重新选择。`:'草稿已保存在此浏览器中。公开网站尚未更新。');}
    catch(err){alertMsg('浏览器草稿保存失败，请导出 JSON 备份。',true);}
  }
  $('saveDraft').addEventListener('click',saveDraft);
  function settings(){return {owner:$('repoOwner').value.trim(),name:$('repoName').value.trim(),branch:$('repoBranch').value.trim()||'main',token:$('accessToken').value.trim()};}
  function validSettings(s){if(!/^[\w.-]+$/.test(s.owner)||!/^[\w.-]+$/.test(s.name)||!s.branch||!s.token)throw new Error('请填写正确的所有者、仓库、分支和 GitHub Token。');}
  function apiRoot(s){return `https://api.github.com/repos/${encodeURIComponent(s.owner)}/${encodeURIComponent(s.name)}`;}
  async function github(s,url,opt={}){
    const res=await fetch(url,{...opt,headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${s.token}`,'X-GitHub-Api-Version':'2022-11-28',...(opt.headers||{})}});
    let data={};try{data=await res.json();}catch{}
    if(!res.ok){let reason=data.message||res.statusText;throw new Error(`GitHub ${res.status}：${reason}${res.status===401?'（检查令牌）':''}${res.status===403?'（检查仓库 Contents 写入权限）':''}`);}
    return data;
  }
  async function verify(){
    const s=settings();validSettings(s);
    const user=await github(s,'https://api.github.com/user');
    await github(s,apiRoot(s)+'/branches/'+encodeURIComponent(s.branch));
    const repoInfo=await github(s,apiRoot(s));
    if(!repoInfo.permissions?.push)throw new Error('当前 GitHub 账号对该仓库没有写入权限，请检查仓库归属和令牌权限。');
    repo=s;connected=true;sessionStorage.setItem(sessionKey,JSON.stringify(s));
    $('connectionTag').textContent=`● 已连接 ${s.owner}/${s.name}`;$('loginStatus').textContent=`已认证 @${user.login}`;alertMsg(`连接成功：${s.owner}/${s.name}（${s.branch}）。可以发布。`);
  }
  $('connectBtn').addEventListener('click',async()=>{setBusy(true);try{await verify();}catch(e){connected=false;alertMsg(e.message,true);}finally{setBusy(false);}});
  $('logoutBtn').addEventListener('click',()=>{sessionStorage.removeItem(sessionKey);repo.token='';connected=false;$('accessToken').value='';$('connectionTag').textContent='● 尚未连接 GitHub';$('loginStatus').textContent='已断开连接';alertMsg('已断开连接，令牌已从当前标签页会话中清除。');});
  const toBase64 = async file => {
    const bytes=new Uint8Array(await file.arrayBuffer());let binary='';const step=0x8000;
    for(let i=0;i<bytes.length;i+=step)binary+=String.fromCharCode(...bytes.subarray(i,i+step));
    return btoa(binary);
  };
  const encodeJson = object => toBase64(new Blob([JSON.stringify(object,null,2)+'\n'],{type:'application/json'}));
  async function getSha(s,path){
    const url=apiRoot(s)+'/contents/'+path.split('/').map(encodeURIComponent).join('/')+'?ref='+encodeURIComponent(s.branch);
    const r=await fetch(url,{headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${s.token}`,'X-GitHub-Api-Version':'2022-11-28'}});
    if(r.status===404)return null;
    const obj=await r.json();if(!r.ok)throw new Error(`读取 ${path} 失败：${obj.message||r.status}`);return obj.sha;
  }
  async function putFile(s,path,content,message){
    const sha=await getSha(s,path),body={message,branch:s.branch,content};if(sha)body.sha=sha;
    return github(s,apiRoot(s)+'/contents/'+path.split('/').map(encodeURIComponent).join('/'),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  }
  async function publish(){
    if(busy)return;
    if(editorId)applyProject(false);
    if(!$('profileTab').hidden)applyProfile(false);
    const s=settings();setBusy(true);$('publishLog').textContent='';
    try{
      validSettings(s);
      if(!connected||repo.owner!==s.owner||repo.name!==s.name||repo.branch!==s.branch||repo.token!==s.token){await verify();}
      const pending=[];
      for(const p of state.projects){for(const src of [p.image,...(p.gallery||[])])if(fileMap.has(src)&&!pending.some(x=>x.src===src))pending.push({src,...fileMap.get(src)});}
      log(`正在准备发布：${state.projects.length} 个项目，${pending.length} 张新图片。`);
      for(const [i,img] of pending.entries()){
        log(`[${i+1}/${pending.length}] 上传图片：${img.path}`);
        await putFile(s,img.path,await toBase64(img.file),'Upload portfolio image');
        state.projects.forEach(p=>{if(p.image===img.src)p.image=img.path;p.gallery=(p.gallery||[]).map(x=>x===img.src?img.path:x);});
        fileMap.delete(img.src);URL.revokeObjectURL(img.src);
      }
      log('正在更新 data/site.json ...');
      await putFile(s,'data/site.json',await encodeJson(normalized()),'Publish portfolio content');
      localStorage.removeItem(draftKey);markPublished();renderProjects();if(editorId){const p=state.projects.find(x=>x.id===editorId);if(p)renderMedia(p);}
      log('✓ 发布完成。GitHub Pages 构建后即可看到新内容。');alertMsg('发布成功！内容和图片已提交到 GitHub。请打开公开网站核对。');
    }catch(err){log('✕ 发布中断：'+err.message);alertMsg('发布失败：'+err.message,true);}
    finally{setBusy(false);}
  }
  $('publishBtn').addEventListener('click',publish);$('publishTop').addEventListener('click',()=>{showTab('deploy');publish();});
  $('reloadBtn').addEventListener('click',async()=>{
    if(!confirm('这会放弃当前尚未发布的修改，从 GitHub 重新读取。确定继续吗？'))return;
    let s=settings();setBusy(true);
    try{validSettings(s);const url=apiRoot(s)+'/contents/data/site.json?ref='+encodeURIComponent(s.branch);const meta=await github(s,url);const raw=atob((meta.content||'').replace(/\s/g,''));const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));state=JSON.parse(new TextDecoder().decode(bytes));fileMap.clear();editorId=null;$('editor').hidden=true;renderProjects();renderProfile();localStorage.removeItem(draftKey);dirty=false;$('draftLabel').textContent='✓ 已加载仓库内容';alertMsg('已从仓库加载内容。');}
    catch(e){alertMsg('加载失败：'+e.message,true);}finally{setBusy(false);}
  });
  $('exportBtn').addEventListener('click',()=>{
    if(editorId)applyProject(false);if(!$('profileTab').hidden)applyProfile(false);
    const blob=new Blob([JSON.stringify(stableState(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='portfolio-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
    alertMsg('已导出内容备份。未发布的本地图片不包含在 JSON 中。');
  });
  window.addEventListener('beforeunload',e=>{if(stagedCount()){e.preventDefault();e.returnValue='';}});
  async function start(){
    try{
      const res=await fetch('data/site.json?t='+Date.now(),{cache:'no-store'});
      if(res.ok){let online=await res.json();if(Array.isArray(online.projects))state=online;}
    }catch{}
    try{
      let draft=JSON.parse(localStorage.getItem(draftKey)||'null');
      if(draft&&Array.isArray(draft.projects)){
        if(confirm('发现上次保存在此浏览器的草稿，是否恢复？'))state=draft;
      }
    }catch{}
    renderProjects();renderProfile();
    if(repo.token){$('connectionTag').textContent='● 已保存会话，发布前将重新验证';$('loginStatus').textContent='可点击验证连接';}
    showTab('projects');
  }
  start();
})();
