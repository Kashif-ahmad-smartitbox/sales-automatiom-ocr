import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../components/layout/AdminLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { 
  Gear, 
  Clock, 
  MapPin, 
  Target,
  Tag,
  Buildings,
  FloppyDisk,
  Info,
  ArrowLeft,
  ShieldCheck,
  Lock,
  Crosshair,
  Lightning,
  CheckCircle,
  WarningCircle
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SettingsPage = () => {
  const { getAuthHeader } = useAuth();
  const navigate = useNavigate();
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
      <div className="w-full space-y-5" data-testid="settings-page">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">Company Settings</h1>
            <p className="text-xs text-gray-500 mt-0.5">Configure your organization preferences</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-gradient-to-r from-primary-500 to-orange-500 text-white border-0 text-[10px] px-2.5 py-1 shadow-sm">
              <ShieldCheck className="w-3 h-3 mr-1" weight="fill" /> Active
            </Badge>
            <Badge variant="outline" className="border-gray-300 text-gray-600 text-[10px] px-2.5 py-1">
              <Lock className="w-3 h-3 mr-1" weight="fill" /> Secure
            </Badge>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="border border-primary-200 bg-gradient-to-r from-primary-50 to-orange-50 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-gradient-to-br from-primary-400 to-orange-400 flex-shrink-0">
                <Info className="w-4 h-4 text-white" weight="fill" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1">Important Information</p>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-gray-500 flex-shrink-0"></span>
                    <span><strong>Geo-fence radius</strong> controls how close executives must be to check in at dealers</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-gray-500 flex-shrink-0"></span>
                    <span><strong>Working hours</strong> define the active tracking window for your field team</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Left Column - Product Categories & Tips */}
          <div className="lg:col-span-2 space-y-5">

            {/* Product Categories */}
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-400 to-orange-500">
                      <Tag className="text-white" weight="fill" size={14} />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800">Product Categories</h3>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-4">Manage categories for your dealer products</p>

                <div className="flex gap-2 mb-4">
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Add a category..."
                    onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                    className="border-gray-200 focus:border-primary-400 focus:ring-primary-400"
                    data-testid="new-category-input"
                  />
                  <Button onClick={addCategory} className="bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-600 hover:to-orange-600 text-white text-xs px-4 shadow-sm" data-testid="add-category-btn">Add</Button>
                </div>

                <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                  {config.product_categories.map((cat) => (
                    <Badge 
                      key={cat} 
                      className="bg-white border border-gray-200 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 cursor-pointer transition-all text-xs px-2.5 py-1 shadow-sm"
                      onClick={() => removeCategory(cat)}
                    >
                      {cat} <span className="ml-1 text-gray-400 hover:text-red-500">&times;</span>
                    </Badge>
                  ))}
                  {config.product_categories.length === 0 && (
                    <div className="flex flex-col items-center justify-center w-full py-3 text-gray-400">
                      <Tag className="w-6 h-6 mb-1" />
                      <p className="text-xs">No categories added yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Configuration Tips */}
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 text-emerald-500" weight="fill" />
                  <h3 className="text-sm font-bold text-gray-800">Configuration Tips</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" weight="fill" />
                    <p className="text-xs text-gray-600">Set a realistic <strong>visit radius</strong> (200-500m recommended)</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" weight="fill" />
                    <p className="text-xs text-gray-600">Working hours should match your <strong>field team schedule</strong></p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" weight="fill" />
                    <p className="text-xs text-gray-600">Daily targets help track <strong>team performance</strong></p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <WarningCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" weight="fill" />
                    <p className="text-xs text-gray-600">Product categories are used in <strong>dealer classification</strong></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Company Info & Configuration Forms */}
          <div className="lg:col-span-3 space-y-5">

            {/* Company Information */}
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary-400 to-primary-500">
                      <Buildings className="text-white" weight="fill" size={14} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-800">Company Information</h3>
                      <p className="text-[10px] text-gray-500">Your registered company details</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-emerald-300 text-emerald-600 text-[10px] px-2 py-0.5">
                    <CheckCircle className="w-3 h-3 mr-0.5" weight="fill" /> Verified
                  </Badge>
                </div>

                <div className="space-y-4">
                  {/* Company Name */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Buildings className="w-3 h-3" /> Company Name
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Buildings className="w-4 h-4" />
                      </div>
                      <Input
                        value={company?.company_name || ''}
                        readOnly
                        className="pl-10 bg-gray-50 border-gray-200 text-gray-800 font-medium cursor-default"
                      />
                    </div>
                  </div>

                  {/* Industry */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Gear className="w-3 h-3" /> Industry Type
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Gear className="w-4 h-4" />
                      </div>
                      <Input
                        value={company?.industry_type || ''}
                        readOnly
                        className="pl-10 bg-gray-50 border-gray-200 text-gray-800 font-medium cursor-default"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400">Industry classification for your organization</p>
                  </div>

                  {/* Head Office */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" /> Head Office Location
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <Input
                        value={company?.head_office_location || ''}
                        readOnly
                        className="pl-10 bg-gray-50 border-gray-200 text-gray-800 font-medium cursor-default"
                      />
                    </div>
                  </div>

                  {/* GST */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3" /> GST Number
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <Input
                        value={company?.gst || 'Not provided'}
                        readOnly
                        className="pl-10 bg-gray-50 border-gray-200 text-gray-800 font-mono text-sm cursor-default"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400">15-character alphanumeric GST identification number</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Operational Settings */}
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-5">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-500">
                    <Gear className="text-white" weight="fill" size={14} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">Operational Settings</h3>
                    <p className="text-[10px] text-gray-500">Configure geo-fence, working hours & targets</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Visit Radius */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Crosshair className="w-3 h-3" /> Visit Radius (meters) *
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Crosshair className="w-4 h-4" />
                      </div>
                      <Input
                        type="number"
                        value={config.visit_radius}
                        onChange={(e) => setConfig({...config, visit_radius: parseInt(e.target.value) || 0})}
                        className="pl-10 border-gray-200 focus:border-primary-400 focus:ring-primary-400"
                        data-testid="visit-radius-input"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400">Executives must be within this distance to check-in at a dealer</p>
                  </div>

                  {/* Working Hours */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> Start Time
                      </Label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <Clock className="w-4 h-4" />
                        </div>
                        <Input
                          type="time"
                          value={config.working_hours.start}
                          onChange={(e) => setConfig({...config, working_hours: {...config.working_hours, start: e.target.value}})}
                          className="pl-10 border-gray-200 focus:border-primary-400 focus:ring-primary-400"
                          data-testid="working-hours-start"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> End Time
                      </Label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <Clock className="w-4 h-4" />
                        </div>
                        <Input
                          type="time"
                          value={config.working_hours.end}
                          onChange={(e) => setConfig({...config, working_hours: {...config.working_hours, end: e.target.value}})}
                          className="pl-10 border-gray-200 focus:border-primary-400 focus:ring-primary-400"
                          data-testid="working-hours-end"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Targets */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Target className="w-3 h-3" /> Visits Per Day Target
                      </Label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <Target className="w-4 h-4" />
                        </div>
                        <Input
                          type="number"
                          value={config.visits_per_day_target}
                          onChange={(e) => setConfig({...config, visits_per_day_target: parseInt(e.target.value) || 0})}
                          className="pl-10 border-gray-200 focus:border-primary-400 focus:ring-primary-400"
                          data-testid="visits-target-input"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Lightning className="w-3 h-3" /> Daily Sales Target (₹)
                      </Label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <Lightning className="w-4 h-4" />
                        </div>
                        <Input
                          type="number"
                          value={config.sales_target || ''}
                          onChange={(e) => setConfig({...config, sales_target: parseInt(e.target.value) || null})}
                          placeholder="Optional"
                          className="pl-10 border-gray-200 focus:border-primary-400 focus:ring-primary-400"
                          data-testid="sales-target-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 h-11"
                onClick={() => navigate('/admin')}
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back to Dashboard
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-600 hover:to-orange-600 text-white shadow-md h-11 font-semibold"
                data-testid="save-settings-btn"
              >
                {saving ? <span className="spinner mr-2" /> : <FloppyDisk className="mr-2" size={16} />}
                Save Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Tips Footer */}
        <Card className="border border-gray-200 bg-gradient-to-r from-gray-50 to-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold text-gray-800">Quick Tips</span>
              <Badge className="bg-primary-100 text-primary-700 border-0 text-[10px] px-1.5 py-0">Pro Tips</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <p className="text-xs text-gray-500">Keep your <strong className="text-gray-700">visit radius</strong> optimized for accurate check-ins</p>
              <p className="text-xs text-gray-500">Set <strong className="text-gray-700">realistic daily targets</strong> to motivate your field team</p>
              <p className="text-xs text-gray-500">Use <strong className="text-gray-700">product categories</strong> to organize dealer inventory</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;
