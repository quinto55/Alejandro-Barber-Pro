import { BUSINESS, HOURS, REVIEWS } from './config.js';
import { formatMinutes } from './slots.js';
import { t } from './i18n.js';
import { nyParts } from './tz.js';
import { weekdayOf } from './tz.js';

export function renderReviews() {
  document.querySelector('#reviews-summary').textContent =
    t('reviews.summary', { rating: BUSINESS.rating.toFixed(1), count: BUSINESS.reviewCount });
  document.querySelector('#reviews-source').textContent = t('reviews.source');
  document.querySelector('#review-list').replaceChildren(...REVIEWS.map(r => {
    const li = document.createElement('li');
    li.className = 'review';
    li.innerHTML = `<p class="review-text">${t(r.textKey)}</p>
                    <p class="review-name">${r.name}</p>`;
    return li;
  }));
}

export function renderHours() {
  const today = weekdayOf(nyParts(new Date()).date);
  const rows = [1, 2, 3, 4, 5, 6, 0].map(d => {
    const h = HOURS[d];
    const tr = document.createElement('tr');
    if (d === today) tr.className = 'is-today';
    tr.innerHTML = `<th scope="row">${t(`day.${d}`)}</th>
                    <td>${h ? `${formatMinutes(h.open)} – ${formatMinutes(h.close)}` : t('visit.closed')}</td>`;
    return tr;
  });
  document.querySelector('#hours-body').replaceChildren(...rows);
  document.querySelector('#vip-note').textContent = t('visit.vipNote');
}

export function renderAddress() {
  document.querySelector('#address').replaceChildren(
    ...BUSINESS.addressLines.map(line => Object.assign(document.createElement('span'), { textContent: line })),
  );
  const dir = document.querySelector('#directions');
  dir.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(BUSINESS.mapQuery)}`;
  dir.textContent = t('visit.directions');
}
