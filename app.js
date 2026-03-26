// Supabase Configuration - YOUR ACTUAL CREDENTIALS
const SUPABASE_URL = 'https://kuopksuayithapkgsnps.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_eJvdtRzxW83rVOqosf3sYg_kwQBROfw';
const BACKEND_URL = 'https://your-backend.onrender.com'; // Replace with your actual backend URL

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    // Initialize Supabase
    let supabase;
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase initialized');
    } catch (error) {
        console.error('Supabase init error:', error);
        alert('Failed to connect to database');
        return;
    }
    
    // Global state
    let currentUser = null;
    let userPlan = 'free';
    let currentOutput = '';
    
    // Helper function to safely get elements
    function getElement(id) {
        const el = document.getElementById(id);
        if (!el) console.warn(`Element not found: ${id}`);
        return el;
    }
    
    // DOM Elements with safe checking
    const elements = {
        sidebar: getElement('sidebar'),
        mobileMenuToggle: getElement('mobileMenuToggle'),
        authSection: getElement('authSection'),
        generateView: getElement('generateView'),
        historyView: getElement('historyView'),
        pricingView: getElement('pricingView'),
        settingsView: getElement('settingsView'),
        loginCard: getElement('loginCard'),
        signupCard: getElement('signupCard'),
        loginForm: getElement('loginForm'),
        signupForm: getElement('signupForm'),
        generateBtn: getElement('generateBtn'),
        projectInput: getElement('projectInput'),
        softwareType: getElement('softwareType'),
        voiceInputBtn: getElement('voiceInputBtn'),
        fileUploadBtn: getElement('fileUploadBtn'),
        txtFileInput: getElement('txtFileInput'),
        outputContent: getElement('outputContent'),
        outputButtons: getElement('outputButtons'),
        copyOutputBtn: getElement('copyOutputBtn'),
        downloadOutputBtn: getElement('downloadOutputBtn'),
        historyList: getElement('historyList'),
        settingsPlan: getElement('settingsPlan'),
        settingsEmail: getElement('settingsEmail'),
        changePasswordBtn: getElement('changePasswordBtn'),
        newPassword: getElement('newPassword'),
        logoutBtn: getElement('logoutBtn'),
        settingsLogoutBtn: getElement('settingsLogoutBtn'),
        settingsUpgradeBtn: getElement('settingsUpgradeBtn'),
        planIndicator: getElement('planIndicator')
    };
    
    // Create toast container if not exists
    let toastContainer = getElement('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Toast function
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        
        if (type === 'error') toast.style.background = '#ef4444';
        else if (type === 'success') toast.style.background = '#22c55e';
        else toast.style.background = '#6366f1';
        
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
    
    // Auth Functions
    async function signUp(name, email, password) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: name, plan: 'free' }
                }
            });
            
            if (error) throw error;
            
            if (data.user) {
                try {
                    await supabase
                        .from('users')
                        .insert([{ 
                            id: data.user.id, 
                            email, 
                            full_name: name, 
                            plan: 'free',
                            created_at: new Date().toISOString()
                        }]);
                } catch (dbError) {
                    console.log('User may already exist:', dbError);
                }
            }
            
            showToast('Account created! Please check your email.', 'success');
            return data;
        } catch (error) {
            showToast('Signup failed: ' + error.message, 'error');
            throw error;
        }
    }
    
    async function login(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
            showToast('Login successful!', 'success');
            return data;
        } catch (error) {
            showToast('Login failed: ' + error.message, 'error');
            throw error;
        }
    }
    
    async function logout() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            showToast('Logged out successfully', 'success');
        } catch (error) {
            showToast('Logout failed: ' + error.message, 'error');
        }
    }
    
    async function changePassword(newPassword) {
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });
            if (error) throw error;
            showToast('Password updated successfully!', 'success');
        } catch (error) {
            showToast('Failed to update password: ' + error.message, 'error');
            throw error;
        }
    }
    
    // Load user profile
    async function loadUserProfile() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) throw error;
            
            if (user) {
                currentUser = user;
                
                // Get user plan
                try {
                    const { data } = await supabase
                        .from('users')
                        .select('plan')
                        .eq('id', user.id)
                        .single();
                    
                    userPlan = data?.plan || 'free';
                } catch (err) {
                    userPlan = 'free';
                }
                
                // Update UI
                const sidebarUserName = getElement('sidebarUserName');
                if (sidebarUserName) {
                    sidebarUserName.textContent = user.user_metadata?.full_name || user.email;
                }
                
                if (elements.settingsEmail) elements.settingsEmail.textContent = user.email;
                if (elements.settingsPlan) elements.settingsPlan.textContent = userPlan === 'free' ? 'Free' : 'Pro';
                
                if (elements.planIndicator) {
                    elements.planIndicator.innerHTML = userPlan === 'free' 
                        ? '<i class="fas fa-star"></i> Free Plan - 500 char limit' 
                        : '<i class="fas fa-crown"></i> Pro Plan - Unlimited';
                }
                
                // Update input limit
                if (elements.projectInput) {
                    if (userPlan === 'free') {
                        elements.projectInput.maxLength = 500;
                        elements.projectInput.placeholder = 'Free plan: 500 character limit. Upgrade for unlimited!';
                    } else {
                        elements.projectInput.maxLength = -1;
                        elements.projectInput.placeholder = 'Pro plan: Unlimited characters. Describe your project!';
                    }
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }
    
    // Generate AI Project
    async function generateProject() {
        if (!elements.projectInput || !elements.softwareType) {
            showToast('Form not ready', 'error');
            return;
        }
        
        const inputText = elements.projectInput.value.trim();
        const softwareType = elements.softwareType.value;
        
        if (!inputText) {
            showToast('Please enter a project description', 'error');
            return;
        }
        
        if (userPlan === 'free' && inputText.length > 500) {
            showToast('Free plan limited to 500 characters. Upgrade to Pro!', 'error');
            return;
        }
        
        if (!elements.outputContent) return;
        
        // Show loading
        elements.outputContent.innerHTML = '<div style="text-align:center;padding:2rem;">Generating... <i class="fas fa-spinner fa-spin"></i></div>';
        
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            
            const response = await fetch(`${BACKEND_URL}/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    input: inputText,
                    softwareType: softwareType,
                    userId: currentUser?.id
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Generation failed');
            }
            
            const data = await response.json();
            currentOutput = data.result;
            
            elements.outputContent.innerHTML = `<div style="line-height:1.6;">${data.result.replace(/\n/g, '<br>')}</div>`;
            if (elements.outputButtons) elements.outputButtons.classList.remove('hidden');
            
            // Save to database
            if (currentUser) {
                try {
                    await supabase.from('projects').insert([{
                        user_id: currentUser.id,
                        input_text: inputText,
                        ai_result: data.result,
                        software_type: softwareType,
                        created_at: new Date().toISOString()
                    }]);
                } catch (err) {
                    console.log('Save error:', err);
                }
            }
            
            showToast('Project generated successfully!', 'success');
        } catch (error) {
            console.error('Generation error:', error);
            elements.outputContent.innerHTML = '<p style="text-align:center;color:#999;">❌ Failed to generate. Please try again.</p>';
            showToast('Generation failed: ' + error.message, 'error');
        }
    }
    
    // Load History
    async function loadHistory() {
        if (!elements.historyList) return;
        
        if (!currentUser) {
            elements.historyList.innerHTML = '<p style="text-align:center;">Please login to view history</p>';
            return;
        }
        
        elements.historyList.innerHTML = '<div style="text-align:center;padding:2rem;">Loading...</div>';
        
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            if (!data || data.length === 0) {
                elements.historyList.innerHTML = '<p style="text-align:center;">No projects yet. Start generating!</p>';
                return;
            }
            
            elements.historyList.innerHTML = data.map(project => `
                <div style="background:rgba(255,255,255,0.05);padding:1rem;margin-bottom:1rem;border-radius:0.5rem;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;">
                        <strong>${escapeHtml(project.software_type)}</strong>
                        <small>${new Date(project.created_at).toLocaleString()}</small>
                    </div>
                    <div><strong>Input:</strong> ${escapeHtml(project.input_text.substring(0, 100))}${project.input_text.length > 100 ? '...' : ''}</div>
                    <div style="margin-top:0.5rem;"><strong>Output:</strong> ${escapeHtml(project.ai_result.substring(0, 150))}${project.ai_result.length > 150 ? '...' : ''}</div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading history:', error);
            elements.historyList.innerHTML = '<p style="text-align:center;">Error loading history</p>';
        }
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Voice Input
    function initVoiceInput() {
        if (!('webkitSpeechRecognition' in window)) {
            showToast('Voice input not supported', 'error');
            return;
        }
        
        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'en-US';
        recognition.onstart = () => showToast('Listening... Speak now', 'info');
        recognition.onresult = (event) => {
            if (elements.projectInput) {
                elements.projectInput.value = event.results[0][0].transcript;
                showToast('Voice input added!', 'success');
            }
        };
        recognition.onerror = () => showToast('Voice recognition failed', 'error');
        recognition.start();
    }
    
    // File Upload
    function handleFileUpload(file) {
        if (!file) return;
        if (file.type !== 'text/plain') {
            showToast('Please upload a .txt file', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            if (elements.projectInput) elements.projectInput.value = e.target.result;
            showToast('File loaded!', 'success');
        };
        reader.onerror = () => showToast('Failed to read file', 'error');
        reader.readAsText(file);
    }
    
    // Copy to Clipboard
    function copyToClipboard() {
        if (!currentOutput) {
            showToast('Nothing to copy', 'error');
            return;
        }
        navigator.clipboard.writeText(currentOutput);
        showToast('Copied to clipboard!', 'success');
    }
    
    // Download as Text
    function downloadAsText() {
        if (!currentOutput) {
            showToast('Nothing to download', 'error');
            return;
        }
        const blob = new Blob([currentOutput], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ai-generated-project.txt';
        a.click();
        URL.revokeObjectURL(url);
        showToast('Downloaded!', 'success');
    }
    
    // Show View
    function showView(viewName) {
        // Hide all views
        if (elements.authSection) elements.authSection.classList.add('hidden');
        if (elements.generateView) elements.generateView.classList.add('hidden');
        if (elements.historyView) elements.historyView.classList.add('hidden');
        if (elements.pricingView) elements.pricingView.classList.add('hidden');
        if (elements.settingsView) elements.settingsView.classList.add('hidden');
        
        // Show selected view
        if (viewName === 'generate' && elements.generateView) {
            elements.generateView.classList.remove('hidden');
        } else if (viewName === 'history' && elements.historyView) {
            elements.historyView.classList.remove('hidden');
            loadHistory();
        } else if (viewName === 'pricing' && elements.pricingView) {
            elements.pricingView.classList.remove('hidden');
        } else if (viewName === 'settings' && elements.settingsView) {
            elements.settingsView.classList.remove('hidden');
        }
        
        // Update active nav
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`[data-view="${viewName}"]`);
        if (activeBtn) activeBtn.classList.add('active');
    }
    
    // Auth State Listener - FIXED VERSION
    supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth event:', event);
        
        if (event === 'SIGNED_IN') {
            await loadUserProfile();
            
            // Hide auth section and show dashboard
            if (elements.authSection) elements.authSection.classList.add('hidden');
            showView('generate');
            
            // Update header buttons
            const loginBtn = getElement('loginHeaderBtn');
            const signupBtn = getElement('signupHeaderBtn');
            const profileIcon = getElement('profileIcon');
            
            if (loginBtn) loginBtn.classList.add('hidden');
            if (signupBtn) signupBtn.classList.add('hidden');
            if (profileIcon) profileIcon.classList.remove('hidden');
            
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            
            // Show auth section
            if (elements.authSection) elements.authSection.classList.remove('hidden');
            if (elements.loginCard) elements.loginCard.classList.remove('hidden');
            if (elements.signupCard) elements.signupCard.classList.add('hidden');
            
            // Update header buttons
            const loginBtn = getElement('loginHeaderBtn');
            const signupBtn = getElement('signupHeaderBtn');
            const profileIcon = getElement('profileIcon');
            
            if (loginBtn) loginBtn.classList.remove('hidden');
            if (signupBtn) signupBtn.classList.remove('hidden');
            if (profileIcon) profileIcon.classList.add('hidden');
        }
    });
    
    // Event Listeners with safety checks
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = getElement('loginEmail')?.value;
            const password = getElement('loginPassword')?.value;
            if (email && password) await login(email, password);
        });
    }
    
    if (elements.signupForm) {
        elements.signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = getElement('signupName')?.value;
            const email = getElement('signupEmail')?.value;
            const password = getElement('signupPassword')?.value;
            if (name && email && password) await signUp(name, email, password);
        });
    }
    
    if (elements.generateBtn) elements.generateBtn.addEventListener('click', generateProject);
    if (elements.voiceInputBtn) elements.voiceInputBtn.addEventListener('click', initVoiceInput);
    if (elements.copyOutputBtn) elements.copyOutputBtn.addEventListener('click', copyToClipboard);
    if (elements.downloadOutputBtn) elements.downloadOutputBtn.addEventListener('click', downloadAsText);
    
    if (elements.fileUploadBtn && elements.txtFileInput) {
        elements.fileUploadBtn.addEventListener('click', () => elements.txtFileInput.click());
        elements.txtFileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) handleFileUpload(e.target.files[0]);
        });
    }
    
    if (elements.logoutBtn) elements.logoutBtn.addEventListener('click', logout);
    if (elements.settingsLogoutBtn) elements.settingsLogoutBtn.addEventListener('click', logout);
    
    if (elements.changePasswordBtn && elements.newPassword) {
        elements.changePasswordBtn.addEventListener('click', async () => {
            const newPassword = elements.newPassword.value;
            if (newPassword.length < 6) {
                showToast('Password must be at least 6 characters', 'error');
                return;
            }
            await changePassword(newPassword);
            elements.newPassword.value = '';
        });
    }
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            if (view) showView(view);
        });
    });
    
    // Auth navigation links
    const showSignupLink = getElement('showSignupLink');
    const showLoginLink = getElement('showLoginLink');
    
    if (showSignupLink && elements.loginCard && elements.signupCard) {
        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            elements.loginCard.classList.add('hidden');
            elements.signupCard.classList.remove('hidden');
        });
    }
    
    if (showLoginLink && elements.loginCard && elements.signupCard) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            elements.signupCard.classList.add('hidden');
            elements.loginCard.classList.remove('hidden');
        });
    }
    
    // Header buttons
    const pricingHeaderBtn = getElement('pricingHeaderBtn');
    const loginHeaderBtn = getElement('loginHeaderBtn');
    const signupHeaderBtn = getElement('signupHeaderBtn');
    
    if (pricingHeaderBtn) {
        pricingHeaderBtn.addEventListener('click', () => {
            if (currentUser) showView('pricing');
            else showToast('Please login first', 'error');
        });
    }
    
    if (loginHeaderBtn) {
        loginHeaderBtn.addEventListener('click', () => {
            if (elements.authSection) elements.authSection.classList.remove('hidden');
            if (elements.loginCard) elements.loginCard.classList.remove('hidden');
            if (elements.signupCard) elements.signupCard.classList.add('hidden');
        });
    }
    
    if (signupHeaderBtn) {
        signupHeaderBtn.addEventListener('click', () => {
            if (elements.authSection) elements.authSection.classList.remove('hidden');
            if (elements.signupCard) elements.signupCard.classList.remove('hidden');
            if (elements.loginCard) elements.loginCard.classList.add('hidden');
        });
    }
    
    if (elements.settingsUpgradeBtn) {
        elements.settingsUpgradeBtn.addEventListener('click', () => showView('pricing'));
    }
    
    // Mobile menu
    if (elements.mobileMenuToggle && elements.sidebar) {
        elements.mobileMenuToggle.addEventListener('click', () => {
            elements.sidebar.classList.toggle('active');
        });
    }
    
    // Check existing session on load - FIXED VERSION
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            console.log('User already logged in');
            loadUserProfile().then(() => {
                if (elements.authSection) elements.authSection.classList.add('hidden');
                showView('generate');
            });
        } else {
            console.log('No active session');
            if (elements.authSection) elements.authSection.classList.remove('hidden');
        }
    }).catch(error => {
        console.error('Session check error:', error);
    });
    
    console.log('App initialized successfully');
});