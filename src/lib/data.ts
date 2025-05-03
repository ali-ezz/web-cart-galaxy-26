
export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // In a real app, this would be hashed
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discountedPrice?: number;
  category: string;
  imageUrl: string;
  rating: number;
  reviews: number;
  stock: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

// Mock users data
export const users: User[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    password: "password123",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    password: "password456",
  },
];

// Mock products data
export const products: Product[] = [
  {
    id: "1",
    name: "Wireless Noise Cancelling Headphones",
    description: "Premium wireless headphones with industry-leading noise cancellation, crystal-clear sound quality, and up to 30 hours of battery life.",
    price: 349.99,
    discountedPrice: 299.99,
    category: "Electronics",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
    rating: 4.8,
    reviews: 1254,
    stock: 42,
  },
  {
    id: "2",
    name: "Smart Fitness Watch",
    description: "Track your fitness goals, heart rate, sleep patterns, and more with this advanced fitness tracker.",
    price: 199.99,
    category: "Electronics",
    imageUrl: "https://images.unsplash.com/photo-1546868871-7041f2a55e12",
    rating: 4.6,
    reviews: 892,
    stock: 65,
  },
  {
    id: "3",
    name: "Organic Cotton T-Shirt",
    description: "Ultra-soft, sustainable cotton t-shirt that's perfect for everyday wear.",
    price: 29.99,
    discountedPrice: 19.99,
    category: "Clothing",
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
    rating: 4.5,
    reviews: 530,
    stock: 120,
  },
  {
    id: "4",
    name: "Professional Chef's Knife",
    description: "High-carbon stainless steel chef's knife with ergonomic handle for precision cutting.",
    price: 89.99,
    category: "Kitchen",
    imageUrl: "https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c",
    rating: 4.9,
    reviews: 342,
    stock: 25,
  },
  {
    id: "5",
    name: "Portable Bluetooth Speaker",
    description: "Water-resistant portable speaker with 360° sound and 12 hours of playtime.",
    price: 129.99,
    discountedPrice: 99.99,
    category: "Electronics",
    imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1",
    rating: 4.4,
    reviews: 782,
    stock: 38,
  },
  {
    id: "6",
    name: "Leather Messenger Bag",
    description: "Handcrafted genuine leather messenger bag with multiple compartments and adjustable strap.",
    price: 159.99,
    category: "Accessories",
    imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa",
    rating: 4.7,
    reviews: 214,
    stock: 18,
  },
  {
    id: "7",
    name: "Smart Home Security Camera",
    description: "HD security camera with motion detection, two-way audio, and night vision.",
    price: 79.99,
    category: "Electronics",
    imageUrl: "https://images.unsplash.com/photo-1558002038-176fd6d7e9b7",
    rating: 4.3,
    reviews: 456,
    stock: 50,
  },
  {
    id: "8",
    name: "Organic Herbal Tea Collection",
    description: "Set of 6 premium organic herbal teas in biodegradable packaging.",
    price: 34.99,
    discountedPrice: 29.99,
    category: "Food & Drinks",
    imageUrl: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9",
    rating: 4.6,
    reviews: 178,
    stock: 85,
  },
];

export const categories = [
  "Electronics",
  "Clothing",
  "Kitchen",
  "Accessories",
  "Food & Drinks",
  "Furniture",
  "Books",
  "Sports & Outdoors",
];

// Function to simulate user login
export const loginUser = (email: string, password: string): User | null => {
  const user = users.find((u) => u.email === email && u.password === password);
  return user || null;
};

// Function to register a new user
export const registerUser = (name: string, email: string, password: string): User => {
  const newUser: User = {
    id: (users.length + 1).toString(),
    name,
    email,
    password,
  };
  users.push(newUser);
  return newUser;
};

// Function to get products by category
export const getProductsByCategory = (category: string): Product[] => {
  return products.filter((product) => product.category === category);
};

// Function to search products
export const searchProducts = (query: string): Product[] => {
  const lowercaseQuery = query.toLowerCase();
  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(lowercaseQuery) ||
      product.description.toLowerCase().includes(lowercaseQuery) ||
      product.category.toLowerCase().includes(lowercaseQuery)
  );
};

// Function to get a product by ID
export const getProductById = (id: string): Product | undefined => {
  return products.find((product) => product.id === id);
};
