'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

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

export function usePOSChannel(sessionId: string | null) {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const [cart, setCart] = useState<CartData>({ items: [], total: 0 });

  useEffect(() => {
    if (!sessionId) return;

    const channelName = `pos-${sessionId}`;
    channelRef.current = new BroadcastChannel(channelName);

    channelRef.current.onmessage = (event: MessageEvent<POSMessage>) => {
      const message = event.data;
      
      if (message.type === 'cart-update' && message.data) {
        setCart(message.data);
      } else if (message.type === 'clear-cart') {
        setCart({ items: [], total: 0 });
      }
    };

    return () => {
      channelRef.current?.close();
    };
  }, [sessionId]);

  const sendCartUpdate = useCallback((data: CartData) => {
    if (!channelRef.current) return;
    
    const message: POSMessage = {
      type: 'cart-update',
      data,
      timestamp: Date.now(),
    };
    
    channelRef.current.postMessage(message);
    setCart(data);
  }, []);

  const clearCart = useCallback(() => {
    if (!channelRef.current) return;
    
    const message: POSMessage = {
      type: 'clear-cart',
      timestamp: Date.now(),
    };
    
    channelRef.current.postMessage(message);
    setCart({ items: [], total: 0 });
  }, []);

  return { cart, sendCartUpdate, clearCart };
}
