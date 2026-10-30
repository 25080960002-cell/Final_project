import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Camera,
  Check,
  Heart,
  ImagePlus,
  Leaf,
  MessageCircle,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sprout,
  TrendingUp,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { Avatar, Button, EmptyState, Status } from '../../../shared/ui';
import { useDashboardData } from '../data/DashboardDataContext';
import paddyFieldPhoto from '../../landing/assets/images/paddy-planting.jpg';
import produceMarketPhoto from '../../landing/assets/images/produce-market.jpg';
import { API_BASE, createRecord, fetchRecords, fetchSymptoms, updateRecord, uploadImage } from '../data/apiClient';

export function PlantHealthPage() {
  const { plots, session, commodities, organization } = useDashboardData();
  const readOnly = !session || session.user?.role === 'penyuluh';
  const [photo, setPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [crop, setCrop] = useState('');
  const [plotId, setPlotId] = useState('');
  const [symptoms, setSymptoms] = useState([]);
  const [observation, setObservation] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [symptomOptions, setSymptomOptions] = useState([]);
  const [catalogError, setCatalogError] = useState('');

  useEffect(() => {
    if (!crop && commodities.length) setCrop(commodities[0].name);
  }, [commodities, crop]);

  useEffect(() => {
    let active = true;
    fetchRecords('scan').then((records) => { if (active) setHistory(records); }).catch(() => {});
    fetchSymptoms().then((items) => {
      if (active) setSymptomOptions(items.map((item) => item.label));
    }).catch((cause) => {
      if (active) setCatalogError(cause.message);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const selectPhoto = (event) => {
    const nextPhoto = event.target.files?.[0];
    if (!nextPhoto) return;
    if (!nextPhoto.type.startsWith('image/')) {
      setPhoto(null);
      setPreviewUrl('');
      setObservation(null);
      event.target.value = '';
      setError('Pilih berkas gambar seperti JPG, PNG, atau WEBP.');
      return;
    }
    if (nextPhoto.size > 10 * 1024 * 1024) {
      setPhoto(null);
      setPreviewUrl('');
      setObservation(null);
      event.target.value = '';
      setError('Ukuran foto maksimal 10 MB.');
      return;
    }
    setPhoto(nextPhoto);
    setPreviewUrl(URL.createObjectURL(nextPhoto));
    setObservation(null);
    setError('');
  };

  const toggleSymptom = (symptom) => {
    setSymptoms((current) => current.includes(symptom)
      ? current.filter((item) => item !== symptom)
      : [...current, symptom]);
    setObservation(null);
    setError('');
  };

  const saveObservation = async (event) => {
    event.preventDefault();
    if (readOnly) return;
    if (!photo) {
      setError('Unggah foto tanaman terlebih dahulu.');
      return;
    }
    if (symptoms.length === 0) {
      setError('Pilih setidaknya satu gejala yang terlihat.');
      return;
    }
    try {
      const date = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date());
      const media = await uploadImage(photo, { preserveOriginal: organization?.raw?.settings?.high_res_photos === true });
      await createRecord('scan', {
        title: `${crop} · ${symptoms.join(', ')}`,
        payload: { crop, plot_id: plotId ? Number(plotId) : null, symptoms, mediaId: media.id, photoUrl: media.url, photoName: photo.name, observedAt: new Date().toISOString() },
      });
      setObservation({ crop, symptoms, photoName: photo.name, photoUrl: media.url, date });
      setHistory(await fetchRecords('scan'));
    } catch (saveError) {
      setError(`Catatan belum tersimpan: ${saveError.message}`);
      return;
    }
    setError('');
  };

  return (
    <div className="page-stack">
      <div className="page-head">
        <div>
          <span className="eyebrow">PEMANTAUAN KESEHATAN TANAMAN</span>
          <h2>Scan tanaman</h2>
          <p>Unggah foto dan catat gejala agar lebih mudah ditinjau bersama penyuluh atau kelompok tani.</p>
        </div>
        <span className="location-pill"><Camera size={15} /> Pemindaian foto</span>
      </div>

      <div className="notice-banner" role="note">
        <AlertCircle size={17} aria-hidden="true" />
        <p><b>Catatan pemeriksaan:</b> gambar dan gejala tersimpan di organisasi. Diagnosis otomatis belum tersedia; catatan ini bukan diagnosis penyakit.</p>
      </div>
      {readOnly && <div className="community-note">{session ? 'Mode baca saja aktif untuk akun penyuluh.' : 'Mode demo: masuk ke akun organisasi untuk menyimpan pemeriksaan.'}</div>}

      <div className="scan-layout">
        <form className="panel scan-form" onSubmit={saveObservation}>
          <div className="panel-head">
            <div><span className="eyebrow">CATATAN BARU</span><h2>Pemeriksaan tanaman</h2></div>
            <span className="scan-icon"><Leaf size={18} /></span>
          </div>

          <label className={`scan-upload ${previewUrl ? 'has-photo' : ''}`} htmlFor="plant-photo">
            {previewUrl ? (
              <img src={previewUrl} alt="Pratinjau tanaman yang dipilih" />
            ) : (
              <span className="upload-placeholder"><ImagePlus size={26} /><b>Pilih foto tanaman</b><small>JPG, PNG, atau WEBP · maks. 10 MB</small></span>
            )}
            <span className="upload-button"><Upload size={14} />{previewUrl ? 'Ganti foto' : 'Unggah foto'}</span>
            <input id="plant-photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={readOnly} onChange={selectPhoto} />
          </label>
          {photo && <p className="field-hint">Foto dipilih: {photo.name}</p>}

          <label className="field">Komoditas
            <select disabled={readOnly || commodities.length === 0} value={crop} onChange={(event) => setCrop(event.target.value)}>
              {commodities.length === 0 && <option value="">Katalog komoditas belum tersedia</option>}
              {commodities.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
            </select>
          </label>
          <label className="field">Lahan terkait
            <select disabled={readOnly} value={plotId} onChange={(event) => setPlotId(event.target.value)}><option value="">Tidak dipilih</option>{plots.map((plot) => <option key={plot.plot_id ?? plot.id} value={plot.plot_id ?? plot.id}>{plot.name}</option>)}</select>
          </label>

          <fieldset className="symptom-field">
            <legend>Gejala yang terlihat</legend>
            {catalogError && <p className="field-hint" role="status">Katalog gejala gagal dimuat: {catalogError}</p>}
            <div className="symptom-grid">
              {symptomOptions.map((symptom) => (
                <label className={symptoms.includes(symptom) ? 'is-selected' : ''} key={symptom}>
                  <input type="checkbox" disabled={readOnly} checked={symptoms.includes(symptom)} onChange={() => toggleSymptom(symptom)} />
                  <span className="symptom-check">{symptoms.includes(symptom) && <Check size={12} />}</span>
                  {symptom}
                </label>
              ))}
            </div>
          </fieldset>

          {error && <p className="form-error" role="alert">{error}</p>}
          <Button type="submit" disabled={readOnly || !crop || symptomOptions.length === 0} className="scan-submit"><Check size={16} /> Simpan pemeriksaan</Button>
        </form>

        <aside className="scan-aside">
          <section className="panel guidance-card">
            <span className="eyebrow">PANDUAN FOTO</span>
            <h3>Ambil foto yang membantu pemeriksaan.</h3>
            <ul>
              <li><Check size={15} /> Foto bagian tanaman yang bergejala dari jarak dekat.</li>
              <li><Check size={15} /> Gunakan cahaya cukup dan hindari gambar buram.</li>
              <li><Check size={15} /> Sertakan tampilan seluruh tanaman bila memungkinkan.</li>
            </ul>
          </section>
          <section className="panel advice-card">
            <span className="risk-icon"><ShieldCheck size={20} /></span>
            <h3>Catatan tindak lanjut</h3>
            <p>Amati penyebaran gejala dan kondisi sekitar tanaman. Untuk keputusan pengendalian, konsultasikan dengan penyuluh atau tenaga pertanian setempat.</p>
          </section>
        </aside>
      </div>

      {observation && (
        <section className="panel scan-result" aria-live="polite">
          <span className="scan-result-icon"><Check size={18} /></span>
          <div>
            <span className="eyebrow">CATATAN DIBUAT · {observation.date}</span>
            <h3>{observation.crop} · {observation.symptoms.join(', ')}</h3>
            <p>Foto <b>{observation.photoName}</b> dan gejala tersimpan di organisasi. Foto belum dianalisis otomatis.</p>
          </div>
          <img src={observation.photoUrl} alt="Foto tanaman tersimpan" />
        </section>
      )}
      <section className="panel table-panel"><div className="panel-head"><div><span className="eyebrow">RIWAYAT</span><h2>Pemeriksaan tersimpan</h2></div><span className="chip">{history.length} catatan</span></div><div className="activity-list">{history.map((record) => <article className="activity-row" key={record.id}><span className="activity-icon tone-green"><Leaf size={16} /></span><div className="activity-copy"><b>{record.title}</b><small>{record.payload?.photoName ?? 'Tanpa foto'} · {record.payload?.symptoms?.join(', ') ?? 'Gejala tidak tercatat'}</small></div><time>{record.created_at ? new Date(record.created_at).toLocaleDateString('id-ID') : ''}</time></article>)}{history.length === 0 && <p className="muted-cell">Belum ada pemeriksaan.</p>}</div></section>
    </div>
  );
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const communityFilters = ['Semua', 'Tanya budidaya', 'Berbagi pengalaman', 'Panen & pasar'];
const categoryTones = { 'Tanya budidaya': 'question', 'Berbagi pengalaman': 'experience', 'Panen & pasar': 'harvest' };
const categoryTone = (category) => categoryTones[category] ?? 'question';

export function CommunityPage({ notify }) {
  const { session, organization, summary } = useDashboardData();
  const canWrite = Boolean(session) && session.user?.role !== 'penyuluh';
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Semua');
  const [composerOpen, setComposerOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postBody, setPostBody] = useState('');
  const [postPhoto, setPostPhoto] = useState(null);
  const [postPhotoUrl, setPostPhotoUrl] = useState('');
  const [postPhotoError, setPostPhotoError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [postCategory, setPostCategory] = useState('Tanya budidaya');
  const [openComments, setOpenComments] = useState([]);
  const [commentDrafts, setCommentDrafts] = useState({});
  const photoInputRef = useRef(null);
  const quickPhotoInputRef = useRef(null);
  const photoUrlsRef = useRef(new Set());

  useEffect(() => {
    let active = true;
    fetchRecords('community_post')
      .then((records) => {
        if (!active) return;
        setPosts(records.map((record) => ({
          ...record.payload, id: record.id, persisted: true,
          photoUrl: record.payload.photoUrl?.startsWith('/api/') ? `${API_BASE}${record.payload.photoUrl}` : record.payload.photoUrl,
          time: record.created_at ? new Date(record.created_at).toLocaleDateString('id-ID') : 'Tersimpan',
        })));
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => () => {
    photoUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const filteredPosts = posts.filter((post) => {
    const matchesFilter = filter === 'Semua' || post.category === filter;
    const searchContent = `${post.title} ${post.body} ${post.author} ${post.group}`.toLowerCase();
    return matchesFilter && searchContent.includes(search.toLowerCase());
  });
  const popularTopics = communityFilters.slice(1)
    .map((category) => ({ category, count: posts.filter((post) => post.category === category).length }))
    .filter((topic) => topic.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  const contributors = [...posts.reduce((result, post) => {
    const name = post.author || 'Anggota';
    result.set(name, (result.get(name) ?? 0) + 1);
    return result;
  }, new Map())]
    .map(([name, count]) => ({ name, count, initials: name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const publishPost = async (event) => {
    event.preventDefault();
    if (!canWrite) return;
    if (!postTitle.trim() || !postBody.trim()) return;
    const post = {
      initials: (session?.user?.name ?? 'MAPAN').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(), author: session?.user?.name ?? 'Anggota', group: organization?.name ?? 'Organisasi', location: organization?.region ?? '',
      category: postCategory, time: 'Baru saja', title: postTitle.trim(), body: postBody.trim(),
      photoUrl: postPhotoUrl, photoName: postPhoto?.name || '',
      likes: 0, liked: false, comments: [],
    };
    try {
      const media = postPhoto ? await uploadImage(postPhoto, { preserveOriginal: organization?.raw?.settings?.high_res_photos === true }) : null;
      if (media) {
        post.photoUrl = media.url;
        post.mediaId = media.id;
      }
      const record = await createRecord('community_post', {
        title: post.title,
        payload: post,
      });
      setPosts((current) => [{ ...post, id: record.id, persisted: true }, ...current]);
    } catch (saveError) {
      setPostPhotoError(`Diskusi belum tersimpan: ${saveError.message}`);
      return;
    }
    setPostTitle('');
    setPostBody('');
    setPostPhoto(null);
    setPostPhotoUrl('');
    setPostPhotoError('');
    setDragActive(false);
    if (photoInputRef.current) photoInputRef.current.value = '';
    setComposerOpen(false);
    setFilter('Semua');
  };

  const acceptPostPhoto = (nextPhoto) => {
    if (!nextPhoto) return;

    if (!nextPhoto.type.startsWith('image/')) {
      setPostPhotoError('Pilih foto dengan format JPG, PNG, atau WEBP.');
      return;
    }
    if (nextPhoto.size > 10 * 1024 * 1024) {
      setPostPhotoError('Ukuran foto maksimal 10 MB.');
      return;
    }
    if (postPhotoUrl) {
      URL.revokeObjectURL(postPhotoUrl);
      photoUrlsRef.current.delete(postPhotoUrl);
    }

    const nextPreviewUrl = URL.createObjectURL(nextPhoto);
    photoUrlsRef.current.add(nextPreviewUrl);
    setPostPhoto(nextPhoto);
    setPostPhotoUrl(nextPreviewUrl);
    setPostPhotoError('');
  };

  const selectPostPhoto = (event) => {
    acceptPostPhoto(event.target.files?.[0]);
    event.target.value = '';
  };

  const handleQuickPhoto = (event) => {
    const nextPhoto = event.target.files?.[0];
    if (nextPhoto) {
      acceptPostPhoto(nextPhoto);
      setComposerOpen(true);
    }
    event.target.value = '';
  };

  const handleDropPhoto = (event) => {
    event.preventDefault();
    setDragActive(false);
    acceptPostPhoto(event.dataTransfer.files?.[0]);
  };

  const removePostPhoto = () => {
    if (postPhotoUrl) {
      URL.revokeObjectURL(postPhotoUrl);
      photoUrlsRef.current.delete(postPhotoUrl);
    }
    setPostPhoto(null);
    setPostPhotoUrl('');
    setPostPhotoError('');
    setDragActive(false);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const toggleLike = async (postId) => {
    if (!canWrite) return;
    const post = posts.find((item) => item.id === postId);
    if (!post) return;
    const next = { ...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) };
    try {
      if (post.persisted) await updateRecord('community_post', postId, { payload: { ...next, persisted: undefined } });
      setPosts((current) => current.map((item) => item.id === postId ? next : item));
    } catch (error) {
      notify?.('Suka belum tersimpan', error.message);
    }
  };

  const toggleComments = (postId) => setOpenComments((current) => (
    current.includes(postId) ? current.filter((id) => id !== postId) : [...current, postId]
  ));

  const addComment = async (event, postId) => {
    event.preventDefault();
    if (!canWrite) return;
    const text = (commentDrafts[postId] || '').trim();
    if (!text) return;
    const post = posts.find((item) => item.id === postId);
    if (!post) return;
    const next = { ...post, comments: [...post.comments, `${session?.user?.name ?? 'Anggota'}: ${text}`] };
    try {
      if (post.persisted) await updateRecord('community_post', postId, { payload: { ...next, persisted: undefined } });
      setPosts((current) => current.map((item) => item.id === postId ? next : item));
      setCommentDrafts((current) => ({ ...current, [postId]: '' }));
    } catch (error) {
      notify?.('Tanggapan belum tersimpan', error.message);
    }
  };

  return (
    <div className="page-stack">
      <div className="page-head">
        <div>
          <span className="eyebrow">RUANG BERBAGI ANTAR PETANI</span>
          <h2>Komunitas petani</h2>
          <p>Tukar pengalaman budidaya, ajukan pertanyaan, dan belajar dari petani lain.</p>
        </div>
        <div className="community-head-actions">
          <Button disabled={!canWrite} variant="secondary" onClick={() => quickPhotoInputRef.current?.click()}>
            <ImagePlus size={16} /> Bagikan foto
          </Button>
          <Button disabled={!canWrite} onClick={() => setComposerOpen((open) => !open)}><Plus size={16} /> Buat diskusi</Button>
          <input
            ref={quickPhotoInputRef}
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Pilih foto untuk diskusi"
            tabIndex={-1}
            onChange={handleQuickPhoto}
          />
        </div>
      </div>

      <div className="community-note"><Sprout size={15} /><span>{session ? 'Diskusi, tanggapan, dan foto tersimpan di organisasi.' : 'Mode demo hanya untuk melihat antarmuka. Masuk ke akun organisasi untuk mengirim diskusi.'}</span></div>

      {composerOpen && (
        <form className="panel community-composer" onSubmit={publishPost}>
          <div className="composer-head"><Avatar name={session?.user?.name ?? 'Anggota'} size="md" /><div><b>Mulai diskusi</b><small>Bagikan pertanyaan atau pengalaman dari lahan.</small></div></div>
          <div className="form-grid">
            <label className="field field-full">Topik diskusi<input required maxLength={100} value={postTitle} onChange={(event) => setPostTitle(event.target.value)} placeholder="Contoh: Cara memeriksa kelembapan tanah..." /></label>
            <label className="field">Kategori<select value={postCategory} onChange={(event) => setPostCategory(event.target.value)}>{communityFilters.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="field field-full">Ceritakan lebih lanjut<textarea required maxLength={600} rows={4} value={postBody} onChange={(event) => setPostBody(event.target.value)} placeholder="Tulis detail yang bisa membantu petani lain memahami konteksnya..." /></label>
          </div>
          <div className="composer-photo">
            {postPhotoUrl ? (
              <div className="photo-preview">
                <img src={postPhotoUrl} alt="Pratinjau foto diskusi" />
                <div className="photo-preview-copy">
                  <b>{postPhoto?.name}</b>
                  <small>{formatFileSize(postPhoto?.size)} · Foto siap dilampirkan</small>
                </div>
                <div className="photo-preview-actions">
                  <button type="button" className="photo-change" onClick={() => photoInputRef.current?.click()}>Ganti</button>
                  <button type="button" className="photo-remove" onClick={removePostPhoto} aria-label="Hapus foto"><X size={16} /></button>
                </div>
              </div>
            ) : (
              <div
                className={`photo-drop ${dragActive ? 'is-dragging' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => photoInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    photoInputRef.current?.click();
                  }
                }}
                onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDropPhoto}
              >
                <span className="photo-drop-icon"><ImagePlus size={20} /></span>
                <span className="photo-drop-copy">
                  <b>Tambah foto dari lahan</b>
                  <small>Tarik foto ke sini atau pilih dari perangkat · JPG, PNG, WEBP · Maks 10 MB</small>
                </span>
                <span className="photo-drop-action">Pilih foto</span>
              </div>
            )}
            <input
              ref={photoInputRef}
              id="community-post-photo"
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              tabIndex={-1}
              onChange={selectPostPhoto}
            />
          </div>
          {postPhotoError && <p className="form-error" role="alert">{postPhotoError}</p>}
          <div className="composer-actions"><small>{postBody.length}/600 karakter</small><Button type="submit"><Send size={15} /> Terbitkan</Button></div>
        </form>
      )}

      <div className="community-toolbar">
        <label className="community-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari topik, komoditas, atau kelompok..." /></label>
        <div className="community-filters">
          {communityFilters.map((item) => <button type="button" key={item} className={filter === item ? 'is-active' : ''} onClick={() => setFilter(item)}>{item}</button>)}
        </div>
      </div>

      <div className="community-layout">
        <div className="community-feed" aria-live="polite">
          {filteredPosts.map((post) => (
            <article className="panel community-post" key={post.id}>
              <div className="post-author">
                <Avatar name={post.author} size="lg" />
                <div><b>{post.author}</b><span>{post.group} · {post.location}</span></div>
                <time>{post.time}</time>
              </div>
              <span className={`chip post-category tone-${categoryTone(post.category)}`}>{post.category}</span>
              <h3>{post.title}</h3>
              <p>{post.body}</p>
              {post.photoUrl && (
                <figure className="post-photo">
                  <img src={post.photoUrl} alt={post.photoName || 'Foto diskusi'} loading="lazy" />
                  <figcaption>{post.photoName || 'Foto dari lahan'}</figcaption>
                </figure>
              )}
              <div className="post-actions">
              <button type="button" disabled={!canWrite} className={post.liked ? 'is-liked' : ''} aria-pressed={post.liked} onClick={() => toggleLike(post.id)}><Heart size={16} fill={post.liked ? 'currentColor' : 'none'} /> {post.likes} Suka</button>
                <button type="button" aria-expanded={openComments.includes(post.id)} onClick={() => toggleComments(post.id)}><MessageCircle size={16} /> {post.comments.length} Tanggapan</button>
              </div>
              {openComments.includes(post.id) && (
                <div className="post-comments">
                  {post.comments.map((comment, index) => {
                    const separator = comment.indexOf(': ');
                    const commentAuthor = separator > 0 ? comment.slice(0, separator) : 'Anggota';
                    const commentText = separator > 0 ? comment.slice(separator + 2) : comment;
                    return (
                      <p key={`${post.id}-${index}`}>
                        <span className="comment-avatar"><Avatar name={commentAuthor} size="sm" /></span>
                        <span><b>{commentAuthor}</b> {commentText}</span>
                      </p>
                    );
                  })}
                  <form onSubmit={(event) => addComment(event, post.id)}>
                    <input disabled={!canWrite} aria-label={`Tanggapi diskusi ${post.title}`} value={commentDrafts[post.id] || ''} onChange={(event) => setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))} placeholder={canWrite ? 'Tulis tanggapan...' : 'Akses baca saja'} maxLength={300} />
                    <button type="submit" disabled={!canWrite} aria-label="Kirim tanggapan"><Send size={15} /></button>
                  </form>
                </div>
              )}
            </article>
          ))}
          {filteredPosts.length === 0 && <div className="panel"><EmptyState icon={Search} title="Diskusi belum ditemukan" description="Coba kata kunci atau kategori yang berbeda." /></div>}
        </div>

        <aside className="community-aside">
          <section className="panel community-side-card">
            <span className="eyebrow">TOPIK POPULER</span>
            <h3>Sedang ramai dibahas</h3>
            <ul className="topic-list">
              {popularTopics.map((topic) => <li key={topic.category}><span>#</span><div><b>{topic.category}</b><small>{topic.count} diskusi</small></div><TrendingUp size={14} /></li>)}
              {popularTopics.length === 0 && <li><div><b>Belum ada topik populer</b><small>Diskusi baru akan muncul di sini.</small></div></li>}
            </ul>
          </section>
          <section className="panel community-side-card">
            <span className="eyebrow">KONTRIBUTOR</span>
            <h3>Paling aktif minggu ini</h3>
            <div className="contributor-list">
              {contributors.map((person, index) => <div className="contributor" key={person.name}><Avatar name={person.initials} size="sm" tone={['green', 'gold', 'blue'][index]} /><div><b>{person.name}</b><small>{person.count} diskusi</small></div><Status>Aktif</Status></div>)}
              {contributors.length === 0 && <p className="muted-cell">Belum ada kontributor.</p>}
            </div>
          </section>
          <section className="panel community-side-card community-side-accent">
            <Users size={18} />
            <h3>{summary?.member_active ?? 0} anggota terhubung</h3>
            <p>Bergabung dengan kelompok tani dan koperasi dari berbagai wilayah.</p>
            <span className="inline-note"><ShieldCheck size={14} /> Diskusi dijaga bersama</span>
          </section>
        </aside>
      </div>
    </div>
  );
}
