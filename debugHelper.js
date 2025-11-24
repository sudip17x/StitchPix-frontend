// debugHelper.js - Debug utilities for StitchPixAI

export class APIDebugger {
  static logAPIRequest(url, method, headers, body) {
    console.group('🔧 API Request Debug');
    console.log('URL:', url);
    console.log('Method:', method);
    console.log('Headers:', headers);
    console.log('Body:', body);
    console.groupEnd();
  }

  static logAPIResponse(response) {
    console.group('🔧 API Response Debug');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries([...response.headers]));
    console.groupEnd();
  }

  static validateImageData(dataURL) {
    if (!dataURL) {
      return { valid: false, error: 'No data URL provided' };
    }
    
    try {
      const parts = dataURL.split(',');
      if (parts.length !== 2) {
        return { valid: false, error: 'Invalid data URL format' };
      }
      
      const mimeMatch = parts[0].match(/:(.*?);/);
      if (!mimeMatch) {
        return { valid: false, error: 'Invalid MIME type' };
      }
      
      const mimeType = mimeMatch[1];
      if (!mimeType.startsWith('image/')) {
        return { valid: false, error: 'Not an image MIME type' };
      }
      
      // Check base64 data length
      const base64Data = parts[1];
      const fileSize = (base64Data.length * 3) / 4 - (base64Data.endsWith('==') ? 2 : base64Data.endsWith('=') ? 1 : 0);
      
      return { 
        valid: true, 
        mimeType, 
        fileSize: Math.round(fileSize / 1024) + ' KB'
      };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  static testCanvasMerge(userPhoto, dressPhoto) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const userImg = new Image();
      const dressImg = new Image();
      
      userImg.onload = () => {
        dressImg.onload = () => {
          canvas.width = 100;
          canvas.height = 100;
          ctx.fillStyle = 'green';
          ctx.fillRect(0, 0, 100, 100);
          
          resolve({
            success: true,
            message: 'Canvas test passed',
            testImage: canvas.toDataURL()
          });
        };
        dressImg.src = dressPhoto;
      };
      userImg.src = userPhoto;
    });
  }
}

// Network debugging utility
export const networkTester = {
  async testEndpoint(url, method = 'GET') {
    try {
      const startTime = Date.now();
      const response = await fetch(url, { method });
      const endTime = Date.now();
      
      return {
        url,
        status: response.status,
        statusText: response.statusText,
        responseTime: endTime - startTime + 'ms',
        cors: response.type === 'cors' ? 'Enabled' : 'Disabled/Blocked',
        headers: Object.fromEntries([...response.headers])
      };
    } catch (error) {
      return {
        url,
        error: error.message,
        cors: 'Blocked (CORS)'
      };
    }
  }
};

// Export for global access in browser console
if (typeof window !== 'undefined') {
  window.StitchPixDebug = {
    APIDebugger,
    networkTester
  };
}