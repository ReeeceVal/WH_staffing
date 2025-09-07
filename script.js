// Employee data storage
let employees = [];
let selectedEmployee = null;

// DOM elements
const employeeSelect = document.getElementById('employeeSelect');
const employeeDropdown = document.getElementById('employeeDropdown');
const selectedEmployeeId = document.getElementById('selectedEmployeeId');
const userPin = document.getElementById('userPin');
const pinBlocks = document.querySelectorAll('.pin-block');
const authForm = document.getElementById('authForm');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const successMessage = document.getElementById('successMessage');
const continueButton = document.getElementById('continueButton');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadEmployeeData();
    setupEventListeners();
});

// Load employee data from CSV
async function loadEmployeeData() {
    try {
        const response = await fetch('data/users/employees.csv');
        const csvText = await response.text();
        employees = parseCSV(csvText);
        console.log('Loaded employees:', employees);
    } catch (error) {
        console.error('Error loading employee data:', error);
        showError('Failed to load employee data. Please refresh the page.');
    }
}

// Parse CSV data
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const employee = {};
        headers.forEach((header, index) => {
            employee[header.trim()] = values[index]?.trim();
        });
        data.push(employee);
    }
    
    return data;
}

// Setup event listeners
function setupEventListeners() {
    // Only setup login page event listeners if we're on the login page
    if (employeeSelect) {
        employeeSelect.addEventListener('input', handleEmployeeSearch);
        employeeSelect.addEventListener('focus', showDropdown);
        employeeSelect.addEventListener('blur', hideDropdownDelayed);
    }
    
    if (pinBlocks.length > 0) {
        setupPinBlockListeners();
    }
    
    if (authForm) {
        authForm.addEventListener('submit', handleFormSubmission);
    }
    
    if (continueButton) {
        continueButton.addEventListener('click', handleContinue);
    }
    
    // Click outside to close dropdown
    document.addEventListener('click', handleOutsideClick);
}

// Handle employee search input
function handleEmployeeSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    if (searchTerm.length === 0) {
        hideDropdown();
        clearSelection();
        return;
    }
    
    const filteredEmployees = employees.filter(employee => {
        const fullName = `${employee.name} ${employee.surname}`.toLowerCase();
        return fullName.includes(searchTerm);
    });
    
    displayEmployeeDropdown(filteredEmployees);
}

// Display employee dropdown
function displayEmployeeDropdown(filteredEmployees) {
    if (filteredEmployees.length === 0) {
        hideDropdown();
        return;
    }
    
    employeeDropdown.innerHTML = '';
    
    filteredEmployees.forEach(employee => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.textContent = `${employee.name} ${employee.surname}`;
        item.dataset.employeeId = employee.employee_id;
        
        item.addEventListener('click', () => selectEmployee(employee));
        item.addEventListener('mouseenter', () => item.classList.add('selected'));
        item.addEventListener('mouseleave', () => item.classList.remove('selected'));
        
        employeeDropdown.appendChild(item);
    });
    
    showDropdown();
}

// Select an employee
function selectEmployee(employee) {
    selectedEmployee = employee;
    employeeSelect.value = `${employee.name} ${employee.surname}`;
    selectedEmployeeId.value = employee.employee_id;
    hideDropdown();
    pinBlocks[0].focus();
}

// Clear employee selection
function clearSelection() {
    selectedEmployee = null;
    selectedEmployeeId.value = '';
}

// Show dropdown
function showDropdown() {
    if (employeeDropdown.children.length > 0) {
        employeeDropdown.classList.remove('hidden');
    }
}

// Hide dropdown
function hideDropdown() {
    employeeDropdown.classList.add('hidden');
}

// Hide dropdown with delay to allow for clicks
function hideDropdownDelayed() {
    setTimeout(hideDropdown, 200);
}

// Handle outside clicks
function handleOutsideClick(event) {
    if (employeeSelect && employeeDropdown && 
        !employeeSelect.contains(event.target) && !employeeDropdown.contains(event.target)) {
        hideDropdown();
    }
}

// Setup PIN block event listeners
function setupPinBlockListeners() {
    pinBlocks.forEach((block, index) => {
        block.addEventListener('input', (event) => handlePinBlockInput(event, index));
        block.addEventListener('keydown', (event) => handlePinBlockKeydown(event, index));
        block.addEventListener('paste', (event) => handlePinBlockPaste(event, index));
        block.addEventListener('focus', () => block.select());
    });
}

// Handle PIN block input
function handlePinBlockInput(event, index) {
    const value = event.target.value.replace(/\D/g, '');
    event.target.value = value;
    
    // Clear any existing errors
    hideError();
    
    // Update hidden PIN field
    updateHiddenPinField();
    
    // Move to next block immediately when a digit is entered
    // This ensures smooth mobile experience with automatic focus progression
    if (value && index < pinBlocks.length - 1) {
        // Use setTimeout to ensure the input event is fully processed
        setTimeout(() => {
            pinBlocks[index + 1].focus();
        }, 0);
    }
}

// Handle PIN block keydown events
function handlePinBlockKeydown(event, index) {
    const block = event.target;
    
    // Handle backspace
    if (event.key === 'Backspace') {
        if (block.value === '' && index > 0) {
            // Move to previous block if current is empty
            pinBlocks[index - 1].focus();
        } else {
            // Clear current block
            block.value = '';
            updateHiddenPinField();
        }
    }
    // Handle arrow keys
    else if (event.key === 'ArrowLeft' && index > 0) {
        pinBlocks[index - 1].focus();
    }
    else if (event.key === 'ArrowRight' && index < pinBlocks.length - 1) {
        pinBlocks[index + 1].focus();
    }
    // Handle delete key
    else if (event.key === 'Delete') {
        block.value = '';
        updateHiddenPinField();
    }
    // Handle numeric input - allow it to proceed to input handler
    else if (/[0-9]/.test(event.key)) {
        // Allow the input event to handle focus progression
        return;
    }
    // Block non-numeric input except for navigation keys
    else if (!['Tab', 'Enter', 'Escape'].includes(event.key)) {
        event.preventDefault();
    }
}

// Handle PIN block paste
function handlePinBlockPaste(event, index) {
    event.preventDefault();
    const pastedData = event.clipboardData.getData('text').replace(/\D/g, '');
    
    if (pastedData.length > 0) {
        // Fill blocks with pasted data
        for (let i = 0; i < Math.min(pastedData.length, pinBlocks.length); i++) {
            pinBlocks[i].value = pastedData[i];
        }
        
        // Focus the next empty block or the last block
        const nextEmptyIndex = Math.min(pastedData.length, pinBlocks.length - 1);
        pinBlocks[nextEmptyIndex].focus();
        
        updateHiddenPinField();
    }
}

// Update hidden PIN field with current PIN block values
function updateHiddenPinField() {
    const pinValue = Array.from(pinBlocks).map(block => block.value).join('');
    userPin.value = pinValue;
    
    // Update visual state of PIN blocks
    pinBlocks.forEach(block => {
        if (block.value) {
            block.classList.add('filled');
        } else {
            block.classList.remove('filled');
        }
    });
}

// Clear all PIN blocks
function clearPinBlocks() {
    pinBlocks.forEach(block => {
        block.value = '';
    });
    updateHiddenPinField();
}

// Handle form submission
async function handleFormSubmission(event) {
    event.preventDefault();
    
    // Validate form
    if (!validateForm()) {
        return;
    }
    
    // Show loading state
    const submitButton = authForm.querySelector('button[type="submit"]');
    submitButton.classList.add('loading');
    submitButton.disabled = true;
    
    try {
        // Simulate authentication delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Validate PIN
        if (validatePin()) {
            showSuccess();
            console.log('Authentication successful for:', selectedEmployee);
        } else {
            showError('Invalid PIN. Please try again.');
        }
    } catch (error) {
        console.error('Authentication error:', error);
        showError('Authentication failed. Please try again.');
    } finally {
        // Remove loading state
        submitButton.classList.remove('loading');
        submitButton.disabled = false;
    }
}

// Validate form
function validateForm() {
    if (!selectedEmployee) {
        showError('Please select an employee.');
        employeeSelect.focus();
        return false;
    }
    
    if (!userPin.value || userPin.value.length !== 5) {
        showError('Please enter a valid 5-digit PIN.');
        pinBlocks[0].focus();
        return false;
    }
    
    return true;
}

// Validate PIN
function validatePin() {
    return selectedEmployee && selectedEmployee.user_pin === userPin.value;
}

// Show error message
function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    successMessage.classList.add('hidden');
}

// Hide error message
function hideError() {
    errorMessage.classList.add('hidden');
}

// Show success message
function showSuccess() {
    successMessage.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    authForm.classList.add('hidden');
}

// Handle continue button click
function handleContinue() {
    // Store employee data in session storage for availability page
    if (selectedEmployee) {
        storeEmployeeInSession(selectedEmployee);
    }
    
    // Redirect to the availability page
    window.location.href = 'availability.html';
}

// Utility function to clear form
function clearForm() {
    authForm.reset();
    clearSelection();
    clearPinBlocks();
    hideError();
    successMessage.classList.add('hidden');
    authForm.classList.remove('hidden');
}

// Add keyboard navigation for dropdown
document.addEventListener('keydown', function(event) {
    if (!employeeDropdown || employeeDropdown.classList.contains('hidden')) return;
    
    const items = employeeDropdown.querySelectorAll('.dropdown-item');
    const currentIndex = Array.from(items).findIndex(item => item.classList.contains('selected'));
    
    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            if (currentIndex < items.length - 1) {
                items[currentIndex + 1].click();
            }
            break;
        case 'ArrowUp':
            event.preventDefault();
            if (currentIndex > 0) {
                items[currentIndex - 1].click();
            }
            break;
        case 'Enter':
            event.preventDefault();
            if (currentIndex >= 0) {
                items[currentIndex].click();
            }
            break;
        case 'Escape':
            hideDropdown();
            employeeSelect.focus();
            break;
    }
});

// ===== AVAILABILITY PAGE FUNCTIONS =====

// Storage for selected days
let selectedDays = new Set();

// Storage for time selections
let timeSelections = {
  tuesday: { start: null, end: null },
  wednesday: { start: null, end: null },
  thursday: { start: null, end: null },
  friday: { start: null, end: null },
  saturday: { start: null, end: null },
  sunday: { start: null, end: null }
};

// Setup availability page
function setupAvailabilityPage() {
    // Check if we're on the availability page
    if (!document.getElementById('employeeName')) {
        return;
    }
    
    // Get employee data from session storage (passed from login)
    const employeeData = getEmployeeFromSession();
    if (!employeeData) {
        // Redirect to login if no employee data
        window.location.href = 'index.html';
        return;
    }
    
    // Display employee name
    displayEmployeeName(employeeData);
    
    // Calculate and display date range
    const dateRange = calculateDateRange();
    displayDateRange(dateRange);
    
    // Setup day selection event listeners
    setupDaySelectionListeners();
    
    // Load previously selected days and time selections
    loadPreviousSelections();
}

// Get employee data from session storage
function getEmployeeFromSession() {
    try {
        const employeeData = sessionStorage.getItem('authenticatedEmployee');
        return employeeData ? JSON.parse(employeeData) : null;
    } catch (error) {
        console.error('Error retrieving employee data from session:', error);
        return null;
    }
}

// Display employee name
function displayEmployeeName(employee) {
    const employeeNameElement = document.getElementById('employeeName');
    if (employeeNameElement && employee) {
        employeeNameElement.textContent = `${employee.name} ${employee.surname}`;
    }
}

// Calculate date range from next Tuesday to Sunday
function calculateDateRange() {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Calculate days until next Tuesday
    let daysUntilTuesday;
    switch (currentDay) {
        case 0: // Sunday
            daysUntilTuesday = 2;
            break;
        case 1: // Monday
            daysUntilTuesday = 1;
            break;
        case 2: // Tuesday
            daysUntilTuesday = 7; // Next week's Tuesday
            break;
        case 3: // Wednesday
            daysUntilTuesday = 6;
            break;
        case 4: // Thursday
            daysUntilTuesday = 5;
            break;
        case 5: // Friday
            daysUntilTuesday = 4;
            break;
        case 6: // Saturday
            daysUntilTuesday = 3;
            break;
    }
    
    // Calculate next Tuesday
    const nextTuesday = new Date(today);
    nextTuesday.setDate(today.getDate() + daysUntilTuesday);
    
    // Calculate the Sunday that follows (5 days later)
    const followingSunday = new Date(nextTuesday);
    followingSunday.setDate(nextTuesday.getDate() + 5);
    
    return {
        startDate: nextTuesday,
        endDate: followingSunday
    };
}

// Format date range for display
function formatDateRange(dateRange) {
    const startDate = dateRange.startDate;
    const endDate = dateRange.endDate;
    
    const startFormatted = formatDate(startDate);
    const endFormatted = formatDate(endDate);
    
    return `${startFormatted} - ${endFormatted}`;
}

// Format individual date as "Day, DD MMM"
function formatDate(date) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = dayNames[date.getDay()];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    
    return `${dayName}, ${day} ${month}`;
}

// Display date range
function displayDateRange(dateRange) {
    const dateRangeElement = document.getElementById('dateRange');
    if (dateRangeElement) {
        const formattedRange = formatDateRange(dateRange);
        dateRangeElement.textContent = formattedRange;
    }
}

// Setup day selection event listeners
function setupDaySelectionListeners() {
    const dayCheckboxes = document.querySelectorAll('.day-checkbox');
    
    dayCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleDaySelection);
    });
}

// Load previous selections from session storage
function loadPreviousSelections() {
    try {
        // Load selected days
        const savedDays = sessionStorage.getItem('selectedDays');
        if (savedDays) {
            const daysArray = JSON.parse(savedDays);
            selectedDays = new Set(daysArray);
            
            // Check the appropriate checkboxes
            daysArray.forEach(day => {
                const checkbox = document.querySelector(`[data-day="${day}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                    createTimeAvailabilityElement(day);
                }
            });
        }
        
        // Load time selections
        const savedTimeSelections = sessionStorage.getItem('timeSelections');
        if (savedTimeSelections) {
            timeSelections = JSON.parse(savedTimeSelections);
            
            // Update timeline displays for selected days
            Object.keys(timeSelections).forEach(day => {
                if (timeSelections[day].start !== null && timeSelections[day].end !== null) {
                    updateTimelineDisplay(day);
                }
            });
        }
    } catch (error) {
        console.error('Error loading previous selections:', error);
    }
}

// Handle day selection
function handleDaySelection(event) {
    const checkbox = event.target;
    const day = checkbox.dataset.day;
    
    console.log(`Day selection changed: ${day}, checked: ${checkbox.checked}`);
    
    if (checkbox.checked) {
        selectedDays.add(day);
        console.log(`Creating time availability element for ${day}`);
        createTimeAvailabilityElement(day);
    } else {
        selectedDays.delete(day);
        removeTimeAvailabilityElement(day);
    }
    
    // Store selected days in session storage for future use
    sessionStorage.setItem('selectedDays', JSON.stringify(Array.from(selectedDays)));
    
    // Store time selections in session storage
    sessionStorage.setItem('timeSelections', JSON.stringify(timeSelections));
    
    console.log('Selected days:', Array.from(selectedDays));
    console.log('Time selections:', timeSelections);
}

// Store employee data in session when continuing from login
function storeEmployeeInSession(employee) {
    try {
        sessionStorage.setItem('authenticatedEmployee', JSON.stringify(employee));
    } catch (error) {
        console.error('Error storing employee data in session:', error);
    }
}

// ===== TIMELINE FUNCTIONS =====

// Create time availability element for a specific day
function createTimeAvailabilityElement(day) {
    const container = document.getElementById('timeAvailabilityContainer');
    if (!container) {
        console.error('Time availability container not found');
        return;
    }
    
    // Check if element already exists
    if (document.getElementById(`time-availability-${day}`)) {
        return;
    }
    
    // Check if config is available
    if (typeof AVAILABILITY_CONFIG === 'undefined') {
        console.error('AVAILABILITY_CONFIG not loaded');
        return;
    }
    
    const dayConfig = AVAILABILITY_CONFIG.dayTimeRanges[day];
    if (!dayConfig) {
        console.error(`No config found for day: ${day}`);
        return;
    }
    
    // Create container element
    const timeElement = document.createElement('div');
    timeElement.id = `time-availability-${day}`;
    timeElement.className = 'time-availability-container';
    timeElement.style.cssText = 'background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);';
    
    // Capitalize day name for display
    const dayName = day.charAt(0).toUpperCase() + day.slice(1);
    
    // Create HTML structure with horizontal timeline
    timeElement.innerHTML = `
        <h3 style="font-size: 16px; font-weight: 600; color: #102a43; margin-bottom: 16px;">${dayName}</h3>
        <div class="timeline-slider" id="timeline-${day}" style="position: relative; width: 100%; height: 60px; margin-bottom: 16px;">
            <div class="timeline-track" style="position: absolute; top: 50%; left: 0; width: 100%; height: 8px; background-color: #e5e7eb; border-radius: 4px; transform: translateY(-50%);"></div>
            <div class="timeline-range" id="range-${day}" style="position: absolute; top: 50%; height: 8px; background-color: #486581; border-radius: 4px; transform: translateY(-50%); transition: all 0.2s ease;"></div>
            <div class="timeline-handle" id="handle-start-${day}" data-type="start" style="position: absolute; top: 50%; width: 20px; height: 20px; background-color: #486581; border-radius: 50%; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transform: translate(-50%, -50%); transition: all 0.2s ease; z-index: 10;"></div>
            <div class="timeline-handle" id="handle-end-${day}" data-type="end" style="position: absolute; top: 50%; width: 20px; height: 20px; background-color: #486581; border-radius: 50%; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transform: translate(-50%, -50%); transition: all 0.2s ease; z-index: 10;"></div>
        </div>
        <div class="time-display-boxes" style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
            <div class="time-display-box" style="background-color: #f9fafb; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; text-align: center; min-width: 80px;">
                <div class="label" style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Start Time</div>
                <div class="time" id="start-time-${day}" style="font-size: 18px; font-family: monospace; font-weight: 600; color: #102a43;">09:00</div>
            </div>
            <div class="time-display-box" style="background-color: #f9fafb; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; text-align: center; min-width: 80px;">
                <div class="label" style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">End Time</div>
                <div class="time" id="end-time-${day}" style="font-size: 18px; font-family: monospace; font-weight: 600; color: #102a43;">13:00</div>
            </div>
        </div>
    `;
    
    container.appendChild(timeElement);
    
    // Initialize timeline
    setupTimelineSlider(day, timeElement);
    
    // Set initial time selections
    const startTime = dayConfig.start;
    const endTime = Math.min(startTime + AVAILABILITY_CONFIG.minWorkingHours, dayConfig.end);
    
    timeSelections[day] = { start: startTime, end: endTime };
    updateTimelineDisplay(day);
    
    console.log(`Created time availability element for ${day}:`, timeSelections[day]);
    console.log('Timeline element HTML:', timeElement.innerHTML);
}

// Remove time availability element for a specific day
function removeTimeAvailabilityElement(day) {
    const element = document.getElementById(`time-availability-${day}`);
    if (element) {
        element.remove();
    }
    
    // Clear time selections
    timeSelections[day] = { start: null, end: null };
}

// Setup timeline slider for a specific day
function setupTimelineSlider(day, container) {
    console.log(`Setting up timeline slider for ${day}`);
    const dayConfig = AVAILABILITY_CONFIG.dayTimeRanges[day];
    const timeline = container.querySelector(`#timeline-${day}`);
    const startHandle = container.querySelector(`#handle-start-${day}`);
    const endHandle = container.querySelector(`#handle-end-${day}`);
    const range = container.querySelector(`#range-${day}`);
    
    console.log('Timeline elements found:', { timeline, startHandle, endHandle, range });
    
    if (!timeline || !startHandle || !endHandle || !range) {
        console.error('Missing timeline elements for', day);
        return;
    }
    
    // Generate timeline ticks and labels
    generateTimelineTicks(day, timeline, dayConfig);
    
    // Setup handle interactions
    setupHandleInteraction(startHandle, day, 'start');
    setupHandleInteraction(endHandle, day, 'end');
    
    // Initial positioning
    updateTimelineDisplay(day);
}

// Generate timeline ticks and labels
function generateTimelineTicks(day, timeline, dayConfig) {
    const { start, end } = dayConfig;
    const { majorTickInterval, minorTickInterval } = AVAILABILITY_CONFIG.timelineSettings;
    
    // Clear existing ticks
    const existingTicks = timeline.querySelectorAll('.timeline-tick, .timeline-label');
    existingTicks.forEach(tick => tick.remove());
    
    // Generate ticks - start from even hours
    const startHour = Math.ceil(start / 2) * 2; // Round up to next even hour
    for (let hour = startHour; hour <= end; hour += minorTickInterval) {
        const isMajor = (hour - startHour) % majorTickInterval === 0;
        
        // Create tick
        const tick = document.createElement('div');
        tick.className = `timeline-tick ${isMajor ? 'major' : 'minor'}`;
        
        // Position tick and add inline styles
        const position = ((hour - start) / (end - start)) * 100;
        tick.style.left = `${position}%`;
        tick.style.position = 'absolute';
        tick.style.top = '50%';
        tick.style.transform = 'translateY(-50%)';
        tick.style.backgroundColor = '#9ca3af';
        
        if (isMajor) {
            tick.style.width = '4px';
            tick.style.height = '16px';
        } else {
            tick.style.width = '1px';
            tick.style.height = '8px';
        }
        
        timeline.appendChild(tick);
        
        // Add label for major ticks
        if (isMajor) {
            const label = document.createElement('div');
            label.className = 'timeline-label';
            label.textContent = formatHour(hour);
            label.style.position = 'absolute';
            label.style.left = `${position}%`;
            label.style.top = '8px';
            label.style.transform = 'translateX(-50%)';
            label.style.fontSize = '12px';
            label.style.color = '#6b7280';
            label.style.whiteSpace = 'nowrap';
            timeline.appendChild(label);
        }
    }
}

// Setup handle interaction (drag functionality)
function setupHandleInteraction(handle, day, type) {
    let isDragging = false;
    let startX = 0;
    let startPosition = 0;
    
    // Mouse events
    handle.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startPosition = parseFloat(handle.style.left) || 0;
        handle.style.cursor = 'grabbing';
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - startX;
        const timeline = document.getElementById(`timeline-${day}`);
        const timelineRect = timeline.getBoundingClientRect();
        const timelineWidth = timelineRect.width;
        
        const deltaPercent = (deltaX / timelineWidth) * 100;
        const newPosition = Math.max(0, Math.min(100, startPosition + deltaPercent));
        
        updateHandlePosition(day, type, newPosition);
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            handle.style.cursor = 'grab';
        }
    });
    
    // Touch events for mobile
    handle.addEventListener('touchstart', (e) => {
        isDragging = true;
        startX = e.touches[0].clientX;
        startPosition = parseFloat(handle.style.left) || 0;
        e.preventDefault();
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        
        const deltaX = e.touches[0].clientX - startX;
        const timeline = document.getElementById(`timeline-${day}`);
        const timelineRect = timeline.getBoundingClientRect();
        const timelineWidth = timelineRect.width;
        
        const deltaPercent = (deltaX / timelineWidth) * 100;
        const newPosition = Math.max(0, Math.min(100, startPosition + deltaPercent));
        
        updateHandlePosition(day, type, newPosition);
        e.preventDefault();
    });
    
    document.addEventListener('touchend', () => {
        if (isDragging) {
            isDragging = false;
        }
    });
}

// Update handle position and validate
function updateHandlePosition(day, type, positionPercent) {
    const dayConfig = AVAILABILITY_CONFIG.dayTimeRanges[day];
    const { start, end } = dayConfig;
    
    // Convert position to hour
    const hour = start + (positionPercent / 100) * (end - start);
    const snappedHour = Math.round(hour);
    
    // Validate and update
    if (type === 'start') {
        const currentEnd = timeSelections[day].end;
        const minEnd = snappedHour + AVAILABILITY_CONFIG.minWorkingHours;
        
        if (minEnd <= end) {
            timeSelections[day].start = snappedHour;
            if (currentEnd < minEnd) {
                timeSelections[day].end = minEnd;
            }
        }
    } else if (type === 'end') {
        const currentStart = timeSelections[day].start;
        const maxStart = snappedHour - AVAILABILITY_CONFIG.minWorkingHours;
        
        if (maxStart >= start) {
            timeSelections[day].end = snappedHour;
            if (currentStart > maxStart) {
                timeSelections[day].start = maxStart;
            }
        }
    }
    
    updateTimelineDisplay(day);
}


// Update timeline display
function updateTimelineDisplay(day) {
    const dayConfig = AVAILABILITY_CONFIG.dayTimeRanges[day];
    const { start: dayStart, end: dayEnd } = dayConfig;
    const { start: timeStart, end: timeEnd } = timeSelections[day];
    
    if (timeStart === null || timeEnd === null) return;
    
    // Update handle positions
    const startHandle = document.getElementById(`handle-start-${day}`);
    const endHandle = document.getElementById(`handle-end-${day}`);
    const range = document.getElementById(`range-${day}`);
    
    if (startHandle && endHandle && range) {
        const startPercent = ((timeStart - dayStart) / (dayEnd - dayStart)) * 100;
        const endPercent = ((timeEnd - dayStart) / (dayEnd - dayStart)) * 100;
        
        startHandle.style.left = `${startPercent}%`;
        endHandle.style.left = `${endPercent}%`;
        
        // Update range
        range.style.left = `${startPercent}%`;
        range.style.width = `${endPercent - startPercent}%`;
        
        // Validate and show feedback
        const isValid = validateTimeRange(timeStart, timeEnd, day);
        const container = document.getElementById(`time-availability-${day}`);
        if (container) {
            container.classList.toggle('timeline-invalid', !isValid);
        }
    }
    
    // Update time display boxes
    const startTimeDisplay = document.getElementById(`start-time-${day}`);
    const endTimeDisplay = document.getElementById(`end-time-${day}`);
    
    if (startTimeDisplay) {
        startTimeDisplay.textContent = formatHour(timeStart);
    }
    if (endTimeDisplay) {
        endTimeDisplay.textContent = formatHour(timeEnd);
    }
}

// Validate time range
function validateTimeRange(startTime, endTime, day) {
    const dayConfig = AVAILABILITY_CONFIG.dayTimeRanges[day];
    const { start: dayStart, end: dayEnd } = dayConfig;
    
    // Check if times are within day range
    if (startTime < dayStart || endTime > dayEnd) {
        return false;
    }
    
    // Check minimum working hours
    if (endTime - startTime < AVAILABILITY_CONFIG.minWorkingHours) {
        return false;
    }
    
    return true;
}

// Format hour for display
function formatHour(hour) {
    const hours = Math.floor(hour);
    const minutes = Math.round((hour - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}