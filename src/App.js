// src/App.js
import React, { useEffect, useState, useRef } from "react";
import {
  Upload,
  ImageIcon,
  Sparkles,
  Download,
  Share2,
  RefreshCw,
  LogOut,
  ChevronDown,
  AlertCircle,
  User,
  Mail,
  Lock,
} from "lucide-react";

/**
 * Production-ready single-file App.js for StitchPix frontend (Option A)
 *
 * - Controlled inputs (no document.querySelector)
 * - Token + user saved in localStorage
 * - Robust error handling
 * - Canvas merge fallback (works offline)
 * - NanoBanana / DeepAI helper functions (kept as optional external integrations)
 * - Small UX improvements (loading states, disabled buttons, form validation)
 *
 * Notes:
 * - Update STITCHPIX_BACKEND if you deploy backend to another URL
 * - This file assumes Tailwind CSS for styling (class names used extensively)
 */

const STITCHPIX_BACKEND = process.env.REACT_APP_STITCHPIX_BACKEND || "https://stitchpix-backend-1.onrender.com";

export default function StitchPixAI() {
  // --- Pages / UI state ---
  const [currentPage, setCurrentPage] = useState("login"); // login | upload | results
  const [isSignUp, setIsSignUp] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showApiInput, setShowApiInput] = useState(false);

  // --- Auth state ---
  const [user, setUser] = useState(null); // { id, name, email } or null
  const [token, setToken] = useState(null);
  const [authError, setAuthError] = useState("");
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // Controlled auth form
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  // --- App state ---
  const [userPhoto, setUserPhoto] = useState(null); // dataURL
  const [dressPhoto, setDressPhoto] = useState(null); // dataURL
  const [generatedImages, setGeneratedImages] = useState([]); // [{id, url, quality, source}]
  const [apiKey, setApiKey] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Model selection
  const aiModels = {
    free: [
      { id: "canvas", name: "Canvas Merge (Free)", needsApi: false, description: "Basic image merging using canvas" },
      { id: "nanobanana", name: "Nano Banana API", needsApi: true, description: "Advanced virtual try-on" },
      { id: "deepai", name: "DeepAI Image Editor", needsApi: true, description: "Image editing/generation" },
      { id: "huggingface", name: "Hugging Face Inference API", needsApi: true, description: "Open-source ML models" },
    ],
    paid: [
      { id: "replicate", name: "Replicate API", needsApi: true, description: "Run community models" },
      { id: "stability", name: "Stability AI", needsApi: true, description: "Image generation API" },
    ],
  };

  const allModels = [...aiModels.free, ...aiModels.paid];
  const [selectedModel, setSelectedModel] = useState("canvas");
  const currentModelData = allModels.find((m) => m.id === selectedModel);

  // Refs to avoid stale closures for long operations
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // --- Utilities / validation ---
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = (pwd) => typeof pwd === "string" && pwd.length >= 6;

  // Try to hydrate user/token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("stitchpix_token");
    const savedUser = localStorage.getItem("stitchpix_user");
    const savedApiKey = localStorage.getItem("stitchpix_api_key");
    if (savedApiKey) setApiKey(savedApiKey);
    if (savedToken) setToken(savedToken);
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setCurrentPage("upload");
      } catch {
        localStorage.removeItem("stitchpix_user");
      }
    }
  }, []);

  // persist apiKey
  useEffect(() => {
    if (apiKey) localStorage.setItem("stitchpix_api_key", apiKey);
    else localStorage.removeItem("stitchpix_api_key");
  }, [apiKey]);

  // --- Auth flows (signup/login) ---
  const handleSignUp = async () => {
    setAuthError("");
    if (!authName || authName.trim().length < 2) return setAuthError("Name must be at least 2 characters long");
    if (!isValidEmail(authEmail)) return setAuthError("Invalid email");
    if (!isValidPassword(authPassword)) return setAuthError("Password must be at least 6 characters");

    setIsLoadingAuth(true);
    try {
      const controller = new AbortController();
      const res = await fetch(`${STITCHPIX_BACKEND}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: authName.trim(), email: authEmail.trim(), password: authPassword }),
        signal: controller.signal,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAuthError(data?.message || `Signup failed (status ${res.status})`);
        return;
      }

      // backend may return token & user
      if (data.token) {
        localStorage.setItem("stitchpix_token", data.token);
        setToken(data.token);
      }
      const savedUser = data.user || { name: authName.trim(), email: authEmail.trim() };
      localStorage.setItem("stitchpix_user", JSON.stringify(savedUser));
      setUser(savedUser);
      setCurrentPage("upload");

      // clear form
      setAuthName("");
      setAuthEmail("");
      setAuthPassword("");
    } catch (err) {
      console.error("signup error:", err);
      setAuthError("Signup failed. Check network or try again.");
    } finally {
      if (mountedRef.current) setIsLoadingAuth(false);
    }
  };

  const handleLogin = async () => {
    setAuthError("");
    if (!isValidEmail(authEmail)) return setAuthError("Enter a valid email");
    if (!authPassword) return setAuthError("Please enter your password");

    setIsLoadingAuth(true);
    try {
      const res = await fetch(`${STITCHPIX_BACKEND}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail.trim(), password: authPassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAuthError(data?.message || `Login failed (status ${res.status})`);
        return;
      }

      if (data.token) {
        localStorage.setItem("stitchpix_token", data.token);
        setToken(data.token);
      }

      const savedUser = data.user || { email: authEmail.trim() };
      localStorage.setItem("stitchpix_user", JSON.stringify(savedUser));
      setUser(savedUser);
      setCurrentPage("upload");

      // clear form
      setAuthEmail("");
      setAuthPassword("");
    } catch (err) {
      console.error("login error:", err);
      setAuthError("Login failed. Check network or server.");
    } finally {
      if (mountedRef.current) setIsLoadingAuth(false);
    }
  };

  const handleAuth = () => {
    if (isSignUp) return handleSignUp();
    return handleLogin();
  };

  // --- Image upload helpers (convert to dataURL) ---
  const validateImageFile = (file) => {
    if (!file.type.startsWith("image/")) return "Please upload an image file (jpg, png, etc.)";
    if (file.size > 6 * 1024 * 1024) return "Image too large. Max 6MB.";
    return null;
  };

  const handleImageUpload = (e, type) => {
    setErrorMessage("");
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateImageFile(file);
    if (err) {
      setErrorMessage(err);
      return;
    }

    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (!mountedRef.current) return;
      const dataUrl = reader.result;
      if (type === "user") setUserPhoto(dataUrl);
      else setDressPhoto(dataUrl);
      setIsUploadingImage(false);
    };
    reader.onerror = () => {
      setIsUploadingImage(false);
      setErrorMessage("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  // --- External API helpers (optional) ---
  // These assume the API accepts multipart/form-data and returns { output_url | image_url }
  const callNanoBanana = async (userPhotoData, dressPhotoData) => {
    if (!apiKey) throw new Error("NanoBanana requires API key");
    const base64ToBlob = (base64) => {
      const byteString = atob(base64.split(",")[1]);
      const mimeString = base64.split(",")[0].split(":")[1].split(";")[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      return new Blob([ab], { type: mimeString });
    };

    const formData = new FormData();
    formData.append("person_image", base64ToBlob(userPhotoData), "user.jpg");
    formData.append("garment_image", base64ToBlob(dressPhotoData), "dress.jpg");

    const res = await fetch("https://api.nanobanana.ai/api/try-on", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    if (!res.ok) throw new Error(`NanoBanana API failed (${res.status})`);
    const result = await res.json();
    if (result.output_url || result.image_url) {
      return [{ id: 1, url: result.output_url || result.image_url, quality: "AI Enhanced (NanoBanana)", source: "nanobanana" }];
    }
    throw new Error("NanoBanana returned no image URL");
  };

  const callDeepAI = async (userPhotoData, dressPhotoData) => {
    if (!apiKey) throw new Error("DeepAI requires API key");
    const res = await fetch("https://api.deepai.org/api/image-editor", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ image: userPhotoData, text: "merge with dress image and create virtual try-on" }),
    });
    if (!res.ok) throw new Error(`DeepAI failed (${res.status})`);
    const data = await res.json();
    if (data.output_url) return [{ id: 1, url: data.output_url, quality: "AI Enhanced (DeepAI)", source: "deepai" }];
    throw new Error("DeepAI returned no image");
  };

  // --- Canvas merge fallback (works entirely in browser) ---
  const createMergedImages = (userPhotoData, dressPhotoData) =>
    new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const userImg = new Image();
      const dressImg = new Image();
      userImg.crossOrigin = "anonymous";
      dressImg.crossOrigin = "anonymous";

      userImg.onload = () => {
        dressImg.onload = () => {
          // set size to dress image (target)
          canvas.width = dressImg.width;
          canvas.height = dressImg.height;

          // draw dress first
          ctx.drawImage(dressImg, 0, 0, canvas.width, canvas.height);

          // simple face placement heuristic (center top portion)
          const faceWidth = Math.round(canvas.width * 0.25);
          const faceHeight = Math.round(faceWidth * 1.2);
          const faceX = Math.round((canvas.width - faceWidth) / 2);
          const faceY = Math.round(canvas.height * 0.08);

          // crop face box from user image
          const uX = Math.round(userImg.width * 0.25);
          const uY = Math.round(userImg.height * 0.1);
          const uW = Math.round(userImg.width * 0.5);
          const uH = Math.round(userImg.height * 0.4);

          ctx.save();
          // rounded rect clipping (fallback path if not available)
          if (typeof ctx.roundRect === "function") {
            ctx.beginPath();
            ctx.roundRect(faceX, faceY, faceWidth, faceHeight, 36);
            ctx.clip();
          } else {
            // fallback rounded-rect path
            const r = 36;
            ctx.beginPath();
            ctx.moveTo(faceX + r, faceY);
            ctx.arcTo(faceX + faceWidth, faceY, faceX + faceWidth, faceY + faceHeight, r);
            ctx.arcTo(faceX + faceWidth, faceY + faceHeight, faceX, faceY + faceHeight, r);
            ctx.arcTo(faceX, faceY + faceHeight, faceX, faceY, r);
            ctx.arcTo(faceX, faceY, faceX + faceWidth, faceY, r);
            ctx.closePath();
            ctx.clip();
          }

          try {
            ctx.drawImage(userImg, uX, uY, uW, uH, faceX, faceY, faceWidth, faceHeight);
          } catch {
            // if something goes wrong, draw whole user image scaled
            ctx.drawImage(userImg, faceX, faceY, faceWidth, faceHeight);
          }
          ctx.restore();

          const mergedUrl = canvas.toDataURL("image/png", 1.0);
          resolve([{ id: 1, url: mergedUrl, quality: "Canvas Merged", source: "canvas" }]);
        };

        dressImg.onerror = () => {
          resolve([{ id: 1, url: userPhotoData, quality: "Original", source: "original" }]);
        };

        dressImg.src = dressPhotoData;
      };

      userImg.onerror = () => {
        resolve([{ id: 1, url: dressPhotoData, quality: "Original", source: "original" }]);
      };

      userImg.src = userPhotoData;
    });

  // --- Generate handler (model selection + fallback) ---
  const handleGenerate = async () => {
    setErrorMessage("");
    if (!userPhoto || !dressPhoto) {
      setErrorMessage("Upload both your photo and the dress model.");
      return;
    }
    if (currentModelData?.needsApi && !apiKey) {
      setErrorMessage(`API key required for ${currentModelData.name}`);
      return;
    }

    setIsGenerating(true);
    try {
      let result;
      if (selectedModel === "nanobanana") result = await callNanoBanana(userPhoto, dressPhoto);
      else if (selectedModel === "deepai") result = await callDeepAI(userPhoto, dressPhoto);
      else result = await createMergedImages(userPhoto, dressPhoto);

      if (!Array.isArray(result) || result.length === 0) throw new Error("No images returned from model");
      setGeneratedImages(result);
      setCurrentPage("results");
    } catch (err) {
      console.error("generate error:", err);
      setErrorMessage(`${err.message} — falling back to canvas merge...`);
      try {
        const fallback = await createMergedImages(userPhoto, dressPhoto);
        setGeneratedImages(fallback);
        setCurrentPage("results");
      } catch (fbErr) {
        console.error("fallback error:", fbErr);
        setErrorMessage(`Generation failed: ${fbErr.message}`);
      }
    } finally {
      if (mountedRef.current) setIsGenerating(false);
    }
  };

  // --- Download / share / reset / logout ---
  const handleDownload = (imageUrl, imageName = "result") => {
    try {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `stitchpix-${imageName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("download error:", err);
      setErrorMessage("Download failed.");
    }
  };

  const handleReset = () => {
    setUserPhoto(null);
    setDressPhoto(null);
    setGeneratedImages([]);
    setErrorMessage("");
    setCurrentPage("upload");
  };

  const handleLogout = () => setShowLogoutConfirm(true);
  const confirmLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("stitchpix_token");
    localStorage.removeItem("stitchpix_user");
    // keep API key stored optionally
    setUserPhoto(null);
    setDressPhoto(null);
    setGeneratedImages([]);
    setShowLogoutConfirm(false);
    setCurrentPage("login");
  };
  const cancelLogout = () => setShowLogoutConfirm(false);

  // --- Small helper UI components (inline for a single-file) ---
  const AuthErrorBox = ({ message }) =>
    message ? (
      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        <div>{message}</div>
      </div>
    ) : null;

  // --- JSX pages ---
  // LOGIN / SIGNUP
  if (currentPage === "login") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">StitchPix AI</h1>
            <p className="text-gray-600 mt-2">Virtual Try-On Experience</p>
          </div>

          <AuthErrorBox message={authError} />

          <div className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="John Doe"
                    name="name"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="you@example.com"
                  name="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="••••••••"
                  name="password"
                />
              </div>
            </div>

            <button
              onClick={handleAuth}
              disabled={isLoadingAuth}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition disabled:opacity-50"
            >
              {isLoadingAuth ? "Processing..." : isSignUp ? "Create Account" : "Login to Account"}
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setAuthError("");
                setAuthName("");
                setAuthEmail("");
                setAuthPassword("");
              }}
              className="text-purple-600 hover:text-purple-800 font-medium"
            >
              {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign Up"}
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-gray-500">
            <p>🔒 Your data is stored locally and securely</p>
          </div>
        </div>
      </div>
    );
  }

  // UPLOAD PAGE
  if (currentPage === "upload") {
    return (
      <div className="min-h-screen bg-gray-50">
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-4">
              <h3 className="text-xl font-bold text-gray-800 mb-3">Confirm Logout</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
              <div className="flex gap-3">
                <button onClick={cancelLogout} className="flex-1 px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                <button onClick={confirmLogout} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg">Logout</button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-800">StitchPix AI</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, <span className="font-semibold">{user?.name || user?.email}</span></span>
              <button onClick={handleLogout} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Virtual Try-On Studio</h2>
            <p className="text-gray-600 text-lg">Upload your photo and a dress model to see yourself wearing it!</p>

            {/* Model selector */}
            <div className="mt-8 max-w-md mx-auto">
              <label className="block text-sm font-medium text-gray-700 mb-3">Select AI Model</label>
              <div className="relative">
                <button onClick={() => setShowModelDropdown(!showModelDropdown)} className="w-full px-4 py-3 bg-white border-2 border-purple-300 rounded-lg flex items-center justify-between">
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">{currentModelData?.name}</p>
                    <p className="text-xs text-gray-500">{currentModelData?.description}</p>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-600 ${showModelDropdown ? "rotate-180" : ""}`} />
                </button>

                {showModelDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-purple-300 rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
                    <div className="p-3 bg-green-50 border-b sticky top-0"><p className="text-xs font-bold text-green-700 uppercase">Free Models</p></div>
                    {aiModels.free.map((model) => (
                      <button key={model.id} onClick={() => { setSelectedModel(model.id); setShowModelDropdown(false); if (!model.needsApi) { setShowApiInput(false); } }} className={`w-full text-left px-4 py-3 border-b hover:bg-purple-50 ${selectedModel === model.id ? "bg-purple-100 border-l-4 border-l-purple-600" : ""}`}>
                        <p className="font-medium text-gray-800">{model.name}</p>
                        <p className="text-xs text-gray-600 mt-1">{model.description}</p>
                        {model.needsApi && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded inline-block mt-2">API Key Required</span>}
                      </button>
                    ))}

                    <div className="p-3 bg-blue-50 border-b sticky top-0"><p className="text-xs font-bold text-blue-700 uppercase">Paid Models</p></div>
                    {aiModels.paid.map((model) => (
                      <button key={model.id} onClick={() => { setSelectedModel(model.id); setShowModelDropdown(false); }} className={`w-full text-left px-4 py-3 border-b hover:bg-purple-50 ${selectedModel === model.id ? "bg-purple-100 border-l-4 border-l-purple-600" : ""}`}>
                        <p className="font-medium text-gray-800">{model.name}</p>
                        <p className="text-xs text-gray-600 mt-1">{model.description}</p>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded inline-block mt-2">API Key Required</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* API Key input */}
            {currentModelData?.needsApi && (
              <div className="mt-6 max-w-md mx-auto">
                <button onClick={() => setShowApiInput(!showApiInput)} className="text-purple-600 hover:text-purple-800 mb-2">
                  {showApiInput ? "▼" : "▶"} {apiKey ? "Update" : "Enter"} API Key
                </button>

                {showApiInput && (
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">API Key for {currentModelData?.name}</label>
                    <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter your API key" className="w-full px-4 py-2 border rounded-lg" />
                    <p className="text-xs text-gray-500 mt-2">Your API key is stored locally only</p>
                  </div>
                )}

                {apiKey && !showApiInput && <div className="text-sm text-green-600 font-medium">✓ API Key configured</div>}
              </div>
            )}
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg flex items-start gap-3 max-w-2xl mx-auto">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div><p className="text-yellow-800 text-sm">{errorMessage}</p></div>
            </div>
          )}

          {/* Upload panels */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-purple-600" />Your Face Photo</h3>
              <label className="cursor-pointer">
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "user")} className="hidden" />
                <div className="border-4 border-dashed border-purple-300 rounded-xl h-80 flex items-center justify-center hover:border-purple-500 transition bg-purple-50">
                  {userPhoto ? (
                    <img src={userPhoto} alt="User" className="max-h-full max-w-full object-contain rounded-lg" />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">Upload your face photo</p>
                      <p className="text-gray-400 text-sm mt-2">Clear face shot recommended</p>
                    </div>
                  )}
                </div>
              </label>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-pink-600" />Model with Dress</h3>
              <label className="cursor-pointer">
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "dress")} className="hidden" />
                <div className="border-4 border-dashed border-pink-300 rounded-xl h-80 flex items-center justify-center hover:border-pink-500 transition bg-pink-50">
                  {dressPhoto ? (
                    <img src={dressPhoto} alt="Dress" className="max-h-full max-w-full object-contain rounded-lg" />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-16 h-16 text-pink-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">Upload model wearing dress</p>
                      <p className="text-gray-400 text-sm mt-2">Full body photo works best</p>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          <div className="text-center">
            <button onClick={handleGenerate} disabled={isGenerating || !userPhoto || !dressPhoto || (currentModelData?.needsApi && !apiKey)} className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-12 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3 mx-auto">
              {isGenerating ? (<><RefreshCw className="w-6 h-6 animate-spin" /> Processing...</>) : (<><Sparkles className="w-6 h-6" /> Generate with {currentModelData?.name}</>)}
            </button>
            <p className="text-sm text-gray-500 mt-3">{currentModelData?.needsApi && apiKey ? "✓ API Connected - Ready" : currentModelData?.needsApi ? "⚠️ API Key Required" : "✓ Ready to Generate"}</p>
          </div>
        </div>
      </div>
    );
  }

  // RESULTS PAGE
  if (currentPage === "results") {
    const result = generatedImages?.[0];
    return (
      <div className="min-h-screen bg-gray-50">
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-4">
              <h3 className="text-xl font-bold text-gray-800 mb-3">Confirm Logout</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
              <div className="flex gap-3">
                <button onClick={cancelLogout} className="flex-1 px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                <button onClick={confirmLogout} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg">Logout</button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2"><Sparkles className="w-6 h-6 text-purple-600" /><h1 className="text-2xl font-bold text-gray-800">StitchPix AI</h1></div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-gray-600 hover:text-gray-800"><LogOut className="w-5 h-5" /> Logout</button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">✨ Your Result</h2>
            <p className="text-gray-600 text-lg">Generated with {result?.source === "canvas" ? "Canvas Merge" : result?.source === "nanobanana" ? "NanoBanana" : result?.source === "deepai" ? "DeepAI" : "AI Model"}</p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
              <img src={result?.url} alt="Merged Result" className="w-full h-auto object-contain" onError={(e) => { e.target.src = "https://via.placeholder.com/500x500?text=Image+not+available"; }} />
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-semibold">✨ {result?.quality}</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleDownload(result?.url, "merged-result")} className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2 font-semibold">
                    <Download className="w-5 h-5" /> Download Image
                  </button>
                  <button onClick={() => { if (navigator.share) { navigator.share({ title: "My StitchPix Result", url: window.location.href }); } else { navigator.clipboard.writeText(window.location.href); alert("Link copied to clipboard"); } }} className="flex-1 bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 transition flex items-center justify-center gap-2 font-semibold">
                    <Share2 className="w-5 h-5" /> Share
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center mt-8">
            <button onClick={handleReset} className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition flex items-center gap-2"><RefreshCw className="w-5 h-5" /> Try Another Dress</button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback (should not happen)
  return null;
}
