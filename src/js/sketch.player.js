import { Tween, Easing } from '@tweenjs/tween.js';
import Sketch from './sketch';
import store from './store';
import { 
  distanceBetween, 
  angleBetween, 
  getPixelCounter,
  isSmarthphone
} from './utils';

export default class SketchPlayer extends Sketch {
  constructor(config) {
    super(config);

    const isSmarthphoneFlag = isSmarthphone();

    this.brushSize = isSmarthphoneFlag ? 20 : 13;
    this.minProgress = isSmarthphoneFlag ? 90 : 80;
    this.completeShapePixels = 0;
    
    this.brushPos = null;
    this.lastPoint = null;

    this.shapeTransform = { scale: 0 };
    
    // flags
    this.gameOver = false;
    this.isDrawing = false;
    this.isTweeningShape = true;

    this.init();
  }

  //#region p5.js main methods
  preload() {
    const { p5 } = this;

    for (let i = 1; i < 4; i++) {
      this[`spriteLevel${i}`] = {
        sprite: p5.loadImage(`resources/shapes${i}.png`),
        data: p5.loadJSON(`resources/shapes${i}.json`)
      };
    }
  }
  
  draw() {
    const state = store.getState();

    switch(state.gameState) {
      case 'PLAY':
        if (this.isTweeningShape) this.renderScene(); // update draw on tweening transition
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
    if (state.gameState !== 'PLAY') return;

    this.isDrawing = true;
    this.lastPoint = { x: this.p5.mouseX, y: this.p5.mouseY };
  }

  pointerRelease() {
    const state = store.getState();
    if (state.gameState !== 'PLAY') return;

    this.isDrawing = false;
    this.validatePixels();
  }

  resize() { this.isRedrawingBuffer = true; }
  //#endregion p5.js event handlers

  //#region Custom methods
  init() {
    this.setupTweens();
    this.bindEvents();
  }

  bindEvents() {
    this.pubsub.suscribe('uiSpriteReady', this.setupAssets, this);
    this.pubsub.suscribe('startGame', this.onStartGame, this);
  }

  onStartGame() {
    this.setupShapesResources();
    this.updateShape();
    this.scaleInShapeTween.start();
  }

  setupShapesResources() {
    const state = store.getState();

    this.currentLevelKeys = Object.keys(this[`spriteLevel${state.level}`].data.frames);

    if (state.level === 1 || state.level === 2) {
      this.nextLevelKeys = Object.keys(this[`spriteLevel${state.level + 1}`].data.frames);
    }
  }

  setupTweens() {
    this.scaleInShapeTween = new Tween(this.shapeTransform)
      .to({ scale: 1 }, 300)
      .easing(Easing.Elastic.Out)
      .onComplete(() => {
        this.isTweeningShape = false;
        this.setupPixels();
      });
    
    this.updateShapeTween = new Tween(this.shapeTransform)
      .to({ scale: 0 }, 200)
      .easing(Easing.Quadratic.In)
      .onStart(() => this.isTweeningShape = true)
      .onComplete(this.updateShape.bind(this))
      .chain(this.scaleInShapeTween);
  }

  setupAssets({ spriteMedia, tilesetData }) {
    this.spriteMedia = spriteMedia;

    // brush
    const brushTileset = tilesetData.frames['brush-cheese.png'];
    this.brushData = {
      wDraw: this.brushSize,
      hDraw: this.brushSize,
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
  }

  renderScene() {
    this.renderBackground();
    this.renderShape();
    this.redrawBuffer();
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

    buffer.imageMode(p5.CENTER);
    buffer.image(
      this.shapeSprite, 
      this.BASE_WIDTH/2,
      this.BASE_HEIGHT/2,
      this.shapeData.w * 1.2 * this.shapeTransform.scale,
      this.shapeData.h * 1.2 * this.shapeTransform.scale,
      this.shapeData.x,
      this.shapeData.y,
      this.shapeData.w,
      this.shapeData.h
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
    if (this.currentLevelKeys.length === 0) {
      this.triggerFinishGame();
      return;
    }

    const { p5 } = this;
    const state = store.getState();
    let index, level;

    // if level 1 or 2 and combo 5 override index and shape query to next level
    if (
      (state.level === 1 || state.level === 2) 
      && state.comboCounter > 0 
      && state.comboCounter % 5 === 0
    ) {
      level = state.level + 1;
      index = Math.ceil(p5.random(this.nextLevelKeys.length - 1));
      this.shapeSprite = this[`spriteLevel${level}`].sprite;
      this.shapeData = this[`spriteLevel${level}`].data.frames[this.nextLevelKeys.pop(index)].frame;
    } else {
      level = state.level;
      index = Math.ceil(p5.random(this.currentLevelKeys.length - 1));
      this.shapeSprite = this[`spriteLevel${level}`].sprite;
      this.shapeData = this[`spriteLevel${level}`].data.frames[this.currentLevelKeys.splice(index, 1)].frame;
    }
  }

  setupPixels() {
    this.completeShapePixels = this.getBlackPixels();
  }

  validatePixels() {
    const blackPixels = this.getBlackPixels();
    const progress = 100 - Math.ceil(blackPixels/this.completeShapePixels*100);

    if (progress >= this.minProgress) {
      this.pubsub.publish('completedDraw');

      this.updateShapeTween.start();
      
      const state = store.getState();
      if (state.level === 1 || state.level === 2) {
        store.dispatch({type: 'UP_COMBO_COUNTER'});
      }
    }
  }

  getBlackPixels() {
    const { buffer } = this;

    buffer.loadPixels();
    return getPixelCounter(buffer.pixels, ({r, g, b, a}) => r+g+b < 30 && a > 0);
  }

  triggerFinishGame() {
    store.dispatch({type: 'CALC_FINAL_SCORE'});
    store.dispatch({
      type: 'SET_GAME_STATE',
      gameState: 'GAME_OVER'
    });

    const state = store.getState();
    this.pubsub.publish('gameOver', {
      log: 'log',
      score: state.finalScore
    });
  }
  //#endregion Custom methods
};