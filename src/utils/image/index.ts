// TODO: these utils only work in env where OffscreenCanvas is available

import { BlobOptions, Dimensions } from 'types/image';
import { enlargeBox } from 'utils/machineLearning';
import { Box } from '../../../thirdparty/face-api/classes';

export function resizeToSquare(img: ImageBitmap, size: number) {
    const scale = size / Math.max(img.height, img.width);
    const width = scale * img.width;
    const height = scale * img.height;
    const offscreen = new OffscreenCanvas(size, size);
    offscreen.getContext('2d').drawImage(img, 0, 0, width, height);

    return { image: offscreen.transferToImageBitmap(), width, height };
}

export function transform(
    imageBitmap: ImageBitmap,
    affineMat: number[][],
    outputWidth: number,
    outputHeight: number
) {
    const offscreen = new OffscreenCanvas(outputWidth, outputHeight);
    const context = offscreen.getContext('2d');

    context.transform(
        affineMat[0][0],
        affineMat[1][0],
        affineMat[0][1],
        affineMat[1][1],
        affineMat[0][2],
        affineMat[1][2]
    );

    context.drawImage(imageBitmap, 0, 0);
    return offscreen.transferToImageBitmap();
}

export function cropWithRotation(
    imageBitmap: ImageBitmap,
    cropBox: Box,
    rotation?: number,
    maxSize?: Dimensions,
    minSize?: Dimensions
) {
    const box = cropBox.round();

    const outputSize = { width: box.width, height: box.height };
    if (maxSize) {
        const minScale = Math.min(
            maxSize.width / box.width,
            maxSize.height / box.height
        );
        if (minScale < 1) {
            outputSize.width = Math.round(minScale * box.width);
            outputSize.height = Math.round(minScale * box.height);
        }
    }

    if (minSize) {
        const maxScale = Math.max(
            minSize.width / box.width,
            minSize.height / box.height
        );
        if (maxScale > 1) {
            outputSize.width = Math.round(maxScale * box.width);
            outputSize.height = Math.round(maxScale * box.height);
        }
    }

    // console.log({ imageBitmap, box, outputSize });

    const offscreen = new OffscreenCanvas(outputSize.width, outputSize.height);
    const offscreenCtx = offscreen.getContext('2d');
    offscreenCtx.imageSmoothingQuality = 'high';

    offscreenCtx.translate(outputSize.width / 2, outputSize.height / 2);
    rotation && offscreenCtx.rotate(rotation);

    const outputBox = new Box({
        x: -outputSize.width / 2,
        y: -outputSize.height / 2,
        width: outputSize.width,
        height: outputSize.height,
    });

    const enlargedBox = enlargeBox(box, 1.5);
    const enlargedOutputBox = enlargeBox(outputBox, 1.5);

    offscreenCtx.drawImage(
        imageBitmap,
        enlargedBox.x,
        enlargedBox.y,
        enlargedBox.width,
        enlargedBox.height,
        enlargedOutputBox.x,
        enlargedOutputBox.y,
        enlargedOutputBox.width,
        enlargedOutputBox.height
    );

    return offscreen.transferToImageBitmap();
}

export async function imageBitmapToBlob(
    imageBitmap: ImageBitmap,
    options?: BlobOptions
) {
    const offscreen = new OffscreenCanvas(
        imageBitmap.width,
        imageBitmap.height
    );
    offscreen.getContext('2d').drawImage(imageBitmap, 0, 0);

    return offscreen.convertToBlob(options);
}

export async function imageBitmapFromBlob(blob: Blob) {
    return createImageBitmap(blob);
}
