/**
 * class ImageTrackingExample
 *
 * A very basic image tracking example.
 * Moves the object of the component to tracked image position.
 */
import {Component, Object as WLEObject} from '@wonderlandengine/api';
import {property} from '@wonderlandengine/api/decorators.js';

import {ARSession, ARImageTrackingCamera} from '@wonderlandengine/8thwall-tracking';

export class ImageTrackingExample extends Component {
    static TypeName = 'image-tracking-example';

    /**
     * The ARImageTrackingCamera somewhere in the scene
     */
    @property.object()
    ARImageTrackingCamera!: WLEObject;

    /**
     * Image id from the 8th Wall platform
     */
    @property.string()
    imageId!: string;

    // allocate some arrays
    private _cachedPosition = new Array<number>(3);
    private _cachedRotation = new Array<number>(4);
    private _cachedScale = new Array<number>(3);

    start() {
        if (!this.ARImageTrackingCamera) {
            console.warn(
                `${this.object.name}/${this.type} requires a ${ARImageTrackingCamera.TypeName}`
            );
            return;
        }

        const camera = this.ARImageTrackingCamera.getComponent(ARImageTrackingCamera);

        if (!camera) {
            throw new Error(
                `${ARImageTrackingCamera.TypeName} was not found on ARImageTrackingCamera`
            );
        }

        camera.onImageFound.add(this.onImageFound);

        camera.onImageUpdate.add(this.onImageUpdated);

        camera.onImageLost.add((event: XR8ImageTrackedEvent) => {
            if (event.detail.name === this.imageId) {
                this.object.scalingWorld = [0, 0, 0];
            }
        });

        ARSession.getSessionForEngine(this.engine).onSessionEnd.add(() => {
            this.object.scalingWorld = [0, 0, 0];
        });

        this.object.scalingWorld = [0, 0, 0];
    }

    private onImageFound = (event: XR8ImageTrackedEvent) => {
        if (event.detail.name === this.imageId) {
            this.onImageUpdated(event);
        }
    };

    private onImageUpdated = (event: XR8ImageTrackedEvent) => {
        if (event.detail.name !== this.imageId) {
            return;
        }

        const {rotation, position, scale} = event.detail;

        this._cachedRotation[0] = rotation.x;
        this._cachedRotation[1] = rotation.y;
        this._cachedRotation[2] = rotation.z;
        this._cachedRotation[3] = rotation.w;

        this._cachedPosition[0] = position.x;
        this._cachedPosition[1] = position.y;
        this._cachedPosition[2] = position.z;

        this._cachedScale[0] = scale;
        this._cachedScale[1] = scale;
        this._cachedScale[2] = scale;

        this.object.rotationWorld.set(this._cachedRotation);
        this.object.setTranslationWorld(this._cachedPosition);
        this.object.scalingWorld = this._cachedScale;
    };
}