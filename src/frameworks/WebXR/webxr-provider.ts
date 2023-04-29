import {WonderlandEngine} from '@wonderlandengine/api';
import {ARProvider} from '../../AR-provider.js';
import {ARSession} from '../../AR-session.js';

/**
 * ARProvider implementation for device native WebXR API
 */
class WebXRProvider extends ARProvider {
    private _xrSession: XRSession | null = null;
    get xrSession() {
        return this._xrSession;
    }

    static registerTrackingProviderWithARSession(engine: WonderlandEngine) {
        const provider = new WebXRProvider(engine);
        ARSession.getSessionForEngine(engine).registerTrackingProvider(provider);
        return provider;
    }

    private constructor(engine: WonderlandEngine) {
        super(engine);

        // Safeguard that we are not running inside the editor
        if (typeof document === 'undefined') {
            return;
        }

        engine.onXRSessionStart.add((session: XRSession) => {
            this._xrSession = session;
            this.onSessionStart.notify(this);
        });

        engine.onXRSessionEnd.add(() => {
            this.onSessionEnd.notify(this);
        });
    }

    async startSession(
        webxrRequiredFeatures: string[] = ['local'],
        webxrOptionalFeatures: string[] = ['local', 'hit-test']
    ) {
        this._engine.requestXRSession(
            'immersive-ar',
            webxrRequiredFeatures,
            webxrOptionalFeatures
        );
    }

    async endSession() {
        if (this._xrSession) {
            try {
                await this._xrSession.end();
            } catch {
                // Session was ended for some
            }
            this._xrSession = null;
        }
    }

    async load() {
        this.loaded = true;
        return Promise.resolve();
    }
}

export {WebXRProvider};