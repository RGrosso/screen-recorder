// Requires
const { desktopCapturer, remote } = require("electron");
const fs = require("fs");

const VIDEO_TYPE = "video/webm; codecs=vp9";

// Global state
let mediaRecorder; // MediaRecorder instance to capture footage
const recordedChunks = [];

// Buttons
const videoElement = document.querySelector("video");
const stopBtn = document.getElementById("stopBtn");
const videoSelectBtn = document.getElementById("videoSelectBtn");
const startBtn = document.getElementById("startBtn");

// Set on clicks
startBtn.onclick = e => {
    mediaRecorder.start();
    startBtn.classList.add("is-danger");
    startBtn.innerText = "Recording";
};

stopBtn.onclick = e => {
    mediaRecorder.stop();
    startBtn.classList.remove("is-danger");
    startBtn.innerText = "Start";
};

videoSelectBtn.onclick = getVideoSources;

/**
 * Get the available video sources
 */
async function getVideoSources() {
    const inputSources = await desktopCapturer.getSources({
        types: ["window", "screen"]
    });

    const videoOptionsMenu = remote.Menu.buildFromTemplate(
        inputSources.map(src => {
            return {
                label: src.name,
                click: () => selectSource(src)
            };
        })
    );

    videoOptionsMenu.popup();
}

/**
 * Change the videoSource window to record
 */
async function selectSource(src) {
    videoSelectBtn.innerText = src.name;

    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: "desktop",
                chromeMediaSourceId: src.id
            }
        }
    };

    // Create a Stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Preview the source in a video element
    videoElement.srcObject = stream;
    videoElement.play();

    // Create the Media Recorder
    const options = { mimeType: VIDEO_TYPE };
    mediaRecorder = new MediaRecorder(stream, options);

    // Register Event Handlers
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;
    // Updates the UI
}

/**
 * Captures all recorded chunks
 * @param {*} e
 */
function handleDataAvailable(e) {
    console.log("video data available");
    recordedChunks.push(e.data);
}

/**
 * Saves the video file on stop
 */
async function handleStop(e) {
    const blob = new Blob(recordedChunks, { type: VIDEO_TYPE });
    const buffer = Buffer.from(await blob.arrayBuffer());

    const { filePath } = await remote.dialog.showSaveDialog({
        buttonLabel: "Save video",
        defaultPath: `vid-${Date.now()}.webm`
    });

    if (filePath) {
        fs.writeFile(filePath, buffer, () => console.log("video saved successfully!"));
    }
}
