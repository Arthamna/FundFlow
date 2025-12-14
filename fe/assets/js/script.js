/* assets/js/script.js */

// ---  AUTHENTICATION ---
const register = async (e) => {
    e.preventDefault();
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPass').value;
    const confirmPass = document.getElementById('regConfirmPass').value;
    const username = document.getElementById('regUsername').value;

    if (password !== confirmPass) {
        alert('Password tidak cocok!');
        return;
    }

    try {
        const result = await apiRequest(API_ENDPOINTS.REGISTER, 'POST', {
            email, password, username
        });
        
        if (!result.success) {
            alert('Email atau Password salah!');
            return;
        }

        const user = result.user;
        localStorage.setItem('currentUser', JSON.stringify(user));

        alert('Registrasi berhasil! Silakan login.');
        window.location.href = '../pages/login.html';
    } catch (error) {
        alert('Registrasi gagal: ' + error.message);
    }
};

const login = async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPass').value;
    
    try {
        const result = await apiRequest(API_ENDPOINTS.LOGIN, 'POST', {
            email, password
        });

        if (!result.success) {
            alert('Email atau Password salah!');
            return;
        }

        const user = result.user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        if (user.role === 'admin') {
            window.location.href = '../pages/admin-dashboard.html';
        } else {
            window.location.href = '../pages/user-dashboard.html';
        }
    } catch (error) {
        alert('Login gagal: ' + error.message);
    }
};

const logout = async () => {
    try {
        await apiRequest(API_ENDPOINTS.LOGOUT, 'POST');
        
        localStorage.removeItem('currentUser');
        window.location.href = '../pages/login.html';
    } catch (error) {
        console.error('Logout error:', error);
        localStorage.removeItem('currentUser');
        window.location.href = '../pages/login.html';
    }
};

const checkAuth = async (requiredRole = null) => {
    try {
        // pastikan pakai API yang sudah dipublish ke window
        const user = await (window.API && window.API.checkSession ? window.API.checkSession() : checkSession());
    
        if (!user) {
            window.location.href = '../pages/login.html';
            return null;
        }
        
        if (requiredRole && user.role !== requiredRole) {
            alert('Akses ditolak!');
            window.location.href = '../pages/login.html';
            return null;
        }
        
        return user;
    } catch (error) {
        window.location.href = '../pages/login.html';
        return null;
    }
};

// --- 2. HELPER FUNCTIONS ---
const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
};

// HELPERS 
const esc = s => String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));
// LOAD CAMPAIGNS (USER DASHBOARD)
const loadUserDashboard = async () => {
    const user = await checkAuth('user');
    if (!user) return; 

    const displayName = user.username || user.name || 'User';
    const nameEl = document.getElementById('userNameDisplay');
    if (nameEl) nameEl.innerText = `Hi, ${displayName}`;
    
    try {
        // HIT API untuk ambil campaigns dari database
        const response = await apiRequest(API_ENDPOINTS.GET_CAMPAIGNS, 'GET');
        const campaigns = response.data || [];
        // console.log('campaigns:', campaigns);
        // console.log('user:', user); // Debug: cek user object

        const verifiedContainer = document.getElementById('campaignList');
        const myContainer = document.getElementById('myCampaignList');

        // RESET myContainer saja (untuk status pengajuan)
        if (myContainer) myContainer.innerHTML = '';

        let hasMy = false;

        campaigns.forEach(c => {
            if (!c) return;

            const imageUrl = c.image_path ? `../${c.image_path}` : '../assets/images/donate-page.png';

            // Tampilkan di verified container (section Help Them!)
            if (c.status === 'Verified') {
                const percent = c.target ? (c.collected / c.target) * 100 : 0;
                const gradients = [
                    'linear-gradient(135deg, #FF6B9D 0%, #FFA07A 100%)',
                    'linear-gradient(135deg, #02A95C 0%, #6BCF9F 100%)',
                    'linear-gradient(135deg, #60D1F6 0%, #1FA2FF 100%)',
                    'linear-gradient(135deg, #FFD93D 0%, #FFB088 100%)',
                    'linear-gradient(135deg, #1FA2FF 0%, #A78BFA 100%)',
                    'linear-gradient(135deg, #6BCF9F 0%, #00D9C0 100%)'
                ];
                const randomGradient = gradients[c.id % gradients.length];

                if (verifiedContainer) verifiedContainer.innerHTML += `
                    <div class="col">
                        <div class="card campaign-card h-100 border-0 shadow-sm">
                            <div class="card-img-top" style="
                                height: 200px;
                                background: ${randomGradient}, url('${imageUrl}');
                                background-size: cover;
                                background-position: center;
                                background-blend-mode: overlay;
                            "></div>
                            <div class="card-body">
                                <h5 class="card-title fw-bold mb-2">${esc(c.title)}</h5>
                                <p class="card-text text-muted small mb-3">${esc((c.desc||'').substring(0, 80))}...</p>
                                <div class="progress mb-2" style="height: 8px;">
                                    <div class="progress-bar bg-primary" style="width: ${percent}%"></div>
                                </div>
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <small class="text-muted">${formatRupiah(c.collected)} raised</small>
                                    <small class="fw-bold text-primary">${Math.round(percent)}%</small>
                                </div>
                                <a href="donation-detail.html?id=${c.id}" class="btn btn-primary btn-sm w-100">
                                    <i class="bi bi-hand-thumbs-up me-1"></i>Donate
                                </a>
                            </div>
                        </div>
                    </div>
                `;
            }

            // Tampilkan campaign milik user (SEMUA STATUS: Pending/Rejected/Verified)
            // Perbaiki kondisi checking owner
            const isOwner = (c.owner === user.email) || 
                           (c.owner === user.username) || 
                           (c.owner_name === user.username);
            
            // console.log('Checking ownership:', {
            //     campaignOwner: c.owner,
            //     campaignOwnerName: c.owner_name,
            //     userEmail: user.email,
            //     userUsername: user.username,
            //     isOwner: isOwner
            // });

            if (isOwner) {
                hasMy = true;
                const badgeClass = c.status === 'Verified' ? 'bg-success' : (c.status === 'Pending' ? 'bg-warning' : 'bg-danger');
                if (myContainer) myContainer.innerHTML += `
                    <div class="d-flex align-items-center mb-3 p-3 bg-white rounded shadow-sm">
                        <img src="${imageUrl}" alt="${esc(c.title)}" style="width:100px;height:70px;object-fit:cover;border-radius:6px;">
                        <div class="ms-3 w-100">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <div class="fw-semibold">${esc(c.title)}</div>
                                    <div class="small text-muted">${esc((c.desc||'').substring(0,60))}...</div>
                                </div>
                                <span class="badge ${badgeClass} text-white">${esc(c.status)}</span>
                            </div>
                            <div class="small text-muted mt-1">Target: ${formatRupiah(c.target)}</div>
                        </div>
                    </div>
                `;
            }
        });

        if (myContainer && !hasMy) {
            myContainer.innerHTML = `<p class="text-muted">Belum ada pengajuan.</p>`;
        }
    } catch (error) {
        console.error('Error loading campaigns:', error);
        alert('Gagal memuat data campaign');
    }
};

const updateStatus = (id, status, notes = '') => {
    const campaigns = JSON.parse(localStorage.getItem('campaigns'));
    const index = campaigns.findIndex(c => c.id === id);
    if (index !== -1) {
        campaigns[index].status = status;
        campaigns[index].notes = notes;
        localStorage.setItem('campaigns', JSON.stringify(campaigns));
        loadAdminDashboard();
    }
};

const submitFundraise = async (e) => {
    e.preventDefault();
    
    // Ambil file dari input
    const fileInput = document.getElementById('fileUpload');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Mohon pilih gambar sampul!');
        return;
    }
    
    // Validasi tipe file
    if (!file.type.startsWith('image/')) {
        alert('File harus berupa gambar!');
        return;
    }
    
    // Validasi ukuran file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB!');
        return;
    }
    
    // Buat FormData untuk kirim file
    const formData = new FormData();
    formData.append('judul', document.getElementById('frTitle').value);
    formData.append('deskripsi', document.getElementById('frDesc').value);
    formData.append('target_dana', document.getElementById('frTarget').value);
    formData.append('image', file);
    
    try {
        const response = await fetch(API_ENDPOINTS.CREATE_CAMPAIGN, {
            method: 'POST',
            credentials: 'include',
            body: formData // Jangan set Content-Type, browser akan set otomatis
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Pengajuan berhasil! Menunggu persetujuan admin.');
            window.location.href = '../pages/user-dashboard.html';
        } else {
            alert('Gagal mengajukan donasi: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat mengajukan donasi.');
    }
};

// DONATION DETAIL PAGE
const loadDonationDetail = () => {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'));
    const campaigns = JSON.parse(localStorage.getItem('campaigns'));
    const campaign = campaigns.find(c => c.id === id);

    // if (!campaign) return window.location.href = '../pages/user-dashboard.html';

    // Update hero banner background
    const heroBanner = document.querySelector('.hero-banner');
    if (heroBanner && campaign.image) {
        heroBanner.style.backgroundImage = `linear-gradient(135deg, 
            rgba(2, 169, 92, 0.8) 0%, 
            rgba(0, 217, 192, 0.8) 50%,
            rgba(31, 162, 255, 0.7) 100%),
            url('${campaign.image}')`;
    }
    
    document.getElementById('detailTitle').innerText = campaign.title;
    document.getElementById('detailDesc').innerText = campaign.desc;
    
    const percent = Math.min((campaign.collected / campaign.target) * 100, 100);
    document.getElementById('detailProgress').style.width = `${percent}%`;
    document.getElementById('detailCollected').innerText = formatRupiah(campaign.collected);
    document.getElementById('detailTarget').innerText = formatRupiah(campaign.target);
};

// PROCESS DONATION 
window.processDonation = async () => {
    let amount = document.querySelector('input[name="nominal"]:checked')?.value;
    if (!amount) amount = document.getElementById('customNominal').value;
    
    if (!amount || parseInt(amount) <= 0) {
        alert('Pilih nominal donasi');
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'));

    try {
        // Call Xendit API untuk create Virtual Account (tidak blocking)
        await createXenditVirtualAccount(amount);
        
        // Redirect to payment page
        window.location.href = `../pages/payment.html?amount=${amount}&id=${id}`;
    } catch (error) {
        console.error('Xendit API error (non-blocking):', error);
        // Tetap redirect meskipun Xendit error
        window.location.href = `../pages/payment.html?amount=${amount}&id=${id}`;
    }
};

// XENDIT API INTEGRATION
const XENDIT_API_KEY = 'xnd_development_EujkzeRhF0i1WiZG9CqJF2lTYPC8ed9o7QRlzM48Hw1rvaDNFC6hcCvXvQ8Qm'; 

// Create Virtual Account di Xendit
async function createXenditVirtualAccount(amount) {
    try {
        const response = await fetch('https://api.xendit.co/callback_virtual_accounts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa(XENDIT_API_KEY + ':')
            },
            body: JSON.stringify({
                external_id: '502524',
                bank_code: 'BCA',
                name: 'Client'
            })
        });

        if (!response.ok) {
            console.warn('Xendit VA creation failed:', response.status);
            return null;
        }

        const data = await response.json();
        console.log('Xendit VA created:', data);
        return data;
    } catch (error) {
        console.error('Xendit VA creation error:', error);
        return null;
    }
}

// Simulate Payment di Xendit
async function simulateXenditPayment(amount) {
    try {
        const response = await fetch('https://api.xendit.co/callback_virtual_accounts/external_id=502524/simulate_payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa(XENDIT_API_KEY + ':')
            },
            body: JSON.stringify({
                amount: parseInt(amount)
            })
        });

        if (!response.ok) {
            console.warn('Xendit payment simulation failed:', response.status);
            return null;
        }

        const data = await response.json();
        console.log('Xendit payment simulated:', data);
        return data;
    } catch (error) {
        console.error('Xendit payment simulation error:', error);
        return null;
    }
}
