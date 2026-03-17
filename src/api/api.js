// Versão simplificada que acabamos de testar
const API_URL = 'https://horus-backend-gzcp.onrender.com/api';

const api = {
  get: (url) => {
    const token = localStorage.getItem('token');
    return fetch(`${API_URL}${url}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json().then(data => ({ data }));
    });
  },
  
  post: (url, body) => {
    const token = localStorage.getItem('token');
    return fetch(`${API_URL}${url}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }).then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json().then(data => ({ data }));
    });
  },
  
  put: (url, body) => {
    const token = localStorage.getItem('token');
    return fetch(`${API_URL}${url}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }).then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json().then(data => ({ data }));
    });
  },
  
  delete: (url) => {
    const token = localStorage.getItem('token');
    return fetch(`${API_URL}${url}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json().then(data => ({ data }));
    });
  }
};

export default api;