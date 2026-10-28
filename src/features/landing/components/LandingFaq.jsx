import React, { useState } from 'react';
import { ArrowUpRight, Mail, Minus, Plus } from 'lucide-react';
import { landingFaqs } from '../data/faqs';

export default function LandingFaq() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="section faq">
      <div className="container faq-grid">
        <div className="faq-intro" data-reveal>
          <span className="eyebrow">PUSAT BANTUAN</span>
          <h2>Ada yang ingin<br /><em>ditanyakan?</em></h2>
          <p>
            Kami merangkum pertanyaan yang paling sering muncul. Jika masih ada
            yang mengganjal, tim kami siap membantu.
          </p>
          <a className="faq-contact" href="mailto:halo@mapan.id">
            <span className="faq-contact-icon"><Mail size={18} /></span>
            <span><small>Lebih suka berdiskusi?</small><b>halo@mapan.id</b></span>
            <ArrowUpRight size={17} />
          </a>
          <div className="faq-note">
            <span className="live-dot" />
            Biasanya dibalas dalam 1×24 jam kerja.
          </div>
        </div>

        <div className="faq-list">
          {landingFaqs.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <article className={`faq-item ${isOpen ? 'is-open' : ''}`} key={item.question} data-reveal>
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  >
                    <span className="faq-number">{String(index + 1).padStart(2, '0')}</span>
                    <span>{item.question}</span>
                    <i aria-hidden="true">{isOpen ? <Minus size={16} /> : <Plus size={16} />}</i>
                  </button>
                </h3>
                <div className="faq-answer" id={`faq-answer-${index}`} hidden={!isOpen}>
                  <p>{item.answer}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
