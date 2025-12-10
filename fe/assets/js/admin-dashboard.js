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

const originalLoadAdminDashboard = window.loadAdminDashboard;
window.loadAdminDashboard = function() {
    const campaigns = JSON.parse(localStorage.getItem('campaigns')) || [];
    const listEl = document.getElementById('adminCampaignList');
    
    const pending = campaigns.filter(c => c.status === 'pending').length;
    const verified = campaigns.filter(c => c.status === 'verified').length;
    const rejected = campaigns.filter(c => c.status === 'rejected').length;
    
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('verifiedCount').textContent = verified;
    document.getElementById('rejectedCount').textContent = rejected;
    
    let filteredCampaigns = campaigns;
    if (currentFilter === 'verified') {
        filteredCampaigns = campaigns.filter(c => c.status === 'verified');
    } else if (currentFilter === 'rejected') {
        filteredCampaigns = campaigns.filter(c => c.status === 'rejected');
    } else {
        filteredCampaigns = campaigns.filter(c => c.status === 'pending');
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
    
    listEl.innerHTML = filteredCampaigns.map(c => `
        <div class="campaign-item">
            <div class="campaign-image" style="background: ${c.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};"></div>
            <div style="flex: 1;">
                <span class="campaign-badge ${c.status}">${c.status === 'pending' ? 'Pending' : c.status === 'verified' ? 'Verified' : 'Rejected'}</span>
                <h5 class="campaign-title">${c.title}</h5>
                <p class="campaign-desc">${c.desc || 'No description provided'}</p>
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
                        <span class="meta-value">${c.contact || 'contact@fundflow.org'}</span>
                    </div>
                </div>
                ${c.status === 'pending' ? `
                    <div class="campaign-actions">
                        <button class="btn-accept" onclick="approveCampaign(${c.id})">
                            <i class="bi bi-check-lg me-1"></i>Accept
                        </button>
                        <button class="btn-reject" onclick="rejectCampaign(${c.id})">
                            <i class="bi bi-x-lg me-1"></i>Reject
                        </button>
                    </div>
                ` : `
                    <span class="status-badge ${c.status}">
                        <i class="bi bi-${c.status === 'verified' ? 'check-circle-fill' : 'x-circle-fill'}"></i>
                        ${c.status === 'verified' ? 'Approved' : 'Declined'}
                    </span>
                `}
            </div>
        </div>
    `).join('');
};

function approveCampaign(id) {
    if (confirm('Approve this campaign?')) {
        const campaigns = JSON.parse(localStorage.getItem('campaigns')) || [];
        const idx = campaigns.findIndex(c => c.id === id);
        if (idx !== -1) {
            campaigns[idx].status = 'verified';
            localStorage.setItem('campaigns', JSON.stringify(campaigns));
            loadAdminDashboard();
        }
    }
}

function rejectCampaign(id) {
    if (confirm('Reject this campaign?')) {
        const campaigns = JSON.parse(localStorage.getItem('campaigns')) || [];
        const idx = campaigns.findIndex(c => c.id === id);
        if (idx !== -1) {
            campaigns[idx].status = 'rejected';
            localStorage.setItem('campaigns', JSON.stringify(campaigns));
            loadAdminDashboard();
        }
    }
}
