// EventBus.ts

interface EventHandler {
    (data: any): void;
}

class EventBus {
    private events: Map<string, EventHandler[]> = new Map();

    public subscribe(eventName: string, handler: EventHandler): void {
        const handlers = this.events.get(eventName) || [];
        handlers.push(handler);
        this.events.set(eventName, handlers);
    }

    public unsubscribe(eventName: string, handler: EventHandler): void {
        const handlers = this.events.get(eventName) || [];
        const index = handlers.indexOf(handler);
        if (index >= 0) {
            handlers.splice(index, 1);
            this.events.set(eventName, handlers);
        }
    }

    public publish(eventName: string, data: any): void {
        const handlers = this.events.get(eventName) || [];
        handlers.forEach((handler) => handler(data));
    }
}

export default EventBus;
