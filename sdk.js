function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (char) {
    const random = Math.random() * 16 | 0; // Generate a random number between 0 and 15
    const value = char === 'x' ? random : (random & 0x3 | 0x8); 
    return value.toString(16); 
  });
}

function getID() { 
  let uuid = localStorage.getItem('uuid');
  if (!uuid) {
    uuid = generateUUID();
    localStorage.setItem('uuid', uuid); 
  }
  return uuid;
}

// Helper function to validate email format using regex
function validateEmail(email) {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return regex.test(email);
}

// Helper function to validate password (at least 6 characters)
function validatePassword(password) {
  return password && password.length >= 6; // Change to >= 6 if that's the requirement
}

class AppDB {
  constructor(workerUrl, developerKey) {
    this.workerUrl = workerUrl;
    this.developerKey = developerKey;
  }

  // Helper function to log request details.
  logRequest(method, url, data) {
    console.log(`Sending ${method} request to ${url} with data:`, data);
  }

  // Method to handle sending requests with key validation
  sendRequest(action, key, data = null) {
    let url = this.workerUrl;
    if (key) url += `?key=${encodeURIComponent(key)}`;
  
    const fetchOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Developer-Key': this.developerKey,
      },
      ...(action !== 'GET' && { body: JSON.stringify({ action, key, data }) }),
    };
  
    // Skip the developer key validation for 'SETDEV' method
    if (action === 'SETDEV') {
      delete fetchOptions.headers['Developer-Key'];
    }
  
    return fetch(url, fetchOptions)
      .then((response) => {
        if (!response.ok) {
          return response.text().then((text) => {
            throw new Error(`Request failed: ${text}`);
          });
        }
        return response.json();
      })
      .then((data) => data)
      .catch((error) => {
        console.error('Error in sendRequest:', error);
        throw error;
      });
  }

  // Get authentication method
  getAuth() {
    const key = localStorage.getItem('userUuid');
    if (!key) {
      return Promise.reject(new Error('User not authenticated'));
    }

    return this.sendRequest('GETAUTH', key)
      .then((response) => {
        console.log('getAuth response:', response);
        return response;
      })
      .catch((error) => {
        console.error('Error in getAuth method:', error);
        throw error;
      });
  }

  // Set method
  async set(key, data) {
    if (!key || !data) {
      return Promise.reject(new Error('Key and data must be provided for set operation.'));
    }
    return this.sendRequest('SET', key, data);
  }
  
  // Create user method with validation
  async createUser(email, password) {
    if (!validateEmail(email)) {
      return Promise.reject(new Error('Invalid email format.'));
    }
    if (!validatePassword(password)) {
      return Promise.reject(new Error('Password must be more than 6 characters.'));
    }

    const key = getID();
    const userData = { email, password, uuid: key }; // Prepare user data with UUID
    return this.sendRequest('CREATEUSER', key, userData);
  }

  // SignIn method with validation
  async signIn(email, password) {
    if (!validateEmail(email)) {
      return Promise.reject(new Error('Invalid email format.'));
    }
    if (!validatePassword(password)) {
      return Promise.reject(new Error('Password must be more than 6 characters.'));
    }

    const key = localStorage.getItem('userUuid');
    if (!key) {
      return Promise.reject(new Error('User is not authenticated.'));
    }
    
    return this.sendRequest('SIGNIN', key, { email, password });
  }

  // SignOut method
  async signOut() {
    const key = localStorage.getItem('userUuid');
    if (!key) {
      return Promise.reject(new Error('User is not authenticated.'));
    }
    return this.sendRequest('SIGNOUT', key);
  }

  // Set developer method
  async setDev(key, data) {
    if (!key || !data) {
      return Promise.reject(new Error('Key and data must be provided for set operation.'));
    }
    return this.sendRequest('SETDEV', key, data);
  }

  // Get method
  get(key) {
    return this.sendRequest('GET', key)
      .then((response) => (response.message === 'No data found' ? null : response))
      .catch((error) => {
        console.error('Error in get method:', error);
        throw error;
      });
  }

  // Update method
  update(key, data) {
    if (!key) {
      return Promise.reject(new Error('Key must be provided for update operation.'));
    }
    return this.sendRequest('PUT', key, data);
  }

  // Remove method
  remove(key) {
    if (!key) {
      return Promise.reject(new Error('Key must be provided for remove operation.'));
    }
    return this.sendRequest('DELETE', key);
  }
}

// Function to initialize the AppDB instance
function getApp(developerKey) {
  return new AppDB('https://lym-dev.github.io/express-main/server.js', developerKey);
}

// Export getApp function
export { getApp };