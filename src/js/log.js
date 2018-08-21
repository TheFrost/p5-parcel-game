const logger = {
  log: [],
  currentLog: {
    interactions: [],
    shapeName: ''
  },
  currentInteraction: {
    delta0: 0,
    delta1: 0
  },

  saveInteractionState() {
    this.currentLog.interactions.push({...this.currentInteraction});
  },
  saveLogState() {
    this.log.push({...this.currentLog});
    this.currentLog.interactions = [];
  }
};

export default logger;