import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const Admin = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Product form
  const [productForm, setProductForm] = useState({
    id: "",
    title: "",
    description: "",
    price: "",
    stock_quantity: "",
    category_id: "",
    club: "",
    color: "",
    image_url: "",
  });

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!data) {
      toast.error("Access denied. Admin only.");
      navigate("/");
      return;
    }

    setIsAdmin(true);
    setLoading(false);
  };

  const fetchData = async () => {
    const [productsRes, ordersRes, categoriesRes] = await Promise.all([
      supabase.from("products").select("*, categories(name)").order("created_at", { ascending: false }),
      supabase.from("orders").select("*, products(title)").order("created_at", { ascending: false }),
      supabase.from("categories").select("*"),
    ]);

    setProducts(productsRes.data || []);
    setOrders(ordersRes.data || []);
    setCategories(categoriesRes.data || []);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      title: productForm.title,
      description: productForm.description,
      price: parseFloat(productForm.price),
      stock_quantity: parseInt(productForm.stock_quantity),
      category_id: productForm.category_id || null,
      club: productForm.club,
      color: productForm.color,
      image_url: productForm.image_url,
    };

    if (productForm.id) {
      const { error } = await supabase
        .from("products")
        .update(productData)
        .eq("id", productForm.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Product updated successfully!");
    } else {
      const { error } = await supabase.from("products").insert(productData);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Product added successfully!");
    }

    resetForm();
    fetchData();
  };

  const handleEdit = (product: any) => {
    setProductForm({
      id: product.id,
      title: product.title,
      description: product.description || "",
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      category_id: product.category_id || "",
      club: product.club || "",
      color: product.color || "",
      image_url: product.image_url || "",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Product deleted successfully!");
    fetchData();
  };

  const resetForm = () => {
    setProductForm({
      id: "",
      title: "",
      description: "",
      price: "",
      stock_quantity: "",
      category_id: "",
      club: "",
      color: "",
      image_url: "",
    });
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Order status updated!");
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

        <Tabs defaultValue="products">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{productForm.id ? "Edit Product" : "Add New Product"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProductSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={productForm.title}
                        onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="price">Price *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="stock">Stock Quantity *</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={productForm.stock_quantity}
                        onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={productForm.category_id} onValueChange={(value) => setProductForm({ ...productForm, category_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="club">Club/Team</Label>
                      <Input
                        id="club"
                        value={productForm.club}
                        onChange={(e) => setProductForm({ ...productForm, club: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="color">Color</Label>
                      <Input
                        id="color"
                        value={productForm.color}
                        onChange={(e) => setProductForm({ ...productForm, color: e.target.value })}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="image">Image URL</Label>
                      <Input
                        id="image"
                        value={productForm.image_url}
                        onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={productForm.description}
                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="bg-gradient-to-r from-sport-red to-sport-red-dark">
                      {productForm.id ? "Update Product" : "Add Product"}
                    </Button>
                    {productForm.id && (
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Club</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>{product.title}</TableCell>
                          <TableCell>₹{product.price}</TableCell>
                          <TableCell>{product.stock_quantity}</TableCell>
                          <TableCell>{product.club || "-"}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDelete(product.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>All Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>{order.user_name}</TableCell>
                          <TableCell>{order.user_email}</TableCell>
                          <TableCell>{order.products?.title}</TableCell>
                          <TableCell>{order.quantity}</TableCell>
                          <TableCell>₹{order.total_price}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                              order.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                              'bg-red-500/20 text-red-500'
                            }`}>
                              {order.status}
                            </span>
                          </TableCell>
                          <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Select
                              value={order.status}
                              onValueChange={(value) => updateOrderStatus(order.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
