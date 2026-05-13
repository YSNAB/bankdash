'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePOSChannel } from '@/hooks/usePOSChannel';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface CartItem extends Product {
  quantity: number;
}

const SAMPLE_PRODUCTS: Product[] = [
  { id: '1', name: 'Koffie', price: 3.50, category: 'Dranken' },
  { id: '2', name: 'Thee', price: 2.50, category: 'Dranken' },
  { id: '3', name: 'Broodje kaas', price: 4.50, category: 'Eten' },
  { id: '4', name: 'Croissant', price: 2.80, category: 'Eten' },
  { id: '5', name: 'Fles water', price: 2.00, category: 'Dranken' },
  { id: '6', name: 'Chocolade', price: 2.20, category: 'Snacks' },
];

function CashierContent() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerWindow, setCustomerWindow] = useState<Window | null>(null);
  const { sendCartUpdate, clearCart: sendClearCart } = usePOSChannel(sessionId);

  // Get session ID from URL params or localStorage or generate new
  useEffect(() => {
    const urlSession = searchParams.get('session');
    
    if (urlSession) {
      // Use session from URL (highest priority)
      setSessionId(urlSession);
      localStorage.setItem('pos-session', urlSession);
    } else {
      // Fallback to localStorage or generate new
      const existingSession = localStorage.getItem('pos-session');
      if (existingSession) {
        setSessionId(existingSession);
      } else {
        const newSession = 'pos-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('pos-session', newSession);
        setSessionId(newSession);
      }
    }
  }, [searchParams]);

  // Send cart updates to customer screen
  useEffect(() => {
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    sendCartUpdate({ items: cart, total });
  }, [cart, sendCartUpdate]);

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
    sendClearCart();
  }, [sendClearCart]);

  const openCustomerDisplay = useCallback(() => {
    if (!sessionId) return;
    
    // Open customer display in a new window
    const url = `/pos/customer?session=${sessionId}`;
    
    // Get screen dimensions
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    
    // If dual monitor (screen.availWidth > screen.width), position on second monitor
    const hasSecondMonitor = window.screen.availWidth > screenWidth;
    
    let left, top, width, height;
    
    if (hasSecondMonitor) {
      // Position on second monitor (right side)
      left = screenWidth;
      top = 0;
      width = window.screen.availWidth - screenWidth;
      height = screenHeight;
    } else {
      // Single monitor - open maximized
      left = 0;
      top = 0;
      width = screenWidth;
      height = screenHeight;
    }
    
    const newWindow = window.open(
      url,
      'customer-display',
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    if (newWindow) {
      setCustomerWindow(newWindow);
      
      // Try to trigger fullscreen after a short delay
      setTimeout(() => {
        // Send message to customer window to request fullscreen
        newWindow.postMessage({ type: 'request-fullscreen' }, window.location.origin);
      }, 500);
    }
  }, [sessionId]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const categories = Array.from(new Set(SAMPLE_PRODUCTS.map(p => p.category)));

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">POS Kassa</h1>
            <p className="text-sm text-gray-500">Sessie: {sessionId}</p>
          </div>
          <button
            onClick={openCustomerDisplay}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Open Klantscherm
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2 space-y-6">
            {categories.map(category => (
              <div key={category} className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">{category}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {SAMPLE_PRODUCTS.filter(p => p.category === category).map(product => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-blue-300 rounded-lg p-4 text-left transition-all"
                    >
                      <div className="font-medium text-gray-800">{product.name}</div>
                      <div className="text-blue-600 font-bold">€{product.price.toFixed(2)}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Cart Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Winkelwagen</h2>
            
            {cart.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Geen items</p>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{item.name}</div>
                      <div className="text-sm text-gray-500">€{item.price.toFixed(2)} per stuk</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-700"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-700"
                      >
                        +
                      </button>
                    </div>
                    <div className="ml-4 text-right min-w-[80px]">
                      <div className="font-bold text-gray-800">€{(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            <div className="border-t-2 border-gray-200 mt-4 pt-4">
              <div className="flex justify-between items-center text-2xl font-bold">
                <span>Totaal</span>
                <span className="text-blue-600">€{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={clearCart}
                disabled={cart.length === 0}
                className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 py-3 rounded-lg font-medium transition-colors"
              >
                Leegmaken
              </button>
              <button
                disabled={cart.length === 0}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Afrekenen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CashierPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Laden...</p>
      </div>
    }>
      <CashierContent />
    </Suspense>
  );
}
