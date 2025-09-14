// Main application logic

class App {
    constructor() {
        this.init();
    }

    async init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.start());
        } else {
            this.start();
        }
    }

    async start() {
        this.setupEventListeners();
        this.initializeComponents();
        await this.loadInitialData();
        this.setupAnimations();
    }

    setupEventListeners() {
        // Global search functionality
        const globalSearch = $('#globalSearch');
        const heroSearch = $('#heroSearch');
        
        if (globalSearch) {
            globalSearch.addEventListener('input', debounce((e) => {
                this.handleSearch(e.target.value);
            }, 300));
        }

        if (heroSearch) {
            heroSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch(e.target.value);
                }
            });
            
            const searchBtn = $('.search-btn');
            if (searchBtn) {
                searchBtn.addEventListener('click', () => {
                    this.handleSearch(heroSearch.value);
                });
            }
        }

        // Instrument card clicks
        $$('.instrument-card').forEach(card => {
            card.addEventListener('click', () => {
                const instrument = card.dataset.instrument;
                this.filterByInstrument(instrument);
            });
        });

        // Navigation active state
        this.updateNavigation();

        // Smooth scroll for anchor links
        $$('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = $(link.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    initializeComponents() {
        // Initialize tooltips, dropdowns, etc.
        this.initializeTooltips();
        this.initializeDropdowns();
        this.initializeLazyLoading();
    }

    async loadInitialData() {
        // Load data based on current page
        const page = this.getCurrentPage();
        
        switch (page) {
            case 'home':
                await this.loadHomepageData();
                break;
            case 'songs':
                await this.loadSongsPage();
                break;
            case 'compositions':
                await this.loadCompositionsPage();
                break;
            case 'profile':
                await this.loadProfilePage();
                break;
            default:
                await this.loadHomepageData();
        }
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path === '/' || path === '/index.html') return 'home';
        if (path.includes('songs')) return 'songs';
        if (path.includes('compositions')) return 'compositions';
        if (path.includes('profile')) return 'profile';
        if (path.includes('dashboard')) return 'dashboard';
        return 'unknown';
    }

    async loadHomepageData() {
        try {
            // Load trending songs
            await this.loadTrendingSongs();
            
            // Load featured compositions
            await this.loadFeaturedCompositions();
            
            // Load stats
            await this.loadStats();
            
        } catch (error) {
            console.error('Failed to load homepage data:', error);
            toast.error('Failed to load some content. Please refresh the page.');
        }
    }

    async loadTrendingSongs() {
        const container = $('#trendingSongs');
        if (!container) return;

        try {
            const response = await api.getTrendingSongs(8);
            const songs = response.songs || [];
            
            if (songs.length === 0) {
                container.innerHTML = '<p class="text-center text-muted">No trending songs found.</p>';
                return;
            }

            container.innerHTML = '';
            songs.forEach(song => {
                const songCard = this.createSongCard(song);
                container.appendChild(songCard);
            });

        } catch (error) {
            console.error('Failed to load trending songs:', error);
            container.innerHTML = '<p class="text-center text-muted">Failed to load trending songs.</p>';
        }
    }

    async loadFeaturedCompositions() {
        const container = $('#featuredCompositions');
        if (!container) return;

        try {
            const response = await api.getFeaturedCompositions(6);
            const compositions = response.compositions || [];
            
            if (compositions.length === 0) {
                container.innerHTML = '<p class="text-center text-muted">No featured compositions found.</p>';
                return;
            }

            container.innerHTML = '';
            compositions.forEach(composition => {
                const compositionCard = this.createCompositionCard(composition);
                container.appendChild(compositionCard);
            });

        } catch (error) {
            console.error('Failed to load featured compositions:', error);
            container.innerHTML = '<p class="text-center text-muted">Failed to load featured compositions.</p>';
        }
    }

    async loadStats() {
        try {
            // For now, we'll show placeholder stats
            // In a real app, you'd have an endpoint for global stats
            const totalSongs = $('#totalSongs');
            const totalCompositions = $('#totalCompositions');
            const totalUsers = $('#totalUsers');

            // Animate numbers counting up
            if (totalSongs) this.animateNumber(totalSongs, 1250);
            if (totalCompositions) this.animateNumber(totalCompositions, 3420);
            if (totalUsers) this.animateNumber(totalUsers, 890);

        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }

    createSongCard(song) {
        const card = createElement('div', { 
            className: 'song-card hover-lift',
            onclick: () => this.viewSong(song._id)
        });

        const image = createElement('div', { className: 'card-image' });
        
        if (song.coverImage) {
            const img = createElement('img', {
                src: song.coverImage,
                alt: song.title,
                style: 'width: 100%; height: 100%; object-fit: cover;'
            });
            image.appendChild(img);
        } else {
            const icon = createElement('i', { className: 'fas fa-music' });
            image.appendChild(icon);
        }

        const content = createElement('div', { className: 'card-content' });
        
        const title = createElement('h3', { className: 'card-title' }, song.title);
        const artist = createElement('p', { className: 'card-subtitle' }, song.artist);
        
        const meta = createElement('div', { className: 'card-meta' });
        const stats = createElement('div', { className: 'card-stats' });
        
        const views = createElement('div', { className: 'card-stat' },
            createElement('i', { className: 'fas fa-eye' }),
            formatNumber(song.views || 0)
        );
        
        const compositions = createElement('div', { className: 'card-stat' },
            createElement('i', { className: 'fas fa-music' }),
            formatNumber(song.compositionsCount || 0)
        );

        stats.appendChild(views);
        stats.appendChild(compositions);
        meta.appendChild(stats);

        const genre = createElement('span', { 
            className: 'badge',
            style: 'background: var(--primary-color); color: white; padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-size: 0.75rem;'
        }, song.genre);

        content.appendChild(title);
        content.appendChild(artist);
        content.appendChild(meta);
        content.appendChild(genre);

        card.appendChild(image);
        card.appendChild(content);

        return card;
    }

    createCompositionCard(composition) {
        const card = createElement('div', { 
            className: 'composition-card hover-lift',
            onclick: () => this.viewComposition(composition._id)
        });

        const image = createElement('div', { className: 'card-image' });
        
        // Show instrument icon
        const instrumentIcons = {
            guitar: 'fas fa-guitar',
            piano: 'fas fa-piano',
            violin: 'fas fa-violin',
            drums: 'fas fa-drum',
            vocals: 'fas fa-microphone',
            default: 'fas fa-music'
        };
        
        const icon = createElement('i', { 
            className: instrumentIcons[composition.instrument] || instrumentIcons.default
        });
        image.appendChild(icon);

        const content = createElement('div', { className: 'card-content' });
        
        const title = createElement('h3', { className: 'card-title' }, composition.title);
        const songInfo = createElement('p', { className: 'card-subtitle' }, 
            `${composition.song?.title || 'Unknown Song'} by ${composition.song?.artist || 'Unknown Artist'}`
        );
        const composer = createElement('p', { 
            className: 'card-subtitle',
            style: 'font-size: 0.875rem; color: var(--text-muted);'
        }, `by ${composition.composer?.username || 'Anonymous'}`);
        
        const meta = createElement('div', { className: 'card-meta' });
        const stats = createElement('div', { className: 'card-stats' });
        
        const likes = createElement('div', { className: 'card-stat' },
            createElement('i', { className: 'fas fa-thumbs-up' }),
            formatNumber(composition.likes || 0)
        );
        
        const difficulty = createElement('div', { className: 'card-stat' },
            createElement('i', { className: 'fas fa-signal' }),
            composition.difficulty || 'Beginner'
        );

        stats.appendChild(likes);
        stats.appendChild(difficulty);
        meta.appendChild(stats);

        const instrument = createElement('span', { 
            className: 'badge',
            style: 'background: var(--accent-color); color: white; padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-size: 0.75rem;'
        }, composition.instrument);

        content.appendChild(title);
        content.appendChild(songInfo);
        content.appendChild(composer);
        content.appendChild(meta);
        content.appendChild(instrument);

        card.appendChild(image);
        card.appendChild(content);

        return card;
    }

    handleSearch(query) {
        if (!query.trim()) return;
        
        // Navigate to search results page
        window.location.href = `/search.html?q=${encodeURIComponent(query)}`;
    }

    filterByInstrument(instrument) {
        // Navigate to songs/compositions filtered by instrument
        window.location.href = `/songs.html?instrument=${encodeURIComponent(instrument)}`;
    }

    viewSong(songId) {
        window.location.href = `/song.html?id=${songId}`;
    }

    viewComposition(compositionId) {
        window.location.href = `/composition.html?id=${compositionId}`;
    }

    animateNumber(element, target) {
        const duration = 2000; // 2 seconds
        const start = 0;
        const startTime = performance.now();
        
        const updateNumber = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentNumber = Math.floor(start + (target - start) * easeOut);
            
            element.textContent = formatNumber(currentNumber);
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            } else {
                element.textContent = formatNumber(target);
            }
        };
        
        requestAnimationFrame(updateNumber);
    }

    updateNavigation() {
        const currentPage = this.getCurrentPage();
        const navLinks = $$('.nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            
            const href = link.getAttribute('href');
            if ((currentPage === 'home' && (href === '/' || href === 'index.html')) ||
                (currentPage !== 'home' && href.includes(currentPage))) {
                link.classList.add('active');
            }
        });
    }

    setupAnimations() {
        // Setup scroll animations
        this.setupScrollAnimations();
        
        // Setup navbar scroll effect
        this.setupNavbarScroll();
        
        // Setup stagger animations for grids
        this.setupStaggerAnimations();
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        $$('.fade-in-on-scroll, .slide-in-left-on-scroll, .slide-in-right-on-scroll, .scale-in-on-scroll')
            .forEach(element => observer.observe(element));
    }

    setupNavbarScroll() {
        const navbar = $('.navbar');
        if (!navbar) return;

        let lastScroll = 0;
        
        window.addEventListener('scroll', throttle(() => {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            
            lastScroll = currentScroll;
        }, 100));
    }

    setupStaggerAnimations() {
        $$('.songs-grid, .compositions-grid, .instruments-grid').forEach(grid => {
            grid.classList.add('stagger-animation');
        });
    }

    initializeTooltips() {
        // Simple tooltip implementation
        $$('[data-tooltip]').forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                const tooltip = createElement('div', {
                    className: 'tooltip',
                    style: 'position: absolute; background: rgba(0,0,0,0.8); color: white; padding: 0.5rem; border-radius: 0.25rem; font-size: 0.875rem; z-index: 1000; pointer-events: none;'
                }, element.dataset.tooltip);
                
                document.body.appendChild(tooltip);
                
                const rect = element.getBoundingClientRect();
                tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
                tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
                
                element._tooltip = tooltip;
            });
            
            element.addEventListener('mouseleave', (e) => {
                if (element._tooltip) {
                    element._tooltip.remove();
                    element._tooltip = null;
                }
            });
        });
    }

    initializeDropdowns() {
        $$('.dropdown-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = toggle.nextElementSibling;
                if (dropdown) {
                    dropdown.classList.toggle('show');
                }
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            $$('.dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
        });
    }

    initializeLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });

            $$('img[data-src]').forEach(img => imageObserver.observe(img));
        }
    }
}

// Global instances
let api, auth, modal, toast, loading;

// Global functions for HTML onclick handlers
window.showLoginModal = function() {
    modal.open('loginModal');
};

window.showRegisterModal = function() {
    modal.open('registerModal');
};

window.closeModal = function(modalId) {
    modal.close(modalId);
};

window.switchToLogin = function() {
    modal.close('registerModal');
    modal.open('loginModal');
};

window.switchToRegister = function() {
    modal.close('loginModal');
    modal.open('registerModal');
};

window.loginWithGoogle = function() {
    window.location.href = 'http://localhost:5000/api/auth/google';
};

window.logout = function() {
    if (auth) {
        auth.logout();
    }
};

window.toggleUserDropdown = function() {
    const dropdown = $('#userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize global components
    api = new APIClient();
    modal = new ModalManager();
    toast = new ToastManager();
    loading = new LoadingManager();
    auth = new AuthManager();
    
    // Initialize the main app
    const app = new App();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { App };
}
