// ShapeForge Standalone - Minimal initialization
console.log("🔧 ShapeForge Standalone initializing...");

// Global variables
let resourceManager = null;
let shaderEffectsManager = null;
let scene3DController = null;
let shapeForge = null;
let stats = null;

// Current object data
let currentObject = null;

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    console.log("📋 DOM loaded, initializing ShapeForge...");
    
        try {
        // Initialize ResourceManager
        if (window.ResourceManager) {
            resourceManager = new window.ResourceManager();
            window.resourceManager = resourceManager;
            console.log("✅ ResourceManager initialized");
        } else {
            console.error("❌ ResourceManager not available!");
        }

        // Make sure global reference is available for other systems
        if (resourceManager) {
            window.resourceManager = resourceManager;
        }        // Initialize ShaderEffectsManager (will be set up with Scene3D later)
        console.log("✅ ShaderEffectsManager ready");

        // Set up event listeners
        setupEventListeners();
        
        console.log("🎉 ShapeForge Standalone ready!");
        
    } catch (error) {
        console.error("❌ Failed to initialize ShapeForge:", error);
    }
});

function setupEventListeners() {
    // ShapeForge button
    const shapeForgeBtn = document.getElementById('shapeForgeBtn');
    if (shapeForgeBtn) {
        shapeForgeBtn.addEventListener('click', openShapeForge);
    }

    // 3D Viewer button
    const view3DBtn = document.getElementById('view3DBtn');
    if (view3DBtn) {
        view3DBtn.addEventListener('click', open3DViewer);
    }

    // Sample Objects button
    const sampleObjectsBtn = document.getElementById('sampleObjectsBtn');
    if (sampleObjectsBtn) {
        sampleObjectsBtn.addEventListener('click', showSampleObjects);
    }

    // Load Object button
    const loadObjectBtn = document.getElementById('loadObjectBtn');
    if (loadObjectBtn) {
        loadObjectBtn.addEventListener('click', loadObject);
    }

    // Save Object button
    const saveObjectBtn = document.getElementById('saveObjectBtn');
    if (saveObjectBtn) {
        saveObjectBtn.addEventListener('click', saveObject);
    }
}

// Open ShapeForge editor
function openShapeForge() {
    console.log("🎨 Opening ShapeForge editor...");
    
    try {
        if (!shapeForge) {
            // Initialize ShapeForge
            shapeForge = new ShapeForge(resourceManager, shaderEffectsManager);
            window.shapeForge = shapeForge;
        }
        
        // Open the ShapeForge interface
        shapeForge.show();
        
    } catch (error) {
        console.error("❌ Failed to open ShapeForge:", error);
        alert("Failed to open ShapeForge. Check console for details.");
    }
}

// Open 3D Viewer for testing objects
async function open3DViewer() {
    console.log("👁️ Opening 3D Viewer...");
    
    try {
        if (!scene3DController) {
            // Initialize Scene3D
            const viewer3d = document.getElementById('viewer3d');
            scene3DController = new Scene3DController();
            
            // Initialize the 3D scene in the viewer container
            scene3DController.initialize(viewer3d);
            
            // Connect ResourceManager to Scene3DController
            scene3DController.resourceManager = resourceManager;
            
            // Provide minimal data that Scene3DController expects
            scene3DController.markers = [];
            scene3DController.rooms = [];
            scene3DController.textures = [];
            scene3DController.tokens = [];
            scene3DController.props = [];
            scene3DController.dayNightCycle = null;
            
            // Initialize with minimal scene data (like the original maped3d)
            await scene3DController.initializeWithData({
                rooms: [],
                textures: {},
                tokens: [],
                cellSize: 50,
                playerStart: { x: 0, y: 0 },
                baseImage: { width: 1000, height: 1000 }, // Minimal base image dimensions
                markers: [],
                textureManager: null,
                props: []
            });
            
            // Initialize the 3D scene (this creates the camera, lights, controls)
            await scene3DController.init3DScene(() => {}); // Empty progress callback
            
            // Initialize physics system
            if (window.PhysicsController) {
                scene3DController.physics = new PhysicsController(scene3DController);
                console.log("✅ PhysicsController initialized");
            } else {
                console.warn("⚠️ PhysicsController not available");
                // Provide a minimal physics object to prevent errors
                scene3DController.physics = {
                    update: () => 1.7, // Return default eye height
                    checkWalkingSurface: () => {},
                    insideRoomWall: false,
                    onTopOfWall: false,
                    currentGroundHeight: 0
                };
            }
            
            // Initialize shader effects manager with scene3D
            if (scene3DController && !shaderEffectsManager) {
                shaderEffectsManager = new ShaderEffectsManager(scene3DController);
                window.shaderEffectsManager = shaderEffectsManager;
            }
            
            // Set up exit controls
            setupViewerControls();
        }
        
        // Show the 3D viewer
        const welcomeScreen = document.getElementById('welcomeScreen');
        const viewer3d = document.getElementById('viewer3d');
        
        welcomeScreen.classList.add('hidden');
        viewer3d.style.display = 'block';
        viewer3d.classList.add('active');
        
        // Start the 3D scene animation
        scene3DController.isActive = true;
        scene3DController.animate();
        
        // If we have a current object, load it
        if (currentObject) {
            loadObjectIntoViewer(currentObject);
        }
        
    } catch (error) {
        console.error("❌ Failed to open 3D Viewer:", error);
        alert("Failed to open 3D Viewer. Check console for details.");
    }
}

function setupViewerControls() {
    // Listen for 'E' key to exit 3D mode
    document.addEventListener('keydown', (event) => {
        if (event.key.toLowerCase() === 'e' && scene3DController && scene3DController.isActive) {
            exit3DViewer();
        }
    });
}

function exit3DViewer() {
    console.log("🚪 Exiting 3D Viewer...");
    
    if (scene3DController) {
        scene3DController.isActive = false;
        scene3DController.cleanup();
    }
    
    // Hide the 3D viewer and show welcome screen
    const welcomeScreen = document.getElementById('welcomeScreen');
    const viewer3d = document.getElementById('viewer3d');
    
    viewer3d.style.display = 'none';
    viewer3d.classList.remove('active');
    welcomeScreen.classList.remove('hidden');
}

// Show sample objects browser
function showSampleObjects() {
    console.log("📦 Showing sample objects...");
    
    // Create a dialog to show sample objects
    const dialog = document.createElement('sl-dialog');
    dialog.label = 'Sample Objects';
    dialog.style.setProperty('--width', '800px');
    
    dialog.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; max-height: 60vh; overflow-y: auto;">
            <!-- Sample objects will be loaded here -->
            <div id="sampleObjectsList">Loading sample objects...</div>
        </div>
        
        <div slot="footer">
            <sl-button variant="neutral" onclick="this.closest('sl-dialog').hide()">Close</sl-button>
        </div>
    `;
    
    document.body.appendChild(dialog);
    dialog.show();
    
    // Load sample objects
    loadSampleObjectsList();
}

async function loadSampleObjectsList() {
    const container = document.getElementById('sampleObjectsList');
    
    // Sample object files (based on what you have)
    const sampleFiles = [
        'Chest.shapeforge.json',
        'Pillar.shapeforge.json', 
        'Statue.shapeforge.json',
        'TexturedPillar2.shapeforge.json',
        'TexturedStatue.shapeforge.json',
        'TexturedStatue2.shapeforge.json',
        'woodBlock.shapeforge.json',
        'Fireball_d20.shapeforge.json',
        'magic_d20.shapeforge.json',
        'Dungeon Entrance.shapeforge.json',
        'Exit.shapeforge.json',
        'FireMarker.shapeforge.json',
        'Not-Statue.shapeforge.json'
    ];
    
    console.log(`📂 Loading ${sampleFiles.length} sample files...`);
    container.innerHTML = '<div style="text-align: center; padding: 20px;">Loading sample objects...</div>';
    
    let loadedCount = 0;
    
    for (const filename of sampleFiles) {
        try {
            console.log(`📄 Trying to load: ${filename}`);
            const response = await fetch(`assets/sampleObjects/ShapeForge/${filename}`);
            if (!response.ok) {
                console.warn(`❌ Failed to load ${filename}: ${response.status}`);
                continue;
            }
            
            const objectData = await response.json();
            console.log(`✅ Loaded ${filename}:`, objectData.name);
            
            // Create object card
            const card = document.createElement('div');
            card.style.cssText = `
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                background: white;
            `;
            
            card.innerHTML = `
                <div style="text-align: center;">
                    ${objectData.thumbnail ? 
                        `<img src="${objectData.thumbnail}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;" />` :
                        `<div style="width: 100%; height: 120px; background: #f0f0f0; border-radius: 4px; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; color: #666;">
                            <span class="material-icons" style="font-size: 48px;">3d_rotation</span>
                        </div>`
                    }
                    <div style="font-weight: bold; margin-bottom: 4px;">${objectData.name}</div>
                    <div style="font-size: 12px; color: #666;">Click to load</div>
                </div>
            `;
            
            card.addEventListener('click', () => {
                loadSampleObject(filename, objectData);
                card.closest('sl-dialog').hide();
            });
            
            card.addEventListener('mouseover', () => {
                card.style.transform = 'translateY(-2px)';
                card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            });
            
            card.addEventListener('mouseout', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = 'none';
            });
            
            if (loadedCount === 0) {
                container.innerHTML = ''; // Clear loading message
            }
            
            container.appendChild(card);
            loadedCount++;
            
        } catch (error) {
            console.warn(`❌ Could not load sample object: ${filename}`, error);
        }
    }
    
    if (loadedCount === 0) {
        container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No sample objects found</div>';
    } else {
        console.log(`✅ Loaded ${loadedCount} sample objects`);
    }
}

function loadSampleObject(filename, objectData) {
    console.log(`📦 Loading sample object: ${filename}`);
    currentObject = objectData;
    
    // Show a success message
    const alert = document.createElement('div');
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 12px 16px;
        border-radius: 4px;
        z-index: 10000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    alert.textContent = `Loaded: ${objectData.name}`;
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 3000);
    
    // Automatically open the 3D viewer to show the object
    setTimeout(async () => {
        await open3DViewer();
    }, 100);
}

function loadObjectIntoViewer(objectData) {
    if (!scene3DController) {
        console.warn("Scene3D not available, opening 3D viewer first");
        open3DViewer().then(() => {
            // Retry after initialization
            setTimeout(() => loadObjectIntoViewer(objectData), 500);
        });
        return;
    }
    
    if (!window.ShapeForgeParser) {
        console.warn("ShapeForgeParser not available");
        return;
    }
    
    try {
        // Use ShapeForgeParser to load the object into the scene
        const parser = new ShapeForgeParser(
            scene3DController.scene, 
            resourceManager, 
            shaderEffectsManager
        );
        const result = parser.loadModelFromJson(objectData);
        
        if (result) {
            // Clear previous objects (optional)
            if (scene3DController.scene) {
                // Remove existing ShapeForge objects
                const objectsToRemove = [];
                scene3DController.scene.traverse((child) => {
                    if (child.userData && child.userData.isShapeForgeObject) {
                        objectsToRemove.push(child);
                    }
                });
                objectsToRemove.forEach(obj => scene3DController.scene.remove(obj));
                
                // Handle result - could be single object or array
                const objects = Array.isArray(result) ? result : [result];
                
                objects.forEach(mesh => {
                    if (mesh && mesh.isObject3D) {
                        // Ensure userData exists and mark this object as a ShapeForge object
                        if (!mesh.userData) {
                            mesh.userData = {};
                        }
                        mesh.userData.isShapeForgeObject = true;
                        
                        // Add the object to the scene
                        scene3DController.scene.add(mesh);
                    }
                });
                
                console.log(`✅ Object "${objectData.name}" loaded into 3D viewer (${objects.length} meshes)`);
            } else {
                console.warn("Scene3D scene not ready");
            }
        } else {
            console.warn("Failed to parse ShapeForge object");
        }
        
    } catch (error) {
        console.error("Failed to load object into viewer:", error);
    }
}

// Load object from file
function loadObject() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.shapeforge.json,.json';
    
    input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const objectData = JSON.parse(e.target.result);
                    currentObject = objectData;
                    console.log(`📁 Loaded object: ${objectData.name}`);
                    
                    // Show success message
                    alert(`Loaded object: ${objectData.name}`);
                    
                } catch (error) {
                    console.error("Failed to load object:", error);
                    alert("Failed to load object. Make sure it's a valid ShapeForge file.");
                }
            };
            reader.readAsText(file);
        }
    };
    
    input.click();
}

// Save current object
function saveObject() {
    if (!currentObject) {
        alert("No object to save. Create or load an object first.");
        return;
    }
    
    const dataStr = JSON.stringify(currentObject, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `${currentObject.name || 'object'}.shapeforge.json`;
    link.click();
    
    console.log(`💾 Saved object: ${currentObject.name}`);
}

// Make functions globally available
window.openShapeForge = openShapeForge;
window.showSampleObjects = showSampleObjects;