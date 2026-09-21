// Variables del DOM
let hSlider, bSlider, thetaSlider, wSlider, gammaSlider;
let hVal, bVal, thetaVal, wVal, gammaVal;
let frOut, cpOut, tOut;

// Constantes Físicas extraídas del modelo original de LearnChemE
const L = 2.0;       // Longitud total de la compuerta en metros

function setup() {
    let canvasContainer = select('#canvas-container');
    let canvas = createCanvas(canvasContainer.width, canvasContainer.height);
    canvas.parent('canvas-container');

    hSlider = select('#h-slider');
    bSlider = select('#b-slider');
    thetaSlider = select('#theta-slider');
    wSlider = select('#w-slider');
    gammaSlider = select('#gamma-slider'); // NUEVO

    hVal = select('#h-val');
    bVal = select('#b-val');
    thetaVal = select('#theta-val');
    wVal = select('#w-val');
    gammaVal = select('#gamma-val'); // NUEVO

    frOut = select('#fr-out');
    cpOut = select('#cp-out');
    tOut = select('#t-out');
}

function draw() {
    background(248, 249, 250);

    // 1. Leer parámetros
    let h = parseFloat(hSlider.value());
    let b = parseFloat(bSlider.value());
    let theta_deg = parseFloat(thetaSlider.value());
    let W = parseFloat(wSlider.value()); // kN
    let gamma = parseFloat(gammaSlider.value()); // kN/m^3

    hVal.html(h.toFixed(2));
    bVal.html(b.toFixed(2));
    thetaVal.html(theta_deg);
    wVal.html(W.toFixed(1));
    gammaVal.html(gamma.toFixed(2));

    // 2. Cálculos Físicos (Modelo exacto de bisagra inferior)
    let theta_rad = radians(theta_deg);
    
    // s_max: hasta dónde llega el agua a lo largo de la compuerta
    let s_max = min(L, h / sin(theta_rad));
    
    let F_R = 0;
    let s_cp = 0; // Centro de presión medido desde la bisagra
    let M_water = 0; 

    if (h > 0) {
        F_R = gamma * b * (h * s_max - 0.5 * s_max * s_max * sin(theta_rad));
        M_water = gamma * b * (h * 0.5 * s_max * s_max - (1/3) * pow(s_max, 3) * sin(theta_rad));
        
        if (F_R > 0) {
            s_cp = M_water / F_R;
        }
    }

    let M_weight = W * (L / 2) * cos(theta_rad);
    let Tension = (M_water + M_weight) / (L * sin(theta_rad));

    frOut.html(F_R.toFixed(2));
    cpOut.html(F_R > 0 ? s_cp.toFixed(2) : "0.00");
    tOut.html(Tension.toFixed(2));

    // 3. Representación Gráfica
    let scaleFactor = min(width, height) / 4.5;
    let originX = width * 0.45;  // Ubicación de la bisagra
    let originY = height * 0.85; // Nivel del piso
    let tankLeftX = width * 0.15; // Pared izquierda del tanque

    push();
    
    // Símbolos de Paredes (Achurado de Ingeniería)
    stroke(100);
    strokeWeight(3);
    line(tankLeftX, originY, width * 0.95, originY); // Línea del Suelo
    line(tankLeftX, originY, tankLeftX, originY - 350); // Línea de la Pared

    stroke(170);
    strokeWeight(1.5);
    // Achurado del Suelo
    for (let x = tankLeftX + 10; x < width * 0.95; x += 15) {
        line(x, originY, x - 10, originY + 15);
    }
    // Achurado de la Pared
    for (let y = originY - 10; y > originY - 350; y -= 15) {
        line(tankLeftX, y, tankLeftX - 15, y + 15);
    }

    // Dibujar Agua
    if (h > 0) {
        fill(52, 152, 219, 140);
        noStroke();
        beginShape();
        vertex(originX, originY); // Bisagra
        vertex(tankLeftX, originY); // Esquina tanque
        
        let water_h_px = h * scaleFactor;
        vertex(tankLeftX, originY - water_h_px); // Superficie lado izquierdo
        
        if (h <= L * sin(theta_rad)) {
            let hitX = originX + s_max * cos(theta_rad) * scaleFactor;
            vertex(hitX, originY - water_h_px); 
        } else {
            let gateTopX = originX + L * cos(theta_rad) * scaleFactor;
            let gateTopY = originY - L * sin(theta_rad) * scaleFactor;
            vertex(gateTopX, originY - water_h_px); 
            vertex(gateTopX, gateTopY);
        }
        endShape(CLOSE);
        
        // Línea de superficie superior
        stroke(41, 128, 185);
        strokeWeight(2);
        line(tankLeftX, originY - h * scaleFactor, originX + min(s_max * cos(theta_rad), L * cos(theta_rad)) * scaleFactor, originY - h * scaleFactor);
    }

    // Coordenadas de la compuerta
    let endX = originX + L * cos(theta_rad) * scaleFactor;
    let endY = originY - L * sin(theta_rad) * scaleFactor;

    // Efecto visual 3D
    let b_offset_x = b * 15; 
    let b_offset_y = -b * 8;
    
    fill(180);
    stroke(100);
    strokeWeight(1);
    quad(
        originX, originY,
        endX, endY,
        endX + b_offset_x, endY + b_offset_y,
        originX + b_offset_x, originY + b_offset_y
    );

    // Borde frontal
    stroke(44, 62, 80);
    strokeWeight(6);
    line(originX, originY, endX, endY);

    // Bisagra
    fill(231, 76, 60);
    noStroke();
    circle(originX, originY, 14);

    // Estilo de texto para las etiquetas (T, W, FR)
    textFont('sans-serif');
    textStyle(BOLD);

    // Cable y Tensión (T)
    stroke(127, 140, 141);
    strokeWeight(3);
    line(endX, endY, endX - 100, endY);
    
    fill(50);
    noStroke();
    textSize(18);
    text("T", endX - 110, endY - 8);

    // Fuerza Resultante (FR)
    if (F_R > 0) {
        let cpX = originX + s_cp * cos(theta_rad) * scaleFactor;
        let cpY = originY - s_cp * sin(theta_rad) * scaleFactor;

        let force_scale = map(F_R, 0, 150, 40, 120);
        force_scale = constrain(force_scale, 40, 120);

        let normAngle = -theta_rad + PI/2; 
        let fx = cpX - force_scale * cos(normAngle);
        let fy = cpY - force_scale * sin(normAngle);
        
        stroke(231, 76, 60);
        strokeWeight(3);
        line(fx, fy, cpX, cpY);
        
        push();
        translate(cpX, cpY);
        rotate(normAngle);
        fill(231, 76, 60);
        noStroke();
        triangle(0, 0, -12, -6, -12, 6);
        pop();

        fill(231, 76, 60);
        noStroke();
        textSize(18);
        text("FR", fx - 25, fy - 10);
    }

    // Vector de Peso (W)
    let cmX = originX + (L/2) * cos(theta_rad) * scaleFactor;
    let cmY = originY - (L/2) * sin(theta_rad) * scaleFactor;
    
    stroke(39, 174, 96);
    strokeWeight(3);
    line(cmX, cmY, cmX, cmY + 50);
    push();
    translate(cmX, cmY + 50);
    rotate(PI/2); 
    fill(39, 174, 96);
    noStroke();
    triangle(0, 0, -10, -5, -10, 5);
    pop();

    fill(39, 174, 96);
    noStroke();
    textSize(18);
    text("W", cmX + 15, cmY + 30);

    pop();
}

function windowResized() {
    let canvasContainer = select('#canvas-container');
    resizeCanvas(canvasContainer.width, canvasContainer.height);
}
