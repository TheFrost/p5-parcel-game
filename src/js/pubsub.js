/**
 * Code base from article:
 * https://joshbedo.github.io/JS-Design-Patterns/
 */

export default class PubSub {
  static handlers = [];

  constructor() {
    this.class = PubSub;
  }

  suscribe(event, handler, context) {
    if (typeof context === 'undefined') context = handler;
    this.class.handlers.push({
      event: event,
      handler: handler.bind(context)
    });
  }

  publish(event, args) {
    this.class.handlers.forEach(topic => {
      if (topic.event === event) {
        topic.handler(args);
      }
    });
  }
}