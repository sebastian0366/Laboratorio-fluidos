// Variables del DOM
let dSlider, bSlider, thetaSlider, wSlider, gammaSlider;
let dVal, bVal, thetaVal, wVal, gammaVal;
let frOut, cpOut, faOut;

// Constantes Físicas del modelo
const L = 2.5; // Longitud fija de la compuerta (según el modelo de LearnChemE)

function setup() {
    let canvasContainer = select('#canvas-container');
    let canvas = createCanvas(canvasContainer.width, canvasContainer.height);
    canvas.parent('canvas-container');

    dSlider = select('#d-slider');
    bSlider = select('#b-slider');
    thetaSlider = select('#theta-slider');
    wSlider = select('#w-slider');
    gammaSlider = select('#gamma-slider'); 

    dVal = select('#d-val');
    bVal = select('#b-val');
    thetaVal = select('#theta-val');
    wVal = select('#w-val');
    gammaVal = select('#gamma-val'); 

    frOut = select('#fr-out');
    cpOut = select('#cp-out');
    faOut = select('#fa-out');
}

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
    let D = parseFloat(dSlider.value());
    let b = parseFloat(bSlider.value());
    let theta_deg = parseFloat(thetaSlider.value());
    let W = parseFloat(wSlider.value()); 
    let gamma = parseFloat(gammaSlider.value()); 

    dVal.html(D.toFixed(2));
    bVal.html(b.toFixed(2));
    thetaVal.html(theta_deg);
    wVal.html(W.toFixed(1));
    gammaVal.html(gamma.toFixed(2));

    // 2. Cálculos Físicos (Compuerta Totalmente Sumergida - Bisagra Superior)
    let theta_rad = radians(theta_deg);
    
    // Profundidad desde la superficie hasta el centroide
    let h_c = D + (L / 2) * sin(theta_rad);
    let F_R = gamma * h_c * (L * b);
    
    // Momento del agua sobre la bisagra superior
    let M_water = gamma * b * (D * pow(L, 2) / 2 + sin(theta_rad) * pow(L, 3) / 3);
    
    let s_cp = 0;
    if (F_R > 0) {
        s_cp = M_water / F_R;
    }

    // Momento del peso (Ayuda a cerrar la compuerta)
    let M_weight = W * (L / 2) * cos(theta_rad);
    
    // Fuerza aplicada para mantenerla cerrada
    let F_app = (M_water - M_weight) / L;

    frOut.html(F_R.toFixed(2));
    cpOut.html(s_cp.toFixed(2));
    faOut.html(F_app.toFixed(2));

    // 3. Representación Gráfica
    let scaleFactor = min(width, height) / 7.5;
    
    // Coordenadas del tanque escalonado
    let originX = width * 0.45;  // Bisagra superior
    let originY = height * 0.45; 
    let topWallY = originY - 300;
    let leftWallX = width * 0.15;
    let floorY = height * 0.85;

    let endX = originX + L * cos(theta_rad) * scaleFactor;
    let endY = originY + L * sin(theta_rad) * scaleFactor;

    push();
    
    // --- ACHURADO DEL TANQUE ---
    stroke(80); 
    strokeWeight(4);
    // Muro Izquierdo, Piso y Muros derechos
    line(leftWallX, topWallY, leftWallX, floorY); 
    line(leftWallX, floorY, width * 0.95, floorY); 
    line(originX, topWallY, originX, originY); 
    line(endX, endY, endX, floorY); 

    stroke(130);
    strokeWeight(2);
    // Achurado muro izquierdo
    for (let y = topWallY; y < floorY; y += 20) {
        line(leftWallX, y, leftWallX - 20, y + 20);
    }
    // Achurado piso
    for (let x = leftWallX - 20; x < width * 0.95; x += 20) {
        line(x, floorY, x - 20, floorY + 20);
    }
    // Achurado muro sobre bisagra
    for (let y = topWallY; y < originY - 10; y += 20) {
        line(originX, y, originX + 20, y + 20);
    }
    // Achurado muro bajo compuerta
    for (let y = endY; y < floorY - 10; y += 20) {
        line(endX, y, endX + 20, y + 20);
    }

    // --- DIBUJO DEL AGUA ---
    let waterY = originY - D * scaleFactor;
    fill(52, 152, 219, 140);
    noStroke();
    beginShape();
    vertex(leftWallX, waterY);
    vertex(originX, waterY);
    vertex(originX, originY);
    vertex(endX, endY);
    vertex(endX, floorY);
    vertex(leftWallX, floorY);
    endShape(CLOSE);
    
    // Superficie del agua
    stroke(41, 128, 185);
    strokeWeight(2);
    line(leftWallX, waterY, originX, waterY);

    // --- COMPUERTA Y BISAGRA ---
    let b_offset_x = -b * 8; 
    let b_offset_y = -b * 12;
    
    fill(180);
    stroke(100);
    strokeWeight(1);
    quad(originX, originY, endX, endY, endX + b_offset_x, endY + b_offset_y, originX + b_offset_x, originY + b_offset_y);

    stroke(44, 62, 80);
    strokeWeight(6);
    line(originX, originY, endX, endY);

    fill(231, 76, 60);
    noStroke();
    circle(originX, originY, 14); // Bisagra arriba

    // --- VECTORES DE FUERZA Y ETIQUETAS ---

    // 1. Fuerza Aplicada (FA) - AHORA EN SENTIDO INVERSO
    if (abs(F_app) > 0.1) {
        let fa_scale = map(abs(F_app), 0, 100, 40, 100);
        fa_scale = constrain(fa_scale, 40, 100);
        
        // Se cambiaron los signos: Ahora inicia desde el exterior y apunta hacia adentro
        let faAngle = F_app >= 0 ? theta_rad - PI/2 : theta_rad + PI/2; 
        
        let faStartX = endX + fa_scale * cos(faAngle);
        let faStartY = endY + fa_scale * sin(faAngle);

        stroke(142, 68, 173);
        strokeWeight(3);
        line(faStartX, faStartY, endX, endY);
        
        push();
        translate(endX, endY);
        rotate(faAngle + PI); // La flecha ahora apunta en sentido de empuje
        fill(142, 68, 173);
        noStroke();
        triangle(0, 0, -12, -6, -12, 6);
        pop();

        // Ajusté un poco la posición de la etiqueta para que no se superponga
        drawLabel("FA", faStartX + 25, faStartY - 15, color(142, 68, 173));
    }

    // 2. Fuerza Resultante (FR)
    if (F_R > 0) {
        let cpX = originX + s_cp * cos(theta_rad) * scaleFactor;
        let cpY = originY + s_cp * sin(theta_rad) * scaleFactor;

        let force_scale = map(F_R, 0, 300, 40, 120);
        force_scale = constrain(force_scale, 40, 120);

        let normAngle = theta_rad - PI/2; 
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

    // 3. Peso de la Compuerta (W)
    let cmX = originX + (L/2) * cos(theta_rad) * scaleFactor;
    let cmY = originY + (L/2) * sin(theta_rad) * scaleFactor;
    
    if (W > 0) {
        stroke(39, 174, 96);
        strokeWeight(3);
        line(cmX, cmY, cmX, cmY + 60);
        push();
        translate(cmX, cmY + 60);
        rotate(PI/2); 
        fill(39, 174, 96);
        noStroke();
        triangle(0, 0, -10, -5, -10, 5);
        pop();

        drawLabel("W", cmX + 25, cmY + 35, color(39, 174, 96)); 
    }

    pop();
}

function windowResized() {
    let canvasContainer = select('#canvas-container');
    resizeCanvas(canvasContainer.width, canvasContainer.height);
}
