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
        
        cameraSelect.innerHTML = '<option value="user">Cámara frontal</option>';
        cameraSelect.innerHTML += '<option value="environment">Cámara trasera</option>';
        
        console.log('Dispositivos de video disponibles:', videoDevices);
    } catch (error) {
        console.error('Error al obtener dispositivos:', error);
    }
}

document.getElementById('startCamera').addEventListener('click', async function() {
    if (webcam) {
        webcam.stop();
    }
    
    const selectedFacingMode = cameraSelect.value;
    console.log('Modo de cámara seleccionado:', selectedFacingMode);

    try {
        const constraints = {
            video: { facingMode: selectedFacingMode }
        };

        console.log('Intentando obtener acceso a la cámara con restricciones:', constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('Acceso a la cámara obtenido con éxito');

        videoElement.srcObject = stream;
        videoElement.style.display = 'block';

        const flip = selectedFacingMode === 'user';
        webcam = new tmImage.Webcam(400, 400, flip);
        await webcam.setup(constraints.video);
        await webcam.play();

        cameraSelect.style.display = 'none';
        document.getElementById('startCamera').style.display = 'none';
        window.requestAnimationFrame(loop);
    } catch (error) {
        console.error('Error detallado al iniciar la cámara:', error);
        alert(`Error al iniciar la cámara: ${error.name} - ${error.message}`);
    }
});

async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    if (!model) {
        console.log("El modelo aún no está cargado. Esperando...");
        return;
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

// Verificar permisos de cámara al cargar la página
async function checkCameraPermission() {
    try {
        await navigator.mediaDevices.getUserMedia({video: true});
        console.log('Permiso de cámara concedido');
    } catch (error) {
        console.log('Permiso de cámara no concedido:', error);
        alert('Esta aplicación necesita acceso a tu cámara. Por favor, concede el permiso cuando se te solicite.');
    }
}

// Llamar a las funciones de inicialización
init();
checkCameraPermission();
