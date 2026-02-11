import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { MapPin, Eye, EyeSlash } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    company_name: '',
    industry_type: '',
    gst: '',
    head_office_location: '',
    admin_name: '',
    admin_email: '',
    admin_mobile: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const industries = [
    'FMCG',
    'Pharmaceuticals',
    'Building Materials',
    'Electronics',
    'Automotive',
    'Agriculture',
    'Consumer Durables',
    'Other'
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(formData);
      toast.success('Company registered successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-orange-50/30 px-4 py-12">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fed50a' fill-opacity='0.6'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      <Card className="w-full max-w-lg relative z-10 bg-white border border-gray-200 shadow-xl" data-testid="register-card">
        <CardHeader className="space-y-1 text-center pb-2">
          <Link to="/" className="inline-flex items-center justify-center gap-2 mb-4">
            <div className="bg-gradient-to-r from-primary-500 to-orange-500 w-10 h-10 rounded-xl flex items-center justify-center shadow-md">
              <MapPin weight="fill" className="w-6 h-6 text-white" />
            </div>
          </Link>
          <CardTitle className="text-2xl font-bold text-gray-800">Register Your Company</CardTitle>
          <CardDescription>Start your 14-day free trial with <span className="bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent font-semibold">Smart ITBox</span></CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  placeholder="Acme Corp"
                  value={formData.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  required
                  data-testid="register-company-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry_type">Industry *</Label>
                <Select onValueChange={(val) => handleChange('industry_type', val)} required>
                  <SelectTrigger data-testid="register-industry">
                    <SelectValue placeholder="Select Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((ind) => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gst">GST Number (Optional)</Label>
                <Input
                  id="gst"
                  placeholder="22AAAAA0000A1Z5"
                  value={formData.gst}
                  onChange={(e) => handleChange('gst', e.target.value)}
                  data-testid="register-gst"
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="head_office_location">Head Office Location *</Label>
                <Input
                  id="head_office_location"
                  placeholder="Mumbai, Maharashtra"
                  value={formData.head_office_location}
                  onChange={(e) => handleChange('head_office_location', e.target.value)}
                  required
                  data-testid="register-location"
                />
              </div>

              <div className="sm:col-span-2 border-t pt-4 mt-2">
                <p className="text-sm font-medium text-slate-700 mb-3">Admin Account</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_name">Your Name *</Label>
                <Input
                  id="admin_name"
                  placeholder="John Doe"
                  value={formData.admin_name}
                  onChange={(e) => handleChange('admin_name', e.target.value)}
                  required
                  data-testid="register-admin-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_mobile">Mobile Number *</Label>
                <Input
                  id="admin_mobile"
                  placeholder="+91 98765 43210"
                  value={formData.admin_mobile}
                  onChange={(e) => handleChange('admin_mobile', e.target.value)}
                  required
                  data-testid="register-admin-mobile"
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="admin_email">Email Address *</Label>
                <Input
                  id="admin_email"
                  type="email"
                  placeholder="you@company.com"
                  value={formData.admin_email}
                  onChange={(e) => handleChange('admin_email', e.target.value)}
                  required
                  data-testid="register-admin-email"
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimum 8 characters"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    required
                    minLength={6}
                    data-testid="register-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-600 hover:to-orange-600 text-white shadow-md mt-4"
              disabled={loading}
              data-testid="register-submit-btn"
            >
              {loading ? <span className="spinner" /> : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-500">Already have an account? </span>
            <Link to="/login" className="bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
