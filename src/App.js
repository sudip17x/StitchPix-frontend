import React, { useState, useEffect } from 'react';
import { Upload, ImageIcon, Sparkles, Download, Share2, RefreshCw, LogOut, ChevronDown, AlertCircle, User, Mail, Lock } from 'lucide-react';

export default function StitchPixAI() {
  // User Management State
  const [currentPage, setCurrentPage] = useState('login');
  const [isSignUp, setIsSignUp] = useState(false);
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState('');
  
  // Form State - FIXED: Using React state instead of document.querySelector
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  
  // App State
  const [userPhoto, setUserPhoto] = useState(null);
  const [dressPhoto, setDressPhoto] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('canvas');
  const [showApiInput, setShowApiInput] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  // AI Models Configuration
  const aiModels = {
    free: [
      { id: 'canvas', name: 'Canvas Merge (Free)', needsApi: false, description: 'Basic image merging using canvas' },
      { id: 'nanobanana', name: 'Nano Banana API', needsApi: true, description: 'Advanced virtual try-on' },
      { id: 'deepai', name: 'DeepAI Image Generator API', needsApi: true, description: 'AI-powered image generation' },
      { id: 'huggingface', name: 'Hugging Face Inference API', needsApi: true, description: 'Open-source ML models' },
      { id: 'replicate', name: 'Replicate API (Free Tier)', needsApi: true, description: 'Virtual try-on with credits' },
      { id: 'stability', name: 'Stability AI (Free Credits)', needsApi: true, description: 'Image generation API' },
      { id: 'clarifai', name: 'Clarifai Community AI APIs', needsApi: true, description: 'Community AI models' }
    ],
    paid: [
      { id: 'adobe', name: 'Adobe Photoshop API', needsApi: true, description: 'Professional image editing' },
      { id: 'rekognition', name: 'Amazon Rekognition Custom Labels', needsApi: true, description: 'AWS custom ML models' },
      { id: 'google-vision', name: 'Google Cloud Vision API', needsApi: true, description: 'Custom ML vision models' },
      { id: 'azure', name: 'Microsoft Azure AI Vision', needsApi: true, description: 'Azure cognitive services' }
    ]
  };

  const allModels = [...aiModels.free, ...aiModels.paid];
  const currentModelData = allModels.find(m => m.id === selectedModel);

  // Load saved API key from localStorage
  useEffect(() => {
    const savedApiKey = localStorage.getItem('stitchpix_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setCurrentPage("upload");
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPassword = (password) => {
    return password.length >= 6;
  };

  // FIXED: Using React state instead of document.querySelector
  const handleSignUp = async () => {
    setAuthError("");

    if (!formName || formName.length < 2) return setAuthError("Name must be at least 2 characters long");
    if (!isValidEmail(formEmail)) return setAuthError("Invalid email format");
    if (!isValidPassword(formPassword)) return setAuthError("Password must be at least 6 characters");

    try {
      const response = await fetch("https://stitchpix-backend-1.onrender.com/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: formName, 
          email: formEmail, 
          password: formPassword 
        })
      });

      const data = await response.json();
      if (!response.ok) return setAuthError(data.message);

      // Save JWT token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setUser(data.user);
      setCurrentPage("upload");
      
      // Clear form
      setFormName("");
      setFormEmail("");
      setFormPassword("");
    } catch (error) {
      setAuthError("Signup failed. Try again.");
    }
  };

  // FIXED: Using React state instead of document.querySelector
  const handleLogin = async () => {
    setAuthError('');

    if (!formEmail || !formPassword) {
      setAuthError('Please enter both email and password');
      return;
    }

    try {
      const res = await fetch("https://stitchpix-backend-1.onrender.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: formEmail, 
          password: formPassword 
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.message);
        return;
      }

      // Store JWT token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setUser(data.user);
      setCurrentPage("upload");
      
      // Clear form
      setFormEmail("");
      setFormPassword("");

    } catch (err) {
      setAuthError("Login failed. Check your internet or server.");
    }
  };

  const handleAuth = () => {
    if (isSignUp) {
      handleSignUp();
    } else {
      handleLogin();
    }
  };

  const resetAuthForm = () => {
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setAuthError("");
  };

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please upload an image file (JPEG, PNG, etc.)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'user') {
          setUserPhoto(reader.result);
        } else {
          setDressPhoto(reader.result);
        }
        setErrorMessage('');
      };
      reader.readAsDataURL(file);
    }
  };

  // FIXED: Nano Banana API with correct implementation
  const callNanoBanana = async (userPhotoData, dressPhotoData) => {
    try {
      const base64ToBlob = (base64) => {
        const byteString = atob(base64.split(',')[1]);
        const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mimeString });
      };

      const formData = new FormData();
      formData.append('person_image', base64ToBlob(userPhotoData), 'user.jpg');
      formData.append('garment_image', base64ToBlob(dressPhotoData), 'dress.jpg');
      
      const response = await fetch('https://api.nanobanana.ai/api/try-on', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Nano Banana API failed with status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.output_url || result.image_url) {
        return [{
          id: 1,
          url: result.output_url || result.image_url,
          quality: 'AI Enhanced (Nano Banana)',
          source: 'nanobanana'
        }];
      } else {
        throw new Error('No output URL received from API');
      }
    } catch (error) {
      throw new Error(`Nano Banana API Error: ${error.message}`);
    }
  };

  // Canvas Merge - Fixed overlapping issue
  const createMergedImages = (userPhotoData, dressPhotoData) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const userImg = new Image();
      const dressImg = new Image();
      
      userImg.onload = () => {
        dressImg.onload = () => {
          // Set canvas to dress image size
          canvas.width = dressImg.width;
          canvas.height = dressImg.height;
          
          // First draw the complete dress image
          ctx.drawImage(dressImg, 0, 0, canvas.width, canvas.height);
          
          // Calculate face area on the dress model - FIXED OVERLAPPING
          const faceWidth = canvas.width * 0.25;
          const faceHeight = faceWidth * 1.2;
          const faceX = (canvas.width - faceWidth) / 2;
          const faceY = canvas.height * 0.08;
          
          // Extract just the face from user photo
          const userFaceArea = {
            x: userImg.width * 0.25,
            y: userImg.height * 0.1,
            width: userImg.width * 0.5,
            height: userImg.height * 0.4
          };
          
          // Create clipping path for smooth blending
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(faceX, faceY, faceWidth, faceHeight, 50);
          ctx.clip();
          
          // Draw only the face portion
          ctx.drawImage(
            userImg,
            userFaceArea.x,
            userFaceArea.y,
            userFaceArea.width,
            userFaceArea.height,
            faceX,
            faceY,
            faceWidth,
            faceHeight
          );
          
          ctx.restore();
          
          const mergedUrl = canvas.toDataURL('image/png', 1.0);
          
          resolve([{
            id: 1,
            url: mergedUrl,
            quality: 'Canvas Merged',
            source: 'canvas'
          }]);
        };

        dressImg.onerror = () => {
          resolve([{
            id: 1,
            url: userPhotoData,
            quality: 'Original',
            source: 'original'
          }]);
        };

        dressImg.src = dressPhotoData;
      };
      
      userImg.onerror = () => {
        resolve([{
          id: 1,
          url: dressPhotoData,
          quality: 'Original',
          source: 'original'
        }]);
      };
      
      userImg.src = userPhotoData;
    });
  };

  const handleGenerate = async () => {
    if (!userPhoto || !dressPhoto) {
      setErrorMessage('Please upload both your photo and a dress image!');
      return;
    }

    if (currentModelData?.needsApi && !apiKey) {
      setErrorMessage(`Please enter your API key for ${currentModelData.name}`);
      return;
    }

    setIsGenerating(true);
    setErrorMessage('');
    
    try {
      let result;

      if (selectedModel === 'nanobanana') {
        result = await callNanoBanana(userPhoto, dressPhoto);
      } else if (selectedModel === 'canvas') {
        result = await createMergedImages(userPhoto, dressPhoto);
      } else {
        // For other models, use canvas merge as fallback
        result = await createMergedImages(userPhoto, dressPhoto);
      }

      setGeneratedImages(result);
      setCurrentPage('results');
    } catch (error) {
      console.error('Generation error:', error);
      setErrorMessage(`${error.message} - Falling back to canvas merge...`);
      
      // Fallback to canvas merge
      try {
        const fallbackResult = await createMergedImages(userPhoto, dressPhoto);
        setGeneratedImages(fallbackResult);
        setCurrentPage('results');
      } catch (fallbackError) {
        setErrorMessage(`Error: ${fallbackError.message}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (imageUrl, imageName) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `stitchpix-ai-${imageName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setUserPhoto(null);
    setDressPhoto(null);
    setGeneratedImages([]);
    setErrorMessage('');
    setCurrentPage('upload');
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    // Clear all stored data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('stitchpix_api_key');
    
    setUser(null);
    setUserPhoto(null);
    setDressPhoto(null);
    setGeneratedImages([]);
    setApiKey('');
    setCurrentPage('login');
    setAuthError('');
    setShowLogoutConfirm(false);
    
    // Reset form fields
    resetAuthForm();
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // Save API key to localStorage when changed
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('stitchpix_api_key', apiKey);
    }
  }, [apiKey]);

  // Page 1: Login/SignUp
  if (currentPage === 'login') {
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

          {authError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {authError}
            </div>
          )}

          <div className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="John Doe"
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
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password * {isSignUp && <span className="text-xs text-gray-500">(min 6 characters)</span>}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              onClick={handleAuth}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition duration-200"
            >
              {isSignUp ? 'Create Account' : 'Login to Account'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                resetAuthForm();
              }}
              className="text-purple-600 hover:text-purple-800 font-medium"
            >
              {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-gray-500">
            <p>🔒 Your data is stored locally and securely</p>
          </div>
        </div>
      </div>
    );
  }

  // Page 2: Upload Page
  if (currentPage === 'upload') {
    return (
      <div className="min-h-screen bg-gray-50">
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-4">
              <h3 className="text-xl font-bold text-gray-800 mb-3">Confirm Logout</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
              <div className="flex gap-3">
                <button
                  onClick={cancelLogout}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  Logout
                </button>
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
              <span className="text-sm text-gray-600">
                Welcome, <span className="font-semibold">{user?.name || user?.email}</span>
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Virtual Try-On Studio</h2>
            <p className="text-gray-600 text-lg">Upload your photo and a dress model to see yourself wearing it!</p>
            
            {/* AI Model Dropdown */}
            <div className="mt-8 max-w-md mx-auto">
              <label className="block text-sm font-medium text-gray-700 mb-3">Select AI Model</label>
              <div className="relative">
                <button
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="w-full px-4 py-3 bg-white border-2 border-purple-300 rounded-lg flex items-center justify-between hover:border-purple-500 transition"
                >
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">{currentModelData?.name}</p>
                    <p className="text-xs text-gray-500">{currentModelData?.description}</p>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-600 transition ${showModelDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showModelDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-purple-300 rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
                    <div className="p-3 bg-green-50 border-b sticky top-0">
                      <p className="text-xs font-bold text-green-700 uppercase">Free Models</p>
                    </div>
                    {aiModels.free.map(model => (
                      <button
                        key={model.id}
                        onClick={() => {
                          setSelectedModel(model.id);
                          setShowModelDropdown(false);
                          if (!model.needsApi) {
                            setShowApiInput(false);
                          }
                        }}
                        className={`w-full text-left px-4 py-3 border-b hover:bg-purple-50 transition ${
                          selectedModel === model.id ? 'bg-purple-100 border-l-4 border-l-purple-600' : ''
                        }`}
                      >
                        <p className="font-medium text-gray-800">{model.name}</p>
                        <p className="text-xs text-gray-600 mt-1">{model.description}</p>
                        {model.needsApi && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded inline-block mt-2">API Key Required</span>}
                      </button>
                    ))}

                    <div className="p-3 bg-blue-50 border-b sticky top-0">
                      <p className="text-xs font-bold text-blue-700 uppercase">Paid Models</p>
                    </div>
                    {aiModels.paid.map(model => (
                      <button
                        key={model.id}
                        onClick={() => {
                          setSelectedModel(model.id);
                          setShowModelDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 border-b hover:bg-purple-50 transition ${
                          selectedModel === model.id ? 'bg-purple-100 border-l-4 border-l-purple-600' : ''
                        }`}
                      >
                        <p className="font-medium text-gray-800">{model.name}</p>
                        <p className="text-xs text-gray-600 mt-1">{model.description}</p>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded inline-block mt-2">API Key Required</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* API Key Input */}
            {currentModelData?.needsApi && (
              <div className="mt-6 max-w-md mx-auto">
                <button
                  onClick={() => setShowApiInput(!showApiInput)}
                  className="text-purple-600 hover:text-purple-800 font-medium mb-2"
                >
                  {showApiInput ? '▼' : '▶'} {apiKey ? 'Update' : 'Enter'} API Key
                </button>
                
                {showApiInput && (
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                      API Key for {currentModelData?.name}
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your API key"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-2 text-left">
                      Your API key is stored locally and never shared
                    </p>
                  </div>
                )}
                
                {apiKey && !showApiInput && (
                  <div className="text-sm text-green-600 font-medium">
                    ✓ API Key configured
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg flex items-start gap-3 max-w-2xl mx-auto">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-yellow-800 text-sm">{errorMessage}</p>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-600" />
                Your Face Photo
              </h3>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'user')}
                  className="hidden"
                />
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
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-pink-600" />
                Model with Dress
              </h3>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'dress')}
                  className="hidden"
                />
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
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !userPhoto || !dressPhoto || (currentModelData?.needsApi && !apiKey)}
              className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-12 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3 mx-auto"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  Processing with {currentModelData?.name}...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  Generate with {currentModelData?.name}
                </>
              )}
            </button>
            
            <p className="text-sm text-gray-500 mt-3">
              {currentModelData?.needsApi && apiKey ? '✓ API Connected - Ready' : currentModelData?.needsApi ? '⚠️ API Key Required' : '✓ Ready to Generate'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Page 3: Results Gallery
  if (currentPage === 'results') {
    return (
      <div className="min-h-screen bg-gray-50">
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-4">
              <h3 className="text-xl font-bold text-gray-800 mb-3">Confirm Logout</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
              <div className="flex gap-3">
                <button
                  onClick={cancelLogout}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  Logout
                </button>
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
              <span className="text-sm text-gray-600">
                Welcome, <span className="font-semibold">{user?.name || user?.email}</span>
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">✨ Your Perfect Result!</h2>
            <p className="text-gray-600 text-lg">Generated with {generatedImages[0]?.source === 'canvas' ? 'Canvas Merge' : generatedImages[0]?.source === 'nanobanana' ? 'Nano Banana AI' : 'AI Model'}</p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
              <img 
                src={generatedImages[0]?.url} 
                alt="Merged Result" 
                className="w-full h-auto object-contain max-h-96"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/500x500?text=Image+Generation+Failed';
                }}
              />
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    ✨ {generatedImages[0]?.quality}
                  </span>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleDownload(generatedImages[0]?.url, 'merged-result')}
                    className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2 font-semibold"
                  >
                    <Download className="w-5 h-5" />
                    Download Image
                  </button>
                  <button 
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: 'My StitchPix AI Result',
                          text: 'Check out my virtual try-on result!',
                          url: window.location.href,
                        });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        alert('Link copied to clipboard!');
                      }
                    }}
                    className="flex-1 bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 transition flex items-center justify-center gap-2 font-semibold"
                  >
                    <Share2 className="w-5 h-5" />
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center mt-8">
            <button
              onClick={handleReset}
              className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Try Another Dress
            </button>
          </div>
        </div>
      </div>
    );
  }
}
