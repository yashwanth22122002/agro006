import React, { useState, useEffect } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Crop, CropGuide } from '../types/Crop';

export default function MyCrops() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [guides, setGuides] = useState<CropGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddCropOpen, setIsAddCropOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchCrops();
    fetchCropGuides();
  }, []);

  const fetchCrops = async () => {
    try {
      const response = await fetch('/api/crops', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch crops');
      const data = await response.json();
      setCrops(data);
    } catch (err) {
      setError('Failed to load crops');
    }
  };

  const fetchCropGuides = async () => {
    try {
      const response = await fetch('/api/crops/guides');
      if (!response.ok) throw new Error('Failed to fetch crop guides');
      const data = await response.json();
      setGuides(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Crops</h1>
        <button
          onClick={() => setIsAddCropOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="h-5 w-5" />
          <span>Add Crop</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <AlertCircle className="h-5 w-5 inline mr-2" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {crops.map((crop) => (
          <div key={crop.id} className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold">{crop.name}</h3>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Area</span>
                <span>{crop.area} acres</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Planting Date</span>
                <span>{new Date(crop.planting_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expected Harvest</span>
                <span>{new Date(crop.expected_harvest).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 