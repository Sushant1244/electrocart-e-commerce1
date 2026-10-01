/**
 * Self-Updating Mechanism Utility
 * 
 * A flexible system for automatically changing content, values, states, or appearances
 * based on predefined conditions, time intervals, user interactions, or external data inputs.
 * 
 * Features:
 * - Configurable change frequency (time-based intervals)
 * - Transition effects between content changes
 * - Update rules based on conditions
 * - External data input support
 * - Multiple update strategies
 */

// Default configuration options
export const DEFAULT_CONFIG = {
  // Time interval in milliseconds (default: 5 seconds)
  interval: 5000,
  
  // Enable auto-rotation
  autoRotate: true,
  
  // Enable transition effects
  enableTransitions: true,
  
  // Transition duration in milliseconds
  transitionDuration: 500,
  
  // Transition type: 'fade', 'slide', 'flip', 'zoom', 'none'
  transitionType: 'fade',
  
  // Direction for slide transitions: 'left', 'right', 'up', 'down'
  direction: 'left',
  
  // Pause on hover/pause
  pauseOnHover: true,
  
  // Randomize order on each cycle
  randomize: false,
  
  // Loop through items
  loop: true,
  
  // Start index
  startIndex: 0,
  
  // Callback when update occurs
  onUpdate: null,
  
  // Callback when index changes
  onIndexChange: null,
  
  // Custom condition function for auto-update
  shouldUpdate: () => true,
  
  // External data source URL (optional)
  dataSource: null,
  
  // Data refresh interval in milliseconds
  dataRefreshInterval: 60000,
  
  // Enable data refresh from external source
  enableDataRefresh: false,
};

// Transition CSS class mappings
const TRANSITION_CLASSES = {
  fade: 'self-updating-fade',
  slide: 'self-updating-slide',
  flip: 'self-updating-flip',
  zoom: 'self-updating-zoom',
  none: 'self-updating-none',
};

/**
 * Creates a self-updater instance with the given items and configuration
 * @param {Array} items - Array of content/items to cycle through
 * @param {Object} config - Configuration options
 * @returns {Object} Self-updater instance
 */
export function createSelfUpdater(items = [], config = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  let currentIndex = mergedConfig.startIndex;
  let intervalId = null;
  let isPaused = false;
  let itemsCopy = [...items];
  
  if (mergedConfig.randomize) {
    itemsCopy = shuffleArray(itemsCopy);
  }
  
  // Get current item
  const getCurrentItem = () => itemsCopy[currentIndex];
  
  // Get current index
  const getCurrentIndex = () => currentIndex;
  
  // Get total items count
  const getTotalItems = () => itemsCopy.length;
  
  // Move to next item
  const next = () => {
    const previousIndex = currentIndex;
    currentIndex = (currentIndex + 1) % itemsCopy.length;
    
    // Handle non-looping behavior
    if (!mergedConfig.loop && currentIndex === 0) {
      currentIndex = previousIndex;
      return null;
    }
    
    if (mergedConfig.onIndexChange) {
      mergedConfig.onIndexChange(currentIndex, previousIndex);
    }
    
    return getCurrentItem();
  };
  
  // Move to previous item
  const previous = () => {
    const previousIndex = currentIndex;
    currentIndex = (currentIndex - 1 + itemsCopy.length) % itemsCopy.length;
    
    if (mergedConfig.onIndexChange) {
      mergedConfig.onIndexChange(currentIndex, previousIndex);
    }
    
    return getCurrentItem();
  };
  
  // Jump to specific index
  const goTo = (index) => {
    if (index >= 0 && index < itemsCopy.length) {
      const previousIndex = currentIndex;
      currentIndex = index;
      
      if (mergedConfig.onIndexChange) {
        mergedConfig.onIndexChange(currentIndex, previousIndex);
      }
      
      return getCurrentItem();
    }
    return null;
  };
  
  // Update items array
  const setItems = (newItems) => {
    itemsCopy = [...newItems];
    if (mergedConfig.randomize) {
      itemsCopy = shuffleArray(itemsCopy);
    }
    // Reset to start index if out of bounds
    if (currentIndex >= itemsCopy.length) {
      currentIndex = 0;
    }
  };
  
  // Start auto-rotation
  const start = (callback) => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    
    intervalId = setInterval(() => {
      if (!isPaused && mergedConfig.shouldUpdate()) {
        const newItem = next();
        if (callback && newItem) {
          callback(newItem, currentIndex, itemsCopy);
        }
        if (mergedConfig.onUpdate) {
          mergedConfig.onUpdate(newItem, currentIndex);
        }
      }
    }, mergedConfig.interval);
    
    return intervalId;
  };
  
  // Stop auto-rotation
  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
  
  // Pause auto-rotation
  const pause = () => {
    isPaused = true;
  };
  
  // Resume auto-rotation
  const resume = () => {
    isPaused = false;
  };
  
  // Get current configuration
  const getConfig = () => ({ ...mergedConfig });
  
  // Update configuration
  const updateConfig = (newConfig) => {
    Object.assign(mergedConfig, newConfig);
  };
  
  // Shuffle array helper
  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  return {
    getCurrentItem,
    getCurrentIndex,
    getTotalItems,
    next,
    previous,
    goTo,
    setItems,
    start,
    stop,
    pause,
    resume,
    getConfig,
    updateConfig,
    isRunning: () => intervalId !== null,
    isPaused: () => isPaused,
  };
}

/**
 * Creates a time-based self-updater for countdown timers, real-time updates, etc.
 * @param {Object} options - Time-based update options
 * @returns {Object} Time-based updater instance
 */
export function createTimeBasedUpdater(options = {}) {
  const {
    updateInterval = 1000,
    onTick,
    onComplete,
    startTime,
    endTime,
    countDown = true,
  } = options;
  
  let intervalId = null;
  let currentTime = startTime || Date.now();
  const targetTime = endTime || (currentTime + 60000); // Default 1 minute
  
  const getTimeRemaining = () => {
    const diff = countDown ? targetTime - currentTime : currentTime - targetTime;
    return {
      total: diff,
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / 1000 / 60) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      milliseconds: diff % 1000,
      isComplete: diff <= 0,
    };
  };
  
  const start = () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    
    intervalId = setInterval(() => {
      currentTime = countDown ? currentTime + updateInterval : currentTime - updateInterval;
      const timeRemaining = getTimeRemaining();
      
      if (onTick) {
        onTick(timeRemaining);
      }
      
      if (timeRemaining.isComplete) {
        if (onComplete) {
          onComplete();
        }
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    }, updateInterval);
    
    return intervalId;
  };
  
  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
  
  const reset = () => {
    currentTime = startTime || Date.now();
  };
  
  const setEndTime = (newEndTime) => {
    // This would need to be implemented based on specific needs
  };
  
  return {
    start,
    stop,
    reset,
    getTimeRemaining,
    isRunning: () => intervalId !== null,
  };
}

/**
 * Creates a condition-based self-updater that monitors external conditions
 * @param {Object} options - Condition-based update options
 * @returns {Object} Condition-based updater instance
 */
export function createConditionBasedUpdater(options = {}) {
  const {
    checkCondition,
    onConditionMet,
    checkInterval = 1000,
    immediateCheck = true,
    maxChecks = 0, // 0 = infinite
  } = options;
  
  let intervalId = null;
  let checkCount = 0;
  
  const start = () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    
    // Immediate first check
    if (immediateCheck) {
      checkAndUpdate();
    }
    
    intervalId = setInterval(() => {
      checkAndUpdate();
    }, checkInterval);
    
    return intervalId;
  };
  
  const checkAndUpdate = () => {
    if (maxChecks > 0 && checkCount >= maxChecks) {
      stop();
      return;
    }
    
    checkCount++;
    
    const result = checkCondition();
    if (result) {
      if (onConditionMet) {
        onConditionMet(result);
      }
      // Continue checking unless explicitly stopped
    }
  };
  
  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
  
  const reset = () => {
    checkCount = 0;
  };
  
  return {
    start,
    stop,
    reset,
    isRunning: () => intervalId !== null,
    getCheckCount: () => checkCount,
  };
}

/**
 * Creates a data-polling self-updater for external API data
 * @param {Object} options - Data polling options
 * @returns {Object} Data polling updater instance
 */
export function createDataPollingUpdater(options = {}) {
  const {
    fetchData,
    onDataUpdate,
    onError,
    pollInterval = 30000,
    compareData, // Function to compare old vs new data
    immediateFetch = true,
  } = options;
  
  let intervalId = null;
  let lastData = null;
  
  const fetchAndUpdate = async () => {
    try {
      const newData = await fetchData();
      
      // Compare data if comparison function provided
      if (compareData && lastData !== null) {
        const hasChanged = compareData(lastData, newData);
        if (hasChanged && onDataUpdate) {
          onDataUpdate(newData, lastData);
        }
      } else if (onDataUpdate) {
        // Always notify if no comparison function
        onDataUpdate(newData, lastData);
      }
      
      lastData = newData;
    } catch (error) {
      if (onError) {
        onError(error);
      }
    }
  };
  
  const start = () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    
    // Immediate first fetch
    if (immediateFetch) {
      fetchAndUpdate();
    }
    
    intervalId = setInterval(fetchAndUpdate, pollInterval);
    
    return intervalId;
  };
  
  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
  
  const refresh = () => {
    return fetchAndUpdate();
  };
  
  const getLastData = () => lastData;
  
  return {
    start,
    stop,
    refresh,
    getLastData,
    isRunning: () => intervalId !== null,
  };
}

/**
 * Generates CSS for transition effects
 * @param {string} transitionType - Type of transition
 * @param {string} direction - Direction for slide transitions
 * @param {number} duration - Transition duration in ms
 * @returns {string} CSS string
 */
export function generateTransitionCSS(transitionType = 'fade', direction = 'left', duration = 500) {
  const baseStyles = `
    .self-updating-container {
      position: relative;
      overflow: hidden;
    }
    
    .self-updating-item {
      transition: all ${duration}ms ease-in-out;
    }
  `;
  
  const transitionStyles = {
    fade: `
      .self-updating-fade-enter {
        opacity: 0;
      }
      .self-updating-fade-enter-active {
        opacity: 1;
      }
      .self-updating-fade-exit {
        opacity: 1;
      }
      .self-updating-fade-exit-active {
        opacity: 0;
      }
    `,
    slide: `
      .self-updating-slide-left-enter {
        transform: translateX(100%);
      }
      .self-updating-slide-left-enter-active {
        transform: translateX(0);
      }
      .self-updating-slide-left-exit {
        transform: translateX(0);
      }
      .self-updating-slide-left-exit-active {
        transform: translateX(-100%);
      }
      .self-updating-slide-right-enter {
        transform: translateX(-100%);
      }
      .self-updating-slide-right-enter-active {
        transform: translateX(0);
      }
      .self-updating-slide-right-exit {
        transform: translateX(0);
      }
      .self-updating-slide-right-exit-active {
        transform: translateX(100%);
      }
      .self-updating-slide-up-enter {
        transform: translateY(100%);
      }
      .self-updating-slide-up-enter-active {
        transform: translateY(0);
      }
      .self-updating-slide-up-exit {
        transform: translateY(0);
      }
      .self-updating-slide-up-exit-active {
        transform: translateY(-100%);
      }
      .self-updating-slide-down-enter {
        transform: translateY(-100%);
      }
      .self-updating-slide-down-enter-active {
        transform: translateY(0);
      }
      .self-updating-slide-down-exit {
        transform: translateY(0);
      }
      .self-updating-slide-down-exit-active {
        transform: translateY(100%);
      }
    `,
    flip: `
      .self-updating-flip-enter {
        transform: rotateY(90deg);
        opacity: 0;
      }
      .self-updating-flip-enter-active {
        transform: rotateY(0);
        opacity: 1;
      }
      .self-updating-flip-exit {
        transform: rotateY(0);
        opacity: 1;
      }
      .self-updating-flip-exit-active {
        transform: rotateY(-90deg);
        opacity: 0;
      }
    `,
    zoom: `
      .self-updating-zoom-enter {
        transform: scale(0);
        opacity: 0;
      }
      .self-updating-zoom-enter-active {
        transform: scale(1);
        opacity: 1;
      }
      .self-updating-zoom-exit {
        transform: scale(1);
        opacity: 1;
      }
      .self-updating-zoom-exit-active {
        transform: scale(0);
        opacity: 0;
      }
    `,
    none: `
      .self-updating-none-enter,
      .self-updating-none-exit {
        opacity: 1;
        transform: none;
      }
    `,
  };
  
  return baseStyles + (transitionStyles[transitionType] || transitionStyles.fade);
}

/**
 * Format time remaining for display
 * @param {Object} timeRemaining - Time remaining object
 * @returns {Object} Formatted time strings
 */
export function formatTimeRemaining(timeRemaining) {
  const { days, hours, minutes, seconds, milliseconds } = timeRemaining;
  
  return {
    full: `${days}d ${hours}h ${minutes}m ${seconds}s`,
    short: `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
    compact: `${minutes}:${seconds.toString().padStart(2, '0')}`,
    withMs: `${seconds}.${Math.floor(milliseconds / 100)}s`,
  };
}

export default {
  createSelfUpdater,
  createTimeBasedUpdater,
  createConditionBasedUpdater,
  createDataPollingUpdater,
  generateTransitionCSS,
  formatTimeRemaining,
  DEFAULT_CONFIG,
};
