import Sketch from './sketch';
import { pad } from './utils';

export default class SketchUI extends Sketch {
  constructor(config) {
    super(config);

    this.timer = config.timeLimit || 60; // in seconds
    this.startTime = Date.now();
    this.timeFactor = 0;

    this.score = 0;
    this.finalScore = 0;
    this.scorePerShape = 10;
    this.gameLevel = config.gameLevel;

    //flags
    this.isReady = false;
    this.gameOver = false;

    this.init();
  }

  //#region p5.js main methods
  preload() {
    this.spriteMedia = this.p5.loadImage('resources/cheetos-ui.png');
    this.tilesetData = this.p5.loadJSON('resources/cheetos-ui.json');
  }

  setup() { 
    this.setupAssets();
    this.publishResources();

    this.isReady = true;
  }

  draw() {
    if (!this.isReady) return;

    this.renderBackground();
    this.renderBarPoints();
    this.renderTimeBar();

    // validate time factor limit
    if (this.gameOver) return;
    this.timeFactor = this.getTimeFactor();
    if (this.timeFactor > 1) return this.triggerFinishGame();
  }

  resize() { this.setupAssets(); }
  //#endregion p5.js main methods

  //#region Custom methods
  init() {
    this.bindEvents();
  }

  bindEvents() {
    this.pubsub.suscribe('completedDraw', this.onCompletedDraw, this);
  }

  publishResources() {
    const { spriteMedia, tilesetData } = this;
    this.pubsub.publish('uiSpriteReady', { spriteMedia, tilesetData });
  }

  setupAssets() {
    // bg game --------------------------------
    const bgGame = this.tilesetData.frames['bg.jpg'];
    this.bgGame = {
      xDraw: 0,
      yDraw: 0,
      wDraw: bgGame.frame.w*this.GAME_SCALE,
      hDraw: bgGame.frame.h*this.GAME_SCALE,
      ...bgGame.frame
    };

    // bar points -----------------------------
    const barPoints = this.tilesetData.frames['points-bar.png'];
    this.barPoints = {
      xDraw: this.GAME_WIDTH/2,
      yDraw: 63*this.GAME_SCALE,
      wDraw: barPoints.frame.w*this.GAME_SCALE,
      hDraw: barPoints.frame.h*this.GAME_SCALE,
      ...barPoints.frame
    };

    // cheese icon points ---------------------
    const cheesePointsIcon = this.tilesetData.frames['cheese-points.png'];
    this.cheesePointsIcon = {
      xDraw: this.GAME_WIDTH/2 - 5,
      yDraw: 47*this.GAME_SCALE,
      wDraw: cheesePointsIcon.frame.w*this.GAME_SCALE,
      hDraw: cheesePointsIcon.frame.h*this.GAME_SCALE,
      ...cheesePointsIcon.frame
    };

    // bar time empty -------------------------
    const barTimeEmpty = this.tilesetData.frames['time-bar.png'];
    this.timeBarEmpty = {
      xDraw: this.GAME_WIDTH/2,
      yDraw: this.GAME_HEIGHT - 63*this.GAME_SCALE,
      wDraw: barTimeEmpty.frame.w*this.GAME_SCALE,
      hDraw: barTimeEmpty.frame.h*this.GAME_SCALE,
      ...barTimeEmpty.frame
    };

    // bar time full --------------------------
    const barTimeFull = this.tilesetData.frames['time-bar-full.png'];
    this.timeBarFull = {
      xDraw: this.GAME_WIDTH/2-barTimeFull.frame.w*this.GAME_SCALE/2,
      yDraw: this.GAME_HEIGHT - 81*this.GAME_SCALE,
      wDraw: barTimeFull.frame.w*this.GAME_SCALE,
      hDraw: barTimeFull.frame.h*this.GAME_SCALE,
      ...barTimeFull.frame
    };

    // timer clock ----------------------------
    const timerClock = this.tilesetData.frames['clock.png'];
    this.timerClock = {
      xDraw: this.timeBarFull.xDraw,
      yDraw: this.timeBarFull.yDraw + this.timeBarFull.hDraw/2,
      wDraw: timerClock.frame.w*this.GAME_SCALE,
      hDraw: timerClock.frame.h*this.GAME_SCALE,
      ...timerClock.frame
    };
  }

  onCompletedDraw() {
    this.score += this.scorePerShape;
    console.log('score:', this.score);
  }

  getTimeFactor() {
    return ((Date.now() - this.startTime) / 1000) / this.timer;
  }

  triggerFinishGame() {
    this.pubsub.publish('gameOver');
    this.gameOver = true;
    this.finalScore = this.score * this.gameLevel;
    console.log('multiplier:', this.gameLevel);
    console.log('finalScore:', this.finalScore);
  }

  renderBackground() {
    const { p5 } = this;

    p5.imageMode(p5.CORNER);
    p5.image(
      this.spriteMedia,
      this.bgGame.xDraw,
      this.bgGame.yDraw,
      this.bgGame.wDraw,
      this.bgGame.hDraw,
      this.bgGame.x,
      this.bgGame.y,
      this.bgGame.w,
      this.bgGame.h
    );
  }

  renderBarPoints() {
    const { p5 } = this;

    p5.imageMode(p5.CENTER);
    p5.image(
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

    p5.imageMode(p5.CORNER);
    p5.image(
      this.spriteMedia,
      this.cheesePointsIcon.xDraw,
      this.cheesePointsIcon.yDraw,
      this.cheesePointsIcon.wDraw,
      this.cheesePointsIcon.hDraw,
      this.cheesePointsIcon.x,
      this.cheesePointsIcon.y,
      this.cheesePointsIcon.w,
      this.cheesePointsIcon.h
    );

    this.renderPointsInfo();
  }

  renderTimeBar() {
    const { p5 } = this;

    p5.imageMode(p5.CENTER);

    // time bar empty
    p5.image(
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
    p5.imageMode(p5.CORNER);
    p5.image(
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
    p5.imageMode(p5.CENTER);
    p5.image(
      this.spriteMedia,
      this.timerClock.xDraw + this.timeFactor*this.timeBarEmpty.wDraw,
      this.timerClock.yDraw,
      this.timerClock.wDraw,
      this.timerClock.hDraw,
      this.timerClock.x,
      this.timerClock.y,
      this.timerClock.w,
      this.timerClock.h
    );
  }

  renderPointsInfo() {
    const { p5 } = this;

    // format
    p5.fill(255);
    p5.strokeWeight(2*this.GAME_SCALE);
    p5.stroke(255, 100, 0);
    p5.textSize(20*this.GAME_SCALE);
    p5.textStyle(p5.BOLD);

    // points
    p5.textAlign(p5.LEFT, p5.CENTER);
    p5.text(pad(this.score, 4), this.GAME_WIDTH/2 - this.barPoints.wDraw/2 + this.barPoints.wDraw*0.15, 61*this.GAME_SCALE);
    
    // multiplier
    p5.textAlign(p5.RIGHT, p5.CENTER);
    p5.text(`x${this.gameLevel}`, this.GAME_WIDTH/2 + this.barPoints.wDraw/2 - this.barPoints.wDraw*0.15, 61*this.GAME_SCALE);
  }
  //#endregion Custom methods
};