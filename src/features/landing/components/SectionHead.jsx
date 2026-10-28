import React from 'react';

export default function SectionHead({ eyebrow, title, description, align = 'center', action, tone = 'dark' }) {
  return (
    <div className={`section-head section-head-${align}`} data-reveal>
      <div>
        <span className={`eyebrow ${tone === 'light' ? 'eyebrow-light' : ''}`}>{eyebrow}</span>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
