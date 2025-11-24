
# 🌟 **Replix AI – Virtual Try-On Web App**

**Upload Your Photo + A Dress Photo → Get AI-Generated Try-On Results**

Replix AI is a **React + Node.js powered virtual try-on application** that allows users to upload their own face photo along with a dress/model image, and generate an AI-enhanced output showing how they would look wearing the outfit.

This project integrates **multiple AI APIs** (NanoBanana, DeepAI, Replicate/HuggingFace optional), with a fallback **Canvas merge engine** to ensure results even without API keys.

---

# 🚀 **Features**

### 🔐 **Authentication**

* Local login & signup (email + password)
* Client-side user management
* Secure password hashing
* Session persistence

### 🖼 **Smart Image Upload System**

* Upload user face photo
* Upload dress/model photo
* Validates and previews images
* Clean UI for selecting images

### 🤖 **AI Engines Supported**

You can select different AI engines in the UI:

| Model                               | Requires API Key | Description                                 |
| ----------------------------------- | ---------------- | ------------------------------------------- |
| Canvas Merge (Free)                 | ❌                | Local face-overlay fallback (works offline) |
| NanoBanana API                      | ✔                | Real virtual try-on AI                      |
| DeepAI                              | ✔                | Image enhancement                           |
| Hugging Face (Optional)             | ✔                | Community ML models                         |
| Replicate API (Optional)            | ✔                | Diffusion-based try-on                      |
| Stability AI (Optional)             | ✔                | Image generation                            |
| AWS / GCP / Azure Vision (Optional) | ✔                | Advanced ML                                 |

### 🎨 **Canvas Fallback Engine**

If user has no API key for premium engines, the system:

* Detects the face
* Cuts and blends it on the model image
* Uses elliptical clipping + feather edges
* Generates a smooth merged result

### 🖥 **Backend Server (Node.js)**

Handles secure API calls for:

* NanoBanana Virtual Try-On
* DeepAI Image Upscale
  (Prevents exposing API keys in frontend)

### 📤 **Results Page**

* Displays AI-generated output
* Download button
* Share button
* Try another outfit button

---

# 📂 **Project Structure**

```
replix-ai/
│
├── src/
│   ├── App.js
│   ├── components/
│   ├── pages/
│   ├── assets/
│   └── ...
│
├── server/
│   ├── index.js      // Backend API integrations
│   └── package.json
│
├── package.json       // React dependencies
└── README.md
```

---

# ⚙️ **Tech Stack**

### **Frontend**

* React (CRA)
* React 18 + react-scripts 5.0.1
* Tailwind CSS
* lucide-react icons
* FileReader API for image preview
* Canvas 2D for fallback face merge

### **Backend**

* Node.js
* Express.js
* Axios
* CORS enabled
* Handles AI API requests securely

### **AI APIs**

* NanoBanana (Virtual Try-On)
* DeepAI (Enhancement)
* HuggingFace / Replicate (optional)
* Stability AI (optional)

---

# 🔧 **How to Install & Run the Project**

## 1️⃣ Clone this repository

```
git clone https://github.com/yourusername/replix-ai.git
cd replix-ai
```

---

# 🟦 **Frontend Setup (React)**

### Install dependencies:

```
npm install
```

### Start React development server:

```
npm start
```

App runs at:

```
http://localhost:3000
```

---

# 🟩 **Backend Setup (Node.js)**

### Go to backend folder:

```
cd server
```

### Install backend packages:

```
npm install
```

### Start backend server:

```
node index.js
```

Backend runs at:

```
http://localhost:5000
```

---

# 🔑 **API Keys Setup**

To use AI engines (NanoBanana, DeepAI, etc.):

1. Open the app
2. Choose "AI Model"
3. Click "Enter API Key"
4. Paste your API key

Keys are stored **locally on the browser**, not uploaded anywhere.

---

# 🧪 **Test the App**

1. Go to **Upload Page**
2. Upload:

   * A face photo
   * A dress/model photo
3. Select your AI engine
4. Click **Generate**
5. View final AI-generated try-on image

---

# 🛠 Full Backend API Endpoints

### POST `/api/nanobanana`

Body:

```json
{
  "userPhoto": "data:image/png;base64,....",
  "dressPhoto": "data:image/png;base64,...",
  "apiKey": "YOUR_KEY"
}
```

### POST `/api/deepai`

Body:

```json
{
  "userPhoto": "data:image/png;base64,...",
  "apiKey": "YOUR_KEY"
}
```

---

# 🧩 **Why Backend is Needed**

AI providers block:

* Browser requests
* Base64 uploads
* Secret API keys

So the backend:
✔ Avoids CORS issues
✔ Hides API keys
✔ Handles file requests
✔ Provides secure endpoints

---

# 📸 **Screenshots** *(Add your own)*

```
[ Add: Upload Page Screenshot ]
[ Add: AI Model Dropdown Screenshot ]
[ Add: Generated Output Screenshot ]
```

---

# 🧭 **Roadmap**

* [ ] Add Replicate SDXL virtual try-on
* [ ] Add HuggingFace try-on models
* [ ] Add Cloudinary upload support
* [ ] Add real account system (Firebase Auth)
* [ ] Add user history & gallery
* [ ] Deploy Backend on Render
* [ ] Deploy React App on Vercel

---

# 🤝 **Contributing**

Contributions are welcome!
Feel free to submit pull requests or fork the repo.

---

# 📝 **License**

This project is licensed under the **MIT License**.

---

# ⭐ **If you like this project — please Star the repo!**

Your support motivates further development.

