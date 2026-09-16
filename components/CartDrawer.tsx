'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  X,
  Trash2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Key,
  Sparkles,
  ExternalLink,
  Package,
} from 'lucide-react';
import { CartItem, getCart, removeFromCart, clearCart } from '../lib/cart';
import { addMarketplaceOrder } from '../lib/orders';
import { supabase } from '../lib/supabaseClient';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckoutSuccess?: () => void;
  onOpenAuthModal?: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  onCheckoutSuccess,
  onOpenAuthModal,
}: CartDrawerProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [purchasedCount, setPurchasedCount] = useState(0);

  useEffect(() => {
    const syncCart = () => {
      setItems(getCart());
    };
    syncCart();

    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          setCurrentUser(data.session.user);
        } else {
          const cached = localStorage.getItem('oldurl_cached_user');
          if (cached) setCurrentUser(JSON.parse(cached));
        }
      } catch (e) {}
    };
    checkUser();

    window.addEventListener('oldurl_cart_updated', syncCart);
    return () => {
      window.removeEventListener('oldurl_cart_updated', syncCart);
    };
  }, []);

  const totalAmount = items.reduce((sum, item) => sum + (item.price || 0), 0);

  const handleCheckoutAll = () => {
    if (items.length === 0) return;

    if (!currentUser) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }

    setIsCheckingOut(true);

    // Create an order for each cart item
    const count = items.length;
    items.forEach((item) => {
      addMarketplaceOrder({
        domain: item.domain,
        tld: item.tld,
        dr: item.dr,
        da: item.da,
        tf: item.tf,
        referringDomains: item.referringDomains,
        backlinks: item.backlinks,
        price: item.price,
        category: item.category,
        userEmail: currentUser?.email,
      });
    });

    clearCart();
    setPurchasedCount(count);
    setCheckoutSuccess(true);
    setIsCheckingOut(false);

    if (onCheckoutSuccess) {
      onCheckoutSuccess();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-gray-100 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-[#faf9f8]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FC6B17] flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-[#0d1b3e] tracking-tight">
                  Domain Cart
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  {items.length} {items.length === 1 ? 'domain' : 'domains'} selected
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {checkoutSuccess ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#0d1b3e]">
                    Purchase Completed!
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                    Successfully acquired {purchasedCount} {purchasedCount === 1 ? 'domain' : 'domains'}. EPP Auth-Codes have been generated and saved to your Orders dashboard.
                  </p>
                </div>

                <div className="pt-3 space-y-2">
                  <Link
                    href="/dashboard/marketplace?tab=orders"
                    onClick={() => {
                      setCheckoutSuccess(false);
                      onClose();
                    }}
                    className="w-full bg-[#FC6B17] hover:bg-[#e05607] text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all"
                  >
                    <Package className="w-4 h-4" />
                    <span>View in My Orders Tab →</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutSuccess(false);
                      onClose();
                    }}
                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#FC6B17] flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Your cart is empty</h4>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                    Browse our authority marketplace to add vetted high-DR domains to your cart.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Selected Assets
                  </span>
                  <button
                    type="button"
                    onClick={() => clearCart()}
                    className="text-xs text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                  >
                    Remove All
                  </button>
                </div>

                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-[#faf9f8] rounded-2xl border border-gray-200/70 hover:border-orange-200 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-mono font-bold text-sm text-[#0d1b3e]">
                          {item.domain}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold">
                          <span className="text-[#FC6B17] bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                            DR {item.dr}
                          </span>
                          <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            DA {item.da}
                          </span>
                          <span className="text-gray-500">
                            {item.referringDomains.toLocaleString()} RD
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-black text-sm text-[#FC6B17]">
                          ${item.price.toLocaleString()}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-400 hover:text-red-500 p-1 mt-1 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer / Summary */}
          {!checkoutSuccess && items.length > 0 && (
            <div className="p-5 sm:p-6 border-t border-gray-100 bg-[#faf9f8] space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal ({items.length} items)</span>
                  <span className="font-bold text-gray-800">${totalAmount.toLocaleString()} USD</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Escrow &amp; Transfer Verification</span>
                  <span className="font-bold text-emerald-600">INCLUDED (FREE)</span>
                </div>
                <div className="flex justify-between text-sm font-black text-[#0d1b3e] pt-2 border-t border-gray-200">
                  <span>Total Amount</span>
                  <span className="text-base text-[#FC6B17]">${totalAmount.toLocaleString()} USD</span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleCheckoutAll}
                  disabled={isCheckingOut}
                  className="w-full bg-[#FC6B17] hover:bg-[#e05607] disabled:opacity-50 text-white py-3.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Instant Checkout (${totalAmount.toLocaleString()} USD)</span>
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>100% Escrow Protection &amp; Instant Auth-Code</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
