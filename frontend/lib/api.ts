// API Client for HostMaster Backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class APIClient {
    private getToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('token');
    }

    private async request(endpoint: string, options: RequestInit = {}) {
        const token = this.getToken();
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        };

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return response.json();
    }

    // Auth
    async register(email: string, password: string, name: string) {
        return this.request('/api/v1/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name }),
        });
    }

    async login(email: string, password: string) {
        return this.request('/api/v1/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    // Resources
    async getResources() {
        return this.request('/api/v1/resources');
    }

    async scanAWS(awsAccessKey: string, awsSecretKey: string, region: string = 'us-east-1') {
        return this.request('/api/v1/resources/scan', {
            method: 'POST',
            body: JSON.stringify({ awsAccessKey, awsSecretKey, region }),
        });
    }

    // Costs
    async getCosts() {
        return this.request('/api/v1/costs');
    }

    // Recommendations
    async getRecommendations() {
        return this.request('/api/v1/recommendations');
    }

    async dismissRecommendation(id: string) {
        return this.request(`/api/v1/recommendations/${id}/dismiss`, {
            method: 'PATCH',
        });
    }

    async acceptRecommendation(id: string) {
        return this.request(`/api/v1/recommendations/${id}/accept`, {
            method: 'PATCH',
        });
    }

    // Alerts
    async getAlerts(unreadOnly: boolean = false) {
        const params = unreadOnly ? '?unreadOnly=true' : '';
        return this.request(`/api/v1/alerts${params}`);
    }

    async markAlertAsRead(id: string) {
        return this.request(`/api/v1/alerts/${id}/read`, {
            method: 'PATCH',
        });
    }

    async deleteAlert(id: string) {
        return this.request(`/api/v1/alerts/${id}`, {
            method: 'DELETE',
        });
    }

    // Health
    async getHealth() {
        return this.request('/health');
    }
}

export const api = new APIClient();
export default api;
