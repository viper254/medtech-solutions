import { createContext, useContext, useReducer, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import type { Product } from './types';
import type { CartState, CartAction } from './store/cartReducer';
import { cartReducer, loadCartFromStorage, saveCartToStorage } from './store/cartReducer';

import Navbar from './components/Navbar';
import WhatsAppFAB from './components/WhatsAppFAB';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductDetailPage from './pages/ProductDetailPage';
import SearchResultsPage from './pages/SearchResultsPage';
import CartPage from './pages/CartPage';
import RepairServicesPage from './pages/RepairServicesPage';
import ContactPage from './pages/ContactPage';
import DeliveryInfoPage from './pages/DeliveryInfoPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminProductFormPage from './pages/AdminProductFormPage';
import AdminRepairServicesPage from './pages/AdminRepairServicesPage';

// ── Cart Context ───────────────────────────────────────────────────────────────

interface CartContextValue {
  cart: CartState;
  dispatch: React.Dispatch<CartAction>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

// ── App ────────────────────────────────────────────────────────────────────────

export default function App() {
  const [cart, dispatch] = useReducer(cartReducer, undefined, loadCartFromStorage);

  // Persist cart to localStorage on every change
  useEffect(() => {
    saveCartToStorage(cart);
  }, [cart]);

  function handleAddToCart(product: Product, quantity = 1) {
    // Use offer price if active, then discounted, then original
    const offerActive =
      product.offer_price != null &&
      product.offer_expires_at != null &&
      new Date(product.offer_expires_at).getTime() > Date.now();

    const effectivePrice = offerActive
      ? product.offer_price!
      : (product.discounted_price ?? product.original_price);

    dispatch({
      type: 'ADD_ITEM',
      payload: {
        product_id: product.id,
        name: product.name,
        effective_price: effectivePrice,
        price_type: offerActive ? 'offer' : product.discounted_price != null ? 'discounted' : 'regular',
        price_max: (!offerActive && product.discounted_price == null) ? (product.price_max ?? null) : null,
        quantity,
        thumbnail_url: product.media?.[0]?.url ?? '',
      },
    });
  }

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, dispatch }}>
      <BrowserRouter>
        <Navbar cartItemCount={cartItemCount} />

        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage onAddToCart={handleAddToCart} />} />
          <Route path="/catalog" element={<CatalogPage onAddToCart={handleAddToCart} />} />
          <Route path="/products/:id" element={<ProductDetailPage onAddToCart={handleAddToCart} />} />
          <Route path="/search" element={<SearchResultsPage onAddToCart={handleAddToCart} />} />
          <Route path="/cart" element={<CartPage cart={cart} dispatch={dispatch} />} />
          <Route path="/repair" element={<RepairServicesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/delivery" element={<DeliveryInfoPage />} />

          {/* Admin — login is public, dashboard/form are protected */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/products/new" element={<AdminProductFormPage />} />
            <Route path="/admin/products/:id/edit" element={<AdminProductFormPage />} />
            <Route path="/admin/repairs" element={<AdminRepairServicesPage />} />
          </Route>
        </Routes>

        <footer style={footerStyles.footer}>
          <div style={footerStyles.inner}>
            <div style={footerStyles.brand}>
              <span style={footerStyles.brandName}>Medtech Solutions</span>
              <p style={footerStyles.tagline}>Your One-Stop Tech Hub in Kenya</p>
            </div>
            <div style={footerStyles.col}>
              <p style={footerStyles.colHeading}>Shop</p>
              <Link to="/catalog?category=Phones" style={footerStyles.link}>Phones</Link>
              <Link to="/catalog?category=Laptops" style={footerStyles.link}>Laptops</Link>
              <Link to="/catalog?category=Desktops" style={footerStyles.link}>Desktops</Link>
              <Link to="/catalog?category=Accessories" style={footerStyles.link}>Accessories</Link>
            </div>
            <div style={footerStyles.col}>
              <p style={footerStyles.colHeading}>Info</p>
              <Link to="/repair" style={footerStyles.link}>Repair Services</Link>
              <Link to="/delivery" style={footerStyles.link}>Delivery &amp; Payment</Link>
              <Link to="/contact" style={footerStyles.link}>Contact Us</Link>
              <Link to="/cart" style={footerStyles.link}>My Cart</Link>
            </div>
            <div style={footerStyles.col}>
              <p style={footerStyles.colHeading}>Contact</p>
              <a href="https://wa.me/254793636022" style={footerStyles.link} target="_blank" rel="noopener noreferrer">WhatsApp: +254 793 636 022</a>
              <a href="tel:+254756597813" style={footerStyles.link}>Phone: +254 756 597 813</a>
              <span style={footerStyles.address}>Kisii Market Plaza</span>
              <span style={footerStyles.address}>Platinum Plaza, Nairobi</span>
            </div>
          </div>
          <p style={footerStyles.copy}>© {new Date().getFullYear()} Medtech Solutions. All rights reserved.</p>
        </footer>

        <WhatsAppFAB />
      </BrowserRouter>
      <Analytics />
    </CartContext.Provider>
  );
}

const footerStyles: Record<string, React.CSSProperties> = {
  footer: {
    backgroundColor: '#0a1628',
    color: '#c8d8ea',
    padding: '3rem 1.5rem 1.5rem',
    marginTop: 'auto',
  },
  inner: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '2rem',
    paddingBottom: '2rem',
    borderBottom: '1px solid #1a3a5c',
  },
  brand: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  brandName: { fontSize: '1.1rem', fontWeight: 700, color: '#fff' },
  tagline: { fontSize: '0.82rem', color: '#7a9ab8', margin: 0 },
  col: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  colHeading: { fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#7a9ab8', margin: '0 0 0.25rem' },
  link: { color: '#c8d8ea', textDecoration: 'none', fontSize: '0.875rem' },
  address: { fontSize: '0.875rem', color: '#c8d8ea' },
  copy: { textAlign: 'center' as const, fontSize: '0.78rem', color: '#4a6a8a', marginTop: '1.5rem' },
};
