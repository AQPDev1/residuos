const URL = "./My_model/";
let model, webcam, maxPredictions;
let videoElement, cameraSelect;

async function init() {
    try {
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";
        
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        console.log("Modelo cargado exitosamente");

        videoElement = document.getElementById('webcam');
        cameraSelect = document.getElementById('cameraSelect');
        await getCameraDevices();
    } catch (error) {
        console.error("Error al cargar el modelo:", error);
    }
}

async function getCameraDevices() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        if (videoDevices.length > 0) {
            videoDevices.forEach(device => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || `Camera ${cameraSelect.length + 1}`;
                cameraSelect.appendChild(option);
            });
            cameraSelect.style.display = 'block';
        }
    } catch (error) {
        console.error('Error al obtener dispositivos:', error);
    }
}

document.getElementById('startCamera').addEventListener('click', async function() {
    if (webcam) {
        webcam.stop();
    }
    
    const selectedDeviceId = cameraSelect.value;
    const constraints = {
        video: {
            deviceId: selectedDeviceId ? {exact: selectedDeviceId} : undefined
        }
    };
    
    const flip = true;
    webcam = new tmImage.Webcam(400, 400, flip, constraints);
    await webcam.setup();
    await webcam.play();
    videoElement.style.display = 'block';
    videoElement.srcObject = webcam.canvas.captureStream();

    window.requestAnimationFrame(loop);
});

async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    if (!model) {
        console.log("El modelo aún no está cargado. Esperando...");
        await init();
    }
    
    const prediction = await model.predict(webcam.canvas);
    
    let highestProbability = 0;
    let bestClass = "";
    
    for (let i = 0; i < maxPredictions; i++) {
        if (prediction[i].probability > highestProbability) {
            highestProbability = prediction[i].probability;
            bestClass = prediction[i].className;
        }
    }
    
    const resultElement = document.getElementById('result');
    resultElement.innerText = `Clase: ${bestClass}`;
    resultElement.style.display = 'block';
}

init();