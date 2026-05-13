'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartData {
  items: CartItem[];
  total: number;
}

interface POSMessage {
  type: 'cart-update' | 'clear-cart' | 'payment-complete';
  data?: CartData;
  timestamp: number;
}

export default function CustomerDisplayPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const [cart, setCart] = useState<CartData>({ items: [], total: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    // Listen for fullscreen request from opener window
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'request-fullscreen') {
        document.documentElement.requestFullscreen?.().catch(() => {
          // Fullscreen blocked - show button instead
        });
      }
    };
    window.addEventListener('message', handleMessage);

    // Try to go fullscreen on mount
    const enterFullscreen = async () => {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch {
        // Fullscreen not allowed or not supported
        // User will need to click the fullscreen button
      }
    };
    
    // Small delay to ensure page is ready
    setTimeout(enterFullscreen, 100);

    // Set up BroadcastChannel
    const channelName = `pos-${sessionId}`;
    const channel = new BroadcastChannel(channelName);
    setConnected(true);

    channel.onmessage = (event: MessageEvent<POSMessage>) => {
      const message = event.data;
      
      if (message.type === 'cart-update' && message.data) {
        setCart(message.data);
      } else if (message.type === 'clear-cart') {
        setCart({ items: [], total: 0 });
      }
    };

    return () => {
      window.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, [sessionId]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Ignore fullscreen errors
    }
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Geen sessie ID</h1>
          <p className="text-gray-400">Open dit scherm via de kassa.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-8 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Uw Bestelling
          </h1>
          <p className="text-gray-400 mt-2">
            {connected ? '🟢 Verbonden' : '🟡 Verbinden...'}
          </p>
        </div>
        <button
          onClick={toggleFullscreen}
          className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {isFullscreen ? '⛶ Exit Fullscreen' : '⛶ Fullscreen'}
        </button>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-auto">
        {cart.items.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">🛒</div>
              <h2 className="text-2xl text-gray-400">Winkelwagen is leeg</h2>
              <p className="text-gray-500 mt-2">Voeg items toe via de kassa</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {cart.items.map((item, index) => (
              <div
                key={item.id}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 flex items-center justify-between animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl font-bold">
                    {item.quantity}x
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold">{item.name}</h3>
                    <p className="text-gray-400">€{item.price.toFixed(2)} per stuk</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-400">
                    €{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Total */}
      <div className="mt-8 pt-8 border-t-2 border-white/20">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="text-gray-400 text-xl">
            {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}
          </div>
          <div className="flex items-center gap-8">
            <span className="text-3xl font-light text-gray-300">Totaal</span>
            <span className="text-6xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
              €{cart.total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Thank You Message */}
      {cart.items.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-xl text-gray-500">Bedankt voor uw bestelling!</p>
        </div>
      )}
    </div>
  );
}
