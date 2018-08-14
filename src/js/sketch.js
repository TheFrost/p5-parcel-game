import p5 from 'p5/lib/p5.min.js';
import PubSub from './pubsub';
import { debounce } from 'underscore';

export default class Sketch {
  constructor(config) {
    this.p5 = null;
    this.buffer = null;

    this.sketch = {
      w: 360, 
      h: 640, 
      timeLimit: 60,
      setupBuffer: false,
      parent: null,
      ...config 
    };
    
    this.pubsub = new PubSub();

    this.BASE_WIDTH = this.sketch.w;
    this.BASE_HEIGHT = this.sketch.h;
    this.BASE_FACTOR = 0.9;

    this.p5Instance();
  }

  p5Instance() {
    this.p5 = new p5((s) => { 
      s.preload = this.preload.bind(this);
      s.setup = this.p5Setup.bind(this); 
      s.draw = this.draw.bind(this);
      s.touchStarted = this.pointerStart.bind(this);
      s.touchEnded = this.pointerRelease.bind(this);
      s.mousePressed = this.pointerStart.bind(this);
      s.mouseReleased = this.pointerRelease.bind(this);
      s.windowResized = debounce(this.windowResize.bind(this), 100);
      return s;
    }, this.sketch.parent);
  }

  preload() {}

  p5Setup() {
    const { p5 } = this;

    this.canvas = p5.createCanvas(
      this.BASE_WIDTH,
      this.BASE_HEIGHT
    );
    p5.noLoop();
    p5.pixelDensity(1);

    if (this.sketch.setupBuffer) {
      this.buffer = p5.createGraphics(
        this.BASE_WIDTH,
        this.BASE_HEIGHT
      );

      this.buffer.pixelDensity(1);
    } 

    this.windowResize();

    this.setup();
  }
  
  resizeCalc() {
    const { visualViewport, innerWidth, innerHeight } = window;
    const viweportWidth = visualViewport ? visualViewport.width : innerWidth;
    const viweportHeight = visualViewport ? visualViewport.height : innerHeight;

    this.GAME_SCALE = Math.min(
      viweportWidth / this.BASE_WIDTH,
      viweportHeight / this.BASE_HEIGHT
    ) * this.BASE_FACTOR;

    this.GAME_WIDTH = Math.ceil(this.BASE_WIDTH * this.GAME_SCALE);
    this.GAME_HEIGHT = Math.ceil(this.BASE_HEIGHT * this.GAME_SCALE);
  }
  
  pointerStart() {}

  pointerRelease() {}

  windowResize() {
    this.resizeCalc();
    this.resize();
    this.p5.resizeCanvas(this.GAME_WIDTH, this.GAME_HEIGHT);
  }

  setup() {}

  resize() {}
}