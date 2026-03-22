import { useState, useEffect } from 'react';
import { MediaItem } from '../types';

interface MediaGalleryProps {
  items: MediaItem[];
  productName: string;
}

export default function MediaGallery({ items, productName }: MediaGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowLeft') setActiveIndex((i) => (i - 1 + items.length) % items.length);
      if (e.key === 'ArrowRight') setActiveIndex((i) => (i + 1) % items.length);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, items.length]);

  if (items.length === 0) {
    return (
      <div style={styles.emptyPlaceholder} aria-label={`${productName} — no media available`}>
        <span style={styles.emptyIcon}>📷</span>
        <p style={styles.emptyText}>No media available</p>
      </div>
    );
  }

  const activeItem = items[activeIndex];
  const hasMultiple = items.length > 1;

  function prev() { setActiveIndex((i) => (i - 1 + items.length) % items.length); }
  function next() { setActiveIndex((i) => (i + 1) % items.length); }

  return (
    <>
      {/* Lightbox */}
      {lightbox && (
        <div
          style={styles.lightboxOverlay}
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Full size media"
        >
          <button style={styles.lightboxClose} onClick={() => setLightbox(false)} aria-label="Close">✕</button>

          {hasMultiple && (
            <button
              style={{ ...styles.lightboxNav, left: '12px' }}
              onClick={(e) => { e.stopPropagation(); prev(); }}
              aria-label="Previous"
            >‹</button>
          )}

          <div style={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            {activeItem.type === 'image' ? (
              <img
                src={activeItem.url}
                alt={`${productName} full size`}
                style={styles.lightboxImage}
              />
            ) : (
              <video
                src={activeItem.url}
                controls
                autoPlay
                style={styles.lightboxVideo}
                aria-label={`${productName} video`}
              />
            )}
          </div>

          {hasMultiple && (
            <button
              style={{ ...styles.lightboxNav, right: '12px' }}
              onClick={(e) => { e.stopPropagation(); next(); }}
              aria-label="Next"
            >›</button>
          )}

          <p style={styles.lightboxCounter}>{activeIndex + 1} / {items.length}</p>
        </div>
      )}

      {/* Gallery */}
      <div style={styles.wrapper}>
        <div style={styles.mainArea}>
          {hasMultiple && (
            <button style={{ ...styles.navBtn, left: '8px' }} onClick={prev} aria-label="Previous media">‹</button>
          )}

          <div
            style={{ ...styles.mainMedia, cursor: 'zoom-in' }}
            onClick={() => setLightbox(true)}
            title="Click to view full size"
          >
            {activeItem.type === 'image' ? (
              <img
                src={activeItem.url}
                alt={`${productName} — image ${activeIndex + 1} of ${items.length}`}
                style={styles.mainImage}
              />
            ) : (
              <div style={styles.videoWrapper}>
                <video
                  src={activeItem.url}
                  style={styles.mainVideo}
                  aria-label={`${productName} — video ${activeIndex + 1}`}
                />
                <div style={styles.videoPlayOverlay} onClick={() => setLightbox(true)}>
                  <span style={styles.bigPlayIcon}>▶</span>
                </div>
              </div>
            )}
          </div>

          {hasMultiple && (
            <button style={{ ...styles.navBtn, right: '8px' }} onClick={next} aria-label="Next media">›</button>
          )}
        </div>

        <p style={styles.zoomHint}>Click image to view full size</p>

        {hasMultiple && (
          <div style={styles.thumbnailStrip} role="list" aria-label="Media thumbnails">
            {items.map((item, index) => (
              <button
                key={item.id}
                role="listitem"
                style={{ ...styles.thumbBtn, ...(index === activeIndex ? styles.thumbBtnActive : {}) }}
                onClick={() => setActiveIndex(index)}
                aria-label={`View ${item.type} ${index + 1}`}
                aria-current={index === activeIndex ? 'true' : undefined}
              >
                {item.type === 'image' ? (
                  <img src={item.url} alt={`${productName} thumbnail ${index + 1}`} style={styles.thumbImage} loading="lazy" />
                ) : (
                  <div style={styles.videoThumb} aria-hidden="true">
                    <span style={styles.playIcon}>▶</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' },
  mainArea: {
    position: 'relative', display: 'flex', alignItems: 'center',
    backgroundColor: '#f0f4f8', borderRadius: '8px', overflow: 'hidden', minHeight: '300px',
  },
  mainMedia: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  mainImage: { maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', display: 'block' },
  mainVideo: { maxWidth: '100%', maxHeight: '400px', display: 'block' },
  videoWrapper: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' },
  videoPlayOverlay: {
    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)', cursor: 'pointer',
  },
  bigPlayIcon: { fontSize: '3rem', color: '#fff', opacity: 0.9 },
  navBtn: {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)', zIndex: 1,
    background: 'rgba(0,0,0,0.45)', color: '#fff', border: 'none', borderRadius: '50%',
    width: '36px', height: '36px', fontSize: '1.4rem', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
  },
  zoomHint: { fontSize: '0.75rem', color: '#a0aec0', margin: 0, textAlign: 'center' as const },
  thumbnailStrip: { display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px' },
  thumbBtn: {
    flexShrink: 0, width: '64px', height: '64px', padding: 0,
    border: '2px solid transparent', borderRadius: '6px', overflow: 'hidden',
    cursor: 'pointer', background: '#e2e8f0',
  },
  thumbBtnActive: { borderColor: '#1d6fa4' },
  thumbImage: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  videoThumb: { width: '100%', height: '100%', backgroundColor: '#2d3748', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  playIcon: { color: '#fff', fontSize: '1.2rem' },
  emptyPlaceholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f4f8', borderRadius: '8px', minHeight: '200px', gap: '0.5rem' },
  emptyIcon: { fontSize: '2.5rem', opacity: 0.4 },
  emptyText: { margin: 0, color: '#718096', fontSize: '0.9rem' },

  // Lightbox
  lightboxOverlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.92)',
    zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  lightboxContent: {
    maxWidth: '90vw', maxHeight: '90vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  lightboxImage: { maxWidth: '90vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: '4px' },
  lightboxVideo: { maxWidth: '90vw', maxHeight: '88vh', borderRadius: '4px' },
  lightboxClose: {
    position: 'fixed', top: '16px', right: '20px',
    background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
    fontSize: '1.4rem', width: '40px', height: '40px', borderRadius: '50%',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3001,
  },
  lightboxNav: {
    position: 'fixed', top: '50%', transform: 'translateY(-50%)',
    background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
    fontSize: '2rem', width: '48px', height: '48px', borderRadius: '50%',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3001,
  },
  lightboxCounter: {
    position: 'fixed', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
    color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', margin: 0,
  },
};
