// Utility Functions

// DOM Utility Functions
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// Create element with attributes and children
function createElement(tag, attributes = {}, ...children) {
    const element = document.createElement(tag);
    
    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = dataValue;
            });
        } else if (key.startsWith('on') && typeof value === 'function') {
            element.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
            element.setAttribute(key, value);
        }
    });
    
    // Add children
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            element.appendChild(child);
        }
    });
    
    return element;
}

// Format date utility
function formatDate(date, options = {}) {
    const d = new Date(date);
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    return d.toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

// Format relative time (e.g., "2 hours ago")
function formatRelativeTime(date) {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };
    
    for (const [unit, seconds] of Object.entries(intervals)) {
        const interval = Math.floor(diffInSeconds / seconds);
        if (interval >= 1) {
            return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
        }
    }
    
    return 'Just now';
}

// Format numbers with commas
function formatNumber(number) {
    return new Intl.NumberFormat().format(number);
}

// Debounce function
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

// Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Deep clone object
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        Object.keys(obj).forEach(key => {
            clonedObj[key] = deepClone(obj[key]);
        });
        return clonedObj;
    }
}

// Generate unique ID
function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// Validate email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate password strength
function validatePassword(password) {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasNonalphas = /\W/.test(password);
    
    return {
        length: password.length >= minLength,
        uppercase: hasUpperCase,
        lowercase: hasLowerCase,
        numbers: hasNumbers,
        special: hasNonalphas,
        score: [
            password.length >= minLength,
            hasUpperCase,
            hasLowerCase,
            hasNumbers,
            hasNonalphas
        ].filter(Boolean).length
    };
}

// Sanitize HTML
function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

// Escape HTML
function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// Toast notification system
class ToastManager {
    constructor() {
        this.container = $('#toastContainer') || this.createContainer();
        this.toasts = new Map();
    }
    
    createContainer() {
        const container = createElement('div', {
            id: 'toastContainer',
            className: 'toast-container'
        });
        document.body.appendChild(container);
        return container;
    }
    
    show(message, type = 'info', duration = 5000) {
        const id = generateId();
        const toast = createElement('div', {
            className: `toast ${type}`,
            dataset: { id }
        });
        
        const content = createElement('div', { className: 'toast-content' });
        
        // Add icon based on type
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        const icon = createElement('i', { className: icons[type] || icons.info });
        const text = createElement('span', {}, message);
        const closeBtn = createElement('button', {
            className: 'toast-close',
            onclick: () => this.hide(id)
        }, '×');
        
        content.appendChild(icon);
        content.appendChild(text);
        toast.appendChild(content);
        toast.appendChild(closeBtn);
        
        this.container.appendChild(toast);
        this.toasts.set(id, toast);
        
        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        // Auto remove
        if (duration > 0) {
            setTimeout(() => this.hide(id), duration);
        }
        
        return id;
    }
    
    hide(id) {
        const toast = this.toasts.get(id);
        if (toast) {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
                this.toasts.delete(id);
            }, 300);
        }
    }
    
    success(message, duration) {
        return this.show(message, 'success', duration);
    }
    
    error(message, duration) {
        return this.show(message, 'error', duration);
    }
    
    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }
    
    info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// Create global toast instance
const toast = new ToastManager();

// Modal management
class ModalManager {
    constructor() {
        this.activeModals = new Set();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTopModal();
            }
        });
        
        // Close modal on backdrop click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.close(e.target.id);
            }
        });
    }
    
    open(modalId) {
        const modal = $(`#${modalId}`);
        if (modal) {
            modal.classList.add('show');
            this.activeModals.add(modalId);
            document.body.style.overflow = 'hidden';
        }
    }
    
    close(modalId) {
        const modal = $(`#${modalId}`);
        if (modal) {
            modal.classList.remove('show');
            this.activeModals.delete(modalId);
            if (this.activeModals.size === 0) {
                document.body.style.overflow = '';
            }
        }
    }
    
    closeTopModal() {
        const topModal = Array.from(this.activeModals).pop();
        if (topModal) {
            this.close(topModal);
        }
    }
    
    closeAll() {
        this.activeModals.forEach(modalId => this.close(modalId));
    }
}

// Create global modal instance
const modal = new ModalManager();

// Loading state management
class LoadingManager {
    constructor() {
        this.loadingStates = new Map();
    }
    
    show(target, text = 'Loading...') {
        const element = typeof target === 'string' ? $(target) : target;
        if (!element) return;
        
        const loadingId = generateId();
        const originalContent = element.innerHTML;
        
        const spinner = createElement('div', { className: 'loading-spinner' });
        const loadingText = createElement('span', {}, text);
        const loadingContainer = createElement('div', {
            className: 'loading-container',
            style: 'display: flex; align-items: center; gap: 0.5rem; justify-content: center;'
        }, spinner, loadingText);
        
        element.innerHTML = '';
        element.appendChild(loadingContainer);
        element.classList.add('loading');
        
        this.loadingStates.set(loadingId, {
            element,
            originalContent
        });
        
        return loadingId;
    }
    
    hide(loadingId) {
        const state = this.loadingStates.get(loadingId);
        if (state) {
            state.element.innerHTML = state.originalContent;
            state.element.classList.remove('loading');
            this.loadingStates.delete(loadingId);
        }
    }
}

// Create global loading instance
const loading = new LoadingManager();

// Form validation utilities
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    const errors = [];
    
    inputs.forEach(input => {
        const value = input.value.trim();
        const fieldName = input.getAttribute('placeholder') || input.name || 'Field';
        
        if (!value) {
            errors.push(`${fieldName} is required`);
            input.classList.add('error');
        } else {
            input.classList.remove('error');
            
            // Email validation
            if (input.type === 'email' && !isValidEmail(value)) {
                errors.push(`Please enter a valid email address`);
                input.classList.add('error');
            }
            
            // Password validation
            if (input.type === 'password' && value.length < 6) {
                errors.push(`Password must be at least 6 characters long`);
                input.classList.add('error');
            }
        }
    });
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

// Local storage utilities
const storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    },
    
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Failed to read from localStorage:', error);
            return defaultValue;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Failed to remove from localStorage:', error);
        }
    },
    
    clear() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('Failed to clear localStorage:', error);
        }
    }
};

// URL utilities
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function updateQueryParams(params) {
    const url = new URL(window.location);
    Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === undefined) {
            url.searchParams.delete(key);
        } else {
            url.searchParams.set(key, value);
        }
    });
    window.history.replaceState({}, '', url);
}

// Animation utilities
function animateCSS(element, animationName, callback) {
    const node = typeof element === 'string' ? $(element) : element;
    node.classList.add('animate__animated', `animate__${animationName}`);
    
    function handleAnimationEnd(event) {
        event.stopPropagation();
        node.classList.remove('animate__animated', `animate__${animationName}`);
        if (typeof callback === 'function') callback();
    }
    
    node.addEventListener('animationend', handleAnimationEnd, { once: true });
}

// Intersection Observer for scroll animations
function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    // Observe elements with animation classes
    $$('.fade-in-on-scroll, .slide-in-left-on-scroll, .slide-in-right-on-scroll, .scale-in-on-scroll')
        .forEach(element => observer.observe(element));
}

// Initialize scroll animations when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupScrollAnimations);
} else {
    setupScrollAnimations();
}

// Export utilities for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        $, $$, createElement, formatDate, formatRelativeTime, formatNumber,
        debounce, throttle, deepClone, generateId, isValidEmail, validatePassword,
        sanitizeHTML, escapeHTML, toast, modal, loading, validateForm, storage,
        getQueryParam, updateQueryParams, animateCSS, setupScrollAnimations
    };
}
