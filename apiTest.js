// apiTest.js - Standalone API testing

export class APITester {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async testNanoBanana(userImageFile, dressImageFile) {
    const formData = new FormData();
    formData.append('person_image', userImageFile);
    formData.append('clothing_image', dressImageFile);
    formData.append('return_type', 'image');

    try {
      const response = await fetch('https://api.nanobanana.com/api/v1/virtual-try-on', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData
      });

      const result = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers]),
        ok: response.ok
      };

      if (response.ok) {
        result.data = await response.json();
      } else {
        result.error = await response.text();
      }

      return result;
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }

  async testDeepAI(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await fetch('https://api.deepai.org/api/torch-srgan', {
        method: 'POST',
        headers: {
          'api-key': this.apiKey
        },
        body: formData
      });

      const result = {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      };

      if (response.ok) {
        result.data = await response.json();
      } else {
        result.error = await response.text();
      }

      return result;
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }
}

// Usage example for browser console:
/*
const tester = new APITester('your-api-key');
const userFile = document.querySelector('input[type="file"]').files[0];
tester.testNanoBanana(userFile, userFile).then(console.log);
*/