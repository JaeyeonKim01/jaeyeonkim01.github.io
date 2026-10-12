/* A buildless personal homepage. Content is kept in a separate file. */
const data = window.SITE_DATA;
const main = document.querySelector('main');
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const dateLabel = date => new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {month:'short', year:'numeric'});
const link = (url, label, className = '', svg = 'arrow') => `<a class="${className}" href="${esc(url)}"${/^https?:/.test(url) ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`;

function socials() {
  const social = data.socials;
  return `<div class="social-links">
    ${link(`mailto:${social.email}`, 'Email', 'social-link', '')}
    ${link(`https://scholar.google.com/citations?user=${encodeURIComponent(social.scholar_userid.split('&')[0])}`, 'Scholar', 'social-link', '')}
    ${link('assets/Jaeyeon_CV.pdf', 'CV', 'social-link', '')}
    ${link(`https://x.com/${social.x_username}`, 'Twitter / X', 'social-link', '')}
    ${link(`https://www.linkedin.com/in/${social.linkedin_username}/`, 'LinkedIn', 'social-link', '')}
  </div>`;
}

function abbreviatedAuthor(author) {
  const suffix = author.match(/\*+$/)?.[0] || '';
  const name = author.replace(/\*+$/, '').trim();
  // This imported name is stored in family-name-first order.
  const parts = (name === 'Lee Cheuk-Kit' ? 'Cheuk-Kit Lee' : name).split(/\s+/);
  const surname = parts.pop();
  const initials = parts.map(part => part.split('-').map(piece => `${piece[0]}.`).join('-')).join(' ');
  return `${initials ? initials + ' ' : ''}${surname}${suffix}`;
}

function paperRow(paper) {
  const authors = paper.authors.map(author => {
    const tag = author.replace(/\*+$/, '') === 'Jaeyeon Kim' ? 'strong' : 'span';
    return `<${tag} title="${esc(author)}">${esc(abbreviatedAuthor(author))}</${tag}>`;
  }).join(', ');
  const previewUrl = paper.paper || paper.code || paper.website;
  const preview = paper.preview
    ? `<a href="${esc(previewUrl)}" target="_blank" rel="noopener noreferrer" class="paper-visual" tabindex="-1" aria-hidden="true"><img src="${esc(paper.preview)}" alt="Figure from ${esc(paper.title)}" loading="lazy" decoding="async"></a>`
    : '';
  return `<article class="paper-row ${paper.preview ? '' : 'without-figure'}" data-paper-id="${esc(paper.id)}">
    ${preview}
    <div class="paper-content">
      <div class="paper-meta"><span class="venue">${esc(paper.venueShort)} ${paper.year}</span>${paper.award ? `<span class="award-tag">Outstanding Paper</span>` : ''}</div>
      <h3>${paper.paper ? link(paper.paper, esc(paper.title), '', '') : esc(paper.title)}</h3>
      <p class="authors">${authors}</p>
      <div class="paper-links">${paper.paper ? link(paper.paper, 'Paper') : ''}${paper.code ? link(paper.code, 'Code') : ''}${paper.website ? link(paper.website, 'Project') : ''}</div>
    </div>
  </article>`;
}

function newsList(items, compact = false) {
  return `<ol class="news-list ${compact ? 'compact' : ''}">${items.map(item => `<li><time datetime="${item.date}">${dateLabel(item.date)}</time><div>${item.html}</div></li>`).join('')}</ol>`;
}

function homeView() {
  const background = data.profile.backgroundHtml || data.profile.aboutHtml.replace(data.profile.introHtml.trim(), '').replace(data.profile.researchHtml.trim(), '').trim();
  const selectedIds = ["kim2025train", "park2026overthinking", "kim2026interface", "kim2025fine", "kim2025any", "kim2023time"];
  const selected = selectedIds.map(id => data.papers.find(paper => paper.id === id)).filter(Boolean);
  return `<section class="hero" aria-labelledby="home-heading">
    <h1 id="home-heading">Jaeyeon Kim</h1>
    <figure class="portrait-block">
      <img class="portrait" src="assets/prof_pic.jpg" width="300" height="360" alt="Jaeyeon Kim" fetchpriority="high">
    </figure>
    <div class="intro prose">${data.profile.introHtml}${data.profile.researchHtml}</div>
    ${socials()}
  </section>
  <div class="home-sections">
    <section class="updates" aria-labelledby="updates-heading">
      <div class="section-heading"><div><h2 id="updates-heading">News</h2></div></div>
      <div class="news-scroll" tabindex="0" role="region" aria-labelledby="updates-heading">${newsList(data.news)}</div>
    </section>
    <section class="research-section" aria-labelledby="selected-heading">
      <div class="section-heading"><div><h2 id="selected-heading">Selected publications</h2></div>${link('#/research','All publications','text-link','right')}</div>
      <div class="paper-list">${selected.map(paperRow).join('')}</div>
      <p class="contribution-note">* Equal contribution.</p>
    </section>
  </div>
  <section class="background-section prose" aria-labelledby="background-heading"><h2 id="background-heading">Background</h2>${background}</section>
  <section class="easter-egg-section prose" aria-labelledby="easter-egg-heading">
    <h2 id="easter-egg-heading">Easter egg</h2>
    <p>I use this LaTeX <code>xcolor</code> scheme in most of my first-authored papers. The models change; my favorite colors have tenure :) You can grab the <a href="assets/jay_colors_util.tex" download>color scheme here</a>.</p>
    <ul class="palette-swatches" aria-label="A few favorites from my paper palette">
      <li><span class="palette-swatch" style="background-color:#4169E1" aria-hidden="true"></span><code>xblue</code></li>
      <li><span class="palette-swatch" style="background-color:#623E99" aria-hidden="true"></span><code>xxpurple</code></li>
      <li><span class="palette-swatch" style="background-color:#009F86" aria-hidden="true"></span><code>xxgreen</code></li>
      <li><span class="palette-swatch" style="background-color:#FF0000" aria-hidden="true"></span><code>xred</code></li>
    </ul>
  </section>
`;
}

function researchView(params) {
  const topics = ['All work', 'Discrete diffusion', 'Generative modeling', 'Learning & optimization'];
  const active = topics.includes(params.get('topic')) ? params.get('topic') : 'All work';
  return `<section class="page-heading"><h1>Research</h1></section>
    <div class="research-controls"><div class="filter-tabs" role="group" aria-label="Filter publications by topic">${topics.map(topic => `<button type="button" class="filter-button ${topic === active ? 'active' : ''}" data-topic="${esc(topic)}" aria-pressed="${topic === active}">${esc(topic)}</button>`).join('')}</div>
    <div class="search-row"><label class="search-field"><input type="search" id="paper-search" placeholder="Search titles, authors, or venues…" aria-label="Search publications"></label><label class="year-field"><span class="sr-only">Publication year</span><select id="paper-year"><option value="all">All years</option>${[...new Set(data.papers.map(p => p.year))].map(year => `<option value="${year}">${year}</option>`).join('')}</select></label></div></div>
    <div class="result-bar"><span id="result-count" role="status"></span><span>* Equal contribution</span></div><div id="research-results" class="paper-list full-list"></div>`;
}

function updatePapers() {
  const search = document.querySelector('#paper-search');
  if (!search) return;
  const topic = document.querySelector('.filter-button.active').dataset.topic;
  const query = search.value.toLowerCase().trim();
  const year = document.querySelector('#paper-year').value;
  const matches = data.papers.filter(paper => (topic === 'All work' || paper.topic === topic) && (year === 'all' || String(paper.year) === year) && `${paper.title} ${paper.author} ${paper.journal} ${paper.venueShort} ${paper.year}`.toLowerCase().includes(query));
  document.querySelector('#result-count').textContent = `${matches.length} publication${matches.length === 1 ? '' : 's'}`;
  document.querySelector('#research-results').innerHTML = matches.length ? matches.map(paperRow).join('') : '<div class="empty-state"><h2>No matching publications</h2><p>Try a different title, author, topic, or year.</p><button class="button-link" id="reset-filters" type="button">Clear filters</button></div>';
}

function collaborationView() {
  return `<section class="page-heading"><h1>Collaboration</h1></section><article class="prose collaboration-content">${data.collaborationHtml}</article>`;
}

function cvView() {
  return `<section class="page-heading cv-heading"><div><h1>Curriculum vitae</h1><p>Jaeyeon Kim · Computer Science, Harvard University</p></div>${link('assets/Jaeyeon_CV.pdf','Download PDF','primary-link','download')}</section>
    <div class="cv-layout"><nav class="cv-toc" aria-label="CV sections">${data.cv.map((section, i) => `<a href="#/cv/section-${i}" data-scroll="section-${i}">${esc(section.title)}</a>`).join('')}</nav><div class="cv-sections">${data.cv.map((section, i) => `<section id="section-${i}" class="cv-section"><h2>${esc(section.title)}</h2>${section.contents.map(item => section.type === 'map' ? `<dl class="cv-map"><dt>${esc(item.name)}</dt><dd>${esc(item.value)}</dd></dl>` : `<div class="cv-item"><div class="cv-year">${esc(item.year)}</div><div><h3>${esc(item.title)}</h3>${item.description ? (Array.isArray(item.description) ? `<ul>${item.description.map(line => `<li>${esc(line)}</li>`).join('')}</ul>` : `<p>${esc(item.description)}</p>`) : ''}${(item.linkitems || []).map(item => link(item.link, esc(item.linkname), 'text-link')).join('')}</div></div>`).join('')}</section>`).join('')}</div></div>`;
}

function renderPage() {
  const [path, query] = (location.hash.slice(1) || '/').split('?');
  const route = path.split('/')[1] || 'home';
  if (route === 'about') { location.replace('#/'); return; }
  const params = new URLSearchParams(query || '');
  const views = {home:homeView, research:() => researchView(params), collaboration:collaborationView, cv:cvView};
  main.innerHTML = views[route] ? views[route]() : `<section class="page-heading"><div class="eyebrow">404</div><h1>Page not found.</h1><p>${link('#/','Back home','text-link','right')}</p></section>`;
  main.dataset.page = route;
  const label = route === 'home' ? 'Home' : route.charAt(0).toUpperCase()+route.slice(1);
  document.title = `Jaeyeon Kim - ${label}`;
  document.querySelectorAll('[data-route]').forEach(item => {
    if (item.dataset.route === route) item.setAttribute('aria-current','page');
    else item.removeAttribute('aria-current');
  });
  if (route === 'research') updatePapers();
  const sectionId = route === 'cv' ? path.split('/')[2] : null;
  if (sectionId) document.getElementById(sectionId)?.scrollIntoView();
  else window.scrollTo(0, 0);
}

main.addEventListener('input', event => { if (event.target.id === 'paper-search') updatePapers(); });
main.addEventListener('change', event => { if (event.target.id === 'paper-year') updatePapers(); });
main.addEventListener('click', event => {
  const filter = event.target.closest('[data-topic]');
  if (filter) {
    document.querySelectorAll('[data-topic]').forEach(button => {
      button.classList.toggle('active', button === filter);
      button.setAttribute('aria-pressed', String(button === filter));
    });
    updatePapers();
  }
  if (event.target.closest('#reset-filters')) {
    document.querySelector('#paper-search').value = '';
    document.querySelector('#paper-year').value = 'all';
    document.querySelector('[data-topic="All work"]').click();
  }
  const scrollLink = event.target.closest('[data-scroll]');
  if (scrollLink) {
    event.preventDefault();
    const target = document.getElementById(scrollLink.dataset.scroll);
    target?.scrollIntoView();
  }
});
window.addEventListener('hashchange', renderPage);
document.querySelector('.skip-link').addEventListener('click', event => { event.preventDefault(); main.focus(); main.scrollIntoView(); });
renderPage();
