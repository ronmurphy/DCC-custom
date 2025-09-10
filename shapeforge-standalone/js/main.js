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
        // Initialize ResourceManager exactly like maped3d does
        if (window.ResourceManager) {
            resourceManager = new window.ResourceManager();
            window.resourceManager = resourceManager;
            console.log("✅ ResourceManager initialized and set globally");
        } else {
            console.error("❌ ResourceManager class not available!");
        }

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
            console.log("🔧 Initializing Scene3DController...");
            
            // Initialize Scene3D
            const viewer3d = document.getElementById('viewer3d');
            if (!viewer3d) {
                console.error("❌ viewer3d element not found!");
                return;
            }
            
            scene3DController = new Scene3DController();
            
            // Connect ResourceManager BEFORE initialization (like maped3d does)
            if (resourceManager) {
                scene3DController.resourceManager = resourceManager;
                console.log("🔗 Connected ResourceManager to Scene3DController");
            } else {
                console.warn("⚠️ ResourceManager not available for Scene3DController");
            }
            
            // Initialize the 3D scene in the viewer container
            console.log("🎬 Initializing 3D scene...");
            scene3DController.initialize(viewer3d);
            
            // Provide minimal data that Scene3DController expects
            scene3DController.markers = [];
            scene3DController.rooms = [];
            scene3DController.textures = [];
            scene3DController.tokens = [];
            scene3DController.props = [];
            scene3DController.dayNightCycle = null;
            
            console.log("📋 Preparing scene data...");
            
            // Create base image for mini-map
            const baseImage = new Image();
            baseImage.src = 'assets/grid-texture.png';
            
            // Initialize with minimal scene data (like the original maped3d)
            await scene3DController.initializeWithData({
                rooms: [],
                textures: {},
                tokens: [],
                cellSize: 50,
                playerStart: { x: 0, y: 0 },
                baseImage: baseImage, // Use actual image for mini-map
                markers: [],
                textureManager: null,
                props: []
            });
            
            console.log("✅ Scene data initialized");
            
            // Initialize the 3D scene (this creates the camera, lights, controls)
            await scene3DController.init3DScene(() => {
                console.log("📈 3D scene initialization progress...");
            });
            
            console.log("✅ 3D scene initialized");
            console.log("📷 Camera:", scene3DController.camera ? "✅ Ready" : "❌ Missing");
            console.log("🎬 Scene:", scene3DController.scene ? "✅ Ready" : "❌ Missing");
            console.log("🎮 Renderer:", scene3DController.renderer ? "✅ Ready" : "❌ Missing");
            
            // PhysicsController should be automatically created by Scene3DController.initializeWithData
            if (scene3DController.physics) {
                console.log("✅ PhysicsController initialized by Scene3DController");
            } else {
                console.warn("⚠️ PhysicsController not initialized by Scene3DController");
            }
            
            // Initialize shader effects manager with scene3D
            if (scene3DController && !shaderEffectsManager) {
                shaderEffectsManager = new ShaderEffectsManager(scene3DController);
                window.shaderEffectsManager = shaderEffectsManager;
                console.log("✅ ShaderEffectsManager initialized");
            }
            
            // Set up exit controls
            setupViewerControls();
            console.log("🎮 Viewer controls setup complete");
        }
        
        // Show the 3D viewer
        const welcomeScreen = document.getElementById('welcomeScreen');
        const viewer3d = document.getElementById('viewer3d');
        
        if (!welcomeScreen || !viewer3d) {
            console.error("❌ UI elements not found!");
            return;
        }
        
        console.log("🎭 Switching to 3D viewer interface...");
        welcomeScreen.classList.add('hidden');
        viewer3d.style.display = 'block';
        viewer3d.classList.add('active');
        
        // Start continuous animation loop like maped3d does
        scene3DController.isActive = true;
        
        const animate = () => {
            if (scene3DController.isActive && viewer3d.classList.contains('active')) {
                requestAnimationFrame(animate);
                scene3DController.animate();
            }
        };
        animate();
        console.log("🎬 3D scene animation loop started");
        
        // Add window resize handler like maped3d
        const handleResize = () => {
            const viewer = document.getElementById('viewer3d');
            if (viewer && scene3DController.renderer && scene3DController.camera) {
                const width = viewer.offsetWidth;
                const height = viewer.offsetHeight;
                scene3DController.renderer.setSize(width, height);
                scene3DController.camera.aspect = width / height;
                scene3DController.camera.updateProjectionMatrix();
            }
        };
        window.addEventListener('resize', handleResize);
        
        // Trigger initial resize to ensure proper sizing
        setTimeout(handleResize, 100);
        
        // If we have a current object, load it
        if (currentObject) {
            console.log("📦 Loading current object into viewer...");
            setTimeout(() => {
                loadObjectIntoViewer(currentObject);
            }, 500); // Give scene time to fully initialize
        } else {
            console.log("ℹ️ No current object to load");
        }
        
    } catch (error) {
        console.error("❌ Failed to open 3D Viewer:", error);
        console.error("Stack trace:", error.stack);
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
    console.log("🔧 loadObjectIntoViewer called with:", objectData.name);
    
    if (!scene3DController) {
        console.warn("Scene3D not available, opening 3D viewer first");
        open3DViewer().then(() => {
            // Retry after initialization
            setTimeout(() => loadObjectIntoViewer(objectData), 500);
        });
        return;
    }
    
    if (!scene3DController.scene) {
        console.warn("Scene3D scene not ready, retrying in 1 second...");
        setTimeout(() => loadObjectIntoViewer(objectData), 1000);
        return;
    }
    
    if (!window.ShapeForgeParser) {
        console.error("❌ ShapeForgeParser not available");
        return;
    }
    
    try {
        console.log("🎯 Attempting to parse object with ShapeForgeParser...");
        
        // Use ShapeForgeParser to load the object into the scene
        const parser = new ShapeForgeParser(
            scene3DController.scene, 
            resourceManager, 
            shaderEffectsManager
        );
        const result = parser.loadModelFromJson(objectData);
        
        console.log("📊 Parser result:", result);
        
        if (result) {
            // Clear previous objects (optional)
            if (scene3DController.scene) {
                console.log("🧹 Clearing previous ShapeForge objects...");
                // Remove existing ShapeForge objects
                const objectsToRemove = [];
                scene3DController.scene.traverse((child) => {
                    if (child.userData && child.userData.isShapeForgeObject) {
                        objectsToRemove.push(child);
                    }
                });
                objectsToRemove.forEach(obj => scene3DController.scene.remove(obj));
                console.log(`🗑️ Removed ${objectsToRemove.length} previous objects`);
                
                // Handle result - could be single object or array
                const objects = Array.isArray(result) ? result : [result];
                console.log(`📦 Processing ${objects.length} objects...`);
                
                objects.forEach((obj, index) => {
                    // Extract the actual Three.js mesh from ShapeForge object structure
                    let mesh = null;
                    
                    if (obj && obj.mesh && obj.mesh.isObject3D) {
                        // ShapeForge object with mesh property
                        mesh = obj.mesh;
                        console.log(`📦 Extracted mesh from ShapeForge object ${index + 1}:`, mesh);
                    } else if (obj && obj.isObject3D) {
                        // Direct Three.js object
                        mesh = obj;
                        console.log(`📦 Using direct Three.js object ${index + 1}:`, mesh);
                    } else {
                        console.warn(`⚠️ Object ${index + 1} has no valid mesh:`, obj);
                        return; // Skip this object
                    }
                    
                    if (mesh && mesh.isObject3D) {
                        console.log(`➕ Adding object ${index + 1}/${objects.length} to scene:`, mesh);
                        
                        // Ensure userData exists and mark this object as a ShapeForge object
                        if (!mesh.userData) {
                            mesh.userData = {};
                        }
                        mesh.userData.isShapeForgeObject = true;
                        
                        // Make it visible
                        mesh.visible = true;
                        
                        // Scale it up if it's too small to see
                        if (mesh.scale.length() < 0.1) {
                            mesh.scale.multiplyScalar(10);
                            console.log("🔍 Scaled up small object");
                        }
                        
                        // Add the object to the scene
                        scene3DController.scene.add(mesh);
                        
                        console.log(`✅ Object ${index + 1} added. Position:`, mesh.position, "Scale:", mesh.scale);
                    } else {
                        console.warn(`⚠️ Object ${index + 1} mesh is not a valid Three.js object:`, mesh);
                    }
                });
                
                // Move camera to see the object better
                if (scene3DController.camera) {
                    scene3DController.camera.position.set(5, 3, 5);
                    scene3DController.camera.lookAt(0, 0, 0);
                    console.log("📷 Camera positioned to view object");
                }
                
                // Add some basic lighting if missing
                const ambientLight = scene3DController.scene.getObjectByName('ambientLight');
                if (!ambientLight) {
                    const ambient = new THREE.AmbientLight(0x404040, 1);
                    ambient.name = 'ambientLight';
                    scene3DController.scene.add(ambient);
                    console.log("💡 Added ambient lighting");
                }
                
                const directionalLight = scene3DController.scene.getObjectByName('directionalLight');
                if (!directionalLight) {
                    const light = new THREE.DirectionalLight(0xffffff, 1);
                    light.position.set(10, 10, 5);
                    light.name = 'directionalLight';
                    scene3DController.scene.add(light);
                    console.log("🔦 Added directional lighting");
                }
                
                // Add a simple grid floor for reference
                const existingGrid = scene3DController.scene.getObjectByName('referenceGrid');
                if (!existingGrid) {
                    const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0xcccccc);
                    gridHelper.name = 'referenceGrid';
                    scene3DController.scene.add(gridHelper);
                    console.log("📐 Added reference grid");
                }
                
                console.log(`✅ Object "${objectData.name}" loaded into 3D viewer (${objects.length} meshes)`);
                console.log("🎬 Current scene children count:", scene3DController.scene.children.length);
            } else {
                console.error("❌ Scene3D scene not ready");
            }
        } else {
            console.error("❌ Failed to parse ShapeForge object - parser returned null/undefined");
        }
        
    } catch (error) {
        console.error("❌ Failed to load object into viewer:", error);
        console.error("Stack trace:", error.stack);
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