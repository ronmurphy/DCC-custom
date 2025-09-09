// miniGameManager.js - WebView-based mini-game integration for V4-network

class MiniGameManager {
    constructor() {
        this.activeGame = null;
        this.gameContainer = null;
        this.isGameActive = false;
        this.chatContainer = null;
        this.originalChatDisplay = '';
        
        // Bind methods
        this.handleGameMessage = this.handleGameMessage.bind(this);
        this.closeGame = this.closeGame.bind(this);
        
        // Listen for messages from mini-games
        window.addEventListener('message', this.handleGameMessage);
    }

    /**
     * Launch the Iron Tangle mini-game in a WebView overlay
     */
    launchIronTangle() {
        if (this.isGameActive) {
            console.log('Game already active');
            return;
        }

        this.createGameOverlay();
        this.minimizeChat();
        
        // Create WebView-like container
        const gameFrame = document.createElement('div');
        gameFrame.className = 'mini-game-frame';
        gameFrame.innerHTML = `
            <div class="game-header">
                <h3>🚂 Iron Tangle Railway</h3>
                <button class="close-game-btn" onclick="miniGameManager.closeGame()">✕</button>
            </div>
            <iframe 
                src="miniGames/ironTangle/ironTangle.html" 
                width="100%" 
                height="100%" 
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                sandbox="allow-scripts allow-same-origin allow-forms">
            </iframe>
        `;

        this.gameContainer.appendChild(gameFrame);
        this.activeGame = 'ironTangle';
        this.isGameActive = true;

        // Add game-specific styling
        this.addGameStyles();
        
        console.log('Iron Tangle launched successfully');
    }

    /**
     * Create the overlay container for mini-games
     */
    createGameOverlay() {
        if (this.gameContainer) {
            return; // Already exists
        }

        this.gameContainer = document.createElement('div');
        this.gameContainer.className = 'mini-game-overlay';
        this.gameContainer.id = 'miniGameOverlay';

        // Find the chat container to position the overlay correctly
        this.chatContainer = document.getElementById('chat-container') || 
                           document.getElementById('chat') ||
                           document.querySelector('.chat-container');

        if (this.chatContainer) {
            // Insert overlay before chat
            this.chatContainer.parentNode.insertBefore(this.gameContainer, this.chatContainer);
        } else {
            // Fallback: append to body
            document.body.appendChild(this.gameContainer);
        }
    }

    /**
     * Minimize the chat to make room for the game
     */
    minimizeChat() {
        if (this.chatContainer) {
            this.originalChatDisplay = this.chatContainer.style.display || '';
            this.chatContainer.style.display = 'none';
            
            // Alternative: minimize instead of hide
            // this.chatContainer.classList.add('minimized');
        }
    }

    /**
     * Restore the chat to its original state
     */
    restoreChat() {
        if (this.chatContainer) {
            this.chatContainer.style.display = this.originalChatDisplay;
            this.chatContainer.classList.remove('minimized');
        }
    }

    /**
     * Close the active mini-game
     */
    closeGame() {
        if (!this.isGameActive) {
            return;
        }

        // Remove game container
        if (this.gameContainer) {
            this.gameContainer.remove();
            this.gameContainer = null;
        }

        // Restore chat
        this.restoreChat();

        // Clean up state
        this.activeGame = null;
        this.isGameActive = false;

        // Remove game-specific styles
        this.removeGameStyles();

        console.log('Mini-game closed');
    }

    /**
     * Handle messages from mini-games
     */
    handleGameMessage(event) {
        // Only handle messages from our mini-games
        if (!event.data || !event.data.type) {
            return;
        }

        switch (event.data.type) {
            case 'CLOSE_MINI_GAME':
                this.closeGame();
                break;
            
            case 'GAME_READY':
                console.log(`${event.data.game} is ready`);
                break;
            
            case 'GAME_SCORE':
                // Handle score updates if needed
                console.log(`Score update from ${event.data.game}:`, event.data.score);
                break;
            
            default:
                console.log('Unknown message from mini-game:', event.data);
        }
    }

    /**
     * Add CSS styles for mini-game overlay
     */
    addGameStyles() {
        if (document.getElementById('mini-game-styles')) {
            return; // Styles already added
        }

        const style = document.createElement('style');
        style.id = 'mini-game-styles';
        style.textContent = `
            .mini-game-overlay {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90vw;
                height: 90vh;
                max-width: 800px;
                max-height: 600px;
                background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
                border: 2px solid #8B4513;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
                z-index: 1000;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                animation: gameSlideIn 0.5s ease-out;
            }

            .mini-game-frame {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
            }

            .game-header {
                background: linear-gradient(45deg, #8B4513, #A0522D);
                color: #F5DEB3;
                padding: 10px 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #CD853F;
                font-family: 'Courier New', monospace;
            }

            .game-header h3 {
                margin: 0;
                font-size: 1.2em;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
            }

            .close-game-btn {
                background: rgba(220, 20, 60, 0.8);
                border: 1px solid #DC143C;
                color: white;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
                transition: all 0.3s ease;
            }

            .close-game-btn:hover {
                background: #DC143C;
                transform: scale(1.1);
            }

            .mini-game-frame iframe {
                flex: 1;
                border: none;
                background: #1a1a1a;
            }

            @keyframes gameSlideIn {
                from {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.8);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }

            /* Chat minimization styles */
            .chat-container.minimized {
                height: 50px;
                overflow: hidden;
                transition: height 0.3s ease;
            }

            /* Mobile responsive */
            @media (max-width: 768px) {
                .mini-game-overlay {
                    width: 95vw;
                    height: 95vh;
                    top: 50%;
                    left: 50%;
                }
            }

            /* Game button integration */
            .game-launch-btn {
                background: linear-gradient(45deg, #8B4513, #A0522D);
                border: 2px solid #CD853F;
                color: #F5DEB3;
                padding: 8px 16px;
                border-radius: 8px;
                cursor: pointer;
                font-family: 'Courier New', monospace;
                font-weight: bold;
                margin: 5px;
                transition: all 0.3s ease;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }

            .game-launch-btn:hover {
                background: linear-gradient(45deg, #A0522D, #D2691E);
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Remove mini-game styles
     */
    removeGameStyles() {
        const styleElement = document.getElementById('mini-game-styles');
        if (styleElement) {
            styleElement.remove();
        }
    }

    /**
     * Add game launch button to the UI
     */
    addGameButton(container) {
        if (!container) {
            console.warn('No container provided for game button');
            return;
        }

        const gameButton = document.createElement('button');
        gameButton.className = 'game-launch-btn';
        gameButton.innerHTML = '🚂 Iron Tangle';
        gameButton.title = 'Play the Iron Tangle railway mini-game';
        gameButton.onclick = () => this.launchIronTangle();

        container.appendChild(gameButton);
        return gameButton;
    }

    /**
     * Check if mini-games are available
     */
    static isAvailable() {
        // Check if mini-game files exist
        return fetch('miniGames/ironTangle/ironTangle.html', { method: 'HEAD' })
            .then(response => response.ok)
            .catch(() => false);
    }
}

// Global instance
window.miniGameManager = new MiniGameManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MiniGameManager;
}

// Auto-integration for DCC apps
document.addEventListener('DOMContentLoaded', () => {
    // Look for common control areas to add the game button
    const controlContainers = [
        '#controls',
        '.controls',
        '#button-container',
        '.button-container',
        '#game-controls',
        '.game-controls'
    ];

    // NOTE: Automatic button creation disabled since we now use the expandable FAB
    /*
    for (const selector of controlContainers) {
        const container = document.querySelector(selector);
        if (container) {
            console.log('Adding Iron Tangle button to:', selector);
            miniGameManager.addGameButton(container);
            break;
        }
    }

    // If no suitable container found, create one
    if (!document.querySelector('.game-launch-btn')) {
        const gameControls = document.createElement('div');
        gameControls.className = 'mini-game-controls';
        gameControls.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 100;
        `;
        
        miniGameManager.addGameButton(gameControls);
        document.body.appendChild(gameControls);
        console.log('Created floating game controls');
    }
    */
    console.log('Iron Tangle available via expandable FAB (automatic button creation disabled)');
});

console.log('MiniGameManager loaded successfully');
