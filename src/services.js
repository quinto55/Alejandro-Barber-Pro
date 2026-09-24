import { SERVICES, BUSINESS } from './config.js';
import { t } from './i18n.js';

export function formatDuration(min) {
  if (min < 60) return t('services.minutes', { n: min });
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? t('services.hoursOnly', { h }) : t('services.hours', { h, m });
}

/**
 * Preserves the "+" on from-prices. $60 and $60+ mean different things.
 * Takes anything shaped { priceFrom, plus }: a service record, or a total
 * from addons.js.
 */
export function formatPrice({ priceFrom, plus }) {
  return `$${priceFrom}${plus ? '+' : ''}`;
}

export function renderServices() {
  const list = document.querySelector('#service-list');
  list.replaceChildren(...SERVICES.map(s => {
    const card = document.createElement('article');
    card.className = `service-card${s.selfBookable ? '' : ' service-card--vip'}`;
    card.innerHTML = `
      <h3>${t(`svc.${s.id}.name`)}</h3>
      <p class="service-desc">${t(`svc.${s.id}.desc`)}</p>
      <div class="service-meta">
        <span class="service-price">${s.plus ? `<em>${t('services.from')}</em> ` : ''}${formatPrice(s)}</span>
        <span class="service-dur">${formatDuration(s.durationMin)}</span>
      </div>`;

    const cta = document.createElement('a');
    if (s.selfBookable) {
      cta.href = '#book';
      cta.className = 'btn btn-ghost';
      cta.textContent = t('services.book');
      cta.dataset.serviceId = s.id;
    } else {
      // VIP needs his approval first — never route it into the wizard.
      cta.href = BUSINESS.instagram;
      cta.target = '_blank';
      cta.rel = 'noopener';
      cta.className = 'btn btn-ghost';
      cta.textContent = t('svc.vip.cta');
    }
    card.append(cta);
    return card;
  }));
}
