import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import type { CropGuide } from '../types/Crop';

export default function AdminCropGuides() {
  const [guides, setGuides] = useState<CropGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddGuideOpen, setIsAddGuideOpen] = useState(false);

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    try {
      const response = await fetch('/api/crops/guides/admin', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch guides');
      const data = await response.json();
      setGuides(data);
    } catch (err) {
      setError('Failed to load guides');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Crop Growing Guides</h1>
        <button
          onClick={() => setIsAddGuideOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="h-5 w-5" />
          <span>Add Guide</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Crop Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Season
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {guides.map((guide) => (
              <tr key={guide.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {guide.crop_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {guide.season}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Edit className="h-5 w-5" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 