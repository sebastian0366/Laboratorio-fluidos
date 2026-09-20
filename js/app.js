// Variables del DOM
let hSlider, bSlider, thetaSlider, wSlider;
let hVal, bVal, thetaVal, wVal;
let frOut, cpOut, tOut;

// Constantes Físicas extraídas del modelo original de LearnChemE
const gamma = 9.807; // Peso específico del agua en kN/m^3
const L = 2.0;       // Longitud total de la compuerta en metros

function setup() {
    let canvasContainer = select('#canvas-container');
    let canvas = createCanvas(canvasContainer.width, canvasContainer.height);
    canvas.parent('canvas-container');

    hSlider = select('#h-slider');
    bSlider = select('#b-slider');
    thetaSlider = select('#theta-slider');
    wSlider = select('#w-slider');

    hVal = select('#h-val');
    bVal = select('#b-val');
    thetaVal = select('#theta-val');
    wVal = select('#w-val');

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

    hVal.html(h.toFixed(2));
    bVal.html(b.toFixed(2));
    thetaVal.html(theta_deg);
    wVal.html(W.toFixed(1));

    // 2. Cálculos Físicos (Modelo exacto de bisagra inferior)
    let theta_rad = radians(theta_deg);
    
    // s_max: hasta dónde llega el agua a lo largo de la compuerta (desde la bisagra)
    let s_max = min(L, h / sin(theta_rad));
    
    let F_R = 0;
    let s_cp = 0; // Centro de presión medido desde la bisagra
    let M_water = 0; // Momento generado por el agua

    if (h > 0) {
        // Fuerza Resultante integrando la presión
        F_R = gamma * b * (h * s_max - 0.5 * s_max * s_max * sin(theta_rad));
        
        // Momento de la fuerza del agua respecto a la bisagra
        M_water = gamma * b * (h * 0.5 * s_max * s_max - (1/3) * pow(s_max, 3) * sin(theta_rad));
        
        if (F_R > 0) {
            s_cp = M_water / F_R;
        }
    }

    // Momento del peso de la compuerta (actúa en L/2)
    let M_weight = W * (L / 2) * cos(theta_rad);

    // Tensión del cable (Cable horizontal conectado arriba tirando hacia la izquierda)
    // Suma de momentos: T * L * sin(theta) = M_water + M_weight
    let Tension = (M_water + M_weight) / (L * sin(theta_rad));

    // Actualizar pantalla
    frOut.html(F_R.toFixed(2));
    cpOut.html(F_R > 0 ? s_cp.toFixed(2) : "0.00");
    tOut.html(Tension.toFixed(2));

    // 3. Representación Gráfica (Adaptable y Responsive)
    let scaleFactor = min(width, height) / 4.5;
    let originX = width * 0.35; // Bisagra
    let originY = height * 0.85; 

    push();
    
    // Dibujar Agua
    if (h > 0) {
        fill(52, 152, 219, 140);
        noStroke();
        beginShape();
        vertex(originX, originY); // Punto en la bisagra
        vertex(0, originY); // Esquina inferior izquierda del tanque
        
        let water_h_px = h * scaleFactor;
        vertex(0, originY - water_h_px); // Superficie izquierda
        
        if (h <= L * sin(theta_rad)) {
            // Parcialmente sumergida
            let hitX = originX + s_max * cos(theta_rad) * scaleFactor;
            vertex(hitX, originY - water_h_px); // Punto de contacto con compuerta
        } else {
            // Totalmente sumergida (El agua rebasa la compuerta)
            let gateTopX = originX + L * cos(theta_rad) * scaleFactor;
            let gateTopY = originY - L * sin(theta_rad) * scaleFactor;
            vertex(gateTopX, originY - water_h_px); // Muro de contención virtual
            vertex(gateTopX, gateTopY);
        }
        endShape(CLOSE);
        
        // Línea de superficie
        stroke(41, 128, 185);
        strokeWeight(2);
        line(0, originY - h * scaleFactor, originX + min(s_max * cos(theta_rad), L * cos(theta_rad)) * scaleFactor, originY - h * scaleFactor);
    }

    // Coordenadas de la compuerta
    let endX = originX + L * cos(theta_rad) * scaleFactor;
    let endY = originY - L * sin(theta_rad) * scaleFactor;

    // Efecto visual 3D basado en 'b'
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

    // Borde frontal (Compuerta)
    stroke(44, 62, 80);
    strokeWeight(6);
    line(originX, originY, endX, endY);

    // Bisagra
    fill(231, 76, 60);
    noStroke();
    circle(originX, originY, 14);

    // Cable (Horizontal)
    stroke(127, 140, 141);
    strokeWeight(3);
    line(endX, endY, endX - 100, endY);
    fill(50);
    noStroke();
    textSize(14);
    text("T", endX - 115, endY + 4);

    // Fuerza Resultante (F_R)
    if (F_R > 0) {
        let cpX = originX + s_cp * cos(theta_rad) * scaleFactor;
        let cpY = originY - s_cp * sin(theta_rad) * scaleFactor;

        let force_scale = map(F_R, 0, 150, 25, 90);
        force_scale = constrain(force_scale, 25, 90);

        let normAngle = -theta_rad + PI/2; // Perpendicular empujando
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
    }

    // Vector de Peso (W)
    let cmX = originX + (L/2) * cos(theta_rad) * scaleFactor;
    let cmY = originY - (L/2) * sin(theta_rad) * scaleFactor;
    
    stroke(39, 174, 96);
    strokeWeight(3);
    line(cmX, cmY, cmX, cmY + 40);
    push();
    translate(cmX, cmY + 40);
    rotate(PI/2); // Hacia abajo
    fill(39, 174, 96);
    noStroke();
    triangle(0, 0, -10, -5, -10, 5);
    pop();

    pop();
}

function windowResized() {
    let canvasContainer = select('#canvas-container');
    resizeCanvas(canvasContainer.width, canvasContainer.height);
}
