/* Sample browsers for the published Priming Models blog post. */
(() => {
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let galleryData;
  const loadData = () => galleryData ||= fetch('assets/blog/priming/qualitative/gallery.json')
    .then(response => { if (!response.ok) throw new Error('Sample data could not be loaded.'); return response.json(); });

  function createBrowser(container, gallery) {
    const name = container.dataset.sampleGallery;
    const kind = gallery.kind;
    const items = gallery.items;
    const modelLabels = new Map(items.flatMap(item => Object.entries(item.series).map(([key, series]) => [key, series.label])));
    let position = 0;
    let model = Object.keys(items[0].series)[0];
    container.classList.add('sample-carousel');
    container.setAttribute('role', 'region');
    container.setAttribute('aria-roledescription', 'carousel');
    container.setAttribute('aria-label', name === 'imagenet' ? 'ImageNet samples by class' : 'Text-to-image samples by prompt');
    container.tabIndex = 0;
    container.innerHTML = `
      ${gallery.description ? `<p class="sample-description">${escape(gallery.description)}</p>` : ''}
      <div class="sample-controls">
        <button type="button" data-sample-step="-1" aria-label="Previous ${kind}">←</button>
        <label><span>${kind === 'class' ? 'ImageNet class' : 'Text prompt'}</span>
          <select aria-label="Choose ${kind}">${items.map((item, i) => `<option value="${i}">${escape(`${item.id} · ${item.label}`)}</option>`).join('')}</select>
        </label>
        <button type="button" data-sample-step="1" aria-label="Next ${kind}">→</button>
      </div>
      <div class="sample-meta">
        <div class="sample-models"${modelLabels.size > 1 ? ' role="group" aria-label="Choose ImageNet model"' : ''}>${modelLabels.size > 1 ? [...modelLabels].map(([key, label]) => `<button type="button" data-sample-model="${escape(key)}" aria-pressed="false">${escape(label)}</button>`).join('') : `<span>${escape([...modelLabels.values()][0])}</span>`}</div>
        <span class="sample-position" aria-live="polite" aria-atomic="true"></span>
      </div>
      <p class="sample-prompt" ${kind === 'prompt' ? 'aria-live="polite"' : 'hidden'}></p>
      <div class="sample-grid ${kind === 'class' ? 'sample-grid-imagenet' : 'sample-grid-t2i'}"></div>`;
    const select = container.querySelector('select');
    const grid = container.querySelector('.sample-grid');
    const status = container.querySelector('.sample-position');
    const prompt = container.querySelector('.sample-prompt');
    const modelButtons = [...container.querySelectorAll('[data-sample-model]')];

    function show() {
      const item = items[position];
      if (!item.series[model]) model = Object.keys(item.series)[0];
      const series = item.series[model];
      select.value = String(position);
      status.textContent = `${position + 1} / ${items.length}`;
      status.setAttribute('aria-label', `${kind} ${position + 1} of ${items.length}`);
      prompt.textContent = item.label;
      modelButtons.forEach(button => {
        button.disabled = !item.series[button.dataset.sampleModel];
        button.setAttribute('aria-pressed', String(button.dataset.sampleModel === model));
      });
      grid.innerHTML = series.samples.map(sample => `<figure>
        <a href="${escape(sample.src)}" target="_blank" rel="noopener" aria-label="Open ${escape(item.label)}, sample ${sample.index + 1}">
          <img src="${escape(sample.src)}" width="${kind === 'class' ? 256 : 512}" height="${kind === 'class' ? 256 : 512}" loading="lazy" decoding="async" draggable="false" alt="${escape(series.label)}: ${escape(item.label)}. Sample ${sample.index + 1}.">
        </a>${series.samples.length > 1 ? `<figcaption>Sample ${sample.index + 1}</figcaption>` : ''}</figure>`).join('');
    }
    function move(step) { position = (position + step + items.length) % items.length; show(); }
    container.addEventListener('click', event => {
      const step = event.target.closest('[data-sample-step]');
      if (step) move(Number(step.dataset.sampleStep));
      const button = event.target.closest('[data-sample-model]');
      if (button && !button.disabled) { model = button.dataset.sampleModel; show(); }
    });
    select.addEventListener('change', () => { position = Number(select.value); show(); });
    container.addEventListener('keydown', event => {
      if (event.target.closest('select')) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1);
      }
    });
    let touchStart;
    grid.addEventListener('touchstart', event => {
      if (event.touches.length !== 1) { touchStart = null; return; }
      touchStart = {x:event.touches[0].clientX, y:event.touches[0].clientY};
    }, {passive:true});
    grid.addEventListener('touchend', event => {
      if (!touchStart || !event.changedTouches.length) return;
      const dx = event.changedTouches[0].clientX - touchStart.x;
      const dy = event.changedTouches[0].clientY - touchStart.y;
      touchStart = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx < 0 ? 1 : -1);
    }, {passive:true});
    grid.addEventListener('touchcancel', () => { touchStart = null; }, {passive:true});
    show();
    container.dataset.samplesReady = 'true';
    // Gallery hydration changes the height above existing deep-link targets.
    requestAnimationFrame(() => {
      const sectionId = location.hash.slice(1).split('?')[0].split('/')[3];
      if (sectionId) document.getElementById(sectionId)?.scrollIntoView();
    });
  }

  function hydrate() {
    document.querySelectorAll('[data-sample-gallery]:not([data-samples-ready])').forEach(container => {
      container.dataset.samplesReady = 'loading';
      loadData().then(data => {
        if (container.isConnected) createBrowser(container, data[container.dataset.sampleGallery]);
      }).catch(() => {
        if (container.isConnected) container.textContent = 'Samples could not be loaded. Please refresh the preview.';
      });
    });
  }
  new MutationObserver(hydrate).observe(document.querySelector('main'), {childList:true});
  hydrate();
})();
