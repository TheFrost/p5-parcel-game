import Sketch from './sketch';
import { distanceBetween, angleBetween, getPixelCounter } from './utils';

export default class SketchPlayer extends Sketch {
  constructor(config) {
    super(config);

    this.completeShapePixels = 0;
    this.isTheFirstPhase = true;
    this.minProgress = 80;
    
    this.brushPos = null;
    this.lastPoint = null;

    // flags
    this.gameOver = false;
    this.isDrawing = false;
    this.isRenderingShape = true;
    this.isRedrawingBuffer = false;
    this.isReady = false;

    this.bindEvents();
  }

  //#region p5.js main methods
  preload() {
    this.shape = this.p5.loadImage('resources/shape.png');
  }

  setup() { this.isReady = true; }
  
  draw() {
    if (this.isRenderingShape) this.renderShape();

    if (this.isRedrawingBuffer) this.redrawBuffer();

    // if game over prevent play logic
    if (this.gameOver) return;

    if (this.isDrawing) this.drawBrush();

    if (this.isTheFirstPhase) this.setupPixels();

  }
  //#endregion p5.js main methods
  
  //#region p5.js event handlers
  pointerStart(e) {
    e.preventDefault();
    if (this.gameOver) return;
    this.isDrawing = true;
    this.lastPoint = { x: this.p5.mouseX, y: this.p5.mouseY };
  }

  pointerRelease() {
    if (this.gameOver) return;
    this.isDrawing = false;
    this.validatePixels();
  }

  resize() { this.isRedrawingBuffer = true; }
  //#endregion p5.js event handlers

  //#region Custom methods
  bindEvents() {
    this.pubsub.suscribe('gameOver', () => this.gameOver = true);
    this.pubsub.suscribe('uiSpriteReady', this.setupBrushData.bind(this));
  }

  setupBrushData({ spriteMedia, tilesetData }) {
    this.brush = spriteMedia;
    this.brushTileset = tilesetData.frames['brush-cheese.png'];

    this.setupBrush();
  }

  setupBrush() {
    const size = 10;

    this.brushData = {
      wDraw: size,
      hDraw: size,
      ...this.brushTileset.frame
    };
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
        this.brush,
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