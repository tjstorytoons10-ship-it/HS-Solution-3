import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import {
  getDatabase,
  saveDatabase,
  hashPassword,
  User,
  Product,
  Category,
  Order,
  Coupon,
  DeliveryZone,
  PaymentMethodConfig,
  Review
} from './db';

export const apiRouter = Router();

// In-memory token storage
const sessions = new Map<string, { userId: string; role: 'admin' | 'customer'; expiresAt: number }>();

function generateToken(userId: string, role: 'admin' | 'customer'): string {
  const token = crypto.randomBytes(32).toString('hex');
  // 30 days session
  sessions.set(token, {
    userId,
    role,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
  });
  return token;
}

// Auth Middlewares
interface AuthenticatedRequest extends Request {
  user?: User;
}

function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return next();
  }

  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    return next();
  }

  const db = getDatabase();
  const user = db.users.find(u => u.id === session.userId);
  if (user && !user.isBlocked) {
    req.user = user;
  }
  next();
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  next();
}

const OWNER_ADMIN_EMAIL = 'storetech@gmail.com';

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (
    !req.user ||
    req.user.role !== 'admin' ||
    req.user.email.toLowerCase() !== OWNER_ADMIN_EMAIL
  ) {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
}

apiRouter.use(authenticateToken);

// ==========================================
// 1. AUTHENTICATION & USERS
// ==========================================

// Register customer
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password || !phone) {
    return res.status(400).json({ error: 'Please provide name, email, phone and password.' });
  }

  const db = getDatabase();
  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    name,
    email: email.toLowerCase(),
    phone,
    role: 'customer',
    passwordHash: hashPassword(password),
    savedAddresses: [],
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  saveDatabase(db);

  const token = generateToken(newUser.id, newUser.role);
  const { passwordHash, ...userClean } = newUser;
  res.json({ token, user: userClean });
});

// Login user (customer or owner admin with exact credentials)
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter email and password.' });
  }

  const db = getDatabase();
  const inputEmail = email.toLowerCase().trim();
  const user = db.users.find(u => u.email.toLowerCase() === inputEmail);
  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  if (user.isBlocked) {
    return res.status(403).json({ error: 'Your account has been deactivated. Please contact support.' });
  }

  const token = generateToken(user.id, user.role);
  const { passwordHash, ...userClean } = user;
  res.json({ token, user: userClean });
});

// Dedicated Admin Login (Strict Single Admin Owner Account)
apiRouter.post('/auth/admin-login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Admin credentials required.' });
  }

  const db = getDatabase();
  const inputEmail = email.toLowerCase().trim();
  const adminUser = db.users.find(
    u =>
      u.role === 'admin' &&
      u.email.toLowerCase() === OWNER_ADMIN_EMAIL &&
      inputEmail === OWNER_ADMIN_EMAIL
  );

  if (!adminUser || adminUser.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid administrator credentials.' });
  }

  const token = generateToken(adminUser.id, 'admin');
  const { passwordHash, ...adminClean } = adminUser;
  res.json({ token, user: adminClean });
});

// Get Current User Profile
apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { passwordHash, ...userClean } = req.user!;
  res.json({ user: userClean });
});

// Update Profile
apiRouter.put('/auth/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { name, phone } = req.body;
  const db = getDatabase();
  const user = db.users.find(u => u.id === req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  if (name) user.name = name;
  if (phone) user.phone = phone;

  saveDatabase(db);
  const { passwordHash, ...userClean } = user;
  res.json({ user: userClean });
});

// Change Password
apiRouter.post('/auth/change-password', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password required.' });
  }

  const db = getDatabase();
  const user = db.users.find(u => u.id === req.user!.id);
  if (!user || user.passwordHash !== hashPassword(currentPassword)) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }

  user.passwordHash = hashPassword(newPassword);
  saveDatabase(db);
  res.json({ message: 'Password updated successfully.' });
});

// Manage Saved Addresses
apiRouter.post('/auth/addresses', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { label, province, city, area, streetAddress, postalCode, isDefault } = req.body;
  const db = getDatabase();
  const user = db.users.find(u => u.id === req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  user.savedAddresses = user.savedAddresses || [];
  if (isDefault) {
    user.savedAddresses.forEach(a => { a.isDefault = false; });
  }

  const newAddress = {
    id: `addr-${Date.now()}`,
    label: label || 'Home',
    province,
    city,
    area,
    streetAddress,
    postalCode,
    isDefault: isDefault || user.savedAddresses.length === 0
  };

  user.savedAddresses.push(newAddress);
  saveDatabase(db);
  res.json({ savedAddresses: user.savedAddresses });
});

apiRouter.delete('/auth/addresses/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const user = db.users.find(u => u.id === req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  user.savedAddresses = (user.savedAddresses || []).filter(a => a.id !== req.params.id);
  saveDatabase(db);
  res.json({ savedAddresses: user.savedAddresses });
});

// ==========================================
// 2. CATEGORIES
// ==========================================

apiRouter.get('/categories', (_req: Request, res: Response) => {
  const db = getDatabase();
  const sorted = [...db.categories].sort((a, b) => a.order - b.order);
  res.json(sorted);
});

apiRouter.post('/categories', requireAdmin, (req: Request, res: Response) => {
  const { name, slug, description, image, order } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name is required.' });

  const db = getDatabase();
  const newCat: Category = {
    id: `cat-${Date.now()}`,
    name,
    slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: description || '',
    image: image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
    order: Number(order) || db.categories.length + 1
  };

  db.categories.push(newCat);
  saveDatabase(db);
  res.status(201).json(newCat);
});

apiRouter.put('/categories/:id', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  const cat = db.categories.find(c => c.id === req.params.id);
  if (!cat) return res.status(404).json({ error: 'Category not found.' });

  Object.assign(cat, req.body);
  saveDatabase(db);
  res.json(cat);
});

apiRouter.delete('/categories/:id', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  const index = db.categories.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Category not found.' });

  db.categories.splice(index, 1);
  saveDatabase(db);
  res.json({ message: 'Category removed successfully.' });
});

// ==========================================
// 3. PRODUCTS
// ==========================================

apiRouter.get('/products', (req: Request, res: Response) => {
  const db = getDatabase();
  let list = [...db.products];

  const { search, category, minPrice, maxPrice, brand, rating, inStock, sort, tag } = req.query;

  if (category && category !== 'all') {
    list = list.filter(p => p.categoryId === category || p.slug === category);
  }

  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.shortDescription.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  }

  if (brand) {
    const brands = Array.isArray(brand) ? brand : [brand];
    list = list.filter(p => brands.includes(p.brand));
  }

  if (minPrice) {
    list = list.filter(p => p.salePrice >= Number(minPrice));
  }

  if (maxPrice) {
    list = list.filter(p => p.salePrice <= Number(maxPrice));
  }

  if (rating) {
    list = list.filter(p => p.rating >= Number(rating));
  }

  if (inStock === 'true') {
    list = list.filter(p => p.stock > 0);
  }

  if (tag) {
    if (tag === 'featured') list = list.filter(p => p.featured);
    if (tag === 'bestseller') list = list.filter(p => p.bestSeller);
    if (tag === 'new') list = list.filter(p => p.newArrival);
    if (tag === 'sale') list = list.filter(p => p.onSale);
  }

  // Sorting
  if (sort === 'price_asc') {
    list.sort((a, b) => a.salePrice - b.salePrice);
  } else if (sort === 'price_desc') {
    list.sort((a, b) => b.salePrice - a.salePrice);
  } else if (sort === 'rating_desc') {
    list.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'bestseller') {
    list.sort((a, b) => (b.bestSeller ? 1 : 0) - (a.bestSeller ? 1 : 0) || b.reviewCount - a.reviewCount);
  } else {
    // Newest default
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json(list);
});

apiRouter.get('/products/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const prod = db.products.find(p => p.id === req.params.id || p.slug === req.params.id);
  if (!prod) return res.status(404).json({ error: 'Product not found.' });

  // Get reviews
  const reviews = db.reviews.filter(r => r.productId === prod.id && r.approved);
  res.json({ ...prod, reviewsList: reviews });
});

apiRouter.post('/products', requireAdmin, (req: Request, res: Response) => {
  const {
    name,
    sku,
    categoryId,
    brand,
    shortDescription,
    description,
    originalPrice,
    salePrice,
    stock,
    images,
    videoUrl,
    featured,
    bestSeller,
    newArrival,
    onSale,
    attributes,
    variants,
    specifications
  } = req.body;

  if (!name || !salePrice) {
    return res.status(400).json({ error: 'Product name and sale price are required.' });
  }

  const db = getDatabase();
  const origPrice = Number(originalPrice) || Number(salePrice);
  const sPrice = Number(salePrice);
  const discount = origPrice > sPrice ? Math.round(((origPrice - sPrice) / origPrice) * 100) : 0;

  const newProd: Product = {
    id: `prod-${Date.now()}`,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    sku: sku || `STA-${Math.floor(1000 + Math.random() * 9000)}`,
    categoryId: categoryId || 'cat-other',
    brand: brand || 'HS Solution',
    shortDescription: shortDescription || '',
    description: description || '',
    originalPrice: origPrice,
    salePrice: sPrice,
    discountPercentage: discount,
    stock: Number(stock) || 10,
    images: Array.isArray(images) && images.length ? images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'],
    videoUrl: videoUrl || undefined,
    rating: 5.0,
    reviewCount: 0,
    featured: Boolean(featured),
    bestSeller: Boolean(bestSeller),
    newArrival: Boolean(newArrival),
    onSale: Boolean(onSale || discount > 0),
    attributes: attributes || [],
    variants: variants || [],
    specifications: specifications || {},
    createdAt: new Date().toISOString()
  };

  db.products.unshift(newProd);
  saveDatabase(db);
  res.status(201).json(newProd);
});

apiRouter.put('/products/:id', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  const prod = db.products.find(p => p.id === req.params.id);
  if (!prod) return res.status(404).json({ error: 'Product not found.' });

  const origPrice = req.body.originalPrice !== undefined ? Number(req.body.originalPrice) : prod.originalPrice;
  const sPrice = req.body.salePrice !== undefined ? Number(req.body.salePrice) : prod.salePrice;
  const discount = origPrice > sPrice ? Math.round(((origPrice - sPrice) / origPrice) * 100) : 0;

  Object.assign(prod, req.body, {
    originalPrice: origPrice,
    salePrice: sPrice,
    discountPercentage: discount,
    stock: req.body.stock !== undefined ? Number(req.body.stock) : prod.stock
  });

  saveDatabase(db);
  res.json(prod);
});

apiRouter.delete('/products/:id', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  const index = db.products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Product not found.' });

  db.products.splice(index, 1);
  saveDatabase(db);
  res.json({ message: 'Product deleted successfully.' });
});

// Product Reviews
apiRouter.post('/products/:id/reviews', (req: Request, res: Response) => {
  const { userName, userCity, rating, comment, imageUrl } = req.body;
  if (!userName || !rating || !comment) {
    return res.status(400).json({ error: 'Name, rating and review text are required.' });
  }

  const db = getDatabase();
  const prod = db.products.find(p => p.id === req.params.id);
  if (!prod) return res.status(404).json({ error: 'Product not found.' });

  const newReview: Review = {
    id: `rev-${Date.now()}`,
    productId: prod.id,
    userName,
    userCity: userCity || 'Pakistan',
    rating: Number(rating),
    comment,
    date: new Date().toISOString().split('T')[0],
    verifiedPurchase: true,
    imageUrl: imageUrl || undefined,
    approved: true // Auto-approved or moderated
  };

  db.reviews.unshift(newReview);

  // Recalculate average rating
  const prodReviews = db.reviews.filter(r => r.productId === prod.id && r.approved);
  const avg = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
  prod.rating = Number(avg.toFixed(1));
  prod.reviewCount = prodReviews.length;

  saveDatabase(db);
  res.status(201).json(newReview);
});

// ==========================================
// 4. DELIVERY ZONES & RATES
// ==========================================

apiRouter.get('/delivery-rates', (_req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.deliveryZones);
});

apiRouter.post('/delivery-rates', requireAdmin, (req: Request, res: Response) => {
  const { province, city, standardFee, freeDeliveryThreshold, estimatedDays, expressAvailable, expressFee } = req.body;
  if (!city || !standardFee) return res.status(400).json({ error: 'City and standard fee required.' });

  const db = getDatabase();
  const newZone: DeliveryZone = {
    id: `del-${Date.now()}`,
    province: province || 'Punjab',
    city,
    standardFee: Number(standardFee),
    freeDeliveryThreshold: Number(freeDeliveryThreshold) || 2999,
    estimatedDays: estimatedDays || '2-4 Days',
    expressAvailable: Boolean(expressAvailable),
    expressFee: expressFee ? Number(expressFee) : undefined
  };

  db.deliveryZones.push(newZone);
  saveDatabase(db);
  res.status(201).json(newZone);
});

apiRouter.put('/delivery-rates/:id', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  const zone = db.deliveryZones.find(z => z.id === req.params.id);
  if (!zone) return res.status(404).json({ error: 'Delivery rate rule not found.' });

  Object.assign(zone, req.body);
  saveDatabase(db);
  res.json(zone);
});

apiRouter.delete('/delivery-rates/:id', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  const index = db.deliveryZones.findIndex(z => z.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Rule not found.' });

  db.deliveryZones.splice(index, 1);
  saveDatabase(db);
  res.json({ message: 'Delivery rule removed.' });
});

// ==========================================
// 5. PAYMENT METHODS
// ==========================================

apiRouter.get('/payment-methods', (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  // Admin sees all, customers see only enabled
  if (req.user && req.user.role === 'admin') {
    return res.json(db.paymentMethods);
  }
  const enabled = db.paymentMethods.filter(p => p.enabled);
  res.json(enabled);
});

apiRouter.post('/payment-methods', requireAdmin, (req: Request, res: Response) => {
  const { name, enabled, accountTitle, accountNumber, bankName, iban, instructions, requireProofScreenshot } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Payment method name is required.' });
  }

  const db = getDatabase();
  const slugBase = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const newMethod: PaymentMethodConfig = {
    id: `pm_${slugBase || 'custom'}_${Date.now().toString().slice(-4)}`,
    name: String(name).trim(),
    enabled: enabled !== undefined ? Boolean(enabled) : true,
    accountTitle: accountTitle ? String(accountTitle).trim() : '',
    accountNumber: accountNumber ? String(accountNumber).trim() : '',
    bankName: bankName ? String(bankName).trim() : '',
    iban: iban ? String(iban).trim() : '',
    instructions: instructions ? String(instructions).trim() : 'Send payment to the account details above and enter your Transaction ID.',
    requireProofScreenshot: requireProofScreenshot !== undefined ? Boolean(requireProofScreenshot) : true
  };

  db.paymentMethods.push(newMethod);
  saveDatabase(db);
  res.status(201).json(newMethod);
});

apiRouter.put('/payment-methods/:id', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  const method = db.paymentMethods.find(m => m.id === req.params.id);
  if (!method) return res.status(404).json({ error: 'Payment method not found.' });

  Object.assign(method, req.body);
  saveDatabase(db);
  res.json(method);
});

apiRouter.delete('/payment-methods/:id', requireAdmin, (req: Request, res: Response) => {
  const coreIds = ['cod', 'easypaisa', 'jazzcash', 'bank_transfer', 'card'];
  if (coreIds.includes(req.params.id)) {
    return res.status(400).json({ error: 'Built-in payment channels cannot be deleted; you can disable them instead.' });
  }

  const db = getDatabase();
  const idx = db.paymentMethods.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Payment method not found.' });

  db.paymentMethods.splice(idx, 1);
  saveDatabase(db);
  res.json({ message: 'Payment method removed.' });
});

// ==========================================
// 6. COUPONS
// ==========================================

apiRouter.get('/coupons', requireAdmin, (_req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.coupons);
});

apiRouter.post('/coupons/validate', (req: Request, res: Response) => {
  const { code, orderAmount, categoryId } = req.body;
  if (!code) return res.status(400).json({ error: 'Please enter a coupon code.' });

  const db = getDatabase();
  const coupon = db.coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase() && c.isActive);

  if (!coupon) {
    return res.status(404).json({ error: 'Invalid or inactive coupon code.' });
  }

  if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
    return res.status(400).json({ error: 'This coupon has expired.' });
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return res.status(400).json({ error: 'Coupon usage limit has been reached.' });
  }

  const amount = Number(orderAmount) || 0;
  if (amount < coupon.minOrderAmount) {
    return res.status(400).json({
      error: `Minimum order amount of Rs. ${coupon.minOrderAmount.toLocaleString()} is required for this coupon.`
    });
  }

  if (coupon.categoryId && categoryId && coupon.categoryId !== categoryId) {
    return res.status(400).json({ error: 'This coupon is not valid for items in your cart.' });
  }

  let discount = 0;
  if (coupon.type === 'percentage') {
    discount = Math.round((amount * coupon.discountValue) / 100);
  } else {
    discount = Math.min(coupon.discountValue, amount);
  }

  res.json({
    valid: true,
    code: coupon.code,
    type: coupon.type,
    discountValue: coupon.discountValue,
    discountAmount: discount
  });
});

apiRouter.post('/coupons', requireAdmin, (req: Request, res: Response) => {
  const { code, type, discountValue, minOrderAmount, expiryDate, usageLimit, categoryId, isActive } = req.body;
  if (!code || !discountValue) return res.status(400).json({ error: 'Code and discount value required.' });

  const db = getDatabase();
  const newCoupon: Coupon = {
    id: `coup-${Date.now()}`,
    code: code.trim().toUpperCase(),
    type: type || 'percentage',
    discountValue: Number(discountValue),
    minOrderAmount: Number(minOrderAmount) || 0,
    expiryDate: expiryDate || '2027-12-31',
    usageLimit: Number(usageLimit) || 100,
    usedCount: 0,
    categoryId: categoryId || undefined,
    isActive: isActive !== undefined ? Boolean(isActive) : true
  };

  db.coupons.push(newCoupon);
  saveDatabase(db);
  res.status(201).json(newCoupon);
});

apiRouter.put('/coupons/:id', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  const c = db.coupons.find(coupon => coupon.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Coupon not found.' });

  Object.assign(c, req.body);
  if (req.body.code) c.code = req.body.code.trim().toUpperCase();
  saveDatabase(db);
  res.json(c);
});

apiRouter.delete('/coupons/:id', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  const index = db.coupons.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Coupon not found.' });

  db.coupons.splice(index, 1);
  saveDatabase(db);
  res.json({ message: 'Coupon deleted.' });
});

// ==========================================
// 7. ORDERS & CHECKOUT
// ==========================================

apiRouter.post('/orders', (req: AuthenticatedRequest, res: Response) => {
  const {
    customerName,
    customerPhone,
    customerEmail,
    shippingAddress,
    items,
    couponCode,
    paymentMethod,
    paymentProof
  } = req.body;

  if (!customerName || !customerPhone || !shippingAddress || !items || !items.length) {
    return res.status(400).json({ error: 'Customer details, shipping address and cart items are required.' });
  }

  const db = getDatabase();

  // Validate items & calculate subtotal
  let subtotal = 0;
  const processedItems: any[] = [];

  for (const item of items) {
    const prod = db.products.find(p => p.id === item.productId);
    if (!prod) continue;

    const qty = Math.max(1, Number(item.quantity) || 1);
    const unitPrice = prod.salePrice;
    subtotal += unitPrice * qty;

    // Deduct stock safely
    if (prod.stock >= qty) {
      prod.stock -= qty;
    } else {
      prod.stock = 0;
    }

    processedItems.push({
      productId: prod.id,
      name: prod.name,
      image: prod.images[0] || '',
      price: unitPrice,
      quantity: qty,
      sku: prod.sku,
      selectedAttributes: item.selectedAttributes || {}
    });
  }

  if (processedItems.length === 0) {
    return res.status(400).json({ error: 'No valid products in order.' });
  }

  // Calculate discount if coupon provided
  let discount = 0;
  if (couponCode) {
    const coupon = db.coupons.find(c => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.isActive);
    if (coupon && subtotal >= coupon.minOrderAmount) {
      if (coupon.type === 'percentage') {
        discount = Math.round((subtotal * coupon.discountValue) / 100);
      } else {
        discount = Math.min(coupon.discountValue, subtotal);
      }
      coupon.usedCount += 1;
    }
  }

  // Determine delivery fee based on city/province rules
  let deliveryFee = 200; // default base
  const cityRule = db.deliveryZones.find(z => z.city.toLowerCase() === (shippingAddress.city || '').toLowerCase());
  if (cityRule) {
    if (subtotal >= cityRule.freeDeliveryThreshold) {
      deliveryFee = 0;
    } else {
      deliveryFee = cityRule.standardFee;
    }
  } else {
    // Default threshold
    if (subtotal >= 2999) {
      deliveryFee = 0;
    }
  }

  const total = subtotal - discount + deliveryFee;

  // Generate unique sequential Order ID
  const orderId = `ORD-${db.orderCounter}`;
  db.orderCounter += 1;

  const paymentStatus = paymentMethod === 'card' ? 'verified' : 'pending';
  const orderStatus = paymentMethod === 'card' ? 'Confirmed' : 'Pending';

  const newOrder: Order = {
    id: orderId,
    userId: req.user?.id,
    customerName,
    customerPhone,
    customerEmail: customerEmail || '',
    shippingAddress,
    items: processedItems,
    subtotal,
    discount,
    deliveryFee,
    total,
    couponCode: couponCode || undefined,
    paymentMethod,
    paymentStatus,
    paymentProof: paymentProof || undefined,
    orderStatus,
    tracking: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.orders.unshift(newOrder);
  saveDatabase(db);

  res.status(201).json(newOrder);
});

// Public Track Order endpoint
apiRouter.get('/orders/track/:orderId', (req: Request, res: Response) => {
  const db = getDatabase();
  const order = db.orders.find(o => o.id.toUpperCase() === req.params.orderId.trim().toUpperCase());
  if (!order) {
    return res.status(404).json({ error: 'Order not found with this tracking ID.' });
  }

  // Sanitize customer email for public tracking view
  const safeOrder = {
    id: order.id,
    customerName: order.customerName,
    shippingAddress: {
      city: order.shippingAddress.city,
      province: order.shippingAddress.province
    },
    items: order.items.map(i => ({ name: i.name, image: i.image, quantity: i.quantity })),
    total: order.total,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    tracking: order.tracking,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };

  res.json(safeOrder);
});

// View Full Order Details (Invoice / Details)
apiRouter.get('/orders/:orderId', (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const order = db.orders.find(o => o.id.toUpperCase() === req.params.orderId.trim().toUpperCase());
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  // If user is logged in and not admin, make sure it's their order
  if (req.user && req.user.role !== 'admin' && order.userId && order.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  res.json(order);
});

// Customer My Orders
apiRouter.get('/orders/my/list', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const userOrders = db.orders.filter(o => o.userId === req.user!.id || o.customerEmail.toLowerCase() === req.user!.email.toLowerCase());
  res.json(userOrders);
});

// Admin Orders List & Search
apiRouter.get('/admin/orders', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  let list = [...db.orders];

  const { status, search } = req.query;

  if (status && status !== 'all') {
    list = list.filter(o => o.orderStatus === status);
  }

  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(o =>
      o.id.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.toLowerCase().includes(q) ||
      (o.customerEmail && o.customerEmail.toLowerCase().includes(q))
    );
  }

  res.json(list);
});

// Admin Update Order Status
apiRouter.put('/admin/orders/:orderId/status', requireAdmin, (req: Request, res: Response) => {
  const { status } = req.body;
  const allowed = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid order status value.' });
  }

  const db = getDatabase();
  const order = db.orders.find(o => o.id === req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  order.orderStatus = status;
  order.updatedAt = new Date().toISOString();
  saveDatabase(db);

  res.json(order);
});

// Admin Verify Payment
apiRouter.put('/admin/orders/:orderId/payment', requireAdmin, (req: Request, res: Response) => {
  const { paymentStatus } = req.body;
  if (!['pending', 'verified', 'failed'].includes(paymentStatus)) {
    return res.status(400).json({ error: 'Invalid payment status.' });
  }

  const db = getDatabase();
  const order = db.orders.find(o => o.id === req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  order.paymentStatus = paymentStatus;
  if (paymentStatus === 'verified') {
    order.paymentProof = {
      ...(order.paymentProof || {}),
      verifiedAt: new Date().toISOString()
    };
    if (order.orderStatus === 'Pending') {
      order.orderStatus = 'Confirmed';
    }
  }

  order.updatedAt = new Date().toISOString();
  saveDatabase(db);
  res.json(order);
});

// Admin Update Tracking Information
apiRouter.put('/admin/orders/:orderId/tracking', requireAdmin, (req: Request, res: Response) => {
  const { courierName, trackingNumber, notes } = req.body;
  const db = getDatabase();
  const order = db.orders.find(o => o.id === req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  order.tracking = {
    courierName: courierName || 'TCS Pakistan',
    trackingNumber: trackingNumber || '',
    dispatchedDate: new Date().toISOString().split('T')[0],
    notes: notes || ''
  };

  if (order.orderStatus === 'Confirmed' || order.orderStatus === 'Processing') {
    order.orderStatus = 'Shipped';
  }

  order.updatedAt = new Date().toISOString();
  saveDatabase(db);
  res.json(order);
});

// ==========================================
// 8. ADMIN STATS & ANALYTICS
// ==========================================

apiRouter.get('/admin/stats', requireAdmin, (_req: Request, res: Response) => {
  const db = getDatabase();

  const totalOrders = db.orders.length;
  const totalSales = db.orders
    .filter(o => o.orderStatus !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = db.orders
    .filter(o => o.orderStatus !== 'Cancelled' && o.createdAt.startsWith(todayStr))
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrders = db.orders.filter(o => o.orderStatus === 'Pending').length;
  const deliveredOrders = db.orders.filter(o => o.orderStatus === 'Delivered').length;
  const cancelledOrders = db.orders.filter(o => o.orderStatus === 'Cancelled').length;

  const totalCustomers = db.users.filter(u => u.role === 'customer').length;
  const totalProducts = db.products.length;
  const lowStockProducts = db.products.filter(p => p.stock <= 5);

  // Sales per day for recent 7 days
  const dailyBreakdown: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayKey = d.toISOString().split('T')[0];
    dailyBreakdown[dayKey] = 0;
  }

  db.orders.forEach(o => {
    if (o.orderStatus !== 'Cancelled') {
      const day = o.createdAt.split('T')[0];
      if (dailyBreakdown[day] !== undefined) {
        dailyBreakdown[day] += o.total;
      }
    }
  });

  res.json({
    totalSales,
    todaySales,
    totalOrders,
    pendingOrders,
    deliveredOrders,
    cancelledOrders,
    totalCustomers,
    totalProducts,
    lowStockCount: lowStockProducts.length,
    lowStockItems: lowStockProducts.map(p => ({ id: p.id, name: p.name, stock: p.stock, sku: p.sku })),
    dailySales: Object.entries(dailyBreakdown).map(([date, amount]) => ({ date, amount }))
  });
});

// Admin Customers Management
apiRouter.get('/admin/customers', requireAdmin, (_req: Request, res: Response) => {
  const db = getDatabase();
  const customers = db.users
    .filter(u => u.role === 'customer')
    .map(u => {
      const customerOrders = db.orders.filter(o => o.userId === u.id || o.customerEmail.toLowerCase() === u.email.toLowerCase());
      const totalSpent = customerOrders
        .filter(o => o.orderStatus !== 'Cancelled')
        .reduce((sum, o) => sum + o.total, 0);

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        totalOrders: customerOrders.length,
        totalSpent,
        isBlocked: Boolean(u.isBlocked),
        createdAt: u.createdAt,
        addresses: u.savedAddresses || []
      };
    });

  res.json(customers);
});

apiRouter.put('/admin/customers/:id/toggle-block', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'Customer not found.' });

  user.isBlocked = !user.isBlocked;
  saveDatabase(db);
  res.json({ id: user.id, isBlocked: user.isBlocked });
});

// ==========================================
// 9. STORE SETTINGS
// ==========================================

apiRouter.get('/settings', (_req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.settings);
});

apiRouter.put('/admin/settings', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  Object.assign(db.settings, req.body);
  saveDatabase(db);
  res.json(db.settings);
});
