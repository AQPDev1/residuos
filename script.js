const URL = "./My_model/";
let model, maxPredictions;
let video, canvas, ctx;

async function init() {
    try {
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";
        
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        console.log("Modelo cargado exitosamente");
        
        await setupCameras();
    } catch (error) {
        console.error("Error al cargar el modelo:", error);
    }
}

async function setupCameras() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    const cameraOptions = document.getElementById('cameraOptions');
    
    videoDevices.forEach((device, index) => {
        const button = document.createElement('button');
        button.textContent = device.label || `Cámara ${index + 1}`;
        button.value = device.deviceId;
        button.addEventListener('click', () => selectCamera(device.deviceId));
        cameraOptions.appendChild(button);
    });
}

function selectCamera(deviceId) {
    document.getElementById('cameraSelect').textContent = 'Cámara seleccionada';
    document.getElementById('cameraOptions').style.display = 'none';
    document.getElementById('startCamera').dataset.selectedCamera = deviceId;
}

document.getElementById('cameraSelect').addEventListener('click', () => {
    const cameraOptions = document.getElementById('cameraOptions');
    cameraOptions.style.display = cameraOptions.style.display === 'none' ? 'flex' : 'none';
});

document.getElementById('startCamera').addEventListener('click', async () => {
    const selectedCamera = document.getElementById('startCamera').dataset.selectedCamera;
    
    if (!selectedCamera) {
        alert('Por favor, selecciona una cámara primero.');
        return;
    }
    
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    
    const constraints = {
        video: { deviceId: selectedCamera ? { exact: selectedCamera } : undefined }
    };
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        video.style.display = 'block';
        document.getElementById('camera-controls').style.display = 'none';
        
        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            predictLoop();
        };
    } catch (error) {
        console.error('Error al acceder a la cámara:', error);
    }
});

async function predictLoop() {
    if (video.paused || video.ended) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    await predict(canvas);
    requestAnimationFrame(predictLoop);
}

async function predict(image) {
    try {
        if (!model) {
            console.log("El modelo aún no está cargado. Esperando...");
            return;
        }
        const prediction = await model.predict(image);
        
        let highestProbability = 0;
        let bestClass = "";
        
        for (let i = 0; i < maxPredictions; i++) {
            if (prediction[i].probability > highestProbability) {
                highestProbability = prediction[i].probability;
                bestClass = prediction[i].className;
            }
        }
        
        const resultElement = document.getElementById('result');
        resultElement.innerText = `Especie: ${bestClass}`;
        resultElement.style.display = 'block';
    } catch (error) {
        console.error("Error al realizar la predicción:", error);
        document.getElementById('result').innerText = "Error al realizar la predicción";
    }
}

init();