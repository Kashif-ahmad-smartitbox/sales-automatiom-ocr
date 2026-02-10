import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { 
  Gear, 
  Clock, 
  MapPin, 
  Target,
  Tag,
  Buildings,
  FloppyDisk
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SettingsPage = () => {
  const { getAuthHeader } = useAuth();
  const [company, setCompany] = useState(null);
  const [config, setConfig] = useState({
    product_categories: [],
    dealer_types: ['Retailer', 'Distributor', 'Wholesaler'],
    working_hours: { start: '09:00', end: '18:00' },
    visit_radius: 500,
    visits_per_day_target: 10,
    sales_target: null
  });
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCompanyConfig = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/company/config`, { headers: getAuthHeader() });
      setCompany(res.data);
      if (res.data.config) {
        setConfig(res.data.config);
      }
    } catch (error) {
      toast.error('Failed to fetch company settings');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchCompanyConfig();
  }, [fetchCompanyConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/company/config`, config, { headers: getAuthHeader() });
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    if (newCategory.trim() && !config.product_categories.includes(newCategory.trim())) {
      setConfig({
        ...config,
        product_categories: [...config.product_categories, newCategory.trim()]
      });
      setNewCategory('');
    }
  };

  const removeCategory = (cat) => {
    setConfig({
      ...config,
      product_categories: config.product_categories.filter(c => c !== cat)
    });
  };

  if (loading) {
    return (
      <AdminLayout title="Settings">
        <div className="flex items-center justify-center py-20">
          <div className="spinner" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Settings">
      <div className="max-w-4xl space-y-4" data-testid="settings-page">
        {/* Page Header */}
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">Settings</h1>
          <p className="text-xs text-gray-500 mt-0.5">Configure your organization preferences</p>
        </div>

        {/* Company Info */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary-400 to-primary-500">
                <Buildings className="text-white" weight="fill" size={14} />
              </div>
              <CardTitle className="text-sm font-bold text-gray-800">Company Information</CardTitle>
            </div>
            <CardDescription className="text-xs">Your company details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] text-gray-500 uppercase tracking-wider">Company Name</Label>
                <p className="text-sm font-medium text-gray-800">{company?.company_name}</p>
              </div>
              <div>
                <Label className="text-[10px] text-gray-500 uppercase tracking-wider">Industry</Label>
                <p className="text-sm font-medium text-gray-800">{company?.industry_type}</p>
              </div>
              <div>
                <Label className="text-[10px] text-gray-500 uppercase tracking-wider">Head Office</Label>
                <p className="text-sm font-medium text-gray-800">{company?.head_office_location}</p>
              </div>
              <div>
                <Label className="text-[10px] text-gray-500 uppercase tracking-wider">GST Number</Label>
                <p className="text-sm font-medium text-gray-800">{company?.gst || 'Not provided'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Geo-fence Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-500">
                <MapPin className="text-white" weight="fill" size={14} />
              </div>
              <CardTitle className="text-sm font-bold text-gray-800">Geo-fence Settings</CardTitle>
            </div>
            <CardDescription className="text-xs">Configure location verification parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Visit Radius (meters)</Label>
              <Input
                type="number"
                value={config.visit_radius}
                onChange={(e) => setConfig({...config, visit_radius: parseInt(e.target.value) || 0})}
                className="max-w-xs"
                data-testid="visit-radius-input"
              />
              <p className="text-[10px] text-gray-500">Sales executives must be within this distance to check-in at a dealer</p>
            </div>
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500">
                <Clock className="text-white" weight="fill" size={14} />
              </div>
              <CardTitle className="text-sm font-bold text-gray-800">Working Hours</CardTitle>
            </div>
            <CardDescription className="text-xs">Define field team working hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={config.working_hours.start}
                  onChange={(e) => setConfig({...config, working_hours: {...config.working_hours, start: e.target.value}})}
                  className="w-32"
                  data-testid="working-hours-start"
                />
              </div>
              <span className="mt-6">to</span>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={config.working_hours.end}
                  onChange={(e) => setConfig({...config, working_hours: {...config.working_hours, end: e.target.value}})}
                  className="w-32"
                  data-testid="working-hours-end"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Targets */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-400 to-purple-500">
                <Target className="text-white" weight="fill" size={14} />
              </div>
              <CardTitle className="text-sm font-bold text-gray-800">Target Settings</CardTitle>
            </div>
            <CardDescription className="text-xs">Set daily visit and sales targets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Visits Per Day Target</Label>
                <Input
                  type="number"
                  value={config.visits_per_day_target}
                  onChange={(e) => setConfig({...config, visits_per_day_target: parseInt(e.target.value) || 0})}
                  data-testid="visits-target-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Daily Sales Target (₹)</Label>
                <Input
                  type="number"
                  value={config.sales_target || ''}
                  onChange={(e) => setConfig({...config, sales_target: parseInt(e.target.value) || null})}
                  placeholder="Optional"
                  data-testid="sales-target-input"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Categories */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-400 to-orange-500">
                <Tag className="text-white" weight="fill" size={14} />
              </div>
              <CardTitle className="text-sm font-bold text-gray-800">Product Categories</CardTitle>
            </div>
            <CardDescription className="text-xs">Manage product categories for dealers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Add a category..."
                onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                data-testid="new-category-input"
              />
              <Button onClick={addCategory} variant="outline" data-testid="add-category-btn">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {config.product_categories.map((cat) => (
                <Badge 
                  key={cat} 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-red-100 hover:text-red-700 transition-colors"
                  onClick={() => removeCategory(cat)}
                >
                  {cat} ×
                </Badge>
              ))}
              {config.product_categories.length === 0 && (
                <p className="text-xs text-gray-500">No categories added yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-600 hover:to-orange-600 text-white shadow-md"
            data-testid="save-settings-btn"
          >
            {saving ? <span className="spinner mr-2" /> : <FloppyDisk className="mr-1" size={14} />}
            Save Settings
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;
