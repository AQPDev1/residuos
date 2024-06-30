const URL = "./My_model/";
let model, webcam, maxPredictions;

async function init() {
    try {
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";
        
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        console.log("Modelo cargado exitosamente");
    } catch (error) {
        console.error("Error al cargar el modelo:", error);
    }
}

document.getElementById('startCamera').addEventListener('click', async function() {
    if (webcam) {
        webcam.stop();
    }
    
    const flip = true;
    webcam = new tmImage.Webcam(400, 400, flip);
    await webcam.setup();
    await webcam.play();
    document.getElementById('webcam').style.display = 'block';
    document.getElementById('webcam').srcObject = webcam.canvas.captureStream();

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