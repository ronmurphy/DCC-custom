/**
 * Enhanced NPC Generator Module
 * Ported from StoryTeller.mobile.old with improvements
 * Integrates with existing DCCUtilities and data systems
 */

class NPCGenerator {
    constructor() {
        this.currentNPC = null;
        this.savedNPCs = this.loadSavedNPCs();
        
        // Initialize utilities if available
        this.utils = window.dccUtilities || null;
        this.mechanics = window.dccMechanics || null;
        
        // Initialize data - will try to use JSON data if available
        this.initializeData();
    }

    /**
     * Initialize NPC data - prefer JSON data loader if available
     */
    initializeData() {
        // Try to use JSON data loader first
        if (window.jsonDataLoader) {
            this.initializeFromJSON();
        } else {
            this.initializeStaticData();
        }
    }

    /**
     * Initialize from JSON data loader (preferred)
     */
    async initializeFromJSON() {
        try {
            // Use existing JSON data if available
            if (window.jsonDataLoader) {
                const races = await window.jsonDataLoader.getRaces();
                const classes = await window.jsonDataLoader.getClasses(); 
                const jobs = await window.jsonDataLoader.getJobs();
                
                // Convert to NPC format
                this.npcRaces = this.convertRacesToNPCFormat(races);
                this.npcClasses = this.convertClassesToNPCFormat(classes);
                this.npcBackgrounds = this.convertJobsToBackgrounds(jobs);
            }
        } catch (error) {
            console.warn('Could not load JSON data, falling back to static data:', error);
            this.initializeStaticData();
        }
    }

    /**
     * Convert races from JSON format to NPC format
     */
    convertRacesToNPCFormat(races) {
        const npcRaces = {};
        
        Object.values(races).flat().forEach(race => {
            const key = race.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            npcRaces[key] = {
                name: race.name,
                icon: race.icon || '👤',
                statBonus: this.parseStatBonus(race.description),
                category: race.category || 'fantasy'
            };
        });
        
        return npcRaces;
    }

    /**
     * Convert classes from JSON format to NPC format
     */
    convertClassesToNPCFormat(classes) {
        const npcClasses = {};
        
        Object.values(classes).flat().forEach(charClass => {
            const key = charClass.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            npcClasses[key] = {
                name: charClass.name,
                skills: this.extractSkillsFromDescription(charClass.description),
                category: charClass.category || 'traditional'
            };
        });
        
        return npcClasses;
    }

    /**
     * Convert jobs to backgrounds
     */
    convertJobsToBackgrounds(jobs) {
        const backgrounds = {};
        
        Object.values(jobs).flat().forEach(job => {
            const key = job.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            backgrounds[key] = {
                name: job.name,
                skills: this.extractSkillsFromDescription(job.description),
                category: job.category || 'professional'
            };
        });
        
        return backgrounds;
    }

    /**
     * Initialize static data as fallback
     */
    initializeStaticData() {
        this.npcRaces = {
            human: { name: 'Human', icon: '👤', statBonus: { charisma: 1 }, category: 'fantasy' },
            elf: { name: 'Elf', icon: '🧝', statBonus: { dexterity: 1 }, category: 'fantasy' },
            dwarf: { name: 'Dwarf', icon: '⛏️', statBonus: { constitution: 1 }, category: 'fantasy' },
            orc: { name: 'Orc', icon: '💪', statBonus: { strength: 1 }, category: 'fantasy' },
            halfling: { name: 'Halfling', icon: '🍄', statBonus: { dexterity: 1 }, category: 'fantasy' },
            dragonborn: { name: 'Dragonborn', icon: '🐲', statBonus: { strength: 1 }, category: 'fantasy' },
            tiefling: { name: 'Tiefling', icon: '😈', statBonus: { charisma: 1 }, category: 'fantasy' },
            gnome: { name: 'Gnome', icon: '🧙', statBonus: { intelligence: 1 }, category: 'fantasy' },
            goblin: { name: 'Goblin', icon: '👺', statBonus: { dexterity: 1 }, category: 'fantasy' },
            ghoul: { name: 'Ghoul', icon: '☠️', statBonus: { constitution: 1 }, category: 'apocalypse' },
            cyborg: { name: 'Cyborg', icon: '🤖', statBonus: { intelligence: 1 }, category: 'modern' },
            mutant: { name: 'Mutant', icon: '☢️', statBonus: { constitution: 1 }, category: 'apocalypse' }
        };

        this.npcBackgrounds = {
            merchant: { name: 'Merchant', skills: ['Persuasion', 'Appraisal'], category: 'professional' },
            guard: { name: 'Guard', skills: ['Intimidation', 'Combat Training'], category: 'service' },
            scholar: { name: 'Scholar', skills: ['Research', 'Ancient Lore'], category: 'professional' },
            farmer: { name: 'Farmer', skills: ['Animal Handling', 'Survival'], category: 'physical' },
            thief: { name: 'Thief', skills: ['Stealth', 'Lockpicking'], category: 'creative' },
            noble: { name: 'Noble', skills: ['Persuasion', 'Etiquette'], category: 'professional' },
            sailor: { name: 'Sailor', skills: ['Navigation', 'Weather Sense'], category: 'physical' },
            craftsman: { name: 'Craftsman', skills: ['Crafting', 'Tool Mastery'], category: 'physical' },
            entertainer: { name: 'Entertainer', skills: ['Performance', 'Storytelling'], category: 'creative' },
            hermit: { name: 'Hermit', skills: ['Survival', 'Herb Lore'], category: 'creative' },
            soldier: { name: 'Soldier', skills: ['Combat Tactics', 'Leadership'], category: 'service' },
            priest: { name: 'Priest', skills: ['Divine Knowledge', 'Healing'], category: 'service' },
            spy: { name: 'Spy', skills: ['Deception', 'Information Gathering'], category: 'service' },
            wasteland_scavenger: { name: 'Wasteland Scavenger', skills: ['Salvaging', 'Radiation Resistance'], category: 'physical' }
        };

        this.npcClasses = {
            warrior: { name: 'Warrior', skills: ['Weapon Mastery', 'Shield Bash'], category: 'traditional' },
            rogue: { name: 'Rogue', skills: ['Sneak Attack', 'Poison Knowledge'], category: 'traditional' },
            mage: { name: 'Mage', skills: ['Spellcasting', 'Mana Manipulation'], category: 'traditional' },
            ranger: { name: 'Ranger', skills: ['Tracking', 'Archery'], category: 'traditional' },
            cleric: { name: 'Cleric', skills: ['Divine Healing', 'Turn Undead'], category: 'traditional' },
            barbarian: { name: 'Barbarian', skills: ['Rage', 'Intimidating Roar'], category: 'traditional' },
            bard: { name: 'Bard', skills: ['Bardic Inspiration', 'Charm'], category: 'traditional' },
            paladin: { name: 'Paladin', skills: ['Divine Smite', 'Aura of Protection'], category: 'traditional' },
            sorcerer: { name: 'Sorcerer', skills: ['Raw Magic', 'Metamagic'], category: 'traditional' },
            monk: { name: 'Monk', skills: ['Martial Arts', 'Ki Focus'], category: 'traditional' },
            gunslinger: { name: 'Gunslinger', skills: ['Quick Draw', 'Trick Shot'], category: 'modern' },
            hacker: { name: 'Hacker', skills: ['System Breach', 'Data Mining'], category: 'modern' },
            medic: { name: 'Medic', skills: ['Field Surgery', 'Pharmaceutical Knowledge'], category: 'modern' },
            engineer: { name: 'Engineer', skills: ['Repair', 'Invention'], category: 'modern' }
        };
    }

    /**
     * Parse stat bonus from description text
     */
    parseStatBonus(description) {
        const bonuses = {};
        const stats = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
        
        stats.forEach(stat => {
            const regex = new RegExp(`\\+\\d+\\s+${stat}`, 'i');
            const match = description.match(regex);
            if (match) {
                const bonus = parseInt(match[0].replace(/[^0-9]/g, ''));
                bonuses[stat] = bonus;
            }
        });
        
        return bonuses;
    }

    /**
     * Extract skills from description text
     */
    extractSkillsFromDescription(description) {
        // Simple skill extraction - could be enhanced
        const commonSkills = [
            'Combat', 'Stealth', 'Magic', 'Persuasion', 'Intimidation', 'Healing',
            'Crafting', 'Survival', 'Investigation', 'Performance', 'Athletics'
        ];
        
        const foundSkills = commonSkills.filter(skill => 
            description.toLowerCase().includes(skill.toLowerCase())
        );
        
        return foundSkills.length > 0 ? foundSkills : ['General Skills', 'Specialization'];
    }

    /**
     * Generate a random NPC
     */
    generateRandomNPC() {
        const npcType = document.getElementById('npc-type-select')?.value || 'npc';
        const level = this.rollDice(10); // Random level 1-10
        
        // Generate basic info
        const race = this.getRandomElement(Object.keys(this.npcRaces));
        const background = this.getRandomElement(Object.keys(this.npcBackgrounds));
        const characterClass = this.getRandomElement(Object.keys(this.npcClasses));
        const name = this.generateNPCName();
        
        // Generate stats
        const baseStats = this.generateStats(level);
        
        // Apply racial bonus
        const raceData = this.npcRaces[race];
        if (raceData.statBonus) {
            Object.entries(raceData.statBonus).forEach(([stat, bonus]) => {
                baseStats[stat] = (baseStats[stat] || 0) + bonus;
            });
        }
        
        // Generate skills and equipment first
        const skills = this.generateSkills(background, characterClass);
        const equipment = this.generateEquipment(characterClass, level);
        
        // Calculate derived stats based on game rules
        // HP = CON + DEX (as per user clarification)
        const healthPoints = baseStats.constitution + baseStats.dexterity;
        const magicPoints = baseStats.wisdom + baseStats.intelligence;
        
        // AC = Base 10 + armor bonuses + DEX modifier (as per game-reference.md)
        const armorClass = this.calculateArmorClass(baseStats.dexterity, equipment);
        
        // Create NPC object
        this.currentNPC = {
            id: this.generateId(),
            name: name,
            type: npcType,
            level: level,
            race: race,
            background: background,
            characterClass: characterClass,
            stats: baseStats,
            healthPoints: healthPoints,
            magicPoints: magicPoints,
            armorClass: armorClass,
            skills: skills,
            equipment: equipment,
            notes: this.generateNotes(npcType),
            timestamp: new Date().toISOString()
        };
        
        this.displayNPC(this.currentNPC);
        return this.currentNPC;
    }

    /**
     * Generate stats for NPC
     */
    generateStats(level) {
        return {
            strength: this.rollDice(4) + level,
            dexterity: this.rollDice(4) + level,
            constitution: this.rollDice(4) + level,
            intelligence: this.rollDice(4) + level,
            wisdom: this.rollDice(4) + level,
            charisma: this.rollDice(4) + level
        };
    }

    /**
     * Generate skills for NPC
     */
    generateSkills(background, characterClass) {
        const skills = [];
        const backgroundSkills = this.npcBackgrounds[background]?.skills || [];
        const classSkills = this.npcClasses[characterClass]?.skills || [];
        
        if (backgroundSkills.length > 0) {
            skills.push({
                name: this.getRandomElement(backgroundSkills),
                source: 'background',
                level: this.rollDice(3) + 1
            });
        }
        
        if (classSkills.length > 0) {
            skills.push({
                name: this.getRandomElement(classSkills),
                source: 'class',
                level: this.rollDice(3) + 1
            });
        }
        
        return skills;
    }

    /**
     * Generate equipment for NPC
     */
    generateEquipment(characterClass, level) {
        const equipment = {
            weapons: [],
            armor: null,
            items: []
        };
        
        // Basic weapon based on class
        const weapons = this.getWeaponsForClass(characterClass);
        if (weapons.length > 0) {
            equipment.weapons.push(this.getRandomElement(weapons));
        }
        
        // Basic armor
        equipment.armor = this.getArmorForLevel(level);
        
        // Random items
        const itemCount = this.rollDice(3);
        for (let i = 0; i < itemCount; i++) {
            equipment.items.push(this.getRandomElement(this.npcItems));
        }
        
        return equipment;
    }

    /**
     * Get weapons suitable for a class
     */
    getWeaponsForClass(characterClass) {
        const weaponSets = {
            warrior: ['Sword', 'War Hammer', 'Spear'],
            rogue: ['Dagger', 'Short Sword', 'Crossbow'],
            mage: ['Staff', 'Wand', 'Dagger'],
            ranger: ['Bow', 'Spear', 'Hunting Knife'],
            cleric: ['Mace', 'Staff', 'Shield'],
            gunslinger: ['Pistol', 'Rifle', 'Knife'],
            default: ['Club', 'Knife', 'Staff']
        };
        
        return weaponSets[characterClass] || weaponSets.default;
    }

    /**
     * Get armor for level
     */
    getArmorForLevel(level) {
        if (level <= 3) return 'Leather Armor';
        if (level <= 6) return 'Chain Mail';
        if (level <= 9) return 'Plate Armor';
        return 'Enchanted Armor';
    }

    /**
     * Generate contextual notes
     */
    generateNotes(npcType) {
        const notes = {
            npc: [
                'Friendly and helpful to travelers',
                'Has useful local information',
                'Might offer a quest or job',
                'Could become a recurring ally',
                'Has interesting rumors to share'
            ],
            encounter: [
                'Hostile towards strangers',
                'Guards something valuable',
                'Looking for trouble',
                'Has a grudge against someone',
                'Territorial and aggressive'
            ]
        };
        
        const noteList = notes[npcType] || notes.npc;
        return this.getRandomElement(noteList);
    }

    /**
     * Calculate Armor Class based on game rules
     * AC = Base 10 + armor bonuses + DEX modifier
     */
    calculateArmorClass(dexterity, equipment) {
        const baseAC = 10;
        const dexModifier = dexterity - 10; // Standard D&D modifier calculation
        
        // Get armor bonus based on equipment
        let armorBonus = 0;
        if (equipment && equipment.armor) {
            const armor = equipment.armor.toLowerCase();
            if (armor.includes('leather')) {
                armorBonus = 1; // +1 for leather
            } else if (armor.includes('chain') || armor.includes('mail')) {
                armorBonus = 2; // +2 for chain
            } else if (armor.includes('plate') || armor.includes('enchanted') || armor.includes('scale') || armor.includes('splint')) {
                armorBonus = 3; // +3 for higher medieval/D&D-like armors
            }
        }
        
        return baseAC + armorBonus + Math.floor(dexModifier / 2); // Use half DEX modifier to keep numbers reasonable
    }

    /**
     * Display NPC in the interface
     */
    displayNPC(npc) {
        const container = document.getElementById('generated-npc');
        if (!container) return;
        
        const raceData = this.npcRaces[npc.race];
        const backgroundData = this.npcBackgrounds[npc.background];
        const classData = this.npcClasses[npc.characterClass];
        
        container.innerHTML = `
            <div class="npc-display">
                <div class="npc-card">
                    <div class="npc-header">
                        <div class="npc-portrait ${npc.type}">
                            ${raceData?.icon || '👤'}
                        </div>
                        <div class="npc-header-info">
                            <h4 class="npc-name">${npc.name}</h4>
                            <span class="npc-type-badge ${npc.type}">
                                ${npc.type === 'npc' ? '🤝 Friendly' : '⚔️ Encounter'}
                            </span>
                        </div>
                        <div class="npc-vital-stats">
                            <div class="vital-stat">
                                <span class="vital-label">HP</span>
                                <span class="vital-value">${npc.hitPoints || npc.healthPoints || 'N/A'}</span>
                            </div>
                            <div class="vital-stat">
                                <span class="vital-label">AC</span>
                                <span class="vital-value">${npc.armorClass || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="npc-details">
                        <div class="npc-info-grid">
                            <div class="npc-basic-info">
                                <div class="info-item">
                                    <span class="info-label">Level</span>
                                    <span class="info-value">${npc.level}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Race</span>
                                    <span class="info-value">${raceData?.name || 'Unknown'}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Background</span>
                                    <span class="info-value">${backgroundData?.name || 'Unknown'}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Class</span>
                                    <span class="info-value">${classData?.name || 'Unknown'}</span>
                                </div>
                            </div>
                            
                            <div class="npc-stats">
                                <div class="stats-header">Attributes</div>
                                <div class="stat-grid">
                                    <div class="stat-item">
                                        <span class="stat-label">STR</span>
                                        <span class="stat-value">${npc.stats?.strength || npc.strength || 'N/A'}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">DEX</span>
                                        <span class="stat-value">${npc.stats?.dexterity || npc.dexterity || 'N/A'}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">CON</span>
                                        <span class="stat-value">${npc.stats?.constitution || npc.constitution || 'N/A'}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">INT</span>
                                        <span class="stat-value">${npc.stats?.intelligence || npc.intelligence || 'N/A'}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">WIS</span>
                                        <span class="stat-value">${npc.stats?.wisdom || npc.wisdom || 'N/A'}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">CHA</span>
                                        <span class="stat-value">${npc.stats?.charisma || npc.charisma || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="npc-skills-equipment">
                            <div class="npc-skills">
                                <div class="section-header">Skills</div>
                                <div class="skills-list">
                                    ${npc.skills ? npc.skills.map(skill => 
                                        `<span class="skill-badge">${typeof skill === 'string' ? skill : `${skill.name} (${skill.level})`}</span>`
                                    ).join(' ') : '<span class="no-content">None</span>'}
                                </div>
                            </div>
                            
                            <div class="npc-equipment">
                                <div class="section-header">Equipment</div>
                                <div class="equipment-list">
                                    ${npc.equipment && npc.equipment.weapons && npc.equipment.weapons.length > 0 ? 
                                        `<span><strong>Weapons:</strong> ${npc.equipment.weapons.join(', ')}</span>` : ''}
                                    ${npc.equipment && npc.equipment.armor ? 
                                        `<span><strong>Armor:</strong> ${npc.equipment.armor}</span>` : ''}
                                    ${npc.equipment && npc.equipment.items && npc.equipment.items.length > 0 ? 
                                        `<span><strong>Items:</strong> ${npc.equipment.items.join(', ')}</span>` : ''}
                                    ${(!npc.equipment || (!npc.equipment.weapons?.length && !npc.equipment.armor && !npc.equipment.items?.length)) ? 
                                        '<span class="no-content">None</span>' : ''}
                                </div>
                            </div>
                        </div>
                        
                        ${npc.notes ? `
                        <div class="npc-notes">
                            <div class="section-header">Notes</div>
                            <div class="notes-content">${npc.notes}</div>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="npc-actions-bar">
                        <button class="btn btn-primary" onclick="npcGenerator.saveCurrentNPC()">
                            💾 Save NPC
                        </button>
                        <button class="btn btn-secondary" onclick="npcGenerator.editCurrentNPC()">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-secondary" onclick="npcGenerator.generateRandomNPC()">
                            🎲 Generate New
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate NPC notes based on type
        `;
    }
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Utility functions
     */
    generateId() {
        return this.utils ? this.utils.generateId() : Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    rollDice(sides) {
        return this.mechanics ? this.mechanics.rollDice(1, sides)[0] : Math.floor(Math.random() * sides) + 1;
    }

    getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    generateNPCName() {
        const firstNames = [
            'Aiden', 'Sera', 'Gareth', 'Luna', 'Thane', 'Zara', 'Kael', 'Mira',
            'Dorian', 'Lyra', 'Magnus', 'Nyx', 'Orion', 'Vera', 'Cassius', 'Iris',
            'Marcus', 'Nova', 'Raven', 'Zeke', 'Echo', 'Sage', 'Phoenix', 'Storm'
        ];
        
        const lastNames = [
            'Stormwind', 'Nightfall', 'Ironforge', 'Goldleaf', 'Starweaver', 'Shadowbane',
            'Steel', 'Cross', 'Hunter', 'Stone', 'Black', 'Grey', 'White', 'Fox',
            'Wasteland', 'Ruins', 'Scavenger', 'Survivor', 'Raider', 'Drifter'
        ];
        
        return `${this.getRandomElement(firstNames)} ${this.getRandomElement(lastNames)}`;
    }

    /**
     * Save current NPC
     */
    saveCurrentNPC() {
        if (!this.currentNPC) return;
        
        this.savedNPCs.push({ ...this.currentNPC });
        this.saveSavedNPCs();
        this.displaySavedNPCs();
        
        // Show success message
        this.showMessage('NPC saved successfully!', 'success');
    }

    /**
     * Edit current NPC (placeholder for future implementation)
     */
    editCurrentNPC() {
        if (!this.currentNPC) return;
        
        // For now, just show a message indicating this feature is planned
        this.showMessage('Edit functionality coming soon!', 'info');
    }

    /**
     * Display saved NPCs
     */
    displaySavedNPCs() {
        // Try new container structure first, fall back to old
        let container = document.getElementById('saved-npcs-container');
        if (!container) {
            container = document.getElementById('saved-npcs-grid');
        }
        if (!container) return;
        
        if (this.savedNPCs.length === 0) {
            container.innerHTML = `
                <div class="no-npcs">
                    <i class="ra ra-users"></i>
                    <p>No saved NPCs yet</p>
                    <p>Generate and save some NPCs to see them here</p>
                </div>
            `;
            return;
        }
        
        const filter = document.getElementById('npc-filter')?.value || 'all';
        const filteredNPCs = filter === 'all' ? this.savedNPCs : this.savedNPCs.filter(npc => npc.type === filter);
        
        if (filteredNPCs.length === 0) {
            container.innerHTML = `
                <div class="no-npcs">
                    <i class="ra ra-users"></i>
                    <p>No NPCs match the current filter</p>
                </div>
            `;
            return;
        }
        
        // Use new grid structure for the tabbed interface
        container.innerHTML = `
            <div class="saved-npcs-grid">
                ${filteredNPCs.map(npc => this.createSavedNPCCard(npc)).join('')}
            </div>
        `;
        
        // Update count after displaying NPCs
        if (typeof updateSavedNPCCount === 'function') {
            updateSavedNPCCount();
        }
    }

    /**
     * Create saved NPC card HTML
     */
    createSavedNPCCard(npc) {
        const raceData = this.npcRaces[npc.race];
        
        return `
            <div class="saved-npc-card" data-npc-id="${npc.id}">
                <div class="saved-npc-header">
                    <div class="saved-npc-portrait ${npc.type}">
                        ${raceData?.icon || '👤'}
                    </div>
                    <div class="saved-npc-info">
                        <h5 class="saved-npc-name">${npc.name}</h5>
                        <span class="saved-npc-details">Lvl ${npc.level} ${raceData?.name || 'Unknown'}</span>
                        <span class="saved-npc-type ${npc.type}">
                            ${npc.type === 'npc' ? '🤝' : '⚔️'}
                        </span>
                    </div>
                </div>
                <div class="saved-npc-actions">
                    <button class="btn-small" onclick="npcGenerator.viewNPCModal('${npc.id}')" title="View Details">
                        <i class="material-icons">visibility</i>
                    </button>
                    <button class="btn-small" onclick="npcGenerator.loadNPC('${npc.id}')" title="Load to Editor">
                        <i class="material-icons">edit</i>
                    </button>
                    <button class="btn-small" onclick="npcGenerator.copyNPC('${npc.id}')" title="Copy to Clipboard">
                        <i class="material-icons">content_copy</i>
                    </button>
                    <button class="btn-small danger" onclick="npcGenerator.deleteNPC('${npc.id}')" title="Delete">
                        <i class="material-icons">delete</i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Load saved NPC
     */
    loadNPC(npcId) {
        const npc = this.savedNPCs.find(n => n.id === npcId);
        if (npc) {
            this.currentNPC = { ...npc };
            this.displayNPC(this.currentNPC);
            
            // Switch to New NPC tab to show the loaded NPC
            if (typeof switchNPCTab === 'function') {
                switchNPCTab('new');
            }
            
            this.showMessage(`Loaded ${npc.name} for editing`, 'success');
        }
    }

    /**
     * View NPC in modal
     */
    viewNPCModal(npcId) {
        const npc = this.savedNPCs.find(n => n.id === npcId);
        if (!npc) return;
        
        // Create modal if it doesn't exist
        if (!document.getElementById('npc-modal')) {
            this.createNPCModal();
        }
        
        // Populate modal with NPC data
        this.populateNPCModal(npc);
        
        // Show modal
        const modal = document.getElementById('npc-modal');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    /**
     * Create NPC modal
     */
    createNPCModal() {
        const modalHTML = `
            <div id="npc-modal" class="npc-modal" onclick="npcGenerator.closeNPCModal(event)">
                <div class="npc-modal-content" onclick="event.stopPropagation()">
                    <div class="npc-modal-header">
                        <h3 class="npc-modal-title">NPC Details</h3>
                        <div class="npc-modal-controls">
                            <button class="btn-modal-flag" id="npc-flag-btn" onclick="npcGenerator.toggleNPCFlag()" title="Toggle Map Flag (Coming Soon)">
                                <i class="ra ra-map-marker"></i>
                                <span>Flag for Map</span>
                            </button>
                            <button class="btn-modal-close" onclick="npcGenerator.closeNPCModal()">
                                <i class="ra ra-close"></i>
                            </button>
                        </div>
                    </div>
                    <div class="npc-modal-body" id="npc-modal-body">
                        <!-- NPC content will be populated here -->
                    </div>
                    <div class="npc-modal-footer">
                        <button class="btn-secondary" onclick="npcGenerator.editNPCFromModal()">
                            <i class="ra ra-edit"></i> Edit NPC
                        </button>
                        <button class="btn-secondary" onclick="npcGenerator.copyNPCFromModal()">
                            <i class="ra ra-copy"></i> Copy to Clipboard
                        </button>
                        <button class="btn-secondary" onclick="npcGenerator.closeNPCModal()">
                            <i class="ra ra-close"></i> Close
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Populate modal with NPC data
     */
    populateNPCModal(npc) {
        const modalBody = document.getElementById('npc-modal-body');
        if (!modalBody) return;
        
        // Store current NPC for modal actions
        this.modalNPC = npc;
        
        // Use the same display format as the main view
        const raceData = this.npcRaces[npc.race];
        const backgroundData = this.npcBackgrounds[npc.background];
        const classData = this.npcClasses[npc.characterClass];
        
        modalBody.innerHTML = `
            <div class="npc-display modal-npc-display">
                <div class="npc-card">
                    <div class="npc-header">
                        <div class="npc-portrait ${npc.type}">
                            ${raceData?.icon || '👤'}
                        </div>
                        <div class="npc-header-info">
                            <h4 class="npc-name">${npc.name}</h4>
                            <span class="npc-type-badge ${npc.type}">
                                ${npc.type === 'npc' ? '🤝 Friendly' : '⚔️ Encounter'}
                            </span>
                        </div>
                        <div class="npc-vital-stats">
                            <div class="vital-stat">
                                <span class="vital-label">HP</span>
                                <span class="vital-value">${npc.hitPoints || npc.healthPoints || 'N/A'}</span>
                            </div>
                            <div class="vital-stat">
                                <span class="vital-label">AC</span>
                                <span class="vital-value">${npc.armorClass || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="npc-details">
                        <div class="npc-info-grid">
                            <div class="npc-basic-info">
                                <div class="info-item">
                                    <span class="info-label">Level</span>
                                    <span class="info-value">${npc.level}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Race</span>
                                    <span class="info-value">${raceData?.name || 'Unknown'}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Background</span>
                                    <span class="info-value">${backgroundData?.name || 'Unknown'}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Class</span>
                                    <span class="info-value">${classData?.name || 'Unknown'}</span>
                                </div>
                            </div>
                            
                            <div class="npc-stats">
                                <div class="stats-header">Attributes</div>
                                <div class="stat-grid">
                                    <div class="stat-item">
                                        <span class="stat-label">STR</span>
                                        <span class="stat-value">${npc.stats?.strength || npc.strength || 'N/A'}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">DEX</span>
                                        <span class="stat-value">${npc.stats?.dexterity || npc.dexterity || 'N/A'}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">CON</span>
                                        <span class="stat-value">${npc.stats?.constitution || npc.constitution || 'N/A'}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">INT</span>
                                        <span class="stat-value">${npc.stats?.intelligence || npc.intelligence || 'N/A'}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">WIS</span>
                                        <span class="stat-value">${npc.stats?.wisdom || npc.wisdom || 'N/A'}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">CHA</span>
                                        <span class="stat-value">${npc.stats?.charisma || npc.charisma || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="npc-skills-equipment">
                            <div class="npc-skills">
                                <div class="section-header">Skills</div>
                                <div class="skills-list">
                                    ${npc.skills ? npc.skills.map(skill => 
                                        `<span class="skill-badge">${typeof skill === 'string' ? skill : `${skill.name} (${skill.level})`}</span>`
                                    ).join(' ') : '<span class="no-content">None</span>'}
                                </div>
                            </div>
                            
                            <div class="npc-equipment">
                                <div class="section-header">Equipment</div>
                                <div class="equipment-list">
                                    ${npc.equipment && npc.equipment.weapons && npc.equipment.weapons.length > 0 ? 
                                        `<span><strong>Weapons:</strong> ${npc.equipment.weapons.join(', ')}</span>` : ''}
                                    ${npc.equipment && npc.equipment.armor ? 
                                        `<span><strong>Armor:</strong> ${npc.equipment.armor}</span>` : ''}
                                    ${npc.equipment && npc.equipment.items && npc.equipment.items.length > 0 ? 
                                        `<span><strong>Items:</strong> ${npc.equipment.items.join(', ')}</span>` : ''}
                                    ${(!npc.equipment || (!npc.equipment.weapons?.length && !npc.equipment.armor && !npc.equipment.items?.length)) ? 
                                        '<span class="no-content">None</span>' : ''}
                                </div>
                            </div>
                        </div>
                        
                        ${npc.notes ? `
                        <div class="npc-notes">
                            <div class="section-header">Notes</div>
                            <div class="notes-content">${npc.notes}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        // Update flag button state (placeholder for future map integration)
        const flagBtn = document.getElementById('npc-flag-btn');
        if (flagBtn) {
            const isFlagged = npc.mapFlagged || false;
            flagBtn.classList.toggle('flagged', isFlagged);
            flagBtn.querySelector('span').textContent = isFlagged ? 'Flagged for Map' : 'Flag for Map';
        }
    }

    /**
     * Close NPC modal
     */
    closeNPCModal(event) {
        if (event && event.target !== event.currentTarget) return;
        
        const modal = document.getElementById('npc-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
        }
        this.modalNPC = null;
    }

    /**
     * Edit NPC from modal
     */
    editNPCFromModal() {
        if (this.modalNPC) {
            this.loadNPC(this.modalNPC.id);
            this.closeNPCModal();
        }
    }

    /**
     * Copy NPC from modal
     */
    copyNPCFromModal() {
        if (this.modalNPC) {
            this.copyNPC(this.modalNPC.id);
        }
    }

    /**
     * Toggle NPC map flag (placeholder for future feature)
     */
    toggleNPCFlag() {
        if (!this.modalNPC) return;
        
        // Find the NPC in saved list and toggle flag
        const npcIndex = this.savedNPCs.findIndex(n => n.id === this.modalNPC.id);
        if (npcIndex !== -1) {
            this.savedNPCs[npcIndex].mapFlagged = !this.savedNPCs[npcIndex].mapFlagged;
            this.modalNPC.mapFlagged = this.savedNPCs[npcIndex].mapFlagged;
            
            // Save to storage
            localStorage.setItem('storyteller_saved_npcs', JSON.stringify(this.savedNPCs));
            
            // Update button state
            const flagBtn = document.getElementById('npc-flag-btn');
            if (flagBtn) {
                const isFlagged = this.modalNPC.mapFlagged;
                flagBtn.classList.toggle('flagged', isFlagged);
                flagBtn.querySelector('span').textContent = isFlagged ? 'Flagged for Map' : 'Flag for Map';
            }
            
            this.showMessage(
                `${this.modalNPC.name} ${this.modalNPC.mapFlagged ? 'flagged for' : 'unflagged from'} map`, 
                'info'
            );
        }
    }

    /**
     * Copy NPC to clipboard
     */
    copyNPC(npcId) {
        const npc = this.savedNPCs.find(n => n.id === npcId);
        if (npc) {
            const npcText = this.formatNPCForCopy(npc);
            navigator.clipboard.writeText(npcText).then(() => {
                this.showMessage('NPC copied to clipboard!', 'success');
            });
        }
    }

    /**
     * Format NPC for copying
     */
    formatNPCForCopy(npc) {
        const raceData = this.npcRaces[npc.race];
        const backgroundData = this.npcBackgrounds[npc.background];
        const classData = this.npcClasses[npc.characterClass];
        
        return `**${npc.name}**
Level ${npc.level} ${raceData?.name || 'Unknown'} ${classData?.name || 'Unknown'}
Background: ${backgroundData?.name || 'Unknown'}

**Stats:** STR ${npc.stats.strength}, DEX ${npc.stats.dexterity}, CON ${npc.stats.constitution}, INT ${npc.stats.intelligence}, WIS ${npc.stats.wisdom}, CHA ${npc.stats.charisma}
**HP:** ${npc.healthPoints} | **MP:** ${npc.magicPoints}

**Skills:** ${npc.skills.map(s => `${s.name} (${s.level})`).join(', ')}
**Equipment:** ${[...npc.equipment.weapons, npc.equipment.armor, ...npc.equipment.items].filter(Boolean).join(', ')}

**Notes:** ${npc.notes}`;
    }

    /**
     * Delete saved NPC
     */
    deleteNPC(npcId) {
        if (confirm('Are you sure you want to delete this NPC?')) {
            this.savedNPCs = this.savedNPCs.filter(n => n.id !== npcId);
            this.saveSavedNPCs();
            this.displaySavedNPCs();
            this.showMessage('NPC deleted successfully!', 'success');
        }
    }

    /**
     * Clear all NPCs
     */
    clearAllNPCs() {
        if (confirm('Are you sure you want to delete ALL saved NPCs? This cannot be undone.')) {
            this.savedNPCs = [];
            this.saveSavedNPCs();
            this.displaySavedNPCs();
            this.showMessage('All NPCs cleared!', 'success');
        }
    }

    /**
     * Storage functions
     */
    loadSavedNPCs() {
        try {
            const saved = localStorage.getItem('storyteller_saved_npcs');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading saved NPCs:', error);
            return [];
        }
    }

    saveSavedNPCs() {
        try {
            localStorage.setItem('storyteller_saved_npcs', JSON.stringify(this.savedNPCs));
        } catch (error) {
            console.error('Error saving NPCs:', error);
        }
    }

    /**
     * Show message to user
     */
    showMessage(message, type = 'info') {
        // Try to use existing message system if available
        if (window.showMessage) {
            window.showMessage(message, type);
        } else {
            // Fallback to simple alert
            alert(message);
        }
    }

    /**
     * Initialize the NPC generator interface
     */
    init() {
        // Initialize UI if elements exist
        this.displaySavedNPCs();
        
        // Update saved count after displaying NPCs
        if (typeof updateSavedNPCCount === 'function') {
            updateSavedNPCCount();
        }
        
        // Set up event listeners
        this.setupEventListeners();
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Filter change
        const filterSelect = document.getElementById('npc-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', () => this.displaySavedNPCs());
        }
    }
}

// Default items list
NPCGenerator.prototype.npcItems = [
    'Health Potion', 'Rope (50ft)', 'Rations (3 days)', 'Gold Coins (2d6)',
    'Lockpicks', 'Healing Herbs', 'Map Fragment', 'Strange Crystal',
    'Old Key', 'Mysterious Letter', 'Silver Pendant', 'Worn Book',
    'Trade Goods', 'Tools of Trade', 'Lucky Charm', 'Family Heirloom',
    'Radiation Detector', 'Scrap Metal', 'Water Purifier', 'Old Photo'
];

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NPCGenerator;
} else {
    window.NPCGenerator = NPCGenerator;
}
