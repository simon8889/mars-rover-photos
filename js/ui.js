class UIManager {
    constructor() {
        this.currentPhotos = [];
        this.currentPage = 1;
        this.currentFilters = {};
        this.rovers = [];
    }
    
    async init() {
        try {
            await this.loadRovers();
            this.setupEventListeners();
            this.setupModal();
        } catch (error) {
            console.error('Error initializing UI:', error);
            this.showError('Error loading rover information. Please refresh the page.');
        }
    }
    
    async loadRovers() {
        try {
            this.rovers = await MarsRoverAPI.getRovers();
            this.populateRoverSelect();
        } catch (error) {
            console.error('Error loading rovers:', error);
            throw error;
        }
    }
    
    populateRoverSelect() {
        const roverSelect = document.getElementById('rover');
        
        roverSelect.innerHTML = '<option value="">Selecciona un rover</option>';
        
        this.rovers.forEach(rover => {
            const option = document.createElement('option');
            option.value = rover.name.toLowerCase();
            option.textContent = rover.name;
            roverSelect.appendChild(option);
        });
    }
    
    updateCameraOptions(roverName) {
        const cameraSelect = document.getElementById('camera');
        const rover = this.rovers.find(r => r.name.toLowerCase() === roverName.toLowerCase());
        
        cameraSelect.innerHTML = '<option value="">Todas las cámaras</option>';
        
        if (rover && rover.cameras) {
            rover.cameras.forEach(camera => {
                const option = document.createElement('option');
                option.value = camera.name;
                option.textContent = `${camera.name} - ${Utils.getCameraName(camera.name)}`;
                cameraSelect.appendChild(option);
            });
        }
    }
    
    updateDateConstraints(roverName) {
        const dateInput = document.getElementById('earth_date');
        const rover = this.rovers.find(r => r.name.toLowerCase() === roverName.toLowerCase());
        dateInput.value = '';
        if (rover) {
            console.log(rover);
            dateInput.min = rover.landing_date;
            dateInput.max = rover.status === 'active' ? Utils.getTodayDate() : rover.max_date;
        }
    }
    
    setupEventListeners() {
        document.getElementById('rover').addEventListener('change', (e) => {
            const selectedRover = e.target.value;
            if (selectedRover) {
                this.updateCameraOptions(selectedRover);
                this.updateDateConstraints(selectedRover);
            } else {
                document.getElementById('camera').innerHTML = '<option value="">Todas las cámaras</option>';
            }
        });
        
        document.getElementById('searchForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSearch();
        });
        
        document.getElementById('load-more-btn').addEventListener('click', () => {
            this.loadMorePhotos();
        });
    }
    
    setupModal() {
        const modal = document.getElementById('photo-modal');
        const overlay = document.querySelector('.modal-overlay');
        const closeBtn = document.getElementById('modal-close');
        
        [overlay, closeBtn].forEach(element => {
            element.addEventListener('click', () => {
                this.closeModal();
            });
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                this.closeModal();
            }
        });
    }
    
    async handleSearch() {
        const formData = new FormData(document.getElementById('searchForm'));
        const filters = {
            rover: formData.get('rover'),
            earth_date: formData.get('earth_date'),
            camera: formData.get('camera') || null
        };
        
        if (!filters.rover) {
            this.showError('Por favor selecciona un rover');
            return;
        }
        
        if (!filters.earth_date) {
            this.showError('Por favor selecciona una fecha');
            return;
        }
        
        if (!Utils.isValidDate(filters.earth_date)) {
            this.showError('Por favor ingresa una fecha válida');
            return;
        }
        
        const rover = this.rovers.find(r => r.name.toLowerCase() === filters.rover);
        if (rover && !Utils.isDateInMissionRange(filters.earth_date, rover)) {
            this.showError(`La fecha debe estar entre ${rover.landing_date} y ${rover.status === 'active' ? 'hoy' : rover.max_date}`);
            return;
        }
        
        this.currentPage = 1;
        this.currentFilters = filters;
        this.currentPhotos = [];
        
        await this.searchPhotos();
    }
    
    async searchPhotos() {
        this.showLoading();
        this.hideError();
        this.hideResults();
        
        try {
            const photos = await MarsRoverAPI.getPhotos(
                this.currentFilters.rover,
                this.currentFilters.earth_date,
                this.currentFilters.camera,
                this.currentPage
            );
            
            if (this.currentPage === 1) {
                this.currentPhotos = photos;
            } else {
                this.currentPhotos = [...this.currentPhotos, ...photos];
            }
            
            this.hideLoading();
            
            if (this.currentPhotos.length === 0) {
                this.showError('No se encontraron fotografías con los filtros seleccionados');
            } else {
                this.displayResults();
                this.displayPhotos();
            }
            
        } catch (error) {
            this.hideLoading();
            this.showError('Error al buscar fotografías. Por favor intenta de nuevo.');
            console.error('Search error:', error);
        }
    }
    
    async loadMorePhotos() {
        this.currentPage++;
        await this.searchPhotos();
    }
    
    displayResults() {
        const resultsInfo = document.getElementById('results-info');
        const resultsCount = document.getElementById('results-count');
        const activeFilters = document.getElementById('active-filters');
        
        resultsCount.textContent = this.currentPhotos.length;
        
        let filterText = `Rover: ${this.currentFilters.rover.toUpperCase()} | Fecha: ${this.currentFilters.earth_date}`;
        if (this.currentFilters.camera) {
            filterText += ` | Cámara: ${this.currentFilters.camera}`;
        }
        activeFilters.textContent = filterText;
        
        resultsInfo.classList.remove('hidden');
    }
    
    displayPhotos() {
        const photoGrid = document.getElementById('photo-grid');
        
        if (this.currentPage === 1) {
            photoGrid.innerHTML = '';
        }
        
        const startIndex = this.currentPage === 1 ? 0 : (this.currentPage - 1) * 25;
        const newPhotos = this.currentPhotos.slice(startIndex);
        
        newPhotos.forEach(photo => {
            const photoCard = this.createPhotoCard(photo);
            photoGrid.appendChild(photoCard);
        });
        
        this.updateLoadMoreButton();
        
        document.getElementById('results-section').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
    
    createPhotoCard(photo) {
        const card = document.createElement('div');
        card.className = 'photo-card';
        card.addEventListener('click', () => this.openModal(photo));
        
        card.innerHTML = `
            <div class="photo-container">
                <img src="${photo.img_src}" alt="Mars photo ${photo.id}" loading="lazy">
                <div class="image-placeholder hidden">
                    <div class="placeholder-content">
                        <i class="fas fa-image"></i>
                        <p>Imagen no disponible</p>
                        <small>Foto #${photo.id}</small>
                    </div>
                </div>
            </div>
            <div class="photo-info">
                <h3>Foto #${photo.id}</h3>
                <div class="photo-details">
                    <div class="detail-row">
                        <i class="fas fa-robot"></i>
                        <span>${photo.rover.name}</span>
                    </div>
                    <div class="detail-row">
                        <i class="fas fa-calendar"></i>
                        <span>${photo.earth_date}</span>
                    </div>
                    <div class="detail-row">
                        <i class="fas fa-camera"></i>
                        <span>${photo.camera.full_name}</span>
                    </div>
                </div>
            </div>
        `;
        
        const img = card.querySelector('img');
        const placeholder = card.querySelector('.image-placeholder');
        
        img.addEventListener('error', () => {
            img.style.display = 'none';
            placeholder.classList.remove('hidden');
        });
        
        img.addEventListener('load', () => {
            placeholder.classList.add('hidden');
        });
        
        return card;
    }
    
    updateLoadMoreButton() {
        const loadMoreContainer = document.getElementById('load-more-container');
        const loadMoreBtn = document.getElementById('load-more-btn');
        
        const lastBatch = this.currentPhotos.slice((this.currentPage - 1) * 25);
        if (lastBatch.length === 25) {
            loadMoreContainer.classList.remove('hidden');
        } else {
            loadMoreContainer.classList.add('hidden');
        }
    }
    
    openModal(photo) {
        const modal = document.getElementById('photo-modal');
        
        document.getElementById('modal-image').src = photo.img_src;
        document.getElementById('modal-title').textContent = `Fotografía #${photo.id}`;
        document.getElementById('modal-rover').textContent = photo.rover.name;
        document.getElementById('modal-date').textContent = photo.earth_date;
        document.getElementById('modal-camera').textContent = photo.camera.full_name;
        document.getElementById('modal-id').textContent = photo.id;
        document.getElementById('modal-original').href = photo.img_src;
        
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    
    closeModal() {
        const modal = document.getElementById('photo-modal');
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
    
    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
    }
    
    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }
    
    showError(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.querySelector('p').textContent = message;
        errorDiv.classList.remove('hidden');
    }
    
    hideError() {
        document.getElementById('error-message').classList.add('hidden');
    }
    
    hideResults() {
        document.getElementById('results-info').classList.add('hidden');
        document.getElementById('photo-grid').innerHTML = '';
        document.getElementById('load-more-container').classList.add('hidden');
    }
}