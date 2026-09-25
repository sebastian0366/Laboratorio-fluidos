// Variables del DOM
let hSlider, bSlider, thetaSlider, wSlider, gammaSlider;
let hVal, bVal, thetaVal, wVal, gammaVal;
let frOut, cpOut, tOut;

// Constantes Físicas
const L = 4;       

function setup() {
    let canvasContainer = select('#canvas-container');
    let canvas = createCanvas(canvasContainer.width, canvasContainer.height);
    canvas.parent('canvas-container');

    hSlider = select('#h-slider');
    bSlider = select('#b-slider');
    thetaSlider = select('#theta-slider');
    wSlider = select('#w-slider');
    gammaSlider = select('#gamma-slider'); 

    hVal = select('#h-val');
    bVal = select('#b-val');
    thetaVal = select('#theta-val');
    wVal = select('#w-val');
    gammaVal = select('#gamma-val'); 

    frOut = select('#fr-out');
    cpOut = select('#cp-out');
    tOut = select('#t-out');
}

// Función auxiliar para dibujar etiquetas con fondo
function drawLabel(txt, x, y, col) {
    push();
    fill(255, 255, 255, 220); 
    noStroke();
    rectMode(CENTER);
    rect(x, y, textWidth(txt) + 12, 24, 4); 
    
    fill(col);
    textAlign(CENTER, CENTER);
    textSize(16);
    textStyle(BOLD);
    text(txt, x, y); 
    pop();
}

function draw() {
    background(248, 249, 250);

    // 1. Leer parámetros
    let h = parseFloat(hSlider.value());
    let b = parseFloat(bSlider.value());
    let theta_deg = parseFloat(thetaSlider.value());
    let W = parseFloat(wSlider.value()); 
    let gamma = parseFloat(gammaSlider.value()); 

    hVal.html(h.toFixed(2));
    bVal.html(b.toFixed(2));
    thetaVal.html(theta_deg);
    wVal.html(W.toFixed(1));
    gammaVal.html(gamma.toFixed(2));

    // 2. Cálculos Físicos
    let theta_rad = radians(theta_deg);
    let s_max = min(L, h / sin(theta_rad));
    
    let F_R = 0;
    let s_cp = 0; 
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
    let originX = width * 0.45;  
    let originY = height * 0.85; 
    let tankLeftX = width * 0.15; 

    push();
    
    // --- ACHURADO (Fondo y Pared Izquierda) ---
    // Líneas principales del tanque (Muros)
    stroke(80); // Color oscuro para los muros
    strokeWeight(4);
    line(tankLeftX - 30, originY, width * 0.95, originY); // Suelo (se extiende a la izquierda)
    line(tankLeftX, originY, tankLeftX, originY - 380); // Pared izquierda

    // Líneas diagonales (Achurado que indica que es sólido)
    stroke(120); // Gris intermedio para las diagonales
    strokeWeight(2);
    // Diagonales del suelo (Hacia abajo y la izquierda)
    for (let x = tankLeftX - 10; x < width * 0.95; x += 20) {
        line(x, originY, x - 20, originY + 20);
    }
    // Diagonales de la pared izquierda (Hacia abajo y la izquierda)
    for (let y = originY - 20; y > originY - 380; y -= 20) {
        line(tankLeftX, y, tankLeftX - 20, y + 20);
    }
    // ------------------------------------------

    // Agua
    if (h > 0) {
        fill(52, 152, 219, 140);
        noStroke();
        beginShape();
        vertex(originX, originY); 
        vertex(tankLeftX, originY); 
        
        let water_h_px = h * scaleFactor;
        vertex(tankLeftX, originY - water_h_px); 
        
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
        
        stroke(41, 128, 185);
        strokeWeight(2);
        line(tankLeftX, originY - h * scaleFactor, originX + min(s_max * cos(theta_rad), L * cos(theta_rad)) * scaleFactor, originY - h * scaleFactor);
    }

    let endX = originX + L * cos(theta_rad) * scaleFactor;
    let endY = originY - L * sin(theta_rad) * scaleFactor;

    let b_offset_x = b * 15; 
    let b_offset_y = -b * 8;
    
    fill(180);
    stroke(100);
    strokeWeight(1);
    quad(originX, originY, endX, endY, endX + b_offset_x, endY + b_offset_y, originX + b_offset_x, originY + b_offset_y);

    stroke(44, 62, 80);
    strokeWeight(6);
    line(originX, originY, endX, endY);

    fill(231, 76, 60);
    noStroke();
    circle(originX, originY, 14);

    // --- VECTORES Y SUS ETIQUETAS ---
    // 1. Tensión (T)
    stroke(127, 140, 141);
    strokeWeight(3);
    line(endX, endY, endX - 100, endY);
    drawLabel("T", endX - 50, endY - 20, color(50, 50, 50)); 

    // 2. Fuerza Resultante (FR)
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

        drawLabel("FR", fx - 25, fy - 20, color(231, 76, 60)); 
    }

    // 3. Vector de Peso (W)
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

    drawLabel("W", cmX + 25, cmY + 25, color(39, 174, 96)); 

    pop();
}

function windowResized() {
    let canvasContainer = select('#canvas-container');
    resizeCanvas(canvasContainer.width, canvasContainer.height);
}
