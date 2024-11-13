import React, { useState } from 'react';
import { X, Plus, Minus, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

export default function Cart({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { items, removeFromCart, updateQuantity, total, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleCheckout = async () => {
    setIsProcessing(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.id,
            quantity: item.quantity
          }))
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to process order');
      }

      const order = await response.json();
      clearCart();
      onClose();
      navigate('/orders', { state: { newOrder: order } });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-lg">
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="text-lg font-semibold">Shopping Cart</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          {items.length === 0 ? (
            <p className="text-gray-500 text-center">Your cart is empty</p>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex items-center space-x-4 border-b pb-4">
                  <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-green-600">₹{item.price}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-gray-100 rounded"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-5 w-5 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {items.length > 0 && (
          <div className="border-t p-4">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold">Total:</span>
              <span className="text-xl font-bold text-green-600">₹{total.toFixed(2)}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-green-400 flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                'Checkout'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}