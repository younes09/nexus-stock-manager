const API_BASE = '/api-backend';

export const api = {
    async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Handle unauthorized (session expired)
                window.location.href = '/';
            }
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || `HTTP error! status: ${response.status}`);
        }

        return response.json();
    },

    // Auth
    auth: {
        login: (credentials: any) => api.request('/auth.php', { method: 'POST', body: JSON.stringify({ action: 'login', ...credentials }) }),
        session: () => api.request('/auth.php', { method: 'GET' }),
        logout: () => api.request('/auth.php', { method: 'DELETE' }),
    },

    // Products
    products: {
        get: () => api.request('/products.php'),
        create: (data: any) => api.request('/products.php', { method: 'POST', body: JSON.stringify(data) }),
        update: (data: any) => api.request('/products.php', { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) => api.request(`/products.php?id=${id}`, { method: 'DELETE' }),
    },

    // Categories
    categories: {
        get: () => api.request('/categories.php'),
        create: (data: any) => api.request('/categories.php', { method: 'POST', body: JSON.stringify(data) }),
        update: (data: any) => api.request('/categories.php', { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) => api.request(`/categories.php?id=${id}`, { method: 'DELETE' }),
    },

    // Entities
    entities: {
        get: () => api.request('/entities.php'),
        create: (data: any) => api.request('/entities.php', { method: 'POST', body: JSON.stringify(data) }),
        update: (data: any) => api.request('/entities.php', { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: string) => api.request(`/entities.php?id=${id}`, { method: 'DELETE' }),
    },

    // Invoices
    invoices: {
        get: (page?: number, limit?: number) => {
            let url = '/invoices.php';
            if (page && limit) {
                url += `?page=${page}&limit=${limit}`;
            }
            return api.request(url);
        },
        create: (data: any) => api.request('/invoices.php', { method: 'POST', body: JSON.stringify(data) }),
        update: (data: any) => api.request('/invoices.php', { method: 'PUT', body: JSON.stringify(data) }),
    },

    // Cash Transactions
    cash: {
        get: (page?: number, limit?: number) => {
            let url = '/cash_transactions.php';
            if (page && limit) {
                url += `?page=${page}&limit=${limit}`;
            }
            return api.request(url);
        },
        create: (data: any) => api.request('/cash_transactions.php', { method: 'POST', body: JSON.stringify(data) }),
        delete: (id: string) => api.request(`/cash_transactions.php?id=${id}`, { method: 'DELETE' }),
    }
};
