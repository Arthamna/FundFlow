
const API_BASE_URL = window.location.origin + '/fundflow/be';
// const API_BASE_URL = window.location.origin + '/be'; // // deployment

const API_ENDPOINTS = {
// Authentication
LOGIN: `${API_BASE_URL}/auth/login.php`,
REGISTER: `${API_BASE_URL}/auth/register.php`,
LOGOUT: `${API_BASE_URL}/auth/logout.php`,
CHECK_AUTH: `${API_BASE_URL}/auth/check.php`,

// Campaigns (ajuans)
GET_CAMPAIGNS: `${API_BASE_URL}/campaigns/list.php`,
GET_CAMPAIGN: `${API_BASE_URL}/campaigns/get.php`,       // expects ?id=
CREATE_CAMPAIGN: `${API_BASE_URL}/campaigns/create.php`,
UPDATE_CAMPAIGN: `${API_BASE_URL}/campaigns/update.php`,
DELETE_CAMPAIGN: `${API_BASE_URL}/campaigns/delete.php`,

// Admin
APPROVE_CAMPAIGN: `${API_BASE_URL}/admin/approve.php`,
REJECT_CAMPAIGN: `${API_BASE_URL}/admin/reject.php`,
GET_PENDING_CAMPAIGNS: `${API_BASE_URL}/admin/pending.php`,

// Donations / transactions
PROCESS_DONATION: `${API_BASE_URL}/donations/process.php`,
GET_DONATIONS: `${API_BASE_URL}/donations/list.php`,
};

// Generic fetch wrapper (uses credentials include so PHP session cookie terikut)
async function apiRequest(endpoint, method = 'GET', data = null, qs = null) {
  let url = endpoint;
  if (qs && typeof qs === 'object') {
    const params = new URLSearchParams(qs);
    url = `${endpoint}?${params.toString()}`;
  }

  const options = {
    method,
    mode: 'cors',
    credentials: 'include', // important: include session cookie from server
    headers: { 'Content-Type': 'application/json' },
  };

  if (data && method !== 'GET') options.body = JSON.stringify(data);

  const res = await fetch(url, options);
  let payload;
  try {
    payload = await res.json();
  } catch (e) {
    throw new Error('Invalid JSON response from server');
  }

  if (!res.ok) {
    // server bisa mengirim message dalam body
    const msg = (payload && payload.message) ? payload.message : 'Request failed';
    const err = new Error(msg);
    err.payload = payload;
    throw err;
  }
  return payload;
}

/* -----------------------
   Normalizers / mappers
   Map raw backend object -> frontend shape used in script.js
   frontend shape: {
     id, title, desc, target, collected, status, owner, notes, image
   }
   Backend DB field names (possible): id_ajuan, id_user_fk, judul, deskripsi,
   target_dana, terkumpul_dana, status, id_admin_fk
   ----------------------- */
function normalizeCampaign(raw) {
  if (!raw) return null;
  return {
    id: raw.id_ajuan ?? raw.id ?? raw.ID ?? null,
    title: raw.judul ?? raw.title ?? raw.nama ?? '',
    desc: raw.deskripsi ?? raw.desc ?? raw.description ?? '',
    target: Number(raw.target_dana ?? raw.target ?? raw.amount ?? 0),
    collected: Number(raw.terkumpul_dana ?? raw.collected ?? raw.terkumpul ?? 0),
    status: raw.status ?? 'Pending',
    owner: raw.owner_email ?? raw.email ?? raw.owner ?? raw.username ?? raw.id_user_fk ?? null,
    notes: raw.notes ?? raw.catatan ?? raw.reason ?? '',
    image: raw.image ?? raw.cover ?? raw.image_url ?? '',
  };
}

/* -----------------------
   Campaigns API helpers
   ----------------------- */
async function getCampaigns() {
  const res = await apiRequest(API_ENDPOINTS.GET_CAMPAIGNS, 'GET');
  // expect res.data or res.campaigns or res.items
  const list = res.data ?? res.campaigns ?? res.items ?? [];
  return list.map(normalizeCampaign);
}

async function getCampaignById(id) {
  const res = await apiRequest(API_ENDPOINTS.GET_CAMPAIGN, 'GET', null, { id });
  const item = (res.data && res.data[0]) ? res.data[0] : (res.data ?? res.campaign ?? null);
  return normalizeCampaign(item);
}

/**
 * createCampaign({ title, desc, target, image })
 * Backend expected payload names: judul, deskripsi, target_dana, image (optional)
 * Session should identify the user (credentials: include)
 */
async function createCampaign({ title, desc, target, image = '' }) {
  const payload = {
    judul: String(title),
    deskripsi: String(desc),
    target_dana: Number(target),
    image: image || ''
  };
  const res = await apiRequest(API_ENDPOINTS.CREATE_CAMPAIGN, 'POST', payload);
  // assume res.data is newly created row
  const raw = res.data ?? res.campaign ?? res.created ?? null;
  return normalizeCampaign(raw);
}

/**
 * updateCampaign(id, updates)
 * updates can contain: { title, desc, target, status, notes, image }
 * Backend mapping: judul, deskripsi, target_dana, status, notes
 */
async function updateCampaign(id, updates = {}) {
  const payload = { id_ajuan: id }; // primary key name used by DB
  if (updates.title !== undefined) payload.judul = updates.title;
  if (updates.desc  !== undefined) payload.deskripsi = updates.desc;
  if (updates.target !== undefined) payload.target_dana = Number(updates.target);
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  if (updates.image !== undefined) payload.image = updates.image;

  const res = await apiRequest(API_ENDPOINTS.UPDATE_CAMPAIGN, 'POST', payload);
  const raw = res.data ?? res.updated ?? null;
  return normalizeCampaign(raw);
}

async function deleteCampaign(id) {
  // many PHP endpoints expect POST with id
  const res = await apiRequest(API_ENDPOINTS.DELETE_CAMPAIGN, 'POST', { id_ajuan: id });
  return res; // expect { success: true }
}

/* -----------------------
   Admin actions
   ----------------------- */
async function getPendingCampaigns() {
  const res = await apiRequest(API_ENDPOINTS.GET_PENDING_CAMPAIGNS, 'GET');
  const list = res.data ?? res.pending ?? [];
  return list.map(normalizeCampaign);
}

async function approveCampaign(id) {
  // backend may expect id_ajuan
  const res = await apiRequest(API_ENDPOINTS.APPROVE_CAMPAIGN, 'POST', { id_ajuan: id });
  const raw = res.data ?? res.approved ?? null;
  return normalizeCampaign(raw);
}

async function rejectCampaign(id, reason = '') {
  const res = await apiRequest(API_ENDPOINTS.REJECT_CAMPAIGN, 'POST', { id_ajuan: id, reason });
  const raw = res.data ?? res.rejected ?? null;
  return normalizeCampaign(raw);
}

/* -----------------------
   Donations / transactions
   Backend DB fields: id_transaksi, id_ajuan_fk, id_user_fk, jumlah_donasi, tanggal_donasi, catatan
   ----------------------- */
async function processDonation({ campaignId, amount, note = '', anonymous = false }) {
  const payload = {
    id_ajuan_fk: campaignId,
    jumlah_donasi: Number(amount),
    catatan: String(note || ''),
    anonymous: anonymous ? 1 : 0
  };
  const res = await apiRequest(API_ENDPOINTS.PROCESS_DONATION, 'POST', payload);
  // res.data should contain created transaction
  return res.data ?? res.transaction ?? res.created ?? res;
}

async function getDonations({ campaignId = null, userId = null, limit = 100, page = 1 } = {}) {
  const qs = {};
  if (campaignId) qs.id_ajuan = campaignId;
  if (userId) qs.id_user = userId;
  qs.limit = limit;
  qs.page = page;

  const res = await apiRequest(API_ENDPOINTS.GET_DONATIONS, 'GET', null, qs);
  return res.data ?? res.donations ?? [];
}

/* -----------------------
   Export / expose for other modules
   ----------------------- */
window.API = {
  endpoints: API_ENDPOINTS,
  apiRequest,
  // auth helpers
  checkSession: async () => {
    try {
      const r = await apiRequest(API_ENDPOINTS.CHECK_AUTH, 'GET');
      return r.user ?? null;
    } catch (e) {
      return null;
    }
  },

  // campaigns
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,

  // admin
  getPendingCampaigns,
  approveCampaign,
  rejectCampaign,

  // donations
  processDonation,
  getDonations,
};