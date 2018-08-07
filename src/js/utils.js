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