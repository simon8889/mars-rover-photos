const API_CONFIG = {
    BASE_URL: 'https://api.nasa.gov/mars-photos/api/v1',
    API_KEY: '2lcjahYBCUieE0pE7bNOjYMYMHjBgBjS0nxHAEYn'
};

class MarsRoverAPI {
    
    static async getRovers() {
        try {
            const url = `${API_CONFIG.BASE_URL}/rovers?api_key=${API_CONFIG.API_KEY}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Error fetching rovers: ${response.status}`);
            }
            
            const data = await response.json();
            return data.rovers;
        } catch (error) {
            console.error('Error getting rovers:', error);
            throw error;
        }
    }
    
    static async getPhotos(rover, earthDate, camera = null, page = 1) {
        try {
            let url = `${API_CONFIG.BASE_URL}/rovers/${rover}/photos?api_key=${API_CONFIG.API_KEY}&earth_date=${earthDate}&page=${page}`;
            
            if (camera) {
                url += `&camera=${camera}`;
            }
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Error fetching photos: ${response.status}`);
            }
            
            const data = await response.json();
            return data.photos;
        } catch (error) {
            console.error('Error getting photos:', error);
            throw error;
        }
    }
    
    static async getRoverInfo(roverName) {
        try {
            const rovers = await this.getRovers();
            return rovers.find(rover => rover.name.toLowerCase() === roverName.toLowerCase());
        } catch (error) {
            console.error('Error getting rover info:', error);
            throw error;
        }
    }
}

const CAMERA_NAMES = {
    'FHAZ': 'Front Hazard Avoidance Camera',
    'RHAZ': 'Rear Hazard Avoidance Camera',
    'MAST': 'Mast Camera',
    'CHEMCAM': 'Chemistry and Camera Complex',
    'MAHLI': 'Mars Hand Lens Imager',
    'MARDI': 'Mars Descent Imager',
    'NAVCAM': 'Navigation Camera',
    'PANCAM': 'Panoramic Camera',
    'MINITES': 'Miniature Thermal Emission Spectrometer'
};

const Utils = {
    formatDate(date) {
        if (date instanceof Date) {
            return date.toISOString().split('T')[0];
        }
        return date;
    },
    
    getCameraName(cameraAbbr) {
        return CAMERA_NAMES[cameraAbbr] || cameraAbbr;
    },
    
    isValidDate(dateString) {
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(dateString)) return false;
        
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    },
    
    isDateInMissionRange(dateString, rover) {
        const inputDate = new Date(dateString);
        const landingDate = new Date(rover.landing_date);
        const maxDate = rover.status === 'active' ? new Date() : new Date(rover.max_date);
        
        return inputDate >= landingDate && inputDate <= maxDate;
    }, 
     
    getTodayDate() {
        return new Date().toISOString().split('T')[0];
    }
};