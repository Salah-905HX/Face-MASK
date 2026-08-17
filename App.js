
import {
    FaceLandmarker,
    FilesetResolver
} from "@mediapipe/tasks-vision";

import {
    Input,
    Output,
    Conversion,
    ALL_FORMATS,
    BlobSource,
    BufferTarget,
    WebMOutputFormat
} from "mediabunny";


// ==========================================
// ELEMENTS
// ==========================================

const input =
    document.getElementById("videoInput");

const video =
    document.getElementById("video");

const canvas =
    document.getElementById("canvas");

const ctx =
    canvas.getContext("2d");

const status =
    document.getElementById("status");

const chooseBtn =
    document.getElementById("chooseBtn");

const uploadContainer =
    document.getElementById("uploadContainer");

const videoSection =
    document.getElementById("videoSection");

const changeBtn =
    document.getElementById("changeBtn");

const fileName =
    document.getElementById("fileName");

const videoResolution =
    document.getElementById("videoResolution");

const processBtn =
    document.getElementById("processBtn");

const processing =
    document.getElementById("processing");

const progressBar =
    document.getElementById("progressBar");

const progressPercent =
    document.getElementById("progressText");

const result =
    document.getElementById("result");

const downloadBtn =
    document.getElementById("downloadBtn");

const againBtn =
    document.getElementById("againBtn");

const cancelBtn =
    document.getElementById("cancelBtn");


// ==========================================
// ERROR POPUP
// ==========================================

const errorModal =
    document.getElementById("errorModal");

const errorMessage =
    document.getElementById("errorMessage");

const errorCloseBtn =
    document.getElementById("errorCloseBtn");


// ==========================================
// VARIABLES
// ==========================================

let faceLandmarker = null;

let selectedFile = null;

let videoURL = null;

let outputURL = null;

let processingVideo = false;

let currentConversion = null;

let cancelRequested = false;


// ==========================================
// FACE OVAL
// ==========================================

const FACE_OVAL = [
    10, 338, 297, 332, 284, 251, 389, 356,
    454, 323, 361, 288, 397, 365, 379, 378,
    400, 377, 152, 148, 176, 149, 150, 136,
    172, 58, 132, 93, 234, 127, 162, 21,
    54, 103, 67, 109
];


// ==========================================
// SHOW ERROR
// ==========================================

function showError(message) {

    if (errorMessage) {
        errorMessage.textContent = message;
    }

    if (errorModal) {
        errorModal.classList.remove("hidden");
    }
}


// ==========================================
// HIDE ERROR
// ==========================================

function hideError() {

    if (errorModal) {
        errorModal.classList.add("hidden");
    }
}


if (errorCloseBtn) {

    errorCloseBtn.addEventListener(
        "click",
        hideError
    );

}


// ==========================================
// CREATE MEDIAPIPE LANDMARKER
// ==========================================

async function createVideoLandmarker() {

    const vision =
        await FilesetResolver.forVisionTasks(
            "/wasm"
        );


    return await FaceLandmarker.createFromOptions(
        vision,
        {
            baseOptions: {

                modelAssetPath:
                    "/face_landmarker.task"
            },

            runningMode:
                "VIDEO",

            numFaces:
                1,

            minFaceDetectionConfidence:
                0.5,

            minFacePresenceConfidence:
                0.5,

            minTrackingConfidence:
                0.5
        }
    );
}


// ==========================================
// RESET MEDIAPIPE
// ==========================================

async function resetFaceLandmarker() {

    console.log(
        "Resetting MediaPipe..."
    );


    // Close old instance
    if (faceLandmarker) {

        try {

            if (
                typeof faceLandmarker.close ===
                "function"
            ) {

                await faceLandmarker.close();

            }

        } catch (error) {

            console.warn(
                "Could not close old MediaPipe instance:",
                error
            );

        }

    }


    faceLandmarker =
        null;


    // Create completely fresh instance
    faceLandmarker =
        await createVideoLandmarker();


    console.log(
        "MediaPipe landmarker reset."
    );
}


// ==========================================
// LOAD MEDIAPIPE
// ==========================================

async function initializeMediaPipe() {

    try {

        status.textContent =
            "Loading MediaPipe...";


        faceLandmarker =
            await createVideoLandmarker();


        console.log(
            "MediaPipe loaded!"
        );


        status.textContent =
            "Ready. Select a video.";


    } catch (error) {

        console.error(
            "MediaPipe error:",
            error
        );


        showError(
            "The AI model could not be loaded. Please refresh the page and try again."
        );
    }
}


// ==========================================
// CHOOSE VIDEO
// ==========================================

chooseBtn.addEventListener(
    "click",
    (event) => {

        event.stopPropagation();

        input.click();

    }
);


// ==========================================
// UPLOAD AREA
// ==========================================

uploadContainer.addEventListener(
    "click",
    (event) => {

        if (
            event.target.closest(
                "#chooseBtn"
            )
        ) {
            return;
        }

        input.click();

    }
);


// ==========================================
// CHANGE VIDEO
// ==========================================

changeBtn.addEventListener(
    "click",
    () => {

        if (processingVideo) {

            showError(
                "Please cancel the current processing first."
            );

            return;
        }

        input.click();

    }
);


// ==========================================
// VIDEO SELECTED
// ==========================================

input.addEventListener(
    "change",
    async () => {

        const file =
            input.files[0];


        if (!file) {
            return;
        }


        // Don't allow a new file during processing
        if (processingVideo) {

            input.value = "";

            showError(
                "Please cancel the current processing first."
            );

            return;
        }


        selectedFile =
            file;


        console.log(
            "Selected video:",
            file.name
        );


        hideError();


        // Reset MediaPipe state
        try {

            await resetFaceLandmarker();

        } catch (error) {

            console.error(
                "Could not reset MediaPipe:",
                error
            );

        }


        // Stop old video
        video.pause();


        // Remove old video URL
        if (videoURL) {

            URL.revokeObjectURL(
                videoURL
            );

            videoURL =
                null;
        }


        // Remove old output
        if (outputURL) {

            URL.revokeObjectURL(
                outputURL
            );

            outputURL =
                null;
        }


        // Create new video URL
        videoURL =
            URL.createObjectURL(
                file
            );


        video.src =
            videoURL;


        video.load();


        // File info
        fileName.textContent =
            file.name;


        // Show video section
        uploadContainer.classList.add(
            "hidden"
        );


        videoSection.classList.remove(
            "hidden"
        );


        // Hide processing/result
        processing.classList.add(
            "hidden"
        );


        result.classList.add(
            "hidden"
        );


        processBtn.disabled =
            false;


        processBtn.textContent =
            "Process Video";


        status.textContent =
            "Video ready. Click Process Video.";

    }
);


// ==========================================
// VIDEO METADATA
// ==========================================

video.addEventListener(
    "loadedmetadata",
    () => {

        console.log(
            "Video:",
            video.videoWidth,
            "x",
            video.videoHeight
        );


        console.log(
            "Duration:",
            video.duration
        );


        canvas.width =
            video.videoWidth;


        canvas.height =
            video.videoHeight;


        videoResolution.textContent =
            `${video.videoWidth} × ${video.videoHeight}`;


        status.textContent =
            "Video ready. Click Process Video.";

    }
);


// ==========================================
// SEEK VIDEO
// ==========================================

function seekVideo(time) {

    return new Promise(
        resolve => {

            const target =
                Math.max(
                    0,
                    Math.min(
                        time,
                        Math.max(
                            0,
                            video.duration - 0.001
                        )
                    )
                );


            if (
                Math.abs(
                    video.currentTime -
                    target
                ) < 0.01
            ) {

                resolve();

                return;
            }


            let finished =
                false;


            const finish =
                () => {

                    if (finished) {
                        return;
                    }


                    finished =
                        true;


                    clearTimeout(
                        timeoutId
                    );


                    video.removeEventListener(
                        "seeked",
                        onSeeked
                    );


                    resolve();

                };


            const onSeeked =
                () => {

                    finish();

                };


            const timeoutId =
                setTimeout(
                    () => {

                        console.warn(
                            "Seek timeout:",
                            target,
                            "actual:",
                            video.currentTime
                        );


                        finish();

                    },
                    2000
                );


            video.addEventListener(
                "seeked",
                onSeeked
            );


            video.currentTime =
                target;

        }
    );
}


// ==========================================
// CHECK FIRST 5 SECONDS
// ==========================================

async function checkForFaceInFirstFiveSeconds() {

    const duration =
        video.duration;


    if (
        !Number.isFinite(duration) ||
        duration <= 0
    ) {

        return false;
    }


    if (!faceLandmarker) {

        return false;
    }


    if (
        typeof video.requestVideoFrameCallback !==
        "function"
    ) {

        console.error(
            "requestVideoFrameCallback is not supported."
        );

        return false;
    }


    const checkUntil =
        Math.min(
            5,
            duration
        );


    let finished =
        false;


    return new Promise(
        async (resolve) => {

            const finish =
                (result) => {

                    if (finished) {
                        return;
                    }


                    finished =
                        true;


                    video.pause();


                    resolve(result);

                };


            const processFrame =
                (
                    now,
                    metadata
                ) => {

                    if (finished) {
                        return;
                    }


                    const currentTime =
                        metadata.mediaTime;


                    try {

                        const timestampMs =
                            Math.max(
                                1,
                                Math.round(
                                    currentTime *
                                    1000
                                )
                            );


                        const results =
                            faceLandmarker.detectForVideo(
                                video,
                                timestampMs
                            );


                        const count =
                            results.faceLandmarks
                                ? results.faceLandmarks.length
                                : 0;


                        console.log(
                            "Face check:",
                            currentTime,
                            "Landmarks:",
                            count
                        );


                        if (
                            count > 0
                        ) {

                            console.log(
                                "FACE FOUND IN FIRST 5 SECONDS"
                            );


                            finish(true);

                            return;
                        }


                    } catch (error) {

                        console.error(
                            "Face check detection error:",
                            error
                        );


                        finish(false);

                        return;
                    }


                    if (
                        currentTime >=
                        checkUntil
                    ) {

                        console.log(
                            "NO FACE FOUND IN FIRST 5 SECONDS"
                        );


                        finish(false);

                        return;
                    }


                    video.requestVideoFrameCallback(
                        processFrame
                    );

                };


            try {

                video.pause();


                video.currentTime =
                    0;


                await new Promise(
                    resolveSeek => {

                        const onSeeked =
                            () => {

                                video.removeEventListener(
                                    "seeked",
                                    onSeeked
                                );


                                resolveSeek();

                            };


                        video.addEventListener(
                            "seeked",
                            onSeeked
                        );

                    }
                );


                await video.play();


                video.requestVideoFrameCallback(
                    processFrame
                );


            } catch (error) {

                console.error(
                    "Face pre-check failed:",
                    error
                );


                finish(false);

            }

        }
    );
}


// ==========================================
// CANCEL PROCESSING
// ==========================================

cancelBtn.addEventListener(
    "click",
    async () => {

        if (!processingVideo) {
            return;
        }


        cancelRequested =
            true;


        cancelBtn.disabled =
            true;


        cancelBtn.textContent =
            "Canceling...";


        status.textContent =
            "Canceling processing...";


        // Cancel Mediabunny conversion
        if (currentConversion) {

            try {

                await currentConversion.cancel();

            } catch (error) {

                console.warn(
                    "Conversion cancel error:",
                    error
                );

            }
        }


        // ======================================
        // RESET MEDIAPIPE
        // ======================================

        try {

            if (faceLandmarker) {

                if (
                    typeof faceLandmarker.close ===
                    "function"
                ) {

                    await faceLandmarker.close();

                }

            }

        } catch (error) {

            console.warn(
                "Could not close MediaPipe:",
                error
            );

        }


        faceLandmarker =
            null;


        // ======================================
        // CLEAR VIDEO
        // ======================================

        video.pause();


        video.removeAttribute(
            "src"
        );


        video.load();


        input.value =
            "";


        selectedFile =
            null;


        // ======================================
        // RELEASE URLS
        // ======================================

        if (videoURL) {

            URL.revokeObjectURL(
                videoURL
            );

            videoURL =
                null;
        }


        if (outputURL) {

            URL.revokeObjectURL(
                outputURL
            );

            outputURL =
                null;
        }


        // ======================================
        // CLEAR CANVAS
        // ======================================

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        // ======================================
        // RESET UI
        // ======================================

        processing.classList.add(
            "hidden"
        );


        result.classList.add(
            "hidden"
        );


        videoSection.classList.add(
            "hidden"
        );


        uploadContainer.classList.remove(
            "hidden"
        );


        progressBar.style.width =
            "0%";


        progressPercent.textContent =
            "0%";


        status.textContent =
            "Select a video.";


        processingVideo =
            false;


        currentConversion =
            null;


        cancelRequested =
            false;


        cancelBtn.disabled =
            false;


        cancelBtn.textContent =
            "Cancel & delete video";


        // ======================================
        // LOAD FRESH MEDIAPIPE
        // ======================================

        try {

            faceLandmarker =
                await createVideoLandmarker();


            console.log(
                "Fresh MediaPipe ready after cancellation."
            );


        } catch (error) {

            console.error(
                "Could not reload MediaPipe:",
                error
            );


            showError(
                "The AI model could not be restarted. Please refresh the page."
            );

        }

    }
);


// ==========================================
// PROCESS BUTTON
// ==========================================

processBtn.addEventListener(
    "click",
    async () => {

        if (!selectedFile) {

            showError(
                "Please select a video first."
            );

            return;
        }


        if (!faceLandmarker) {

            showError(
                "The AI model is still loading. Please wait a moment and try again."
            );

            return;
        }


        if (processingVideo) {
            return;
        }


        await processVideo();

    }
);


// ==========================================
// PROCESS VIDEO
// ==========================================

async function processVideo() {

    if (processingVideo) {
        return;
    }


    processingVideo =
        true;


    cancelRequested =
        false;


    currentConversion =
        null;


    cancelBtn.disabled =
        false;


    cancelBtn.textContent =
        "Cancel & delete video";


    // ======================================
    // RESET UI
    // ======================================

    processing.classList.add(
        "hidden"
    );


    result.classList.add(
        "hidden"
    );


    videoSection.classList.remove(
        "hidden"
    );


    progressBar.style.width =
        "0%";


    progressPercent.textContent =
        "0%";


    status.textContent =
        "Checking for a face...";


    // ======================================
    // RESET MEDIAPIPE BEFORE FACE CHECK
    // ======================================

    try {

        await resetFaceLandmarker();

    } catch (error) {

        console.error(
            "Could not reset MediaPipe before face check:",
            error
        );


        processingVideo =
            false;


        showError(
            "The face detection system could not be started."
        );


        return;
    }


    // ======================================
    // CHECK FIRST 5 SECONDS
    // ======================================

    const hasFace =
        await checkForFaceInFirstFiveSeconds();


    // If cancellation happened during the check,
    // stop immediately.
    if (cancelRequested) {

        processingVideo =
            false;

        return;
    }


    // ======================================
    // NO FACE
    // ======================================

    if (!hasFace) {

        processing.classList.add(
            "hidden"
        );


        videoSection.classList.remove(
            "hidden"
        );


        processingVideo =
            false;


        cancelBtn.disabled =
            false;


        cancelBtn.textContent =
            "Cancel & delete video";


        showError(
            "No face was detected in the first 5 seconds of this video."
        );


        return;
    }


    // ======================================
    // FACE FOUND
    // ======================================

    console.log(
        "Face confirmed."
    );


    status.textContent =
        "Face detected. Preparing processing...";


    // ======================================
    // RESET MEDIAPIPE AGAIN
    // ======================================
    // The face check has advanced the VIDEO
    // timestamps, so use a fresh instance
    // for actual processing.

    try {

        await resetFaceLandmarker();

    } catch (error) {

        console.error(
            "Could not reset MediaPipe after face check:",
            error
        );


        processingVideo =
            false;


        showError(
            "The face detection system could not be restarted."
        );


        return;
    }


    // ======================================
    // SHOW PROCESSING
    // ======================================

    processing.classList.remove(
        "hidden"
    );


    videoSection.classList.add(
        "hidden"
    );


    status.textContent =
        "Face detected. Processing video...";


    try {

        // ======================================
        // INPUT
        // ======================================

        const mediaInput =
            new Input({

                source:
                    new BlobSource(
                        selectedFile
                    ),

                formats:
                    ALL_FORMATS

            });


        // ======================================
        // OUTPUT
        // ======================================

        const target =
            new BufferTarget();


        const mediaOutput =
            new Output({

                format:
                    new WebMOutputFormat(),

                target:
                    target

            });


        // ======================================
        // CANVAS
        // ======================================

        let processingCanvas =
            null;

        let processingContext =
            null;


        // ======================================
        // CONVERSION
        // ======================================

        currentConversion =
            await Conversion.init({

                input:
                    mediaInput,

                output:
                    mediaOutput,

                video: {

                    forceTranscode:
                        true,


                    process:
                        async (sample) => {

                            // ------------------------------
                            // STOP IF CANCELED
                            // ------------------------------

                            if (
                                cancelRequested
                            ) {

                                throw new Error(
                                    "CANCELED_BY_USER"
                                );
                            }


                            // ------------------------------
                            // CREATE CANVAS
                            // ------------------------------

                            if (
                                !processingCanvas
                            ) {

                                processingCanvas =
                                    document.createElement(
                                        "canvas"
                                    );


                                processingCanvas.width =
                                    sample.displayWidth;


                                processingCanvas.height =
                                    sample.displayHeight;


                                processingContext =
                                    processingCanvas.getContext(
                                        "2d"
                                    );


                                canvas.width =
                                    sample.displayWidth;


                                canvas.height =
                                    sample.displayHeight;

                            }


                            // ------------------------------
                            // DRAW FRAME
                            // ------------------------------

                            processingContext.clearRect(
                                0,
                                0,
                                processingCanvas.width,
                                processingCanvas.height
                            );


                            sample.draw(
                                processingContext,
                                0,
                                0
                            );


                            // ------------------------------
                            // MEDIAPIPE
                            // ------------------------------

                            const timestampMs =
                                Math.max(
                                    1,
                                    Math.round(
                                        sample.timestamp *
                                        1000
                                    )
                                );


                            const results =
                                faceLandmarker.detectForVideo(
                                    processingCanvas,
                                    timestampMs
                                );


                            // ------------------------------
                            // DRAW MASK
                            // ------------------------------

                            if (
                                results.faceLandmarks &&
                                results.faceLandmarks.length > 0
                            ) {

                                const landmarks =
                                    results.faceLandmarks[0];


                                processingContext.beginPath();


                                FACE_OVAL.forEach(
                                    (
                                        index,
                                        i
                                    ) => {

                                        const point =
                                            landmarks[
                                                index
                                            ];


                                        const x =
                                            point.x *
                                            processingCanvas.width;


                                        const y =
                                            point.y *
                                            processingCanvas.height;


                                        if (
                                            i === 0
                                        ) {

                                            processingContext.moveTo(
                                                x,
                                                y
                                            );

                                        } else {

                                            processingContext.lineTo(
                                                x,
                                                y
                                            );

                                        }

                                    }
                                );


                                processingContext.closePath();


                                processingContext.fillStyle =
                                    "black";


                                processingContext.fill();

                            }


                            // ------------------------------
                            // PREVIEW
                            // ------------------------------

                            ctx.clearRect(
                                0,
                                0,
                                canvas.width,
                                canvas.height
                            );


                            ctx.drawImage(
                                processingCanvas,
                                0,
                                0
                            );


                            return processingCanvas;

                        }
                }
            });


        // ======================================
        // VALIDATE
        // ======================================

        if (
            !currentConversion.isValid
        ) {

            throw new Error(
                "CONVERSION_INVALID"
            );
        }


        // ======================================
        // PROGRESS
        // ======================================

        currentConversion.onProgress =
            (progress) => {

                if (cancelRequested) {
                    return;
                }


                const percent =
                    Math.min(
                        100,
                        Math.round(
                            progress * 100
                        )
                    );


                progressBar.style.width =
                    `${percent}%`;


                progressPercent.textContent =
                    `${percent}%`;

            };


        // ======================================
        // START
        // ======================================

        console.log(
            "Starting Mediabunny conversion..."
        );


        await currentConversion.execute();


        // ======================================
        // CANCELED
        // ======================================

        if (cancelRequested) {

            return;
        }


        // ======================================
        // OUTPUT
        // ======================================

        const buffer =
            target.buffer;


        if (!buffer) {

            throw new Error(
                "NO_OUTPUT"
            );
        }


        const outputBlob =
            new Blob(
                [buffer],
                {
                    type:
                        "video/webm"
                }
            );


        if (outputURL) {

            URL.revokeObjectURL(
                outputURL
            );

        }


        outputURL =
            URL.createObjectURL(
                outputBlob
            );


        // ======================================
        // DOWNLOAD
        // ======================================

        downloadBtn.href =
            outputURL;


        downloadBtn.download =
            "facemask_processed.webm";


        // ======================================
        // COMPLETE
        // ======================================

        progressBar.style.width =
            "100%";


        progressPercent.textContent =
            "100%";


        processing.classList.add(
            "hidden"
        );


        result.classList.remove(
            "hidden"
        );


        status.textContent =
            "Processing complete.";


        console.log(
            "Processing complete."
        );


    } catch (error) {

        console.error(
            "Processing error:",
            error
        );


        processing.classList.add(
            "hidden"
        );


        videoSection.classList.remove(
            "hidden"
        );


        // ======================================
        // CANCELED
        // ======================================

        if (
            cancelRequested ||
            error?.name ===
            "ConversionCanceledError" ||
            error?.message ===
            "CANCELED_BY_USER"
        ) {

            console.log(
                "Processing canceled."
            );


            return;
        }


        // ======================================
        // OUTPUT ERROR
        // ======================================

        if (
            error instanceof Error &&
            error.message ===
            "NO_OUTPUT"
        ) {

            showError(
                "The processed video could not be created. Please try again."
            );


        } else if (
            error instanceof Error &&
            error.message ===
            "CONVERSION_INVALID"
        ) {

            showError(
                "This video format cannot be processed by your browser."
            );


        } else {

            showError(
                "Something went wrong while processing your video. Please try again."
            );

        }


    } finally {

        processingVideo =
            false;


        currentConversion =
            null;


        cancelBtn.disabled =
            false;


        cancelBtn.textContent =
            "Cancel & delete video";

    }
}


// ==========================================
// PROCESS ANOTHER VIDEO
// ==========================================

againBtn.addEventListener(
    "click",
    async () => {

        if (processingVideo) {

            showError(
                "Please cancel the current processing first."
            );

            return;
        }


        // Reset MediaPipe before next video
        try {

            await resetFaceLandmarker();

        } catch (error) {

            console.warn(
                "Could not reset MediaPipe:",
                error
            );

        }


        result.classList.add(
            "hidden"
        );


        processing.classList.add(
            "hidden"
        );


        videoSection.classList.add(
            "hidden"
        );


        uploadContainer.classList.remove(
            "hidden"
        );


        input.value =
            "";


        selectedFile =
            null;


        video.pause();


        video.removeAttribute(
            "src"
        );


        video.load();


        if (videoURL) {

            URL.revokeObjectURL(
                videoURL
            );

            videoURL =
                null;
        }


        if (outputURL) {

            URL.revokeObjectURL(
                outputURL
            );

            outputURL =
                null;
        }


        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        progressBar.style.width =
            "0%";


        progressPercent.textContent =
            "0%";


        status.textContent =
            "Select a video.";

    }
);


// ==========================================
// START
// ==========================================

initializeMediaPipe();