import {Emitter, Mesh, Object, WonderlandEngine} from '@wonderlandengine/api';
import {ARProvider} from './AR-provider.js';

/**
 * ARSession - master control for the AR session.
 * - registers dependencies (aka providers)
 * - handles global callbacks when AR session is started, ended
 * - can end any running AR session.
 */

class ARSession {
    private static engines: WeakMap<WonderlandEngine, ARSession> = new WeakMap();
    private engine: WonderlandEngine;

    /**
     * tracking provider is basically a lib which has some tracking capabilities, so device native webXR, 8th Wall, mind-ar-js, etc
     */
    private _trackingProviders: Array<ARProvider> = [];


    /**
     * Current running provider when AR session is running
     */
    private _currentTrackingProvider: ARProvider | null = null;

    public readonly onARSessionReady: Emitter = new Emitter();

    public readonly onSessionStarted: Emitter<[trackingProvider: ARProvider]> =
        new Emitter();

    public readonly onSessionEnded: Emitter<[trackingProvider: ARProvider]> = new Emitter();

    private _sceneHasLoaded = false;
    private _arSessionIsReady = false;

    public get arSessionReady() {
        return this._arSessionIsReady;
    }

    /**
     * @returns a shallow copy of all registered providers
     */
    public get registeredProviders(): ReadonlyArray<ARProvider> {        
        return [...this._trackingProviders];
    }

    public static getEngineSession(engine: WonderlandEngine) {
        if (!this.engines.has(engine)) {
            this.engines.set(engine, new ARSession(engine));
        }
        return this.engines.get(engine)!;
    }

    private constructor(engine: WonderlandEngine) {
        this.engine = engine;
    }

    /**
     * Registers tracking provider. Makes sure it is loaded
     * and hooks into providers onSessionStarted, onSessionLoaded events.
     */
    public async registerTrackingProvider(provider: ARProvider) {
        if (this._trackingProviders.includes(provider)) {
            return;
        }

        if (!this.engine.onSceneLoaded.has(this.onWLSceneLoaded)) {
            this.engine.onSceneLoaded.add(this.onWLSceneLoaded);
        }

        this._trackingProviders.push(provider);

        provider.onSessionStarted.add(this.onProviderSessionStarted);
        provider.onSessionEnded.add(this.onProviderSessionEnded);

        await provider.load();
        this.checkProviderLoadProgress();
    }

    /**
     * Loops through all providers to check if they are loaded.
     * If that's the case and the WL scene itself is loaded -
     * notify all the subscribers about the `onARSessionReady`
     */
    private checkProviderLoadProgress = () => {
        // prevent from calling onARSessionReady twice

        if (this._arSessionIsReady === true) {
            return;
        }

        if (
            this._trackingProviders.every((p) => p.loaded === true) &&
            this._sceneHasLoaded
        ) {
            console.log('WL snotifying session loaded', this.engine.canvas.id);
            this._arSessionIsReady = true;
            this.onARSessionReady.notify();
        }
    };

    private onWLSceneLoaded = () => {
        console.log('WL scene loaded', this.engine.canvas.id);
        this._sceneHasLoaded = true;
        this.checkProviderLoadProgress();
    };

    /**
     * stops a running AR session (if any)
     */
    public stopARSession() {
        if (this._currentTrackingProvider === null) {
            console.warn('No tracking session is active, nothing will happen');
        }

        this._currentTrackingProvider?.endSession();
        this._currentTrackingProvider = null;
    }

    /**
     * Some AR provider started AR session
     * @param provider to be passed into onSessionStarted callback function
     */
    private onProviderSessionStarted = (provider: ARProvider) => {
        console.log("onProviderSessionStarted", provider.engine.canvas.id);
        this._currentTrackingProvider = provider;
        this.onSessionStarted.notify(provider);
    };

    /**
     * Some AR ended AR session
     * @param provider to be passed into onSessionEnded callback function
     */
    private onProviderSessionEnded = (provider: ARProvider) => {
        console.log("onProviderSessionEnded", provider.engine.canvas.id);
        this.onSessionEnded.notify(provider);
    };
}

// (window as any).ARSession = ARSession;
export {ARSession};
