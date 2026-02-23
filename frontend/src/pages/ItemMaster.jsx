import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  Package, 
  Plus, 
  MagnifyingGlass,
  PencilSimple,
  Trash,
  X,
  Tag
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ItemMaster = () => {
  const { getAuthHeader } = useAuth();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    item_name: '',
    default_price: '',
    product_category: '',
    description: ''
  });

  const fetchItems = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/items`, { 
        headers: getAuthHeader(),
        params: { active: true }
      });
      setItems(response.data);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(response.data.map(item => item.product_category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Failed to fetch items:', error);
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    
    if (!formData.item_name || !formData.default_price || !formData.product_category) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await axios.post(`${API}/items`, formData, { headers: getAuthHeader() });
      toast.success('Item added successfully');
      setShowAddModal(false);
      setFormData({ item_name: '', default_price: '', product_category: '', description: '' });
      fetchItems();
    } catch (error) {
      console.error('Failed to add item:', error);
      toast.error(error.response?.data?.detail || 'Failed to add item');
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    
    if (!formData.item_name || !formData.default_price || !formData.product_category) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await axios.put(`${API}/items/${editingItem.id}`, formData, { headers: getAuthHeader() });
      toast.success('Item updated successfully');
      setShowEditModal(false);
      setEditingItem(null);
      setFormData({ item_name: '', default_price: '', product_category: '', description: '' });
      fetchItems();
    } catch (error) {
      console.error('Failed to update item:', error);
      toast.error(error.response?.data?.detail || 'Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId, itemName) => {
    if (!window.confirm(`Are you sure you want to delete "${itemName}"?`)) {
      return;
    }

    try {
      await axios.delete(`${API}/items/${itemId}`, { headers: getAuthHeader() });
      toast.success('Item deleted successfully');
      fetchItems();
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete item');
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      default_price: item.default_price,
      product_category: item.product_category,
      description: item.description || ''
    });
    setShowEditModal(true);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.product_category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.product_category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <AdminLayout title="Item Master">
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Item Master">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">Item Master</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage your product items and pricing</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary-500"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Badge className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0">
              {filteredItems.length} items
            </Badge>
            <Button onClick={() => setShowAddModal(true)} className="flex-1 md:flex-initial">
              <Plus className="w-4 h-4 mr-1" weight="bold" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Items Table */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {filteredItems.length === 0 ? (
              <div className="p-6 text-center">
                <Package className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No items found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Item Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Added Date
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-primary-500" weight="duotone" />
                            <span className="text-sm font-medium text-gray-900">{item.item_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs text-primary-600 border-primary-300">
                            <Tag className="w-3 h-3 mr-1" />
                            {item.product_category}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-emerald-600">
                            ₹{item.default_price.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-600 line-clamp-2">
                            {item.description || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-500">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <PencilSimple size={18} weight="bold" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id, item.item_name)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash size={18} weight="bold" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Item Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-0 shadow-xl">
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold">Add New Item</CardTitle>
                  <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <form onSubmit={handleAddItem} className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Item Name *</label>
                    <Input
                      value={formData.item_name}
                      onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                      placeholder="Enter item name"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Default Price (₹) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.default_price}
                      onChange={(e) => setFormData({...formData, default_price: e.target.value})}
                      placeholder="Enter price"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Product Category *</label>
                    <Input
                      value={formData.product_category}
                      onChange={(e) => setFormData({...formData, product_category: e.target.value})}
                      placeholder="Enter category"
                      list="categories"
                      required
                    />
                    <datalist id="categories">
                      {categories.map(cat => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Enter description (optional)"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      rows="3"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1">Add Item</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Item Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-0 shadow-xl">
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold">Edit Item</CardTitle>
                  <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <form onSubmit={handleUpdateItem} className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Item Name *</label>
                    <Input
                      value={formData.item_name}
                      onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                      placeholder="Enter item name"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Default Price (₹) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.default_price}
                      onChange={(e) => setFormData({...formData, default_price: e.target.value})}
                      placeholder="Enter price"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Product Category *</label>
                    <Input
                      value={formData.product_category}
                      onChange={(e) => setFormData({...formData, product_category: e.target.value})}
                      placeholder="Enter category"
                      list="categories"
                      required
                    />
                    <datalist id="categories">
                      {categories.map(cat => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Enter description (optional)"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      rows="3"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1">Update Item</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ItemMaster;
