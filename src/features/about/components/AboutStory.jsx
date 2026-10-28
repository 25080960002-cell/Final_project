import React from 'react';
import {
  BarChart3,
  Check,
  Compass,
  Handshake,
  Leaf,
  MapPinned,
  Quote,
  Sparkles,
  UsersRound,
} from 'lucide-react';

const principles = [
  {
    icon: MapPinned,
    title: 'Lapangan yang menentukan',
    text: 'Data harus lahir dari kebiasaan nyata petani: cepat dicatat, mudah dibaca, dan tidak menambah beban kerja.',
  },
  {
    icon: BarChart3,
    title: 'Konteks sebelum kesimpulan',
    text: 'Kami membandingkan catatan lapangan dengan data resmi, bukan menggantikan penilaian penyuluh atau petani.',
  },
  {
    icon: Handshake,
    title: 'Dipakai bersama',
    text: 'Petani, pengurus kelompok, dan koperasi melihat riwayat yang sama sehingga diskusi berjalan lebih singkat.',
  },
];

const workflow = [
  {
    step: '01',
    icon: MapPinned,
    title: 'Catat di lapangan',
    text: 'Petak, komoditas, aktivitas, dan hasil panen dicatat dari ponsel — bahkan sebelum sinyal tersedia.',
  },
  {
    step: '02',
    icon: BarChart3,
    title: 'Bandingkan dengan konteks',
    text: 'Data internal ditempatkan di samping prakiraan cuaca dan publikasi resmi seperti BPS.',
  },
  {
    step: '03',
    icon: UsersRound,
    title: 'Putuskan bersama',
    text: 'Rencana tanam, pemupukan, dan panen dibahas dengan angka yang sama di satu papan informasi.',
  },
];

const values = [
  {
    icon: Compass,
    title: 'Jujur pada ketidakpastian',
    text: 'Setiap angka punya sumber dan periode. Bila masih simulasi, kami beri label simulasi.',
  },
  {
    icon: Leaf,
    title: 'Menyesuaikan komoditas',
    text: 'Padi, jagung, hortikultura, dan perkebunan punya ritme berbeda. MAPAN tidak memaksakan satu template.',
  },
  {
    icon: Sparkles,
    title: 'Sederhana sejak awal',
    text: 'Fitur yang tidak membantu keputusan harian tidak perlu ditambahkan. Sedikit tetapi terpakai.',
  },
  {
    icon: Handshake,
    title: 'Tumbuh bersama komunitas',
    text: 'Arah produk dibentuk oleh masukan kelompok tani, penyuluh, dan pengelola koperasi.',
  },
];

const milestones = [
  {
    year: '2018',
    title: 'Riset di Subak Sari',
    text: 'Wawancara dan pendampingan kelompok tani tentang pencatatan pemupukan, air, dan panen.',
  },
  {
    year: '2020',
    title: 'Peta dan catatan lapangan',
    text: 'Prototipe pertama: petak lahan, siklus budidaya, dan rekap aktivitas dalam satu layar.',
  },
  {
    year: '2023',
    title: 'Uji coba bersama koperasi',
    text: 'Alur anggota, kelompok tani, dan laporan bulanan diuji dengan pengurus koperasi.',
  },
  {
    year: '2026',
    title: 'MAPAN v1 · demo terbuka',
    text: 'Dashboard, komunitas, dan halaman data resmi dapat dijelajahi tanpa pendaftaran.',
  },
];

export default function AboutStory() {
  return (
    <>
      <section className="section about-mission">
        <div className="container mission-grid">
          <div className="mission-copy" data-reveal>
            <span className="eyebrow">KENAPA MAPAN ADA</span>
            <h2>
              Keputusan di lahan tidak
              <br />
              seharusnya <em>dimulai dari nol.</em>
            </h2>
            <div className="mission-text">
              <p>
                Pengetahuan pertanian sudah ada di lapangan: kapan air datang, bagaimana
                daun berubah, berapa hasil panen musim lalu. Yang sering hilang adalah
                catatannya—tersebar di buku, pesan singkat, dan ingatan orang yang berbeda.
              </p>
              <p>
                MAPAN merapikan pengetahuan itu menjadi satu riwayat yang bisa dibaca ulang.
                Kami tidak menjanjikan panen pasti; kami membantu petani melihat pola,
                membandingkan pilihan, dan menyiapkan langkah berikutnya dengan lebih tenang.
              </p>
            </div>
          </div>

          <figure className="mission-quote" data-reveal style={{ '--reveal-delay': '120ms' }}>
            <Quote size={26} aria-hidden="true" />
            <blockquote>
              “Teknologi yang baik tidak membuat petani sibuk dengan aplikasi. Ia membuat
              petani punya lebih banyak waktu untuk lahan.”
            </blockquote>
            <figcaption>
              <span className="avatar avatar-md avatar-green">AD</span>
              <span><b>Agus Dharma</b><small>Tim produk MAPAN</small></span>
            </figcaption>
          </figure>
        </div>

        <div className="container principles">
          {principles.map(({ icon: Icon, title, text }) => (
            <article className="principle" key={title} data-reveal>
              <span className="principle-icon"><Icon size={18} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section about-workflow">
        <div className="container">
          <div className="workflow-head" data-reveal>
            <span className="eyebrow">DARI CATATAN KE KEPUTUSAN</span>
            <h2>Tiga lapis yang saling menguatkan.</h2>
            <p>
              Data lapangan memberi cerita. Data resmi memberi konteks. Tim memberi
              pertimbangan. MAPAN menjaga ketiganya tetap terhubung.
            </p>
          </div>
          <div className="workflow-grid">
            {workflow.map(({ step, icon: Icon, title, text }) => (
              <article className="workflow-card" key={step} data-reveal>
                <div className="workflow-top">
                  <span className="workflow-step">{step}</span>
                  <span className="workflow-icon"><Icon size={18} /></span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section about-values">
        <div className="container">
          <div className="values-head" data-reveal>
            <div>
              <span className="eyebrow">PRINSIP KERJA</span>
              <h2>Hal yang kami jaga<br /><em>saat membangun.</em></h2>
            </div>
            <p>
              MAPAN dibangun untuk dipakai jangka panjang. Karena itu, kejelasan sumber
              data dan kenyamanan pengguna bukan tambahan—melainkan bagian dari produk.
            </p>
          </div>
          <div className="values-grid">
            {values.map(({ icon: Icon, title, text }) => (
              <article className="value-item" key={title} data-reveal>
                <span className="value-item-icon"><Icon size={18} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section about-timeline">
        <div className="container">
          <div className="timeline-head" data-reveal>
            <span className="eyebrow">PERJALANAN</span>
            <h2>Bertumbuh pelan,<br /><em>bersama lapangan.</em></h2>
          </div>
          <div className="timeline">
            {milestones.map((item) => (
              <article className="timeline-item" key={item.year} data-reveal>
                <span className="timeline-year">{item.year}</span>
                <span className="timeline-dot" aria-hidden="true" />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="timeline-note" data-reveal>
            <span><Check size={14} /> Ingin berdiskusi atau mencoba MAPAN bersama kelompok Anda?</span>
            <a className="text-link" href="mailto:halo@mapan.id">Hubungi kami</a>
          </div>
        </div>
      </section>
    </>
  );
}
