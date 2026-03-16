import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import AdminLayout from "../components/layout/AdminLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Package,
  Plus,
  PencilSimple,
  Trash,
  X,
  Tag,
} from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";
import { useSearch } from "../context/SearchContext";
import { toast } from "sonner";
import SearchBar from "../components/SearchBar";
import { formatDateDDMmmYYYY, getTruncatedText } from "../utils/tableHelpers";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ItemMaster = () => {
  const { getAuthHeader } = useAuth();
  const { searchTerm } = useSearch();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    item_name: "",
    default_price: "",
    product_category: "",
    description: "",
  });

  const fetchItems = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/items`, {
        headers: getAuthHeader(),
        params: { active: true },
      });
      setItems(response.data);

      // Extract unique categories
      const uniqueCategories = [
        ...new Set(response.data.map((item) => item.product_category)),
      ];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Failed to fetch items:", error);
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAddItem = async (e) => {
    e.preventDefault();

    if (
      !formData.item_name ||
      !formData.default_price ||
      !formData.product_category
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await axios.post(`${API}/items`, formData, { headers: getAuthHeader() });
      toast.success("Item added successfully");
      setShowAddModal(false);
      setFormData({
        item_name: "",
        default_price: "",
        product_category: "",
        description: "",
      });
      fetchItems();
    } catch (error) {
      console.error("Failed to add item:", error);
      toast.error(error.response?.data?.detail || "Failed to add item");
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();

    if (
      !formData.item_name ||
      !formData.default_price ||
      !formData.product_category
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await axios.put(`${API}/items/${editingItem.id}`, formData, {
        headers: getAuthHeader(),
      });
      toast.success("Item updated successfully");
      setShowEditModal(false);
      setEditingItem(null);
      setFormData({
        item_name: "",
        default_price: "",
        product_category: "",
        description: "",
      });
      fetchItems();
    } catch (error) {
      console.error("Failed to update item:", error);
      toast.error(error.response?.data?.detail || "Failed to update item");
    }
  };

  const handleDeleteItem = async (itemId, itemName) => {
    if (!window.confirm(`Are you sure you want to delete "${itemName}"?`)) {
      return;
    }

    try {
      await axios.delete(`${API}/items/${itemId}`, {
        headers: getAuthHeader(),
      });
      toast.success("Item deleted successfully");
      fetchItems();
    } catch (error) {
      console.error("Failed to delete item:", error);
      toast.error(error.response?.data?.detail || "Failed to delete item");
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      default_price: item.default_price,
      product_category: item.product_category,
      description: item.description || "",
    });
    setShowEditModal(true);
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || item.product_category === filterCategory;
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
              <Package size={24} weight="duotone" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">
                Item Master
              </h1>
              <p className="text-xs text-gray-500">
                Manage your product items and pricing
              </p>
            </div>
          </div>
          <SearchBar placeholder="Search items..." />
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Left side: search result text */}
          <div className="w-full md:w-72">
            {searchTerm && (
              <p className="text-xs text-slate-500">
                Showing results for:{" "}
                <span className="font-semibold text-slate-700">
                  "{searchTerm}"
                </span>
              </p>
            )}
          </div>

          {/* Right side: dropdown + badge + button */}
          <div className="flex gap-2 w-full md:w-auto items-center">
            {/* Dropdown — full width on mobile, auto on desktop */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="flex-1 md:flex-initial px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <Badge className="bg-purple-100 text-purple-700 text-[10px] px-2 py-2 rounded-xl">
              {filteredItems.length} items
            </Badge>

            <Button
              onClick={() => setShowAddModal(true)}
              className="flex-1 md:flex-initial bg-green-500 text-white hover:bg-green-600 rounded-xl"
            >
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
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-y border-gray-200">
                      <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 border-r border-gray-200 w-8">
                        #
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 border-r border-gray-200">
                        Item Name
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 border-r border-gray-200">
                        Category
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 border-r border-gray-200">
                        Price
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 border-r border-gray-200">
                        Description
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 border-r border-gray-200">
                        Added Date
                      </th>
                      <th className="px-2 py-2 text-center text-xs font-semibold text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredItems.map((item, idx) => {
                      const itemName = getTruncatedText(item.item_name, 20);
                      const description = getTruncatedText(
                        item.description || "-",
                        25,
                      );

                      return (
                        <tr key={item.id} className="transition-colors">
                          <td className="px-2 py-2 border-r border-gray-100 text-xs font-medium text-gray-600 w-8">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2 border-r border-gray-100">
                            <div className="flex items-center gap-2">
                              <Package
                                className="w-4 h-4 text-primary-500"
                                weight="duotone"
                              />
                              <span
                                className="text-xs font-semibold text-gray-900"
                                title={itemName.full}
                              >
                                {itemName.display}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2 border-r border-gray-100">
                            <span className="text-xs font-semibold text-primary-600">
                              {item.product_category}
                            </span>
                          </td>
                          <td className="px-3 py-2 border-r border-gray-100">
                            <span className="text-xs font-bold text-emerald-600">
                              ₹{item.default_price.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-3 py-2 border-r border-gray-100">
                            <span
                              className="text-xs text-gray-600"
                              title={description.full}
                            >
                              {description.display}
                            </span>
                          </td>
                          <td className="px-3 py-2 border-r border-gray-100">
                            <span className="text-xs text-gray-500">
                              {formatDateDDMmmYYYY(item.created_at)}
                            </span>
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <PencilSimple size={14} weight="bold" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteItem(item.id, item.item_name)
                                }
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash size={14} weight="bold" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
                  <CardTitle className="text-base font-bold">
                    Add New Item
                  </CardTitle>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <form onSubmit={handleAddItem} className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Item Name *
                    </label>
                    <Input
                      value={formData.item_name}
                      onChange={(e) =>
                        setFormData({ ...formData, item_name: e.target.value })
                      }
                      placeholder="Enter item name"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Default Price (₹) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.default_price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          default_price: e.target.value,
                        })
                      }
                      placeholder="Enter price"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Product Category *
                    </label>
                    <Input
                      value={formData.product_category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          product_category: e.target.value,
                        })
                      }
                      placeholder="Enter category"
                      list="categories"
                      required
                    />
                    <datalist id="categories">
                      {categories.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Enter description (optional)"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      rows="3"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 bg-red-500 text-white hover:bg-red-600 hover:text-white rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 bg-green-500 text-white hover:bg-green-600 hover:text-white rounded-xl">
                      Add Item
                    </Button>
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
                  <CardTitle className="text-base font-bold">
                    Edit Item
                  </CardTitle>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <form onSubmit={handleUpdateItem} className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Item Name *
                    </label>
                    <Input
                      value={formData.item_name}
                      onChange={(e) =>
                        setFormData({ ...formData, item_name: e.target.value })
                      }
                      placeholder="Enter item name"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Default Price (₹) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.default_price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          default_price: e.target.value,
                        })
                      }
                      placeholder="Enter price"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Product Category *
                    </label>
                    <Input
                      value={formData.product_category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          product_category: e.target.value,
                        })
                      }
                      placeholder="Enter category"
                      list="categories"
                      required
                    />
                    <datalist id="categories">
                      {categories.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Enter description (optional)"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      rows="3"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowEditModal(false)}
                      className="flex-1 bg-red-500 text-white hover:bg-red-600 hover:text-white rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 bg-green-500 text-white hover:bg-green-600 hover:text-white rounded-xl">
                      Update Item
                    </Button>
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
