class MarsRoverApp {
    constructor() {
        this.ui = new UIManager();
    }
	
    async init() {
        try {
            console.log('🚀 Initializing Mars Rover Explorer...');
            await this.ui.init();
            console.log('✅ Mars Rover Explorer initialized successfully!');
        } catch (error) {
            console.error('❌ Failed to initialize Mars Rover Explorer:', error);
            this.showFallbackError();
        }
    }
    
    showFallbackError() {
        const resultsSection = document.getElementById('results-section');
        resultsSection.innerHTML = `
            <div class="container">
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error al cargar la aplicación. Por favor recarga la página.</p>
                </div>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const app = new MarsRoverApp();
    await app.init();
});

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
});