//script.js

let stepCountElement = document.getElementById("step-count");
let scoreElement = document.getElementById("score");
let comboElement = document.getElementById("combo");
let steps = 0;
let score = 0;
let combo = 0;
let maxComboTimeout = 5000;
let isTapping = false;
let tapDebounceDuration = 500;

let appInitialised = false;

let comboTimeout;
let progressBarUpdateTimeout;
let progressBarElement = document.getElementById("progress-bar");

async function applicationInitialisationEvent() {
  if (appInitialised) {
    return;
  }

  appInitialised = true;

  console.log('initialising the application');

  document.getElementById('supported-check-panel').style = 'display: none;';
  document.getElementById('capture-panel').style = '';

  try {
    await startMotionCapture();
  } catch (error) {
    console.error("Failed to start motion capture:", error);
  }
}

applicationInitialisationEvent();

async function startMotionCapture() {
  let buffer = [];
  let bufferSize = 20;
  let threshold = .23;

  if ('Accelerometer' in window) {
    try {
      const accelerometer = new Accelerometer({frequency: 60});
      accelerometer.addEventListener('reading', () => {
        if (isTapping) {
          return;
        }

        let magnitude = Math.sqrt(accelerometer.x * accelerometer.x + accelerometer.y * accelerometer.y + accelerometer.z * accelerometer.z);
        buffer.push(magnitude);

        if (buffer.length > bufferSize) {
          buffer.shift();

          if (isPeak(buffer, threshold)) {
            steps++;
            stepCountElement.textContent = steps;
            createSquare();
          }
        }
      });
      accelerometer.start();
    } catch (error) {
      console.error('Could not instantiate accelerometer:', error);
      // Fall back to devicemotion event
      window.addEventListener('devicemotion', onDeviceMotionEvent, true);
    }
  } else {
    console.warn('Accelerometer not supported');
    // Fall back to devicemotion event
    window.addEventListener('devicemotion', onDeviceMotionEvent, true);
  }

  function onDeviceMotionEvent(e) {
    if (isTapping) {
      return;
    }

    const acceleration = e.accelerationIncludingGravity;
    let magnitude = Math.sqrt(acceleration.x * acceleration.x + acceleration.y * acceleration.y + acceleration.z * acceleration.z);
    buffer.push(magnitude);

    if (buffer.length > bufferSize) {
      buffer.shift();

      if (isPeak(buffer, threshold)) {
        steps++;
        stepCountElement.textContent = steps;
        createSquare();
      }
    }
  }
}
  
  function isPeak(data, threshold) {
    const middle = Math.floor(data.length / 2);
    const peak = data[middle];
  
    for (let i = 0; i < data.length; i++) {
      if (i !== middle && (peak <= data[i] || peak - data[i] < threshold)) {
        return false;
      }
    }
  
    return true;
  }

function movingAverage(data) {
  let sum = data.reduce((acc, val) => acc + val, 0);
  return sum / data.length;
}


function createSquare() {
    let square = document.createElement("div");
    square.className = "square";
    square.style.backgroundColor = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
    
    let xPosition = Math.random() * (window.innerWidth - 50);
    let yPosition = Math.random() * (window.innerHeight - 50-180)+180;
  
    square.style.left = `${xPosition}px`;
    square.style.top = `${yPosition}px`;
  
    square.addEventListener('touchstart', () => {
        isTapping = true;
      });
    
      square.addEventListener('touchend', () => {
        incrementScore();
        clearTimeout(comboTimeout);
        increaseCombo();
        updateComboTimeout();
        square.remove();
        clearTimeout(removeSquareTimeout)
        setTimeout(() => {
          isTapping = false;
        }, tapDebounceDuration);
      });
      const removeSquareTimeout = setTimeout(() => {
        square.remove();
      }, 3500);
    
    document.body.appendChild(square);
  }
  function debounce(func, wait) {
    let timeout;
  
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
  
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  function incrementScore() {
    score += (1 * (1 + combo));
    scoreElement.textContent = score;
  }
  
  function increaseCombo() {
    combo++;
    updateProgressBarColor();
    comboElement.textContent = combo;
  }

  function updateProgressBarColor() {
    let maxCombo = 100; // Set this to your max combo
    let hue = (1 - (combo / maxCombo)) * 240; // Map combo to a value between 0 (red) and 240 (blue)
    // Calculate the opposite hue, but keep it within the range of 0 (red) to 240 (blue)
    let oppositeHue = (combo / maxCombo) * 240;


    progressBarElement.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;
    progressBarElement.style.boxShadow = `0 0 10px hsl(${hue}, 100%, 50%)`;

    let bodyBackgroundColor = `hsl(${hue}, 100%, 70%)`; // Lighten the hue for the background
    let bodyBackgroundOppositeColor = `hsl(${oppositeHue}, 100%, 70%)`; // Opposite hue for the other color
    window.requestAnimationFrame(function() {
      document.body.style.background = `radial-gradient(circle, ${bodyBackgroundOppositeColor}, ${bodyBackgroundColor})`;
    });
  }
  
  
  
  function resetCombo() {
    combo = 0;
    comboElement.textContent = combo;
    document.body.style.background=`radial-gradient(circle, hsl(0, 100%, 70%), hsl(240, 100%, 70%))`;
    resetProgressBar();
  }
  
  function updateComboTimeout() {
    let comboTimeoutDuration = Math.max(maxComboTimeout - (combo*.5) * 100, 700);
    updateProgressBar(comboTimeoutDuration);
    comboTimeout = setTimeout(() => {
      resetCombo();
    }, comboTimeoutDuration);
    
  }

  function updateProgressBar(duration){
    progressBarElement.style.animation= 'none'; // Reset the animation
    progressBarElement.offsetHeight; // Cause a reflow, flushing the CSS changes
    progressBarElement.style.animation= `scrollaway ${duration}ms linear forwards`
  }
  
  function resetProgressBar() {
    progressBarElement.style.animation = 'none';
    progressBarElement.style.width = '0%';
  }
  