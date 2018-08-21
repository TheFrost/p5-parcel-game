import Sketch from './sketch';
import { pad, isMobile } from './utils';
import store from './store';
import { Tween, Easing } from '@tweenjs/tween.js';
import logger from './log';

export default class SketchUI extends Sketch {
  constructor(config) {
    super(config);

    // defaults
    this.config = {
      timeLimit: 60,
      mobilePointer: true,
      resourcesPath: 'resources',
      ...config
    };

    this.timeFactor = 0;
    this.currentSecond = 0;

    this.spriteLevels = [];
    this.isTweeningShape = false;

    this.init();
  }

  //#region p5.js main methods
  preload() {
    const { p5 } = this;

    this.spriteMedia = p5.loadImage(`${this.config.resourcesPath}cheetos-ui.png`);
    this.tilesetData = p5.loadJSON(`${this.config.resourcesPath}cheetos-ui.json`);

    // load sprite levels
    for (let i = 1; i < 4; i++) {
      this.spriteLevels.push({
        sprite: p5.loadImage(`${this.config.resourcesPath}shapes${i}.png`),
        data: p5.loadJSON(`${this.config.resourcesPath}shapes${i}.json`)
      });
    }
  }
  
  setup() { 
    const { p5, buffer } = this;
    
    p5.noCursor();
    buffer.textFont('Arial');

    this.setupAssets();
    this.publishResources();

    store.dispatch({type: 'SET_UI_SKETCH_READY'});
  }

  draw() {
    const state = store.getState();

    this.p5.clear();
    this.buffer.clear();

    switch(state.gameState) {
      case 'PLAY':
        if(!isMobile() || this.config.mobilePointer) this.renderPointer();
        this.renderUI();
        this.renderBuffer();
        this.validateTimer();
        return;
      case 'GAME_OVER':
        this.p5.cursor(this.p5.ARROW);
        this.renderUI();
        this.renderBuffer();
        return;
      default: return;
    }
  }
  //#endregion p5.js main methods

  //#region Custom methods
  init() {
    this.setupTweens();
    this.bindEvents();
  }

  setupTweens() {
    // cheese boom
    this.cheeseBoomTransform = { scale: 0.01 };

    this.cheeseBoomTween = new Tween(this.cheeseBoomTransform)
      .to({ scale: 3 }, 500)
      .easing(Easing.Quadratic.Out)
      .onStart(() => this.isTweeningShape = true)
      .onComplete(() => {
        this.cheeseBoomTransform.scale = 0.01;
        this.isTweeningShape = false;
      });

    // clock timeline ----------------------------
    this.clockTransform = { scale: 1 };
    
    const clockStep1 = new Tween(this.clockTransform)
    .to({ scale: 0.9 }, 80)
    .easing(Easing.Quadratic.Out);
    
    const clockStep2 = new Tween(this.clockTransform)
    .to({ scale: 0.95 }, 80)
    .easing(Easing.Quadratic.Out);
    
    const clockStep3 = new Tween(this.clockTransform)
    .to({ scale: 0.9 }, 80)
    .easing(Easing.Quadratic.Out);
    
    const clockStep4 = new Tween(this.clockTransform)
    .to({ scale: 1 }, 80)
    .easing(Easing.Quadratic.In);
    
    clockStep1.chain(clockStep2);
    clockStep2.chain(clockStep3);
    clockStep3.chain(clockStep4);
    
    this.clockPulseTween = clockStep1;
    
    // score pulse timeline ------------------------
    this.cheeseTransform = { scale: 1 };
    this.scorePulseTransform = { scale: 1 };
    
    const scorePulseSetep1 = new Tween(this.scorePulseTransform)
      .to({ scale: 1.2 }, 100)
      .easing(Easing.Quadratic.In);
    
    const scorePulseSetep2 = new Tween(this.scorePulseTransform)
      .to({ scale: 1 }, 100)
      .easing(Easing.Quadratic.Out);

    scorePulseSetep1.chain(scorePulseSetep2);

    this.scorePulseTween = scorePulseSetep1;
  }

  bindEvents() {
    this.pubsub.suscribe('completedDraw', this.onCompleteDraw, this);
    this.pubsub.suscribe('startGame', this.onStartGame, this);
    this.pubsub.suscribe('cheeseBoom', this.triggerCheeseBoom, this);
  }

  triggerCheeseBoom() {
    this.cheeseBoomTween.start();
  }

  onStartGame() {
    this.startTime = Date.now();
  }

  onCompleteDraw() {
    store.dispatch({type: 'UP_SCORE'});
    this.scorePulseTween.start();
  }

  publishResources() {
    const { spriteMedia, tilesetData, spriteLevels } = this;
    this.pubsub.publish('resourcesReady', { spriteMedia, tilesetData, spriteLevels });
  }

  setupAssets() {
    // cheese boom -----------------------------
    const cheeseBoom = this.tilesetData.frames['cheese-boom.png'];
    this.cheeseBoom = {
      xDraw: this.BASE_WIDTH/2,
      yDraw: this.BASE_HEIGHT/2,
      wDraw: cheeseBoom.frame.w,
      hDraw: cheeseBoom.frame.h,
      ...cheeseBoom.frame
    };

    // bar points -----------------------------
    const barPoints = this.tilesetData.frames['points-bar.png'];
    this.barPoints = {
      xDraw: this.BASE_WIDTH/2,
      yDraw: 63,
      wDraw: barPoints.frame.w,
      hDraw: barPoints.frame.h,
      ...barPoints.frame
    };

    // cheese icon points ---------------------
    const cheesePointsIcon = this.tilesetData.frames['cheese-points.png'];
    this.cheesePointsIcon = {
      xDraw: this.BASE_WIDTH/2 + 9,
      yDraw: 60,
      wDraw: cheesePointsIcon.frame.w,
      hDraw: cheesePointsIcon.frame.h,
      ...cheesePointsIcon.frame
    };

    // bar time empty -------------------------
    const barTimeEmpty = this.tilesetData.frames['time-bar.png'];
    this.timeBarEmpty = {
      xDraw: this.BASE_WIDTH/2,
      yDraw: this.BASE_HEIGHT - 63,
      wDraw: barTimeEmpty.frame.w,
      hDraw: barTimeEmpty.frame.h,
      ...barTimeEmpty.frame
    };

    // bar time full --------------------------
    const barTimeFull = this.tilesetData.frames['time-bar-full.png'];
    this.timeBarFull = {
      xDraw: this.BASE_WIDTH/2-barTimeFull.frame.w/2,
      yDraw: this.BASE_HEIGHT - 81,
      wDraw: barTimeFull.frame.w,
      hDraw: barTimeFull.frame.h,
      ...barTimeFull.frame
    };

    // timer clock ----------------------------
    const timerClock = this.tilesetData.frames['clock.png'];
    this.timerClock = {
      xDraw: this.timeBarFull.xDraw,
      yDraw: this.timeBarFull.yDraw + this.timeBarFull.hDraw/2 - 2,
      wDraw: timerClock.frame.w,
      hDraw: timerClock.frame.h,
      ...timerClock.frame
    };

    // chester hand
    const pointer = this.tilesetData.frames['hand-pointer.png'];
    this.pointer = {
      wDraw: pointer.frame.w,
      hDraw: pointer.frame.h,
      ...pointer.frame
    }
  }

  getTimeEllapsed() {
    return (Date.now() - this.startTime) / 1000;
  }

  validateTimer() {
    const ellapsed = (Date.now() - this.startTime) / 1000;
    const intEllapsed = Math.ceil(ellapsed);

    this.timeFactor = ellapsed / this.config.timeLimit;
    if (this.timeFactor > 1) this.triggerFinishGame();

    if (intEllapsed !== this.currentSecond) {
      this.clockPulseTween.start();
      this.currentSecond = intEllapsed;
    }
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

    this.windowResize();
  }

  renderUI() {
    this.renderCheeseBoom();
    this.renderBarPoints();
    this.renderTimeBar();
  }

  renderCheeseBoom() {
    const { buffer, p5 } = this;

    buffer.imageMode(buffer.CENTER);
    buffer.image(
      this.spriteMedia,
      this.cheeseBoom.xDraw,
      this.cheeseBoom.yDraw,
      this.cheeseBoom.wDraw * this.cheeseBoomTransform.scale,
      this.cheeseBoom.hDraw * this.cheeseBoomTransform.scale,
      this.cheeseBoom.x,
      this.cheeseBoom.y,
      this.cheeseBoom.w,
      this.cheeseBoom.h
    );
  }

  renderPointer() {
    const { buffer, p5 } = this;

    buffer.imageMode(buffer.CORNER);
    buffer.image(
      this.spriteMedia,
      (p5.mouseX-9)/this.GAME_SCALE,
      (p5.mouseY-10)/this.GAME_SCALE,
      this.pointer.wDraw,
      this.pointer.hDraw,
      this.pointer.x,
      this.pointer.y,
      this.pointer.w,
      this.pointer.h
    );
  }

  renderBarPoints() {
    const { buffer } = this;

    buffer.imageMode(buffer.CENTER);
    buffer.image(
      this.spriteMedia,
      this.barPoints.xDraw,
      this.barPoints.yDraw,
      this.barPoints.wDraw,
      this.barPoints.hDraw,
      this.barPoints.x,
      this.barPoints.y,
      this.barPoints.w,
      this.barPoints.h
    );

    buffer.imageMode(buffer.CENTER);
    buffer.image(
      this.spriteMedia,
      this.cheesePointsIcon.xDraw,
      this.cheesePointsIcon.yDraw,
      this.cheesePointsIcon.wDraw * this.scorePulseTransform.scale,
      this.cheesePointsIcon.hDraw * this.scorePulseTransform.scale,
      this.cheesePointsIcon.x,
      this.cheesePointsIcon.y,
      this.cheesePointsIcon.w,
      this.cheesePointsIcon.h
    );

    this.renderPointsInfo();
  }

  renderTimeBar() {
    const { buffer } = this;

    buffer.imageMode(buffer.CENTER);

    // time bar empty
    buffer.image(
      this.spriteMedia,
      this.timeBarEmpty.xDraw,
      this.timeBarEmpty.yDraw,
      this.timeBarEmpty.wDraw,
      this.timeBarEmpty.hDraw,
      this.timeBarEmpty.x,
      this.timeBarEmpty.y,
      this.timeBarEmpty.w,
      this.timeBarEmpty.h
    );

    // time bar full
    buffer.imageMode(buffer.CORNER);
    buffer.image(
      this.spriteMedia,
      this.timeBarFull.xDraw,
      this.timeBarFull.yDraw,
      this.timeBarFull.wDraw*this.timeFactor,
      this.timeBarFull.hDraw,
      this.timeBarFull.x,
      this.timeBarFull.y,
      this.timeBarFull.w*this.timeFactor,
      this.timeBarFull.h
    );

    // timer clock
    buffer.imageMode(buffer.CENTER);
    buffer.image(
      this.spriteMedia,
      this.timerClock.xDraw + this.timeFactor*this.timeBarEmpty.wDraw,
      this.timerClock.yDraw,
      this.timerClock.wDraw * this.clockTransform.scale,
      this.timerClock.hDraw * this.clockTransform.scale,
      this.timerClock.x,
      this.timerClock.y,
      this.timerClock.w,
      this.timerClock.h
    );
  }

  renderPointsInfo() {
    const { buffer } = this;

    // format
    buffer.fill(255);
    buffer.strokeWeight(2);
    buffer.stroke(255, 100, 0);
    buffer.textStyle(buffer.BOLD);

    this.renderPoints();
    this.renderMultiplier();
  }

  renderPoints() {
    const { buffer } = this;
    const state = store.getState();

    // format
    buffer.textSize(20*this.scorePulseTransform.scale);

    // points
    buffer.textAlign(buffer.CENTER);
    buffer.text(pad(state.score, 4), this.BASE_WIDTH/2 - this.barPoints.wDraw/4 + 5, 63);
  }

  renderMultiplier() {
    const { buffer } = this;
    const state = store.getState();

    // format
    buffer.textSize(20);

    // multiplier
    buffer.textAlign(buffer.RIGHT, buffer.CENTER);
    buffer.text(`x${state.level}`, this.BASE_WIDTH/2 + this.barPoints.wDraw/2 - this.barPoints.wDraw*0.15, 62);
  }

  renderBuffer() {
    const { p5, buffer } = this;

    p5.clear();
    p5.imageMode(p5.CORNER);
    p5.image(buffer, 0, 0, this.GAME_WIDTH, this.GAME_HEIGHT);
  }
  //#endregion Custom methods
};