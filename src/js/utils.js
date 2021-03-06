export const distanceBetween = (p1, p2) => Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

export const angleBetween = (p1, p2) => Math.atan2(p2.x - p1.x, p2.y - p1.y);

export const getPixelCounter = (pixels, callback) => {
  let counter = 0;

  for (let i = 0; i < pixels.length; i+=4) {
    const pixel = {
      r: pixels[i],
      g: pixels[i+1],
      b: pixels[i+2],
      a: pixels[i+3]
    };

    if (callback(pixel)) counter += 1;
  }

  return counter;
};

/** 
 * createStore method from Redux
*/
export const createStore = (reducer) => {
  let state;
  let listeners = [];

  const getState = () => state;

  const dispatch = (action) => {
    state = reducer(state, action);

    // console.log('--------------------');
    // console.log('action:', action)
    // console.log('current state:', state);
    // console.log('--------------------');
    
    listeners.forEach(listener => listener());
  };

  const suscribe = (listener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    }
  };

  dispatch({});

  return { getState, dispatch, suscribe };
};

/**
 * number to string and size digits
 * base code from: https://www.electrictoolbox.com/pad-number-zeroes-javascript/
 */
export const pad = (number, length) => {
  var str = '' + number;
  while (str.length < length) {
      str = '0' + str;
  }
  return str;
}

/**
 * Detect mobile agent devices
 */
export const isMobile = () => /iPhone|iPod|iPad|Android/i.test(navigator.userAgent);

/**
 * Detect mobile agent smarthphones
 */
export const isSmarthphone = () => window.innerWidth < 768 && isMobile();

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
export const debounce = (func, wait, immediate) => {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};