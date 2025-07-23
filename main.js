//<!-- Update 96 - split CSS file, js file to external -->


        // ========================================
        // CORE CHARACTER DATA STRUCTURE
        // ========================================
        let character = {
            name: '',
            level: 1,
            availablePoints: 3,
            stats: {
                strength: 2,
                dexterity: 2,
                constitution: 2,
                intelligence: 2,
                wisdom: 2,
                charisma: 2
            },
            healthPoints: 3,
            currentHealthPoints: 3,
            magicPoints: 4,
            currentMagicPoints: 4,
            customSkills: [],
            personal: {
                age: '',
                backstory: '',
                portrait: null
            },
            job: '',
            customJob: '',
            class: '',
            customClass: '',
            jobBonuses: [],
            classBonuses: [],
            customJobData: {
                selectedStats: [],
                skills: []
            },
            customClassData: {
                selectedStats: [],
                skills: []
            },
            rollHistory: [],
            spells: [],
            inventory: [],
            equipment: {
                mainHand: null,
                offHand: null,
                armor: null,
                accessory: null
            },
            statusEffects: []
        };

        // ========================================
        // GAME DATA DEFINITIONS
        // ========================================
        const standardSkills = {
            'Acrobatics': 'dexterity',
            'Animal Handling': 'wisdom',
            'Arcana': 'intelligence',
            'Athletics': 'strength',
            'Deception': 'charisma',
            'History': 'intelligence',
            'Insight': 'wisdom',
            'Intimidation': 'charisma',
            'Investigation': 'intelligence',
            'Medicine': 'wisdom',
            'Nature': 'intelligence',
            'Perception': 'wisdom',
            'Performance': 'charisma',
            'Persuasion': 'charisma',
            'Religion': 'intelligence',
            'Sleight of Hand': 'dexterity',
            'Stealth': 'dexterity',
            'Survival': 'wisdom'
        };

        const weaponSizes = {
            light: { dice: 4, name: 'Light' },
            medium: { dice: 6, name: 'Medium' },
            heavy: { dice: 8, name: 'Heavy' }
        };

        const jobs = {
            engineer: { name: 'Engineer', statBonuses: { intelligence: 1 }, skills: [{ name: 'Mechanical', stat: 'intelligence' }, { name: 'Electrical', stat: 'intelligence' }] },
            doctor: { name: 'Doctor', statBonuses: { intelligence: 1, wisdom: 1 }, skills: [{ name: 'Surgery', stat: 'dexterity' }, { name: 'Diagnosis', stat: 'intelligence' }] },
            lawyer: { name: 'Lawyer', statBonuses: { intelligence: 1, charisma: 1 }, skills: [{ name: 'Legal Knowledge', stat: 'intelligence' }, { name: 'Negotiation', stat: 'charisma' }] },
            teacher: { name: 'Teacher', statBonuses: { wisdom: 1, charisma: 1 }, skills: [{ name: 'Teaching', stat: 'charisma' }, { name: 'Research', stat: 'intelligence' }] },
            mechanic: { name: 'Mechanic', statBonuses: { dexterity: 1, intelligence: 1 }, skills: [{ name: 'Repair', stat: 'dexterity' }, { name: 'Automotive', stat: 'intelligence' }] },
            police: { name: 'Police Officer', statBonuses: { constitution: 1, wisdom: 1 }, skills: [{ name: 'Law Enforcement', stat: 'wisdom' }, { name: 'Criminal Justice', stat: 'intelligence' }] },
            firefighter: { name: 'Firefighter', statBonuses: { strength: 1, constitution: 1 }, skills: [{ name: 'Emergency Response', stat: 'wisdom' }, { name: 'Physical Rescue', stat: 'strength' }] },
            chef: { name: 'Chef', statBonuses: { dexterity: 1, wisdom: 1 }, skills: [{ name: 'Cooking', stat: 'dexterity' }, { name: 'Food Knowledge', stat: 'intelligence' }] },
            artist: { name: 'Artist', statBonuses: { dexterity: 1, charisma: 1 }, skills: [{ name: 'Visual Arts', stat: 'dexterity' }, { name: 'Art History', stat: 'intelligence' }] },
            programmer: { name: 'Programmer', statBonuses: { intelligence: 2 }, skills: [{ name: 'Programming', stat: 'intelligence' }, { name: 'Systems Analysis', stat: 'intelligence' }] },
            soldier: { name: 'Soldier', statBonuses: { strength: 1, constitution: 1 }, skills: [{ name: 'Military Tactics', stat: 'intelligence' }, { name: 'Combat Training', stat: 'strength' }] },
            athlete: { name: 'Athlete', statBonuses: { strength: 1, dexterity: 1 }, skills: [{ name: 'Sports', stat: 'dexterity' }, { name: 'Physical Training', stat: 'constitution' }] },
            scientist: { name: 'Scientist', statBonuses: { intelligence: 2 }, skills: [{ name: 'Research', stat: 'intelligence' }, { name: 'Scientific Method', stat: 'wisdom' }] },
            musician: { name: 'Musician', statBonuses: { dexterity: 1, charisma: 1 }, skills: [{ name: 'Musical Performance', stat: 'charisma' }, { name: 'Music Theory', stat: 'intelligence' }] },
            writer: { name: 'Writer', statBonuses: { intelligence: 1, charisma: 1 }, skills: [{ name: 'Writing', stat: 'intelligence' }, { name: 'Research', stat: 'intelligence' }] }
        };

        const classes = {
            fighter: { name: 'Fighter', statBonuses: { strength: 1, constitution: 1 }, skills: [{ name: 'Weapon Mastery', stat: 'strength' }, { name: 'Combat Tactics', stat: 'intelligence' }] },
            wizard: { name: 'Wizard', statBonuses: { intelligence: 2 }, skills: [{ name: 'Spellcasting', stat: 'intelligence' }, { name: 'Arcane Lore', stat: 'intelligence' }] },
            rogue: { name: 'Rogue', statBonuses: { dexterity: 2 }, skills: [{ name: 'Sneak Attack', stat: 'dexterity' }, { name: 'Lockpicking', stat: 'dexterity' }] },
            cleric: { name: 'Cleric', statBonuses: { wisdom: 1, charisma: 1 }, skills: [{ name: 'Divine Magic', stat: 'wisdom' }, { name: 'Healing', stat: 'wisdom' }] },
            ranger: { name: 'Ranger', statBonuses: { dexterity: 1, wisdom: 1 }, skills: [{ name: 'Tracking', stat: 'wisdom' }, { name: 'Wilderness Survival', stat: 'wisdom' }] },
            barbarian: { name: 'Barbarian', statBonuses: { strength: 1, constitution: 1 }, skills: [{ name: 'Rage', stat: 'strength' }, { name: 'Primal Instincts', stat: 'wisdom' }] },
            bard: { name: 'Bard', statBonuses: { charisma: 1, dexterity: 1 }, skills: [{ name: 'Bardic Magic', stat: 'charisma' }, { name: 'Inspiration', stat: 'charisma' }] },
            paladin: { name: 'Paladin', statBonuses: { strength: 1, charisma: 1 }, skills: [{ name: 'Divine Combat', stat: 'strength' }, { name: 'Lay on Hands', stat: 'charisma' }] },
            warlock: { name: 'Warlock', statBonuses: { charisma: 1, constitution: 1 }, skills: [{ name: 'Eldritch Magic', stat: 'charisma' }, { name: 'Pact Knowledge', stat: 'intelligence' }] },
            sorcerer: { name: 'Sorcerer', statBonuses: { charisma: 2 }, skills: [{ name: 'Innate Magic', stat: 'charisma' }, { name: 'Metamagic', stat: 'charisma' }] },
            monk: { name: 'Monk', statBonuses: { dexterity: 1, wisdom: 1 }, skills: [{ name: 'Martial Arts', stat: 'dexterity' }, { name: 'Ki Control', stat: 'wisdom' }] },
            druid: { name: 'Druid', statBonuses: { wisdom: 2 }, skills: [{ name: 'Nature Magic', stat: 'wisdom' }, { name: 'Animal Handling', stat: 'wisdom' }] },
            gunslinger: { name: 'Gunslinger', statBonuses: { dexterity: 1, constitution: 1 }, skills: [{ name: 'Firearms', stat: 'dexterity' }, { name: 'Quick Draw', stat: 'dexterity' }] },
            hacker: { name: 'Data Runner', statBonuses: { intelligence: 2 }, skills: [{ name: 'Computer Systems', stat: 'intelligence' }, { name: 'Digital Infiltration', stat: 'dexterity' }] },
            medic: { name: 'Field Medic', statBonuses: { wisdom: 1, intelligence: 1 }, skills: [{ name: 'Field Medicine', stat: 'wisdom' }, { name: 'Trauma Care', stat: 'dexterity' }] },
            engineer_class: { name: 'Engineer', statBonuses: { intelligence: 1, dexterity: 1 }, skills: [{ name: 'Engineering', stat: 'intelligence' }, { name: 'Technical Repair', stat: 'dexterity' }] },
            pilot: { name: 'Vehicle Pilot', statBonuses: { dexterity: 1, intelligence: 1 }, skills: [{ name: 'Piloting', stat: 'dexterity' }, { name: 'Navigation', stat: 'intelligence' }] },
            survivalist: { name: 'Survivalist', statBonuses: { constitution: 1, wisdom: 1 }, skills: [{ name: 'Wilderness Survival', stat: 'wisdom' }, { name: 'Foraging', stat: 'wisdom' }] }
        };

        // ========================================
        // UTILITY FUNCTIONS
        // ========================================
        function generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }

        function getFullStatName(shortName) {
            const statMap = {
                'str': 'strength', 'dex': 'dexterity', 'con': 'constitution',
                'int': 'intelligence', 'wis': 'wisdom', 'cha': 'charisma'
            };
            return statMap[shortName] || shortName;
        }

        function getElementEmoji(element) {
            const emojis = {
                fire: '🔥', ice: '❄️', lightning: '⚡', earth: '🌍',
                air: '💨', water: '💧', light: '☀️', dark: '🌑',
                arcane: '🔮', divine: '✨', nature: '🌿', psychic: '🧠',
                shadow: '👤', force: '💥'
            };
            return emojis[element] || '✨';
        }

        // ========================================
        // NOTIFICATION SYSTEM
        // ========================================
        function showNotification(type, title, result, details) {
            const existingNotifications = document.querySelectorAll('.notification');
            existingNotifications.forEach(n => n.remove());
            
            const notification = document.createElement('div');
            notification.className = `notification ${type}-notification`;
            notification.innerHTML = `
                <h4><i class="ra ra-${type === 'roll' ? 'perspective-dice-six' : type === 'weapon' ? 'sword' : type === 'spell' ? 'lightning' : type === 'rest' ? 'heart-plus' : type === 'status' ? 'lightning-bolt' : 'sword'}"></i> ${title}</h4>
                <div class="result">${result}</div>
                <div class="details">${details}</div>
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => notification.classList.add('show'), 100);
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 4000);
        }

        // ========================================
        // TAB SYSTEM
        // ========================================
        function switchTab(tabName) {
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
            document.getElementById(tabName).classList.add('active');
            
            // Update content based on active tab
            if (tabName === 'character') {
                updateCharacterDisplay();
            } else if (tabName === 'rolling') {
                updateDiceSystemInfo();
                updateRollHistoryDisplay();
            } else if (tabName === 'magic') {
                updateMagicTabDisplay();
                renderSpells();
                calculateSpellCost();
            } else if (tabName === 'inventory') {
                renderInventory();
                renderEquipment();
            } else if (tabName === 'status') {
                renderStatusEffects();
            }
        }

        function switchCharSubTab(subTabName) {
            document.querySelectorAll('.char-sub-tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.char-sub-content').forEach(content => content.classList.remove('active'));
            
            document.querySelector(`[data-sub-tab="${subTabName}"]`).classList.add('active');
            document.getElementById(`${subTabName}-content`).classList.add('active');
            
            if (subTabName === 'spells') {
                renderCharacterSpells();
            } else if (subTabName === 'weapons') {
                renderCharacterWeapons();
            }
        }

        // ========================================
        // CHARACTER STATS SYSTEM
        // ========================================
        function renderStats() {
            const statsGrid = document.getElementById('stats-grid');
            statsGrid.innerHTML = '';
            
            Object.entries(character.stats).forEach(([stat, value]) => {
                const statCard = document.createElement('div');
                statCard.className = 'stat-card';
                statCard.innerHTML = `
                    <div class="stat-name">${stat.charAt(0).toUpperCase() + stat.slice(1)}</div>
                    <div class="stat-value">${value}</div>
                    <div class="stat-controls">
                        <button class="control-btn" onclick="adjustStat('${stat}', -1)" ${value <= 1 ? 'disabled' : ''}>-</button>
                        <button class="control-btn" onclick="adjustStat('${stat}', 1)" ${character.availablePoints <= 0 ? 'disabled' : ''}>+</button>
                    </div>
                `;
                statsGrid.appendChild(statCard);
            });
            
            document.getElementById('available-points').textContent = character.availablePoints;
        }

        function adjustStat(stat, change) {
            const currentValue = character.stats[stat];
            const newValue = currentValue + change;
            
            if (change > 0 && character.availablePoints > 0 && newValue <= 10) {
                character.stats[stat] = newValue;
                character.availablePoints--;
            } else if (change < 0 && currentValue > 1) {
                character.stats[stat] = newValue;
                character.availablePoints++;
            }
            
            if (stat === 'constitution' || stat === 'wisdom' || stat === 'intelligence') {
                updateHealthMagicDisplay();
            }
            
            renderStats();
            renderCharacterSkills();
        }

        function updateHealthMagicDisplay() {
            character.healthPoints = character.stats.constitution + character.level;
            character.currentHealthPoints = Math.min(character.currentHealthPoints, character.healthPoints);
            
            character.magicPoints = character.stats.wisdom + character.stats.intelligence;
            character.currentMagicPoints = Math.min(character.currentMagicPoints, character.magicPoints);
            
            document.getElementById('health-points').textContent = character.healthPoints;
            document.getElementById('magic-points').textContent = character.magicPoints;
            
            const magicCurrentMP = document.getElementById('magic-current-mp');
            const magicTotalMP = document.getElementById('magic-total-mp');
            if (magicCurrentMP) magicCurrentMP.textContent = character.currentMagicPoints;
            if (magicTotalMP) magicTotalMP.textContent = character.magicPoints;
        }

        function adjustCurrentHP(change) {
            const newValue = character.currentHealthPoints + change;
            if (newValue >= 0 && newValue <= character.healthPoints) {
                character.currentHealthPoints = newValue;
                updateCharacterDisplay();
            }
        }

        function adjustCurrentMP(change) {
            const newValue = character.currentMagicPoints + change;
            if (newValue >= 0 && newValue <= character.magicPoints) {
                character.currentMagicPoints = newValue;
                updateCharacterDisplay();
                updateMagicTabDisplay();
                renderSpells();
                renderCharacterSpells();
            }
        }

        function adjustMagicPointsInTab(change) {
            adjustCurrentMP(change);
        }

        function updateMagicTabDisplay() {
            document.getElementById('magic-current-mp').textContent = character.currentMagicPoints;
            document.getElementById('magic-total-mp').textContent = character.magicPoints;
        }

        // ========================================
        // CHARACTER BACKGROUND SYSTEM
        // ========================================
        function resetCharacterBonuses() {
            const currentTotal = Object.values(character.stats).reduce((sum, stat) => sum + stat, 0);
            const baseTotal = 12;
            const pointsUsed = currentTotal - baseTotal;
            
            character.stats = {
                strength: 2, dexterity: 2, constitution: 2,
                intelligence: 2, wisdom: 2, charisma: 2
            };
            
            const maxPoints = character.level * 3;
            character.availablePoints = Math.min(maxPoints, pointsUsed);
            
            character.customSkills = character.customSkills.filter(skill => 
                !skill.source || (skill.source !== 'job' && skill.source !== 'class')
            );
            
            character.jobBonuses = [];
            character.classBonuses = [];
        }

        function applyJobBonuses() {
            if (character.job && jobs[character.job]) {
                const job = jobs[character.job];
                
                Object.entries(job.statBonuses).forEach(([stat, bonus]) => {
                    character.stats[stat] += bonus;
                    character.jobBonuses.push(`+${bonus} ${stat.charAt(0).toUpperCase() + stat.slice(1)} (${job.name})`);
                });
                
                job.skills.forEach(skill => {
                    if (!character.customSkills.find(s => s.name === skill.name)) {
                        character.customSkills.push({
                            name: skill.name,
                            stat: skill.stat,
                            source: 'job'
                        });
                        character.jobBonuses.push(`${skill.name} [${skill.stat.slice(0, 3).toUpperCase()}] skill (${job.name})`);
                    }
                });
            } else if (document.getElementById('job-select')?.value === 'custom' && character.customJobData) {
                applyCustomBonuses(character.customJobData, 'job', 'Custom Background');
            }
            
            renderStats();
            renderCharacterSkills();
        }

        function applyClassBonuses() {
            if (character.class && classes[character.class]) {
                const charClass = classes[character.class];
                
                Object.entries(charClass.statBonuses).forEach(([stat, bonus]) => {
                    character.stats[stat] += bonus;
                    character.classBonuses.push(`+${bonus} ${stat.charAt(0).toUpperCase() + stat.slice(1)} (${charClass.name})`);
                });
                
                charClass.skills.forEach(skill => {
                    if (!character.customSkills.find(s => s.name === skill.name)) {
                        character.customSkills.push({
                            name: skill.name,
                            stat: skill.stat,
                            source: 'class'
                        });
                        character.classBonuses.push(`${skill.name} [${skill.stat.slice(0, 3).toUpperCase()}] skill (${charClass.name})`);
                    }
                });
            } else if (document.getElementById('class-select')?.value === 'custom_class' && character.customClassData) {
                applyCustomBonuses(character.customClassData, 'class', 'Custom Class');
            }
            
            renderStats();
            renderCharacterSkills();
        }

        function applyCustomBonuses(customData, type, typeName) {
            const selectedStats = customData.selectedStats || [];
            const bonusArray = type === 'job' ? character.jobBonuses : character.classBonuses;
            
            if (selectedStats.length === 1) {
                const fullStatName = getFullStatName(selectedStats[0]);
                character.stats[fullStatName] += 3;
                bonusArray.push(`+3 ${fullStatName.charAt(0).toUpperCase() + fullStatName.slice(1)} (${typeName} - single focus)`);
            } else if (selectedStats.length === 2) {
                const fullStat1 = getFullStatName(selectedStats[0]);
                const fullStat2 = getFullStatName(selectedStats[1]);
                character.stats[fullStat1] += 2;
                character.stats[fullStat2] += 1;
                bonusArray.push(`+2 ${fullStat1.charAt(0).toUpperCase() + fullStat1.slice(1)} (${typeName} - primary)`);
                bonusArray.push(`+1 ${fullStat2.charAt(0).toUpperCase() + fullStat2.slice(1)} (${typeName} - secondary)`);
            }
            
            customData.skills.forEach(skillData => {
                if (!character.customSkills.find(s => s.name === skillData.name)) {
                    character.customSkills.push({
                        name: skillData.name,
                        stat: skillData.stat,
                        source: type
                    });
                    bonusArray.push(`${skillData.name} [${skillData.stat.slice(0, 3).toUpperCase()}] skill (${typeName})`);
                }
            });
        }

        function updateBonusesDisplay() {
            const bonusesDisplay = document.getElementById('bonuses-display');
            const bonusesContent = document.getElementById('bonuses-content');
            const allBonuses = [...character.jobBonuses, ...character.classBonuses];
            
            if (allBonuses.length > 0) {
                bonusesDisplay.style.display = 'block';
                const bonusesHtml = allBonuses.map(bonus => 
                    `<div style="background: rgba(244, 208, 63, 0.1); padding: 8px; border-radius: 5px; border: 1px solid #f4d03f; margin-bottom: 8px; font-size: 13px;"><strong style="color: #f4d03f;">+</strong> ${bonus}</div>`
                ).join('');
                bonusesContent.innerHTML = bonusesHtml;
            } else {
                bonusesDisplay.style.display = 'none';
            }
        }

        // ========================================
        // EVENT HANDLERS
        // ========================================
        function handlePortraitUpload(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    character.personal.portrait = e.target.result;
                    const portraitDisplay = document.getElementById('portrait-display');
                    portraitDisplay.innerHTML = `<img src="${e.target.result}" alt="Character Portrait" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
                };
                reader.readAsDataURL(file);
            }
        }

        function handleJobSelection() {
            const jobSelect = document.getElementById('job-select');
            const customJobInput = document.getElementById('custom-job');
            const customJobBonuses = document.getElementById('custom-job-bonuses');
            
            resetCharacterBonuses();
            
            if (jobSelect.value === 'custom') {
                customJobInput.style.display = 'block';
                customJobBonuses.style.display = 'block';
                character.job = '';
            } else {
                customJobInput.style.display = 'none';
                customJobBonuses.style.display = 'none';
                character.job = jobSelect.value;
                character.customJob = '';
                customJobInput.value = '';
                clearCustomSelections('job');
            }
            
            applyJobBonuses();
            applyClassBonuses();
            updateBonusesDisplay();
            updateHealthMagicDisplay();
        }

        function handleClassSelection() {
            const classSelect = document.getElementById('class-select');
            const customClassInput = document.getElementById('custom-class');
            const customClassBonuses = document.getElementById('custom-class-bonuses');
            
            resetCharacterBonuses();
            
            if (classSelect.value === 'custom_class') {
                customClassInput.style.display = 'block';
                customClassBonuses.style.display = 'block';
                character.class = '';
            } else {
                customClassInput.style.display = 'none';
                customClassBonuses.style.display = 'none';
                character.class = classSelect.value;
                character.customClass = '';
                customClassInput.value = '';
                clearCustomSelections('class');
            }
            
            applyJobBonuses();
            applyClassBonuses();
            updateBonusesDisplay();
            updateHealthMagicDisplay();
        }

        function clearCustomSelections(type) {
            ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(stat => {
                document.getElementById(`custom-${type}-${stat}`).checked = false;
            });
            
            [1, 2].forEach(num => {
                document.getElementById(`custom-${type}-skill${num}`).value = '';
                document.getElementById(`custom-${type}-skill${num}-name`).style.display = 'none';
                document.getElementById(`custom-${type}-skill${num}-name`).value = '';
            });
            
            character[`custom${type.charAt(0).toUpperCase() + type.slice(1)}Data`] = {
                selectedStats: [],
                skills: []
            };
        }

        function updateCustomJobBonuses() {
            updateCustomBonuses('job');
        }

        function updateCustomClassBonuses() {
            updateCustomBonuses('class');
        }

        function updateCustomBonuses(type) {
            const selectValue = document.getElementById(`${type}-select`).value;
            if ((type === 'job' && selectValue !== 'custom') || 
                (type === 'class' && selectValue !== 'custom_class')) return;
            
            const selectedStats = [];
            ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(stat => {
                if (document.getElementById(`custom-${type}-${stat}`).checked) {
                    selectedStats.push(stat);
                }
            });
            
            if (selectedStats.length > 2) {
                const lastStat = selectedStats.pop();
                document.getElementById(`custom-${type}-${lastStat}`).checked = false;
            }
            
            const customData = {
                selectedStats: selectedStats,
                skills: []
            };
            
            [1, 2].forEach(num => {
                const skillSelect = document.getElementById(`custom-${type}-skill${num}`);
                const skillStatSelect = document.getElementById(`custom-${type}-skill${num}-stat`);
                const skillNameInput = document.getElementById(`custom-${type}-skill${num}-name`);
                
                if (skillSelect?.value && skillSelect.value !== '') {
                    let skillName = skillSelect.value;
                    let skillStat = skillStatSelect.value;
                    
                    if (skillSelect.value === 'custom' && skillNameInput.value.trim()) {
                        skillName = skillNameInput.value.trim();
                    }
                    
                    if (skillName && skillName !== 'custom') {
                        customData.skills.push({
                            name: skillName,
                            stat: skillStat
                        });
                    }
                }
            });
            
            character[`custom${type.charAt(0).toUpperCase() + type.slice(1)}Data`] = customData;
            
            resetCharacterBonuses();
            applyJobBonuses();
            applyClassBonuses();
            updateBonusesDisplay();
            updateHealthMagicDisplay();
        }

        function updateCustomJob() {
            character.customJob = document.getElementById('custom-job').value;
            updateBonusesDisplay();
        }

        function updateCustomClass() {
            character.customClass = document.getElementById('custom-class').value;
            updateBonusesDisplay();
        }

        function updateCharacterLevel() {
            const newLevel = parseInt(document.getElementById('char-level').value);
            const levelDiff = newLevel - character.level;
            
            character.availablePoints += levelDiff * 3;
            
            if (character.availablePoints < 0) {
                character.availablePoints = 0;
            }
            
            character.level = newLevel;
            updateHealthMagicDisplay();
            renderStats();
            
            const rollLevelDisplay = document.getElementById('roll-level-display');
            if (rollLevelDisplay) rollLevelDisplay.textContent = character.level;
        }

        function updateCharacterName() {
            character.name = document.getElementById('char-name').value;
            updateCharacterDisplay();
        }

        // ========================================
        // CHARACTER DISPLAY
        // ========================================
        function updateCharacterDisplay() {
            const nameDisplay = document.getElementById('char-display-name');
            if (character.name) {
                nameDisplay.textContent = `${character.name} - Level ${character.level}`;
            } else {
                nameDisplay.textContent = 'Character Overview';
            }
            
            const charSummary = document.getElementById('char-summary');
            const jobName = character.job ? jobs[character.job]?.name || character.job : character.customJob || 'Unknown';
            const className = character.class ? classes[character.class]?.name || character.class : character.customClass || 'Unknown';
            charSummary.innerHTML = `
                <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 10px;">
                    <span><strong>Background:</strong> ${jobName}</span>
                    <span><strong>Class:</strong> ${className}</span>
                    <span><strong>Level:</strong> ${character.level}</span>
                </div>
            `;
            
            document.getElementById('char-current-hp').textContent = character.currentHealthPoints;
            document.getElementById('char-total-hp').textContent = character.healthPoints;
            document.getElementById('char-current-mp').textContent = character.currentMagicPoints;
            document.getElementById('char-total-mp').textContent = character.magicPoints;
            
            const totalDefense = calculateTotalDefense();
            const defenseDisplay = document.getElementById('total-defense-display');
            if (defenseDisplay) {
                defenseDisplay.textContent = totalDefense;
            }
            
            renderCharacterStats();
        }

        function renderCharacterStats() {
            const charStatsDisplay = document.getElementById('char-stats-display');
            charStatsDisplay.innerHTML = '';
            
            Object.entries(character.stats).forEach(([stat, value]) => {
                const statCard = document.createElement('div');
                statCard.onclick = () => rollAttribute(stat, value);
                statCard.style.cssText = `
                    background: rgba(40, 40, 60, 0.9);
                    border-radius: 8px;
                    padding: 12px;
                    text-align: center;
                    border: 1px solid #4a4a6a;
                    cursor: pointer;
                    transition: all 0.3s ease;
                `;
                statCard.onmouseenter = () => {
                    statCard.style.borderColor = '#f4d03f';
                    statCard.style.background = 'rgba(244, 208, 63, 0.1)';
                    statCard.style.transform = 'translateY(-1px)';
                };
                statCard.onmouseleave = () => {
                    statCard.style.borderColor = '#4a4a6a';
                    statCard.style.background = 'rgba(40, 40, 60, 0.9)';
                    statCard.style.transform = 'translateY(0)';
                };
                statCard.innerHTML = `
                    <div style="font-weight: 600; color: #f4d03f; font-size: 11px; margin-bottom: 5px; text-transform: uppercase;">${stat.charAt(0).toUpperCase() + stat.slice(1)}</div>
                    <div style="font-size: 20px; font-weight: bold; color: #ffffff;">${value}</div>
                `;
                charStatsDisplay.appendChild(statCard);
            });
        }

        // ========================================
        // SKILLS SYSTEM
        // ========================================
        function renderCharacterSkills() {
            const skillsGrid = document.getElementById('char-skills-grid');
            if (!skillsGrid) return;
            
            skillsGrid.innerHTML = '';
            
            Object.entries(standardSkills).forEach(([skillName, stat]) => {
                const skillValue = character.stats[stat];
                const skillItem = createInteractiveItem('skill', {
                    name: skillName,
                    stat: stat,
                    value: skillValue,
                    icon: 'ra-gear',
                    onClick: () => rollSkill(skillName, stat, skillValue)
                });
                skillsGrid.appendChild(skillItem);
            });
            
            character.customSkills.forEach((skill, index) => {
                const skillValue = character.stats[skill.stat];
                const sourceLabel = skill.source ? ` (${skill.source})` : ' (Custom)';
                const iconClass = skill.source === 'job' ? 'ra-briefcase' : skill.source === 'class' ? 'ra-sword' : 'ra-star';
                
                const skillItem = createInteractiveItem('skill', {
                    name: skill.name + sourceLabel,
                    stat: skill.stat,
                    value: skillValue,
                    icon: iconClass,
                    onClick: () => rollSkill(skill.name, skill.stat, skillValue),
                    removeButton: !skill.source ? () => removeCustomSkillFromCharTab(index) : null
                });
                skillsGrid.appendChild(skillItem);
            });
        }

        function createInteractiveItem(type, options) {
            const item = document.createElement('div');
            item.className = `interactive-item ${type}-item`;
            item.onclick = options.onClick;
            
            const statDisplay = options.stat ? `[${options.stat.substring(0, 3).toUpperCase()}]` : '';
            const valueText = type === 'skill' ? `+${options.value}` : 
                             type === 'spell' ? `${options.value} MP` : 
                             `d${options.diceType || 6}+${options.value}`;
            
            item.innerHTML = `
                <div class="item-info">
                    <div class="item-name"><i class="ra ${options.icon}"></i> ${options.name}</div>
                    <div class="item-stat">${statDisplay}${options.description || ''}</div>
                </div>
                <div class="item-value">${valueText}</div>
                ${options.removeButton ? `<button class="control-btn" onclick="event.stopPropagation(); (${options.removeButton})()" style="width: 32px; height: 32px; font-size: 16px; margin-left: 10px;">×</button>` : ''}
            `;
            
            return item;
        }

        function addCustomSkillFromCharTab() {
            const skillName = document.getElementById('char-custom-skill-name').value.trim();
            const skillStat = document.getElementById('char-custom-skill-stat').value;
            
            if (skillName) {
                character.customSkills.push({
                    name: skillName,
                    stat: skillStat
                });
                
                document.getElementById('char-custom-skill-name').value = '';
                renderCharacterSkills();
            }
        }

        function removeCustomSkillFromCharTab(index) {
            character.customSkills.splice(index, 1);
            renderCharacterSkills();
        }

        // ========================================
        // SPELLS SYSTEM
        // ========================================
        function renderCharacterSpells() {
            const spellsContainer = document.getElementById('char-spells-container');
            if (!spellsContainer) return;
            
            spellsContainer.innerHTML = '';
            
            if (character.spells.length === 0) {
                spellsContainer.innerHTML = `
                    <div style="text-align: center; color: #8a8a8a; padding: 40px;">
                        <i class="ra ra-lightning" style="font-size: 3em; margin-bottom: 15px; display: block;"></i>
                        No spells learned yet. Visit the Magic tab to create your first spell!
                    </div>
                `;
                return;
            }
            
            character.spells.forEach(spell => {
                const canCast = character.currentMagicPoints >= spell.cost;
                const elementEmoji = getElementEmoji(spell.element);
                
                const spellItem = createInteractiveItem('spell', {
                    name: `${elementEmoji} ${spell.name}`,
                    description: `${spell.element} | ${spell.effects.join(', ')}`,
                    value: spell.cost,
                    icon: 'ra-lightning',
                    onClick: canCast ? () => castSpellFromCharTab(spell.id) : null
                });
                
                if (!canCast) {
                    spellItem.classList.add('insufficient-mp');
                }
                
                spellsContainer.appendChild(spellItem);
            });
        }

        function renderCharacterWeapons() {
            const weaponsContainer = document.getElementById('char-weapons-container');
            if (!weaponsContainer) return;
            
            weaponsContainer.innerHTML = '';
            
            const equippedWeapons = [];
            Object.values(character.equipment).forEach(itemId => {
                if (itemId) {
                    const item = getItemById(itemId);
                    if (item && item.type === 'weapon') {
                        equippedWeapons.push(item);
                    }
                }
            });
            
            if (equippedWeapons.length === 0) {
                weaponsContainer.innerHTML = `
                    <div style="text-align: center; color: #8a8a8a; padding: 40px;">
                        <i class="ra ra-sword" style="font-size: 3em; margin-bottom: 15px; display: block;"></i>
                        No weapons equipped. Visit the Inventory tab to equip weapons!
                    </div>
                `;
                return;
            }
            
            equippedWeapons.forEach(weapon => {
                const statUsed = weapon.ranged ? 'dexterity' : 'strength';
                const statValue = character.stats[statUsed];
                const weaponSize = weaponSizes[weapon.size] || weaponSizes.medium;
                
                const weaponItem = createInteractiveItem('weapon', {
                    name: weapon.name,
                    description: `${weaponSize.name} • d${weaponSize.dice} + ${statUsed.slice(0, 3).toUpperCase()}(${statValue}) ${weapon.ranged ? '• Ranged' : '• Melee'}`,
                    value: statValue,
                    diceType: weaponSize.dice,
                    icon: 'ra-sword',
                    onClick: () => rollWeaponDamage(weapon.id)
                });
                
                weaponsContainer.appendChild(weaponItem);
            });
        }

        function renderSpells() {
            const spellsGrid = document.getElementById('spells-grid');
            if (!spellsGrid) return;
            
            spellsGrid.innerHTML = '';
            
            if (character.spells.length === 0) {
                spellsGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; color: #8a8a8a; padding: 40px;">
                        <i class="ra ra-lightning" style="font-size: 3em; margin-bottom: 15px; display: block;"></i>
                        No spells learned yet. Create your first spell below!
                    </div>
                `;
                return;
            }
            
            character.spells.forEach(spell => {
                const spellDiv = document.createElement('div');
                spellDiv.style.cssText = `
                    background: rgba(40, 40, 60, 0.8);
                    border: 1px solid #8a4a8a;
                    border-radius: 12px;
                    padding: 18px;
                    transition: all 0.3s ease;
                    position: relative;
                `;
                
                spellDiv.onmouseenter = () => {
                    spellDiv.style.borderColor = '#da70d6';
                    spellDiv.style.background = 'rgba(218, 112, 214, 0.1)';
                    spellDiv.style.transform = 'translateY(-2px)';
                };
                
                spellDiv.onmouseleave = () => {
                    spellDiv.style.borderColor = '#8a4a8a';
                    spellDiv.style.background = 'rgba(40, 40, 60, 0.8)';
                    spellDiv.style.transform = 'translateY(0)';
                };
                
                const elementEmoji = getElementEmoji(spell.element);
                const canCast = character.currentMagicPoints >= spell.cost;
                
                spellDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                        <h4 style="color: #da70d6; margin: 0; font-size: 16px; font-weight: 600;">
                            ${elementEmoji} ${spell.name}
                        </h4>
                        <button onclick="removeSpell('${spell.id}')" style="background: #8a4a4a; border: none; color: white; width: 24px; height: 24px; border-radius: 50%; cursor: pointer; font-size: 12px;">×</button>
                    </div>
                    
                    <div style="font-size: 12px; color: #8a8a8a; margin-bottom: 10px; text-transform: capitalize;">
                        ${spell.element} Magic
                    </div>
                    
                    <div style="margin-bottom: 12px;">
                        ${spell.effects.map(effect => 
                            `<span style="background: rgba(138, 74, 138, 0.3); color: #da70d6; padding: 3px 8px; border-radius: 12px; font-size: 11px; margin-right: 6px; margin-bottom: 4px; display: inline-block;">${effect}</span>`
                        ).join('')}
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                        <div style="color: #f4d03f; font-weight: bold; font-size: 14px;">
                            Cost: ${spell.cost} MP
                        </div>
                        <button onclick="castSpell('${spell.id}')" 
                                style="background: ${canCast ? '#8a4a8a' : '#4a4a5a'}; 
                                       border: none; 
                                       color: ${canCast ? 'white' : '#6a6a8a'}; 
                                       padding: 8px 16px; 
                                       border-radius: 6px; 
                                       cursor: ${canCast ? 'pointer' : 'not-allowed'}; 
                                       font-size: 12px; 
                                       transition: all 0.3s ease;
                                       ${canCast ? '' : 'opacity: 0.5;'}"
                                ${canCast ? '' : 'disabled'}>
                            <i class="ra ra-lightning"></i> Cast
                        </button>
                    </div>
                `;
                
                spellsGrid.appendChild(spellDiv);
            });
        }

        function calculateSpellCost() {
            let cost = 1;
            let breakdown = ['Base Cost: 1 MP (activation)'];
            
            const damageType = document.getElementById('damage-type').value;
            const damageAmount = parseInt(document.getElementById('damage-amount').value) || 0;
            
            if (damageType === 'fixed' && damageAmount > 0) {
                const damageCost = Math.ceil(damageAmount / 2);
                cost += damageCost;
                breakdown.push(`Damage: ${damageAmount} pts = ${damageCost} MP`);
            } else if (damageType === 'd6') {
                cost += 3;
                breakdown.push('Damage: d6 roll = 3 MP');
            }
            
            const healingType = document.getElementById('healing-type').value;
            const healingAmount = parseInt(document.getElementById('healing-amount').value) || 0;
            
            if (healingType === 'fixed' && healingAmount > 0) {
                const healingCost = Math.ceil(healingAmount / 2);
                cost += healingCost;
                breakdown.push(`Healing: ${healingAmount} pts = ${healingCost} MP`);
            } else if (healingType === 'd6') {
                cost += 3;
                breakdown.push('Healing: d6 roll = 3 MP');
            }
            
            const primaryEffect = document.getElementById('primary-effect').value;
            if (primaryEffect) {
                cost += 1;
                breakdown.push('Primary Effect: 1 MP');
            }
            
            const secondaryEffect = document.getElementById('secondary-effect').value;
            if (secondaryEffect) {
                cost += 1;
                breakdown.push('Secondary Effect: 1 MP');
            }
            
            document.getElementById('cost-breakdown').innerHTML = breakdown.join('<br>');
            document.getElementById('total-cost').textContent = cost;
            
            const createBtn = document.getElementById('create-spell-btn');
            if (cost > character.magicPoints) {
                createBtn.disabled = true;
                createBtn.style.opacity = '0.5';
                createBtn.innerHTML = `<i class="ra ra-lightning"></i> Create Spell (Need ${cost} MP Total)`;
            } else {
                createBtn.disabled = false;
                createBtn.style.opacity = '1';
                createBtn.innerHTML = '<i class="ra ra-lightning"></i> Create Spell';
            }
            
            return cost;
        }

        function createSpell() {
            const name = document.getElementById('spell-name').value.trim();
            const element = document.getElementById('spell-element').value;
            const damageType = document.getElementById('damage-type').value;
            const damageAmount = parseInt(document.getElementById('damage-amount').value) || 0;
            const healingType = document.getElementById('healing-type').value;
            const healingAmount = parseInt(document.getElementById('healing-amount').value) || 0;
            const primaryEffect = document.getElementById('primary-effect').value;
            const secondaryEffect = document.getElementById('secondary-effect').value;
            
            if (!name) {
                alert('Please enter a spell name!');
                return;
            }
            
            const cost = calculateSpellCost();
            const effects = [];
            
            if (damageType === 'fixed' && damageAmount > 0) {
                effects.push(`${damageAmount} damage`);
            } else if (damageType === 'd6') {
                effects.push('d6 damage');
            }
            
            if (healingType === 'fixed' && healingAmount > 0) {
                effects.push(`${healingAmount} healing`);
            } else if (healingType === 'd6') {
                effects.push('d6 healing');
            }
            
            if (primaryEffect) {
                effects.push(primaryEffect.replace('_', ' '));
            }
            
            if (secondaryEffect) {
                effects.push(secondaryEffect.replace('_', ' '));
            }
            
            if (effects.length === 0) {
                effects.push('no effect');
            }
            
            const spell = {
                id: generateId(),
                name: name,
                element: element,
                damageType: damageType,
                damageAmount: damageAmount,
                healingType: healingType,
                healingAmount: healingAmount,
                primaryEffect: primaryEffect,
                secondaryEffect: secondaryEffect,
                cost: cost,
                effects: effects
            };
            
            character.spells.push(spell);
            
            // Clear form
            document.getElementById('spell-name').value = '';
            document.getElementById('damage-amount').value = '0';
            document.getElementById('healing-amount').value = '0';
            document.getElementById('damage-type').value = '';
            document.getElementById('healing-type').value = '';
            document.getElementById('primary-effect').value = '';
            document.getElementById('secondary-effect').value = '';
            document.getElementById('damage-amount').disabled = true;
            document.getElementById('healing-amount').disabled = true;
            
            renderSpells();
            renderCharacterSpells();
            calculateSpellCost();
            
            alert(`✨ Created spell: ${spell.name}!\nCost: ${spell.cost} MP\nEffects: ${spell.effects.join(', ')}`);
        }

        function castSpell(spellId) {
            const spell = character.spells.find(s => s.id === spellId);
            if (!spell) return;
            
            if (character.currentMagicPoints < spell.cost) {
                alert(`Not enough magic points! Need ${spell.cost} MP, have ${character.currentMagicPoints} MP.`);
                return;
            }
            
            character.currentMagicPoints -= spell.cost;
            
            let results = [];
            let totalDamage = 0;
            let totalHealing = 0;
            
            if (spell.damageType === 'fixed' && spell.damageAmount > 0) {
                totalDamage = spell.damageAmount;
                results.push(`Dealt ${totalDamage} damage`);
            } else if (spell.damageType === 'd6') {
                totalDamage = Math.floor(Math.random() * 6) + 1;
                results.push(`Dealt ${totalDamage} damage (d6 roll)`);
            }
            
            if (spell.healingType === 'fixed' && spell.healingAmount > 0) {
                totalHealing = spell.healingAmount;
                results.push(`Healed ${totalHealing} points`);
            } else if (spell.healingType === 'd6') {
                totalHealing = Math.floor(Math.random() * 6) + 1;
                results.push(`Healed ${totalHealing} points (d6 roll)`);
            }
            
            if (spell.primaryEffect) {
                results.push(`Applied ${spell.primaryEffect.replace('_', ' ')}`);
            }
            if (spell.secondaryEffect) {
                results.push(`Applied ${spell.secondaryEffect.replace('_', ' ')}`);
            }
            
            const spellData = {
                type: 'Spell',
                name: spell.name,
                element: spell.element,
                cost: spell.cost,
                results: results,
                finalTotal: totalDamage || totalHealing || 'N/A',
                timestamp: new Date().toLocaleTimeString()
            };
            
            character.rollHistory.unshift(spellData);
            if (character.rollHistory.length > 50) {
                character.rollHistory = character.rollHistory.slice(0, 50);
            }
            
            const elementEmoji = getElementEmoji(spellData.element);
            showNotification('spell', `Spell Cast: ${elementEmoji} ${spellData.name}`, 
                `Cost: ${spellData.cost} MP`, 
                `${spellData.results.length > 0 ? spellData.results.join('<br>') : 'Spell cast successfully!'}<br>MP Remaining: ${character.currentMagicPoints}/${character.magicPoints}`);
            
            updateMagicTabDisplay();
            updateCharacterDisplay();
            renderSpells();
            renderCharacterSpells();
        }

        function castSpellFromCharTab(spellId) {
            castSpell(spellId);
        }

        function removeSpell(spellId) {
            if (confirm('Are you sure you want to forget this spell?')) {
                character.spells = character.spells.filter(spell => spell.id !== spellId);
                renderSpells();
                renderCharacterSpells();
            }
        }

        // ========================================
        // INVENTORY SYSTEM
        // ========================================
        function addItem() {
            const name = document.getElementById('item-name').value.trim();
            const type = document.getElementById('item-type').value;
            const size = document.getElementById('weapon-size').value;
            const defense = parseInt(document.getElementById('item-defense').value) || 0;
            const twoHanded = document.getElementById('item-twohanded').checked;
            const ranged = document.getElementById('item-ranged').checked;
            
            if (!name) {
                alert('Please enter an item name!');
                return;
            }
            
            const item = {
                id: generateId(),
                name: name,
                type: type,
                size: type === 'weapon' ? size : null,
                defense: defense,
                twoHanded: twoHanded,
                ranged: ranged
            };
            
            character.inventory.push(item);
            
            document.getElementById('item-name').value = '';
            document.getElementById('item-defense').value = '';
            document.getElementById('item-twohanded').checked = false;
            document.getElementById('item-ranged').checked = false;
            
            renderInventory();
            alert(`Created ${item.name}!`);
        }

        function removeItem(itemId) {
            const item = getItemById(itemId);
            if (!item) return;
            
            if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
                return;
            }
            
            if (isItemEquipped(itemId)) {
                Object.keys(character.equipment).forEach(slot => {
                    if (character.equipment[slot] === itemId) {
                        character.equipment[slot] = null;
                    }
                });
                renderEquipment();
                renderCharacterWeapons();
            }
            
            character.inventory = character.inventory.filter(invItem => invItem.id !== itemId);
            renderInventory();
            alert(`Deleted "${item.name}".`);
        }

        function renderInventory() {
            const inventoryGrid = document.getElementById('inventory-grid');
            inventoryGrid.innerHTML = '';
            
            character.inventory.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'inventory-item';
                if (isItemEquipped(item.id)) {
                    itemDiv.classList.add('equipped');
                }
                
                const stats = [];
                if (item.type === 'weapon' && item.size) {
                    const weaponSize = weaponSizes[item.size];
                    stats.push(`d${weaponSize.dice}`);
                }
                if (item.defense > 0) stats.push(`+${item.defense} DEF`);
                if (item.twoHanded) stats.push('2H');
                if (item.ranged) stats.push('RNG');
                
                itemDiv.innerHTML = `
                    <div class="item-name">${item.name}</div>
                    <div class="item-type">${item.type} ${item.size ? `(${weaponSizes[item.size].name})` : ''}</div>
                    <div class="item-stats">
                        ${stats.map(stat => `<span class="item-stat">${stat}</span>`).join('')}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                        <button class="btn-secondary" onclick="selectItem('${item.id}')" style="font-size: 11px; padding: 4px 8px; min-height: auto;">
                            ${isItemEquipped(item.id) ? 'Unequip' : 'Equip'}
                        </button>
                        <button class="remove-btn" onclick="removeItem('${item.id}')" title="Delete Item">
                            <i class="ra ra-cancel"></i>
                        </button>
                    </div>
                `;
                inventoryGrid.appendChild(itemDiv);
            });
        }

        function selectItem(itemId) {
            const item = getItemById(itemId);
            if (isItemEquipped(itemId)) {
                unequipItem(itemId);
            } else {
                equipItem(item);
            }
        }

        function equipItem(item) {
            let slot = '';
            
            if (item.type === 'weapon') {
                if (item.twoHanded) {
                    character.equipment.mainHand = null;
                    character.equipment.offHand = null;
                    slot = 'mainHand';
                } else {
                    if (!character.equipment.mainHand) {
                        slot = 'mainHand';
                    } else if (!character.equipment.offHand) {
                        slot = 'offHand';
                    } else {
                        slot = 'mainHand';
                    }
                }
            } else if (item.type === 'armor') {
                slot = 'armor';
            } else {
                slot = 'accessory';
            }
            
            character.equipment[slot] = item.id;
            renderEquipment();
            renderInventory();
            renderCharacterWeapons();
            updateCharacterDisplay();
        }

        function unequipItem(itemId) {
            Object.keys(character.equipment).forEach(slot => {
                if (character.equipment[slot] === itemId) {
                    character.equipment[slot] = null;
                }
            });
            renderEquipment();
            renderInventory();
            renderCharacterWeapons();
            updateCharacterDisplay();
        }

        function isItemEquipped(itemId) {
            return Object.values(character.equipment).includes(itemId);
        }

        function getItemById(itemId) {
            return character.inventory.find(item => item.id === itemId);
        }

        function renderEquipment() {
            Object.keys(character.equipment).forEach(slot => {
                const itemElement = document.getElementById(`${slot}-item`);
                const statsElement = document.getElementById(`${slot}-stats`);
                const slotElement = document.querySelector(`[data-slot="${slot}"]`);
                
                const itemId = character.equipment[slot];
                if (itemId) {
                    const item = getItemById(itemId);
                    if (item) {
                        itemElement.textContent = item.name;
                        
                        const stats = [];
                        if (item.type === 'weapon' && item.size) {
                            const weaponSize = weaponSizes[item.size];
                            stats.push(`d${weaponSize.dice} damage`);
                        }
                        if (item.defense > 0) stats.push(`+${item.defense} defense`);
                        if (item.twoHanded) stats.push('Two-handed');
                        if (item.ranged) stats.push('Ranged');
                        
                        statsElement.textContent = stats.join(', ');
                        slotElement.classList.add('equipped');
                    }
                } else {
                    itemElement.textContent = 'Empty';
                    statsElement.textContent = '';
                    slotElement.classList.remove('equipped');
                }
            });
        }

        function showEquipMenu(slot) {
            const availableItems = character.inventory.filter(item => {
                if (slot === 'mainHand' || slot === 'offHand') {
                    return item.type === 'weapon';
                } else if (slot === 'armor') {
                    return item.type === 'armor';
                } else {
                    return item.type === 'accessory' || item.type === 'misc';
                }
            });
            
            if (availableItems.length > 0) {
                const itemNames = availableItems.map(item => `${item.name} (${item.type})`).join('\n');
                alert(`Available items for ${slot}:\n${itemNames}\n\nClick on an item in the inventory below to equip it.`);
            } else {
                alert(`No items available for ${slot} slot.`);
            }
        }

        // ========================================
        // COMBAT SYSTEM
        // ========================================
        function calculateTotalDefense() {
            let totalDefense = 0;
            
            Object.values(character.equipment).forEach(itemId => {
                if (itemId) {
                    const item = getItemById(itemId);
                    if (item && item.defense) {
                        totalDefense += item.defense;
                    }
                }
            });
            
            return totalDefense;
        }

        function applyDamage(damage, target = 'character') {
            if (target === 'character') {
                const totalDefense = calculateTotalDefense();
                const actualDamage = Math.max(1, damage - totalDefense);
                
                character.currentHealthPoints = Math.max(0, character.currentHealthPoints - actualDamage);
                updateHealthMagicDisplay();
                updateCharacterDisplay();
                
                const defenseText = totalDefense > 0 ? ` (${damage} - ${totalDefense} armor)` : '';
                showNotification('damage', 'Damage Taken', 
                    `${actualDamage} damage taken!${defenseText}`, 
                    `${character.currentHealthPoints}/${character.healthPoints} HP remaining`);
                
                return actualDamage;
            }
        }

        function testDamage() {
            const damageInput = document.getElementById('damage-input');
            const damage = parseInt(damageInput.value) || 5;
            
            if (damage < 1) {
                alert('Please enter a damage amount of at least 1.');
                return;
            }
            
            applyDamage(damage);
        }

        function quickRest() {
            const hpRecovery = Math.floor(character.healthPoints / 2);
            const mpRecovery = Math.floor(character.magicPoints / 2);
            
            const oldHP = character.currentHealthPoints;
            const oldMP = character.currentMagicPoints;
            
            character.currentHealthPoints = Math.min(character.healthPoints, character.currentHealthPoints + hpRecovery);
            character.currentMagicPoints = Math.min(character.magicPoints, character.currentMagicPoints + mpRecovery);
            
            const actualHPRecovered = character.currentHealthPoints - oldHP;
            const actualMPRecovered = character.currentMagicPoints - oldMP;
            
            updateHealthMagicDisplay();
            updateCharacterDisplay();
            
            showNotification('rest', 'Quick Rest', 
                `Recovered ${actualHPRecovered} HP and ${actualMPRecovered} MP`, 
                `${character.currentHealthPoints}/${character.healthPoints} HP, ${character.currentMagicPoints}/${character.magicPoints} MP`);
        }

        function longRest() {
            const oldHP = character.currentHealthPoints;
            const oldMP = character.currentMagicPoints;
            
            character.currentHealthPoints = character.healthPoints;
            character.currentMagicPoints = character.magicPoints;
            
            const actualHPRecovered = character.currentHealthPoints - oldHP;
            const actualMPRecovered = character.currentMagicPoints - oldMP;
            
            updateHealthMagicDisplay();
            updateCharacterDisplay();
            
            showNotification('rest', 'Long Rest', 
                `Fully recovered! +${actualHPRecovered} HP and +${actualMPRecovered} MP`, 
                `${character.currentHealthPoints}/${character.healthPoints} HP, ${character.currentMagicPoints}/${character.magicPoints} MP`);
        }

        // ========================================
        // DICE ROLLING SYSTEM
        // ========================================
        function getDiceConfiguration(level) {
            const tensDigit = Math.floor(level / 10);
            const onesDigit = level % 10;
            
            let diceCount = Math.max(1, tensDigit);
            let diceType = 10;
            
            if (level >= 80) {
                diceCount = 8;
                diceType = 10;
            } else if (level >= 11 && level <= 20) {
                diceCount = 1;
                diceType = 20;
            } else if (level >= 21) {
                diceCount = Math.min(8, tensDigit);
                diceType = 10;
            }
            
            return {
                diceCount: diceCount,
                diceType: diceType,
                levelBonus: onesDigit,
                description: `${diceCount}d${diceType} + ${onesDigit} (Level ${level})`
            };
        }

        function rollDice(diceCount, diceType) {
            const rolls = [];
            for (let i = 0; i < diceCount; i++) {
                rolls.push(Math.floor(Math.random() * diceType) + 1);
            }
            return rolls;
        }

        function rollAttribute(statName, statValue) {
            const config = getDiceConfiguration(character.level);
            const diceRolls = rollDice(config.diceCount, config.diceType);
            const diceTotal = diceRolls.reduce((sum, roll) => sum + roll, 0);
            const finalTotal = diceTotal + config.levelBonus + statValue;
            
            const rollData = {
                type: 'Attribute',
                name: statName.charAt(0).toUpperCase() + statName.slice(1),
                diceRolls: diceRolls,
                diceTotal: diceTotal,
                levelBonus: config.levelBonus,
                statBonus: statValue,
                finalTotal: finalTotal,
                config: config,
                timestamp: new Date().toLocaleTimeString()
            };
            
            character.rollHistory.unshift(rollData);
            if (character.rollHistory.length > 50) {
                character.rollHistory = character.rollHistory.slice(0, 50);
            }
            
            const diceDisplay = rollData.diceRolls.map(roll => `<span style="color: #f4d03f;">${roll}</span>`).join(' + ');
            showNotification('roll', `${rollData.type} Roll: ${rollData.name}`, 
                `Total: ${rollData.finalTotal}`, 
                `Dice: [${diceDisplay}] = ${rollData.diceTotal}<br>+ Level Bonus: ${rollData.levelBonus}<br>+ ${rollData.type} Bonus: ${rollData.statBonus}`);
            
            updateRollHistoryDisplay();
        }

        function rollSkill(skillName, statName, statValue) {
            const config = getDiceConfiguration(character.level);
            const diceRolls = rollDice(config.diceCount, config.diceType);
            const diceTotal = diceRolls.reduce((sum, roll) => sum + roll, 0);
            const finalTotal = diceTotal + config.levelBonus + statValue;
            
            const rollData = {
                type: 'Skill',
                name: skillName,
                stat: statName.charAt(0).toUpperCase() + statName.slice(1),
                diceRolls: diceRolls,
                diceTotal: diceTotal,
                levelBonus: config.levelBonus,
                statBonus: statValue,
                finalTotal: finalTotal,
                config: config,
                timestamp: new Date().toLocaleTimeString()
            };
            
            character.rollHistory.unshift(rollData);
            if (character.rollHistory.length > 50) {
                character.rollHistory = character.rollHistory.slice(0, 50);
            }
            
            const diceDisplay = rollData.diceRolls.map(roll => `<span style="color: #f4d03f;">${roll}</span>`).join(' + ');
            showNotification('roll', `${rollData.type} Roll: ${rollData.name}`, 
                `Total: ${rollData.finalTotal}`, 
                `Dice: [${diceDisplay}] = ${rollData.diceTotal}<br>+ Level Bonus: ${rollData.levelBonus}<br>+ ${rollData.type} Bonus: ${rollData.statBonus}`);
            
            updateRollHistoryDisplay();
        }

        function rollWeaponDamage(weaponId) {
            const weapon = getItemById(weaponId);
            if (!weapon) return;
            
            const weaponSize = weaponSizes[weapon.size] || weaponSizes.medium;
            const statUsed = weapon.ranged ? 'dexterity' : 'strength';
            const statValue = character.stats[statUsed];
            
            const damageRoll = Math.floor(Math.random() * weaponSize.dice) + 1;
            const totalDamage = damageRoll + statValue;
            
            const weaponData = {
                type: 'Weapon',
                name: weapon.name,
                weaponSize: weaponSize.name,
                statUsed: statUsed,
                damageRoll: damageRoll,
                statBonus: statValue,
                totalDamage: totalDamage,
                diceType: weaponSize.dice,
                isRanged: weapon.ranged,
                timestamp: new Date().toLocaleTimeString()
            };
            
            character.rollHistory.unshift(weaponData);
            if (character.rollHistory.length > 50) {
                character.rollHistory = character.rollHistory.slice(0, 50);
            }
            
            showNotification('weapon', `${weaponData.name} Attack`, 
                `Damage: ${weaponData.totalDamage}`, 
                `d${weaponData.diceType} roll: ${weaponData.damageRoll}<br>+ ${weaponData.statUsed.charAt(0).toUpperCase() + weaponData.statUsed.slice(1)}: ${weaponData.statBonus}<br>${weaponData.weaponSize} ${weaponData.isRanged ? 'Ranged' : 'Melee'} Weapon`);
            
            updateRollHistoryDisplay();
        }

        function updateDiceSystemInfo() {
            const diceExplanation = document.getElementById('dice-explanation');
            if (!diceExplanation) return;
            
            const config = getDiceConfiguration(character.level);
            
            let explanation = `<strong>Level ${character.level}:</strong> ${config.description}<br>`;
            explanation += `<em>Roll ${config.diceCount}d${config.diceType}, add ${config.levelBonus} (level bonus), plus attribute/skill bonus</em><br><br>`;
            
            explanation += '<strong>System Rules:</strong><br>';
            explanation += '• Levels 1-10: Roll 1d10 + level<br>';
            explanation += '• Levels 11-20: Roll 1d20 + level<br>';
            explanation += '• Levels 21+: Roll dice equal to tens digit (e.g., Level 34 = 3d10)<br>';
            explanation += '• Level 80+ capped at 8d10 maximum<br>';
            explanation += '• Always add the ones digit of your level as bonus<br><br>';
            
            explanation += '<strong>Weapon Damage:</strong><br>';
            explanation += '• Light weapons: 1d4 + stat<br>';
            explanation += '• Medium weapons: 1d6 + stat<br>';
            explanation += '• Heavy weapons: 1d8 + stat<br>';
            explanation += '• Melee weapons use Strength<br>';
            explanation += '• Ranged weapons use Dexterity';
            
            diceExplanation.innerHTML = explanation;
        }

        function updateRollHistoryDisplay() {
            const rollHistory = document.getElementById('roll-history');
            if (!rollHistory) return;
            
            if (character.rollHistory.length === 0) {
                rollHistory.innerHTML = `
                    <div style="text-align: center; color: #8a8a8a; padding: 40px;">
                        <i class="ra ra-perspective-dice-six" style="font-size: 3em; margin-bottom: 15px; display: block;"></i>
                        No rolls yet! Click attributes, skills, weapons, or spells in the Character tab to start rolling.
                    </div>
                `;
                return;
            }
            
            rollHistory.innerHTML = character.rollHistory.map((roll, index) => {
                let content = '';
                let typeIcon = '';
                let typeColor = '';
                
                if (roll.type === 'Weapon') {
                    typeIcon = 'ra-sword';
                    typeColor = '#d4af37';
                    content = `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <h4 style="color: #d4af37; margin: 0; font-size: 14px;">
                                <i class="ra ${typeIcon}"></i> ${roll.name} Damage
                            </h4>
                            <span style="color: #8a8a8a; font-size: 12px;">${roll.timestamp}</span>
                        </div>
                        <div style="font-size: 18px; font-weight: bold; color: #ffffff; margin-bottom: 5px;">
                            Damage: ${roll.totalDamage}
                        </div>
                        <div style="font-size: 12px; color: #c0c0c0;">
                            d${roll.diceType} roll: ${roll.damageRoll} + ${roll.statUsed}: ${roll.statBonus}<br>
                            ${roll.weaponSize} ${roll.isRanged ? 'Ranged' : 'Melee'} Weapon
                        </div>
                    `;
                } else {
                    typeIcon = roll.type === 'Attribute' ? 'ra-muscle-up' : roll.type === 'Skill' ? 'ra-gear' : 'ra-lightning';
                    typeColor = roll.type === 'Attribute' ? '#4a6a8a' : roll.type === 'Skill' ? '#4a8a4a' : '#8a4a8a';
                    const diceDisplay = roll.diceRolls ? roll.diceRolls.map(r => `<span style="color: #f4d03f;">${r}</span>`).join(' + ') : 'N/A';
                    
                    content = `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <h4 style="color: #f4d03f; margin: 0; font-size: 14px;">
                                <i class="ra ${typeIcon}"></i> ${roll.name} ${roll.type === 'Skill' ? `[${roll.stat}]` : ''}
                            </h4>
                            <span style="color: #8a8a8a; font-size: 12px;">${roll.timestamp}</span>
                        </div>
                        <div style="font-size: 18px; font-weight: bold; color: #ffffff; margin-bottom: 5px;">
                            Result: ${roll.finalTotal}
                        </div>
                        <div style="font-size: 12px; color: #c0c0c0;">
                            ${roll.diceRolls ? `Dice: [${diceDisplay}] = ${roll.diceTotal} + Level: ${roll.levelBonus} + Bonus: ${roll.statBonus}` : 
                              roll.results ? roll.results.join('<br>') : 'Spell cast successfully!'}
                        </div>
                    `;
                }
                
                return `
                    <div style="background: rgba(40, 40, 60, 0.8); border-radius: 8px; padding: 15px; margin-bottom: 10px; border-left: 3px solid ${typeColor};">
                        ${content}
                    </div>
                `;
            }).join('');
        }

        function clearRollHistory() {
            character.rollHistory = [];
            updateRollHistoryDisplay();
        }

        // ========================================
        // STATUS EFFECTS SYSTEM
        // ========================================
        function addStatusEffect() {
            const effectType = document.getElementById('status-effect-type').value;
            const duration = parseInt(document.getElementById('status-duration').value) || 10;
            const notes = document.getElementById('status-notes').value.trim();
            const customName = document.getElementById('custom-status-name').value.trim();
            
            let effectName = effectType;
            let effectIcon = '';
            
            const selectElement = document.getElementById('status-effect-type');
            const selectedOption = selectElement.options[selectElement.selectedIndex];
            const optionText = selectedOption.textContent;
            effectIcon = optionText.split(' ')[0];
            effectName = optionText.substring(2);
            
            if (effectType === 'custom' && customName) {
                effectName = customName;
                effectIcon = '⚙️';
            } else if (effectType === 'custom' && !customName) {
                alert('Please enter a name for the custom effect.');
                return;
            }
            
            const statusEffect = {
                id: generateId(),
                type: effectType,
                name: effectName,
                icon: effectIcon,
                duration: duration,
                notes: notes,
                startTime: Date.now()
            };
            
            character.statusEffects.push(statusEffect);
            
            document.getElementById('status-duration').value = '10';
            document.getElementById('status-notes').value = '';
            document.getElementById('custom-status-name').value = '';
            document.getElementById('custom-status-name').style.display = 'none';
            document.getElementById('status-effect-type').value = 'bleeding';
            
            renderStatusEffects();
        }

        function removeStatusEffect(effectId) {
            character.statusEffects = character.statusEffects.filter(effect => effect.id !== effectId);
            renderStatusEffects();
        }

        function updateStatusTimers() {
            let expiredEffects = [];
            
            character.statusEffects.forEach(effect => {
                const timeElapsed = Math.floor((Date.now() - effect.startTime) / 60000);
                if (timeElapsed >= effect.duration) {
                    expiredEffects.push(effect);
                }
            });
            
            if (expiredEffects.length > 0) {
                expiredEffects.forEach(effect => {
                    showNotification('status', 'Status Effect Ended', 
                        `${effect.icon} ${effect.name} has worn off!`, 
                        `Effect duration has expired. You may feel the effects fading away.`);
                    
                    // Remove the expired effect
                    character.statusEffects = character.statusEffects.filter(e => e.id !== effect.id);
                });
                
                renderStatusEffects();
            }
        }

        function renderStatusEffects() {
            const statusGrid = document.getElementById('status-effects-grid');
            if (!statusGrid) return;
            
            statusGrid.innerHTML = '';
            
            if (character.statusEffects.length === 0) {
                statusGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; color: #8a8a8a; padding: 40px;">
                        <i class="ra ra-heart" style="font-size: 3em; margin-bottom: 15px; display: block;"></i>
                        No active status effects. You're feeling healthy!
                    </div>
                `;
                return;
            }
            
            character.statusEffects.forEach(effect => {
                const timeElapsed = Math.floor((Date.now() - effect.startTime) / 60000);
                const timeRemaining = Math.max(0, effect.duration - timeElapsed);
                
                const effectDiv = document.createElement('div');
                effectDiv.style.cssText = `
                    background: rgba(40, 40, 60, 0.8);
                    border: 1px solid #8a4a4a;
                    border-radius: 8px;
                    padding: 15px;
                    position: relative;
                    border-left: 4px solid ${timeRemaining <= 1 ? '#ff6b6b' : '#8a4a4a'};
                `;
                
                effectDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                        <h4 style="color: #ff6b6b; margin: 0; font-size: 14px;">
                            ${effect.icon} ${effect.name}
                        </h4>
                        <button onclick="removeStatusEffect('${effect.id}')" 
                                style="background: #8a4a4a; border: none; color: white; width: 20px; height: 20px; border-radius: 50%; cursor: pointer; font-size: 10px;">×</button>
                    </div>
                    
                    <div style="font-size: 12px; color: #c0c0c0; margin-bottom: 8px;">
                        ${effect.notes || 'No additional notes'}
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-size: 11px; color: #8a8a8a;">
                            ${timeRemaining > 0 ? `${timeRemaining}m remaining` : 'EXPIRED'}
                        </div>
                        <div style="width: 60px; height: 4px; background: #3a3a5a; border-radius: 2px; overflow: hidden;">
                            <div style="width: ${(timeRemaining / effect.duration) * 100}%; height: 100%; background: ${timeRemaining <= 1 ? '#ff6b6b' : '#4a8a4a'}; transition: all 0.3s ease;"></div>
                        </div>
                    </div>
                `;
                
                statusGrid.appendChild(effectDiv);
            });
        }

        // ========================================
        // SAVE/LOAD SYSTEM
        // ========================================
        function saveCharacter() {
            character.personal.age = document.getElementById('char-age').value;
            character.personal.backstory = document.getElementById('char-backstory').value;
            
            const characterData = JSON.stringify(character, null, 2);
            const blob = new Blob([characterData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${character.name || 'character'}_wasteland.json`;
            a.click();
            URL.revokeObjectURL(url);
        }

        function loadCharacter() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = function(event) {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        try {
                            character = JSON.parse(e.target.result);
                            
                            // Ensure all properties exist for backward compatibility
                            if (!character.personal) character.personal = { age: '', backstory: '', portrait: null };
                            if (!character.jobBonuses) character.jobBonuses = [];
                            if (!character.classBonuses) character.classBonuses = [];
                            if (!character.customSkills) character.customSkills = [];
                            if (!character.customJobData) character.customJobData = { selectedStats: [], skills: [] };
                            if (!character.customClassData) character.customClassData = { selectedStats: [], skills: [] };
                            if (!character.rollHistory) character.rollHistory = [];
                            if (!character.spells) character.spells = [];
                            if (!character.inventory) character.inventory = [];
                            if (!character.equipment) character.equipment = { mainHand: null, offHand: null, armor: null, accessory: null };
                            if (!character.statusEffects) character.statusEffects = [];
                            
                            // Update UI elements
                            document.getElementById('char-name').value = character.name || '';
                            document.getElementById('char-level').value = character.level || 1;
                            document.getElementById('char-age').value = character.personal?.age || '';
                            document.getElementById('char-backstory').value = character.personal?.backstory || '';
                            
                            // Handle portrait
                            if (character.personal?.portrait) {
                                const portraitDisplay = document.getElementById('portrait-display');
                                portraitDisplay.innerHTML = `<img src="${character.personal.portrait}" alt="Character Portrait" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
                            }
                            
                            // Handle job selection and restore custom data
                            if (character.job) {
                                document.getElementById('job-select').value = character.job;
                            } else if (character.customJob) {
                                document.getElementById('job-select').value = 'custom';
                                document.getElementById('custom-job').style.display = 'block';
                                document.getElementById('custom-job').value = character.customJob;
                                document.getElementById('custom-job-bonuses').style.display = 'block';
                                
                                if (character.customJobData && character.customJobData.selectedStats) {
                                    character.customJobData.selectedStats.forEach(stat => {
                                        const checkbox = document.getElementById(`custom-job-${stat}`);
                                        if (checkbox) checkbox.checked = true;
                                    });
                                }
                            }
                            
                            // Handle class selection and restore custom data
                            if (character.class) {
                                document.getElementById('class-select').value = character.class;
                            } else if (character.customClass) {
                                document.getElementById('class-select').value = 'custom_class';
                                document.getElementById('custom-class').style.display = 'block';
                                document.getElementById('custom-class').value = character.customClass;
                                document.getElementById('custom-class-bonuses').style.display = 'block';
                                
                                if (character.customClassData && character.customClassData.selectedStats) {
                                    character.customClassData.selectedStats.forEach(stat => {
                                        const checkbox = document.getElementById(`custom-class-${stat}`);
                                        if (checkbox) checkbox.checked = true;
                                    });
                                }
                            }
                            
                            // Re-render everything
                            renderStats();
                            renderCharacterSkills();
                            renderCharacterSpells();
                            renderCharacterWeapons();
                            renderInventory();
                            renderEquipment();
                            updateHealthMagicDisplay();
                            updateCharacterDisplay();
                            updateBonusesDisplay();
                            renderSpells();
                            updateMagicTabDisplay();
                            
                        } catch (error) {
                            alert('Error loading character file: ' + error.message);
                        }
                    };
                    reader.readAsText(file);
                }
            };
            input.click();
        }

        // ========================================
        // INITIALIZATION
        // ========================================
        function initializeCharacterSheet() {
            renderStats();
            renderCharacterSkills();
            renderCharacterSpells();
            renderCharacterWeapons();
            renderInventory();
            renderEquipment();
            updateHealthMagicDisplay();
            
            // Event listeners
            document.getElementById('char-level').addEventListener('input', updateCharacterLevel);
            document.getElementById('char-name').addEventListener('input', updateCharacterName);
            document.getElementById('portrait-upload').addEventListener('change', handlePortraitUpload);
            document.getElementById('job-select').addEventListener('change', handleJobSelection);
            document.getElementById('class-select').addEventListener('change', handleClassSelection);
            document.getElementById('custom-job').addEventListener('input', updateCustomJob);
            document.getElementById('custom-class').addEventListener('input', updateCustomClass);
            
            // Custom skill dropdown listeners
            ['custom-job-skill1', 'custom-job-skill2', 'custom-class-skill1', 'custom-class-skill2'].forEach(id => {
                const select = document.getElementById(id);
                if (select) {
                    select.addEventListener('change', function() {
                        const nameInput = document.getElementById(id + '-name');
                        if (this.value === 'custom') {
                            nameInput.style.display = 'block';
                        } else {
                            nameInput.style.display = 'none';
                            nameInput.value = '';
                        }
                        
                        if (id.includes('job')) {
                            updateCustomJobBonuses();
                        } else {
                            updateCustomClassBonuses();
                        }
                    });
                }
            });
            
            // Custom skill name input listeners
            ['custom-job-skill1-name', 'custom-job-skill2-name', 'custom-class-skill1-name', 'custom-class-skill2-name'].forEach(id => {
                const input = document.getElementById(id);
                if (input) {
                    input.addEventListener('input', function() {
                        if (id.includes('job')) {
                            updateCustomJobBonuses();
                        } else {
                            updateCustomClassBonuses();
                        }
                    });
                }
            });
            
            // Magic system event listeners
            const magicInputs = ['damage-type', 'damage-amount', 'healing-type', 'healing-amount', 'primary-effect', 'secondary-effect'];
            magicInputs.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('change', calculateSpellCost);
                    element.addEventListener('input', calculateSpellCost);
                }
            });
            
            // Enable/disable amount inputs based on type selection
            document.getElementById('damage-type').addEventListener('change', function() {
                const amountInput = document.getElementById('damage-amount');
                if (this.value === 'fixed') {
                    amountInput.disabled = false;
                    amountInput.value = amountInput.value || '2';
                } else {
                    amountInput.disabled = true;
                    amountInput.value = '0';
                }
                calculateSpellCost();
            });
            
            document.getElementById('healing-type').addEventListener('change', function() {
                const amountInput = document.getElementById('healing-amount');
                if (this.value === 'fixed') {
                    amountInput.disabled = false;
                    amountInput.value = amountInput.value || '2';
                } else {
                    amountInput.disabled = true;
                    amountInput.value = '0';
                }
                calculateSpellCost();
            });
            
            // Tab switching
            document.querySelectorAll('.tab').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    switchTab(tab.dataset.tab);
                });
            });

            // Sub-tab switching for character tab
            document.querySelectorAll('.char-sub-tab').forEach(subTab => {
                subTab.addEventListener('click', (e) => {
                    switchCharSubTab(subTab.dataset.subTab);
                });
            });
            
            // Status effects event listeners
            const statusEffectType = document.getElementById('status-effect-type');
            if (statusEffectType) {
                statusEffectType.addEventListener('change', function() {
                    const customNameInput = document.getElementById('custom-status-name');
                    if (this.value === 'custom') {
                        customNameInput.style.display = 'block';
                    } else {
                        customNameInput.style.display = 'none';
                        customNameInput.value = '';
                    }
                });
            }
            
            // Start the status effect timer - checks every minute
            setInterval(updateStatusTimers, 60000);
        }

        // Initialize when page loads
        window.addEventListener('DOMContentLoaded', initializeCharacterSheet);