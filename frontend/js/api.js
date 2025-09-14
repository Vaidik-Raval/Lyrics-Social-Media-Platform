// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// API Client Class
class APIClient {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('authToken');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }

    // Get authentication headers
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Generic API request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            method: 'GET',
            headers: this.getHeaders(options.auth !== false),
            ...options,
        };

        // Add body if it's a POST/PUT/PATCH request
        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Authentication Methods
    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: userData,
            auth: false
        });
    }

    async login(credentials) {
        return this.request('/auth/login', {
            method: 'POST',
            body: credentials,
            auth: false
        });
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    async updateProfile(userData) {
        return this.request('/auth/profile', {
            method: 'PUT',
            body: userData
        });
    }

    async logout() {
        const result = await this.request('/auth/logout', {
            method: 'POST'
        });
        this.setToken(null);
        return result;
    }

    // Song Methods
    async getSongs(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/songs${queryString ? '?' + queryString : ''}`, { auth: false });
    }

    async getTrendingSongs(limit = 10) {
        return this.request(`/songs/trending?limit=${limit}`, { auth: false });
    }

    async getSong(id) {
        return this.request(`/songs/${id}`, { auth: false });
    }

    async createSong(songData) {
        return this.request('/songs', {
            method: 'POST',
            body: songData
        });
    }

    async updateSong(id, songData) {
        return this.request(`/songs/${id}`, {
            method: 'PUT',
            body: songData
        });
    }

    async deleteSong(id) {
        return this.request(`/songs/${id}`, {
            method: 'DELETE'
        });
    }

    async getSongStats(id) {
        return this.request(`/songs/${id}/stats`, { auth: false });
    }

    // Composition Methods
    async getCompositions(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/compositions${queryString ? '?' + queryString : ''}`, { auth: false });
    }

    async getFeaturedCompositions(limit = 10) {
        return this.request(`/compositions/featured?limit=${limit}`, { auth: false });
    }

    async getComposition(id) {
        return this.request(`/compositions/${id}`, { auth: false });
    }

    async createComposition(compositionData) {
        return this.request('/compositions', {
            method: 'POST',
            body: compositionData
        });
    }

    async updateComposition(id, compositionData) {
        return this.request(`/compositions/${id}`, {
            method: 'PUT',
            body: compositionData
        });
    }

    async deleteComposition(id) {
        return this.request(`/compositions/${id}`, {
            method: 'DELETE'
        });
    }

    async voteComposition(id, type) {
        return this.request(`/compositions/${id}/vote`, {
            method: 'POST',
            body: { type }
        });
    }

    async getCompositionVotes(id) {
        return this.request(`/compositions/${id}/votes`, { auth: false });
    }

    async getUserCompositions(userId, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/compositions/user/${userId}${queryString ? '?' + queryString : ''}`, { auth: false });
    }

    // User Methods
    async getUsers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/users${queryString ? '?' + queryString : ''}`, { auth: false });
    }

    async getUser(id) {
        return this.request(`/users/${id}`, { auth: false });
    }

    async getUserSongs(userId, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/users/${userId}/songs${queryString ? '?' + queryString : ''}`, { auth: false });
    }

    async getDashboard() {
        return this.request('/users/me/dashboard');
    }

    // Search Methods
    async search(query, type = 'all', params = {}) {
        const searchParams = { search: query, ...params };
        
        switch (type) {
            case 'songs':
                return this.getSongs(searchParams);
            case 'compositions':
                return this.getCompositions(searchParams);
            case 'users':
                return this.getUsers(searchParams);
            default:
                // Return combined results
                const [songs, compositions, users] = await Promise.all([
                    this.getSongs({ ...searchParams, limit: 5 }),
                    this.getCompositions({ ...searchParams, limit: 5 }),
                    this.getUsers({ ...searchParams, limit: 5 })
                ]);
                return { songs, compositions, users };
        }
    }

    // Health Check
    async healthCheck() {
        return this.request('/health', { auth: false });
    }
}

// Create global API instance
const api = new APIClient();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APIClient, api };
}
