import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle } from 'lucide-react';

interface OrderItem {
  id: number;
  product_id: number;
  name: string;
  quantity: number;
  price_per_unit: number;
  total_price: number;
}

interface Order {
  id: number;
  total_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  created_at: string;
  items: OrderItem[];
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  if (loading) return <div className="text-center py-12">Loading orders...</div>;
  if (error) return <div className="text-center py-12 text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>

      {location.state?.newOrder && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          Order placed successfully! Order ID: #{location.state.newOrder.id}
        </div>
      )}

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Order #{order.id}</h3>
                  <p className="text-sm text-gray-500">
                    Placed on {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(order.status)}
                  <span className="capitalize text-sm font-medium">
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="border-t border-b py-4 my-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        Quantity: {item.quantity} × ₹{item.price_per_unit}
                      </p>
                    </div>
                    <p className="font-medium">₹{item.total_price}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <p className="text-lg font-bold">
                  Total: ₹{order.total_amount}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}