'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Search,
  Filter,
  BarChart2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Bookmark,
  Plus,
  Trash2,
  DollarSign,
  Globe,
  Share2,
  ArrowRight,
  TrendingUp,
  Link2,
  Award,
  Layers,
  ChevronDown,
  Copy,
  Check,
  CreditCard,
  MessageSquare,
  Lock,
  Unlock,
  RefreshCw,
  LayoutGrid,
  List as ListIcon,
  X,
  Info,
  BadgeCheck,
  Key,
  SlidersHorizontal,
  History,
  CheckSquare,
  Sliders,
  Edit3,
  Image as ImageIcon,
  Upload,
  Maximize2,
  Eye,
  EyeOff,
  Package,
  FileText,
  Printer,
  CheckCheck,
} from 'lucide-react';
import {
  MarketplaceDomain,
  AuthorityLink,
  getMarketplaceDomains,
  addMarketplaceDomain,
  deleteMarketplaceDomain,
  updateMarketplaceDomain,
  resetMarketplaceToDefaults,
  isMarketplaceAdmin,
  setMarketplaceAdminMode,
  verifyAdminPasscode,
} from '../../../lib/marketplace';
import {
  MarketplaceOrder,
  getMarketplaceOrders,
  addMarketplaceOrder,
} from '../../../lib/orders';
import {
  CartItem,
  getCart,
  addToCart,
  removeFromCart,
  isDomainInCart,
} from '../../../lib/cart';
import { isDomainInWishlist, toggleDomainWishlist } from '../../../lib/watchlist';
import { supabase } from '../../../lib/supabaseClient';
import AuthModal from '../../../components/AuthModal';
import CartDrawer from '../../../components/CartDrawer';

export default function DomainMarketplaceInventoryPage() {
  const [domains, setDomains] = useState<MarketplaceDomain[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('All');
  const [selectedTld, setSelectedTld] = useState('All');
  const [selectedBacklinkSource, setSelectedBacklinkSource] = useState('All');

  // Metric Range Filters (Domain Coasters Style)
  const [minDr, setMinDr] = useState<number>(0);
  const [minDa, setMinDa] = useState<number>(0);
  const [minTf, setMinTf] = useState<number>(0);
  const [minRd, setMinRd] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [minAge, setMinAge] = useState<number>(0);

  const [sortBy, setSortBy] = useState<'featured' | 'dr-desc' | 'da-desc' | 'tf-desc' | 'rd-desc' | 'price-asc' | 'price-desc' | 'age-desc'>('dr-desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table'); // Domain Coasters default: Table
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // User & Admin Auth State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminPasscodeModalOpen, setIsAdminPasscodeModalOpen] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState('');
  const [adminPasscodeError, setAdminPasscodeError] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Wishlist set & Revealed domains set (for "See" button)
  const [wishlistSet, setWishlistSet] = useState<Set<string>>(new Set());
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);
  const [revealedDomainIds, setRevealedDomainIds] = useState<Set<string>>(new Set());

  const maskDomainName = (domain: string) => {
    const parts = domain.split('.');
    const name = parts[0] || '';
    const tld = parts.slice(1).join('.');
    if (name.length <= 3) {
      return `${name[0]}***.${tld}`;
    }
    const start = name.slice(0, 2);
    const end = name.slice(-1);
    const stars = '*'.repeat(Math.max(3, name.length - 3));
    return `${start}${stars}${end}.${tld}`;
  };

  const handleToggleReveal = (id: string) => {
    setRevealedDomainIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleRevealAll = () => {
    if (revealedDomainIds.size === domains.length) {
      setRevealedDomainIds(new Set());
    } else {
      setRevealedDomainIds(new Set(domains.map((d) => d.id)));
    }
  };

  // Modals & Links / Screenshots Viewer
  const [selectedDomainForBuy, setSelectedDomainForBuy] = useState<MarketplaceDomain | null>(null);
  const [selectedDomainForLinks, setSelectedDomainForLinks] = useState<MarketplaceDomain | null>(null);
  const [linksModalTab, setLinksModalTab] = useState<'table' | 'screenshot'>('table');
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  // Orders / Purchase History Tab State
  const [activeMainTab, setActiveMainTab] = useState<'inventory' | 'orders'>('inventory');
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [latestPurchasedOrder, setLatestPurchasedOrder] = useState<MarketplaceOrder | null>(null);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<MarketplaceOrder | null>(null);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'All' | 'Completed' | 'Transfer in Progress'>('All');
  const [orderSortBy, setOrderSortBy] = useState<'date-desc' | 'date-asc' | 'price-desc' | 'dr-desc'>('date-desc');
  const [copiedOrderText, setCopiedOrderText] = useState<string | null>(null);

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartDomainSet, setCartDomainSet] = useState<Set<string>>(new Set());
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Edit Domain Modal State
  const [editingDomain, setEditingDomain] = useState<MarketplaceDomain | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDomainName, setEditDomainName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editOriginalPrice, setEditOriginalPrice] = useState('');
  const [editDr, setEditDr] = useState('70');
  const [editDa, setEditDa] = useState('55');
  const [editTf, setEditTf] = useState('30');
  const [editCategory, setEditCategory] = useState('Technology & AI');
  const [editReferringDomains, setEditReferringDomains] = useState('650');
  const [editBacklinks, setEditBacklinks] = useState('15000');
  const [editAgeYears, setEditAgeYears] = useState('10');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<'available' | 'reserved' | 'sold'>('available');
  const [editFeatured, setEditFeatured] = useState(false);
  const [editBuyUrl, setEditBuyUrl] = useState('');
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editAuthorityLinks, setEditAuthorityLinks] = useState<AuthorityLink[]>([]);
  const [editScreenshots, setEditScreenshots] = useState<string[]>([]);
  const [editScreenshotUrlInput, setEditScreenshotUrlInput] = useState('');
  const [newAuthorityNameInput, setNewAuthorityNameInput] = useState('');
  const [newAuthorityDrInput, setNewAuthorityDrInput] = useState('');

  // New Listing Form State
  const [newDomain, setNewDomain] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newOriginalPrice, setNewOriginalPrice] = useState('');
  const [newDr, setNewDr] = useState('70');
  const [newDa, setNewDa] = useState('55');
  const [newTf, setNewTf] = useState('30');
  const [newCategory, setNewCategory] = useState('Technology & AI');
  const [newTopLinks, setNewTopLinks] = useState('Forbes (DR 94), TechCrunch (DR 92), Wikipedia (DR 98)');
  const [newScreenshots, setNewScreenshots] = useState<string[]>([]);
  const [newScreenshotUrlInput, setNewScreenshotUrlInput] = useState('');
  const [newReferringDomains, setNewReferringDomains] = useState('650');
  const [newBacklinks, setNewBacklinks] = useState('15000');
  const [newAgeYears, setNewAgeYears] = useState('10');
  const [newDescription, setNewDescription] = useState('');
  const [newBuyUrl, setNewBuyUrl] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');

  // Auto-fetch state
  const [isFetchingAhrefsNew, setIsFetchingAhrefsNew] = useState(false);
  const [isFetchingAhrefsEdit, setIsFetchingAhrefsEdit] = useState(false);
  const [autoFetchNotice, setAutoFetchNotice] = useState<string | null>(null);


  // Load domains & check user/admin on mount
  useEffect(() => {
    const loadListings = () => {
      const data = getMarketplaceDomains();
      setDomains(data);
    };
    loadListings();

    const handleUpdate = () => loadListings();
    window.addEventListener('oldurl_marketplace_updated', handleUpdate);

    // Check user from Supabase or localStorage
    const checkAuth = async () => {
      let email = null;
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user?.email) {
          email = data.session.user.email;
          setCurrentUser(data.session.user);
        } else {
          const cachedUser = localStorage.getItem('oldurl_cached_user');
          if (cachedUser) {
            const parsed = JSON.parse(cachedUser);
            if (parsed?.email) {
              email = parsed.email;
              setCurrentUser(parsed);
            }
          }
        }
      } catch (e) {}

      const userIsAdmin = isMarketplaceAdmin(email);
      setIsAdmin(userIsAdmin);
      if (!userIsAdmin && typeof window !== 'undefined') {
        localStorage.removeItem('oldurl_admin_mode');
      }
    };
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email || null;
      setCurrentUser(session?.user || null);
      const userIsAdmin = isMarketplaceAdmin(email);
      setIsAdmin(userIsAdmin);
      if (!userIsAdmin && typeof window !== 'undefined') {
        localStorage.removeItem('oldurl_admin_mode');
      }
    });

    const handleAdminChanged = () => {
      const userIsAdmin = isMarketplaceAdmin(currentUser?.email);
      setIsAdmin(userIsAdmin);
      if (!userIsAdmin && typeof window !== 'undefined') {
        localStorage.removeItem('oldurl_admin_mode');
      }
    };
    window.addEventListener('oldurl_marketplace_admin_changed', handleAdminChanged);

    // Initial wishlist sync
    const syncWishlist = () => {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('oldurl_wishlist_guest');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              setWishlistSet(new Set(parsed.map((item: any) => item.domain.toLowerCase().trim())));
            }
          } catch (e) {}
        }
      }
    };
    syncWishlist();
    window.addEventListener('oldurl_wishlist_updated', syncWishlist);

    // Initial orders sync & URL tab check
    const syncOrders = () => {
      const data = getMarketplaceOrders(currentUser?.email);
      setOrders(data);
    };
    syncOrders();

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('tab') === 'orders') {
        setActiveMainTab('orders');
      }
    }

    const handleOrdersUpdated = (e: any) => {
      if (e?.detail?.orders) {
        setOrders(e.detail.orders);
      } else {
        syncOrders();
      }
    };
    window.addEventListener('oldurl_orders_updated', handleOrdersUpdated);

    // Initial Cart sync
    const syncCart = () => {
      const currentCart = getCart();
      setCartItems(currentCart);
      setCartDomainSet(new Set(currentCart.map((c) => c.domain.toLowerCase().trim())));
    };
    syncCart();

    const handleCartUpdated = (e: any) => {
      if (e?.detail?.items) {
        setCartItems(e.detail.items);
        setCartDomainSet(new Set(e.detail.items.map((c: any) => c.domain.toLowerCase().trim())));
      } else {
        syncCart();
      }
    };
    window.addEventListener('oldurl_cart_updated', handleCartUpdated);

    return () => {
      window.removeEventListener('oldurl_marketplace_updated', handleUpdate);
      window.removeEventListener('oldurl_marketplace_admin_changed', handleAdminChanged);
      window.removeEventListener('oldurl_wishlist_updated', syncWishlist);
      window.removeEventListener('oldurl_orders_updated', handleOrdersUpdated);
      window.removeEventListener('oldurl_cart_updated', handleCartUpdated);
      authListener?.subscription?.unsubscribe();
    };
  }, [currentUser?.email]);

  const handleToggleCart = (item: MarketplaceDomain) => {
    const clean = item.domain.toLowerCase().trim();
    if (cartDomainSet.has(clean)) {
      removeFromCart(item.id);
    } else {
      addToCart(item);
    }
  };

  const niches = useMemo(() => {
    const set = new Set<string>();
    domains.forEach((d) => {
      if (d.category) set.add(d.category);
    });
    return ['All', ...Array.from(set)];
  }, [domains]);

  const tlds = useMemo(() => {
    const set = new Set<string>();
    domains.forEach((d) => {
      if (d.tld) set.add(d.tld);
    });
    return ['All', ...Array.from(set)];
  }, [domains]);

  const authoritySourceOptions = [
    'All',
    'Forbes',
    'TechCrunch',
    'Wikipedia',
    'Bloomberg',
    'Reuters',
    'Harvard.edu',
    'Healthline',
    'Wired',
    'TheGuardian',
  ];

  const filteredDomains = useMemo(() => {
    return domains
      .filter((item) => {
        // Search query
        if (searchQuery) {
          const q = searchQuery.toLowerCase().trim();
          const matchDomain = item.domain.toLowerCase().includes(q);
          const matchDesc = item.description?.toLowerCase().includes(q);
          const matchCategory = item.category?.toLowerCase().includes(q);
          const matchLinks = item.topAuthorityLinks?.some((l) => l.name.toLowerCase().includes(q));
          if (!matchDomain && !matchDesc && !matchCategory && !matchLinks) return false;
        }

        // Niche filter
        if (selectedNiche !== 'All' && item.category !== selectedNiche) {
          return false;
        }

        // TLD filter
        if (selectedTld !== 'All' && item.tld !== selectedTld) {
          return false;
        }

        // Backlink Source filter
        if (selectedBacklinkSource !== 'All') {
          const hasSource = item.topAuthorityLinks?.some((l) =>
            l.name.toLowerCase().includes(selectedBacklinkSource.toLowerCase().replace(/\.edu/i, ''))
          );
          if (!hasSource) return false;
        }

        // Metric Sliders / Minimums
        if (minDr > 0 && item.dr < minDr) return false;
        if (minDa > 0 && item.da < minDa) return false;
        if (minTf > 0 && (item.tf || 0) < minTf) return false;
        if (minRd > 0 && item.referringDomains < minRd) return false;
        if (minAge > 0 && item.ageYears < minAge) return false;
        if (item.price > maxPrice) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'featured') {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return b.dr - a.dr;
        }
        if (sortBy === 'dr-desc') return b.dr - a.dr;
        if (sortBy === 'da-desc') return b.da - a.da;
        if (sortBy === 'tf-desc') return (b.tf || 0) - (a.tf || 0);
        if (sortBy === 'rd-desc') return b.referringDomains - a.referringDomains;
        if (sortBy === 'age-desc') return b.ageYears - a.ageYears;
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        return 0;
      });
  }, [
    domains,
    searchQuery,
    selectedNiche,
    selectedTld,
    selectedBacklinkSource,
    minDr,
    minDa,
    minTf,
    minRd,
    minAge,
    maxPrice,
    sortBy,
  ]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedNiche !== 'All') count++;
    if (selectedTld !== 'All') count++;
    if (selectedBacklinkSource !== 'All') count++;
    if (minDr > 0) count++;
    if (minDa > 0) count++;
    if (minTf > 0) count++;
    if (minRd > 0) count++;
    if (minAge > 0) count++;
    if (maxPrice < 5000) count++;
    if (searchQuery) count++;
    return count;
  }, [selectedNiche, selectedTld, selectedBacklinkSource, minDr, minDa, minTf, minRd, minAge, maxPrice, searchQuery]);

  const handleResetAllFilters = () => {
    setSelectedNiche('All');
    setSelectedTld('All');
    setSelectedBacklinkSource('All');
    setMinDr(0);
    setMinDa(0);
    setMinTf(0);
    setMinRd(0);
    setMinAge(0);
    setMaxPrice(5000);
    setSearchQuery('');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDomain(text);
    setTimeout(() => setCopiedDomain(null), 2000);
  };

  const handleCopyOrderText = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedOrderText(keyId);
    setTimeout(() => setCopiedOrderText(null), 2000);
  };

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        if (orderSearchQuery) {
          const q = orderSearchQuery.toLowerCase().trim();
          const matchDomain = order.domain.toLowerCase().includes(q);
          const matchId = order.id.toLowerCase().includes(q);
          const matchCategory = order.category?.toLowerCase().includes(q);
          if (!matchDomain && !matchId && !matchCategory) return false;
        }

        if (orderStatusFilter !== 'All' && order.status !== orderStatusFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (orderSortBy === 'date-desc') {
          return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
        }
        if (orderSortBy === 'date-asc') {
          return new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
        }
        if (orderSortBy === 'price-desc') {
          return b.price - a.price;
        }
        if (orderSortBy === 'dr-desc') {
          return b.dr - a.dr;
        }
        return 0;
      });
  }, [orders, orderSearchQuery, orderStatusFilter, orderSortBy]);

  const ordersTotalSpent = useMemo(() => {
    return orders.reduce((sum, item) => sum + (item.price || 0), 0);
  }, [orders]);

  const ordersAvgDr = useMemo(() => {
    if (orders.length === 0) return 0;
    return Math.round(orders.reduce((sum, item) => sum + item.dr, 0) / orders.length);
  }, [orders]);

  const ordersCompletedCount = useMemo(() => {
    return orders.filter((o) => o.status === 'Completed').length;
  }, [orders]);

  const handleInitiatePurchase = (targetDomain: MarketplaceDomain) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    const newOrder = addMarketplaceOrder({
      domain: targetDomain.domain,
      tld: targetDomain.tld,
      dr: targetDomain.dr,
      da: targetDomain.da,
      tf: targetDomain.tf,
      referringDomains: targetDomain.referringDomains,
      backlinks: targetDomain.backlinks,
      price: targetDomain.price,
      category: targetDomain.category,
      userEmail: currentUser?.email || undefined,
      sellerContact: targetDomain.sellerContact,
    });
    setLatestPurchasedOrder(newOrder);
    setPurchaseSuccess(true);
    setOrders(getMarketplaceOrders(currentUser?.email));
  };

  const handleToggleWishlist = async (domainItem: MarketplaceDomain) => {
    const isSaved = await toggleDomainWishlist({
      domain: domainItem.domain,
      dr: domainItem.dr,
      status: 'Available',
      registrar: 'Marketplace (Verified Direct)',
      refDomains: domainItem.referringDomains,
      backlinks: domainItem.backlinks,
      notes: `Marketplace Listing: $${domainItem.price} USD | Top Links: ${domainItem.topAuthorityLinks.map((l) => l.name).join(', ')}`,
    });

    setWishlistSet((prev) => {
      const next = new Set(prev);
      const clean = domainItem.domain.toLowerCase().trim();
      if (isSaved) next.add(clean);
      else next.delete(clean);
      return next;
    });
  };

  // Auto-fetch from Ahrefs API & Authority Intelligence
  const fetchAhrefsData = async (targetDomain: string) => {
    const clean = targetDomain.trim().toLowerCase().replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0];
    if (!clean || !clean.includes('.')) return null;

    try {
      const res = await fetch(`/api/ahrefs-dr?domain=${encodeURIComponent(clean)}&full=true`);
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {
      console.warn('Auto-fetch notice:', e);
    }
    return null;
  };

  const handleAutoFetchNewDomain = async () => {
    if (!newDomain.trim()) return;
    setIsFetchingAhrefsNew(true);
    setAutoFetchNotice(null);
    const data = await fetchAhrefsData(newDomain);
    setIsFetchingAhrefsNew(false);

    if (data) {
      setNewDr(String(data.dr ?? 0));
      setNewDa(String(data.da ?? 0));
      setNewTf(String(data.tf ?? 0));
      setNewReferringDomains(String(data.referringDomains ?? 0));
      setNewBacklinks(String(data.backlinks ?? 0));
      setNewAgeYears(String(data.ageYears ?? 5));
      if (data.category) setNewCategory(data.category);
      if (data.topAuthorityLinks && Array.isArray(data.topAuthorityLinks) && data.topAuthorityLinks.length > 0) {
        const formatted = data.topAuthorityLinks.map((l: any) => `${l.name} (DR ${l.dr})`).join(', ');
        setNewTopLinks(formatted);
      }
      setAutoFetchNotice(`Loaded live metrics & referring domains for ${data.domain || newDomain}!`);
      setTimeout(() => setAutoFetchNotice(null), 4000);
    }
  };

  const handleOpenEditModal = (item: MarketplaceDomain) => {
    if (!isAdmin) return;
    setEditingDomain(item);
    setEditDomainName(item.domain);
    setEditPrice(String(item.price));
    setEditOriginalPrice(item.originalPrice ? String(item.originalPrice) : '');
    setEditDr(String(item.dr));
    setEditDa(String(item.da));
    setEditTf(String(item.tf ?? 25));
    setEditCategory(item.category || 'Technology & AI');
    setEditReferringDomains(String(item.referringDomains ?? 0));
    setEditBacklinks(String(item.backlinks ?? 0));
    setEditAgeYears(String(item.ageYears ?? 5));
    setEditDescription(item.description || '');
    setEditStatus(item.status || 'available');
    setEditFeatured(!!item.featured);
    setEditBuyUrl(item.buyUrl || '');
    setEditContactEmail(item.sellerContact?.email || '');
    setEditAuthorityLinks(item.topAuthorityLinks ? [...item.topAuthorityLinks] : []);
    setEditScreenshots(item.screenshots ? [...item.screenshots] : []);
    setEditScreenshotUrlInput('');
    setIsEditModalOpen(true);
  };

  // Helper to compress images before storing to prevent localStorage QuotaExceededError
  const compressImageFile = (file: File, maxWidth = 1400, maxHeight = 1000, quality = 0.82): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawData = e.target?.result as string;
        if (!rawData) {
          resolve('');
          return;
        }
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', quality);
            resolve(compressed);
          } else {
            resolve(rawData);
          }
        };
        img.onerror = () => resolve(rawData);
        img.src = rawData;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const compressedList: string[] = [];
    for (const file of Array.from(files)) {
      const compressed = await compressImageFile(file);
      if (compressed) {
        compressedList.push(compressed);
      }
    }

    if (compressedList.length > 0) {
      if (isEdit) {
        setEditScreenshots((prev) => [...prev, ...compressedList]);
      } else {
        setNewScreenshots((prev) => [...prev, ...compressedList]);
      }
    }
    e.target.value = '';
  };

  // Direct upload from within the Links Proof modal (Admin action)
  const handleUploadInLinksModal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedDomainForLinks || !isAdmin) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const compressedList: string[] = [];
    for (const file of Array.from(files)) {
      const compressed = await compressImageFile(file);
      if (compressed) {
        compressedList.push(compressed);
      }
    }

    if (compressedList.length > 0) {
      const updatedScreenshots = [
        ...(selectedDomainForLinks.screenshots || []),
        ...compressedList,
      ];
      updateMarketplaceDomain(selectedDomainForLinks.id, {
        screenshots: updatedScreenshots,
      });
      setSelectedDomainForLinks({
        ...selectedDomainForLinks,
        screenshots: updatedScreenshots,
      });
      setDomains(getMarketplaceDomains());
    }
    e.target.value = '';
  };

  const handleRemoveScreenshotInLinksModal = (idx: number) => {
    if (!selectedDomainForLinks || !isAdmin) return;
    const updatedScreenshots = (selectedDomainForLinks.screenshots || []).filter((_, i) => i !== idx);
    updateMarketplaceDomain(selectedDomainForLinks.id, {
      screenshots: updatedScreenshots,
    });
    setSelectedDomainForLinks({
      ...selectedDomainForLinks,
      screenshots: updatedScreenshots,
    });
    setDomains(getMarketplaceDomains());
  };

  const handleAddScreenshotUrl = (isEdit: boolean) => {
    if (isEdit) {
      if (editScreenshotUrlInput.trim()) {
        setEditScreenshots((prev) => [...prev, editScreenshotUrlInput.trim()]);
        setEditScreenshotUrlInput('');
      }
    } else {
      if (newScreenshotUrlInput.trim()) {
        setNewScreenshots((prev) => [...prev, newScreenshotUrlInput.trim()]);
        setNewScreenshotUrlInput('');
      }
    }
  };

  const handleRemoveScreenshot = (idx: number, isEdit: boolean) => {
    if (isEdit) {
      setEditScreenshots((prev) => prev.filter((_, i) => i !== idx));
    } else {
      setNewScreenshots((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const handleAutoFetchEditDomain = async () => {
    if (!editDomainName.trim()) return;
    setIsFetchingAhrefsEdit(true);
    setAutoFetchNotice(null);
    const data = await fetchAhrefsData(editDomainName);
    setIsFetchingAhrefsEdit(false);

    if (data) {
      setEditDr(String(data.dr ?? 0));
      setEditDa(String(data.da ?? 0));
      setEditTf(String(data.tf ?? 0));
      setEditReferringDomains(String(data.referringDomains ?? 0));
      setEditBacklinks(String(data.backlinks ?? 0));
      setEditAgeYears(String(data.ageYears ?? 5));
      if (data.category) setEditCategory(data.category);
      if (data.topAuthorityLinks && Array.isArray(data.topAuthorityLinks) && data.topAuthorityLinks.length > 0) {
        setEditAuthorityLinks(data.topAuthorityLinks);
      }
      setAutoFetchNotice(`Live Ahrefs metrics & ${data.topAuthorityLinks?.length || 0} referring domain mentions auto-updated!`);
      setTimeout(() => setAutoFetchNotice(null), 4000);
    }
  };

  const [isFetchingMentionDr, setIsFetchingMentionDr] = useState(false);

  // Real-time debounce auto-lookup DR as user types or pastes domain
  useEffect(() => {
    if (!newAuthorityNameInput.trim()) {
      setNewAuthorityDrInput('');
      return;
    }
    const clean = newAuthorityNameInput
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//i, '')
      .replace(/\/.*$/, '')
      .replace(/[^a-z0-9.-]/g, '');

    if (!clean || !clean.includes('.')) return;

    const timer = setTimeout(async () => {
      setIsFetchingMentionDr(true);
      try {
        const res = await fetch(`/api/ahrefs-dr?domain=${encodeURIComponent(clean)}`);
        if (res.ok) {
          const data = await res.json();
          if (typeof data.dr === 'number') {
            setNewAuthorityDrInput(String(data.dr));
          }
        }
      } catch (e) {}
      setIsFetchingMentionDr(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [newAuthorityNameInput]);

  const handleLookupMentionDr = async (rawDomain: string) => {
    const clean = rawDomain.trim().toLowerCase().replace(/^https?:\/\//i, '').replace(/\/.*$/, '').replace(/[^a-z0-9.-]/g, '');
    if (!clean || !clean.includes('.')) return;
    setIsFetchingMentionDr(true);
    try {
      const res = await fetch(`/api/ahrefs-dr?domain=${encodeURIComponent(clean)}`);
      if (res.ok) {
        const data = await res.json();
        if (typeof data.dr === 'number') {
          setNewAuthorityDrInput(String(data.dr));
        }
      }
    } catch (e) {}
    setIsFetchingMentionDr(false);
  };

  const handleAddEditAuthorityLink = async () => {
    if (!newAuthorityNameInput.trim()) return;
    const rawInput = newAuthorityNameInput.trim();
    
    // Support single domain or comma/space/semicolon/newline separated domains/URLs
    const parts = rawInput.split(/[,;\n\s]+/).map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) return;

    setIsFetchingMentionDr(true);

    const newLinks: AuthorityLink[] = [];

    await Promise.all(
      parts.map(async (part) => {
        const cleanName = part
          .replace(/^https?:\/\//i, '')
          .replace(/\/.*$/, '')
          .replace(/[^a-z0-9.-]/g, '')
          .toLowerCase();

        if (!cleanName || !cleanName.includes('.')) return;

        // Skip if already in existing list or already in newly processed batch
        if (editAuthorityLinks.some((l) => l.name.toLowerCase() === cleanName) || newLinks.some((l) => l.name.toLowerCase() === cleanName)) {
          return;
        }

        let resolvedDr = 0;
        try {
          const res = await fetch(`/api/ahrefs-dr?domain=${encodeURIComponent(cleanName)}`);
          if (res.ok) {
            const data = await res.json();
            if (typeof data.dr === 'number') {
              resolvedDr = data.dr;
            }
          }
        } catch (e) {}

        if (resolvedDr === 0 && newAuthorityDrInput && parts.length === 1) {
          resolvedDr = parseInt(newAuthorityDrInput, 10) || 50;
        }

        newLinks.push({
          name: cleanName,
          dr: resolvedDr > 0 ? resolvedDr : 50,
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        });
      })
    );

    setIsFetchingMentionDr(false);

    if (newLinks.length > 0) {
      setEditAuthorityLinks((prev) => [...prev, ...newLinks]);
    }
    setNewAuthorityNameInput('');
    setNewAuthorityDrInput('');
  };

  const handleRemoveEditAuthorityLink = (idx: number) => {
    setEditAuthorityLinks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleQuickAddAuthority = async (name: string, defaultDr: number) => {
    if (editAuthorityLinks.some((l) => l.name.toLowerCase() === name.toLowerCase())) return;
    
    let dr = defaultDr;
    try {
      const res = await fetch(`/api/ahrefs-dr?domain=${encodeURIComponent(name)}`);
      if (res.ok) {
        const data = await res.json();
        if (typeof data.dr === 'number') {
          dr = data.dr;
        }
      }
    } catch (e) {}

    setEditAuthorityLinks((prev) => [
      ...prev,
      { name, dr, badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
    ]);
  };


  const handleSaveEditListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!editingDomain || !editDomainName.trim() || !editPrice.trim()) return;

    const updates: Partial<MarketplaceDomain> = {
      domain: editDomainName.trim().toLowerCase(),
      tld: '.' + (editDomainName.split('.').pop() || 'com'),
      price: parseFloat(editPrice) || 0,
      originalPrice: editOriginalPrice ? parseFloat(editOriginalPrice) : undefined,
      dr: parseInt(editDr, 10) || 0,
      da: parseInt(editDa, 10) || 0,
      tf: parseInt(editTf, 10) || 0,
      category: editCategory,
      referringDomains: parseInt(editReferringDomains, 10) || 0,
      backlinks: parseInt(editBacklinks, 10) || 0,
      ageYears: parseInt(editAgeYears, 10) || 0,
      description: editDescription.trim(),
      status: editStatus,
      featured: editFeatured,
      topAuthorityLinks: editAuthorityLinks.length > 0 ? editAuthorityLinks : [{ name: 'Forbes', dr: 94 }],
      screenshots: editScreenshots,
      buyUrl: editBuyUrl.trim() || undefined,
      sellerContact: editContactEmail.trim() ? { email: editContactEmail.trim() } : undefined,
    };

    updateMarketplaceDomain(editingDomain.id, updates);
    setIsEditModalOpen(false);
    setEditingDomain(null);
  };

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!newDomain.trim() || !newPrice.trim()) return;

    // Parse top authority links from text
    const parsedLinks = newTopLinks
      .split(',')
      .map((part) => {
        const trimmed = part.trim();
        const drMatch = trimmed.match(/DR\s*(\d+)/i) || trimmed.match(/\((\d+)\)/);
        const name = trimmed.replace(/\(DR\s*\d+\)/i, '').replace(/\(\d+\)/, '').replace(/DR\s*\d+/i, '').trim();
        const dr = drMatch ? parseInt(drMatch[1], 10) : 90;
        return {
          name: name || 'Authority Publication',
          dr: isNaN(dr) ? 90 : dr,
          badgeColor: 'bg-orange-50 text-[#FC6B17] border-orange-200',
        };
      })
      .filter((l) => l.name.length > 0);

    addMarketplaceDomain({
      domain: newDomain.trim(),
      tld: '.' + (newDomain.split('.').pop() || 'com'),
      dr: parseInt(newDr, 10) || 50,
      da: parseInt(newDa, 10) || 40,
      tf: parseInt(newTf, 10) || 25,
      price: parseFloat(newPrice) || 499,
      originalPrice: newOriginalPrice ? parseFloat(newOriginalPrice) : undefined,
      category: newCategory || 'General Authority',
      topAuthorityLinks: parsedLinks.length > 0 ? parsedLinks : [{ name: 'Forbes', dr: 94 }],
      screenshots: newScreenshots,
      referringDomains: parseInt(newReferringDomains, 10) || 100,
      backlinks: parseInt(newBacklinks, 10) || 2000,
      ageYears: parseInt(newAgeYears, 10) || 5,
      cleanHistory: true,
      verifiedOwnership: true,
      instantTransfer: true,
      description: newDescription.trim() || 'Aged authority domain with clean backlink profile and instant transfer authorization.',
      buyUrl: newBuyUrl.trim() || undefined,
      sellerContact: newContactEmail.trim() ? { email: newContactEmail.trim() } : undefined,
      status: 'available',
      featured: false,
    });

    setIsListModalOpen(false);
    // Reset form
    setNewDomain('');
    setNewPrice('');
    setNewOriginalPrice('');
    setNewDescription('');
    setNewBuyUrl('');
    setNewContactEmail('');
    setNewScreenshots([]);
    setNewScreenshotUrlInput('');
  };

  const handleDeleteListing = (id: string, domainName: string) => {
    if (!isAdmin) return;
    if (confirm(`Admin Action: Are you sure you want to delete "${domainName}" from the inventory?`)) {
      deleteMarketplaceDomain(id);
    }
  };

  const handleAdminPasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPasscode(adminPasscode)) {
      setIsAdmin(true);
      setIsAdminPasscodeModalOpen(false);
      setAdminPasscode('');
      setAdminPasscodeError(false);
    } else {
      setAdminPasscodeError(true);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Reset marketplace inventory to default verified domain inventory?')) {
      const defs = resetMarketplaceToDefaults();
      setDomains(defs);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] w-full mx-auto pb-16 font-sans">
      {/* Top Hero / Header */}
      <div className="bg-gradient-to-br from-[#0d1b3e] via-[#132857] to-[#1c356f] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-[#233f82] relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-[#FC6B17]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-orange-500/20 text-[#FC6B17] border border-orange-500/30 px-3 py-1 rounded-full text-xs font-bold tracking-wide backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5" />
                <span>DOMAIN INVENTORY &amp; MARKETPLACE</span>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/10 text-gray-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                100% Vetted &amp; Spam-Cleaned
              </span>
              {isAdmin && (
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide">
                  <BadgeCheck className="w-3 h-3 text-emerald-400" /> ADMIN ACTIVE
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              Aged &amp; Expired Domains with High-DR Backlinks
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-2xl">
              Filter through curated authority domains with permanent editorial backlinks from <strong className="text-white">Forbes, TechCrunch, Wikipedia, BBC, Harvard &amp; Reuters</strong>. Guaranteed clean Wayback history and instant 2-hour transfer.
            </p>

            {/* Metric Highlights Strip */}
            <div className="flex items-center gap-4 flex-wrap pt-1 text-xs text-gray-200 font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Ahrefs DR &amp; Moz DA Verified
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" /> Majestic Trust Flow (TF)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Automated EPP Auth-Code Push
              </span>
            </div>
          </div>

          {/* Right Header CTA & Admin Trigger */}
          {isAdmin && (
            <div className="flex flex-row sm:flex-col lg:flex-row items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsListModalOpen(true)}
                className="bg-[#FC6B17] hover:bg-[#e05607] text-white px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Post New Domain</span>
              </button>

              <button
                type="button"
                onClick={handleResetDefaults}
                className="bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white px-3.5 py-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
                title="Reset inventory to default sample listings"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TOP LEVEL NAVIGATION TABS: INVENTORY vs MY ORDERS */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-1">
        <div className="flex items-center gap-2 p-1.5 bg-gray-100/90 rounded-2xl border border-gray-200/70 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveMainTab('inventory')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeMainTab === 'inventory'
                ? 'bg-white text-[#0d1b3e] shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-[#FC6B17]" />
            <span>Browse Marketplace</span>
            <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-orange-50 text-[#FC6B17] font-extrabold border border-orange-200/60">
              {domains.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('orders')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeMainTab === 'orders'
                ? 'bg-white text-[#0d1b3e] shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <Package className="w-4 h-4 text-[#FC6B17]" />
            <span>My Orders &amp; Purchases</span>
            {orders.length > 0 && (
              <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-200/60">
                {orders.length}
              </span>
            )}
          </button>
        </div>

        {/* Right Action: Cart Drawer Trigger & Status Indicator */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
              cartItems.length > 0
                ? 'bg-[#fff7f2] hover:bg-[#ffede2] text-[#FC6B17] border-orange-300 shadow-xs'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-[#FC6B17]" />
            <span>Cart</span>
            {cartItems.length > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FC6B17] text-white font-black shadow-2xs">
                {cartItems.length}
              </span>
            )}
          </button>

          {activeMainTab === 'orders' ? (
            <div className="text-xs font-semibold text-gray-500 hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{ordersCompletedCount} Completed • Transfer Ready</span>
            </div>
          ) : (
            <div className="text-xs font-semibold text-gray-500 hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{filteredDomains.length} Verified Domains Ready</span>
            </div>
          )}
        </div>
      </div>

      {activeMainTab === 'inventory' ? (
        <>
          {/* DOMAIN COASTERS STYLE FILTER TOOLBAR */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        {/* Main Search & Primary Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-gray-400 absolute top-3 left-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search domain, keyword, or backlink..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 outline-none focus:border-[#FC6B17] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Niche Dropdown */}
          <div className="md:col-span-3 relative">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Niche / Category
            </label>
            <div className="relative">
              <select
                value={selectedNiche}
                onChange={(e) => setSelectedNiche(e.target.value)}
                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 pr-7 text-xs font-semibold text-gray-700 outline-none focus:border-[#FC6B17] cursor-pointer"
              >
                {niches.map((n) => (
                  <option key={n} value={n}>
                    {n === 'All' ? 'All Niches' : n}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* TLD Dropdown */}
          <div className="md:col-span-2 relative">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              TLD Extension
            </label>
            <div className="relative">
              <select
                value={selectedTld}
                onChange={(e) => setSelectedTld(e.target.value)}
                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 pr-7 text-xs font-semibold text-gray-700 outline-none focus:border-[#FC6B17] cursor-pointer"
              >
                {tlds.map((t) => (
                  <option key={t} value={t}>
                    {t === 'All' ? 'All TLDs' : t}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Backlink Authority Source */}
          <div className="md:col-span-3 relative">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Backlinks From
            </label>
            <div className="relative">
              <select
                value={selectedBacklinkSource}
                onChange={(e) => setSelectedBacklinkSource(e.target.value)}
                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 pr-7 text-xs font-semibold text-gray-700 outline-none focus:border-[#FC6B17] cursor-pointer"
              >
                {authoritySourceOptions.map((src) => (
                  <option key={src} value={src}>
                    {src === 'All' ? 'Any Authority Backlink' : `Links from ${src}`}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* METRICS RANGE SLIDERS BAR (Domain Coasters Exact SEO Metric Controls) */}
        <div className="pt-3 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Min DR Slider */}
          <div className="bg-[#f8fafc] p-2.5 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between text-[11px] font-bold mb-1">
              <span className="text-gray-500">Min Ahrefs DR</span>
              <span className="text-[#FC6B17] font-black">{minDr > 0 ? minDr : '0+'}</span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={minDr}
              onChange={(e) => setMinDr(Number(e.target.value))}
              className="w-full accent-[#FC6B17] cursor-pointer"
            />
          </div>

          {/* Min DA Slider */}
          <div className="bg-[#f8fafc] p-2.5 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between text-[11px] font-bold mb-1">
              <span className="text-gray-500">Min Moz DA</span>
              <span className="text-blue-600 font-black">{minDa > 0 ? minDa : '0+'}</span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              step="5"
              value={minDa}
              onChange={(e) => setMinDa(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Min TF Slider */}
          <div className="bg-[#f8fafc] p-2.5 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between text-[11px] font-bold mb-1">
              <span className="text-gray-500">Min Majestic TF</span>
              <span className="text-purple-600 font-black">{minTf > 0 ? minTf : '0+'}</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="5"
              value={minTf}
              onChange={(e) => setMinTf(Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          {/* Min RD Slider */}
          <div className="bg-[#f8fafc] p-2.5 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between text-[11px] font-bold mb-1">
              <span className="text-gray-500">Min Ref Domains</span>
              <span className="text-emerald-700 font-black">{minRd > 0 ? minRd : '0+'}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2000"
              step="50"
              value={minRd}
              onChange={(e) => setMinRd(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* Min Age Slider */}
          <div className="bg-[#f8fafc] p-2.5 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between text-[11px] font-bold mb-1">
              <span className="text-gray-500">Min Archive Age</span>
              <span className="text-gray-800 font-black">{minAge > 0 ? `${minAge}y+` : 'Any'}</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={minAge}
              onChange={(e) => setMinAge(Number(e.target.value))}
              className="w-full accent-gray-700 cursor-pointer"
            />
          </div>

          {/* Max Price Slider */}
          <div className="bg-[#f8fafc] p-2.5 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between text-[11px] font-bold mb-1">
              <span className="text-gray-500">Max Price (USD)</span>
              <span className="text-emerald-700 font-black">${maxPrice.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="200"
              max="5000"
              step="100"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Bottom Filter Controls & Sort Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-400 font-bold">Quick Sort:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 pr-7 text-xs font-semibold text-gray-700 outline-none focus:border-[#FC6B17] cursor-pointer"
              >
                <option value="dr-desc">Ahrefs DR: High to Low</option>
                <option value="da-desc">Moz DA: High to Low</option>
                <option value="tf-desc">Majestic TF: High to Low</option>
                <option value="rd-desc">Referring Domains: Most</option>
                <option value="age-desc">Archive Age: Oldest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetAllFilters}
                className="text-[#FC6B17] hover:bg-orange-50 px-2.5 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset ({activeFiltersCount})</span>
              </button>
            )}

            {/* Quick See/Mask All Domains Toggle Button */}
            {!isAdmin && (
              <button
                type="button"
                onClick={handleToggleRevealAll}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 text-xs cursor-pointer shadow-2xs ${
                  revealedDomainIds.size === domains.length && domains.length > 0
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-orange-50 text-[#FC6B17] border border-orange-200 hover:bg-orange-100'
                }`}
                title={revealedDomainIds.size === domains.length ? 'Mask domain names' : 'Reveal all domain names'}
              >
                {revealedDomainIds.size === domains.length && domains.length > 0 ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Hide All</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-[#FC6B17]" />
                    <span>See All Domains</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* View Switcher & Counter */}
          <div className="flex items-center gap-3 justify-between sm:justify-end">
            <span className="text-gray-500 font-medium text-xs">
              Showing <strong className="text-gray-900">{filteredDomains.length}</strong> of{' '}
              <strong className="text-gray-900">{domains.length}</strong> domains
            </span>

            <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-[#FC6B17] shadow-2xs font-bold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Table View (Domain Coasters style)"
              >
                <ListIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#FC6B17] shadow-2xs font-bold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Cards Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* INVENTORY DISPLAY (TABLE / GRID) */}
      {filteredDomains.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-gray-100 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FC6B17] flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-800">No domains match your active filters</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Try lowering your minimum DR/DA/TF thresholds or click below to reset all filters.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleResetAllFilters}
              className="bg-[#FC6B17] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs hover:bg-[#e05607] transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* DOMAIN COASTERS PRO TABLE VIEW */
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-3 w-10 text-center">#</th>
                  <th className="py-3.5 px-4 w-[28%] min-w-[200px]">Domain Name</th>
                  <th className="py-3.5 px-2.5 w-[8%] text-center">Ahrefs DR</th>
                  <th className="py-3.5 px-2.5 w-[7%] text-center">Moz DA</th>
                  <th className="py-3.5 px-2.5 w-[7%] text-center">TF</th>
                  <th className="py-3.5 px-3 w-[8%] text-center">RD</th>
                  <th className="py-3.5 px-2.5 w-[7%] text-center">Age</th>
                  <th className="py-3.5 px-3 w-[9%] text-center font-black text-[#FC6B17]">Links</th>
                  <th className="py-3.5 px-4 w-[11%] min-w-[100px]">Price (USD)</th>
                  <th className="py-3.5 px-4 w-[11%] min-w-[110px] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredDomains.map((item, idx) => {
                  const isWishlisted = wishlistSet.has(item.domain.toLowerCase().trim());
                  const archiveUrl = `https://web.archive.org/web/*/${item.domain}`;

                  return (
                    <tr key={item.id} className="hover:bg-orange-50/20 transition-colors group">
                      {/* Index */}
                      <td className="py-3.5 px-3 text-center text-gray-400 font-mono text-[11px] font-bold">
                        {idx + 1}
                      </td>

                      {/* Domain Name + Niche + Archive */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleToggleWishlist(item)}
                            className="p-1 rounded-md text-gray-300 hover:text-[#FC6B17] transition-colors mt-0.5 cursor-pointer"
                            title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist & Favourites'}
                          >
                            <Bookmark
                              className={`w-3.5 h-3.5 transition-all ${
                                isWishlisted ? 'text-[#FC6B17] fill-[#FC6B17]' : 'text-gray-300 hover:text-[#FC6B17]'
                              }`}
                            />
                          </button>

                          <div>
                            <div className="font-extrabold text-[#0d1b3e] text-xs sm:text-[13px] flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                              {isAdmin || revealedDomainIds.has(item.id) ? (
                                <>
                                  <span className="font-mono font-bold text-gray-900">{item.domain}</span>
                                  {!isAdmin && (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleReveal(item.id)}
                                      className="text-[10px] text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 px-1.5 py-0.5 rounded font-bold transition-colors cursor-pointer"
                                      title="Hide domain name"
                                    >
                                      Hide
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(item.domain)}
                                    className="text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    title="Copy domain"
                                  >
                                    {copiedDomain === item.domain ? (
                                      <Check className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                  <a
                                    href={archiveUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Check Wayback Archive History"
                                  >
                                    <History className="w-3 h-3" />
                                  </a>
                                </>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-gray-800 tracking-wide select-none">
                                    {maskDomainName(item.domain)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleReveal(item.id)}
                                    className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#FC6B17] hover:text-white bg-orange-50 hover:bg-[#FC6B17] px-2 py-0.5 rounded-md border border-orange-200 transition-all cursor-pointer shadow-2xs"
                                    title="Click to see full domain name"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>See</span>
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded">
                                {item.category}
                              </span>
                              {item.featured && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                                  HOT
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Ahrefs DR */}
                      <td className="py-3.5 px-2.5 text-center">
                        <span className="inline-flex items-center justify-center gap-0.5 font-black text-xs text-[#FC6B17] bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">
                          {item.dr}
                        </span>
                      </td>

                      {/* Moz DA */}
                      <td className="py-3.5 px-2.5 text-center">
                        <span className="font-bold text-xs text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                          {item.da}
                        </span>
                      </td>

                      {/* Majestic TF */}
                      <td className="py-3.5 px-2.5 text-center">
                        <span className="font-bold text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                          {item.tf || 28}
                        </span>
                      </td>

                      {/* Referring Domains */}
                      <td className="py-3.5 px-3 text-center text-gray-800 font-extrabold">
                        {item.referringDomains.toLocaleString()}
                      </td>

                      {/* Archive Age */}
                      <td className="py-3.5 px-2.5 text-center text-gray-600 font-bold">
                        {item.ageYears}y
                      </td>

                      {/* Links Button Column (OldUrl Theme Rounded Button) */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedDomainForLinks(item)}
                          className="w-10 h-10 rounded-2xl bg-orange-50 hover:bg-[#FC6B17] text-[#FC6B17] hover:text-white border border-orange-200 flex items-center justify-center mx-auto transition-all duration-200 hover:scale-110 active:scale-95 shadow-2xs cursor-pointer group"
                          title={`View Verified Links & Proof Screenshots for ${item.domain}`}
                        >
                          <Link2 className="w-5 h-5 text-[#FC6B17] group-hover:text-white group-hover:rotate-[-10deg] transition-transform" />
                        </button>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-[#0d1b3e] text-sm">
                          ${item.price.toLocaleString()}
                        </div>
                        {item.originalPrice && (
                          <div className="text-[10px] text-gray-400 line-through">
                            ${item.originalPrice.toLocaleString()}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/dashboard/domain-analytics-result?domain=${encodeURIComponent(item.domain)}`}
                            className="p-1.5 text-gray-400 hover:text-[#FC6B17] hover:bg-orange-50 rounded-lg transition-colors"
                            title="Domain Analytics"
                          >
                            <BarChart2 className="w-3.5 h-3.5" />
                          </Link>

                          {/* Edit Domain Info Button (Admin Only) */}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Admin: Edit Domain Info & Metrics"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteListing(item.id, item.domain)}
                              className="p-1.5 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Admin: Delete listing"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleToggleCart(item)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-all cursor-pointer border ${
                              cartDomainSet.has(item.domain.toLowerCase().trim())
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-orange-50 hover:text-[#FC6B17]'
                            }`}
                            title={cartDomainSet.has(item.domain.toLowerCase().trim()) ? 'In Cart (Click to Remove)' : 'Add to Cart'}
                          >
                            {cartDomainSet.has(item.domain.toLowerCase().trim()) ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>In Cart</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3" />
                                <span>Cart</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedDomainForBuy(item)}
                            className="bg-[#FC6B17] hover:bg-[#e05607] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-1 transition-all hover:scale-102 cursor-pointer"
                          >
                            <span>Buy</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDomains.map((item) => {
            const isWishlisted = wishlistSet.has(item.domain.toLowerCase().trim());
            const archiveUrl = `https://web.archive.org/web/*/${item.domain}`;

            return (
              <div
                key={item.id}
                className="group relative bg-white rounded-2xl border border-gray-200/80 hover:border-orange-300 hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden"
              >
                {/* Top Section */}
                <div className="p-5 pb-3 border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-white">
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-[#FC6B17] border border-orange-100">
                      {item.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {item.featured && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500 text-white shadow-2xs">
                          <Sparkles className="w-2.5 h-2.5" /> HOT
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleWishlist(item)}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-[#FC6B17] hover:bg-orange-50 transition-colors cursor-pointer"
                        title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist & Favourites'}
                      >
                        <Bookmark
                          className={`w-4 h-4 transition-all ${
                            isWishlisted ? 'text-[#FC6B17] fill-[#FC6B17]' : 'text-gray-300 hover:text-[#FC6B17]'
                          }`}
                        />
                      </button>

                      {/* Edit Button (Admin Only) */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded-lg text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Admin: Edit Domain Info & Metrics"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteListing(item.id, item.domain)}
                          className="p-1.5 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Admin: Delete listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>


                  {/* Domain Name */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FC6B17] flex items-center justify-center shrink-0 border border-orange-100">
                        {isAdmin || revealedDomainIds.has(item.id) ? (
                          <Globe className="w-4 h-4" />
                        ) : (
                          <Lock className="w-4 h-4 text-[#FC6B17]" />
                        )}
                      </div>
                      {isAdmin || revealedDomainIds.has(item.id) ? (
                        <div className="flex items-center gap-1.5 truncate">
                          <h3 className="text-base sm:text-lg font-black text-[#0d1b3e] truncate tracking-tight font-mono">
                            {item.domain}
                          </h3>
                          {!isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleToggleReveal(item.id)}
                              className="text-[10px] text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 px-1.5 py-0.5 rounded font-bold transition-colors cursor-pointer shrink-0"
                            >
                              Hide
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-mono font-bold text-gray-800 tracking-wide select-none">
                            {maskDomainName(item.domain)}
                          </h3>
                          <button
                            type="button"
                            onClick={() => handleToggleReveal(item.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#FC6B17] hover:text-white bg-orange-50 hover:bg-[#FC6B17] px-2 py-0.5 rounded-md border border-orange-200 transition-all cursor-pointer shadow-2xs shrink-0"
                          >
                            <Eye className="w-3 h-3" />
                            <span>See</span>
                          </button>
                        </div>
                      )}
                    </div>
                    {(isAdmin || revealedDomainIds.has(item.id)) && (
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={archiveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-blue-600 p-1"
                          title="View Archive Record"
                        >
                          <History className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.domain)}
                          className="text-gray-300 hover:text-gray-600 p-1 cursor-pointer"
                        >
                          {copiedDomain === item.domain ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Metric Pills Grid (Domain Coasters Style) */}
                  <div className="grid grid-cols-5 gap-1.5 mt-4 text-center">
                    <div className="bg-[#fff7ed] p-2 rounded-xl border border-orange-200/60">
                      <div className="text-[9px] font-bold text-gray-500 uppercase">Ahrefs DR</div>
                      <div className="text-xs font-black text-[#FC6B17]">{item.dr}</div>
                    </div>
                    <div className="bg-blue-50/60 p-2 rounded-xl border border-blue-100">
                      <div className="text-[9px] font-bold text-gray-500 uppercase">Moz DA</div>
                      <div className="text-xs font-bold text-blue-700">{item.da}</div>
                    </div>
                    <div className="bg-purple-50/60 p-2 rounded-xl border border-purple-100">
                      <div className="text-[9px] font-bold text-gray-500 uppercase">TF</div>
                      <div className="text-xs font-bold text-purple-700">{item.tf || 28}</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                      <div className="text-[9px] font-bold text-gray-400 uppercase">RD</div>
                      <div className="text-xs font-bold text-gray-800">{item.referringDomains}</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                      <div className="text-[9px] font-bold text-gray-400 uppercase">Age</div>
                      <div className="text-xs font-bold text-gray-800">{item.ageYears}y</div>
                    </div>
                  </div>
                </div>

                {/* Links & Backlink Proof Action */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setSelectedDomainForLinks(item)}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-orange-50 hover:bg-[#FC6B17] text-[#FC6B17] hover:text-white border border-orange-200 flex items-center justify-center gap-2 font-bold text-xs transition-all hover:scale-[1.01] active:scale-98 shadow-2xs group cursor-pointer"
                    >
                      <Link2 className="w-4 h-4 text-[#FC6B17] group-hover:text-white group-hover:rotate-[-10deg] transition-transform" />
                      <span>View Backlinks &amp; Screenshots</span>
                      {(item.screenshots?.length || 0) > 0 && (
                        <span className="bg-[#FC6B17] group-hover:bg-white text-white group-hover:text-[#FC6B17] text-[10px] font-black px-1.5 py-0.2 rounded-md">
                          {item.screenshots?.length}
                        </span>
                      )}
                    </button>

                    <div className="flex flex-wrap gap-1.5">
                      {item.topAuthorityLinks.slice(0, 3).map((link, lIdx) => (
                        <div
                          key={lIdx}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                            link.badgeColor || 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          <span>{link.name}</span>
                          <span className="text-[10px] font-black opacity-80">DR {link.dr}</span>
                        </div>
                      ))}
                      {item.topAuthorityLinks.length > 3 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600">
                          +{item.topAuthorityLinks.length - 3}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-medium">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                      <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" /> Ownership Verified
                    </span>
                    <span className="inline-flex items-center gap-1 text-gray-500">
                      <Zap className="w-3 h-3 text-amber-500" /> Instant 2h Push
                    </span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-4 sm:p-5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Price</div>
                    <div className="text-xl font-black text-[#0d1b3e]">
                      ${item.price.toLocaleString()}{' '}
                      <span className="text-[10px] font-bold text-gray-400">USD</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/dashboard/domain-analytics-result?domain=${encodeURIComponent(item.domain)}`}
                      className="p-2 rounded-xl text-gray-500 hover:text-[#FC6B17] hover:bg-white border border-transparent hover:border-gray-200 transition-all"
                      title="View Domain Analytics"
                    >
                      <BarChart2 className="w-4 h-4" />
                    </Link>

                    {/* Edit Info Button in Card Footer (Admin Only) */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="p-2 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-white border border-transparent hover:border-gray-200 transition-all cursor-pointer"
                        title="Admin: Edit Domain Info & Metrics"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleCart(item)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer border ${
                        cartDomainSet.has(item.domain.toLowerCase().trim())
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-orange-50 hover:text-[#FC6B17]'
                      }`}
                      title={cartDomainSet.has(item.domain.toLowerCase().trim()) ? 'In Cart (Click to Remove)' : 'Add to Cart'}
                    >
                      {cartDomainSet.has(item.domain.toLowerCase().trim()) ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>In Cart</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Cart</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedDomainForBuy(item)}
                      className="bg-[#FC6B17] hover:bg-[#e05607] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all hover:scale-102 cursor-pointer"
                    >
                      <span>Buy Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      ) : (
        /* ORDERS & PURCHASE HISTORY TAB VIEW */
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Acquired Domains</span>
                <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#FC6B17] flex items-center justify-center">
                  <Package className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#0d1b3e]">
                {orders.length} <span className="text-xs font-bold text-gray-400">assets</span>
              </div>
              <p className="text-[11px] text-gray-500">In your OldUrl vault</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Investment</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600">
                ${ordersTotalSpent.toLocaleString()} <span className="text-xs font-bold text-gray-400">USD</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-medium">100% Escrow Protected</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Transfer Ready</span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Key className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-blue-700">
                {ordersCompletedCount} <span className="text-xs font-bold text-gray-400">EPP Dispatched</span>
              </div>
              <p className="text-[11px] text-blue-600 font-medium">Ready for registrar push</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Avg Authority</span>
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Award className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-purple-700">
                DR {ordersAvgDr}
              </div>
              <p className="text-[11px] text-purple-600 font-medium">High SEO Link Equity</p>
            </div>
          </div>

          {/* Search, Filter & Sort Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              {/* Search */}
              <div className="sm:col-span-6 relative">
                <Search className="w-4 h-4 text-gray-400 absolute top-3 left-3.5" />
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder="Search by domain name, order ID, or category..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 outline-none focus:border-[#FC6B17] focus:bg-white transition-all"
                />
                {orderSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setOrderSearchQuery('')}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="sm:col-span-3">
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value as any)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-700 outline-none focus:border-[#FC6B17] cursor-pointer"
                >
                  <option value="All">All Transfer Statuses</option>
                  <option value="Completed">Completed &amp; Ready</option>
                  <option value="Transfer in Progress">Transfer in Progress</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="sm:col-span-3">
                <select
                  value={orderSortBy}
                  onChange={(e) => setOrderSortBy(e.target.value as any)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-700 outline-none focus:border-[#FC6B17] cursor-pointer"
                >
                  <option value="date-desc">Newest Order First</option>
                  <option value="date-asc">Oldest Order First</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="dr-desc">Authority: DR High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Orders List / Table */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-gray-100 shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#FC6B17] flex items-center justify-center mx-auto shadow-xs">
                <Package className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0d1b3e]">
                  {orderSearchQuery || orderStatusFilter !== 'All' ? 'No orders match your filter' : 'No domain purchases yet'}
                </h3>
                <p className="text-xs text-gray-500 mt-1.5 max-w-md mx-auto leading-relaxed">
                  {orderSearchQuery || orderStatusFilter !== 'All'
                    ? 'Try adjusting your search query or reset filters.'
                    : 'Explore our curated marketplace to acquire high-DR expired domains with verified editorial backlinks and automated auth codes.'}
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveMainTab('inventory')}
                  className="inline-flex items-center gap-2 bg-[#FC6B17] hover:bg-[#e05607] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Browse Marketplace</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const purchaseFormatted = new Date(order.purchaseDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-xs hover:shadow-md transition-all space-y-4"
                  >
                    {/* Header Strip */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
                          {order.id}
                        </span>
                        <span className="text-xs text-gray-400">Ordered on {purchaseFormatted}</span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {order.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForReceipt(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 hover:text-[#FC6B17] bg-gray-50 hover:bg-orange-50 rounded-xl border border-gray-200 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Receipt / Invoice</span>
                        </button>
                      </div>
                    </div>

                    {/* Main Domain Body */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                      {/* Left Domain Details */}
                      <div className="lg:col-span-6 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xl sm:text-2xl font-black text-[#0d1b3e] tracking-tight font-mono">
                            {order.domain}
                          </h3>
                          <button
                            type="button"
                            onClick={() => handleCopyOrderText(order.domain, `domain-${order.id}`)}
                            className="p-1.5 text-gray-400 hover:text-[#FC6B17] hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                            title="Copy domain name"
                          >
                            {copiedOrderText === `domain-${order.id}` ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <a
                            href={`https://web.archive.org/web/*/${order.domain}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Check Wayback History"
                          >
                            <Globe className="w-4 h-4" />
                          </a>
                        </div>

                        {/* SEO Metrics Pill Badges */}
                        <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
                          <span className="bg-orange-50 text-[#FC6B17] border border-orange-200 px-2.5 py-1 rounded-lg">
                            Ahrefs DR {order.dr}
                          </span>
                          <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg">
                            Moz DA {order.da}
                          </span>
                          {order.tf && (
                            <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg">
                              TF {order.tf}
                            </span>
                          )}
                          <span className="bg-gray-50 text-gray-700 border border-gray-200 px-2.5 py-1 rounded-lg">
                            {order.referringDomains.toLocaleString()} RD
                          </span>
                          <span className="bg-gray-50 text-gray-600 border border-gray-200 px-2.5 py-1 rounded-lg">
                            {order.backlinks.toLocaleString()} Links
                          </span>
                        </div>
                      </div>

                      {/* Right: EPP Transfer Code Box */}
                      <div className="lg:col-span-6 bg-gray-50/90 rounded-2xl p-4 border border-gray-200/80 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-700 flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-[#FC6B17]" />
                            EPP Authorization / Auth-Code:
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Transfer Ready
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-white px-3.5 py-2 rounded-xl border border-gray-200 font-mono text-xs sm:text-sm font-bold text-gray-900 tracking-wider select-all shadow-2xs">
                            {order.authCode}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyOrderText(order.authCode, `code-${order.id}`)}
                            className="bg-[#FC6B17] hover:bg-[#e05607] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                          >
                            {copiedOrderText === `code-${order.id}` ? (
                              <>
                                <CheckCheck className="w-4 h-4" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>Copy Auth-Code</span>
                              </>
                            )}
                          </button>
                        </div>

                        <p className="text-[11px] text-gray-500 leading-normal">
                          Use this auth code at <strong className="text-gray-700">Namecheap, GoDaddy, Porkbun, Cloudflare</strong>, or any ICANN registrar to initiate transfer.
                        </p>
                      </div>
                    </div>

                    {/* Footer Strip with Price & Support */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-gray-100 text-xs text-gray-500">
                      <div>
                        Transfer Method: <strong className="text-gray-800">{order.transferMethod}</strong>
                      </div>
                      <div className="flex items-center gap-4">
                        <span>
                          Paid Amount:{' '}
                          <strong className="text-gray-900 font-black text-sm">
                            ${order.price.toLocaleString()} USD
                          </strong>
                        </span>
                        <a
                          href={`mailto:support@oldurl.domains?subject=Transfer Assistance for ${order.domain} (Order ${order.id})`}
                          className="text-[#FC6B17] hover:underline font-bold"
                        >
                          Need Transfer Help? →
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DIRECT ACQUISITION & CHECKOUT MODAL */}
      {selectedDomainForBuy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => {
                setSelectedDomainForBuy(null);
                setPurchaseSuccess(false);
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {purchaseSuccess ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#0d1b3e]">Purchase Order Initialized!</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    Your request to acquire <strong className="text-gray-900 font-bold">{selectedDomainForBuy.domain}</strong> has been confirmed. Your EPP Auth-Code has been generated and saved to your Orders dashboard.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-left space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Order ID:</span>
                    <span className="font-mono font-bold text-gray-900">{latestPurchasedOrder?.id || 'ORD-2026-RECENT'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Domain:</span>
                    <span className="font-bold text-gray-900 font-mono text-sm">{selectedDomainForBuy.domain}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Ahrefs DR:</span>
                    <span className="font-bold text-[#FC6B17]">DR {selectedDomainForBuy.dr}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Transfer Status:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      EPP Auth-Code Dispatched
                    </span>
                  </div>
                  {latestPurchasedOrder?.authCode && (
                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-gray-500 block mb-1 font-bold">EPP Auth-Code:</span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white p-2 rounded-lg border border-gray-200 font-mono font-bold text-gray-900 select-all">
                          {latestPurchasedOrder.authCode}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyOrderText(latestPurchasedOrder.authCode, 'latest-order-auth')}
                          className="p-2 bg-[#FC6B17] hover:bg-[#e05607] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          {copiedOrderText === 'latest-order-auth' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDomainForBuy(null);
                      setPurchaseSuccess(false);
                      setActiveMainTab('orders');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full bg-[#FC6B17] hover:bg-[#e05607] text-white py-3.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                  >
                    <Package className="w-4 h-4" />
                    <span>View in My Orders Tab →</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDomainForBuy(null);
                      setPurchaseSuccess(false);
                    }}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Continue Browsing
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FC6B17] bg-orange-50 px-2.5 py-1 rounded-full mb-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> Direct Verified Domain Acquisition
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-black text-[#0d1b3e] tracking-tight font-mono">
                      Acquire {isAdmin || revealedDomainIds.has(selectedDomainForBuy.id) ? selectedDomainForBuy.domain : maskDomainName(selectedDomainForBuy.domain)}
                    </h2>
                    {!isAdmin && !revealedDomainIds.has(selectedDomainForBuy.id) && (
                      <button
                        type="button"
                        onClick={() => handleToggleReveal(selectedDomainForBuy.id)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#FC6B17] hover:text-white bg-orange-50 hover:bg-[#FC6B17] px-2.5 py-1 rounded-lg border border-orange-200 transition-all cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>See Domain</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Instant ownership transfer via EPP Authorization Code or Registrar Push within 2 hours.
                  </p>
                </div>

                {/* Domain Specs Box */}
                <div className="p-4 bg-[#f8fafc] rounded-2xl border border-gray-100 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200/60">
                    <span className="text-gray-500">SEO Metrics</span>
                    <div className="flex gap-2">
                      <span className="font-black text-[#FC6B17] bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                        DR {selectedDomainForBuy.dr}
                      </span>
                      <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                        DA {selectedDomainForBuy.da}
                      </span>
                      <span className="font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                        TF {selectedDomainForBuy.tf || 28}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200/60">
                    <span className="text-gray-500">Backlinks &amp; Proof</span>
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedDomainForBuy;
                        setSelectedDomainForBuy(null);
                        setSelectedDomainForLinks(target);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-[#FC6B17] text-[#FC6B17] hover:text-white text-[11px] font-bold border border-orange-200 transition-colors cursor-pointer"
                    >
                      <Link2 className="w-3 h-3" />
                      <span>View Proof &amp; Screenshots</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200/60">
                    <span className="text-gray-500">Referring Domains / Backlinks</span>
                    <span className="font-bold text-gray-900">
                      {selectedDomainForBuy.referringDomains.toLocaleString()} RD / {selectedDomainForBuy.backlinks.toLocaleString()} Backlinks
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-extrabold pt-1">
                    <span className="text-gray-900">Total Purchase Price</span>
                    <span className="text-xl font-black text-[#FC6B17]">
                      ${selectedDomainForBuy.price.toLocaleString()} USD
                    </span>
                  </div>
                </div>

                {/* Safe Transfer Guarantee */}
                <div className="space-y-2 text-xs text-gray-600 bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/60">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Buyer Protection &amp; Escrow Guarantee
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    1. Funds held in 100% secure escrow until you confirm domain reception.
                    <br />
                    2. Instant EPP Transfer Auth-Code provided upon payment completion.
                  </p>
                </div>

                {/* Checkout CTA Buttons */}
                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleInitiatePurchase(selectedDomainForBuy)}
                    className="w-full bg-[#FC6B17] hover:bg-[#e05607] text-white py-3.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Instant Checkout (${selectedDomainForBuy.price.toLocaleString()} USD)</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <a
                      href={`mailto:support@oldurl.com?subject=Inquiry for ${selectedDomainForBuy.domain}&body=Hello, I am interested in purchasing ${selectedDomainForBuy.domain} for $${selectedDomainForBuy.price} USD.`}
                      className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Make Offer</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleInitiatePurchase(selectedDomainForBuy)}
                      className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Escrow Pay</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ADMIN POST & PUBLISH NEW DOMAIN MODAL */}
      {isListModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-5 my-8">
            <button
              type="button"
              onClick={() => setIsListModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FC6B17] bg-orange-50 px-2.5 py-1 rounded-full mb-2">
                <ShieldCheck className="w-3.5 h-3.5" /> Admin Publisher Portal
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0d1b3e] tracking-tight">
                Publish New Domain to Inventory
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Post high-authority vetted domains directly into the domain inventory with full SEO metrics.
              </p>
            </div>

            {autoFetchNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{autoFetchNotice}</span>
              </div>
            )}

            <form onSubmit={handleCreateListing} className="space-y-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-gray-700">
                    Domain Name <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoFetchNewDomain}
                    disabled={isFetchingAhrefsNew || !newDomain.trim()}
                    className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#FC6B17] hover:text-[#e05607] bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg border border-orange-200 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isFetchingAhrefsNew ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-[#FC6B17]" />
                    ) : (
                      <Zap className="w-3 h-3 text-[#FC6B17]" />
                    )}
                    <span>⚡ Auto-Fetch Live Ahrefs &amp; Referring Domains</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <input
                    type="text"
                    required
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="e.g. foodnwhine.com"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] focus:bg-white"
                  />
                  <div>
                    <input
                      type="number"
                      required
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="Price (USD $) e.g. 450"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Ahrefs DR</label>
                  <input
                    type="number"
                    value={newDr}
                    onChange={(e) => setNewDr(e.target.value)}
                    placeholder="e.g. 7"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] focus:bg-white font-bold text-[#FC6B17]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Moz DA</label>
                  <input
                    type="number"
                    value={newDa}
                    onChange={(e) => setNewDa(e.target.value)}
                    placeholder="e.g. 20"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] focus:bg-white font-bold text-blue-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Majestic TF</label>
                  <input
                    type="number"
                    value={newTf}
                    onChange={(e) => setNewTf(e.target.value)}
                    placeholder="e.g. 15"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] focus:bg-white font-bold text-purple-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Age (Yrs)</label>
                  <input
                    type="number"
                    value={newAgeYears}
                    onChange={(e) => setNewAgeYears(e.target.value)}
                    placeholder="e.g. 8"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] focus:bg-white font-bold text-gray-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Category / Niche</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] focus:bg-white font-semibold text-gray-700"
                  >
                    <option value="Technology & AI">Technology & AI</option>
                    <option value="Finance & Crypto">Finance & Crypto</option>
                    <option value="Health & Medical">Health & Medical</option>
                    <option value="Marketing & SEO">Marketing & SEO</option>
                    <option value="E-Commerce & SaaS">E-Commerce & SaaS</option>
                    <option value="News & Media">News & Media</option>
                    <option value="Lifestyle & Home">Lifestyle & Home</option>
                    <option value="Real Estate & Property">Real Estate & Property</option>
                    <option value="Legal & Law">Legal & Law</option>
                    <option value="General Authority">General Authority</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Referring Domains (RD)</label>
                  <input
                    type="number"
                    value={newReferringDomains}
                    onChange={(e) => setNewReferringDomains(e.target.value)}
                    placeholder="e.g. 226"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] focus:bg-white font-bold text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Top High-DR Authority Links (Mention Names &amp; DR)
                </label>
                <input
                  type="text"
                  value={newTopLinks}
                  onChange={(e) => setNewTopLinks(e.target.value)}
                  placeholder="e.g. zeit.de (DR 90), scoop.it (DR 90), metafilter.com (DR 90)"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] focus:bg-white font-medium"
                />
                <span className="text-[11px] text-gray-400 mt-0.5 block">
                  Format: <code className="text-gray-600 font-bold">domain.com (DR XX), nextdomain.com (DR XX)</code> or click ⚡ Auto-Fetch above.
                </span>
              </div>

              {/* SCREENSHOTS UPLOAD & PROOF SECTION */}
              <div className="p-4 bg-gray-50/90 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#4f46e5]" />
                    <span>Screenshots</span>
                  </span>
                  <span className="text-[11px] font-bold text-gray-500">
                    {newScreenshots.length} Uploaded
                  </span>
                </div>

                {/* Thumbnail Previews */}
                {newScreenshots.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 p-2.5 bg-white rounded-xl border border-gray-200">
                    {newScreenshots.map((src, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-video bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`Screenshot ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveScreenshot(idx, false)}
                          className="absolute top-1 right-1 p-1 bg-red-600/90 hover:bg-red-700 text-white rounded-md shadow-xs opacity-90 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Delete screenshot"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPreviewImage(src)}
                          className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload & URL Input Controls */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-indigo-50/50 border border-dashed border-indigo-200 rounded-xl cursor-pointer transition-colors text-indigo-700 font-bold text-xs">
                      <Upload className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Upload Screenshot Images</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileUpload(e, false)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={newScreenshotUrlInput}
                      onChange={(e) => setNewScreenshotUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddScreenshotUrl(false);
                        }
                      }}
                      placeholder="Or paste screenshot image URL (https://...)"
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#4f46e5] text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddScreenshotUrl(false)}
                      disabled={!newScreenshotUrlInput.trim()}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer shrink-0 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add URL</span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Domain Description &amp; Pitch</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Briefly describe the domain history, clean archive record, and recommended use case..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] focus:bg-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Original Price (Strikeout $ - Optional)</label>
                  <input
                    type="number"
                    value={newOriginalPrice}
                    onChange={(e) => setNewOriginalPrice(e.target.value)}
                    placeholder="e.g. 585"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Contact Email / Telegram (Optional)</label>
                  <input
                    type="text"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    placeholder="e.g. seller@domain.com"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsListModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#FC6B17] hover:bg-[#e05607] text-white px-5 py-2.5 rounded-xl font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publish to Inventory</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DOMAIN INFO & METRICS MODAL */}
      {isEditModalOpen && editingDomain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-5 my-8 animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingDomain(null);
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full mb-2">
                <Edit3 className="w-3.5 h-3.5" /> Edit Domain Listing Info &amp; Metrics
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0d1b3e] tracking-tight">
                Edit {editingDomain.domain}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Update Ahrefs DR, Moz DA, TF, Referring Domains, Price, or add/remove authority backlink mentions.
              </p>
            </div>

            {autoFetchNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{autoFetchNotice}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditListing} className="space-y-4 text-xs">
              {/* Domain Name & Auto-Fetch Button Strip */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-gray-700">
                    Domain Name <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoFetchEditDomain}
                    disabled={isFetchingAhrefsEdit || !editDomainName.trim()}
                    className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#FC6B17] hover:text-[#e05607] bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-xl border border-orange-200 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    {isFetchingAhrefsEdit ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FC6B17]" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-[#FC6B17]" />
                    )}
                    <span>⚡ Auto-Fetch from Ahrefs (DR, RD, Backlinks, Mentions)</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="sm:col-span-1">
                    <input
                      type="text"
                      required
                      value={editDomainName}
                      onChange={(e) => setEditDomainName(e.target.value)}
                      placeholder="e.g. foodnwhine.com"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] focus:bg-white font-bold text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-500 text-[10px] uppercase mb-0.5">
                      Selling Price (USD $) *
                    </label>
                    <input
                      type="number"
                      required
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      placeholder="e.g. 450"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] focus:bg-white font-black text-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-500 text-[10px] uppercase mb-0.5">
                      Original Price (Strikeout)
                    </label>
                    <input
                      type="number"
                      value={editOriginalPrice}
                      onChange={(e) => setEditOriginalPrice(e.target.value)}
                      placeholder="e.g. 585"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] focus:bg-white text-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Metric Values Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 bg-[#f8fafc] p-3 rounded-2xl border border-gray-200">
                <div>
                  <label className="block font-bold text-gray-600 text-[10px] uppercase mb-1">Ahrefs DR</label>
                  <input
                    type="number"
                    value={editDr}
                    onChange={(e) => setEditDr(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#FC6B17] font-black text-[#FC6B17] text-center"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-600 text-[10px] uppercase mb-1">Moz DA</label>
                  <input
                    type="number"
                    value={editDa}
                    onChange={(e) => setEditDa(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-bold text-blue-700 text-center"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-600 text-[10px] uppercase mb-1">Majestic TF</label>
                  <input
                    type="number"
                    value={editTf}
                    onChange={(e) => setEditTf(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg outline-none focus:border-purple-500 font-bold text-purple-700 text-center"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-600 text-[10px] uppercase mb-1">Ref Domains (RD)</label>
                  <input
                    type="number"
                    value={editReferringDomains}
                    onChange={(e) => setEditReferringDomains(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg outline-none focus:border-gray-500 font-extrabold text-gray-800 text-center"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-600 text-[10px] uppercase mb-1">Age (Years)</label>
                  <input
                    type="number"
                    value={editAgeYears}
                    onChange={(e) => setEditAgeYears(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg outline-none focus:border-gray-500 font-bold text-gray-700 text-center"
                  />
                </div>
              </div>

              {/* Category, Status & Featured Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Niche / Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] font-semibold text-gray-800"
                  >
                    <option value="Technology & AI">Technology & AI</option>
                    <option value="Finance & Crypto">Finance & Crypto</option>
                    <option value="Health & Medical">Health & Medical</option>
                    <option value="Marketing & SEO">Marketing & SEO</option>
                    <option value="E-Commerce & SaaS">E-Commerce & SaaS</option>
                    <option value="News & Media">News & Media</option>
                    <option value="Lifestyle & Home">Lifestyle & Home</option>
                    <option value="Real Estate & Property">Real Estate & Property</option>
                    <option value="Legal & Law">Legal & Law</option>
                    <option value="General Authority">General Authority</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Listing Status</label>
                  <select
                    value={editStatus}
                    onChange={(e: any) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] font-semibold text-gray-800"
                  >
                    <option value="available">🟢 Available for Sale</option>
                    <option value="reserved">🟡 Reserved / In Escrow</option>
                    <option value="sold">🔴 Sold</option>
                  </select>
                </div>

                <div className="pt-4 sm:pt-6">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700 select-none">
                    <input
                      type="checkbox"
                      checked={editFeatured}
                      onChange={(e) => setEditFeatured(e.target.checked)}
                      className="w-4 h-4 rounded text-[#FC6B17] accent-[#FC6B17]"
                    />
                    <span>Highlight with &quot;HOT&quot; Badge</span>
                  </label>
                </div>
              </div>

              {/* TOP AUTHORITY REFERRING DOMAINS MENTIONS MANAGER */}
              <div className="p-4 bg-gray-50/90 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-[#FC6B17]" />
                    <span>Top High-DR Referring Domain Mentions</span>
                  </span>
                  <span className="text-[11px] font-bold text-gray-500">
                    {editAuthorityLinks.length} Active Mentions
                  </span>
                </div>

                {/* Current Active Chips */}
                <div className="flex flex-wrap gap-2 min-h-[32px] p-2 bg-white rounded-xl border border-gray-200">
                  {editAuthorityLinks.length === 0 ? (
                    <span className="text-gray-400 text-xs italic">
                      No authority mentions added yet. Click suggestions below or ⚡ Auto-Fetch.
                    </span>
                  ) : (
                    editAuthorityLinks.map((item, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          item.badgeColor || 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        <span>{item.name}</span>
                        <span className="bg-black/10 px-1 py-0.2 rounded text-[10px] font-black">
                          DR {item.dr}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEditAuthorityLink(idx)}
                          className="text-gray-400 hover:text-red-600 ml-0.5"
                          title="Remove mention"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Add Custom Referring Domain Mention */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newAuthorityNameInput}
                      onChange={(e) => {
                        setNewAuthorityNameInput(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddEditAuthorityLink();
                        }
                      }}
                      placeholder="Enter domain URL (e.g. moneycontrol.com, thehealthsite.com, digit.in)..."
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] text-xs"
                    />
                    {isFetchingMentionDr && (
                      <div className="absolute right-2.5 top-2.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FC6B17]" />
                      </div>
                    )}
                  </div>
                  <div className="w-28 relative">
                    <input
                      type="number"
                      value={newAuthorityDrInput}
                      onChange={(e) => setNewAuthorityDrInput(e.target.value)}
                      placeholder="Ahrefs DR"
                      className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] font-black text-[#FC6B17] text-center text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddEditAuthorityLink}
                    disabled={!newAuthorityNameInput.trim() || isFetchingMentionDr}
                    className="px-4 py-2 bg-[#0d1b3e] hover:bg-[#152a5c] text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center gap-1 shrink-0 text-xs cursor-pointer"
                  >
                    {isFetchingMentionDr ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>Add Link</span>
                  </button>
                </div>

                {/* Quick Add Authority Suggestions with Verified Ahrefs DR */}
                <div className="pt-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5">
                    Quick Add Top Authority Sources (Verified Ahrefs DR):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: 'moneycontrol.com', dr: 90 },
                      { name: 'firstpost.com', dr: 89 },
                      { name: 'thehealthsite.com', dr: 77 },
                      { name: 'digit.in', dr: 78 },
                      { name: 'threadreaderapp.com', dr: 85 },
                      { name: 'forbes.com', dr: 94 },
                      { name: 'techcrunch.com', dr: 92 },
                      { name: 'wikipedia.org', dr: 98 },
                      { name: 'zeit.de', dr: 90 },
                      { name: 'scoop.it', dr: 82 },
                      { name: 'metafilter.com', dr: 77 },
                      { name: 'deeranddeerhunting.com', dr: 56 },
                      { name: 'bloomberg.com', dr: 94 },
                      { name: 'reuters.com', dr: 95 },
                      { name: 'healthline.com', dr: 91 },
                    ].map((sug) => (
                      <button
                        key={sug.name}
                        type="button"
                        onClick={() => handleQuickAddAuthority(sug.name, sug.dr)}
                        className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white hover:bg-orange-50 text-gray-700 hover:text-[#FC6B17] border border-gray-200 hover:border-orange-200 transition-colors cursor-pointer"
                      >
                        + {sug.name} (DR {sug.dr})
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SCREENSHOTS UPLOAD & PROOF SECTION (EDIT MODAL) */}
              <div className="p-4 bg-gray-50/90 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#4f46e5]" />
                    <span>Screenshots</span>
                  </span>
                  <span className="text-[11px] font-bold text-gray-500">
                    {editScreenshots.length} Attached
                  </span>
                </div>

                {/* Thumbnail Previews */}
                {editScreenshots.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 p-2.5 bg-white rounded-xl border border-gray-200">
                    {editScreenshots.map((src, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-video bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`Screenshot ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveScreenshot(idx, true)}
                          className="absolute top-1 right-1 p-1 bg-red-600/90 hover:bg-red-700 text-white rounded-md shadow-xs opacity-90 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Delete screenshot"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPreviewImage(src)}
                          className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload & URL Input Controls */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-indigo-50/50 border border-dashed border-indigo-200 rounded-xl cursor-pointer transition-colors text-indigo-700 font-bold text-xs">
                      <Upload className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Upload Screenshot Images</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileUpload(e, true)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={editScreenshotUrlInput}
                      onChange={(e) => setEditScreenshotUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddScreenshotUrl(true);
                        }
                      }}
                      placeholder="Or paste screenshot image URL (https://...)"
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#4f46e5] text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddScreenshotUrl(true)}
                      disabled={!editScreenshotUrlInput.trim()}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer shrink-0 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add URL</span>
                    </button>
                  </div>
                </div>
              </div>


              {/* Description */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Domain Description &amp; Pitch</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Describe domain backlink profile, clean history, use cases..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FC6B17] focus:bg-white resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingDomain(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#FC6B17] hover:bg-[#e05607] text-white px-6 py-2.5 rounded-xl font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN PASSCODE UNLOCK MODAL */}
      {isAdminPasscodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-4">
            <button
              type="button"
              onClick={() => {
                setIsAdminPasscodeModalOpen(false);
                setAdminPasscode('');
                setAdminPasscodeError(false);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FC6B17] flex items-center justify-center mx-auto">
                <Key className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-[#0d1b3e]">Admin Publishing Access</h3>
              <p className="text-xs text-gray-500">
                Enter your admin security passcode to post and manage domain inventory.
              </p>
            </div>

            <form onSubmit={handleAdminPasscodeSubmit} className="space-y-3">
              <div>
                <input
                  type="password"
                  autoFocus
                  required
                  value={adminPasscode}
                  onChange={(e) => {
                    setAdminPasscode(e.target.value);
                    setAdminPasscodeError(false);
                  }}
                  placeholder="Enter admin passcode (e.g. oldurladmin)..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#FC6B17] focus:bg-white text-center font-mono font-bold"
                />
                {adminPasscodeError && (
                  <p className="text-[11px] text-red-500 font-semibold mt-1.5 text-center">
                    Incorrect passcode. Try &quot;oldurladmin&quot; or &quot;admin2026&quot;.
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-[#FC6B17] hover:bg-[#e05607] text-white py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                Unlock Admin Controls
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Auth Modal for Gated Checkout */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* VERIFIED LINKS & AUTHORITY PROOF MODAL (EXACT DOMAIN COASTERS UI MATCH) */}
      {selectedDomainForLinks && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-6 animate-in zoom-in-95">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedDomainForLinks(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 p-1.5 rounded-full hover:bg-gray-100 transition-colors z-20 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header: Domain Name on left, Domain Coasters style Branding on right */}
            <div className="p-6 pb-4 flex items-center justify-between gap-4 border-b border-gray-100 pr-12">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase font-mono">
                    {isAdmin || revealedDomainIds.has(selectedDomainForLinks.id) ? selectedDomainForLinks.domain : maskDomainName(selectedDomainForLinks.domain)}
                  </h2>
                  {!isAdmin && !revealedDomainIds.has(selectedDomainForLinks.id) && (
                    <button
                      type="button"
                      onClick={() => handleToggleReveal(selectedDomainForLinks.id)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#FC6B17] hover:text-white bg-orange-50 hover:bg-[#FC6B17] px-2.5 py-1 rounded-lg border border-orange-200 transition-all cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>See</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-gray-500">
                    Ahrefs DR {selectedDomainForLinks.dr} · Moz DA {selectedDomainForLinks.da}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                    ${selectedDomainForLinks.price.toLocaleString()} USD
                  </span>
                </div>
              </div>

              {/* OldURL Brand Badge */}
              <div className="flex items-center gap-2 select-none">
                <div className="w-9 h-9 rounded-xl bg-[#FC6B17] text-white flex items-center justify-center font-black shadow-sm">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="leading-tight text-right">
                  <div className="text-base font-black text-[#0d1b3e] tracking-tight">OldURL</div>
                  <div className="text-[10px] font-bold text-[#FC6B17] tracking-wide uppercase">Verified Inventory</div>
                </div>
              </div>
            </div>

            {/* Optional Tab Switcher / Admin Upload Bar */}
            <div className="px-6 py-2.5 bg-gray-50/90 flex items-center justify-between gap-2 border-b border-gray-100 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setLinksModalTab('table')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    linksModalTab === 'table'
                      ? 'bg-[#FC6B17] text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'
                  }`}
                >
                  Referring Domains Table
                </button>

                {selectedDomainForLinks.screenshots && selectedDomainForLinks.screenshots.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setLinksModalTab('screenshot')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                      linksModalTab === 'screenshot'
                        ? 'bg-[#FC6B17] text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/70'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Screenshot</span>
                  </button>
                )}
              </div>

              {/* Admin Direct Upload */}
              {isAdmin && (
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-orange-50 text-[#FC6B17] border border-orange-200 rounded-lg font-bold text-xs cursor-pointer transition-colors shadow-2xs">
                  <Upload className="w-3.5 h-3.5 text-[#FC6B17]" />
                  <span>+ Upload Screenshot</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleUploadInLinksModal}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* TAB 1: EXACT DOMAIN COASTERS 3-COLUMN TABLE */}
            {linksModalTab === 'table' ? (
              <div className="max-h-[60vh] overflow-y-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-orange-50 text-[#FC6B17] text-xs font-black uppercase sticky top-0 border-b border-orange-200">
                    <tr>
                      <th scope="col" className="px-6 py-3 font-extrabold text-[#FC6B17]">
                        Referring Domains
                      </th>
                      <th scope="col" className="px-4 py-3 text-center font-extrabold text-[#FC6B17]">
                        Domain Rating
                      </th>
                      <th scope="col" className="px-4 py-3 text-center font-extrabold text-[#FC6B17]">
                        Backlinks Count
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {selectedDomainForLinks.topAuthorityLinks && selectedDomainForLinks.topAuthorityLinks.length > 0 ? (
                      selectedDomainForLinks.topAuthorityLinks.map((link, idx) => {
                        const backlinksCount = link.backlinksCount || ((idx % 3) + 1);
                        return (
                          <tr key={idx} className="hover:bg-orange-50/20 transition-colors">
                            <td className="px-6 py-3 font-semibold text-gray-900">
                              {link.name}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-gray-800">
                              {link.dr}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-gray-800">
                              {backlinksCount}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-gray-400 italic">
                          No referring domain records available for this domain.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* TAB 2: AHREFS SCREENSHOT VIEW */
              <div className="p-6 bg-gray-50 max-h-[60vh] overflow-y-auto space-y-4">
                {selectedDomainForLinks.screenshots && selectedDomainForLinks.screenshots.length > 0 ? (
                  <div className="space-y-4">
                    {selectedDomainForLinks.screenshots.map((src, idx) => (
                      <div
                        key={idx}
                        className="group relative bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt={`Ahrefs Proof Screenshot ${idx + 1}`}
                          className="w-full h-auto object-contain cursor-pointer"
                          onClick={() => setSelectedPreviewImage(src)}
                        />
                        <div
                          onClick={() => setSelectedPreviewImage(src)}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white"
                        >
                          <div className="flex items-center gap-1.5 text-xs font-bold bg-black/80 px-3.5 py-2 rounded-xl backdrop-blur-xs">
                            <Maximize2 className="w-4 h-4" />
                            <span>Click to Zoom Full-Resolution</span>
                          </div>
                        </div>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveScreenshotInLinksModal(idx);
                            }}
                            className="absolute top-3 right-3 p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md transition-colors cursor-pointer z-10"
                            title="Delete this screenshot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400">No screenshot uploaded.</div>
                )}
              </div>
            )}

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
              <span className="text-xs text-gray-500 font-medium">
                Verified Domain Rating &amp; Backlink Database
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDomainForLinks(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = selectedDomainForLinks;
                    setSelectedDomainForLinks(null);
                    setSelectedDomainForBuy(d);
                  }}
                  className="bg-[#FC6B17] hover:bg-[#e05607] text-white px-5 py-2 rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all hover:scale-102 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Buy Domain (${selectedDomainForLinks.price.toLocaleString()})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX PREVIEW MODAL */}
      {selectedPreviewImage && (
        <div
          onClick={() => setSelectedPreviewImage(null)}
          className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in cursor-zoom-out"
        >
          <div
            className="relative max-w-[94vw] max-h-[92vh] flex flex-col items-center bg-white p-2 rounded-2xl shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-12 right-0 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedPreviewImage(null)}
                className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors cursor-pointer"
                title="Close Lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedPreviewImage}
              alt="Proof screenshot enlarged"
              className="max-w-[92vw] max-h-[86vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* INVOICE & RECEIPT MODAL */}
      {selectedOrderForReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => setSelectedOrderForReceipt(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Content for Display & Print */}
            <div id="printable-order-receipt" className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2 text-xl font-black text-[#0d1b3e]">
                  <div className="w-7 h-7 rounded-lg bg-[#FC6B17] text-white flex items-center justify-center text-xs font-black">
                    O
                  </div>
                  <span>
                    <span className="text-[#FC6B17]">Old</span>Url<span className="text-xs font-mono text-gray-400 font-normal ml-1">.domains</span>
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-gray-900">RECEIPT &amp; INVOICE</div>
                  <div className="text-[11px] font-mono text-gray-400">
                    INV-{selectedOrderForReceipt.id}
                  </div>
                </div>
              </div>

              {/* Order Meta */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Date of Purchase</div>
                  <div className="font-bold text-gray-800 mt-0.5">
                    {new Date(selectedOrderForReceipt.purchaseDate).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Billed Account</div>
                  <div className="font-bold text-gray-800 mt-0.5">
                    {selectedOrderForReceipt.userEmail || currentUser?.email || 'Verified Buyer'}
                  </div>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden text-xs">
                <div className="bg-gray-50 px-4 py-2.5 font-bold text-gray-700 grid grid-cols-12 border-b border-gray-200">
                  <div className="col-span-8">Description</div>
                  <div className="col-span-4 text-right">Amount</div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-12 items-center">
                    <div className="col-span-8">
                      <div className="font-extrabold text-[#0d1b3e] font-mono text-sm">
                        {selectedOrderForReceipt.domain}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        Aged Authority Domain • DR {selectedOrderForReceipt.dr} • {selectedOrderForReceipt.referringDomains.toLocaleString()} Referring Domains
                      </div>
                    </div>
                    <div className="col-span-4 text-right font-bold text-gray-900">
                      ${selectedOrderForReceipt.price.toLocaleString()} USD
                    </div>
                  </div>

                  <div className="grid grid-cols-12 items-center text-gray-500 text-[11px] pt-2 border-t border-gray-100">
                    <div className="col-span-8">Escrow Protection &amp; Auth-Code Dispatch</div>
                    <div className="col-span-4 text-right font-semibold text-emerald-600">INCLUDED</div>
                  </div>
                </div>

                <div className="bg-orange-50/50 p-4 border-t border-gray-200 flex justify-between items-center text-sm font-black text-[#0d1b3e]">
                  <span>Total Paid</span>
                  <span className="text-lg text-[#FC6B17]">
                    ${selectedOrderForReceipt.price.toLocaleString()} USD
                  </span>
                </div>
              </div>

              {/* Transfer Details Card */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-1.5 text-xs">
                <div className="font-bold text-gray-800 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#FC6B17]" /> EPP Transfer Authorization Code
                </div>
                <div className="font-mono bg-white p-2.5 rounded-xl border border-gray-200 text-gray-900 font-bold select-all">
                  {selectedOrderForReceipt.authCode}
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  Guaranteed clean ownership push. For registrar push assistance, contact support@oldurl.domains.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrderForReceipt(null)}
                className="flex-1 bg-[#0d1b3e] hover:bg-[#182f66] text-white py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CART DRAWER */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckoutSuccess={() => {
          setActiveMainTab('orders');
          setOrders(getMarketplaceOrders(currentUser?.email));
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />
    </div>
  );
}

