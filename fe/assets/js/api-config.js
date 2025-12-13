// API Configuration
const API_BASE_URL = window.location.origin + '/be';

const API_ENDPOINTS = {
    // Authentication
    LOGIN: `${API_BASE_URL}/auth/login.php`,
    REGISTER: `${API_BASE_URL}/auth/register.php`,
    LOGOUT: `${API_BASE_URL}/auth/logout.php`,
    CHECK_AUTH: `${API_BASE_URL}/auth/check.php`,
    
    // Campaigns
    GET_CAMPAIGNS: `${API_BASE_URL}/campaigns/list.php`,
    GET_CAMPAIGN: `${API_BASE_URL}/campaigns/get.php`,
    CREATE_CAMPAIGN: `${API_BASE_URL}/campaigns/create.php`,
    UPDATE_CAMPAIGN: `${API_BASE_URL}/campaigns/update.php`,
    DELETE_CAMPAIGN: `${API_BASE_URL}/campaigns/delete.php`,
    
    // Admin
    APPROVE_CAMPAIGN: `${API_BASE_URL}/admin/approve.php`,
    REJECT_CAMPAIGN: `${API_BASE_URL}/admin/reject.php`,
    GET_PENDING_CAMPAIGNS: `${API_BASE_URL}/admin/pending.php`,
    
    // Donations
    PROCESS_DONATION: `${API_BASE_URL}/donations/process.php`,
    GET_DONATIONS: `${API_BASE_URL}/donations/list.php`,
};

// API Helper Functions
async function apiRequest(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include' 
    };

    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(endpoint, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Request failed');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Session helper - check if backend session exists
async function checkSession() {
    try {
        const result = await apiRequest(API_ENDPOINTS.CHECK_AUTH);
        return result.user || null;
    } catch (error) {
        return null;
    }
}
