/**
 * Created by bruenni on 25.10.15.
 */

import rx = require('rx');
import {Id} from "./entity";

    /**
     * All domain events inherits IDomainEvent
     */
    export interface IDomainEvent {
        /**
         * Name of group a event contains to, can be an aggregate root name (e.g. can be mapped to specific channels in rabbitmq)
         * Contains values like "message", "user"
         */
        context: string;

        /**
         * Name of the event
         */
        name: string;
    }

    /**
     * All domain events inherits IDomainEvent
     */
    export class DomainEventBase implements IDomainEvent {
        public get name():string {
            return this._name;
        }

        private _name:string;

        /**
         * Name of context a event contains to, can be an aggregate root name (e.g. can be mapped to specific channels in rabbitmq)
         * Contains values like "message", "user"
         */
        public get context():string {
            return this._context;
        }

        private _context:string = "";

        /**
         * Constructor
         * @param group
         */
        constructor(context:string, name:string) {
            this._context = context;
            this._name = name;
        }
    }

    /**
     * Fired after aggregate root was updated.
     * Clients can retrieve entity when they don'z have the current version
     * already
     */
    export class AggregateEvent extends DomainEventBase {
        public get id() {
            return this._id;
        }

        private _id:Id;

        public get version():string {
            return this._version;
        }

        private _version:string;

        /**
         * Constructor
         * @param group
         * @param id
         * @param version
         */
        constructor(context:string, name:string, id:Id, version:string) {
            super(context, name);
            this._version = version;
            this._id = id;
        }
    }

    /**
     * Event bus can be implemented by RabbitMQ e.g. to get distributed events.
     */
    export interface IDomainEventBus {
        /**
         * Publishes event to the bus.
         * @param event to publish.
         * @constructor
         */
        publish(event:IDomainEvent): void;

        /**
         * Subcribes for asynchronous event
         * @context: name of the context to listen for events. See IDomainEvent for property 'context'
         * @constructor
         */
        subscribe(group:string): rx.Observable<IDomainEvent>;
    }

    /**
     * Handler for handling events
     */
    export interface IEventHandler<TEvent extends IDomainEvent> {
        /**
         * Domain handler processing events.
         * @param event
         * @constructor
         */
        Handle(event:TEvent): TEvent[];
    }

/**
 * Implementation of IDomainEventBus
 */
export class DomainEventBusImpl implements IDomainEventBus {

    /**
     * js object where:
     * property: type
     * value: Observable<IDomainEvent>[]
     */
    private map:any = {}

    /**
     * Constructor
     */
    constructor() {
    }

    /**
     * fires subscribes obseravables.
     * @param event
     * @constructor
     */
    publish(event:IDomainEvent):void {
        var observables = this.map[event.context];
        if (observables !== undefined) {
            observables.forEach((observable:any, n:any, array:any) => {
                //// fire event for each observable subscribed.
                observable.onNext(event);
            });
        }
    }

    /**
     * registers observables.
     * @returns {null}
     * @constructor
     */
    subscribe(contextName:string):rx.Observable<IDomainEvent> {
        if (contextName === undefined) {
            throw new Error("groupName undefined");
        }

        var subject = new rx.ReplaySubject<IDomainEvent>();

        //// add when not already existing
        var observableList = this.map[contextName];
        if (observableList !== undefined) {
            observableList.push(subject);
        }
        else {
            this.map[contextName] = [subject];
        }

        return subject;
    }
}