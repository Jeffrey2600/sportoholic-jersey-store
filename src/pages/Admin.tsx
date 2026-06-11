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
import { Plus, Edit, Trash2, Upload, X, Image, Eye } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { z } from "zod";
import { Switch } from "@/components/ui/switch";

const productSchema = z.object({
  title: z.string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z.string()
    .max(5000, "Description must be less than 5000 characters")
    .optional(),
  price: z.number()
    .positive("Price must be positive")
    .max(999999.99, "Price cannot exceed 999,999.99")
    .refine((val) => Number.isFinite(val), "Invalid price"),
  compare_at_price: z.number()
    .positive("Compare at price must be positive")
    .max(999999.99, "Compare at price cannot exceed 999,999.99")
    .optional()
    .nullable(),
  stock_quantity: z.number()
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative")
    .max(999999, "Stock cannot exceed 999,999"),
  club: z.string()
    .max(100, "Club name must be less than 100 characters")
    .optional(),
  color: z.string()
    .max(50, "Color must be less than 50 characters")
    .optional(),
  category_id: z.string().optional(),
  sku: z.string()
    .trim()
    .min(1, "SKU is required")
    .max(50, "SKU must be less than 50 characters")
    .regex(/^[A-Z0-9-]+$/, "SKU must contain only uppercase letters, numbers, and hyphens"),
  sizes: z.array(z.string()).optional(),
});

const imageFileSchema = z.object({
  size: z.number().max(10 * 1024 * 1024, "Image must be less than 10MB"),
  type: z.string().refine(
    (type) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(type),
    "Only JPG, PNG, and WEBP images are allowed"
  ),
});

const bannerSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  subtitle: z.string().max(200, "Subtitle must be less than 200 characters").optional(),
  cta_text: z.string().max(50, "CTA text must be less than 50 characters").optional(),
  cta_link: z.string().max(200, "CTA link must be less than 200 characters").optional(),
  bg_color: z.string().max(20, "Background color must be less than 20 characters").optional(),
  display_order: z.number().int().min(0).max(100).optional(),
  is_active: z.boolean().optional(),
});

const Admin = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [sizeInput, setSizeInput] = useState("");
  const [sizes, setSizes] = useState<string[]>([]);
  
  // Banner form states
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>("");
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerForm, setBannerForm] = useState({
    id: "",
    title: "",
    subtitle: "",
    cta_text: "",
    cta_link: "",
    bg_color: "#1a1a2e",
    image_url: "",
    display_order: "0",
    is_active: true,
  });
  
  // Product form
  const [productForm, setProductForm] = useState({
    id: "",
    title: "",
    description: "",
    price: "",
    compare_at_price: "",
    stock_quantity: "",
    category_id: "",
    club: "",
    color: "",
    sku: "",
    images: [] as string[],
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
    const [productsRes, ordersRes, categoriesRes, bannersRes] = await Promise.all([
      supabase.from("products").select("*, categories(name)").order("created_at", { ascending: false }),
      supabase.from("orders").select("*, products(title)").order("created_at", { ascending: false }),
      supabase.from("categories").select("*"),
      supabase.from("banners").select("*").order("display_order", { ascending: true }),
    ]);

    setProducts(productsRes.data || []);
    setOrders(ordersRes.data || []);
    setCategories(categoriesRes.data || []);
    setBanners(bannersRes.data || []);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      // Validate files if uploaded
      for (const file of uploadedFiles) {
        imageFileSchema.parse({
          size: file.size,
          type: file.type,
        });
      }

      // Validate product data
      const validatedData = productSchema.parse({
        title: productForm.title.trim(),
        description: productForm.description.trim() || undefined,
        price: parseFloat(productForm.price),
        compare_at_price: productForm.compare_at_price ? parseFloat(productForm.compare_at_price) : null,
        stock_quantity: parseInt(productForm.stock_quantity),
        club: productForm.club.trim() || undefined,
        color: productForm.color.trim() || undefined,
        category_id: productForm.category_id || undefined,
        sku: productForm.sku.trim(),
        sizes: sizes.length > 0 ? sizes : undefined,
      });

      let imageUrls = [...productForm.images];

      // Upload new images if files are selected
      if (uploadedFiles.length > 0) {
        const uploadPromises = uploadedFiles.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

          return publicUrl;
        });

        const newUrls = await Promise.all(uploadPromises);
        imageUrls = [...imageUrls, ...newUrls];
      }

      const productData = {
        title: validatedData.title,
        description: validatedData.description || null,
        price: validatedData.price,
        compare_at_price: validatedData.compare_at_price,
        stock_quantity: validatedData.stock_quantity,
        category_id: validatedData.category_id || null,
        club: validatedData.club || null,
        color: validatedData.color || null,
        sku: validatedData.sku,
        images: imageUrls,
        sizes: validatedData.sizes || [],
        image_url: imageUrls[0] || null,
      };

      if (productForm.id) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", productForm.id);

        if (error) throw error;

        toast.success("Product updated successfully!");
      } else {
        const { error } = await supabase.from("products").insert(productData);

        if (error) throw error;

        toast.success("Product added successfully!");
      }

      resetForm();
      fetchData();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to save product");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (product: any) => {
    setProductForm({
      id: product.id,
      title: product.title,
      description: product.description || "",
      price: product.price.toString(),
      compare_at_price: product.compare_at_price?.toString() || "",
      stock_quantity: product.stock_quantity.toString(),
      category_id: product.category_id || "",
      club: product.club || "",
      color: product.color || "",
      sku: product.sku || "",
      images: product.images || [],
    });
    setImagePreviews(product.images || []);
    setSizes(product.sizes || []);
    setUploadedFiles([]);
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
      compare_at_price: "",
      stock_quantity: "",
      category_id: "",
      club: "",
      color: "",
      sku: "",
      images: [],
    });
    setUploadedFiles([]);
    setImagePreviews([]);
    setSizes([]);
    setSizeInput("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploadedFiles([...uploadedFiles, ...files]);
      const previews = files.map(file => URL.createObjectURL(file));
      setImagePreviews([...imagePreviews, ...previews]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
      setUploadedFiles([...uploadedFiles, ...files]);
      const previews = files.map(file => URL.createObjectURL(file));
      setImagePreviews([...imagePreviews, ...previews]);
    } else {
      toast.error("Please upload image files");
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const removeImage = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    setImagePreviews(newPreviews);
    
    // Also remove from existing images if editing
    if (index < productForm.images.length) {
      const newImages = productForm.images.filter((_, i) => i !== index);
      setProductForm({ ...productForm, images: newImages });
    }
  };

  const addSize = () => {
    const trimmedSize = sizeInput.trim().toUpperCase();
    if (trimmedSize && !sizes.includes(trimmedSize)) {
      setSizes([...sizes, trimmedSize]);
      setSizeInput("");
    }
  };

  const removeSize = (sizeToRemove: string) => {
    setSizes(sizes.filter(s => s !== sizeToRemove));
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

  // Banner functions
  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerUploading(true);

    try {
      const validatedData = bannerSchema.parse({
        title: bannerForm.title.trim(),
        subtitle: bannerForm.subtitle.trim() || undefined,
        cta_text: bannerForm.cta_text.trim() || undefined,
        cta_link: bannerForm.cta_link.trim() || undefined,
        bg_color: bannerForm.bg_color || "#1a1a2e",
        display_order: parseInt(bannerForm.display_order) || 0,
        is_active: bannerForm.is_active,
      });

      let imageUrl = bannerForm.image_url;

      if (bannerFile) {
        const fileExt = bannerFile.name.split('.').pop();
        const fileName = `banner-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, bannerFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const bannerData = {
        title: validatedData.title,
        subtitle: validatedData.subtitle || null,
        cta_text: validatedData.cta_text || null,
        cta_link: validatedData.cta_link || null,
        bg_color: validatedData.bg_color,
        image_url: imageUrl || null,
        display_order: validatedData.display_order,
        is_active: validatedData.is_active,
      };

      if (bannerForm.id) {
        const { error } = await supabase
          .from("banners")
          .update(bannerData)
          .eq("id", bannerForm.id);

        if (error) throw error;
        toast.success("Banner updated successfully!");
      } else {
        const { error } = await supabase.from("banners").insert(bannerData);
        if (error) throw error;
        toast.success("Banner added successfully!");
      }

      resetBannerForm();
      fetchData();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to save banner");
      }
    } finally {
      setBannerUploading(false);
    }
  };

  const handleEditBanner = (banner: any) => {
    setBannerForm({
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle || "",
      cta_text: banner.cta_text || "",
      cta_link: banner.cta_link || "",
      bg_color: banner.bg_color || "#1a1a2e",
      image_url: banner.image_url || "",
      display_order: banner.display_order?.toString() || "0",
      is_active: banner.is_active ?? true,
    });
    setBannerPreview(banner.image_url || "");
    setBannerFile(null);
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;

    const { error } = await supabase.from("banners").delete().eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Banner deleted successfully!");
    fetchData();
  };

  const resetBannerForm = () => {
    setBannerForm({
      id: "",
      title: "",
      subtitle: "",
      cta_text: "",
      cta_link: "",
      bg_color: "#1a1a2e",
      image_url: "",
      display_order: "0",
      is_active: true,
    });
    setBannerFile(null);
    setBannerPreview("");
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
        <h1 className="text-2xl md:text-4xl font-bold mb-8">Admin Dashboard</h1>

        <Tabs defaultValue="products">
          <TabsList className="flex-wrap">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="banners">Banners</TabsTrigger>
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
                      <Label htmlFor="sku">SKU (Product Code) *</Label>
                      <Input
                        id="sku"
                        value={productForm.sku}
                        onChange={(e) => setProductForm({ ...productForm, sku: e.target.value.toUpperCase() })}
                        placeholder="PROD-001"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="price">Selling Price *</Label>
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
                      <Label htmlFor="compare_at_price">Compare at Price (Original)</Label>
                      <Input
                        id="compare_at_price"
                        type="number"
                        step="0.01"
                        value={productForm.compare_at_price}
                        onChange={(e) => setProductForm({ ...productForm, compare_at_price: e.target.value })}
                        placeholder="Show strikethrough price"
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
                      <Label htmlFor="size">Available Sizes</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          id="size"
                          value={sizeInput}
                          onChange={(e) => setSizeInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
                          placeholder="e.g., S, M, L, XL, 38, 40"
                        />
                        <Button type="button" onClick={addSize} variant="outline">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {sizes.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {sizes.map((size) => (
                            <span
                              key={size}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-md border border-primary/20"
                            >
                              {size}
                              <button
                                type="button"
                                onClick={() => removeSize(size)}
                                className="hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <Label>Product Images (Multiple)</Label>
                      <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                          dragActive ? "border-primary bg-primary/5" : "border-border"
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        {imagePreviews.length > 0 ? (
                          <div className="grid grid-cols-3 gap-4">
                            {imagePreviews.map((preview, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={preview}
                                  alt={`Preview ${index + 1}`}
                                  className="h-32 w-full object-cover rounded-lg"
                                />
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="destructive"
                                  className="absolute top-1 right-1"
                                  onClick={() => removeImage(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                            <div>
                              <label htmlFor="file-upload" className="cursor-pointer">
                                <span className="text-primary hover:underline">
                                  Click to upload
                                </span>
                                <span className="text-muted-foreground"> or drag and drop</span>
                              </label>
                              <input
                                id="file-upload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={handleFileChange}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              PNG, JPG, WEBP up to 10MB
                            </p>
                          </div>
                        )}
                      </div>
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
                    <Button 
                      type="submit" 
                      className="bg-gradient-to-r from-sport-red to-sport-red-dark"
                      disabled={uploading}
                    >
                      {uploading ? "Uploading..." : productForm.id ? "Update Product" : "Add Product"}
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
                        <TableHead>SKU</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Sizes</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                          <TableCell>{product.title}</TableCell>
                          <TableCell>
                            {product.compare_at_price && (
                              <span className="text-muted-foreground line-through mr-2">₹{product.compare_at_price}</span>
                            )}
                            ₹{product.price}
                          </TableCell>
                          <TableCell>{product.stock_quantity}</TableCell>
                          <TableCell>
                            {product.sizes && product.sizes.length > 0 ? (
                              <div className="flex gap-1 flex-wrap">
                                {product.sizes.map((size: string) => (
                                  <span key={size} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                                    {size}
                                  </span>
                                ))}
                              </div>
                            ) : "-"}
                          </TableCell>
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
                          <TableCell>
                            <div>{order.products?.title}</div>
                            {order.product_sku && (
                              <div className="text-xs text-muted-foreground font-mono">SKU: {order.product_sku}</div>
                            )}
                          </TableCell>
                          <TableCell>{order.quantity}</TableCell>
                          <TableCell>₹{order.total_price}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-600' :
                              order.status === 'completed' ? 'bg-green-500/20 text-green-600' :
                              'bg-red-500/20 text-red-600'
                            }`}>
                              {order.status}
                            </span>
                          </TableCell>
                          <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/admin/orders/${order.id}`)}
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" /> View
                              </Button>
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

          <TabsContent value="banners" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  {bannerForm.id ? "Edit Banner" : "Add New Banner"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBannerSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="banner-title">Title *</Label>
                      <Input
                        id="banner-title"
                        value={bannerForm.title}
                        onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                        placeholder="e.g., New Season Jerseys"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="banner-subtitle">Subtitle</Label>
                      <Input
                        id="banner-subtitle"
                        value={bannerForm.subtitle}
                        onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                        placeholder="e.g., 24/25 Season kits now available"
                      />
                    </div>

                    <div>
                      <Label htmlFor="banner-cta">Button Text</Label>
                      <Input
                        id="banner-cta"
                        value={bannerForm.cta_text}
                        onChange={(e) => setBannerForm({ ...bannerForm, cta_text: e.target.value })}
                        placeholder="e.g., Shop Now"
                      />
                    </div>

                    <div>
                      <Label htmlFor="banner-link">Button Link</Label>
                      <Input
                        id="banner-link"
                        value={bannerForm.cta_link}
                        onChange={(e) => setBannerForm({ ...bannerForm, cta_link: e.target.value })}
                        placeholder="e.g., /products"
                      />
                    </div>

                    <div>
                      <Label htmlFor="banner-color">Background Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="banner-color"
                          type="color"
                          value={bannerForm.bg_color}
                          onChange={(e) => setBannerForm({ ...bannerForm, bg_color: e.target.value })}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={bannerForm.bg_color}
                          onChange={(e) => setBannerForm({ ...bannerForm, bg_color: e.target.value })}
                          placeholder="#1a1a2e"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="banner-order">Display Order</Label>
                      <Input
                        id="banner-order"
                        type="number"
                        value={bannerForm.display_order}
                        onChange={(e) => setBannerForm({ ...bannerForm, display_order: e.target.value })}
                        placeholder="0"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        id="banner-active"
                        checked={bannerForm.is_active}
                        onCheckedChange={(checked) => setBannerForm({ ...bannerForm, is_active: checked })}
                      />
                      <Label htmlFor="banner-active">Active</Label>
                    </div>

                    <div className="md:col-span-2">
                      <Label>Banner Image</Label>
                      <div className="border-2 border-dashed rounded-lg p-6 text-center border-border">
                        {bannerPreview ? (
                          <div className="relative">
                            <img
                              src={bannerPreview}
                              alt="Banner preview"
                              className="max-h-48 mx-auto object-cover rounded-lg"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="absolute top-2 right-2"
                              onClick={() => {
                                setBannerFile(null);
                                setBannerPreview("");
                                setBannerForm({ ...bannerForm, image_url: "" });
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                            <div>
                              <label htmlFor="banner-file-upload" className="cursor-pointer">
                                <span className="text-primary hover:underline">Click to upload</span>
                                <span className="text-muted-foreground"> banner image</span>
                              </label>
                              <input
                                id="banner-file-upload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleBannerFileChange}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Recommended: 1920x600 pixels
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-sport-red to-sport-red-dark"
                      disabled={bannerUploading}
                    >
                      {bannerUploading ? "Uploading..." : bannerForm.id ? "Update Banner" : "Add Banner"}
                    </Button>
                    {bannerForm.id && (
                      <Button type="button" variant="outline" onClick={resetBannerForm}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Banners</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {banners.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No banners yet. Add your first banner above.</p>
                  ) : (
                    banners.map((banner) => (
                      <div
                        key={banner.id}
                        className="flex items-center gap-4 p-4 border rounded-lg"
                      >
                        {banner.image_url ? (
                          <img
                            src={banner.image_url}
                            alt={banner.title}
                            className="w-24 h-16 object-cover rounded"
                          />
                        ) : (
                          <div
                            className="w-24 h-16 rounded flex items-center justify-center"
                            style={{ backgroundColor: banner.bg_color || "#1a1a2e" }}
                          >
                            <Image className="h-6 w-6 text-white/50" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium">{banner.title}</h3>
                          <p className="text-sm text-muted-foreground">{banner.subtitle}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded ${banner.is_active ? 'bg-green-500/20 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                              {banner.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <span className="text-xs text-muted-foreground">Order: {banner.display_order}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditBanner(banner)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteBanner(banner.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
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