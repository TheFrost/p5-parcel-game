import Sketch from './sketch';
import store from './store';
import { distanceBetween, angleBetween, getPixelCounter } from './utils';

export default class SketchPlayer extends Sketch {
  constructor(config) {
    super(config);

    this.completeShapePixels = 0;
    this.minProgress = 80;
    
    this.brushPos = null;
    this.lastPoint = null;
    
    // flags
    this.gameOver = false;
    this.isDrawing = false;
    this.isTheFirstPhase = true;
    this.isRenderingShape = true;
    this.isRedrawingBuffer = false;

    this.bindEvents();
  }

  //#region p5.js main methods
  preload() {
    this.shape = this.p5.loadImage('resources/shape.png');
  }
  
  draw() {
    const state = store.getState();

    switch(state.gameState) {
      case 'PLAY':
        this.renderScene();
        this.renderUserPlay();
        return;
      case 'GAME_OVER':
        this.renderScene();
        return;
      default: return;
    }
  }
  //#endregion p5.js main methods
  
  //#region p5.js event handlers
  pointerStart(e) {
    e.preventDefault();
    
    const state = store.getState();
    if (state.gameState === 'GAME_OVER') return;

    this.isDrawing = true;
    this.lastPoint = { x: this.p5.mouseX, y: this.p5.mouseY };
  }

  pointerRelease() {
    const state = store.getState();
    if (state.gameState === 'GAME_OVER') return;

    this.isDrawing = false;
    this.validatePixels();
  }

  resize() { this.isRedrawingBuffer = true; }
  //#endregion p5.js event handlers

  //#region Custom methods
  bindEvents() {
    this.pubsub.suscribe('uiSpriteReady', this.setupAssets.bind(this));
  }

  setupAssets({ spriteMedia, tilesetData }) {
    this.spriteMedia = spriteMedia;

    // brush
    const brushTileset = tilesetData.frames['brush-cheese.png'];
    this.brushData = {
      wDraw: 10,
      hDraw: 10,
      ...brushTileset.frame
    };

    // bg game --------------------------------
    const bgGame = tilesetData.frames['bg.jpg'];
    this.bgGame = {
      xDraw: 0,
      yDraw: 0,
      ...bgGame.frame
    };

    store.dispatch({type: 'SET_PLAYER_SKETCH_READY'});
  }

  drawBrush() {
    const { p5 } = this;

    const currentPoint = { x: p5.mouseX, y: p5.mouseY };
    const dist = distanceBetween(this.lastPoint, currentPoint);
    const angle = angleBetween(this.lastPoint, currentPoint);

    p5.imageMode(p5.CENTER);
    for (let i = 0; i < dist; i+=5) {
      const x = this.lastPoint.x + (Math.sin(angle) * i) - 25;
      const y = this.lastPoint.y + (Math.cos(angle) * i) - 25;
      
      this.buffer.image(
        this.spriteMedia,
        (x+20)/this.GAME_SCALE, 
        (y+20)/this.GAME_SCALE,
        this.brushData.wDraw,
        this.brushData.hDraw,
        this.brushData.x,
        this.brushData.y,
        this.brushData.w,
        this.brushData.h
      );
    }
      
    this.renderBuffer();

    this.lastPoint = currentPoint;
  }

  renderUserPlay() {
    if (this.isDrawing) this.drawBrush();
    // if (this.isTheFirstPhase) this.setupPixels();
  }

  renderScene() {
    if (this.isRenderingShape) { 
      this.renderBackground();
      this.renderShape();
      this.setupPixels()
    }
    
    if (this.isRedrawingBuffer) this.redrawBuffer();
  }

  renderBuffer() {
    const { p5, buffer } = this;
    
    p5.clear();
    p5.imageMode(p5.CORNER);
    p5.image(buffer, 0, 0, this.GAME_WIDTH, this.GAME_HEIGHT);
  }

  redrawBuffer() {
    this.renderBuffer();
    this.isRedrawingBuffer = false;
  }

  renderShape() {
    const { p5, buffer } = this;
    const size = Math.min(this.BASE_WIDTH, this.BASE_HEIGHT) * 0.9;

    buffer.imageMode(p5.CENTER);
    buffer.image(
      this.shape, 
      this.BASE_WIDTH/2,
      this.BASE_HEIGHT/2,
      size, size
    );

    this.isRenderingShape = false;
  }

  renderBackground() {
    const { p5, buffer } = this;

    buffer.imageMode(p5.CORNER);
    buffer.image(
      this.spriteMedia,
      this.bgGame.xDraw,
      this.bgGame.yDraw,
      this.bgGame.w,
      this.bgGame.h,
      this.bgGame.x,
      this.bgGame.y,
      this.bgGame.w,
      this.bgGame.h
    );
  }

  updateShape() {
    this.buffer.clear();
    this.p5.clear();
    this.isRenderingShape = true;
    this.isRedrawingBuffer = true;
  }

  setupPixels() {
    this.completeShapePixels = this.getBlackPixels();
    this.isTheFirstPhase = false;
    console.log('totalBlackPixels:', this.completeShapePixels);
  }

  validatePixels() {
    const blackPixels = this.getBlackPixels();
    const progress = 100 - Math.ceil(blackPixels/this.completeShapePixels*100);
    console.log({progress});

    if (progress >= this.minProgress) {
      this.updateShape();
      this.pubsub.publish('completedDraw');
    }
  }

  getBlackPixels() {
    const { buffer } = this;

    buffer.loadPixels();
    return getPixelCounter(buffer.pixels, ({r, g, b, a}) => r+g+b === 0 && a === 255);
  }
  //#endregion Custom methods
};