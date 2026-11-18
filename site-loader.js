/* 公开作品集动态加载：优先展示已发布 JSON；初次使用则展示原模板内容 */
window.PORTFOLIO_READY = (async () => {
  try {
    const res = await fetch('data/site.json?v=' + Date.now(), {cache:'no-store'});
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.projects)) window.PORTFOLIO = data;
    }
  } catch (err) { console.warn('未加载到在线项目数据，已使用默认模板。',err); }
})();
