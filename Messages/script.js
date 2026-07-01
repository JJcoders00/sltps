/**
 * School Messaging Portal - Mobile First Redesign
 */

document.addEventListener('DOMContentLoaded', () => {
    // State
    const state = {
        activeCategory: 'All',
        searchQuery: '',
        selectedTemplate: null,
        smartInputsEnabled: true,
        inputValues: {}, // Stores user input for placeholders
        isDarkMode: localStorage.getItem('theme') === 'dark' || 
                    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    };

    // DOM Elements
    const els = {
        searchInput: document.getElementById('searchInput'),
        categoryList: document.getElementById('categoryList'),
        templateList: document.getElementById('templateList'),
        resultCount: document.getElementById('resultCount'),
        emptyState: document.getElementById('emptyState'),
        themeToggleBtn: document.getElementById('themeToggleBtn'),
        smartToggleBtn: document.getElementById('smartToggleBtn'),
        themeColorMeta: document.getElementById('themeColorMeta'),
        
        // Modal
        editorModal: document.getElementById('editorModal'),
        closeModalBtn: document.getElementById('closeModalBtn'),
        modalTitle: document.getElementById('modalTitle'),
        dynamicForm: document.getElementById('dynamicForm'),
        livePreviewBox: document.getElementById('livePreviewBox'),
        copyBtn: document.getElementById('copyBtn'),
        toast: document.getElementById('toast')
    };

    // Init
    function init() {
        applyTheme();
        renderCategories();
        renderTemplateList();
        setupEvents();
    }

    function setupEvents() {
        // Search
        els.searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value.toLowerCase();
            renderTemplateList();
        });

        // Theme Toggle
        els.themeToggleBtn.addEventListener('click', () => {
            state.isDarkMode = !state.isDarkMode;
            localStorage.setItem('theme', state.isDarkMode ? 'dark' : 'light');
            applyTheme();
        });

        // Smart Inputs Toggle
        els.smartToggleBtn.addEventListener('click', () => {
            state.smartInputsEnabled = !state.smartInputsEnabled;
            updateSmartToggleUI();
            if (state.selectedTemplate) {
                renderEditor(state.selectedTemplate); // Re-render form types
            }
        });

        // Modal close
        els.closeModalBtn.addEventListener('click', closeEditor);

        // Copy button
        els.copyBtn.addEventListener('click', handleCopy);
    }

    // Processing
    function getCategories() {
        const cats = [...new Set(messageLibrary.map(m => m.category))];
        return ['All', ...cats];
    }

    function getFilteredTemplates() {
        let filtered = messageLibrary;
        if (state.activeCategory !== 'All') {
            filtered = filtered.filter(m => m.category === state.activeCategory);
        }
        if (state.searchQuery) {
            filtered = filtered.filter(m => 
                m.title.toLowerCase().includes(state.searchQuery) ||
                m.message.toLowerCase().includes(state.searchQuery)
            );
        }
        return filtered;
    }

    // UI Rendering
    function renderCategories() {
        const categories = getCategories();
        els.categoryList.innerHTML = '';

        categories.forEach(cat => {
            const li = document.createElement('li');
            li.className = `category-pill ${cat === state.activeCategory ? 'active' : ''}`;
            li.textContent = cat;
            
            li.addEventListener('click', () => {
                state.activeCategory = cat;
                els.searchInput.value = '';
                state.searchQuery = '';
                
                // Update active classes
                document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
                li.classList.add('active');
                
                // Scroll pill into view smoothly
                li.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                
                renderTemplateList();
            });
            
            els.categoryList.appendChild(li);
        });
    }

    function renderTemplateList() {
        const templates = getFilteredTemplates();
        els.templateList.innerHTML = '';
        els.resultCount.textContent = `${templates.length} template${templates.length !== 1 ? 's' : ''}`;

        if (templates.length === 0) {
            els.templateList.classList.add('hidden');
            els.emptyState.classList.remove('hidden');
            return;
        }

        els.templateList.classList.remove('hidden');
        els.emptyState.classList.add('hidden');

        templates.forEach((tmpl, index) => {
            const item = document.createElement('div');
            item.className = 'template-item';
            
            // Create a short preview without `{}`
            let shortPreview = tmpl.message.replace(/\{([^}]+)\}/g, '...').substring(0, 80) + '...';
            
            item.innerHTML = `
                <div class="item-category">${tmpl.category}</div>
                <div class="item-title">${tmpl.title}</div>
                <div class="item-preview">${shortPreview}</div>
            `;
            
            item.addEventListener('click', () => openEditor(tmpl));
            els.templateList.appendChild(item);
        });
    }

    // Editor Logic
    function openEditor(template) {
        state.selectedTemplate = template;
        state.inputValues = {}; // Reset values
        els.modalTitle.textContent = template.title;
        renderEditor(template);
        els.editorModal.classList.add('open');
        
        // Prevent body scroll behind modal
        document.body.style.overflow = 'hidden';
    }

    function closeEditor() {
        els.editorModal.classList.remove('open');
        state.selectedTemplate = null;
        document.body.style.overflow = '';
    }

    function extractPlaceholders(text) {
        const regex = /\{([^}]+)\}/g;
        const placeholders = new Set();
        let match;
        while ((match = regex.exec(text)) !== null) {
            placeholders.add(match[1]); // The name inside {}
        }
        return Array.from(placeholders);
    }

    function determineInputType(placeholderName) {
        if (!state.smartInputsEnabled) return 'text';
        
        const lowerName = placeholderName.toLowerCase();
        if (lowerName.includes('date')) return 'date';
        if (lowerName.includes('time')) return 'time';
        if (lowerName.includes('amount') || lowerName.includes('number')) return 'number';
        return 'text'; // Default
    }

    function renderEditor(template) {
        const placeholders = extractPlaceholders(template.message);
        els.dynamicForm.innerHTML = '';
        
        if (placeholders.length === 0) {
            els.dynamicForm.innerHTML = `<p class="no-inputs-msg">This template has no details to fill.</p>`;
        } else {
            placeholders.forEach(ph => {
                const group = document.createElement('div');
                group.className = 'input-group';
                
                const label = document.createElement('label');
                label.textContent = ph;
                
                const input = document.createElement('input');
                input.type = determineInputType(ph);
                input.placeholder = `Enter ${ph.toLowerCase()}...`;
                input.dataset.placeholder = ph;
                input.value = state.inputValues[ph] || '';
                
                input.addEventListener('input', (e) => {
                    state.inputValues[ph] = e.target.value;
                    updateLivePreview();
                });
                
                group.appendChild(label);
                group.appendChild(input);
                els.dynamicForm.appendChild(group);
            });
        }
        
        updateLivePreview();
    }

    function updateLivePreview() {
        if (!state.selectedTemplate) return;
        
        let previewHTML = state.selectedTemplate.message;
        
        // Replace `{Placeholder}` with either typed value or styled span
        previewHTML = previewHTML.replace(/\{([^}]+)\}/g, (match, p1) => {
            const val = state.inputValues[p1];
            if (val && val.trim() !== '') {
                // If it's a date and smart inputs are on, format it slightly better if possible
                // For now, raw value is fine
                return val;
            }
            return `<span class="preview-placeholder">${match}</span>`;
        });
        
        els.livePreviewBox.innerHTML = previewHTML;
    }

    // Action Logic
    async function handleCopy() {
        if (!state.selectedTemplate) return;
        
        // Generate raw text
        let finalText = state.selectedTemplate.message;
        finalText = finalText.replace(/\{([^}]+)\}/g, (match, p1) => {
            const val = state.inputValues[p1];
            return (val && val.trim() !== '') ? val : match; // Keep {Placeholder} if empty
        });

        try {
            await navigator.clipboard.writeText(finalText);
            
            // Button feedback
            const originalHTML = els.copyBtn.innerHTML;
            els.copyBtn.classList.add('success');
            els.copyBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Copied!</span>
            `;
            
            showToast();
            
            // If they copy successfully, we can close the modal automatically after a short delay
            setTimeout(() => {
                els.copyBtn.classList.remove('success');
                els.copyBtn.innerHTML = originalHTML;
                closeEditor();
            }, 1000);
            
        } catch (err) {
            console.error('Failed to copy', err);
            alert('Clipboard access denied. Please copy manually.');
        }
    }

    function showToast() {
        els.toast.classList.add('show');
        setTimeout(() => {
            els.toast.classList.remove('show');
        }, 3000);
    }

    // Theme & Toggles
    function applyTheme() {
        if (state.isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.querySelector('.moon-icon').classList.add('hidden');
            document.querySelector('.sun-icon').classList.remove('hidden');
            els.themeColorMeta.content = '#1C1C1E';
        } else {
            document.documentElement.removeAttribute('data-theme');
            document.querySelector('.sun-icon').classList.add('hidden');
            document.querySelector('.moon-icon').classList.remove('hidden');
            els.themeColorMeta.content = '#FFFFFF';
        }
    }
    
    function updateSmartToggleUI() {
        if (state.smartInputsEnabled) {
            document.querySelector('.smart-icon').classList.remove('hidden');
            document.querySelector('.normal-icon').classList.add('hidden');
            els.smartToggleBtn.classList.add('active-state');
        } else {
            document.querySelector('.smart-icon').classList.add('hidden');
            document.querySelector('.normal-icon').classList.remove('hidden');
            els.smartToggleBtn.classList.remove('active-state');
        }
    }
    
    // Setup initial smart UI state
    updateSmartToggleUI();
    init();
});
