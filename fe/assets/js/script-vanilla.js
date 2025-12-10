/* assets/js/script.js - Vanilla JS Ready for Backend Integration */

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
        // TODO: Backend Integration - Uncomment when backend is ready
        /*
        const result = await apiRequest(API_ENDPOINTS.REGISTER, 'POST', {
            email, password, username
        });
        */
        
        // TEMPORARY: localStorage fallback for development
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.find(u => u.email === email)) {
            alert('Email sudah terdaftar!');
            return;
        }

        users.push({ email, password, role: 'user', name: username });
        localStorage.setItem('users', JSON.stringify(users));
        
        alert('Registrasi berhasil! Silakan login.');
        window.location.href = 'login.html';
    } catch (error) {
        alert('Registrasi gagal: ' + error.message);
    }
};

const login = async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPass').value;
    
    try {
        // TODO: Backend Integration - Uncomment when backend is ready
        /*
        const result = await apiRequest(API_ENDPOINTS.LOGIN, 'POST', {
            email, password
        });
        const user = result.user;
        */
        
        // TEMPORARY: localStorage fallback for development
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            alert('Email atau Password salah!');
            return;
        }

        localStorage.setItem('currentUser', JSON.stringify(user));
        
        if (user.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'user-dashboard.html';
        }
    } catch (error) {
        alert('Login gagal: ' + error.message);
    }
};

const logout = async () => {
    try {
        // TODO: Backend Integration - Uncomment when backend is ready
        /*
        await apiRequest(API_ENDPOINTS.LOGOUT, 'POST');
        */
        
        // TEMPORARY: localStorage fallback for development
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
};

const checkAuth = async (requiredRole = null) => {
    try {
        // TODO: Backend Integration - Uncomment when backend is ready
        /*
        const user = await checkSession();
        */
        
        // TEMPORARY: localStorage fallback for development
        const user = JSON.parse(localStorage.getItem('currentUser'));
        
        if (!user) {
            window.location.href = 'login.html';
            return null;
        }
        
        if (requiredRole && user.role !== requiredRole) {
            alert('Akses ditolak!');
            window.location.href = 'login.html';
            return null;
        }
        
        return user;
    } catch (error) {
        window.location.href = 'login.html';
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

// --- 3. CAMPAIGNS ---
const loadUserDashboard = async () => {
    const user = await checkAuth('user');
    if (!user) return;
    
    document.getElementById('userNameDisplay').innerText = `Hi, ${user.name}`;
    
    try {
        // TODO: Backend Integration - Uncomment when backend is ready
        /*
        const result = await apiRequest(API_ENDPOINTS.GET_CAMPAIGNS);
        const campaigns = result.campaigns;
        */
        
        // TEMPORARY: localStorage fallback for development
        const campaigns = JSON.parse(localStorage.getItem('campaigns') || '[]');
        
        const verifiedContainer = document.getElementById('campaignList');
        const myContainer = document.getElementById('myCampaignList');

        if (verifiedContainer) verifiedContainer.innerHTML = '';
        if (myContainer) myContainer.innerHTML = '';

        campaigns.forEach(c => {
            // Display Verified Campaigns
            if (c.status === 'verified' && verifiedContainer) {
                const percent = (c.current / c.target) * 100;
                const gradient = c.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                
                verifiedContainer.innerHTML += `
                    <div class="col-md-4 mb-4">
                        <div class="card h-100">
                            <div class="card-img-top" style="height: 200px; background: ${gradient}; background-size: cover; background-position: center;"></div>
                            <div class="card-body">
                                <h5 class="card-title">${c.title}</h5>
                                <p class="card-text text-muted small">${c.desc.substring(0, 80)}...</p>
                                <div class="progress mb-2">
                                    <div class="progress-bar bg-primary" style="width: ${percent}%"></div>
                                </div>
                                <div class="d-flex justify-content-between small mb-3">
                                    <span>Terkumpul: ${formatRupiah(c.current || 0)}</span>
                                    <span>Target: ${formatRupiah(c.target)}</span>
                                </div>
                                <a href="donation-detail.html?id=${c.id}" class="btn btn-primary w-100">Detail</a>
                            </div>
                        </div>
                    </div>
                `;
            }

            // Display My Campaigns
            if (c.owner === user.email && myContainer) {
                let badgeClass = c.status === 'verified' ? 'bg-success' : 
                               c.status === 'pending' ? 'bg-warning' : 'bg-danger';
                
                myContainer.innerHTML += `
                    <div class="col-md-4 mb-4">
                        <div class="card h-100">
                            <div class="card-body">
                                <div class="badge ${badgeClass} mb-2">${c.status}</div>
                                <h6 class="card-title">${c.title}</h6>
                                <p class="small text-muted">Target: ${formatRupiah(c.target)}</p>
                            </div>
                        </div>
                    </div>
                `;
            }
        });
    } catch (error) {
        console.error('Error loading campaigns:', error);
        alert('Gagal memuat kampanye');
    }
};

const submitFundraise = async (e) => {
    e.preventDefault();
    const user = await checkAuth('user');
    if (!user) return;
    
    const title = document.getElementById('frTitle').value;
    const desc = document.getElementById('frDesc').value;
    const target = parseInt(document.getElementById('frTarget').value);
    
    try {
        // TODO: Backend Integration - Uncomment when backend is ready
        /*
        await apiRequest(API_ENDPOINTS.CREATE_CAMPAIGN, 'POST', {
            title, desc, target
        });
        */
        
        // TEMPORARY: localStorage fallback for development
        const campaigns = JSON.parse(localStorage.getItem('campaigns') || '[]');
        const newId = campaigns.length > 0 ? Math.max(...campaigns.map(c => c.id)) + 1 : 1;
        
        const newCampaign = {
            id: newId,
            title,
            desc,
            target,
            current: 0,
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            status: 'pending',
            owner: user.email
        };

        campaigns.push(newCampaign);
        localStorage.setItem('campaigns', JSON.stringify(campaigns));
        
        alert('Pengajuan berhasil! Menunggu persetujuan admin.');
        window.location.href = 'user-dashboard.html';
    } catch (error) {
        alert('Gagal mengajukan kampanye: ' + error.message);
    }
};

const loadDonationDetail = async () => {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'));
    
    if (!id) {
        window.location.href = 'user-dashboard.html';
        return;
    }
    
    try {
        // TODO: Backend Integration - Uncomment when backend is ready
        /*
        const result = await apiRequest(`${API_ENDPOINTS.GET_CAMPAIGN}?id=${id}`);
        const campaign = result.campaign;
        */
        
        // TEMPORARY: localStorage fallback for development
        const campaigns = JSON.parse(localStorage.getItem('campaigns') || '[]');
        const campaign = campaigns.find(c => c.id === id);

        if (!campaign) {
            window.location.href = 'user-dashboard.html';
            return;
        }

        // Update hero banner background
        const heroBanner = document.querySelector('.hero-banner');
        if (heroBanner) {
            heroBanner.style.backgroundImage = `linear-gradient(135deg, 
                rgba(2, 169, 92, 0.8) 0%, 
                rgba(0, 217, 192, 0.8) 50%,
                rgba(31, 162, 255, 0.7) 100%),
                url('https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=1600&h=400&fit=crop&q=80')`;
        }
        
        document.getElementById('detailTitle').innerText = campaign.title;
        document.getElementById('detailDesc').innerText = campaign.desc;
        
        const percent = Math.min((campaign.current / campaign.target) * 100, 100);
        document.getElementById('detailProgress').style.width = `${percent}%`;
        document.getElementById('detailCollected').innerText = formatRupiah(campaign.current || 0);
        document.getElementById('detailTarget').innerText = formatRupiah(campaign.target);

        // Handle Donate Logic
        window.processDonation = () => {
            let amount = document.querySelector('input[name="nominal"]:checked')?.value;
            if (!amount) amount = document.getElementById('customNominal')?.value;
            
            if (!amount) {
                alert('Pilih nominal donasi');
                return;
            }

            window.location.href = `payment.html?amount=${amount}&id=${id}`;
        };
    } catch (error) {
        console.error('Error loading campaign:', error);
        alert('Gagal memuat detail kampanye');
        window.location.href = 'user-dashboard.html';
    }
};

// --- 4. TEMPORARY DATA INITIALIZATION (DEVELOPMENT ONLY) ---
const initData = () => {
    if (!localStorage.getItem('users')) {
        const users = [
            { email: 'user@mail.com', password: '123', role: 'user', name: 'John Doe' },
            { email: 'admin@mail.com', password: '123', role: 'admin', name: 'Super Admin' }
        ];
        localStorage.setItem('users', JSON.stringify(users));
    }

    if (!localStorage.getItem('campaigns')) {
        const campaigns = [
            {
                id: 1,
                title: 'Bantu Korban Banjir',
                desc: 'Ribuan warga kehilangan tempat tinggal akibat banjir bandang.',
                target: 50000000,
                current: 30000000,
                gradient: 'linear-gradient(135deg, #FF6B9D 0%, #FFA07A 100%)',
                status: 'verified',
                owner: 'user@mail.com'
            },
            {
                id: 2,
                title: 'Pembangunan Sekolah Dasar',
                desc: 'Anak-anak di desa X membutuhkan ruang kelas yang layak.',
                target: 100000000,
                current: 15000000,
                gradient: 'linear-gradient(135deg, #02A95C 0%, #6BCF9F 100%)',
                status: 'pending',
                owner: 'user@mail.com'
            },
            {
                id: 3,
                title: 'Bantuan Untuk Yatim Piatu',
                desc: 'Membantu pendidikan dan kehidupan anak yatim piatu.',
                target: 75000000,
                current: 45000000,
                gradient: 'linear-gradient(135deg, #60D1F6 0%, #1FA2FF 100%)',
                status: 'verified',
                owner: 'user@mail.com'
            }
        ];
        localStorage.setItem('campaigns', JSON.stringify(campaigns));
    }
};

// Initialize development data
if (!window.location.hostname.includes('production')) {
    initData();
}
