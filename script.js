// Configuration - Replace with your Google Apps Script deployment URL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyBat65tE7Qjd4JR-nmOPgmLAiNssUfVKyfUoZazBU/exec';
//AKfycbyBat65tE7Qjd4JR-nmOPgmLAiNssUfVKyfUoZazBU

// Global variables
let soldiers = [];
let currentProgram = null;
let calendarData = [];

// DOM Elements
const soldiersTableBody = document.getElementById('soldiersTableBody');
const addSoldierBtn = document.getElementById('addSoldierBtn');
const soldierModal = document.getElementById('soldierModal');
const closeModal = document.querySelector('.close');
const soldierForm = document.getElementById('soldierForm');
const programSoldierSelect = document.getElementById('programSoldierSelect');
const calendarSoldierSelect = document.getElementById('calendarSoldierSelect');
const programInfo = document.getElementById('programInfo');
const programDetails = document.getElementById('programDetails');
const recordActivityBtn = document.getElementById('recordActivityBtn');
const recordBreakBtn = document.getElementById('recordBreakBtn');
const startSingleBtn = document.getElementById('startSingleBtn');
const startExpandedBtn = document.getElementById('startExpandedBtn');
const startDoubleBtn = document.getElementById('startDoubleBtn');
const calendarContainer = document.getElementById('calendarContainer');
const haCalendar = document.getElementById('haCalendar');
const calendarSoldierName = document.getElementById('calendarSoldierName');

// Tab functionality
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabId = tab.getAttribute('data-tab');
        
        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update active content
        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === tabId) {
                content.classList.add('active');
            }
        });
        
        // Refresh data if needed
        if (tabId === 'ha-programs') {
            loadSoldiersForPrograms();
        } else if (tabId === 'calendar') {
            loadSoldiersForCalendar();
        }
    });
});

// Modal functionality
addSoldierBtn.addEventListener('click', () => {
    document.getElementById('modalTitle').textContent = 'Add New Soldier';
    document.getElementById('soldierId').value = '';
    soldierForm.reset();
    soldierModal.style.display = 'block';
});

closeModal.addEventListener('click', () => {
    soldierModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === soldierModal) {
        soldierModal.style.display = 'none';
    }
});

// Form submission
soldierForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const soldierId = document.getElementById('soldierId').value;
    const soldierData = {
        name: document.getElementById('name').value,
        rank: document.getElementById('rank').value,
        unit: document.getElementById('unit').value,
        nric: document.getElementById('nric').value,
        status: document.getElementById('status').value
    };
    
    if (soldierId) {
        updateSoldier(soldierId, soldierData);
    } else {
        addSoldier(soldierData);
    }
});

// Soldier selection for programs
programSoldierSelect.addEventListener('change', (e) => {
    const soldierId = e.target.value;
    if (soldierId) {
        loadSoldierProgram(soldierId);
        programInfo.style.display = 'block';
    } else {
        programInfo.style.display = 'none';
    }
});

// Soldier selection for calendar
calendarSoldierSelect.addEventListener('change', (e) => {
    const soldierId = e.target.value;
    if (soldierId) {
        const soldier = soldiers.find(s => s.id === soldierId);
        calendarSoldierName.textContent = `${soldier.rank} ${soldier.name}`;
        loadCalendarData(soldierId);
        calendarContainer.style.display = 'block';
    } else {
        calendarContainer.style.display = 'none';
    }
});

// Program buttons
recordActivityBtn.addEventListener('click', () => {
    if (currentProgram) {
        recordHAActivity(currentProgram.soldierId);
    }
});

recordBreakBtn.addEventListener('click', () => {
    if (currentProgram) {
        recordHABreak(currentProgram.soldierId);
    }
});

startSingleBtn.addEventListener('click', () => {
    if (currentProgram) {
        startNewProgram(currentProgram.soldierId, 'single');
    }
});

startExpandedBtn.addEventListener('click', () => {
    if (currentProgram) {
        startNewProgram(currentProgram.soldierId, 'expanded');
    }
});

startDoubleBtn.addEventListener('click', () => {
    if (currentProgram) {
        startNewProgram(currentProgram.soldierId, 'double');
    }
});

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    loadSoldiers();
});

// API Functions
function loadSoldiers() {
    axios.get(`${SCRIPT_URL}?action=getSoldiers`)
        .then(response => {
            soldiers = response.data;
            renderSoldiersTable();
            loadSoldiersForPrograms();
            loadSoldiersForCalendar();
        })
        .catch(error => {
            console.error('Error loading soldiers:', error);
            alert('Failed to load soldiers. Please try again.');
        });
}

function loadSoldiersForPrograms() {
    programSoldierSelect.innerHTML = '<option value="">-- Select Soldier --</option>';
    soldiers.forEach(soldier => {
        const option = document.createElement('option');
        option.value = soldier.id;
        option.textContent = `${soldier.rank} ${soldier.name} (${soldier.unit})`;
        programSoldierSelect.appendChild(option);
    });
}

function loadSoldiersForCalendar() {
    calendarSoldierSelect.innerHTML = '<option value="">-- Select Soldier --</option>';
    soldiers.forEach(soldier => {
        const option = document.createElement('option');
        option.value = soldier.id;
        option.textContent = `${soldier.rank} ${soldier.name} (${soldier.unit})`;
        calendarSoldierSelect.appendChild(option);
    });
}

function loadSoldierProgram(soldierId) {
    axios.get(`${SCRIPT_URL}?action=getProgram&soldierId=${soldierId}`)
        .then(response => {
            currentProgram = response.data;
            renderProgramDetails();
        })
        .catch(error => {
            console.error('Error loading program:', error);
            currentProgram = null;
            programDetails.innerHTML = '<p>No active HA program found.</p>';
        });
}

function loadCalendarData(soldierId) {
    axios.get(`${SCRIPT_URL}?action=getCalendar&soldierId=${soldierId}`)
        .then(response => {
            calendarData = response.data;
            renderCalendar();
        })
        .catch(error => {
            console.error('Error loading calendar data:', error);
            calendarData = [];
            haCalendar.innerHTML = '<p>Failed to load calendar data.</p>';
        });
}

function addSoldier(soldierData) {
    axios.post(SCRIPT_URL, {
        action: 'addSoldier',
        ...soldierData
    })
    .then(response => {
        soldierModal.style.display = 'none';
        loadSoldiers();
    })
    .catch(error => {
        console.error('Error adding soldier:', error);
        alert('Failed to add soldier. Please try again.');
    });
}

function updateSoldier(soldierId, soldierData) {
    axios.post(SCRIPT_URL, {
        action: 'updateSoldier',
        soldierId: soldierId,
        ...soldierData
    })
    .then(response => {
        soldierModal.style.display = 'none';
        loadSoldiers();
    })
    .catch(error => {
        console.error('Error updating soldier:', error);
        alert('Failed to update soldier. Please try again.');
    });
}

function deleteSoldier(soldierId) {
    if (confirm('Are you sure you want to delete this soldier?')) {
        axios.post(SCRIPT_URL, {
            action: 'deleteSoldier',
            soldierId: soldierId
        })
        .then(response => {
            loadSoldiers();
        })
        .catch(error => {
            console.error('Error deleting soldier:', error);
            alert('Failed to delete soldier. Please try again.');
        });
    }
}

function recordHAActivity(soldierId) {
    axios.post(SCRIPT_URL, {
        action: 'recordActivity',
        soldierId: soldierId
    })
    .then(response => {
        loadSoldierProgram(soldierId);
        loadCalendarData(soldierId);
    })
    .catch(error => {
        console.error('Error recording activity:', error);
        alert('Failed to record activity. Please try again.');
    });
}

function recordHABreak(soldierId) {
    axios.post(SCRIPT_URL, {
        action: 'recordBreak',
        soldierId: soldierId
    })
    .then(response => {
        loadSoldierProgram(soldierId);
        loadCalendarData(soldierId);
    })
    .catch(error => {
        console.error('Error recording break:', error);
        alert('Failed to record break. Please try again.');
    });
}

function startNewProgram(soldierId, programType) {
    axios.post(SCRIPT_URL, {
        action: 'startProgram',
        soldierId: soldierId,
        programType: programType
    })
    .then(response => {
        loadSoldierProgram(soldierId);
        loadCalendarData(soldierId);
    })
    .catch(error => {
        console.error('Error starting new program:', error);
        alert('Failed to start new program. Please try again.');
    });
}

// Rendering functions
function renderSoldiersTable() {
    soldiersTableBody.innerHTML = '';
    
    soldiers.forEach(soldier => {
        const row = document.createElement('tr');
        
        // Determine status indicator and badge
        let statusIndicator = '';
        let statusBadge = '';
        
        switch(soldier.status) {
            case 'current':
                statusIndicator = '<span class="status-indicator status-current"></span>';
                statusBadge = '<span class="badge badge-success">Current</span>';
                break;
            case 'lapsed':
                statusIndicator = '<span class="status-indicator status-lapsed"></span>';
                statusBadge = '<span class="badge badge-danger">Lapsed</span>';
                break;
            case 'in-progress':
                statusIndicator = '<span class="status-indicator status-in-progress"></span>';
                statusBadge = '<span class="badge badge-warning">In Progress</span>';
                break;
        }
        
        row.innerHTML = `
            <td>${soldier.id}</td>
            <td>${soldier.name}</td>
            <td>${soldier.rank}</td>
            <td>${soldier.unit}</td>
            <td>${statusIndicator} ${statusBadge}</td>
            <td>${soldier.currentProgram || 'None'}</td>
            <td>${soldier.lastHA || 'Never'}</td>
            <td>
                <button class="btn btn-primary btn-sm edit-btn" data-id="${soldier.id}">Edit</button>
                <button class="btn btn-danger btn-sm delete-btn" data-id="${soldier.id}">Delete</button>
            </td>
        `;
        
        soldiersTableBody.appendChild(row);
    });
    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const soldierId = e.target.getAttribute('data-id');
            editSoldier(soldierId);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const soldierId = e.target.getAttribute('data-id');
            deleteSoldier(soldierId);
        });
    });
}

function editSoldier(soldierId) {
    const soldier = soldiers.find(s => s.id === soldierId);
    if (soldier) {
        document.getElementById('modalTitle').textContent = 'Edit Soldier';
        document.getElementById('soldierId').value = soldier.id;
        document.getElementById('name').value = soldier.name;
        document.getElementById('rank').value = soldier.rank;
        document.getElementById('unit').value = soldier.unit;
        document.getElementById('nric').value = soldier.nric;
        document.getElementById('status').value = soldier.status;
        soldierModal.style.display = 'block';
    }
}

function renderProgramDetails() {
    if (!currentProgram) {
        programDetails.innerHTML = '<p>No active HA program found.</p>';
        return;
    }
    
    let programTypeBadge = '';
    switch(currentProgram.type) {
        case 'single':
            programTypeBadge = '<span class="badge badge-primary">Single HA</span>';
            break;
        case 'expanded':
            programTypeBadge = '<span class="badge badge-info">Expanded HA</span>';
            break;
        case 'double':
            programTypeBadge = '<span class="badge badge-warning">Double HA</span>';
            break;
    }
    
    const today = new Date();
    const startDate = new Date(currentProgram.startDate);
    const daysInProgram = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    
    let progress = '';
    if (currentProgram.type === 'single') {
        progress = `${currentProgram.completedActivities} of 10 periods completed`;
    } else if (currentProgram.type === 'expanded') {
        progress = `${currentProgram.completedActivities} of 14 periods completed`;
    } else if (currentProgram.type === 'double') {
        progress = `${currentProgram.completedActivities} of 13 periods completed`;
    }
    
    let breaksInfo = '';
    if (currentProgram.type === 'single' || currentProgram.type === 'double') {
        breaksInfo = `Breaks taken: ${currentProgram.breakDays} (Max 2 allowed)`;
    } else if (currentProgram.type === 'expanded') {
        breaksInfo = `Breaks taken: ${currentProgram.breakDays} (Max 5 allowed, max 3 consecutive)`;
    }
    
    let consecutiveBreaksInfo = '';
    if (currentProgram.type === 'expanded') {
        consecutiveBreaksInfo = `Consecutive breaks: ${currentProgram.consecutiveBreakDays} (Max 3 allowed)`;
    }
    
    let status = '';
    if (currentProgram.status === 'active') {
        status = '<span class="badge badge-success">Active</span>';
    } else if (currentProgram.status === 'completed') {
        status = '<span class="badge badge-primary">Completed</span>';
    } else if (currentProgram.status === 'lapsed') {
        status = '<span class="badge badge-danger">Lapsed</span>';
    }
    
    programDetails.innerHTML = `
        <div>
            <p><strong>Program Type:</strong> ${programTypeBadge}</p>
            <p><strong>Status:</strong> ${status}</p>
            <p><strong>Start Date:</strong> ${formatDate(currentProgram.startDate)}</p>
            <p><strong>Days in Program:</strong> ${daysInProgram}</p>
            <p><strong>Progress:</strong> ${progress}</p>
            <p><strong>${breaksInfo}</strong></p>
            ${consecutiveBreaksInfo ? `<p><strong>${consecutiveBreaksInfo}</strong></p>` : ''}
            <p><strong>Last Activity:</strong> ${currentProgram.lastActivity ? formatDate(currentProgram.lastActivity) : 'None'}</p>
        </div>
    `;
}

function renderCalendar() {
    // Generate a calendar for the current month
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    // Get first and last day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get days in month
    const daysInMonth = lastDay.getDate();
    
    // Get starting day of the week (0-6, where 0 is Sunday)
    const startingDay = firstDay.getDay();
    
    // Clear previous calendar
    haCalendar.innerHTML = '';
    
    // Add day headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.textContent = day;
        haCalendar.appendChild(header);
    });
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day';
        haCalendar.appendChild(emptyDay);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = formatDate(date);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        // Check if today
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayElement.classList.add('today');
        }
        
        // Add day number
        const dayNumber = document.createElement('div');
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);
        
        // Check for HA activities on this day
        const activities = calendarData.filter(activity => {
            const activityDate = new Date(activity.date);
            return activityDate.getDate() === day && 
                   activityDate.getMonth() === month && 
                   activityDate.getFullYear() === year;
        });
        
        // Add activities to the day
        activities.forEach(activity => {
            const activityElement = document.createElement('div');
            activityElement.className = 'ha-activity';
            
            if (activity.type === 'activity') {
                activityElement.textContent = '✓ HA Activity';
            } else if (activity.type === 'break') {
                activityElement.className = 'ha-activity ha-break';
                activityElement.textContent = '✗ Break Day';
            } else if (activity.type === 'missed') {
                activityElement.className = 'ha-activity ha-missed';
                activityElement.textContent = '✗ Missed';
            }
            
            dayElement.appendChild(activityElement);
            
            // Highlight the day based on activity type
            if (activity.type === 'activity') {
                dayElement.classList.add('ha-active');
            } else if (activity.type === 'break') {
                dayElement.classList.add('break-day');
            } else if (activity.type === 'missed') {
                dayElement.classList.add('ha-missed');
            }
        });
        
        haCalendar.appendChild(dayElement);
    }
}

// Helper functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-SG', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}