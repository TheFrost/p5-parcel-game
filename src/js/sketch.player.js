import { Tween, Easing } from '@tweenjs/tween.js';
import Sketch from './sketch';
import store from './store';
import logger from './log';
import { 
  distanceBetween, 
  angleBetween, 
  getPixelCounter,
  isSmarthphone
} from './utils';

export default class SketchPlayer extends Sketch {
  constructor(config) {
    super(config);

    // defaults
    this.config = {
      minLimitDrawDesk: 80,
      minLimitDrawMob: 90,
      brushSizeDesk: 13,
      brushSizeMob: 20,
      ...config
    };

    const isSmarthphoneFlag = isSmarthphone();

    const { 
      minLimitDrawDesk, 
      minLimitDrawMob,
      brushSizeDesk,
      brushSizeMob
    } = this.config;

    this.brushSize = isSmarthphoneFlag ? brushSizeMob : brushSizeDesk;
    this.minProgress = isSmarthphoneFlag ? minLimitDrawMob : minLimitDrawDesk;
    this.completeShapePixels = 0;
    
    this.brushPos = null;
    this.lastPoint = null;

    this.shapeTransform = { scale: 0 };
    
    // flags
    this.isDrawing = false;
    this.isTweeningShape = true;

    this.init();
  }
  
  draw() {
    const state = store.getState();

    switch(state.gameState) {
      case 'PLAY':
        if (this.isTweeningShape) this.renderScene(); // update draw on tweening transition
        this.renderUserPlay();
        return;
      case 'GAME_OVER':
        this.renderBuffer();
        return;
      default: return;
    }
  }
  //#endregion p5.js main methods
  
  //#region p5.js event handlers
  pointerStart(e) {
    const { p5 } = this;

    e.preventDefault();
    
    const state = store.getState();
    if (state.gameState !== 'PLAY') return;

    this.isDrawing = true;
    this.lastPoint = { x: p5.mouseX, y: p5.mouseY };

    logger.currentInteraction.x0 = this.lastPoint.x;
    logger.currentInteraction.y0 = this.lastPoint.y;
    logger.currentInteraction.delta0 = Date.now();
  }

  pointerRelease() {
    const { p5 } = this;
    const state = store.getState();
    if (state.gameState !== 'PLAY') return;
    
    logger.currentInteraction.x1 = p5.mouseX;
    logger.currentInteraction.y1 = p5.mouseY;
    logger.currentInteraction.delta1 = Date.now();
    logger.saveInteractionState();

    this.isDrawing = false;
    this.validatePixels();
  }

  resize() { this.renderBuffer(); }
  //#endregion p5.js event handlers

  //#region Custom methods
  init() {
    this.setupTweens();
    this.bindEvents();
  }

  bindEvents() {
    this.pubsub.suscribe('resourcesReady', this.setupAssets, this);
    this.pubsub.suscribe('startGame', this.onStartGame, this);
  }

  onStartGame() {
    this.setupSpriteLevelState();
    this.updateShape();
    this.scaleInShapeTween.start();
  }

  setupShapesResources(spriteLevels) {
    for (let i = 0; i < spriteLevels.length; i++) {
      this[`spriteLevel${i + 1}`] = {
        sprite: spriteLevels[i].sprite,
        data: spriteLevels[i].data
      };
    }
  }

  setupSpriteLevelState() {
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
      .onStart(() => this.pubsub.publish('cheeseBoom'))
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

  setupAssets({spriteMedia, tilesetData, spriteLevels}) {
    this.setupUIAssets(spriteMedia, tilesetData);
    this.setupShapesResources(spriteLevels);

    store.dispatch({type: 'SET_PLAYER_SKETCH_READY'});
  }

  setupUIAssets(spriteMedia, tilesetData) {
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
    this.renderBuffer();
  }

  renderBuffer() {
    const { p5, buffer } = this;
    
    p5.clear();
    p5.imageMode(p5.CORNER);
    p5.image(buffer, 0, 0, this.GAME_WIDTH, this.GAME_HEIGHT);
  }

  renderShape() {
    const { p5, buffer } = this;

    buffer.imageMode(p5.CENTER);
    buffer.image(
      this.shapeSprite, 
      this.BASE_WIDTH/2,
      this.BASE_HEIGHT/2,
      this.shapeData.w * this.shapeTransform.scale,
      this.shapeData.h * this.shapeTransform.scale,
      this.shapeData.x,
      this.shapeData.y,
      this.shapeData.w,
      this.shapeData.h
    );
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
    logger.currentLog.totalShapePixels = this.completeShapePixels;
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

      logger.saveLogState();
    }
  }

  getBlackPixels() {
    const { buffer } = this;

    buffer.loadPixels();
    return getPixelCounter(buffer.pixels, ({r, g, b, a}) => r+g+b === 0 && a === 255);
  }

  triggerFinishGame() {
    store.dispatch({type: 'CALC_FINAL_SCORE'});
    store.dispatch({
      type: 'SET_GAME_STATE',
      gameState: 'GAME_OVER'
    });

    const state = store.getState();
    this.pubsub.publish('gameOver', {
      log: logger.log,
      score: state.finalScore
    });
  }
  //#endregion Custom methods
};