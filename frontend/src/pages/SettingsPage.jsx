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
      <div className="max-w-4xl space-y-6" data-testid="settings-page">
        {/* Company Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Buildings className="text-primary-600" weight="duotone" size={24} />
              <CardTitle>Company Information</CardTitle>
            </div>
            <CardDescription>Your company details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-500">Company Name</Label>
                <p className="font-medium">{company?.company_name}</p>
              </div>
              <div>
                <Label className="text-slate-500">Industry</Label>
                <p className="font-medium">{company?.industry_type}</p>
              </div>
              <div>
                <Label className="text-slate-500">Head Office</Label>
                <p className="font-medium">{company?.head_office_location}</p>
              </div>
              <div>
                <Label className="text-slate-500">GST Number</Label>
                <p className="font-medium">{company?.gst || 'Not provided'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Geo-fence Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="text-primary-600" weight="duotone" size={24} />
              <CardTitle>Geo-fence Settings</CardTitle>
            </div>
            <CardDescription>Configure location verification parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Visit Radius (meters)</Label>
              <Input
                type="number"
                value={config.visit_radius}
                onChange={(e) => setConfig({...config, visit_radius: parseInt(e.target.value) || 0})}
                className="max-w-xs"
                data-testid="visit-radius-input"
              />
              <p className="text-xs text-slate-500">Sales executives must be within this distance to check-in at a dealer</p>
            </div>
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="text-primary-600" weight="duotone" size={24} />
              <CardTitle>Working Hours</CardTitle>
            </div>
            <CardDescription>Define field team working hours</CardDescription>
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
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="text-primary-600" weight="duotone" size={24} />
              <CardTitle>Target Settings</CardTitle>
            </div>
            <CardDescription>Set daily visit and sales targets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Tag className="text-primary-600" weight="duotone" size={24} />
              <CardTitle>Product Categories</CardTitle>
            </div>
            <CardDescription>Manage product categories for dealers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                <p className="text-sm text-slate-500">No categories added yet</p>
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
            {saving ? <span className="spinner mr-2" /> : <FloppyDisk className="mr-2" size={18} />}
            Save Settings
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;
