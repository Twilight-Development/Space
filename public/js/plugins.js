const SpacePlugins = {
    plugins: {},
    enabledPlugins: JSON.parse(localStorage.getItem('space-enabled-plugins') || '{}'),

    register(plugin) {
        this.plugins[plugin.id] = plugin;
        if (this.enabledPlugins[plugin.id]) {
            this.activate(plugin.id);
        }
    },

    activate(pluginId) {
        const plugin = this.plugins[pluginId];
        if (plugin && plugin.activate) {
            plugin.activate();
            this.enabledPlugins[pluginId] = true;
            this.saveState();
        }
    },

    deactivate(pluginId) {
        const plugin = this.plugins[pluginId];
        if (plugin && plugin.deactivate) {
            plugin.deactivate();
            this.enabledPlugins[pluginId] = false;
            this.saveState();
        }
    },

    toggle(pluginId) {
        if (this.enabledPlugins[pluginId]) {
            this.deactivate(pluginId);
        } else {
            this.activate(pluginId);
        }
        return this.enabledPlugins[pluginId];
    },

    isEnabled(pluginId) {
        return this.enabledPlugins[pluginId] || false;
    },

    saveState() {
        localStorage.setItem('space-enabled-plugins', JSON.stringify(this.enabledPlugins));
    },

    getAll() {
        return Object.values(this.plugins);
    }
};

SpacePlugins.register({
    id: 'dark-mode-enhancer',
    name: 'Dark Mode Enhancer',
    description: 'Applies enhanced dark mode to proxied websites for easier reading',
    icon: 'dark_mode',
    category: 'visual',
    
    activate() {
        this.style = document.createElement('style');
        this.style.id = 'dark-mode-enhancer-style';
        this.style.textContent = `
            #intospace {
                filter: invert(0.9) hue-rotate(180deg) !important;
            }
            #intospace img,
            #intospace video,
            #intospace canvas,
            #intospace picture,
            #intospace svg {
                filter: invert(1) hue-rotate(180deg) !important;
            }
        `;
        document.head.appendChild(this.style);
        localStorage.setItem('dark-mode-enhancer-active', 'true');
        
        const iframe = document.getElementById('intospace');
        if (iframe) {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                const iframeStyle = iframeDoc.createElement('style');
                iframeStyle.id = 'dark-mode-enhancer-iframe';
                iframeStyle.textContent = `
                    html, body {
                        filter: invert(0.9) hue-rotate(180deg) !important;
                    }
                    img, video, canvas, picture, svg {
                        filter: invert(1) hue-rotate(180deg) !important;
                    }
                `;
                iframeDoc.head.appendChild(iframeStyle);
            } catch (e) {}
        }
    },
    
    deactivate() {
        const style = document.getElementById('dark-mode-enhancer-style');
        if (style) style.remove();
        localStorage.removeItem('dark-mode-enhancer-active');
        
        const iframe = document.getElementById('intospace');
        if (iframe) {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                const iframeStyle = iframeDoc.getElementById('dark-mode-enhancer-iframe');
                if (iframeStyle) iframeStyle.remove();
            } catch (e) {}
        }
    }
});

SpacePlugins.register({
    id: 'quick-bookmarks',
    name: 'Quick Bookmarks',
    description: 'Save and access your favorite Space pages and proxy URLs',
    icon: 'bookmark',
    category: 'productivity',
    bookmarks: [],
    
    activate() {
        this.bookmarks = JSON.parse(localStorage.getItem('space-quick-bookmarks') || '[]');
        localStorage.setItem('quick-bookmarks-active', 'true');
        this.injectBookmarkButton();
    },
    
    deactivate() {
        localStorage.removeItem('quick-bookmarks-active');
        const btn = document.getElementById('space-bookmark-btn');
        if (btn) btn.remove();
        const panel = document.getElementById('space-bookmarks-panel');
        if (panel) panel.remove();
    },

    getCurrentPageInfo() {
        let url = window.location.href;
        let title = document.title;
        
        if (window.location.pathname === '/&') {
            const savedOutput = localStorage.getItem('output');
            const savedInput = localStorage.getItem('input');
            if (savedInput) {
                title = savedInput;
                url = window.location.origin + '/&?q=' + encodeURIComponent(savedInput);
            }
        }
        
        return { url, title };
    },

    injectBookmarkButton() {
        if (document.getElementById('space-bookmark-btn')) return;
        
        const btn = document.createElement('button');
        btn.id = 'space-bookmark-btn';
        btn.innerHTML = '<span class="material-symbols-outlined">bookmark</span>';
        btn.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: none;
            background: linear-gradient(135deg, #8f00ff, #5f00b5);
            color: white;
            cursor: pointer;
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 15px rgba(143, 0, 255, 0.4);
            transition: transform 0.2s, box-shadow 0.2s;
        `;
        btn.onmouseover = () => { btn.style.transform = 'scale(1.1)'; };
        btn.onmouseout = () => { btn.style.transform = 'scale(1)'; };
        btn.onclick = () => this.toggleBookmarksPanel();
        document.body.appendChild(btn);
    },

    toggleBookmarksPanel() {
        let panel = document.getElementById('space-bookmarks-panel');
        if (panel) {
            panel.remove();
            return;
        }
        
        panel = document.createElement('div');
        panel.id = 'space-bookmarks-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 140px;
            right: 20px;
            width: 280px;
            max-height: 300px;
            background: rgba(20, 20, 20, 0.95);
            border-radius: 12px;
            padding: 15px;
            z-index: 999999;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            backdrop-filter: blur(10px);
            overflow-y: auto;
        `;
        
        const title = document.createElement('h3');
        title.textContent = 'Bookmarks';
        title.style.cssText = 'margin: 0 0 10px 0; color: white; font-size: 16px;';
        panel.appendChild(title);
        
        const pageInfo = this.getCurrentPageInfo();
        const addBtn = document.createElement('button');
        addBtn.textContent = '+ Bookmark This Page';
        addBtn.style.cssText = `
            width: 100%;
            padding: 8px;
            border: none;
            border-radius: 6px;
            background: linear-gradient(135deg, #8f00ff, #5f00b5);
            color: white;
            cursor: pointer;
            margin-bottom: 10px;
            font-size: 13px;
        `;
        addBtn.onclick = () => {
            this.addBookmark(pageInfo.url, pageInfo.title);
            this.toggleBookmarksPanel();
            this.toggleBookmarksPanel();
        };
        panel.appendChild(addBtn);
        
        this.bookmarks = JSON.parse(localStorage.getItem('space-quick-bookmarks') || '[]');
        if (this.bookmarks.length === 0) {
            const empty = document.createElement('p');
            empty.textContent = 'No bookmarks yet';
            empty.style.cssText = 'color: rgba(255,255,255,0.5); font-size: 13px; text-align: center;';
            panel.appendChild(empty);
        } else {
            this.bookmarks.forEach(bm => {
                const item = document.createElement('div');
                item.style.cssText = `
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 6px;
                    margin-bottom: 5px;
                `;
                
                const link = document.createElement('a');
                link.href = bm.url;
                link.textContent = bm.title.substring(0, 25) || 'Untitled';
                link.style.cssText = 'color: #a855f7; text-decoration: none; font-size: 13px; flex: 1; overflow: hidden; text-overflow: ellipsis;';
                
                const delBtn = document.createElement('button');
                delBtn.textContent = 'X';
                delBtn.style.cssText = 'background: #ff4444; color: white; border: none; border-radius: 4px; padding: 2px 8px; cursor: pointer; font-size: 11px;';
                delBtn.onclick = (e) => {
                    e.preventDefault();
                    this.removeBookmark(bm.id);
                    this.toggleBookmarksPanel();
                    this.toggleBookmarksPanel();
                };
                
                item.appendChild(link);
                item.appendChild(delBtn);
                panel.appendChild(item);
            });
        }
        
        document.body.appendChild(panel);
    },

    addBookmark(url, title) {
        this.bookmarks = JSON.parse(localStorage.getItem('space-quick-bookmarks') || '[]');
        this.bookmarks.push({ url, title, id: Date.now() });
        localStorage.setItem('space-quick-bookmarks', JSON.stringify(this.bookmarks));
    },

    removeBookmark(id) {
        this.bookmarks = JSON.parse(localStorage.getItem('space-quick-bookmarks') || '[]');
        this.bookmarks = this.bookmarks.filter(b => b.id !== id);
        localStorage.setItem('space-quick-bookmarks', JSON.stringify(this.bookmarks));
    },

    getBookmarks() {
        return JSON.parse(localStorage.getItem('space-quick-bookmarks') || '[]');
    }
});

SpacePlugins.register({
    id: 'custom-shortcuts',
    name: 'Custom Shortcuts',
    description: 'Create keyboard shortcuts for quick actions in Space',
    icon: 'keyboard',
    category: 'productivity',
    shortcuts: {
        'Alt+H': () => window.location.href = '/',
        'Alt+G': () => window.location.href = '/g',
        'Alt+A': () => window.location.href = '/a',
        'Alt+P': () => window.location.href = '/&',
        'Alt+S': () => window.location.href = '/~'
    },

    activate() {
        this.handler = (e) => {
            const key = `${e.altKey ? 'Alt+' : ''}${e.ctrlKey ? 'Ctrl+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.key.toUpperCase()}`;
            if (this.shortcuts[key]) {
                e.preventDefault();
                this.shortcuts[key]();
            }
        };
        document.addEventListener('keydown', this.handler);
        localStorage.setItem('custom-shortcuts-active', 'true');
        this.showShortcutsIndicator();
    },
    
    deactivate() {
        if (this.handler) {
            document.removeEventListener('keydown', this.handler);
        }
        localStorage.removeItem('custom-shortcuts-active');
        const indicator = document.getElementById('shortcuts-indicator');
        if (indicator) indicator.remove();
    },

    showShortcutsIndicator() {
        if (document.getElementById('shortcuts-indicator')) return;
        
        const indicator = document.createElement('div');
        indicator.id = 'shortcuts-indicator';
        indicator.innerHTML = '<span class="material-symbols-outlined">keyboard</span>';
        indicator.title = 'Shortcuts Active: Alt+H(Home), Alt+G(Games), Alt+A(Apps), Alt+P(Proxy), Alt+S(Settings)';
        indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 80px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(30, 30, 30, 0.9);
            color: #a855f7;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999998;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            font-size: 20px;
        `;
        document.body.appendChild(indicator);
    }
});

SpacePlugins.register({
    id: 'tab-manager',
    name: 'Tab Manager',
    description: 'Enhanced tab management with session restore and tab groups',
    icon: 'tab',
    category: 'productivity',
    
    activate() {
        this.saveCurrentSession();
        localStorage.setItem('tab-manager-active', 'true');
        this.injectSessionButton();
        
        this.navigationHandler = () => this.saveCurrentSession();
        window.addEventListener('beforeunload', this.navigationHandler);
    },
    
    deactivate() {
        localStorage.removeItem('tab-manager-active');
        const btn = document.getElementById('space-session-btn');
        if (btn) btn.remove();
        const panel = document.getElementById('space-sessions-panel');
        if (panel) panel.remove();
        if (this.navigationHandler) {
            window.removeEventListener('beforeunload', this.navigationHandler);
        }
    },

    injectSessionButton() {
        if (document.getElementById('space-session-btn')) return;
        
        const btn = document.createElement('button');
        btn.id = 'space-session-btn';
        btn.innerHTML = '<span class="material-symbols-outlined">history</span>';
        btn.style.cssText = `
            position: fixed;
            bottom: 140px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: none;
            background: linear-gradient(135deg, #00bcd4, #006064);
            color: white;
            cursor: pointer;
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 15px rgba(0, 188, 212, 0.4);
            transition: transform 0.2s;
        `;
        btn.onmouseover = () => { btn.style.transform = 'scale(1.1)'; };
        btn.onmouseout = () => { btn.style.transform = 'scale(1)'; };
        btn.onclick = () => this.toggleSessionsPanel();
        document.body.appendChild(btn);
    },

    toggleSessionsPanel() {
        let panel = document.getElementById('space-sessions-panel');
        if (panel) {
            panel.remove();
            return;
        }
        
        panel = document.createElement('div');
        panel.id = 'space-sessions-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 200px;
            right: 20px;
            width: 280px;
            max-height: 250px;
            background: rgba(20, 20, 20, 0.95);
            border-radius: 12px;
            padding: 15px;
            z-index: 999999;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            backdrop-filter: blur(10px);
            overflow-y: auto;
        `;
        
        const title = document.createElement('h3');
        title.textContent = 'Recent Sessions';
        title.style.cssText = 'margin: 0 0 10px 0; color: white; font-size: 16px;';
        panel.appendChild(title);
        
        const sessions = this.getSessions();
        if (sessions.length === 0) {
            const empty = document.createElement('p');
            empty.textContent = 'No sessions saved';
            empty.style.cssText = 'color: rgba(255,255,255,0.5); font-size: 13px; text-align: center;';
            panel.appendChild(empty);
        } else {
            sessions.slice(0, 10).forEach(session => {
                const item = document.createElement('a');
                item.href = session.url;
                item.style.cssText = `
                    display: block;
                    padding: 8px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 6px;
                    margin-bottom: 5px;
                    color: #00bcd4;
                    text-decoration: none;
                    font-size: 13px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                `;
                const time = new Date(session.timestamp).toLocaleTimeString();
                item.textContent = `${session.title.substring(0, 30) || 'Untitled'} - ${time}`;
                panel.appendChild(item);
            });
        }
        
        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear All';
        clearBtn.style.cssText = `
            width: 100%;
            padding: 8px;
            border: none;
            border-radius: 6px;
            background: #ff4444;
            color: white;
            cursor: pointer;
            margin-top: 10px;
            font-size: 13px;
        `;
        clearBtn.onclick = () => {
            this.clearSessions();
            this.toggleSessionsPanel();
            this.toggleSessionsPanel();
        };
        panel.appendChild(clearBtn);
        
        document.body.appendChild(panel);
    },

    saveCurrentSession() {
        const session = {
            url: window.location.href,
            title: document.title,
            timestamp: Date.now()
        };
        let sessions = JSON.parse(localStorage.getItem('space-tab-sessions') || '[]');
        if (sessions.length === 0 || sessions[0].url !== session.url) {
            sessions.unshift(session);
            sessions = sessions.slice(0, 20);
            localStorage.setItem('space-tab-sessions', JSON.stringify(sessions));
        }
    },

    getSessions() {
        return JSON.parse(localStorage.getItem('space-tab-sessions') || '[]');
    },

    clearSessions() {
        localStorage.setItem('space-tab-sessions', '[]');
    }
});

SpacePlugins.register({
    id: 'search-enhancer',
    name: 'Search Enhancer',
    description: 'Enhanced search with quick access to multiple search engines',
    icon: 'search',
    category: 'productivity',
    
    activate() {
        localStorage.setItem('search-enhancer-active', 'true');
        this.injectSearchEnhancer();
    },
    
    deactivate() {
        localStorage.removeItem('search-enhancer-active');
        const enhancer = document.getElementById('search-enhancer-bar');
        if (enhancer) enhancer.remove();
    },

    injectSearchEnhancer() {
        if (document.getElementById('search-enhancer-bar')) return;
        if (window.location.pathname !== '/&') return;
        
        const bar = document.createElement('div');
        bar.id = 'search-enhancer-bar';
        bar.style.cssText = `
            position: fixed;
            top: 10px;
            right: 20px;
            display: flex;
            gap: 5px;
            z-index: 999998;
        `;
        
        const engines = [
            { name: 'G', url: 'https://google.com/search?q=', color: '#4285f4' },
            { name: 'D', url: 'https://duckduckgo.com/?q=', color: '#de5833' },
            { name: 'B', url: 'https://bing.com/search?q=', color: '#008373' }
        ];
        
        engines.forEach(engine => {
            const btn = document.createElement('button');
            btn.textContent = engine.name;
            btn.title = `Search with ${engine.name === 'G' ? 'Google' : engine.name === 'D' ? 'DuckDuckGo' : 'Bing'}`;
            btn.style.cssText = `
                width: 30px;
                height: 30px;
                border-radius: 6px;
                border: none;
                background: ${engine.color};
                color: white;
                cursor: pointer;
                font-weight: bold;
                font-size: 12px;
            `;
            btn.onclick = () => {
                const query = prompt('Enter search query:');
                if (query) {
                    window.location.href = `/&?q=${encodeURIComponent(engine.url + query)}`;
                }
            };
            bar.appendChild(btn);
        });
        
        document.body.appendChild(bar);
    }
});

SpacePlugins.register({
    id: 'performance-mode',
    name: 'Performance Mode',
    description: 'Optimize Space for slower connections and devices',
    icon: 'speed',
    category: 'performance',
    
    activate() {
        this.style = document.createElement('style');
        this.style.id = 'performance-mode-style';
        this.style.textContent = `
            *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-delay: 0.01ms !important;
                transition-duration: 0.01ms !important;
            }
            .settingsection, .plugin-card {
                animation: none !important;
                opacity: 1 !important;
            }
            #particles-js {
                display: none !important;
            }
        `;
        document.head.appendChild(this.style);
        localStorage.setItem('performance-mode-active', 'true');
        
        const particles = document.getElementById('particles-js');
        if (particles) particles.style.display = 'none';
    },
    
    deactivate() {
        const style = document.getElementById('performance-mode-style');
        if (style) style.remove();
        localStorage.removeItem('performance-mode-active');
        
        const particles = document.getElementById('particles-js');
        if (particles) particles.style.display = '';
    }
});

SpacePlugins.register({
    id: 'history-manager',
    name: 'History Manager',
    description: 'Advanced browsing history with search and export',
    icon: 'history',
    category: 'privacy',
    
    activate() {
        this.trackPage();
        localStorage.setItem('history-manager-active', 'true');
        
        this.pageTracker = () => {
            setTimeout(() => this.trackPage(), 500);
        };
        window.addEventListener('hashchange', this.pageTracker);
        window.addEventListener('popstate', this.pageTracker);
    },
    
    deactivate() {
        localStorage.removeItem('history-manager-active');
        if (this.pageTracker) {
            window.removeEventListener('hashchange', this.pageTracker);
            window.removeEventListener('popstate', this.pageTracker);
        }
    },

    trackPage() {
        const entry = {
            url: window.location.href,
            title: document.title,
            timestamp: Date.now()
        };
        let history = JSON.parse(localStorage.getItem('space-browsing-history') || '[]');
        if (history.length === 0 || history[0].url !== entry.url) {
            history.unshift(entry);
            history = history.slice(0, 100);
            localStorage.setItem('space-browsing-history', JSON.stringify(history));
        }
    },

    getHistory() {
        return JSON.parse(localStorage.getItem('space-browsing-history') || '[]');
    },

    clearHistory() {
        localStorage.setItem('space-browsing-history', '[]');
    },

    searchHistory(query) {
        const history = this.getHistory();
        return history.filter(h => 
            h.title.toLowerCase().includes(query.toLowerCase()) || 
            h.url.toLowerCase().includes(query.toLowerCase())
        );
    },

    exportHistory() {
        const history = this.getHistory();
        const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'space-history.json';
        a.click();
        URL.revokeObjectURL(url);
    }
});

SpacePlugins.register({
    id: 'auto-fullscreen',
    name: 'Auto Fullscreen',
    description: 'Adds a fullscreen button when playing games',
    icon: 'fullscreen',
    category: 'gaming',
    
    activate() {
        localStorage.setItem('auto-fullscreen-active', 'true');
        this.injectFullscreenButton();
        
        this.iframeObserver = new MutationObserver(() => {
            this.injectFullscreenButton();
        });
        this.iframeObserver.observe(document.body, { childList: true, subtree: true });
    },
    
    deactivate() {
        localStorage.removeItem('auto-fullscreen-active');
        const btn = document.getElementById('space-fullscreen-btn');
        if (btn) btn.remove();
        if (this.iframeObserver) {
            this.iframeObserver.disconnect();
        }
    },

    injectFullscreenButton() {
        if (document.getElementById('space-fullscreen-btn')) return;
        
        const iframe = document.getElementById('intospace');
        if (!iframe || iframe.style.display === 'none') return;
        
        const btn = document.createElement('button');
        btn.id = 'space-fullscreen-btn';
        btn.innerHTML = '<span class="material-symbols-outlined">fullscreen</span>';
        btn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: none;
            background: linear-gradient(135deg, #ff9800, #f57c00);
            color: white;
            cursor: pointer;
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 15px rgba(255, 152, 0, 0.4);
            transition: transform 0.2s;
        `;
        btn.onmouseover = () => { btn.style.transform = 'scale(1.1)'; };
        btn.onmouseout = () => { btn.style.transform = 'scale(1)'; };
        btn.onclick = () => {
            const target = iframe || document.documentElement;
            if (target.requestFullscreen) {
                target.requestFullscreen();
            } else if (target.webkitRequestFullscreen) {
                target.webkitRequestFullscreen();
            } else if (target.msRequestFullscreen) {
                target.msRequestFullscreen();
            }
        };
        document.body.appendChild(btn);
    }
});

function initializePluginToggles() {
    const toggles = document.querySelectorAll('.plugin-toggle');
    toggles.forEach(toggle => {
        const pluginId = toggle.dataset.pluginId;
        toggle.checked = SpacePlugins.isEnabled(pluginId);
        
        toggle.addEventListener('change', function() {
            SpacePlugins.toggle(pluginId);
            showPluginToast(this.checked ? 'Plugin Enabled' : 'Plugin Disabled');
        });
    });
}

function showPluginToast(message) {
    const toast = document.querySelector('.toast');
    const text2 = toast?.querySelector('.text-2');
    if (toast && text2) {
        text2.textContent = message;
        toast.classList.add('active');
        setTimeout(() => {
            toast.classList.remove('active');
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializePluginToggles();
});

window.SpacePlugins = SpacePlugins;
