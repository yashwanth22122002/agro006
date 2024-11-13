interface Crop {
  id: number;
  name: string;
  farmer_id: number;
  area: number; // in acres/hectares
  planting_date: string;
  expected_harvest: string;
  status: 'growing' | 'harvested' | 'failed';
  notes?: string;
  created_at: string;
}

interface CropGuide {
  id: number;
  crop_name: string;
  soil_type: string;
  water_requirements: string;
  season: string;
  fertilizer_recommendations: string;
  pest_control: string;
  harvesting_tips: string;
  created_by: number;
  created_at: string;
}

export type { Crop, CropGuide }; 