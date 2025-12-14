/* assets/js/script.js */

// --- 1. AUTHENTICATION ---
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

// --- 4. PAGE LOGIC ---

// LOAD CAMPAIGNS (USER DASHBOARD)
const loadUserDashboard = async () => {
    const user = await checkAuth('user');
    if (!user) return; 

    const displayName = user.username || user.name || 'User';
    const nameEl = document.getElementById('userNameDisplay');
    if (nameEl) nameEl.innerText = `Hi, ${displayName}`;
    
    const campaigns = JSON.parse(localStorage.getItem('campaigns') || '[]');

    const verifiedContainer = document.getElementById('campaignList');
    const myContainer = document.getElementById('myCampaignList'); // Untuk status pending/rejected

    // if (verifiedContainer) verifiedContainer.innerHTML = '';
    if (myContainer) myContainer.innerHTML = '';

    campaigns.forEach(c => {
        if (!c) return;

        if (c.status === 'Verified') {
            const percent = (c.collected / c.target) * 100;
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
                <div class="col-md-4 mb-4">
                    <div class="card h-100">
                        <div class="card-img-top" style="height: 200px; background: ${randomGradient}, url('../assets/images/donate-page.png'); background-size: cover; background-position: center; background-blend-mode: overlay;"></div>
                        <div class="card-body">
                            <h5 class="card-title">${c.title}</h5>
                            <p class="card-text text-muted small">${(c.desc||'').substring(0, 80)}...</p>
                            <div class="progress mb-2">
                                <div class="progress-bar bg-primary" style="width: ${percent}%"></div>
                            </div>
                            <div class="d-flex justify-content-between small mb-3">
                                <span>Terkumpul: ${formatRupiah(c.collected)}</span>
                                <span class="text-end">Target: ${formatRupiah(c.target)}</span>
                            </div>
                            <a href="donation-detail.html?id=${c.id}" class="btn btn-primary w-100">Detail</a>
                        </div>
                    </div>
                </div>
            `;
        }

        if (c.owner === user.email || c.owner === user.username) {
            let badgeClass = c.status === 'Verified' ? 'bg-success' : (c.status === 'Pending' ? 'bg-warning' : 'bg-danger');
        }
    });
};


const loadAdminDashboard = () => {
    checkAuth('admin');
    const campaigns = JSON.parse(localStorage.getItem('campaigns'));
    const listContainer = document.getElementById('adminCampaignList');
    listContainer.innerHTML = '';

    campaigns.forEach(c => {
        let actionButtons = '';
        if (c.status === 'Pending') {
            actionButtons = `
                <button onclick="updateStatus(${c.id}, 'Verified')" class="btn btn-sm btn-success">Approve</button>
                <button onclick="updateStatus(${c.id}, 'Rejected')" class="btn btn-sm btn-danger">Reject</button>
            `;
        } else if (c.status === 'Rejected') {
            actionButtons = `<span class="text-muted small">Rejected</span>`;
        } else {
             actionButtons = `<span class="text-success small">Accepted</span>`;
        }

        listContainer.innerHTML += `
            <div class="card mb-3 p-3">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <img src="${c.image}" class="rounded me-3" width="80" height="60" style="object-fit:cover">
                        <div>
                            <h6 class="mb-1">${c.title}</h6>
                            <span class="badge ${c.status === 'Verified' ? 'bg-success' : (c.status === 'Pending' ? 'bg-warning' : 'bg-danger')}">${c.status}</span>
                            <small class="text-muted ms-2">Oleh: ${c.owner}</small>
                        </div>
                    </div>
                    <div>
                        ${actionButtons}
                    </div>
                </div>
            </div>
        `;
    });
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

const submitFundraise = (e) => {
    e.preventDefault();
    const user = checkAuth('user');
    
    const campaigns = JSON.parse(localStorage.getItem('campaigns'));
    const newId = campaigns.length > 0 ? campaigns[campaigns.length - 1].id + 1 : 1;
    // TO DO : Change to accept image in db
    const newCampaign = {
        id: newId,
        title: document.getElementById('frTitle').value,
        desc: document.getElementById('frDesc').value,
        target: parseInt(document.getElementById('frTarget').value),
        collected: 0,
        image: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', // Dummy image for now
        status: 'Pending',
        owner: user.email,
        notes: ''
    };

    campaigns.push(newCampaign);
    localStorage.setItem('campaigns', JSON.stringify(campaigns));
    alert('Pengajuan berhasil! Menunggu persetujuan admin.');
    window.location.href = 'user-dashboard.html';
};

// DONATION DETAIL PAGE
const loadDonationDetail = () => {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'));
    const campaigns = JSON.parse(localStorage.getItem('campaigns'));
    const campaign = campaigns.find(c => c.id === id);

    if (!campaign) return window.location.href = '../pages/user-dashboard.html';

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

    // Handle Donate Logic
    window.processDonation = () => {
        let amount = document.querySelector('input[name="nominal"]:checked')?.value;
        if (!amount) amount = document.getElementById('customNominal').value;
        
        if (!amount) return alert('Pilih nominal donasi');

        // Redirect to payment page with amount
        window.location.href = `../fe/payment.html?amount=${amount}&id=${id}`;
    };
};