import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoSrc from '../assets/logo.jpeg';
import './Navbar.css';

const CATEGORIES = ['Phones', 'Laptops', 'Desktops', 'Accessories'] as const;

const NAV_LINKS = [
  { label: 'Repairs', to: '/repair' },
  { label: 'Delivery', to: '/delivery' },
  { label: 'Contact', to: '/contact' },
] as const;

interface NavbarProps {
  cartItemCount?: number;
}

export default function Navbar({ cartItemCount = 0 }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
      setSearchQuery('');
      setMenuOpen(false);
    }
  }

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        {/* Logo */}
        <Link to="/" style={styles.logoLink} onClick={() => setMenuOpen(false)}>
          <img src={logoSrc} alt="Medtech Solutions" style={styles.logoImg} />
          <span style={styles.logoText} className="navbar-logo-text">Medtech Solutions</span>
        </Link>

        {/* Desktop nav links */}
        <ul style={styles.desktopLinks} className="navbar-desktop-links">
          {CATEGORIES.map((cat) => (
            <li key={cat}>
              <Link to={`/catalog?category=${cat}`} style={styles.navLink} className="nav-link-hover">
                {cat}
              </Link>
            </li>
          ))}
          {NAV_LINKS.map(({ label, to }) => (
            <li key={label}>
              <Link to={to} style={styles.navLink} className="nav-link-hover">{label}</Link>
            </li>
          ))}
        </ul>

        {/* Search bar */}
        <form onSubmit={handleSearch} style={styles.searchForm} className="navbar-search-form" role="search">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            style={styles.searchInput}
          />
          <button type="submit" style={styles.searchBtn} aria-label="Submit search">
            🔍
          </button>
        </form>

        {/* Cart icon */}
        <Link to="/cart" style={styles.cartLink} aria-label={`Cart, ${cartItemCount} items`}>
          🛒
          {cartItemCount > 0 && (
            <span style={styles.badge}>{cartItemCount > 99 ? '99+' : cartItemCount}</span>
          )}
        </Link>

        {/* Hamburger button (mobile only) */}
        <button
          style={styles.hamburger}
          className="navbar-hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={styles.mobileMenu} className="navbar-mobile-menu">
          <ul style={styles.mobileLinks}>
            {CATEGORIES.map((cat) => (
              <li key={cat}>
                <Link
                  to={`/catalog?category=${cat}`}
                  style={styles.mobileNavLink}
                  onClick={() => setMenuOpen(false)}
                >
                  {cat}
                </Link>
              </li>
            ))}
            {NAV_LINKS.map(({ label, to }) => (
              <li key={label}>
                <Link to={to} style={styles.mobileNavLink} onClick={() => setMenuOpen(false)}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <form onSubmit={handleSearch} style={styles.mobileSearchForm} role="search">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products…"
              aria-label="Search products"
              style={styles.mobileSearchInput}
            />
            <button type="submit" style={styles.searchBtn} aria-label="Submit search">
              🔍
            </button>
          </form>
        </div>
      )}
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    backgroundColor: 'rgba(15, 31, 61, 0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    color: '#fff',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    boxShadow: '0 2px 16px rgba(0,0,0,0.35)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  container: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '0 1.25rem',
    height: '62px',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  logoLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none',
    color: '#fff',
    flexShrink: 0,
  },
  logoImg: {
    height: '36px',
    width: '36px',
    objectFit: 'cover',
    borderRadius: '4px',
  },
  logoText: {
    fontWeight: 700,
    fontSize: '1rem',
    whiteSpace: 'nowrap',
    // hide on very small screens via media query workaround (inline only)
  },
  desktopLinks: {
    display: 'flex',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    gap: '0.25rem',
    // hidden on mobile — toggled via JS
  },
  navLink: {
    color: '#c8d8ea',
    textDecoration: 'none',
    padding: '0.4rem 0.65rem',
    borderRadius: '5px',
    fontSize: '0.875rem',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    transition: 'background 0.15s, color 0.15s',
  },
  searchForm: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    maxWidth: '300px',
    marginLeft: 'auto',
  },
  searchInput: {
    flex: 1,
    padding: '0.38rem 0.65rem',
    borderRadius: '5px 0 0 5px',
    border: 'none',
    outline: 'none',
    fontSize: '0.875rem',
    backgroundColor: '#1a3a5c',
    color: '#fff',
  },
  searchBtn: {
    padding: '0.38rem 0.65rem',
    background: '#1d6fa4',
    border: 'none',
    borderRadius: '0 5px 5px 0',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: '#fff',
  },
  cartLink: {
    position: 'relative',
    color: '#fff',
    textDecoration: 'none',
    fontSize: '1.4rem',
    flexShrink: 0,
    lineHeight: 1,
  },
  badge: {
    position: 'absolute',
    top: '-6px',
    right: '-8px',
    background: '#e53e3e',
    color: '#fff',
    borderRadius: '999px',
    fontSize: '0.65rem',
    fontWeight: 700,
    minWidth: '18px',
    height: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 3px',
  },
  hamburger: {
    display: 'none',
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '1.5rem',
    cursor: 'pointer',
    flexShrink: 0,
    lineHeight: 1,
  },
  mobileMenu: {
    backgroundColor: '#0f1f3d',
    borderTop: '1px solid #1a3a5c',
    padding: '0.75rem 1.25rem 1rem',
  },
  mobileLinks: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  mobileNavLink: {
    display: 'block',
    color: '#e0eaf5',
    textDecoration: 'none',
    padding: '0.5rem 0.75rem',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  mobileSearchForm: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '0.75rem',
  },
  mobileSearchInput: {
    flex: 1,
    padding: '0.4rem 0.65rem',
    borderRadius: '5px 0 0 5px',
    border: 'none',
    outline: 'none',
    fontSize: '0.9rem',
    backgroundColor: '#1a3a5c',
    color: '#fff',
  },
};
