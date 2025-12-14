// Admin Dashboard JavaScript

let currentFilter = 'all';

function filterCampaigns(filter) {
    currentFilter = filter;
    
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    loadAdminDashboard();
}

// LOAD ADMIN DASHBOARD - DARI DATABASE
window.loadAdminDashboard = async function() {
    try {
        // HIT API untuk ambil campaigns dari database
        const response = await apiRequest(API_ENDPOINTS.GET_PENDING_CAMPAIGNS, 'GET');
        const campaigns = response.data || [];
        console.log(campaigns)
        
        const listEl = document.getElementById('adminCampaignList');
        
        // Hitung statistik
        const pending = campaigns.filter(c => c.status === 'Pending').length;
        const verified = campaigns.filter(c => c.status === 'Verified').length;
        const rejected = campaigns.filter(c => c.status === 'Rejected').length;
        
        document.getElementById('pendingCount').textContent = pending;
        document.getElementById('verifiedCount').textContent = verified;
        document.getElementById('rejectedCount').textContent = rejected;
        
        // Filter campaigns
        let filteredCampaigns = campaigns;
        if (currentFilter === 'verified') {
            filteredCampaigns = campaigns.filter(c => c.status === 'Verified');
        } else if (currentFilter === 'rejected') {
            filteredCampaigns = campaigns.filter(c => c.status === 'Rejected');
        } else {
            filteredCampaigns = campaigns.filter(c => c.status === 'Pending');
        }
        
        if (filteredCampaigns.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-inbox"></i>
                    <h5>No campaigns found</h5>
                    <p class="text-muted">There are no ${currentFilter === 'all' ? 'pending' : currentFilter} campaigns.</p>
                </div>
            `;
            return;
        }
        
        listEl.innerHTML = filteredCampaigns.map(c => {
            const imageUrl = c.image_path ? `../${c.image_path}` : '../assets/images/donate-page.png';
            
            return `
                <div class="campaign-item">
                    <div class="campaign-image" style="
                        background: url('${imageUrl}');
                        background-size: cover;
                        background-position: center;
                        background-blend-mode: overlay;
                    "></div>
                    <div style="flex: 1;">
                        <span class="campaign-badge ${c.status.toLowerCase()}">${c.status}</span>
                        <h5 class="campaign-title">${esc(c.title)}</h5>
                        <p class="campaign-desc">${esc(c.desc || 'No description provided')}</p>
                        <div class="campaign-meta">
                            <div class="meta-item">
                                <span class="meta-label">Target</span>
                                <span class="meta-value">${formatRupiah(c.target)}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Foundation</span>
                                <span class="meta-value">${c.foundation || 'Yayasan FundFlow'}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Contact</span>
                                <span class="meta-value">${c.contact || c.owner}</span>
                            </div>
                        </div>
                        ${c.status === 'Pending' ? `
                            <div class="campaign-actions">
                                <button class="btn-accept" onclick="approveCampaignAPI(${c.id})">
                                    <i class="bi bi-check-lg me-1"></i>Accept
                                </button>
                                <button class="btn-reject" onclick="rejectCampaignAPI(${c.id})">
                                    <i class="bi bi-x-lg me-1"></i>Reject
                                </button>
                            </div>
                        ` : `
                            <span class="status-badge ${c.status.toLowerCase()}">
                                <i class="bi bi-${c.status === 'Verified' ? 'check-circle-fill' : 'x-circle-fill'}"></i>
                                ${c.status === 'Verified' ? 'Approved' : 'Declined'}
                            </span>
                        `}
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        alert('Gagal memuat data campaign');
    }
};

// APPROVE CAMPAIGN - HIT API
async function approveCampaignAPI(id) {
    if (confirm('Approve this campaign?')) {
        try {
            await apiRequest(API_ENDPOINTS.APPROVE_CAMPAIGN, 'POST', { id_ajuan: id });
            alert('Campaign approved successfully!');
            loadAdminDashboard();
        } catch (error) {
            console.error('Error approving campaign:', error);
            alert('Failed to approve campaign');
        }
    }
}

// REJECT CAMPAIGN - HIT API
async function rejectCampaignAPI(id) {
    try {
        await apiRequest(API_ENDPOINTS.REJECT_CAMPAIGN, 'POST', { 
            id_ajuan: id, 
            reason: 'Rejected by admin' 
        });
        alert('Campaign rejected successfully!');
        loadAdminDashboard();
    } catch (error) {
        console.error('Error rejecting campaign:', error);
        alert('Failed to reject campaign');
    }
}