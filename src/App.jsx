import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Trash2,
  X,
  ChevronRight,
  TrendingUp,
  DollarSign,
  LayoutGrid,
  Link as LinkIcon,
  Target,
  ShoppingCart,
  Zap,
  FileText,
  LogOut,
} from "lucide-react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  onSnapshot,
  deleteDoc,
  query,
} from "firebase/firestore";

// --- Firebase Config & Initialization ---
const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "dropship-tracker-app";

// --- Constants & Config ---
const LOCAL_STORAGE_KEY = "dropship_tracker_v1";

const INITIAL_COMPETITOR = {
  brand: "",
  adLink: "",
  storeLink: "",
  adsCount: "",
  traffic: "",
};

const NEW_PRODUCT_TEMPLATE = {
  id: "",
  name: "",
  status: "Pending",
  cogs: "",
  price: "",
  valueProp: "",
  supplierLink: "",
  targetMarket: "",
  hasContent: false,
  competitors: [
    { ...INITIAL_COMPETITOR },
    { ...INITIAL_COMPETITOR },
    { ...INITIAL_COMPETITOR },
  ],
  otherLinks: [],
  personalNotes: "",
  internalNotes: "",
};

// --- Helper Functions ---
const generateId = () => Math.random().toString(36).substr(2, 9);

const formatCurrency = (val) => {
  if (!val) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(val);
};

const calculateRoas = (price, cogs) => {
  const p = parseFloat(price);
  const c = parseFloat(cogs);
  if (isNaN(p) || isNaN(c)) return null;

  const margin = p - c;
  if (margin <= 0) return 0;

  return (p / margin).toFixed(2);
};

// --- Components ---
const StatusBadge = ({ status }) => {
  const styles = {
    Pending: "bg-slate-100 text-slate-600 border-slate-200",
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Rejected: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium border ${
        styles[status] || styles.Pending
      } flex items-center gap-1 w-fit`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === "Approved"
            ? "bg-emerald-500"
            : status === "Rejected"
            ? "bg-rose-500"
            : "bg-slate-400"
        }`}
      ></span>
      {status}
    </span>
  );
};

// --- Auth Component ---
const AuthScreen = ({ onAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white">
              <LayoutGrid size={24} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Product Research
            </h1>
          </div>

          <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                isLogin
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                !isLogin
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Please wait..."
                : isLogin
                ? "Login"
                : "Create Account"}
            </button>
          </form>

          <p className="text-xs text-slate-500 mt-6 text-center">
            Your data is securely stored and encrypted
          </p>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);

  // 1. Handle Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Handle Data Fetching & Sync
  useEffect(() => {
    if (!user) return;

    const productsRef = collection(
      db,
      "artifacts",
      appId,
      "users",
      user.uid,
      "products"
    );

    const unsubscribe = onSnapshot(
      query(productsRef),
      (snapshot) => {
        const items = [];
        snapshot.forEach((doc) => {
          items.push({ ...doc.data(), id: doc.id });
        });

        items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        setProducts(items);
        setLoading(false);

        if (items.length === 0) {
          const savedLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (savedLocal) {
            const localData = JSON.parse(savedLocal);
            localData.forEach((prod) => {
              setDoc(
                doc(
                  db,
                  "artifacts",
                  appId,
                  "users",
                  user.uid,
                  "products",
                  prod.id
                ),
                prod
              );
            });
            localStorage.removeItem(LOCAL_STORAGE_KEY);
          }
        }
      },
      (error) => {
        console.error("Firestore sync error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleAddProduct = async () => {
    if (!user) return;
    const newId = generateId();
    const newProduct = {
      ...NEW_PRODUCT_TEMPLATE,
      id: newId,
      createdAt: Date.now(),
    };

    try {
      await setDoc(
        doc(db, "artifacts", appId, "users", user.uid, "products", newId),
        newProduct
      );
      setSelectedId(newId);
    } catch (e) {
      console.error("Error adding product:", e);
    }
  };

  const handleUpdateProduct = async (id, field, value) => {
    if (!user) return;
    const productRef = doc(
      db,
      "artifacts",
      appId,
      "users",
      user.uid,
      "products",
      id
    );
    try {
      await setDoc(productRef, { [field]: value }, { merge: true });
    } catch (e) {
      console.error("Error updating product:", e);
    }
  };

  const handleUpdateCompetitor = async (productId, compIndex, field, value) => {
    if (!user) return;
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const newCompetitors = [...product.competitors];
    newCompetitors[compIndex] = {
      ...newCompetitors[compIndex],
      [field]: value,
    };

    handleUpdateProduct(productId, "competitors", newCompetitors);
  };

  const handleAddOtherLink = async (productId) => {
    if (!user) return;
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const newLinks = [
      ...(product.otherLinks || []),
      { id: generateId(), title: "", url: "" },
    ];
    handleUpdateProduct(productId, "otherLinks", newLinks);
  };

  const handleUpdateOtherLink = async (productId, linkId, field, value) => {
    if (!user) return;
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const newLinks = (product.otherLinks || []).map((link) =>
      link.id === linkId ? { ...link, [field]: value } : link
    );
    handleUpdateProduct(productId, "otherLinks", newLinks);
  };

  const handleDeleteOtherLink = async (productId, linkId) => {
    if (!user) return;
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const newLinks = (product.otherLinks || []).filter(
      (link) => link.id !== linkId
    );
    handleUpdateProduct(productId, "otherLinks", newLinks);
  };

  const handleDeleteProduct = async (id, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!user) return;

    try {
      await deleteDoc(
        doc(db, "artifacts", appId, "users", user.uid, "products", id)
      );
      setSelectedId(null);
    } catch (e) {
      console.error("Error deleting product:", e);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const selectedProduct = products.find((p) => p.id === selectedId);

  // Show auth screen if not logged in
  if (authChecking) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white text-slate-400 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
          <p className="text-sm font-medium animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white text-slate-400 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
          <p className="text-sm font-medium animate-pulse">
            Syncing with cloud...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-white text-slate-800 font-sans selection:bg-slate-200 overflow-hidden">
      {/* Main List Area */}
      <div
        className={`flex-1 flex flex-col h-full transition-all duration-300 ease-in-out ${
          selectedId ? "mr-[500px]" : ""
        }`}
      >
        <header className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
              <LayoutGrid size={16} />
            </div>
            <h1 className="font-semibold text-lg tracking-tight text-slate-900">
              Product Research
            </h1>
            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs font-medium">
              {products.length} Items
            </span>
            <div className="flex items-center gap-1.5 ml-2 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
              <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
              {user.email}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors"
                size={16}
              />
              <input
                type="text"
                placeholder="Filter views..."
                className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-slate-400 focus:bg-white transition-all w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={handleAddProduct}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-all shadow-sm active:scale-95"
            >
              <Plus size={16} /> New Product
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1.5 rounded-md text-sm font-medium transition-all"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white z-10 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-8 py-3 w-64">Product Name</th>
                <th className="px-4 py-3 w-32">Status</th>
                <th className="px-4 py-3 text-right">COGs</th>
                <th className="px-4 py-3 text-right">Selling Price</th>
                <th className="px-4 py-3 text-right">Margin</th>
                <th className="px-4 py-3 text-right w-32">B/E ROAS</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-8 py-12 text-center text-slate-400"
                  >
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const roas = calculateRoas(product.price, product.cogs);
                  const isSelected = selectedId === product.id;
                  const margin =
                    parseFloat(product.price) - parseFloat(product.cogs);

                  return (
                    <tr
                      key={product.id}
                      onClick={() => setSelectedId(product.id)}
                      className={`group cursor-pointer transition-colors text-sm ${
                        isSelected ? "bg-slate-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-8 py-3 font-medium text-slate-900 relative">
                        {isSelected && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-900" />
                        )}
                        {product.name || (
                          <span className="text-slate-400 italic">
                            Untitled Product
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={product.status} />
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                        {product.cogs ? formatCurrency(product.cogs) : "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                        {product.price ? formatCurrency(product.price) : "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                        {!isNaN(margin) && product.price && product.cogs
                          ? formatCurrency(margin)
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {roas ? (
                          <span
                            className={`font-mono font-medium ${
                              parseFloat(roas) <= 1.5 && parseFloat(roas) > 0
                                ? "text-emerald-600"
                                : "text-rose-600"
                            }`}
                          >
                            {parseFloat(roas) <= 0 ? "Loss" : `${roas}x`}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight size={16} className="text-slate-400" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Inspector Panel */}
      <div
        className={`fixed top-0 right-0 h-full bg-white border-l border-slate-200 shadow-2xl z-20 transition-transform duration-300 transform w-[500px] flex flex-col ${
          selectedId ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedProduct && (
          <>
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex flex-col gap-1 w-full mr-4">
                <input
                  type="text"
                  value={selectedProduct.name}
                  onChange={(e) =>
                    handleUpdateProduct(
                      selectedProduct.id,
                      "name",
                      e.target.value
                    )
                  }
                  placeholder="Product Name"
                  className="text-xl font-semibold text-slate-900 outline-none bg-transparent w-full"
                />
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>ID: {selectedProduct.id}</span>
                  <span className="text-[10px] text-slate-300">•</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider">
                    Cloud Saved
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleDeleteProduct(selectedProduct.id, e)}
                  className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                  title="Delete Product"
                >
                  <Trash2 size={18} />
                </button>
                <button
                  onClick={() => setSelectedId(null)}
                  className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 pb-10">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-slate-500">
                    Status
                  </label>
                  <select
                    value={selectedProduct.status}
                    onChange={(e) =>
                      handleUpdateProduct(
                        selectedProduct.id,
                        "status",
                        e.target.value
                      )
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-2 text-sm outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-slate-500">
                    Content
                  </label>
                  <button
                    onClick={() =>
                      handleUpdateProduct(
                        selectedProduct.id,
                        "hasContent",
                        !selectedProduct.hasContent
                      )
                    }
                    className={`w-full h-[38px] border rounded px-3 flex items-center text-sm transition-colors ${
                      selectedProduct.hasContent
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium"
                        : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full mr-2 ${
                        selectedProduct.hasContent
                          ? "bg-indigo-500"
                          : "bg-slate-300"
                      }`}
                    />
                    {selectedProduct.hasContent ? "Ready" : "Not Ready"}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-slate-500 flex items-center gap-1.5">
                    <Zap size={12} /> Value Prop & Potential
                  </label>
                  <textarea
                    value={selectedProduct.valueProp}
                    onChange={(e) =>
                      handleUpdateProduct(
                        selectedProduct.id,
                        "valueProp",
                        e.target.value
                      )
                    }
                    placeholder="Why this product? What's the hook?"
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm outline-none resize-none focus:bg-white transition-all"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-slate-500 flex items-center gap-1.5">
                      <Target size={12} /> Target Market
                    </label>
                    <input
                      type="text"
                      value={selectedProduct.targetMarket}
                      onChange={(e) =>
                        handleUpdateProduct(
                          selectedProduct.id,
                          "targetMarket",
                          e.target.value
                        )
                      }
                      placeholder="e.g. US, UK, 25-40 Females"
                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm outline-none focus:bg-white transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-slate-500 flex items-center gap-1.5">
                      <ShoppingCart size={12} /> Supplier Link
                    </label>
                    <input
                      type="text"
                      value={selectedProduct.supplierLink}
                      onChange={(e) =>
                        handleUpdateProduct(
                          selectedProduct.id,
                          "supplierLink",
                          e.target.value
                        )
                      }
                      placeholder="AliExpress / CJ Link"
                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm outline-none focus:bg-white transition-all text-blue-600"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 font-medium text-slate-800">
                  <DollarSign size={16} /> Financial Breakdown
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500">
                      Total COGs ($)
                    </label>
                    <input
                      type="number"
                      value={selectedProduct.cogs}
                      onChange={(e) =>
                        handleUpdateProduct(
                          selectedProduct.id,
                          "cogs",
                          e.target.value
                        )
                      }
                      className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm font-mono outline-none focus:border-slate-400"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500">
                      Selling Price ($)
                    </label>
                    <input
                      type="number"
                      value={selectedProduct.price}
                      onChange={(e) =>
                        handleUpdateProduct(
                          selectedProduct.id,
                          "price",
                          e.target.value
                        )
                      }
                      className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm font-mono outline-none focus:border-slate-400"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
                  <div className="text-xs text-slate-500">Break-Even ROAS</div>
                  <div className="text-2xl font-bold font-mono tracking-tight">
                    {calculateRoas(
                      selectedProduct.price,
                      selectedProduct.cogs
                    ) ? (
                      <span
                        className={
                          parseFloat(
                            calculateRoas(
                              selectedProduct.price,
                              selectedProduct.cogs
                            )
                          ) <= 1.5 &&
                          parseFloat(
                            calculateRoas(
                              selectedProduct.price,
                              selectedProduct.cogs
                            )
                          ) > 0
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }
                      >
                        {calculateRoas(
                          selectedProduct.price,
                          selectedProduct.cogs
                        )}
                        <span className="text-sm text-slate-400 ml-1">x</span>
                      </span>
                    ) : (
                      <span className="text-slate-300">--</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 font-medium text-slate-800 border-b border-slate-100 pb-1">
                  <TrendingUp size={16} /> Competitor Intelligence
                </div>
                {selectedProduct.competitors.map((comp, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        placeholder={`Competitor ${idx + 1} Brand`}
                        value={comp.brand}
                        onChange={(e) =>
                          handleUpdateCompetitor(
                            selectedProduct.id,
                            idx,
                            "brand",
                            e.target.value
                          )
                        }
                        className="flex-1 bg-transparent border-b border-slate-200 pb-1 font-semibold text-sm outline-none focus:border-slate-400"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-slate-400 font-bold">
                          Ad Library
                        </label>
                        <input
                          type="text"
                          placeholder="URL"
                          value={comp.adLink}
                          onChange={(e) =>
                            handleUpdateCompetitor(
                              selectedProduct.id,
                              idx,
                              "adLink",
                              e.target.value
                            )
                          }
                          className="w-full bg-white px-2 py-1.5 border border-slate-200 rounded text-xs outline-none focus:border-slate-400 text-blue-600"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-slate-400 font-bold">
                          Store URL
                        </label>
                        <input
                          type="text"
                          placeholder="URL"
                          value={comp.storeLink}
                          onChange={(e) =>
                            handleUpdateCompetitor(
                              selectedProduct.id,
                              idx,
                              "storeLink",
                              e.target.value
                            )
                          }
                          className="w-full bg-white px-2 py-1.5 border border-slate-200 rounded text-xs outline-none focus:border-slate-400 text-blue-600"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-slate-400 font-bold">
                          Active Ads
                        </label>
                        <input
                          type="number"
                          placeholder="Count"
                          value={comp.adsCount}
                          onChange={(e) =>
                            handleUpdateCompetitor(
                              selectedProduct.id,
                              idx,
                              "adsCount",
                              e.target.value
                            )
                          }
                          className="w-full bg-white px-2 py-1.5 border border-slate-200 rounded text-xs outline-none focus:border-slate-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-slate-400 font-bold">
                          SimilarWeb Traffic
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 50k"
                          value={comp.traffic}
                          onChange={(e) =>
                            handleUpdateCompetitor(
                              selectedProduct.id,
                              idx,
                              "traffic",
                              e.target.value
                            )
                          }
                          className="w-full bg-white px-2 py-1.5 border border-slate-200 rounded text-xs outline-none focus:border-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <LinkIcon size={16} /> Other Links
                  </div>
                  <button
                    onClick={() => handleAddOtherLink(selectedProduct.id)}
                    className="text-xs text-indigo-600 font-semibold hover:underline"
                  >
                    + Add Link
                  </button>
                </div>
                <div className="space-y-2">
                  {(selectedProduct.otherLinks || []).map((link) => (
                    <div key={link.id} className="flex gap-2 items-start">
                      <div className="grid grid-cols-3 gap-2 flex-1">
                        <input
                          type="text"
                          placeholder="Title"
                          value={link.title}
                          onChange={(e) =>
                            handleUpdateOtherLink(
                              selectedProduct.id,
                              link.id,
                              "title",
                              e.target.value
                            )
                          }
                          className="col-span-1 bg-white border border-slate-200 rounded px-2 py-1.5 text-xs outline-none focus:border-slate-400"
                        />
                        <input
                          type="text"
                          placeholder="URL"
                          value={link.url}
                          onChange={(e) =>
                            handleUpdateOtherLink(
                              selectedProduct.id,
                              link.id,
                              "url",
                              e.target.value
                            )
                          }
                          className="col-span-2 bg-white border border-slate-200 rounded px-2 py-1.5 text-xs text-blue-600 outline-none focus:border-slate-400"
                        />
                      </div>
                      <button
                        onClick={() =>
                          handleDeleteOtherLink(selectedProduct.id, link.id)
                        }
                        className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-slate-500 flex items-center gap-1.5">
                  <FileText size={12} /> Internal Notes (Long Text)
                </label>
                <textarea
                  value={selectedProduct.internalNotes}
                  onChange={(e) =>
                    handleUpdateProduct(
                      selectedProduct.id,
                      "internalNotes",
                      e.target.value
                    )
                  }
                  placeholder="Log detailed research, sourcing conversations, or strategy..."
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm outline-none resize-none focus:bg-white transition-all h-32"
                />
              </div>

              <div className="space-y-2 pb-12">
                <label className="text-xs font-semibold uppercase text-slate-500">
                  Brainstorming Scratchpad
                </label>
                <textarea
                  value={selectedProduct.personalNotes}
                  onChange={(e) =>
                    handleUpdateProduct(
                      selectedProduct.id,
                      "personalNotes",
                      e.target.value
                    )
                  }
                  placeholder="Quick thoughts and ideas..."
                  className="w-full bg-yellow-50/30 border border-yellow-100 rounded px-3 py-2 text-sm outline-none resize-none h-24 italic"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
